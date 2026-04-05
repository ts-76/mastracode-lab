import fs, { existsSync } from 'node:fs';
import os from 'node:os';
import path, { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { HarnessRequestContext } from '@mastra/core/harness';
import type { Mastra } from '@mastra/core/mastra';
import type { RequestContext } from '@mastra/core/request-context';
import { Workspace, LocalFilesystem, LocalSandbox } from '@mastra/core/workspace';
import type { LSPConfig } from '@mastra/core/workspace';
import { loadSettings } from '../onboarding/settings.js';
import type { stateSchema } from '../schema';
import { TOOL_NAME_OVERRIDES } from '../tool-names.js';
import { resolveMastraCodeExtension } from '../extensions/index.js';
import type { MastraCodeExtension } from '../extensions/types.js';

function collectSkillPaths(skillsDirs: string[]): string[] {
  const paths: string[] = [];
  const seen = new Set<string>();

  for (const skillsDir of skillsDirs) {
    if (!fs.existsSync(skillsDir)) continue;

    const resolved = fs.realpathSync(skillsDir);
    if (!seen.has(resolved)) {
      seen.add(resolved);
      paths.push(skillsDir);
    }

    try {
      const entries = fs.readdirSync(skillsDir, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isSymbolicLink()) continue;

        const linkPath = path.join(skillsDir, entry.name);
        const realPath = fs.realpathSync(linkPath);
        const stat = fs.statSync(realPath);
        if (!stat.isDirectory()) continue;

        const realParent = path.dirname(realPath);
        if (!seen.has(realParent)) {
          seen.add(realParent);
          paths.push(realParent);
        }
      }
    } catch {
      // Ignore errors during symlink resolution
    }
  }

  return paths;
}

export function discoverDefaultSkillPaths(projectPath: string): string[] {
  return collectSkillPaths([
    path.join(projectPath, '.mastracode', 'skills'),
    path.join(projectPath, '.claude', 'skills'),
    path.join(os.homedir(), '.mastracode', 'skills'),
    path.join(os.homedir(), '.claude', 'skills'),
  ]);
}

export const skillPaths = discoverDefaultSkillPaths(process.cwd());

const WORKSPACE_ID_PREFIX = 'mastra-code-workspace';

function detectPackageRunner(projectPath: string): string | undefined {
  if (existsSync(join(projectPath, 'pnpm-lock.yaml'))) return 'pnpm dlx';
  if (existsSync(join(projectPath, 'bun.lockb')) || existsSync(join(projectPath, 'bun.lock'))) return 'bunx';
  if (existsSync(join(projectPath, 'yarn.lock'))) return 'yarn dlx';
  if (existsSync(join(projectPath, 'package-lock.json'))) return 'npx --yes';
  return 'npx --yes';
}

export async function createDynamicWorkspace({
  requestContext,
  mastra,
  skillPaths: providedSkillPaths,
  extension,
}: {
  requestContext: RequestContext;
  mastra?: Mastra;
  skillPaths?: string[];
  extension?: Partial<MastraCodeExtension> | MastraCodeExtension;
}) {
  const resolvedExtension = resolveMastraCodeExtension(extension);
  const ctx = requestContext.get('harness') as HarnessRequestContext<typeof stateSchema> | undefined;
  const state = ctx?.getState?.() as { projectPath?: string; sandboxAllowedPaths?: string[] } | undefined;
  const modeId = ctx?.modeId ?? 'build';
  const rawProjectPath = state?.projectPath;

  if (!rawProjectPath) {
    throw new Error('Project path is required');
  }

  const projectPath = path.resolve(rawProjectPath);
  const workspaceId = `${WORKSPACE_ID_PREFIX}-${projectPath}`;
  const sandboxPaths = state?.sandboxAllowedPaths ?? [];
  const resolvedSkillPaths =
    providedSkillPaths ?? (await resolvedExtension.skillDiscoveryProvider.discoverSkillPaths({ projectPath }));
  const allowedPaths = [...resolvedSkillPaths, ...sandboxPaths.map((p: string) => path.resolve(p))];
  const isPlanMode = modeId === 'plan';

  const planModeTools = {
    mastra_workspace_write_file: { ...TOOL_NAME_OVERRIDES.mastra_workspace_write_file, enabled: false },
    mastra_workspace_edit_file: { ...TOOL_NAME_OVERRIDES.mastra_workspace_edit_file, enabled: false },
    mastra_workspace_ast_edit: { ...TOOL_NAME_OVERRIDES.mastra_workspace_ast_edit, enabled: false },
  };

  let existing: Workspace<LocalFilesystem, LocalSandbox> | undefined;
  try {
    existing = mastra?.getWorkspaceById(workspaceId) as Workspace<LocalFilesystem, LocalSandbox>;
  } catch {
    // Not registered yet
  }

  if (existing) {
    existing.filesystem.setAllowedPaths(allowedPaths);
    existing.setToolsConfig(isPlanMode ? { ...TOOL_NAME_OVERRIDES, ...planModeTools } : TOOL_NAME_OVERRIDES);
    return existing;
  }

  const userLsp = loadSettings().lsp ?? {};
  const mcModulePath = join(dirname(fileURLToPath(import.meta.url)), '..');
  const lspConfig: LSPConfig = {
    ...userLsp,
    packageRunner: userLsp.packageRunner || detectPackageRunner(projectPath),
    searchPaths: [mcModulePath, ...(userLsp.searchPaths ?? [])],
  };

  return new Workspace({
    id: workspaceId,
    name: 'Mastra Code Workspace',
    filesystem: new LocalFilesystem({
      basePath: projectPath,
      allowedPaths,
    }),
    sandbox: new LocalSandbox({
      workingDirectory: projectPath,
      env: {
        ...process.env,
        FORCE_COLOR: '1',
        CLICOLOR_FORCE: '1',
        TERM: process.env.TERM || 'xterm-256color',
        CI: 'true',
        NONINTERACTIVE: '1',
        DEBIAN_FRONTEND: 'noninteractive',
      },
    }),
    tools: isPlanMode ? { ...TOOL_NAME_OVERRIDES, ...planModeTools } : TOOL_NAME_OVERRIDES,
    ...(resolvedSkillPaths.length > 0 ? { skills: resolvedSkillPaths } : {}),
    lsp: lspConfig,
  });
}

export async function getDynamicWorkspace({
  requestContext,
  mastra,
  extension,
}: {
  requestContext: RequestContext;
  mastra?: Mastra;
  extension?: Partial<MastraCodeExtension> | MastraCodeExtension;
}) {
  return createDynamicWorkspace({ requestContext, mastra, extension });
}

export function recordSuppressedWorkspaceSkillWarning(message: string, extension?: Partial<MastraCodeExtension>): void {
  resolveMastraCodeExtension(extension).workspaceSkillWarningSink.recordWarning(message);
}

export function getSuppressedWorkspaceSkillWarnings(extension?: Partial<MastraCodeExtension>): string[] {
  return resolveMastraCodeExtension(extension).workspaceSkillWarningSink.getWarnings();
}

export function clearSuppressedWorkspaceSkillWarnings(extension?: Partial<MastraCodeExtension>): void {
  resolveMastraCodeExtension(extension).workspaceSkillWarningSink.clearWarnings();
}

