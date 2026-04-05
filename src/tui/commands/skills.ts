import fs from 'node:fs';
import path from 'node:path';
import { parse as parseYaml } from 'yaml';
import { SlashCommandComponent } from '../components/slash-command.js';
import type { WorkspaceSkillListItem } from '../../extensions/types.js';
import type { SlashCommandContext } from './types.js';

type SkillWarningItem = {
  summary: string;
  path?: string;
};

type SkillValidationResult = {
  errors: string[];
  warnings: string[];
};

const MAX_NAME_LENGTH = 64;
const MAX_DESCRIPTION_LENGTH = 1024;
const MAX_INSTRUCTION_LINES = 500;
const MAX_INSTRUCTION_TOKENS = 5000;
const WORKSPACE_SKILLS_WARNING_PREFIX = '[WorkspaceSkills]';
const WARNING_PREVIEW_COUNT = 3;
const INVALID_YAML = '__INVALID_YAML__';

function estimateTokenCount(text: string): number {
  return Math.ceil(text.length / 4);
}

function parseSkillFile(skillDir: string): { metadata: unknown; instructions: string } | null {
  const skillFile = path.join(skillDir, 'SKILL.md');
  if (!fs.existsSync(skillFile)) return null;

  const raw = fs.readFileSync(skillFile, 'utf-8');
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) {
    return { metadata: null, instructions: raw };
  }

  try {
    return {
      metadata: parseYaml(match[1] ?? ''),
      instructions: match[2] ?? '',
    };
  } catch {
    return { metadata: INVALID_YAML, instructions: match[2] ?? '' };
  }
}

function validateSkillMetadata(metadata: unknown, dirName?: string, instructions?: string): SkillValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (metadata === INVALID_YAML) {
    return { errors: ['Invalid YAML frontmatter'], warnings };
  }

  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return { errors: ['Missing or invalid YAML frontmatter'], warnings };
  }

  const data = metadata as Record<string, unknown>;
  const name = data.name;
  const description = data.description;
  const license = data.license;
  const meta = data.metadata;

  if (typeof name !== 'string') {
    errors.push(`name: Expected string, received ${typeof name}`);
  } else if (!name.trim()) {
    errors.push('name: Skill name cannot be empty');
  } else {
    if (name.length > MAX_NAME_LENGTH) errors.push(`name: Skill name must be at most ${MAX_NAME_LENGTH} characters`);
    if (!/^[a-z0-9-]+$/.test(name)) errors.push('name: Skill name can only contain lowercase letters, numbers, and hyphens');
    if (name.startsWith('-') || name.endsWith('-')) errors.push('name: Skill name must not start or end with a hyphen');
    if (name.includes('--')) errors.push('name: Skill name must not contain consecutive hyphens');
    if (dirName && name !== dirName) errors.push(`Skill name "${name}" must match directory name "${dirName}"`);
  }

  if (typeof description !== 'string') {
    errors.push(`description: Expected string, received ${typeof description}`);
  } else if (!description.trim()) {
    errors.push('description: Skill description cannot be only whitespace');
  } else if (description.length > MAX_DESCRIPTION_LENGTH) {
    errors.push(`description: Skill description must be at most ${MAX_DESCRIPTION_LENGTH} characters`);
  }

  if (license !== undefined && typeof license !== 'string') {
    errors.push(`license: Expected string, received ${Array.isArray(license) ? 'array' : typeof license}`);
  }

  if (meta !== undefined && (!meta || typeof meta !== 'object' || Array.isArray(meta))) {
    errors.push(`metadata: Expected object, received ${Array.isArray(meta) ? 'array' : typeof meta}`);
  }

  if (instructions) {
    const lineCount = instructions.split('\n').length;
    if (lineCount > MAX_INSTRUCTION_LINES) {
      warnings.push(`instructions: SKILL.md has ${lineCount} lines (recommended: <${MAX_INSTRUCTION_LINES}). Consider moving content to references/.`);
    }

    const tokenEstimate = estimateTokenCount(instructions);
    if (tokenEstimate > MAX_INSTRUCTION_TOKENS) {
      warnings.push(
        `instructions: Instructions have ~${tokenEstimate} estimated tokens (recommended: <${MAX_INSTRUCTION_TOKENS}). Consider moving content to references/.`,
      );
    }
  }

  return { errors, warnings };
}

function collectMetadataWarnings(skills: Array<{ path: string }>): SkillWarningItem[] {
  const warnings: SkillWarningItem[] = [];

  for (const skill of skills) {
    const skillDir = skill.path;
    const dirName = path.basename(skillDir);
    const parsed = parseSkillFile(skillDir);
    if (!parsed) continue;

    const result = validateSkillMetadata(parsed.metadata, dirName, parsed.instructions);
    for (const message of [...result.errors, ...result.warnings]) {
      warnings.push({ summary: `${dirName} — ${message}`, path: skillDir });
    }
  }

  return warnings;
}

