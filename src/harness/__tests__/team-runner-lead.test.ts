import { describe, expect, it, vi } from 'vitest';

import type { HarnessTeam, TeamEvent } from '../types.js';

vi.mock('@mastra/core/agent', () => {
  class MockAgent {
    static streams: Array<(task: string, config: { tools: Record<string, unknown> }) => { fullStream: AsyncGenerator<any>; getFullOutput: () => Promise<{ text: string }> }> = [];

    constructor(private readonly config: { id: string; name: string; instructions: string; model: unknown; tools: Record<string, unknown>; workspace: unknown }) {}

    async stream(task: string) {
      const next = MockAgent.streams.shift();
      if (!next) {
        throw new Error(`No mock stream configured for ${this.config.id}`);
      }
      return next(task, this.config);
    }
  }

  return { Agent: MockAgent };
});

function createResponse(text: string) {
  return {
    fullStream: (async function* () {
      yield { type: 'text-delta', payload: { text } };
    })(),
    getFullOutput: async () => ({ text }),
  };
}

describe('runTeam lead strategy', () => {
  it('skips the follow-up lead pass when remaining work is already assigned and in progress', async () => {
    const { runTeam } = await import('../team-runner.js');
    const receivedTasks: string[] = [];
    const events: TeamEvent[] = [];

    const { Agent } = await import('@mastra/core/agent');
    (Agent as any).streams = [
      async (task: string, config: { tools: Record<string, unknown> }) => {
        receivedTasks.push(task);
        await (config.tools.team_task_create as any).execute({
          title: 'Implement API',
          assignee: 'worker-1',
        });
        await (config.tools.team_task_create as any).execute({
          title: 'Write tests',
          assignee: 'worker-2',
          dependsOn: ['task-1'],
        });
        return createResponse('lead planned');
      },
      async (task: string, config: { tools: Record<string, unknown> }) => {
        receivedTasks.push(task);
        await (config.tools.team_task_claim as any).execute({ taskId: 'task-1' });
        await (config.tools.team_task_update as any).execute({ taskId: 'task-1', status: 'done' });
        return createResponse('worker one done');
      },
      async (task: string, config: { tools: Record<string, unknown> }) => {
        receivedTasks.push(task);
        await (config.tools.team_task_claim as any).execute({ taskId: 'task-2' });
        return createResponse('worker two started');
      },
    ];

    const team: HarnessTeam = {
      id: 'lead-team',
      name: 'Lead Team',
      description: 'Lead-first coordination',
      strategy: 'lead',
      members: [
        { id: 'lead', name: 'Lead', instructions: 'Plan work.', defaultModelId: 'test/model' },
        { id: 'worker-1', name: 'Worker 1', instructions: 'Execute assigned work.', defaultModelId: 'test/model' },
        { id: 'worker-2', name: 'Worker 2', instructions: 'Execute assigned work.', defaultModelId: 'test/model' },
      ],
    };

    const result = await runTeam({
      team,
      task: 'Ship the feature',
      resolveModel: () => ({}) as any,
      fallbackModelId: 'fallback/model',
      harnessTools: {},
      requestContext: {},
      workspace: {},
      emitEvent: (event: TeamEvent) => events.push(event),
    });

    expect(receivedTasks).toHaveLength(3);
    expect(receivedTasks[0]).toContain('You are the lead member for this team run.');
    expect(receivedTasks[1]).toContain('Current open board items:');
    expect(receivedTasks[1]).toContain('Tasks you can pick up now:');
    expect(receivedTasks[2]).toContain('Current open board items:');
    expect(receivedTasks[2]).toContain('Tasks you can pick up now:');
    expect(receivedTasks[2]).toContain('- task-2 Write tests');

    expect(result.members.map((member: { memberId: string }) => member.memberId)).toEqual(['lead', 'worker-1', 'worker-2']);

    const startEvents = events.filter(event => event.type === 'team_member_start');
    expect(startEvents).toHaveLength(3);
    expect(startEvents[0]).toMatchObject({ type: 'team_member_start', memberId: 'lead' });
    expect(startEvents[2]).toMatchObject({ type: 'team_member_start', memberId: 'worker-2' });
  });

  it('skips the follow-up lead pass when followers finish all board work', async () => {
    const { runTeam } = await import('../team-runner.js');
    const receivedTasks: string[] = [];

    const { Agent } = await import('@mastra/core/agent');
    (Agent as any).streams = [
      async (task: string, config: { tools: Record<string, unknown> }) => {
        receivedTasks.push(task);
        await (config.tools.team_task_create as any).execute({
          title: 'Implement API',
          assignee: 'worker-1',
        });
        return createResponse('lead planned');
      },
      async (task: string, config: { tools: Record<string, unknown> }) => {
        receivedTasks.push(task);
        await (config.tools.team_task_claim as any).execute({ taskId: 'task-1' });
        await (config.tools.team_task_update as any).execute({ taskId: 'task-1', status: 'done' });
        return createResponse('worker one done');
      },
    ];

    const team: HarnessTeam = {
      id: 'lead-team',
      name: 'Lead Team',
      description: 'Lead-first coordination',
      strategy: 'lead',
      members: [
        { id: 'lead', name: 'Lead', instructions: 'Plan work.', defaultModelId: 'test/model' },
        { id: 'worker-1', name: 'Worker 1', instructions: 'Execute assigned work.', defaultModelId: 'test/model' },
      ],
    };

    const result = await runTeam({
      team,
      task: 'Ship the feature',
      resolveModel: () => ({}) as any,
      fallbackModelId: 'fallback/model',
      harnessTools: {},
      requestContext: {},
      workspace: {},
      emitEvent: () => {},
    });

    expect(receivedTasks).toHaveLength(2);
    expect(result.members.map((member: { memberId: string }) => member.memberId)).toEqual(['lead', 'worker-1']);
  });

  it('skips followers with no ready work and lets lead replan first', async () => {
    const { runTeam } = await import('../team-runner.js');
    const receivedTasks: string[] = [];

    const { Agent } = await import('@mastra/core/agent');
    (Agent as any).streams = [
      async (task: string, config: { tools: Record<string, unknown> }) => {
        receivedTasks.push(task);
        await (config.tools.team_task_create as any).execute({
          title: 'Only worker one can start',
          assignee: 'worker-1',
        });
        return createResponse('lead planned');
      },
      async (task: string, config: { tools: Record<string, unknown> }) => {
        receivedTasks.push(task);
        await (config.tools.team_task_claim as any).execute({ taskId: 'task-1' });
        return createResponse('worker one started');
      },
      async (task: string) => {
        receivedTasks.push(task);
        return createResponse('lead replanned');
      },
    ];

    const team: HarnessTeam = {
      id: 'lead-team',
      name: 'Lead Team',
      description: 'Lead-first coordination',
      strategy: 'lead',
      maxConcurrency: 1,
      members: [
        { id: 'lead', name: 'Lead', instructions: 'Plan work.', defaultModelId: 'test/model' },
        { id: 'worker-2', name: 'Worker 2', instructions: 'Wait for assignment.', defaultModelId: 'test/model' },
        { id: 'worker-1', name: 'Worker 1', instructions: 'Execute assigned work.', defaultModelId: 'test/model' },
      ],
    };

    const result = await runTeam({
      team,
      task: 'Ship the feature',
      resolveModel: () => ({}) as any,
      fallbackModelId: 'fallback/model',
      harnessTools: {},
      requestContext: {},
      workspace: {},
      emitEvent: () => {},
    });

    expect(receivedTasks).toHaveLength(3);
    expect(receivedTasks[0]).toContain('You are the lead member for this team run.');
    expect(receivedTasks[1]).toContain('Tasks you can pick up now:');
    expect(receivedTasks[1]).toContain('- task-1 Only worker one can start');
    expect(receivedTasks[2]).toContain('You are the lead member returning for a follow-up coordination pass.');
    expect(result.members.map((member: { memberId: string }) => member.memberId)).toEqual(['lead', 'worker-1', 'lead']);
  });

  it('does not re-run lead when only assigned in-progress work remains', async () => {
    const { runTeam } = await import('../team-runner.js');
    const receivedTasks: string[] = [];

    const { Agent } = await import('@mastra/core/agent');
    (Agent as any).streams = [
      async (task: string, config: { tools: Record<string, unknown> }) => {
        receivedTasks.push(task);
        await (config.tools.team_task_create as any).execute({
          title: 'Long-running task',
          assignee: 'worker-1',
        });
        return createResponse('lead planned');
      },
      async (task: string, config: { tools: Record<string, unknown> }) => {
        receivedTasks.push(task);
        await (config.tools.team_task_claim as any).execute({ taskId: 'task-1' });
        return createResponse('worker one started');
      },
    ];

    const team: HarnessTeam = {
      id: 'lead-team',
      name: 'Lead Team',
      description: 'Lead-first coordination',
      strategy: 'lead',
      members: [
        { id: 'lead', name: 'Lead', instructions: 'Plan work.', defaultModelId: 'test/model' },
        { id: 'worker-1', name: 'Worker 1', instructions: 'Execute assigned work.', defaultModelId: 'test/model' },
      ],
    };

    const result = await runTeam({
      team,
      task: 'Ship the feature',
      resolveModel: () => ({}) as any,
      fallbackModelId: 'fallback/model',
      harnessTools: {},
      requestContext: {},
      workspace: {},
      emitEvent: () => {},
    });

    expect(receivedTasks).toHaveLength(2);
    expect(result.members.map((member: { memberId: string }) => member.memberId)).toEqual(['lead', 'worker-1']);
  });

  it('prioritizes followers with assigned tasks over unassigned pick-up', async () => {
    const { runTeam } = await import('../team-runner.js');
    const executionOrder: string[] = [];

    const { Agent } = await import('@mastra/core/agent');
    (Agent as any).streams = [
      async (task: string, config: { tools: Record<string, unknown> }) => {
        executionOrder.push('lead');
        await (config.tools.team_task_create as any).execute({
          title: 'Assigned to worker-1',
          assignee: 'worker-1',
        });
        await (config.tools.team_task_create as any).execute({
          title: 'Unassigned pick-up',
        });
        return createResponse('lead planned');
      },
      async (task: string) => {
        executionOrder.push('worker-1');
        return createResponse('worker one done assigned task');
      },
      async (task: string) => {
        executionOrder.push('worker-2');
        return createResponse('worker two picked up unassigned');
      },
    ];

    const team: HarnessTeam = {
      id: 'lead-team',
      name: 'Lead Team',
      description: 'Lead-first coordination',
      strategy: 'lead',
      maxConcurrency: 1,
      members: [
        { id: 'lead', name: 'Lead', instructions: 'Plan work.', defaultModelId: 'test/model' },
        { id: 'worker-2', name: 'Worker 2', instructions: 'Pick up work.', defaultModelId: 'test/model' },
        { id: 'worker-1', name: 'Worker 1', instructions: 'Execute assigned work.', defaultModelId: 'test/model' },
      ],
    };

    await runTeam({
      team,
      task: 'Ship the feature',
      resolveModel: () => ({}) as any,
      fallbackModelId: 'fallback/model',
      harnessTools: {},
      requestContext: {},
      workspace: {},
      emitEvent: () => {},
    });

    expect(executionOrder[0]).toBe('lead');
    expect(executionOrder[1]).toBe('worker-1');
    expect(executionOrder[2]).toBe('worker-2');
  });

  it('stops the lead re-plan loop when no progress is made across iterations', async () => {
    const { runTeam } = await import('../team-runner.js');
    const leadPasses: string[] = [];

    const { Agent } = await import('@mastra/core/agent');
    (Agent as any).streams = [
      async (task: string, config: { tools: Record<string, unknown> }) => {
        leadPasses.push('initial');
        await (config.tools.team_task_create as any).execute({
          title: 'Blocked task',
          assignee: 'worker-1',
          dependsOn: ['task-99'],
        });
        return createResponse('lead planned');
      },
      async (task: string) => {
        leadPasses.push('replan-1');
        return createResponse('lead tried to replan');
      },
      async (task: string) => {
        leadPasses.push('replan-2');
        return createResponse('lead tried again');
      },
    ];

    const team: HarnessTeam = {
      id: 'lead-team',
      name: 'Lead Team',
      description: 'Lead-first coordination',
      strategy: 'lead',
      members: [
        { id: 'lead', name: 'Lead', instructions: 'Plan work.', defaultModelId: 'test/model' },
        { id: 'worker-1', name: 'Worker 1', instructions: 'Execute assigned work.', defaultModelId: 'test/model' },
      ],
    };

    const result = await runTeam({
      team,
      task: 'Ship the feature',
      resolveModel: () => ({}) as any,
      fallbackModelId: 'fallback/model',
      harnessTools: {},
      requestContext: {},
      workspace: {},
      emitEvent: () => {},
    });

    expect(leadPasses[0]).toBe('initial');
    expect(leadPasses.length).toBeLessThanOrEqual(3);
    expect(leadPasses.length).toBeGreaterThanOrEqual(2);
    expect(result.members.length).toBeGreaterThanOrEqual(2);
  });
});
