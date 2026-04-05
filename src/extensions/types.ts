import type { Harness } from '@mastra/core/harness';
import { Workspace } from '@mastra/core/workspace';

export type SkillDiscoveryContext = {
  projectPath: string;
};

export interface SkillDiscoveryProvider {
  discoverSkillPaths(context: SkillDiscoveryContext): string[] | Promise<string[]>;
}

export interface WorkspaceSkillWarningSink {
  getWarnings(): string[];
  clearWarnings(): void;
  recordWarning(message: string): void;
}

export type HarnessMessagePayload = Parameters<Harness<any>['sendMessage']>[0];
export type WorkspaceSkillListItem = Awaited<ReturnType<NonNullable<Workspace['skills']>['list']>>[number];

export interface WorkspaceAdapter {
  listSkills(workspace: Workspace): Promise<WorkspaceSkillListItem[]>;
}

export interface HarnessAdapter {
  initHarness(harness: Harness<any>): Promise<void>;
  sendMessage(harness: Harness<any>, message: HarnessMessagePayload): Promise<unknown>;
}

export interface MastraCodeExtension {
  skillDiscoveryProvider: SkillDiscoveryProvider;
  workspaceSkillWarningSink: WorkspaceSkillWarningSink;
  workspaceAdapter: WorkspaceAdapter;
  harnessAdapter: HarnessAdapter;
}
