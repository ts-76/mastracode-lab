import { describe, expect, it, vi } from 'vitest';

import { TeamActivityComponent } from '../components/team-activity.js';
import { handleTeamStart, handleTeamTaskBoardUpdated } from '../handlers/team.js';

function createContext() {
  const component = {
    children: [] as unknown[],
    addChild(child: unknown) {
      this.children.push(child);
    },
    removeChild() {},
    invalidate() {},
  };

  return {
    state: {
      pendingTeams: new Map<string, TeamActivityComponent>(),
      activeTeamId: undefined as string | undefined,
      allToolComponents: [] as unknown[],
      chatContainer: component,
      streamingComponent: undefined,
      ui: { requestRender: vi.fn() },
    },
  } as any;
}

describe('team task-board handlers', () => {
  it('updates the live team component task board', () => {
    const ctx = createContext();

    handleTeamStart(ctx, 'team-a', 'Ship feature');
    handleTeamTaskBoardUpdated(ctx, 'team-a', [
      {
        id: 'task-1',
        title: 'Design API',
        status: 'in_progress',
        assignee: 'lead',
        dependsOn: undefined,
        notes: 'Waiting on review',
        createdBy: 'lead',
        updatedAt: Date.now(),
      },
    ]);

    const team = ctx.state.pendingTeams.get('team-a') as any;

    expect(team).toBeDefined();
    expect(team.tasks).toEqual([
      {
        id: 'task-1',
        title: 'Design API',
        status: 'in_progress',
        assignee: 'lead',
        dependsOn: undefined,
        notes: 'Waiting on review',
      },
    ]);
    expect(ctx.state.activeTeamId).toBe('team-a');
    expect(ctx.state.ui.requestRender).toHaveBeenCalled();
  });
});
