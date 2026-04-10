/**
 * TeamRunner: Executes team member agents in parallel.
 *
 * Spawns each member as a fresh Agent (same pattern as createSubagentTool),
 * injects a `team_message` tool for inter-member communication, and collects
 * results via Promise.allSettled. Each member receives the same task and runs
 * independently in parallel; the runtime now exposes a shared task board for
 * manual coordination, but it still does not implement automatic task
 * decomposition or lead-member orchestration.
 */
import { Agent } from '@mastra/core/agent';
import { createTool } from '@mastra/core/tools';
import type { MastraLanguageModel } from '@mastra/core/agent';
import type { ToolsInput } from '@mastra/core/agent';
import { z } from 'zod/v4';

import type { HarnessTeam, HarnessTeamMember, TeamDispatchResult, TeamMemberResult, TeamEvent } from './types.js';
import { MessageBus } from './message-bus.js';
import { createTeamTaskBoardTools, TeamTaskBoard } from './team-task-board.js';

export interface TeamRunnerOptions {
  team: HarnessTeam;
  task: string;
  resolveModel: (modelId: string) => MastraLanguageModel;
  harnessTools?: ToolsInput;
  fallbackModelId?: string;
  emitEvent?: (event: TeamEvent) => void;
  abortSignal?: AbortSignal;
  requestContext?: any;
  workspace?: any;
}

/**
 * Create the `team_message` tool scoped to a specific member and bus.
 */
function createTeamMessageTool(memberId: string, bus: MessageBus, teamId: string, emitEvent?: (event: TeamEvent) => void) {
  return createTool({
    id: 'team_message',
    description: 'Send a message to another team member or broadcast to all members.',
    inputSchema: z.object({
      toMemberId: z.string().describe('ID of the receiving member, or "broadcast" to send to all'),
      content: z.string().describe('Message content'),
    }),
    execute: async ({ toMemberId, content }) => {
      const message = {
        fromMemberId: memberId,
        toMemberId,
        content,
        timestamp: Date.now(),
      };
      bus.send(message);
      emitEvent?.({
        type: 'team_message_sent',
        teamId,
        from: memberId,
        to: toMemberId,
        content,
      });
      return { content: `Message sent to ${toMemberId}` };
    },
  });
}

/**
 * Build merged tools for a team member (mirrors createSubagentTool pattern).
 *
 * When a member has no explicit `allowedHarnessTools`, ALL harness tools are
 * injected (safe default for dynamically-created members). When the list IS
 * specified, only the listed tools are merged.
 */
const WORKSPACE_TOOL_NAMES = new Set([
  'view',
  'write_file',
  'string_replace_lsp',
  'find_files',
  'delete_file',
  'file_stat',
  'mkdir',
  'search_content',
  'ast_smart_edit',
  'execute_command',
  'get_process_output',
  'kill_process',
  'lsp_inspect',
]);

const LEAD_PLANNER_TASK = `You are the lead member for this team run.

Before other members begin, use the shared team task board to:
1. break the task into concrete subtasks,
2. assign owners when appropriate,
3. record dependencies for blocked work,
4. message the team with execution guidance.

Do the planning and coordination work first, then summarize the board state and next steps.`;

const FOLLOWER_TASK_PREFIX = `A lead planner has already gone first for this team run.
Check the shared team task board before acting, claim tasks when you start them, update status as you work, and use team_message for coordination when needed.`;

function buildLeadPlanningTask(task: string): string {
  return `${task}\n\n${LEAD_PLANNER_TASK}`;
}

function buildLeadReplanTask(task: string, board: TeamTaskBoard): string {
  const openTasks = board.listOpenTasks();
  const readyTasks = board.listReadyUnassignedTasks();
  const blockedTasks = board.listBlockedTasks();
  const inProgressTasks = board.listInProgressTasks();
  const suggestedAssignees = board.getSuggestedAssignees().join(', ') || 'none';

  const boardSnapshot = openTasks.length === 0
    ? 'All shared tasks are marked done.'
    : openTasks
      .map(item => {
        const assignee = item.assignee ? ` @${item.assignee}` : '';
        const deps = item.dependsOn?.length ? ` deps:${item.dependsOn.join(',')}` : '';
        const notes = item.notes ? ` notes:${item.notes}` : '';
        return `- ${item.id} [${item.status}] ${item.title}${assignee}${deps}${notes}`;
      })
      .join('\n');

  return `${task}\n\nYou are the lead member returning for a follow-up coordination pass.
Inspect the shared team task board and only do coordination work needed to unblock or finish the run.
If work remains, create/adjust tasks, assign owners from [${suggestedAssignees}], clarify dependencies, and message the team with precise next steps.
If the board is effectively complete, summarize remaining risks and close out.

Board snapshot:
${boardSnapshot}

Open tasks: ${openTasks.length}
Ready but unassigned: ${readyTasks.length}
Blocked: ${blockedTasks.length}
In progress: ${inProgressTasks.length}`;
}

