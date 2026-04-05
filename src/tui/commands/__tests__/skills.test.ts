import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { defaultMastraCodeExtension } from '../../../extensions/defaults.js';
import { handleSkillsCommand } from '../skills.js';

function createContext(tempDir: string, runtimeSkills: Array<{ name?: string; path: string; description?: string }>) {
  const warnings: string[] = [];
  const extension = {
    ...defaultMastraCodeExtension,
    workspaceSkillWarningSink: {
      getWarnings: () => [...warnings],
      clearWarnings: () => {
        warnings.length = 0;
      },
      recordWarning: (message: string) => {
        warnings.push(message);
      },
    },
    workspaceAdapter: {
      ...defaultMastraCodeExtension.workspaceAdapter,
      listSkills: vi.fn().mockResolvedValue(runtimeSkills),
    },
  };

  return {
    state: {
      toolOutputExpanded: false,
      allSlashCommandComponents: [],
      chatContainer: { addChild: vi.fn() },
      ui: { requestRender: vi.fn() },
      harness: {
        getState: () => ({ projectPath: tempDir }),
      },
    },
    harness: {
      hasWorkspace: () => true,
      resolveWorkspace: vi.fn().mockResolvedValue(undefined),
    },
    extension,
    getResolvedWorkspace: () => ({
      skills: {
        list: vi.fn().mockResolvedValue(runtimeSkills),
      },
    }),
    showInfo: vi.fn(),
    showError: vi.fn(),
  } as any;
}

describe('handleSkillsCommand', () => {
  let tempDir: string;

  beforeEach(() => {
    vi.resetAllMocks();
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mastra-skills-test-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('renders workspace runtime skills when available', async () => {
    const skillDir = path.join(tempDir, 'test-skill');
    fs.mkdirSync(skillDir, { recursive: true });
    fs.writeFileSync(
      path.join(skillDir, 'SKILL.md'),
      ['---', 'name: test-skill', 'description: Test description', '---', '', 'Body'].join('\n'),
    );

    const context = createContext(tempDir, [
      {
        name: 'test-skill',
        path: skillDir,
        description: 'Test description',
      },
    ]);

    await handleSkillsCommand(context);

    expect(context.showInfo).not.toHaveBeenCalled();
    expect(context.state.chatContainer.addChild).toHaveBeenCalledOnce();
    expect(context.state.allSlashCommandComponents).toHaveLength(1);
    expect(context.state.ui.requestRender).toHaveBeenCalledOnce();
  });

  it('shows no skills message when runtime workspace has no skills', async () => {
    const context = createContext('/unused', []);

    await handleSkillsCommand(context);

    expect(context.showInfo).toHaveBeenCalledWith(
      'No skills found in configured directories.\n\n' +
        'Each skill needs a SKILL.md file with YAML frontmatter.\n' +
        'Install skills: npx add-skill <github-url>',
    );
    expect(context.state.chatContainer.addChild).not.toHaveBeenCalled();
    expect(context.state.ui.requestRender).not.toHaveBeenCalled();
  });

  it('renders warnings for core-aligned metadata validation failures', async () => {
    const invalidSkillDir = path.join(tempDir, 'bad--skill');
    fs.mkdirSync(invalidSkillDir, { recursive: true });
    fs.writeFileSync(
      path.join(invalidSkillDir, 'SKILL.md'),
      ['---', 'name: bad--skill', 'description: "  "', 'license:', 'metadata: []', '---', '', 'Body'].join('\n'),
    );

    const context = createContext(tempDir, [{ path: invalidSkillDir }]);

    await handleSkillsCommand(context);

    expect(context.showInfo).not.toHaveBeenCalled();
    expect(context.state.chatContainer.addChild).toHaveBeenCalledTimes(2);
    expect(context.state.allSlashCommandComponents).toHaveLength(2);

    const warningsComponent = context.state.allSlashCommandComponents[0] as {
      contentLines: string[];
      expanded: boolean;
      commandName: string;
    };
    expect(warningsComponent.commandName).toBe('skills-warnings');
    expect(warningsComponent.expanded).toBe(false);
    expect(warningsComponent.contentLines).toEqual(
      expect.arrayContaining([
        expect.stringContaining('Warnings: 4'),
        expect.stringContaining('name: Skill name must not contain consecutive hyphens'),
        expect.stringContaining('description: Skill description cannot be only whitespace'),
        expect.stringContaining('license: Expected string, received object'),
        expect.stringContaining('...and 1 more'),
      ]),
    );
    expect(warningsComponent.contentLines.join('\n')).not.toContain(invalidSkillDir);
  });

  it('renders warnings for recommended instruction limits', async () => {
    const longSkillDir = path.join(tempDir, 'verbose-skill');
    fs.mkdirSync(longSkillDir, { recursive: true });
    fs.writeFileSync(
      path.join(longSkillDir, 'SKILL.md'),
      ['---', 'name: verbose-skill', 'description: Verbose skill', '---', '', ...Array.from({ length: 501 }, () => 'line')].join(
        '\n',
      ),
    );

    const context = createContext(tempDir, [{ path: longSkillDir }]);

    await handleSkillsCommand(context);

    const warningsComponent = context.state.allSlashCommandComponents[0] as {
      contentLines: string[];
      setExpanded: (expanded: boolean) => void;
    };
    expect(warningsComponent.contentLines).toEqual(
      expect.arrayContaining([expect.stringContaining('instructions: SKILL.md has 502 lines')]),
    );
    expect(warningsComponent.contentLines.join('\n')).not.toContain(longSkillDir);

    warningsComponent.setExpanded(true);
    expect(warningsComponent.contentLines.join('\n')).toContain(longSkillDir);
  });

  it('shows suppressed WorkspaceSkills warnings only inside the skills warning block', async () => {
    const skillDir = path.join(tempDir, 'preview-skill');
    fs.mkdirSync(skillDir, { recursive: true });
    fs.writeFileSync(
      path.join(skillDir, 'SKILL.md'),
      ['---', 'name: preview-skill', 'description: Preview skill', '---', '', 'Body'].join('\n'),
    );

    const context = createContext(tempDir, [{ path: skillDir }]);
    context.extension.workspaceSkillWarningSink.recordWarning(
      '[WorkspaceSkills] skill-creator: Instructions have ~6697 estimated tokens',
    );
    context.extension.workspaceSkillWarningSink.recordWarning('[WorkspaceSkills] another-skill: warning 2');
    context.extension.workspaceSkillWarningSink.recordWarning('[WorkspaceSkills] third-skill: warning 3');
    context.extension.workspaceSkillWarningSink.recordWarning('[WorkspaceSkills] fourth-skill: warning 4');

    await handleSkillsCommand(context);

    expect(context.state.allSlashCommandComponents).toHaveLength(2);

    const warningsComponent = context.state.allSlashCommandComponents[0] as {
      contentLines: string[];
      expanded: boolean;
      setExpanded: (expanded: boolean) => void;
    };

    expect(warningsComponent.expanded).toBe(false);
    expect(warningsComponent.contentLines).toEqual(
      expect.arrayContaining([
        'Warnings: 4',
        '- skill-creator: Instructions have ~6697 estimated tokens',
        '- another-skill: warning 2',
        '- third-skill: warning 3',
        '...and 1 more',
      ]),
    );
    expect(warningsComponent.contentLines.join('\n')).not.toContain('path:');

    warningsComponent.setExpanded(true);
    expect(warningsComponent.contentLines).toEqual(
      expect.arrayContaining([
        '- fourth-skill: warning 4',
      ]),
    );
  });
});
