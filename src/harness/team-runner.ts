/**
 * TeamRunner: Orchestrates parallel execution of team member agents.
 *
 * Spawns each member as a fresh Agent (same pattern as createSubagentTool),
 * injects a `team_message` tool for inter-member communication, and collects
 * results via Promise.allSettled.
 */
import { Agent } from '@mastra/core/agent';
import { createTool } from '@mastra/core/tools';
import type { MastraLanguageModel } from '@mastra/core/agent';
import type { ToolsInput } from '@mastra/core/agent';
import { z } from 'zod/v4';

import type { HarnessTeam, HarnessTeamMember, TeamDispatchResult, TeamMemberResult, TeamEvent } from './types.js';
import { MessageBus } from './message-bus.js';
import { AuthStorage } from '../auth/storage.js';

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
function buildMemberTools(
  member: HarnessTeamMember,
  bus: MessageBus,
  teamId: string,
  harnessTools?: ToolsInput,
  emitEvent?: (event: TeamEvent) => void,
): ToolsInput {
  const merged: ToolsInput = { ...member.tools };

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

  emitEvent?.({ type: 'team_start', teamId: team.id, task, memberInfo: team.members.map(m => ({ id: m.id, name: m.name, modelId: m.defaultModelId })) });

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
      console.log(`[team-runner] Resolved model for member "${member.id}": modelId=${modelId}, modelType=${typeof model}`);
    } catch (err) {
      console.error(`[team-runner] Model resolution failed for member "${member.id}":`, err);
      return {
        member,
        agent: null as Agent | null,
        tools: undefined as ToolsInput | undefined,
        error: `Failed to resolve model "${modelId}" for member "${member.id}": ${err instanceof Error ? err.message : String(err)}`,
      };
    }

    const memberTools = buildMemberTools(member, bus, team.id, harnessTools, emitEvent);

    const agent = new Agent({
      id: `team-${team.id}-member-${member.id}`,
      name: member.name,
      instructions: member.instructions,
      model,
      tools: memberTools,
      workspace,
    });

    return { member, agent, tools: memberTools, error: null };
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
    tools: ToolsInput;
    error: null;
  }>;

  const chunks: Array<typeof validEntries> = [];
  for (let i = 0; i < validEntries.length; i += maxConcurrency) {
    chunks.push(validEntries.slice(i, i + maxConcurrency));
  }

  const allResults: TeamMemberResult[] = [];

  for (const chunk of chunks) {
    if (abortSignal?.aborted) break;

    const chunkResults = await Promise.allSettled(
      chunk.map(async ({ member, agent, tools: memberTools }) => {
        emitEvent?.({ type: 'team_member_start', teamId: team.id, memberId: member.id, name: member.name, modelId: member.defaultModelId ?? fallbackModelId });

        try {
          const allWorkspaceToolNames = workspace
            ? new Set(Object.keys({})) // workspace tools resolved at execution time
            : undefined;
          const allowedWs = member.allowedWorkspaceTools ? new Set(member.allowedWorkspaceTools) : undefined;

          const toolNames = Object.keys(memberTools);
          console.log(`[team-runner] Starting member "${member.id}" with tools=[${toolNames.join(',')}], maxSteps=${member.maxSteps ?? 50}`);

          // Diagnostic: check auth state before starting
          try {
            const diagStorage = new AuthStorage();
            diagStorage.reload();
            const diagCred = diagStorage.get('anthropic');
            console.log(`[team-runner] Auth diagnostic for "${member.id}": credType=${diagCred?.type}, hasCred=${!!diagCred}`);
            if (diagCred?.type === 'oauth') {
              const diagKey = await diagStorage.getApiKey('anthropic');
              console.log(`[team-runner] Auth diagnostic for "${member.id}": hasAccessToken=${!!diagKey}, keyLen=${diagKey?.length ?? 0}`);
            }
          } catch (diagErr) {
            console.error(`[team-runner] Auth diagnostic failed for "${member.id}":`, diagErr);
          }

          const response = await agent.stream(task, {
            maxSteps: member.maxSteps ?? 50,
            abortSignal,
            requireToolApproval: false,
            requestContext,
            prepareStep:
              allowedWs && allWorkspaceToolNames
                ? ({ tools }) => ({
                    activeTools: Object.keys(tools ?? {}).filter(
                      k => !allWorkspaceToolNames.has(k) || allowedWs.has(k),
                    ),
                  })
                : undefined,
          });

          let text = '';
          let chunkCount = 0;
          let toolCalls = 0;
          for await (const chunk of response.fullStream) {
            chunkCount++;
            if (chunk.type === 'text-delta') {
              text += chunk.payload.text;
              emitEvent?.({ type: 'team_member_text_delta', teamId: team.id, memberId: member.id, textDelta: chunk.payload.text });
            } else if (chunk.type === 'tool-call') {
              toolCalls++;
              emitEvent?.({ type: 'team_member_tool_call', teamId: team.id, memberId: member.id, toolName: chunk.payload.toolName, toolArgs: chunk.payload.args });
            } else if (chunk.type === 'tool-result') {
              emitEvent?.({ type: 'team_member_tool_result', teamId: team.id, memberId: member.id, toolName: chunk.payload.toolName, result: typeof chunk.payload.result === 'string' ? chunk.payload.result : JSON.stringify(chunk.payload.result), isError: false });
            }
          }

          // Use the full output API (same pattern as createSubagentTool)
          const fullOutput = await response.getFullOutput();
          const resultText = fullOutput.text || text;

          console.log(`[team-runner] Member "${member.id}" finished: chunks=${chunkCount}, toolCalls=${toolCalls}, textLen=${resultText.length}`);

          const result = resultText || '(no output)';
          emitEvent?.({ type: 'team_member_end', teamId: team.id, memberId: member.id, result, isError: false });
          return { memberId: member.id, result, isError: false } as TeamMemberResult;
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : String(err);
          const errorStack = err instanceof Error ? err.stack : undefined;
          console.error(`[team-runner] Member "${member.id}" execution error: ${errorMsg}`);
          console.error(`[team-runner] Member "${member.id}" stack:`, errorStack);
          emitEvent?.({ type: 'team_member_end', teamId: team.id, memberId: member.id, result: errorMsg, isError: true });
          return { memberId: member.id, result: errorMsg, isError: true } as TeamMemberResult;
        }
      }),
    );

    for (const r of chunkResults) {
      if (r.status === 'fulfilled') {
        allResults.push(r.value);
      } else {
        // Should not happen since we catch inside, but handle defensively
        allResults.push({ memberId: 'unknown', result: r.reason?.message ?? 'Unknown error', isError: true });
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
