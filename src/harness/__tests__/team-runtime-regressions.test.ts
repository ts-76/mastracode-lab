import { describe, expect, it, vi } from 'vitest';

import { createTeamCreateTool } from '../team-create-tool.js';
import { runTeam } from '../team-runner.js';
import type { HarnessTeam } from '../types.js';

function createToolExecutionContext(harnessOverrides?: Record<string, unknown>) {
  return {
    requestContext: {
      get: (key: string) => (key === 'harness' ? harnessOverrides : undefined),
    },
  };
}

describe('team runtime regressions', () => {
  it('returns an error instead of hanging when user_select is unavailable', async () => {
    const tool = createTeamCreateTool({
      resolveModel: vi.fn() as any,
      harnessTools: { current: {} },
    });

    const result = await tool.execute?.(
      {
        teamName: 'Review Team',
        description: 'Review changes',
        task: 'Inspect the implementation',
        modelStrategy: 'user_select',
        members: [{ id: 'reviewer', name: 'Reviewer', instructions: 'Review the implementation.' }],
      },
      createToolExecutionContext({ emitEvent: vi.fn() }) as any,
    );

    expect(result?.isError).toBe(true);
    expect(result?.content).toContain('Model selection UI is unavailable');
  });

  it('filters workspace tools in prepareStep when allowedWorkspaceTools is set', async () => {
    const prepareStepFns: Array<NonNullable<Parameters<typeof runTeam>[0]> extends never ? never : any> = [];

    const mockStream = {
      fullStream: (async function* () {
        yield { type: 'text-delta', payload: { text: 'done' } };
      })(),
      getFullOutput: vi.fn().mockResolvedValue({ text: 'done' }),
    };

    const streamSpy = vi.fn(async (_task: string, options: any) => {
      prepareStepFns.push(options.prepareStep);
      return mockStream;
    });

    const team: HarnessTeam = {
      id: 'team-a',
      name: 'Team A',
      description: 'Test team',
      members: [
        {
          id: 'worker',
          name: 'Worker',
          instructions: 'Do the work.',
          defaultModelId: 'test/model',
          allowedWorkspaceTools: ['view', 'search_content'],
        },
      ],
    };

    await runTeam({
      team,
      task: 'Test workspace filtering',
      resolveModel: vi.fn(() => ({}) as any),
      fallbackModelId: 'fallback/model',
      harnessTools: {
        view: { id: 'view' } as any,
        search_content: { id: 'search_content' } as any,
        write_file: { id: 'write_file' } as any,
        team_dispatch: { id: 'team_dispatch' } as any,
      },
      requestContext: {},
      workspace: {},
      emitEvent: vi.fn(),
    });

    expect(streamSpy).not.toHaveBeenCalled();
  });
});
