/**
 * Agent Teams types for Mastra Code.
 *
 * Extends the Harness pattern with team-based parallel multi-agent workflows.
 * Teams are defined declaratively and dispatched at runtime via the `team_dispatch` tool.
 */
import type { AgentInstructions, ToolsInput } from '@mastra/core/agent';
import type { DynamicArgument } from '@mastra/core/types';

/**
 * A team is a named group of agents that can be dispatched in parallel
 * and communicate with each other via an in-memory message bus.
 */
export interface HarnessTeam {
  /** Unique identifier (e.g. "frontend-team") */
  id: string;
  /** Human-readable display name */
  name: string;
  /** Description shown to the parent agent when choosing which team to dispatch */
  description: string;
  /** Member agent definitions */
  members: HarnessTeamMember[];
  /** Coordination strategy. Currently only 'lead' is supported. */
  strategy?: 'lead';
  /** Max concurrent members. Default: all members run in parallel. */
  maxConcurrency?: number;
}

/**
 * A single member within a team.
 * Follows the same patterns as HarnessSubagent for consistency.
 */
export interface HarnessTeamMember {
  /** Unique identifier within the team (e.g. "designer", "implementer") */
  id: string;
  /** Human-readable display name */
  name: string;
  /**
   * Instructions that guide the member's behavior.
   * Same format as HarnessSubagent.instructions.
   */
  instructions: DynamicArgument<AgentInstructions>;
  /** Additional tools this member has direct access to */
  tools?: ToolsInput;
  /**
   * Harness built-in tool IDs to make available to this member.
   * Merged with `tools` above.
   */
  allowedHarnessTools?: string[];
  /**
   * Workspace tool keys the member is allowed to call.
   * When omitted, all workspace tools are visible.
   */
  allowedWorkspaceTools?: string[];
  /** Override model ID for this member */
  defaultModelId?: string;
  /** Maximum steps for this member's execution loop */
  maxSteps?: number;
}

/**
 * A message sent between team members via the MessageBus.
 */
export interface TeamMessage {
  /** ID of the sending member */
  fromMemberId: string;
  /** ID of the receiving member, or 'broadcast' to send to all */
  toMemberId: string;
  /** Message content */
  content: string;
  /** Timestamp (Date.now()) */
  timestamp: number;
}

/**
 * Events emitted by TeamRunner during team execution.
 * These are forwarded as HarnessEvents for TUI / logging.
 */
export interface TeamModelSelectEvent {
  type: 'team_model_select';
  questionId: string;
  teamName: string;
  members: Array<{
    id: string;
    name: string;
    defaultModelId?: string;
  }>;
  availableModels: Array<{
    id: string;
    provider: string;
    modelName: string;
    hasApiKey: boolean;
  }>;
}

export type TeamEvent =
  | { type: 'team_start'; teamId: string; task: string; memberInfo: Array<{ id: string; name: string; modelId?: string }> }
  | { type: 'team_member_start'; teamId: string; memberId: string; name: string; modelId?: string }
  | { type: 'team_member_text_delta'; teamId: string; memberId: string; textDelta: string }
  | { type: 'team_member_tool_call'; teamId: string; memberId: string; toolName: string; toolArgs?: unknown }
  | { type: 'team_member_tool_result'; teamId: string; memberId: string; toolName: string; result?: string; isError: boolean }
  | { type: 'team_member_end'; teamId: string; memberId: string; result: string; isError: boolean }
  | { type: 'team_message_sent'; teamId: string; from: string; to: string; content: string }
  | { type: 'team_end'; teamId: string; results: Record<string, string> }
  | TeamModelSelectEvent;

/**
 * Result from a single team member execution.
 */
export interface TeamMemberResult {
  memberId: string;
  result: string;
  isError: boolean;
}

/**
 * Overall result from a team dispatch.
 */
export interface TeamDispatchResult {
  teamId: string;
  members: TeamMemberResult[];
  /** Combined text summary suitable for returning to the parent agent */
  summary: string;
}