function buildFollowerTask(task: string, board: TeamTaskBoard, memberId: string): string {
  const openTasks = board.listOpenTasks();
  const readyForMember = board.listReadyTasksForMember(memberId);
  const suggestedTasks = openTasks.length === 0
    ? 'No open tasks are currently on the board. Check team messages, then help close gaps or report completion.'
    : openTasks
      .map(item => {
        const assignee = item.assignee ? ` @${item.assignee}` : '';
        return `- ${item.id} [${item.status}] ${item.title}${assignee}`;
      })
      .join('\n');

  const memberReadySummary = readyForMember.length === 0
    ? 'No ready tasks are currently assigned to you or unassigned.'
    : readyForMember.map(item => `- ${item.id} ${item.title}`).join('\n');

  return `${FOLLOWER_TASK_PREFIX}\n\nOriginal task:\n${task}\n\nCurrent open board items:\n${suggestedTasks}\n\nTasks you can pick up now:\n${memberReadySummary}`;
}

function shouldRunFollower(board: TeamTaskBoard, memberId: string): boolean {
  if (!board.hasOpenTasks()) {
    return false;
  }

  return board.listReadyTasksForMember(memberId).length > 0;
}

function shouldLeadReplan(board: TeamTaskBoard, remainingFollowerCount = 0): boolean {
  if (!board.hasOpenTasks()) {
    return false;
  }

  if (remainingFollowerCount > 0) {
    return true;
  }

  return board.needsLeadCoordination();
}

const MAX_LEAD_ITERATIONS = 5;

function sortFollowersByPriority(
  followers: Array<{ member: HarnessTeamMember; agent: Agent; error: null }>,
  board: TeamTaskBoard,
): Array<{ member: HarnessTeamMember; agent: Agent; error: null }> {
  return [...followers].sort((a, b) => {
    const aHasAssigned = board.hasAssignedReadyTasks(a.member.id);
    const bHasAssigned = board.hasAssignedReadyTasks(b.member.id);
    if (aHasAssigned && !bHasAssigned) return -1;
    if (!aHasAssigned && bHasAssigned) return 1;
    return 0;
  });
}

function buildMemberTools(
  member: HarnessTeamMember,
  bus: MessageBus,
  teamId: string,
  board: TeamTaskBoard,
  harnessTools?: ToolsInput,
  emitEvent?: (event: TeamEvent) => void,
): ToolsInput {
  const merged: ToolsInput = { ...member.tools };

  Object.assign(merged, createTeamTaskBoardTools(member.id, board));

  // Inject team_message tool
  merged['team_message'] = createTeamMessageTool(member.id, bus, teamId, emitEvent);

  // Merge harness tools
  if (harnessTools) {
    if (member.allowedHarnessTools) {
      // Explicit allow-list: only merge listed tools
      for (const toolId of member.allowedHarnessTools) {
        if (harnessTools[toolId] && !merged[toolId]) {
          merged[toolId] = harnessTools[toolId];
        }
      }
    } else {
      // No allow-list specified: merge ALL harness tools (dynamic members)
      for (const [toolId, tool] of Object.entries(harnessTools)) {
        if (!merged[toolId]) {
          merged[toolId] = tool;
        }
      }
    }
  }

  return merged;
}

/**
 * Run a team: spawn all members in parallel, collect results.
 */
