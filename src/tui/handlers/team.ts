/**
 * Event handlers for team execution events.
 * Mirrors the subagent handler pattern but manages TeamActivityComponent.
 */
import { TeamActivityComponent } from '../components/team-activity.js';

import type { EventHandlerContext } from './types.js';

export function handleTeamStart(
  ctx: EventHandlerContext,
  teamId: string,
  task: string,
): void {
  const { state } = ctx;
  const component = new TeamActivityComponent(teamId, task, state.ui);

  state.pendingTeams.set(teamId, component);
  state.activeTeamId = teamId;
  state.allToolComponents.push(component as any);

  // Insert before the streaming component so the team box
  // appears in the right position in the chat
  if (state.streamingComponent) {
    const idx = state.chatContainer.children.indexOf(state.streamingComponent as any);
    if (idx >= 0) {
      (state.chatContainer.children as unknown[]).splice(idx, 0, component);
      state.chatContainer.invalidate();
    } else {
      state.chatContainer.addChild(component);
    }
  } else {
    state.chatContainer.addChild(component);
  }

  state.ui.requestRender();
}

export function handleTeamMemberStart(
  ctx: EventHandlerContext,
  teamId: string,
  memberId: string,
  name: string,
  modelId?: string,
): void {
  const component = ctx.state.pendingTeams.get(teamId);
  if (component) {
    component.addMember(memberId, name, modelId);
    ctx.state.ui.requestRender();
  }
}

export function handleTeamMemberTextDelta(
  ctx: EventHandlerContext,
  teamId: string,
  memberId: string,
  textDelta: string,
): void {
  const component = ctx.state.pendingTeams.get(teamId);
  if (component) {
    component.appendTextDelta(memberId, textDelta);
    // Only request render when focused on this member (component handles this internally)
    ctx.state.ui.requestRender();
  }
}

export function handleTeamMemberToolCall(
  ctx: EventHandlerContext,
  teamId: string,
  memberId: string,
  toolName: string,
  toolArgs?: unknown,
): void {
  const component = ctx.state.pendingTeams.get(teamId);
  if (component) {
    component.addToolCall(memberId, toolName, toolArgs);
    ctx.state.ui.requestRender();
  }
}

export function handleTeamMemberToolResult(
  ctx: EventHandlerContext,
  teamId: string,
  memberId: string,
  toolName: string,
  result?: string,
  isError?: boolean,
): void {
  const component = ctx.state.pendingTeams.get(teamId);
  if (component) {
    component.addToolResult(memberId, toolName, result, isError);
    ctx.state.ui.requestRender();
  }
}

export function handleTeamMessageSent(
  ctx: EventHandlerContext,
  teamId: string,
  from: string,
  to: string,
  content: string,
): void {
  const component = ctx.state.pendingTeams.get(teamId);
  if (component) {
    component.addMessage(from, to, content);
    ctx.state.ui.requestRender();
  }
}

export function handleTeamMemberEnd(
  ctx: EventHandlerContext,
  teamId: string,
  memberId: string,
  _result: string,
  isError: boolean,
): void {
  const component = ctx.state.pendingTeams.get(teamId);
  if (component) {
    component.finishMember(memberId, isError, Date.now());
    ctx.state.ui.requestRender();
  }
}

export function handleTeamEnd(
  ctx: EventHandlerContext,
  teamId: string,
  results: Record<string, string>,
): void {
  const component = ctx.state.pendingTeams.get(teamId);
  if (component) {
    component.finish(results);
    // Keep the component in pendingTeams so Ctrl+T can still focus members
    // to inspect results. activeTeamId remains set so the shortcut works.
    ctx.state.ui.requestRender();
  }
}