function collectSuppressedWarnings(ctx: SlashCommandContext): SkillWarningItem[] {
  return ctx.extension.workspaceSkillWarningSink
    .getWarnings()
    .map((message: string) => message.trim())
    .filter(Boolean)
    .map((message: string) => {
      const cleaned = message.startsWith(WORKSPACE_SKILLS_WARNING_PREFIX)
        ? message.slice(WORKSPACE_SKILLS_WARNING_PREFIX.length).trim()
        : message;
      return { summary: cleaned };
    });
}

function dedupeWarnings(warnings: SkillWarningItem[]): SkillWarningItem[] {
  const seen = new Set<string>();
  const deduped: SkillWarningItem[] = [];

  for (const warning of warnings) {
    const key = `${warning.summary}::${warning.path ?? ''}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(warning);
  }

  return deduped;
}

function buildWarningsContent(warnings: SkillWarningItem[], expanded: boolean): string[] {
  const lines = [`Warnings: ${warnings.length}`];
  const visibleWarnings = expanded ? warnings : warnings.slice(0, WARNING_PREVIEW_COUNT);

  for (const warning of visibleWarnings) {
    lines.push(`- ${warning.summary}`);
    if (expanded && warning.path) {
      lines.push(`  path: ${warning.path}`);
    }
  }

  if (!expanded && warnings.length > WARNING_PREVIEW_COUNT) {
    lines.push(`...and ${warnings.length - WARNING_PREVIEW_COUNT} more`);
  }

  return lines;
}

class SkillsWarningsComponent extends SlashCommandComponent {
  private warnings: SkillWarningItem[];

  constructor(warnings: SkillWarningItem[]) {
    super('skills-warnings');
    this.warnings = warnings;
    this.contentLines = buildWarningsContent(warnings, false);
    this.rebuild();
  }

  override setExpanded(expanded: boolean): void {
    if (this.expanded === expanded) return;
    this.expanded = expanded;
    this.contentLines = buildWarningsContent(this.warnings, expanded);
    this.rebuild();
  }
}

function renderSlashBlock(ctx: SlashCommandContext, commandName: string, lines: string[], expanded: boolean): SlashCommandComponent {
  const component = new SlashCommandComponent(commandName, lines.join('\n'));
  component.setExpanded(expanded);
  ctx.state.allSlashCommandComponents.push(component);
  ctx.state.chatContainer.addChild(component);
  return component;
}

export async function handleSkillsCommand(ctx: SlashCommandContext): Promise<void> {
  let workspace = ctx.getResolvedWorkspace();
  if (!workspace && ctx.harness.hasWorkspace()) {
    try {
      workspace = await ctx.harness.resolveWorkspace();
    } catch (error) {
      ctx.showError(`Failed to resolve workspace: ${error instanceof Error ? error.message : String(error)}`);
      return;
    }
  }

  if (!workspace?.skills) {
    ctx.showInfo(
      'No skills configured.\n\n' +
        'Add skills to any of these locations:\n' +
        '  .mastracode/skills/   (project-local)\n' +
        '  .claude/skills/       (project-local)\n' +
        '  ~/.mastracode/skills/ (global)\n' +
        '  ~/.claude/skills/     (global)\n\n' +
        'Each skill is a folder with a SKILL.md file.\n' +
        'Install skills: npx add-skill <github-url>',
    );
    return;
  }

  try {
    const skills = await ctx.extension.workspaceAdapter.listSkills(workspace) as WorkspaceSkillListItem[];

    if (skills.length === 0) {
      ctx.showInfo(
        'No skills found in configured directories.\n\n' +
          'Each skill needs a SKILL.md file with YAML frontmatter.\n' +
          'Install skills: npx add-skill <github-url>',
      );
      return;
    }

    const warnings = dedupeWarnings([
      ...collectMetadataWarnings(skills.map(skill => ({ path: skill.path }))),
      ...collectSuppressedWarnings(ctx),
    ]);

    if (warnings.length > 0) {
      const warningsComponent = new SkillsWarningsComponent(warnings);
      ctx.state.allSlashCommandComponents.push(warningsComponent);
      ctx.state.chatContainer.addChild(warningsComponent);
    }

    const skillLines = [`${skills.length} skills available.`];
    for (const skill of skills) {
      skillLines.push(`- ${skill.name ?? path.basename(skill.path)}`);
      skillLines.push(`  path: ${skill.path}`);
      if (skill.description) {
        skillLines.push(`  description: ${skill.description}`);
      }
    }

    renderSlashBlock(ctx, 'skills', skillLines, false);
    ctx.state.ui.requestRender();
  } catch (error) {
    ctx.showError(`Failed to list skills: ${error instanceof Error ? error.message : String(error)}`);
  } finally {
    ctx.extension.workspaceSkillWarningSink.clearWarnings();
  }
}