export async function runTeam(opts: TeamRunnerOptions): Promise<TeamDispatchResult> {
  const {
    team,
    task,
    resolveModel,
    harnessTools,
    fallbackModelId,
    emitEvent,
    abortSignal,
    requestContext,
    workspace,
  } = opts;

  const bus = new MessageBus();
  const board = new TeamTaskBoard(team.id, emitEvent);
  board.registerMembers(team.members.map(member => member.id));

  emitEvent?.({ type: 'team_start', teamId: team.id, task, memberInfo: team.members.map(m => ({ id: m.id, name: m.name, modelId: m.defaultModelId })) });
  emitEvent?.({ type: 'team_task_board_updated', teamId: team.id, tasks: board.list() });

  // Limit concurrency if specified
  const maxConcurrency = team.maxConcurrency ?? team.members.length;

  // Build member agent definitions
  const memberEntries = team.members.map(member => {
    const modelId = member.defaultModelId ?? fallbackModelId;
    if (!modelId) {
      return { member, agent: null as Agent | null, tools: undefined as ToolsInput | undefined, error: `No model ID for member "${member.id}"` };
    }

    let model: MastraLanguageModel;
    try {
      model = resolveModel(modelId);
    } catch (err) {
      return {
        member,
        agent: null as Agent | null,
        tools: undefined as ToolsInput | undefined,
        error: `Failed to resolve model "${modelId}" for member "${member.id}": ${err instanceof Error ? err.message : String(err)}`,
      };
    }

    const memberTools = buildMemberTools(member, bus, team.id, board, harnessTools, emitEvent);

    const agent = new Agent({
      id: `team-${team.id}-member-${member.id}`,
      name: member.name,
      instructions: member.instructions,
      model,
      tools: memberTools,
      workspace,
    });

    return { member, agent, error: null };
  });

  // Check for setup errors
  const setupErrors = memberEntries.filter(e => e.error);
  if (setupErrors.length > 0) {
    const results: TeamMemberResult[] = setupErrors.map(e => ({
      memberId: e.member.id,
      result: e.error!,
      isError: true,
    }));
    emitEvent?.({ type: 'team_end', teamId: team.id, results: Object.fromEntries(results.map(r => [r.memberId, r.result])) });
    return { teamId: team.id, members: results, summary: results.map(r => `**${r.memberId}**: ERROR - ${r.result}`).join('\n') };
  }

  // Execute members in parallel (with concurrency limit via chunking)
  const validEntries = memberEntries.filter(e => e.agent) as Array<{
    member: HarnessTeamMember;
    agent: Agent;
    error: null;
  }>;

  const chunks: Array<typeof validEntries> = [];
  for (let i = 0; i < validEntries.length; i += maxConcurrency) {
    chunks.push(validEntries.slice(i, i + maxConcurrency));
  }

  async function executeMember(
    member: HarnessTeamMember,
    agent: Agent,
    memberTask: string,
  ): Promise<TeamMemberResult> {
    emitEvent?.({ type: 'team_member_start', teamId: team.id, memberId: member.id, name: member.name, modelId: member.defaultModelId ?? fallbackModelId });

    try {
      const allowedWs = member.allowedWorkspaceTools ? new Set(member.allowedWorkspaceTools) : undefined;

      const response = await agent.stream(memberTask, {
        maxSteps: member.maxSteps ?? 50,
        abortSignal,
        requireToolApproval: false,
        requestContext,
        prepareStep: allowedWs
          ? ({ tools }) => ({
              activeTools: Object.keys(tools ?? {}).filter(
                toolName => !WORKSPACE_TOOL_NAMES.has(toolName) || allowedWs.has(toolName),
              ),
            })
          : undefined,
      });

      let text = '';
      for await (const chunk of response.fullStream) {
        if (chunk.type === 'text-delta') {
          text += chunk.payload.text;
          emitEvent?.({ type: 'team_member_text_delta', teamId: team.id, memberId: member.id, textDelta: chunk.payload.text });
        } else if (chunk.type === 'tool-call') {
          emitEvent?.({ type: 'team_member_tool_call', teamId: team.id, memberId: member.id, toolName: chunk.payload.toolName, toolArgs: chunk.payload.args });
        } else if (chunk.type === 'tool-result') {
          emitEvent?.({ type: 'team_member_tool_result', teamId: team.id, memberId: member.id, toolName: chunk.payload.toolName, result: typeof chunk.payload.result === 'string' ? chunk.payload.result : JSON.stringify(chunk.payload.result), isError: false });
        }
      }

      const fullOutput = await response.getFullOutput();
      const resultText = fullOutput.text || text;
      const result = resultText || '(no output)';
      emitEvent?.({ type: 'team_member_end', teamId: team.id, memberId: member.id, result, isError: false });
      return { memberId: member.id, result, isError: false };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      emitEvent?.({ type: 'team_member_end', teamId: team.id, memberId: member.id, result: errorMsg, isError: true });
      return { memberId: member.id, result: errorMsg, isError: true };
    }
  }

  const allResults: TeamMemberResult[] = [];

  if (team.strategy === 'lead' && validEntries.length > 0) {
    const [leadEntry, ...memberEntries] = validEntries;
    allResults.push(await executeMember(leadEntry.member, leadEntry.agent, buildLeadPlanningTask(task)));

    const followerMaxConcurrency = Math.max(1, Math.min(maxConcurrency, memberEntries.length || 1));
    let remainingFollowers = [...memberEntries];
    let leadReplannedAfterFollowers = false;
    let leadIterations = 0;
    let previousOpenCount = -1;

    while (remainingFollowers.length > 0) {
      if (abortSignal?.aborted) break;

      const runnableFollowers = sortFollowersByPriority(
        remainingFollowers.filter(({ member }) => shouldRunFollower(board, member.id)),
        board,
      );

      if (runnableFollowers.length === 0) {
        if (shouldLeadReplan(board, remainingFollowers.length) && leadIterations < MAX_LEAD_ITERATIONS) {
          const openBefore = board.listOpenTasks().length;
          allResults.push(await executeMember(leadEntry.member, leadEntry.agent, buildLeadReplanTask(task, board)));
          leadIterations++;
          leadReplannedAfterFollowers = true;
          const openAfter = board.listOpenTasks().length;

          const newRunnable = remainingFollowers.filter(({ member }) => shouldRunFollower(board, member.id));
          if (newRunnable.length === 0 && openBefore === openAfter) {
            break;
          }
          if (openBefore === openAfter && openBefore === previousOpenCount) {
            break;
          }
          previousOpenCount = openBefore;
          continue;
        }
        break;
      }

      const runnableIds = new Set(runnableFollowers.slice(0, followerMaxConcurrency).map(({ member }) => member.id));
      const chunk = remainingFollowers.filter(({ member }) => runnableIds.has(member.id));
      remainingFollowers = remainingFollowers.filter(({ member }) => !runnableIds.has(member.id));

      const chunkResults = await Promise.allSettled(
        chunk.map(({ member, agent }) => executeMember(member, agent, buildFollowerTask(task, board, member.id))),
      );

      for (const r of chunkResults) {
        if (r.status === 'fulfilled') {
          allResults.push(r.value);
        } else {
          allResults.push({ memberId: 'unknown', result: r.reason?.message ?? 'Unknown error', isError: true });
        }
      }
    }

    if (shouldLeadReplan(board, remainingFollowers.length) && !abortSignal?.aborted && !leadReplannedAfterFollowers && leadIterations < MAX_LEAD_ITERATIONS) {
      allResults.push(await executeMember(leadEntry.member, leadEntry.agent, buildLeadReplanTask(task, board)));
    }
  } else {
    for (const chunk of chunks) {
      if (abortSignal?.aborted) break;

      const chunkResults = await Promise.allSettled(
        chunk.map(({ member, agent }) => executeMember(member, agent, task)),
      );

      for (const r of chunkResults) {
        if (r.status === 'fulfilled') {
          allResults.push(r.value);
        } else {
          allResults.push({ memberId: 'unknown', result: r.reason?.message ?? 'Unknown error', isError: true });
        }
      }
    }
  }

  // Cleanup
  bus.clear();

  const resultsMap = Object.fromEntries(allResults.map(r => [r.memberId, r.result]));
  emitEvent?.({ type: 'team_end', teamId: team.id, results: resultsMap });

  const summary = allResults
    .map(r => {
      const prefix = r.isError ? 'ERROR' : 'DONE';
      return `**${r.memberId}** [${prefix}]: ${r.result}`;
    })
    .join('\n\n---\n\n');

  return { teamId: team.id, members: allResults, summary };
}
