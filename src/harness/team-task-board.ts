import { createTool } from '@mastra/core/tools';
import { z } from 'zod/v4';

import type { TeamEvent, TeamTaskItem, TeamTaskStatus } from './types.js';

export class TeamTaskBoard {
  private tasks = new Map<string, TeamTaskItem>();
  private nextId = 1;

  constructor(
    private readonly teamId: string,
    private readonly emitEvent?: (event: TeamEvent) => void,
  ) {}

  list(): TeamTaskItem[] {
    return [...this.tasks.values()].sort((a, b) => a.updatedAt - b.updatedAt);
  }

  create(input: {
    title: string;
    description?: string;
    assignee?: string;
    dependsOn?: string[];
    notes?: string;
    createdBy: string;
  }): TeamTaskItem {
    const id = `task-${this.nextId++}`;
    const task: TeamTaskItem = {
      id,
      title: input.title,
      description: input.description,
      assignee: input.assignee,
      status: this.hasIncompleteDependencies(input.dependsOn) ? 'blocked' : 'pending',
      dependsOn: input.dependsOn?.length ? [...input.dependsOn] : undefined,
      notes: input.notes,
      createdBy: input.createdBy,
      updatedAt: Date.now(),
    };

    this.tasks.set(id, task);
    this.emitEvent?.({ type: 'team_task_board_updated', teamId: this.teamId, tasks: this.list() });
    return task;
  }

  claim(taskId: string, memberId: string): TeamTaskItem {
    const task = this.getRequired(taskId);
    task.assignee = memberId;
    if (task.status === 'pending') {
      task.status = this.hasBlockedDependencies(task) ? 'blocked' : 'in_progress';
    }
    task.updatedAt = Date.now();
    this.refreshBlockedStatuses();
    this.emitEvent?.({ type: 'team_task_board_updated', teamId: this.teamId, tasks: this.list() });
    return task;
  }

  update(taskId: string, updates: {
    status?: TeamTaskStatus;
    assignee?: string;
    notes?: string;
    dependsOn?: string[];
    title?: string;
    description?: string;
  }): TeamTaskItem {
    const task = this.getRequired(taskId);
    if (updates.title !== undefined) task.title = updates.title;
    if (updates.description !== undefined) task.description = updates.description;
    if (updates.assignee !== undefined) task.assignee = updates.assignee;
    if (updates.notes !== undefined) task.notes = updates.notes;
    if (updates.dependsOn !== undefined) task.dependsOn = updates.dependsOn.length ? [...updates.dependsOn] : undefined;
    if (updates.status !== undefined) task.status = updates.status;
    task.updatedAt = Date.now();

    this.refreshBlockedStatuses();
    this.emitEvent?.({ type: 'team_task_board_updated', teamId: this.teamId, tasks: this.list() });
    return task;
  }

  private hasIncompleteDependencies(dependsOn?: string[]): boolean {
    return (dependsOn ?? []).some(id => this.tasks.get(id)?.status !== 'done');
  }

  private hasBlockedDependencies(task: TeamTaskItem): boolean {
    return this.hasIncompleteDependencies(task.dependsOn);
  }

  private refreshBlockedStatuses(): void {
    for (const task of this.tasks.values()) {
      if (task.status === 'done') continue;
      if (this.hasBlockedDependencies(task)) {
        task.status = 'blocked';
      } else if (task.status === 'blocked') {
        task.status = task.assignee ? 'in_progress' : 'pending';
      }
    }
  }

  private getRequired(taskId: string): TeamTaskItem {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`Unknown team task: ${taskId}`);
    }
    return task;
  }
}

const TaskCreateSchema = z.object({
  title: z.string().describe('Short task title'),
  description: z.string().optional().describe('Optional longer task description'),
  assignee: z.string().optional().describe('Optional member ID to assign immediately'),
  dependsOn: z.array(z.string()).optional().describe('Task IDs that must be done before this task can proceed'),
  notes: z.string().optional().describe('Optional status notes'),
});

const TaskUpdateSchema = z.object({
  taskId: z.string().describe('Task ID to update'),
  status: z.enum(['pending', 'in_progress', 'blocked', 'done']).optional().describe('New task status'),
  assignee: z.string().optional().describe('Member ID assigned to the task'),
  dependsOn: z.array(z.string()).optional().describe('Replacement dependency list'),
  notes: z.string().optional().describe('Optional status notes'),
  title: z.string().optional().describe('Updated short task title'),
  description: z.string().optional().describe('Updated longer task description'),
});

export function createTeamTaskBoardTools(memberId: string, board: TeamTaskBoard) {
  return {
    team_task_create: createTool({
      id: 'team_task_create',
      description: 'Create a shared team task-board item with optional assignee and dependencies.',
      inputSchema: TaskCreateSchema,
      execute: async input => board.create({ ...input, createdBy: memberId }),
    }),
    team_task_claim: createTool({
      id: 'team_task_claim',
      description: 'Claim a shared team task-board item for the current member.',
      inputSchema: z.object({ taskId: z.string().describe('Task ID to claim') }),
      execute: async ({ taskId }) => board.claim(taskId, memberId),
    }),
    team_task_update: createTool({
      id: 'team_task_update',
      description: 'Update status, assignee, dependency list, or notes for a shared team task.',
      inputSchema: TaskUpdateSchema,
      execute: async ({ taskId, ...updates }) => board.update(taskId, updates),
    }),
    team_task_list: createTool({
      id: 'team_task_list',
      description: 'List the current shared team task board.',
      inputSchema: z.object({}),
      execute: async () => ({ tasks: board.list() }),
    }),
  };
}
