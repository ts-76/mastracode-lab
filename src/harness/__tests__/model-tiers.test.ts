import { describe, it, expect } from 'vitest';
import {
  classifyTier,
  classifyModels,
  inferComplexity,
  autoAssignModels,
  getModelForTier,
  type TieredModel,
} from '../model-tiers.js';

describe('classifyTier', () => {
  it('classifies opus models as heavy', () => {
    expect(classifyTier('anthropic/claude-opus-4-6')).toBe('heavy');
  });

  it('classifies o3/o4 models as heavy', () => {
    expect(classifyTier('openai/o3')).toBe('heavy');
    expect(classifyTier('openai/o4-mini')).toBe('heavy'); // o4 matches before mini
  });

  it('classifies haiku models as light', () => {
    expect(classifyTier('anthropic/claude-haiku-4')).toBe('light');
  });

  it('classifies flash models as light', () => {
    expect(classifyTier('google/gemini-2.0-flash')).toBe('light');
  });

  it('classifies sonnet models as medium', () => {
    expect(classifyTier('anthropic/claude-sonnet-4-20250514')).toBe('medium');
  });

  it('classifies gpt-4o as medium', () => {
    expect(classifyTier('openai/gpt-4o')).toBe('medium');
  });

  it('classifies unknown models as medium', () => {
    expect(classifyTier('custom/my-model-v1')).toBe('medium');
  });
});

describe('classifyModels', () => {
  const models = [
    { id: 'anthropic/claude-opus-4-6', provider: 'anthropic', modelName: 'claude-opus-4-6', hasApiKey: true },
    { id: 'anthropic/claude-sonnet-4', provider: 'anthropic', modelName: 'claude-sonnet-4', hasApiKey: true },
    { id: 'anthropic/claude-haiku-4', provider: 'anthropic', modelName: 'claude-haiku-4', hasApiKey: false },
    { id: 'openai/gpt-4o', provider: 'openai', modelName: 'gpt-4o', hasApiKey: true },
  ];

  it('filters out models without API keys', () => {
    const result = classifyModels(models);
    expect(result).toHaveLength(3);
    expect(result.every(m => m.hasApiKey)).toBe(true);
  });

  it('assigns correct tiers', () => {
    const result = classifyModels(models);
    expect(result.find(m => m.id.includes('opus'))?.tier).toBe('heavy');
    expect(result.find(m => m.id.includes('sonnet'))?.tier).toBe('medium');
    expect(result.find(m => m.id.includes('gpt'))?.tier).toBe('medium');
  });
});

describe('inferComplexity', () => {
  it('infers heavy complexity for refactoring tasks', () => {
    expect(inferComplexity('Refactor the authentication module', 'Implement complex changes')).toBe('heavy');
  });

  it('infers light complexity for search tasks', () => {
    expect(inferComplexity('Find and list all TODOs', 'Quick check')).toBe('light');
  });

  it('defaults to medium complexity', () => {
    expect(inferComplexity('Review the code changes', 'Standard review')).toBe('medium');
  });
});

describe('autoAssignModels', () => {
  const members = [
    { id: 'researcher', name: 'Researcher', instructions: 'Search and find relevant information quickly', defaultModelId: undefined },
    { id: 'implementer', name: 'Implementer', instructions: 'Implement the complex refactoring changes', defaultModelId: undefined },
    { id: 'reviewer', name: 'Reviewer', instructions: 'Review code changes', defaultModelId: undefined },
  ];

  const models = [
    { id: 'anthropic/claude-opus-4-6', provider: 'anthropic', modelName: 'claude-opus-4-6', hasApiKey: true },
    { id: 'anthropic/claude-sonnet-4', provider: 'anthropic', modelName: 'claude-sonnet-4', hasApiKey: true },
    { id: 'anthropic/claude-haiku-4', provider: 'anthropic', modelName: 'claude-haiku-4', hasApiKey: true },
  ];

  it('respects existing defaultModelId', () => {
    const membersWithOverride = [
      { id: 'custom', name: 'Custom', instructions: 'Do stuff', defaultModelId: 'openai/gpt-4o' },
    ];
    const result = autoAssignModels(membersWithOverride, 'task', models);
    expect(result.get('custom')).toBe('openai/gpt-4o');
  });

  it('assigns different models based on task complexity', () => {
    const result = autoAssignModels(members, 'Implement the feature', models);
    // Researcher (light) should get haiku
    expect(result.get('researcher')).toContain('haiku');
    // Implementer (heavy) should get opus
    expect(result.get('implementer')).toContain('opus');
    // Reviewer (medium) should get sonnet
    expect(result.get('reviewer')).toContain('sonnet');
  });
});

describe('getModelForTier', () => {
  const tiered: TieredModel[] = [
    { id: 'anthropic/claude-opus-4-6', provider: 'anthropic', modelName: 'claude-opus-4-6', tier: 'heavy', hasApiKey: true },
    { id: 'anthropic/claude-sonnet-4', provider: 'anthropic', modelName: 'claude-sonnet-4', tier: 'medium', hasApiKey: true },
    { id: 'anthropic/claude-haiku-4', provider: 'anthropic', modelName: 'claude-haiku-4', tier: 'light', hasApiKey: true },
  ];

  it('returns model matching tier', () => {
    expect(getModelForTier(tiered, 'heavy')).toBe('anthropic/claude-opus-4-6');
    expect(getModelForTier(tiered, 'medium')).toBe('anthropic/claude-sonnet-4');
    expect(getModelForTier(tiered, 'light')).toBe('anthropic/claude-haiku-4');
  });

  it('falls back to first model when tier not available', () => {
    const onlyHeavy: TieredModel[] = [
      { id: 'anthropic/claude-opus-4-6', provider: 'anthropic', modelName: 'claude-opus-4-6', tier: 'heavy', hasApiKey: true },
    ];
    expect(getModelForTier(onlyHeavy, 'light')).toBe('anthropic/claude-opus-4-6');
  });

  it('returns undefined for empty list', () => {
    expect(getModelForTier([], 'heavy')).toBeUndefined();
  });
});
