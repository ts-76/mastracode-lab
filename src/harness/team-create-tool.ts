/**
 * `team_create` tool: lets the AI agent dynamically create a team on-the-fly
 * and immediately dispatch it. This mirrors Claude Code's TeamCreateTool but
 * adapted to Mastra Code's programmatic harness pattern.
 *
 * Key difference from `team_dispatch`:
 *   - team_dispatch → dispatches a pre-defined team from config
 *   - team_create   → AI defines the team members inline and runs them
 */
import { createTool } from '@mastra/core/tools';
import type { MastraLanguageModel, ToolsInput } from '@mastra/core/agent';
import { z } from 'zod/v4';

import type { HarnessTeam, HarnessTeamMember, TeamEvent } from './types.js';
import { runTeam } from './team-runner.js';
import { autoAssignModels, classifyTier, tierLabel } from './model-tiers.js';

// --- Zod schema for dynamic member definition ---

const MemberSchema = z.object({
  id: z.string().describe('Unique member identifier (e.g. "researcher", "implementer")'),
  name: z.string().describe('Human-readable display name'),
  instructions: z.string().describe('Instructions that guide the member\'s behavior'),
  defaultModelId: z.string().optional().describe('Override model ID (e.g. "anthropic/claude-sonnet-4-20250514", "openai/gpt-4o"). If omitted, uses the parent agent\'s current model.'),
  maxSteps: z.number().optional().describe('Maximum steps for this member\'s execution loop'),
});

export const TeamCreateInputSchema = z.object({
  teamName: z.string().describe('Name for the new team'),
  description: z.string().describe('Brief description of what this team will accomplish'),
  task: z.string().describe('The task to dispatch to all team members'),
  members: z.array(MemberSchema).min(1).max(8).describe('Team member definitions (1-8 members)'),
  maxConcurrency: z.number().optional().describe('Max members running in parallel. Default: all'),
  modelStrategy: z.enum(['user_select', 'ai_auto', 'manual']).optional().default('manual').describe(
    'How to pick models: "manual" = use defaultModelId as-is, "user_select" = show TUI picker, "ai_auto" = auto-assign by task complexity'
  ),
});

export type TeamCreateInput = z.infer<typeof TeamCreateInputSchema>;

/**
 * A mutable bag used to lazily pass the dynamic toolset from createDynamicTools
 * into the team_create tool. The bag is populated AFTER createDynamicTools runs
 * but BEFORE any team execution happens.
 */
export type ToolBag = { current: ToolsInput | undefined };

export interface CreateTeamCreateToolOptions {
  resolveModel: (modelId: string) => MastraLanguageModel;
  fallbackModelId?: string;
  /** Lazy tool bag — resolved at execution time, not creation time. */
  harnessTools?: ToolBag;
}

export function createTeamCreateTool(opts: CreateTeamCreateToolOptions) {
  const { resolveModel, fallbackModelId, harnessTools } = opts;

  return createTool({
    id: 'team_create',
    description: `Dynamically create and dispatch a team of parallel agents. Define the team members inline with their own instructions, then all members work on the same task simultaneously.

Use this tool when:
- A task is complex enough to benefit from parallel work by multiple agents
- Different perspectives or approaches are needed simultaneously
- The user explicitly asks for a team, swarm, or group of agents
- You need to decompose a large task into sub-tasks run by specialized agents

When in doubt about whether a task warrants a team, prefer creating one.

Guidelines for choosing members:
- Keep teams small (2-4 members is usually optimal)
- Give each member a clear, focused role with specific instructions
- Members share the same task but apply different perspectives or responsibilities
- All members can communicate via the team_message tool`,
    inputSchema: TeamCreateInputSchema,
    execute: async (input, context) => {
      const { teamName, description, task, members, maxConcurrency, modelStrategy } = input;

      // Build HarnessTeam from dynamic input
      const team: HarnessTeam = {
        id: teamName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, ''),
        name: teamName,
        description,
        members: members.map((m): HarnessTeamMember => ({
          id: m.id,
          name: m.name,
          instructions: m.instructions,
          defaultModelId: m.defaultModelId,
          maxSteps: m.maxSteps,
        })),
        maxConcurrency,
      };

      const harnessCtx = context?.requestContext?.get('harness') as Record<string, any> | undefined;
      const emitEvent = (event: TeamEvent) => {
        harnessCtx?.emitEvent?.(event);
      };

      // Resolve fallback model ID:
      // 1. If a member doesn't specify a model, use the parent agent's current model
      // 2. Otherwise fall back to the static fallbackModelId from config
      const currentModelId = harnessCtx?.state?.currentModelId ?? harnessCtx?.getState?.()?.currentModelId;
      const resolvedFallbackModelId = currentModelId ?? fallbackModelId;

      // --- Model Strategy ---
      if (modelStrategy === 'ai_auto') {
        // Get available models from harness state
        const availableModels = (harnessCtx?.listAvailableModels?.() ?? []) as Array<{
          id: string; provider: string; modelName: string; hasApiKey: boolean;
        }>;
        const assignments = autoAssignModels(
          team.members.map(m => ({ id: m.id, name: m.name, instructions: m.instructions, defaultModelId: m.defaultModelId })),
          task,
          availableModels,
        );
        // Apply assignments to team members
        for (const member of team.members) {
          const assigned = assignments.get(member.id);
          if (assigned && !member.defaultModelId) {
            member.defaultModelId = assigned;
          }
        }
      } else if (modelStrategy === 'user_select') {
        // Emit a team_model_select event and wait for user response
        const availableModels = (harnessCtx?.listAvailableModels?.() ?? []) as Array<{
          id: string; provider: string; modelName: string; hasApiKey: boolean;
        }>;
        const questionId = `team-model-${Date.now()}`;

        const userSelections = await new Promise<Record<string, string> | null>((resolve) => {
          harnessCtx?.registerQuestion?.(questionId, (answer: string) => {
            try {
              resolve(JSON.parse(answer) as Record<string, string>);
            } catch {
              resolve(null);
            }
          });

          emitEvent({
            type: 'team_model_select',
            questionId,
            teamName,
            members: team.members.map(m => ({ id: m.id, name: m.name, defaultModelId: m.defaultModelId })),
            availableModels,
          } as TeamEvent);
        });

        if (userSelections) {
          for (const member of team.members) {
            if (userSelections[member.id]) {
              member.defaultModelId = userSelections[member.id];
            }
          }
        }
      }

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
          content: `Team "${teamName}" completed:\n\n${result.summary}`,
          isError: result.members.some(m => m.isError),
        };
      } catch (err) {
        return {
          content: `Team "${teamName}" failed: ${err instanceof Error ? err.message : String(err)}`,
          isError: true,
        };
      }
    },
  });
}
