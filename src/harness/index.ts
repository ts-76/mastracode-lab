/**
 * Agent Teams harness — barrel export.
 *
 * This module extends Mastra Code's Harness with team-based parallel
 * multi-agent workflows. Two modes of operation:
 *
 * 1. Pre-defined teams: declarative HarnessTeam config + team_dispatch tool
 * 2. Dynamic teams: AI creates teams on-the-fly via team_create tool
 */
export type {
  HarnessTeam,
  HarnessTeamMember,
  TeamMessage,
  TeamEvent,
  TeamMemberResult,
  TeamDispatchResult,
} from './types.js';

export { MessageBus } from './message-bus.js';
export { runTeam } from './team-runner.js';
export { createTeamDispatchTool } from './team-dispatch-tool.js';
export type { CreateTeamDispatchToolOptions } from './team-dispatch-tool.js';
export { createTeamCreateTool, TeamCreateInputSchema } from './team-create-tool.js';
export type { CreateTeamCreateToolOptions, TeamCreateInput, ToolBag } from './team-create-tool.js';
export type { TeamRunnerOptions } from './team-runner.js';
export {
  classifyTier,
  classifyModels,
  tierLabel,
  inferComplexity,
  autoAssignModels,
  getModelForTier,
} from './model-tiers.js';
export type { ModelTier, TaskComplexity, TieredModel } from './model-tiers.js';
