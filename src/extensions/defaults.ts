import type { Harness } from '@mastra/core/harness';
import { Workspace } from '@mastra/core/workspace';
import { discoverDefaultSkillPaths } from '../agents/workspace.js';
import type {
  HarnessMessagePayload,
  MastraCodeExtension,
  SkillDiscoveryContext,
  WorkspaceSkillListItem,
  WorkspaceSkillWarningSink,
} from './types.js';

const defaultWorkspaceSkillWarningSink: WorkspaceSkillWarningSink = {
  getWarnings() {
    return [];
  },
  clearWarnings() {},
  recordWarning() {},
};

function discoverSkillPaths(context: SkillDiscoveryContext): string[] {
  return discoverDefaultSkillPaths(context.projectPath);
}

async function initHarness(harness: Harness<any>): Promise<void> {
  await harness.init();
}

async function sendMessage(harness: Harness<any>, message: HarnessMessagePayload): Promise<unknown> {
  return harness.sendMessage(message);
}

async function listSkills(workspace: Workspace): Promise<WorkspaceSkillListItem[]> {
  return workspace.skills?.list() ?? [];
}

export const defaultMastraCodeExtension: MastraCodeExtension = {
  skillDiscoveryProvider: {
    discoverSkillPaths,
  },
  workspaceSkillWarningSink: defaultWorkspaceSkillWarningSink,
  workspaceAdapter: {
    listSkills,
  },
  harnessAdapter: {
    initHarness,
    sendMessage,
  },
};
