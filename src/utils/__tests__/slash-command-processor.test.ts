import { execSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { processSlashCommand } from '../slash-command-processor.js';
import type { SlashCommandMetadata } from '../slash-command-loader.js';

const tempDirs: string[] = [];

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

function createGitRepo(): string {
  const repoDir = mkdtempSync(path.join(tmpdir(), 'mastracode-slash-command-'));
  tempDirs.push(repoDir);
  execSync('git init -q', { cwd: repoDir });
  return repoDir;
}

function createCommand(template: string): SlashCommandMetadata {
  return {
    name: 'test',
    description: 'test',
    template,
    sourcePath: '/tmp/test.md',
  };
}

describe('processSlashCommand file references', () => {
  it('reads files from inside the current repo', async () => {
    const repoDir = createGitRepo();
    writeFileSync(path.join(repoDir, 'direct.txt'), 'direct content', 'utf-8');

    const result = await processSlashCommand(createCommand('before @direct.txt after'), [], repoDir);

    expect(result).toBe('before direct content after');
  });

  it('reads repo-internal symlink targets', async () => {
    const repoDir = createGitRepo();
    writeFileSync(path.join(repoDir, 'target.txt'), 'linked content', 'utf-8');
    symlinkSync('target.txt', path.join(repoDir, 'linked.txt'));

    const result = await processSlashCommand(createCommand('@linked.txt'), [], repoDir);

    expect(result).toBe('linked content');
  });

  it('rejects symlinks that point outside the repo', async () => {
    const repoDir = createGitRepo();
    const outsideDir = mkdtempSync(path.join(tmpdir(), 'mastracode-slash-command-outside-'));
    tempDirs.push(outsideDir);
    writeFileSync(path.join(outsideDir, 'outside.txt'), 'outside content', 'utf-8');
    symlinkSync(path.join(outsideDir, 'outside.txt'), path.join(repoDir, 'external.txt'));

    const result = await processSlashCommand(createCommand('@external.txt'), [], repoDir);

    expect(result).toBe('[Error: Could not read "external.txt"]');
  });

  it('rejects paths that traverse outside the repo', async () => {
    const repoDir = createGitRepo();
    const workspaceDir = path.join(repoDir, 'nested');
    mkdirSync(workspaceDir);
    const outsideDir = mkdtempSync(path.join(tmpdir(), 'mastracode-slash-command-parent-'));
    tempDirs.push(outsideDir);
    writeFileSync(path.join(outsideDir, 'outside.txt'), 'outside content', 'utf-8');

    const relativePath = path.relative(workspaceDir, path.join(outsideDir, 'outside.txt'));
    const result = await processSlashCommand(createCommand(`@${relativePath}`), [], workspaceDir);

    expect(result).toBe(`[Error: Could not read "${relativePath}"]`);
  });
});
