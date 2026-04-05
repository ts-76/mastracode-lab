import { defaultMastraCodeExtension } from './defaults.js';
import type { MastraCodeExtension } from './types.js';

export * from './types.js';
export { defaultMastraCodeExtension } from './defaults.js';

export function resolveMastraCodeExtension(extension?: Partial<MastraCodeExtension>): MastraCodeExtension {
  return {
    skillDiscoveryProvider: extension?.skillDiscoveryProvider ?? defaultMastraCodeExtension.skillDiscoveryProvider,
    workspaceSkillWarningSink: extension?.workspaceSkillWarningSink ?? defaultMastraCodeExtension.workspaceSkillWarningSink,
    workspaceAdapter: extension?.workspaceAdapter ?? defaultMastraCodeExtension.workspaceAdapter,
    harnessAdapter: extension?.harnessAdapter ?? defaultMastraCodeExtension.harnessAdapter,
  };
}
