/**
 * `team_dispatch` tool: lets the parent agent dispatch a task to a team
 * of parallel member agents and collect their results.
 */
import { createTool } from '@mastra/core/tools';
import type { MastraLanguageModel, ToolsInput } from '@mastra/core/agent';
import { z } from 'zod/v4';

import type { HarnessTeam, TeamEvent } from './types.js';
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
 * When called, it selects a team by ID and runs all members in parallel.
 */
export function createTeamDispatchTool(opts: CreateTeamDispatchToolOptions) {
  const { teams, resolveModel, harnessTools, fallbackModelId } = opts;
  const teamIds = teams.map(t => t.id);
  const teamDescriptions = teams.map(t => `- **${t.id}** (${t.name}): ${t.description}`).join('\n');

  return createTool({
    id: 'team_dispatch',
    description: `Dispatch a task to a team of parallel agents. Each team member works independently on the same task, then results are collected and returned.

Available teams:
${teamDescriptions}

Use this tool when:
- You want to run multiple agents in parallel on the same task
- Different perspectives or approaches are needed simultaneously
- You need specialized agents to coordinate via messaging`,
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

        return {
          content: result.summary,
          isError: result.members.some(m => m.isError),
        };
      } catch (err) {
        return {
          content: `Team dispatch failed: ${err instanceof Error ? err.message : String(err)}`,
          isError: true,
        };
      }
    },
  });
}
