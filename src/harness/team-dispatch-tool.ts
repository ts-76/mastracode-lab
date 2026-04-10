/**
 * `team_dispatch` tool: lets the parent agent dispatch the same task to a team
 * of parallel member agents and collect their results.
 */
import { createTool } from '@mastra/core/tools';
import type { MastraLanguageModel, ToolsInput } from '@mastra/core/agent';
import { z } from 'zod/v4';

import type { HarnessTeam, TeamDispatchResult, TeamEvent } from './types.js';
import type { ToolBag } from './team-create-tool.js';
import { runTeam } from './team-runner.js';

export interface CreateTeamDispatchToolOptions {
  teams: HarnessTeam[];
  resolveModel: (modelId: string) => MastraLanguageModel;
  /** Lazy tool bag — resolved at execution time. */
  harnessTools?: ToolBag;
  fallbackModelId?: string;
}

/**
 * Creates the `team_dispatch` harness tool.
 * When called, it selects a team by ID and runs members on the same task.
 * Current coordination includes shared message passing, a shared task board, and optional lead-first orchestration.
 */
function formatDispatchResponse(result: TeamDispatchResult) {
  const successCount = result.members.filter(member => !member.isError).length;
  const errorCount = result.members.length - successCount;
  const status = errorCount === 0
    ? 'success'
    : successCount === 0
      ? 'error'
      : 'partial_success';
  const statusLine = status === 'success'
    ? `Team completed successfully (${successCount}/${result.members.length} members succeeded).`
    : status === 'error'
      ? `Team failed (${errorCount}/${result.members.length} members errored).`
      : `Team completed with partial success (${successCount}/${result.members.length} members succeeded, ${errorCount} errored).`;

  return {
    content: `${statusLine}\n\n${result.summary}`,
    isError: status === 'error',
    teamId: result.teamId,
    status,
    successCount,
    errorCount,
    members: result.members,
  };
}

export function createTeamDispatchTool(opts: CreateTeamDispatchToolOptions) {
  const { teams, resolveModel, harnessTools, fallbackModelId } = opts;
  const teamIds = teams.map(t => t.id);
  const teamDescriptions = teams.map(t => `- **${t.id}** (${t.name}): ${t.description}`).join('\n');

  return createTool({
    id: 'team_dispatch',
    description: `Dispatch a task to a team of agents working on the same task. Members can coordinate through team messages plus a shared task board before final results are collected. Teams using strategy: 'lead' run the first member as the planner before the rest continue.

Available teams:
${teamDescriptions}

Use this tool when:
- You want multiple agents to explore the same task in parallel
- Different perspectives or approaches are needed simultaneously
- Lightweight message passing and a simple shared task board are enough
- A lead member going first is sufficient for planning/coordinating the rest of the team

Do not use this tool when:
- You need automatic dependency-aware task decomposition without the lead explicitly creating tasks
- You need rich multi-phase orchestration beyond a single lead-first planning pass
- You need durable workflow state beyond the in-memory shared board`,
    inputSchema: z.object({
      teamId: z.enum(teamIds as [string, ...string[]]).describe('ID of the team to dispatch'),
      task: z.string().describe('The task description. All team members receive the same task.'),
    }),
    execute: async ({ teamId, task }, context) => {
      const team = teams.find(t => t.id === teamId);
      if (!team) {
        return {
          content: `Unknown team: ${teamId}. Available teams: ${teamIds.join(', ')}`,
          isError: true,
        };
      }

      const harnessCtx = context?.requestContext?.get('harness') as Record<string, any> | undefined;
      const emitEvent = (event: TeamEvent) => {
        harnessCtx?.emitEvent?.(event);
      };

      // Resolve fallback model ID from parent agent's current model
      const currentModelId = harnessCtx?.state?.currentModelId ?? harnessCtx?.getState?.()?.currentModelId;
      const resolvedFallbackModelId = currentModelId ?? fallbackModelId;

      // Resolve tools lazily from the mutable bag
      const resolvedTools = harnessTools?.current;

      try {
        const result = await runTeam({
          team,
          task,
          resolveModel,
          harnessTools: resolvedTools,
          fallbackModelId: resolvedFallbackModelId,
          emitEvent,
          abortSignal: harnessCtx?.abortSignal,
          requestContext: context?.requestContext,
          workspace: context?.workspace,
        });

        return formatDispatchResponse(result);
      } catch (err) {
        return {
          content: `Team dispatch failed: ${err instanceof Error ? err.message : String(err)}`,
          isError: true,
        };
      }
    },
  });
}
