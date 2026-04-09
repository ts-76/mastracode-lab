import { describe, expect, it, vi } from 'vitest';

import { TeamTaskBoard, createTeamTaskBoardTools } from '../team-task-board.js';
import type { TeamEvent, TeamTaskItem } from '../types.js';

describe('TeamTaskBoard', () => {
  it('creates tasks and blocks dependent work until prerequisites are done', async () => {
    const emitEvent = vi.fn<(event: TeamEvent) => void>();
    const board = new TeamTaskBoard('team-a', emitEvent);

    const leadTools = createTeamTaskBoardTools('lead', board);
    const workerTools = createTeamTaskBoardTools('worker', board);

    const foundation = await leadTools.team_task_create.execute?.({
      title: 'Lay foundation',
    }, {} as any) as TeamTaskItem;
    const followup = await workerTools.team_task_create.execute?.({
      title: 'Build feature',
      dependsOn: [foundation.id],
    }, {} as any) as TeamTaskItem;

    expect(followup.status).toBe('blocked');

    await workerTools.team_task_claim.execute?.({ taskId: followup.id }, {} as any);
    const blockedBoard = await workerTools.team_task_list.execute?.({}, {} as any) as { tasks: TeamTaskItem[] };
    expect(blockedBoard.tasks.find(task => task.id === followup.id)?.status).toBe('blocked');

    await leadTools.team_task_update.execute?.({ taskId: foundation.id, status: 'done' }, {} as any);
    const updated = await workerTools.team_task_list.execute?.({}, {} as any) as { tasks: TeamTaskItem[] };
    const unblocked = updated.tasks.find(task => task.id === followup.id);

    expect(unblocked?.status).toBe('in_progress');
    expect(unblocked?.assignee).toBe('worker');
    expect(emitEvent).toHaveBeenCalledWith(expect.objectContaining({ type: 'team_task_board_updated', teamId: 'team-a' }));
  });

  it('updates task metadata and preserves ordering in list output', async () => {
    const board = new TeamTaskBoard('team-b');
    const tools = createTeamTaskBoardTools('lead', board);

    const first = await tools.team_task_create.execute?.({ title: 'First task' }, {} as any) as TeamTaskItem;
    const second = await tools.team_task_create.execute?.({ title: 'Second task' }, {} as any) as TeamTaskItem;

    await tools.team_task_update.execute?.({
      taskId: second.id,
      status: 'in_progress',
      notes: 'Investigating',
      description: 'Work in progress',
    }, {} as any);

    const listed = await tools.team_task_list.execute?.({}, {} as any) as { tasks: TeamTaskItem[] };

    expect(listed.tasks.map(task => task.id)).toEqual([first.id, second.id]);
    expect(listed.tasks[1]).toMatchObject({
      id: second.id,
      status: 'in_progress',
      notes: 'Investigating',
      description: 'Work in progress',
    });
  });
});
