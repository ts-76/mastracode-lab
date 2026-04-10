/**
 * Event handlers for team execution events.
 * Mirrors the subagent handler pattern but manages TeamActivityComponent.
 */
import { TeamActivityComponent } from '../components/team-activity.js';

import type { TeamTaskItem } from '../../harness/types.js';
import type { EventHandlerContext } from './types.js';

function getTeamComponent(ctx: EventHandlerContext, teamId: string): TeamActivityComponent | undefined {
  return ctx.state.pendingTeams.get(teamId);
}

function updateActiveTeamId(ctx: EventHandlerContext, preferredTeamId?: string): void {
  if (preferredTeamId && ctx.state.pendingTeams.has(preferredTeamId)) {
    ctx.state.activeTeamId = preferredTeamId;
    return;
  }

  const nextActiveTeamId = ctx.state.pendingTeams.keys().next().value as string | undefined;
  ctx.state.activeTeamId = nextActiveTeamId;
}

export function handleTeamStart(
  ctx: EventHandlerContext,
  teamId: string,
  task: string,
): void {
  const { state } = ctx;
  const component = new TeamActivityComponent(teamId, task, state.ui);

  state.pendingTeams.set(teamId, component);
  updateActiveTeamId(ctx, teamId);
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
  const component = getTeamComponent(ctx, teamId);
  if (component) {
    updateActiveTeamId(ctx, teamId);
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
  const component = getTeamComponent(ctx, teamId);
  if (component) {
    updateActiveTeamId(ctx, teamId);
    component.appendTextDelta(memberId, textDelta);
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
  const component = getTeamComponent(ctx, teamId);
  if (component) {
    updateActiveTeamId(ctx, teamId);
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
  const component = getTeamComponent(ctx, teamId);
  if (component) {
    updateActiveTeamId(ctx, teamId);
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
  const component = getTeamComponent(ctx, teamId);
  if (component) {
    updateActiveTeamId(ctx, teamId);
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
  const component = getTeamComponent(ctx, teamId);
  if (component) {
    updateActiveTeamId(ctx, teamId);
    component.finishMember(memberId, isError, Date.now());
    ctx.state.ui.requestRender();
  }
}

export function handleTeamTaskBoardUpdated(
  ctx: EventHandlerContext,
  teamId: string,
  tasks: TeamTaskItem[],
): void {
  const component = getTeamComponent(ctx, teamId);
  if (component) {
    updateActiveTeamId(ctx, teamId);
    component.setTasks(tasks.map(task => ({
      id: task.id,
      title: task.title,
      status: task.status,
      assignee: task.assignee,
      dependsOn: task.dependsOn,
      notes: task.notes,
    })));
    ctx.state.ui.requestRender();
  }
}

export function handleTeamEnd(
  ctx: EventHandlerContext,
  teamId: string,
  results: Record<string, string>,
): void {
  const component = getTeamComponent(ctx, teamId);
  if (!component) return;

  component.finish(results);
  ctx.state.pendingTeams.delete(teamId);

  const toolIndex = ctx.state.allToolComponents.indexOf(component as any);
  if (toolIndex >= 0) {
    ctx.state.allToolComponents.splice(toolIndex, 1);
  }

  updateActiveTeamId(ctx);
  ctx.state.ui.requestRender();
}
