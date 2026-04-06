import { describe, it, expect } from 'vitest';
import { TeamCreateInputSchema } from '../team-create-tool.js';

describe('TeamCreateInputSchema', () => {
  it('should validate a minimal valid input', () => {
    const input = {
      teamName: 'research-team',
      description: 'Explore and analyze code',
      task: 'Find all TypeScript files and list their exports',
      members: [
        {
          id: 'explorer',
          name: 'Explorer',
          instructions: 'Find relevant files in the codebase.',
        },
      ],
    };

    const result = TeamCreateInputSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it('should validate a full input with all optional fields', () => {
    const input = {
      teamName: 'full-team',
      description: 'Full-featured team',
      task: 'Build a feature end-to-end',
      members: [
        {
          id: 'researcher',
          name: 'Researcher',
          instructions: 'Research best practices.',
          defaultModelId: 'anthropic/claude-sonnet-4',
          maxSteps: 30,
        },
        {
          id: 'implementer',
          name: 'Implementer',
          instructions: 'Write the code.',
          defaultModelId: 'openai/gpt-5.2-codex',
        },
      ],
      maxConcurrency: 2,
    };

    const result = TeamCreateInputSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.members).toHaveLength(2);
      expect(result.data.maxConcurrency).toBe(2);
    }
  });

  it('should reject input with no members', () => {
    const input = {
      teamName: 'empty-team',
      description: 'Team with no members',
      task: 'Do something',
      members: [],
    };

    const result = TeamCreateInputSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('should reject input with more than 8 members', () => {
    const input = {
      teamName: 'huge-team',
      description: 'Too many members',
      task: 'Do something',
      members: Array.from({ length: 9 }, (_, i) => ({
        id: `member-${i}`,
        name: `Member ${i}`,
        instructions: `Instructions for member ${i}`,
      })),
    };

    const result = TeamCreateInputSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('should reject input with missing required fields', () => {
    const input = {
      teamName: 'incomplete',
    };

    const result = TeamCreateInputSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('should reject member without required id', () => {
    const input = {
      teamName: 'bad-member',
      description: 'Test',
      task: 'Test',
      members: [
        {
          name: 'No ID',
          instructions: 'Missing id field',
        },
      ],
    };

    const result = TeamCreateInputSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('should accept exactly 8 members (boundary)', () => {
    const input = {
      teamName: 'max-team',
      description: 'Maximum allowed members',
      task: 'Do something',
      members: Array.from({ length: 8 }, (_, i) => ({
        id: `m${i}`,
        name: `Member ${i}`,
        instructions: `Role ${i}`,
      })),
    };

    const result = TeamCreateInputSchema.safeParse(input);
    expect(result.success).toBe(true);
  });
});
