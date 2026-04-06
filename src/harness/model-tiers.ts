/**
 * Model tier classification for team auto-assign.
 * Classifies available models by performance tier based on model name patterns.
 */

export type ModelTier = 'heavy' | 'medium' | 'light';

export interface TieredModel {
  id: string;
  provider: string;
  modelName: string;
  tier: ModelTier;
  hasApiKey: boolean;
}

// Pattern-based tier classification
const TIER_PATTERNS: Array<{ pattern: RegExp; tier: ModelTier }> = [
  // Heavy tier — flagship / reasoning models
  { pattern: /opus|o3|o4|ultra|max|pro-.*(?:1\.5|2)/i, tier: 'heavy' },
  // Light tier — fast / mini models
  { pattern: /mini|flash|haiku|nano|turbo|instant|fast/i, tier: 'light' },
  // Medium tier — default (sonnet, gpt-4o, etc.)
  // Everything else falls to medium
];

export function classifyTier(modelId: string): ModelTier {
  const modelName = modelId.split('/')[1] ?? modelId;
  for (const { pattern, tier } of TIER_PATTERNS) {
    if (pattern.test(modelName)) return tier;
  }
  return 'medium';
}

export function tierLabel(tier: ModelTier): string {
  switch (tier) {
    case 'heavy': return 'High-performance';
    case 'medium': return 'Balanced';
    case 'light': return 'Fast';
  }
}

/**
 * Classify a list of available models into tiers.
 * Filters to only models with API keys available.
 */
export function classifyModels(models: Array<{ id: string; provider: string; modelName: string; hasApiKey: boolean }>): TieredModel[] {
  return models
    .filter(m => m.hasApiKey)
    .map(m => ({
      ...m,
      tier: classifyTier(m.id),
    }));
}

/**
 * Get the best model ID for a given tier from classified models.
 * Returns the first model matching the tier, or falls back to any available model.
 */
export function getModelForTier(tiered: TieredModel[], tier: ModelTier): string | undefined {
  const match = tiered.find(m => m.tier === tier);
  if (match) return match.id;
  // Fallback: any available model
  return tiered[0]?.id;
}

/**
 * Task complexity keywords for auto-assign heuristics.
 */
const HEAVY_KEYWORDS = [
  'refactor', 'architect', 'design', 'implement', 'rewrite', 'migrate',
  'complex', 'critical', 'production', 'safety', 'security',
];
const LIGHT_KEYWORDS = [
  'search', 'find', 'list', 'format', 'simple', 'quick', 'check',
  'validate', 'count', 'summarize', 'extract',
];

export type TaskComplexity = 'heavy' | 'medium' | 'light';

/**
 * Infer task complexity from instructions and task description.
 * Uses keyword matching heuristics.
 */
export function inferComplexity(instructions: string, task: string): TaskComplexity {
  const text = `${instructions} ${task}`.toLowerCase();

  const heavyScore = HEAVY_KEYWORDS.filter(kw => text.includes(kw)).length;
  const lightScore = LIGHT_KEYWORDS.filter(kw => text.includes(kw)).length;

  if (heavyScore > lightScore + 1) return 'heavy';
  if (lightScore > heavyScore + 1) return 'light';
  return 'medium';
}

/**
 * Auto-assign models to team members based on task complexity.
 * Returns a map of member ID → model ID.
 */
export function autoAssignModels(
  members: Array<{ id: string; name: string; instructions: string; defaultModelId?: string }>,
  task: string,
  availableModels: Array<{ id: string; provider: string; modelName: string; hasApiKey: boolean }>,
): Map<string, string> {
  const tiered = classifyModels(availableModels);
  const assignments = new Map<string, string>();

  for (const member of members) {
    // If member already has a model specified, keep it
    if (member.defaultModelId) {
      assignments.set(member.id, member.defaultModelId);
      continue;
    }

    const complexity = inferComplexity(member.instructions, task);
    const modelId = getModelForTier(tiered, complexity);

    if (modelId) {
      assignments.set(member.id, modelId);
    }
  }

  return assignments;
}
