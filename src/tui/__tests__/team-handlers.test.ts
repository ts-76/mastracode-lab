import { describe, expect, it, vi } from 'vitest';

import { handleTeamEnd, handleTeamMemberStart, handleTeamStart } from '../handlers/team.js';

function createContext() {
  const component = {
    addMember: vi.fn(),
    appendTextDelta: vi.fn(),
    addToolCall: vi.fn(),
    addToolResult: vi.fn(),
    addMessage: vi.fn(),
    finishMember: vi.fn(),
    finish: vi.fn(),
    focusNextMember: vi.fn(),
    setExpanded: vi.fn(),
  };

  const state = {
    pendingTeams: new Map<string, any>(),
    activeTeamId: undefined as string | undefined,
    allToolComponents: [] as any[],
    streamingComponent: undefined,
    chatContainer: { children: [], addChild: vi.fn(), invalidate: vi.fn() },
    ui: { requestRender: vi.fn() },
  };

  return { ctx: { state }, component } as any;
}

describe('team handlers', () => {
  it('sets activeTeamId when a team starts', () => {
    const { ctx } = createContext();

    handleTeamStart(ctx, 'team-a', 'Do work');

    expect(ctx.state.pendingTeams.has('team-a')).toBe(true);
    expect(ctx.state.activeTeamId).toBe('team-a');
  });

  it('reassigns activeTeamId to another pending team when one finishes', () => {
    const { ctx } = createContext();

    handleTeamStart(ctx, 'team-a', 'Do work');
    handleTeamStart(ctx, 'team-b', 'Do more work');

    handleTeamEnd(ctx, 'team-b', { worker: 'done' });

    expect(ctx.state.pendingTeams.has('team-b')).toBe(false);
    expect(ctx.state.activeTeamId).toBe('team-a');
  });

  it('clears activeTeamId when the last team finishes', () => {
    const { ctx } = createContext();

    handleTeamStart(ctx, 'team-a', 'Do work');
    handleTeamEnd(ctx, 'team-a', { worker: 'done' });

    expect(ctx.state.pendingTeams.size).toBe(0);
    expect(ctx.state.activeTeamId).toBeUndefined();
  });

  it('restores activeTeamId from live team events when stale', () => {
    const { ctx } = createContext();

    handleTeamStart(ctx, 'team-a', 'Do work');
    ctx.state.activeTeamId = 'missing-team';

    handleTeamMemberStart(ctx, 'team-a', 'worker', 'Worker');

    expect(ctx.state.activeTeamId).toBe('team-a');
  });
});
