import { describe, expect, it, vi } from 'vitest';

import type { HarnessTeam, TeamEvent } from '../types.js';

vi.mock('@mastra/core/agent', () => {
  class MockAgent {
    static streams: Array<(task: string) => { fullStream: AsyncGenerator<any>; getFullOutput: () => Promise<{ text: string }> }> = [];

    constructor(private readonly config: { id: string; name: string; instructions: string; model: unknown; tools: Record<string, unknown>; workspace: unknown }) {}

    async stream(task: string) {
      const next = MockAgent.streams.shift();
      if (!next) {
        throw new Error(`No mock stream configured for ${this.config.id}`);
      }
      return next(task);
    }
  }

  return { Agent: MockAgent };
});

describe('runTeam lead strategy', () => {
  it('runs the first member as lead before followers and shares task-board tools', async () => {
    const { runTeam } = await import('../team-runner.js');
    const receivedTasks: string[] = [];
    const events: TeamEvent[] = [];

    const createResponse = (text: string) => ({
      fullStream: (async function* () {
        yield { type: 'text-delta', payload: { text } };
      })(),
      getFullOutput: async () => ({ text }),
    });

    const { Agent } = await import('@mastra/core/agent');
    (Agent as any).streams = [
      (task: string) => {
        receivedTasks.push(task);
        return createResponse('lead planned');
      },
      (task: string) => {
        receivedTasks.push(task);
        return createResponse('worker one done');
      },
      (task: string) => {
        receivedTasks.push(task);
        return createResponse('worker two done');
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
    expect(receivedTasks[0]).toContain('Ship the feature');
    expect(receivedTasks[0]).toContain('You are the lead member for this team run.');
    expect(receivedTasks[1]).toContain('A lead planner has already gone first for this team run.');
    expect(receivedTasks[2]).toContain('A lead planner has already gone first for this team run.');

    expect(result.members.map((member: { memberId: string }) => member.memberId)).toEqual(['lead', 'worker-1', 'worker-2']);

    const startEvents = events.filter(event => event.type === 'team_member_start');
    expect(startEvents).toHaveLength(3);
    expect(startEvents[0]).toMatchObject({ type: 'team_member_start', memberId: 'lead' });

    const boardEvent = events.find(event => event.type === 'team_task_board_updated');
    expect(boardEvent).toBeDefined();
  });
});
