import { describe, it, expect } from 'vitest';
import type { HarnessTeam, HarnessTeamMember, TeamMessage, TeamDispatchResult } from '../types.js';

describe('Team types', () => {
  it('should create a valid team member', () => {
    const member: HarnessTeamMember = {
      id: 'explorer',
      name: 'Explorer Agent',
      instructions: 'You explore the codebase.',
      defaultModelId: 'anthropic/claude-sonnet-4',
    };
    expect(member.id).toBe('explorer');
  });

  it('should create a valid team with members', () => {
    const team: HarnessTeam = {
      id: 'research-team',
      name: 'Research Team',
      description: 'Explores and analyzes code',
      members: [
        {
          id: 'explorer',
          name: 'Explorer',
          instructions: 'Find relevant files',
          defaultModelId: 'anthropic/claude-sonnet-4',
        },
        {
          id: 'analyzer',
          name: 'Analyzer',
          instructions: 'Analyze code patterns',
          defaultModelId: 'openai/gpt-5.2-codex',
        },
      ],
    };
    expect(team.members).toHaveLength(2);
    expect(team.maxConcurrency).toBeUndefined();
  });

  it('should create a valid team message', () => {
    const message: TeamMessage = {
      fromMemberId: 'a',
      toMemberId: 'b',
      content: 'Found something interesting',
      timestamp: Date.now(),
    };
    expect(message.toMemberId).toBe('b');
  });

  it('should create a valid dispatch result', () => {
    const result: TeamDispatchResult = {
      teamId: 'research-team',
      members: [
        { memberId: 'explorer', result: 'Found 5 files', isError: false },
        { memberId: 'analyzer', result: 'Pattern detected', isError: false },
      ],
      summary: '**explorer** [DONE]: Found 5 files\n\n---\n\n**analyzer** [DONE]: Pattern detected',
    };
    expect(result.members).toHaveLength(2);
    expect(result.members.some(m => m.isError)).toBe(false);
  });
});
