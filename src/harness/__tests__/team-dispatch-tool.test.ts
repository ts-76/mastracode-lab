import { describe, expect, it, vi } from 'vitest';

import { createTeamDispatchTool } from '../team-dispatch-tool.js';
import type { HarnessTeam } from '../types.js';

vi.mock('../team-runner.js', () => ({
  runTeam: vi.fn(),
}));

describe('team dispatch tool', () => {
  it('reports partial success without marking the whole dispatch as failed', async () => {
    const { runTeam } = await import('../team-runner.js');
    vi.mocked(runTeam).mockResolvedValue({
      teamId: 'review-team',
      summary: '**reviewer** [DONE]: ok\n\n---\n\n**tester** [ERROR]: failed',
      members: [
        { memberId: 'reviewer', result: 'ok', isError: false },
        { memberId: 'tester', result: 'failed', isError: true },
      ],
    });

    const team: HarnessTeam = {
      id: 'review-team',
      name: 'Review Team',
      description: 'Reviews a task',
      members: [
        { id: 'reviewer', name: 'Reviewer', instructions: 'Review.' },
        { id: 'tester', name: 'Tester', instructions: 'Test.' },
      ],
    };

    const tool = createTeamDispatchTool({
      teams: [team],
      resolveModel: vi.fn() as any,
      harnessTools: { current: {} },
    });

    const result = await tool.execute?.(
      { teamId: 'review-team', task: 'Check the feature' },
      {
        requestContext: {
          get: (key: string) => (key === 'harness' ? { emitEvent: vi.fn() } : undefined),
        },
        workspace: {},
      } as any,
    ) as { isError: boolean; content: string } | undefined;

    expect(result?.isError).toBe(false);
    expect(result?.content).toContain('partial success');
    expect(result?.content).toContain('1/2 members succeeded');
    expect(result?.content).toContain('1 errored');
    expect(result).toMatchObject({
      teamId: 'review-team',
      status: 'partial_success',
      successCount: 1,
      errorCount: 1,
      members: [
        { memberId: 'reviewer', result: 'ok', isError: false },
        { memberId: 'tester', result: 'failed', isError: true },
      ],
    });
  });

  it('marks the dispatch as failed when every member fails', async () => {
    const { runTeam } = await import('../team-runner.js');
    vi.mocked(runTeam).mockResolvedValue({
      teamId: 'broken-team',
      summary: '**worker** [ERROR]: boom',
      members: [{ memberId: 'worker', result: 'boom', isError: true }],
    });

    const team: HarnessTeam = {
      id: 'broken-team',
      name: 'Broken Team',
      description: 'Always fails',
      members: [{ id: 'worker', name: 'Worker', instructions: 'Fail.' }],
    };

    const tool = createTeamDispatchTool({
      teams: [team],
      resolveModel: vi.fn() as any,
      harnessTools: { current: {} },
    });

    const result = await tool.execute?.(
      { teamId: 'broken-team', task: 'Do the task' },
      {
        requestContext: {
          get: (key: string) => (key === 'harness' ? { emitEvent: vi.fn() } : undefined),
        },
        workspace: {},
      } as any,
    ) as { isError: boolean; content: string } | undefined;

    expect(result?.isError).toBe(true);
    expect(result?.content).toContain('Team failed');
    expect(result?.content).toContain('1/1 members errored');
    expect(result).toMatchObject({
      teamId: 'broken-team',
      status: 'error',
      successCount: 0,
      errorCount: 1,
      members: [{ memberId: 'worker', result: 'boom', isError: true }],
    });
  });
});
