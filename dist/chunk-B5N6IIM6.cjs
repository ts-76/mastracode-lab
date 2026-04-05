'use strict';

var chunk4H755EGM_cjs = require('./chunk-4H755EGM.cjs');
var fs = require('fs');
var path = require('path');
var chalk = require('chalk');

function _interopDefault (e) { return e && e.__esModule ? e : { default: e }; }

function _interopNamespace(e) {
  if (e && e.__esModule) return e;
  var n = Object.create(null);
  if (e) {
    Object.keys(e).forEach(function (k) {
      if (k !== 'default') {
        var d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: function () { return e[k]; }
        });
      }
    });
  }
  n.default = e;
  return Object.freeze(n);
}

var fs__namespace = /*#__PURE__*/_interopNamespace(fs);
var path__namespace = /*#__PURE__*/_interopNamespace(path);
var chalk__default = /*#__PURE__*/_interopDefault(chalk);

var MEMORY_GATEWAY_PROVIDER = "mastra-gateway";
var MEMORY_GATEWAY_DEFAULT_URL = "https://gateway-api.mastra.ai";
var STORAGE_DEFAULTS = {
  backend: "libsql",
  libsql: {},
  pg: {}
};
var DEFAULTS = {
  onboarding: {
    completedAt: null,
    skippedAt: null,
    version: 0,
    modePackId: null,
    omPackId: null
  },
  models: {
    activeModelPackId: null,
    modeDefaults: {},
    activeOmPackId: null,
    omModelOverride: null,
    omObservationThreshold: null,
    omReflectionThreshold: null,
    subagentModels: {}
  },
  preferences: {
    yolo: null,
    theme: "auto",
    thinkingLevel: "off",
    quietMode: false
  },
  storage: { ...STORAGE_DEFAULTS },
  customModelPacks: [],
  customProviders: [],
  modelUseCounts: {},
  updateDismissedVersion: null,
  memoryGateway: {},
  lsp: {}
};
var THINKING_LEVEL_VALUES = ["off", "low", "medium", "high", "xhigh"];
function parseThinkingLevel(value) {
  return typeof value === "string" && THINKING_LEVEL_VALUES.includes(value) ? value : DEFAULTS.preferences.thinkingLevel;
}
function parsePreferences(rawPreferences) {
  const raw = rawPreferences && typeof rawPreferences === "object" ? rawPreferences : {};
  return {
    ...DEFAULTS.preferences,
    ...raw,
    thinkingLevel: parseThinkingLevel(raw.thinkingLevel)
  };
}
function getSettingsPath() {
  return path.join(chunk4H755EGM_cjs.getAppDataDir(), "settings.json");
}
function getCustomProviderId(name) {
  const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return slug || "provider";
}
function toCustomProviderModelId(providerName, modelName) {
  const providerId = getCustomProviderId(providerName);
  const trimmedModelName = modelName.trim();
  const providerPrefix = `${providerId}/`;
  if (trimmedModelName.startsWith(providerPrefix)) {
    return trimmedModelName;
  }
  return `${providerId}/${trimmedModelName}`;
}
function parseCustomProviders(rawProviders) {
  if (!Array.isArray(rawProviders)) return [];
  const parsedProviders = [];
  for (const rawProvider of rawProviders) {
    if (!rawProvider || typeof rawProvider !== "object") continue;
    const candidate = rawProvider;
    const name = typeof candidate.name === "string" ? candidate.name.trim() : "";
    const url = typeof candidate.url === "string" ? candidate.url.trim() : "";
    if (!name || !url) continue;
    const providerId = getCustomProviderId(name);
    const models = Array.isArray(candidate.models) ? [
      ...new Set(
        candidate.models.filter((model) => typeof model === "string").map((model) => model.trim()).map((model) => {
          const providerPrefix = `${providerId}/`;
          if (model.startsWith(providerPrefix)) {
            return model.slice(providerPrefix.length);
          }
          return model;
        })
      )
    ].filter((model) => model.length > 0) : [];
    const apiKey = typeof candidate.apiKey === "string" && candidate.apiKey.trim().length > 0 ? candidate.apiKey.trim() : void 0;
    parsedProviders.push({
      name,
      url,
      ...apiKey ? { apiKey } : {},
      models
    });
  }
  return parsedProviders;
}
function migrateFromAuth(settingsPath) {
  var _a, _b;
  const authPath = path.join(chunk4H755EGM_cjs.getAppDataDir(), "auth.json");
  if (!fs.existsSync(authPath)) return false;
  let authData;
  try {
    authData = JSON.parse(fs.readFileSync(authPath, "utf-8"));
  } catch {
    return false;
  }
  const modelKeys = Object.keys(authData).filter((k) => k.startsWith("_"));
  if (modelKeys.length === 0) return false;
  let settings;
  if (fs.existsSync(settingsPath)) {
    try {
      const raw = JSON.parse(fs.readFileSync(settingsPath, "utf-8"));
      settings = {
        onboarding: { ...DEFAULTS.onboarding, ...raw.onboarding },
        models: { ...DEFAULTS.models, ...raw.models },
        preferences: parsePreferences(raw.preferences),
        storage: {
          ...STORAGE_DEFAULTS,
          ...raw.storage,
          libsql: { ...STORAGE_DEFAULTS.libsql, ...(_a = raw.storage) == null ? void 0 : _a.libsql },
          pg: { ...STORAGE_DEFAULTS.pg, ...(_b = raw.storage) == null ? void 0 : _b.pg }
        },
        customModelPacks: Array.isArray(raw.customModelPacks) ? raw.customModelPacks : [],
        customProviders: parseCustomProviders(raw.customProviders),
        modelUseCounts: raw.modelUseCounts && typeof raw.modelUseCounts === "object" ? raw.modelUseCounts : {},
        updateDismissedVersion: typeof raw.updateDismissedVersion === "string" ? raw.updateDismissedVersion : null,
        memoryGateway: raw.memoryGateway && typeof raw.memoryGateway === "object" ? raw.memoryGateway : {},
        lsp: raw.lsp && typeof raw.lsp === "object" ? raw.lsp : void 0
      };
    } catch {
      settings = structuredClone(DEFAULTS);
    }
  } else {
    settings = structuredClone(DEFAULTS);
  }
  if (authData._modelRanks && typeof authData._modelRanks === "object") {
    settings.modelUseCounts = { ...authData._modelRanks, ...settings.modelUseCounts };
  }
  for (const key of modelKeys) {
    const modeMatch = key.match(/^_modeModelId_(.+)$/);
    if ((modeMatch == null ? void 0 : modeMatch[1]) && typeof authData[key] === "string" && !settings.models.modeDefaults[modeMatch[1]]) {
      settings.models.modeDefaults[modeMatch[1]] = authData[key];
    }
  }
  for (const key of modelKeys) {
    if (key === "_subagentModelId" && typeof authData[key] === "string" && !settings.models.subagentModels["default"]) {
      settings.models.subagentModels["default"] = authData[key];
    }
    const saMatch = key.match(/^_subagentModelId_(.+)$/);
    if ((saMatch == null ? void 0 : saMatch[1]) && typeof authData[key] === "string" && !settings.models.subagentModels[saMatch[1]]) {
      settings.models.subagentModels[saMatch[1]] = authData[key];
    }
  }
  saveSettings(settings, settingsPath);
  for (const key of modelKeys) {
    delete authData[key];
  }
  try {
    fs.writeFileSync(authPath, JSON.stringify(authData, null, 2), "utf-8");
  } catch {
  }
  return true;
}
var LEGACY_VARIED_MODELS = {
  plan: "openai/gpt-5.4",
  build: "anthropic/claude-sonnet-4-5",
  fast: "anthropic/claude-haiku-4-5"
};
function migrateLegacyVariedPack(settings) {
  const legacyPackId = "varied";
  const customPackId = "custom:varied";
  const hasLegacyReference = settings.models.activeModelPackId === legacyPackId || settings.onboarding.modePackId === legacyPackId;
  if (!hasLegacyReference) return false;
  const existingIdx = settings.customModelPacks.findIndex((p) => p.name === "varied");
  if (existingIdx >= 0) {
    const existing = settings.customModelPacks[existingIdx];
    const modelsMatch = Object.entries(LEGACY_VARIED_MODELS).every(([k, v]) => existing.models[k] === v);
    if (!modelsMatch) {
      existing.models = { ...LEGACY_VARIED_MODELS };
    }
  } else {
    settings.customModelPacks.push({
      name: "varied",
      models: { ...LEGACY_VARIED_MODELS },
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    });
  }
  if (settings.models.activeModelPackId === legacyPackId) {
    settings.models.activeModelPackId = customPackId;
    if (Object.keys(settings.models.modeDefaults).length === 0) {
      settings.models.modeDefaults = { ...LEGACY_VARIED_MODELS };
    }
  }
  if (settings.onboarding.modePackId === legacyPackId) {
    settings.onboarding.modePackId = customPackId;
  }
  return true;
}
function loadSettings(filePath = getSettingsPath()) {
  var _a, _b, _c;
  migrateFromAuth(filePath);
  if (!fs.existsSync(filePath)) return structuredClone(DEFAULTS);
  try {
    const raw = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    const settings = {
      ...raw,
      onboarding: { ...DEFAULTS.onboarding, ...raw.onboarding },
      models: { ...DEFAULTS.models, ...raw.models },
      preferences: parsePreferences(raw.preferences),
      storage: {
        ...STORAGE_DEFAULTS,
        ...raw.storage,
        libsql: { ...STORAGE_DEFAULTS.libsql, ...(_a = raw.storage) == null ? void 0 : _a.libsql },
        pg: { ...STORAGE_DEFAULTS.pg, ...(_b = raw.storage) == null ? void 0 : _b.pg }
      },
      customModelPacks: Array.isArray(raw.customModelPacks) ? raw.customModelPacks : [],
      customProviders: parseCustomProviders(raw.customProviders),
      modelUseCounts: raw.modelUseCounts && typeof raw.modelUseCounts === "object" ? raw.modelUseCounts : {},
      updateDismissedVersion: typeof raw.updateDismissedVersion === "string" ? raw.updateDismissedVersion : null,
      memoryGateway: raw.memoryGateway && typeof raw.memoryGateway === "object" ? raw.memoryGateway : {},
      lsp: raw.lsp && typeof raw.lsp === "object" ? raw.lsp : void 0
    };
    let settingsChanged = false;
    if (((_c = raw.models) == null ? void 0 : _c.omModelId) && !settings.models.omModelOverride) {
      settings.models.omModelOverride = raw.models.omModelId;
      settingsChanged = true;
    }
    if (migrateLegacyVariedPack(settings)) {
      settingsChanged = true;
    }
    if (settingsChanged) {
      saveSettings(settings, filePath);
    }
    return settings;
  } catch {
    return structuredClone(DEFAULTS);
  }
}
var THREAD_ACTIVE_MODEL_PACK_ID_KEY = "activeModelPackId";
function parseThreadSettings(metadata) {
  const modeModelIds = {};
  for (const [key, value] of Object.entries(metadata ?? {})) {
    const modeMatch = key.match(/^modeModelId_(.+)$/);
    if ((modeMatch == null ? void 0 : modeMatch[1]) && typeof value === "string" && value.length > 0) {
      modeModelIds[modeMatch[1]] = value;
    }
  }
  const rawPackId = metadata == null ? void 0 : metadata[THREAD_ACTIVE_MODEL_PACK_ID_KEY];
  const activeModelPackId = typeof rawPackId === "string" && rawPackId.length > 0 ? rawPackId : null;
  return {
    activeModelPackId,
    modeModelIds
  };
}
function resolveThreadActiveModelPackId(settings, builtinPacks, metadata) {
  const threadSettings = parseThreadSettings(metadata);
  const isKnownPack = (packId) => {
    if (packId.startsWith("custom:")) {
      const name = packId.slice("custom:".length);
      return settings.customModelPacks.some((p) => p.name === name);
    }
    return builtinPacks.some((p) => p.id === packId);
  };
  if (threadSettings.activeModelPackId && isKnownPack(threadSettings.activeModelPackId)) {
    return threadSettings.activeModelPackId;
  }
  const allPacks = [
    ...builtinPacks,
    ...settings.customModelPacks.map((p) => ({ id: `custom:${p.name}`, models: p.models }))
  ];
  for (const pack of allPacks) {
    const packEntries = Object.entries(pack.models);
    const threadEntries = Object.keys(threadSettings.modeModelIds);
    const matches = packEntries.length === threadEntries.length && packEntries.every(([modeId, modelId]) => threadSettings.modeModelIds[modeId] === modelId);
    if (matches) return pack.id;
  }
  if (settings.models.activeModelPackId && isKnownPack(settings.models.activeModelPackId)) {
    return settings.models.activeModelPackId;
  }
  return null;
}
function resolveModelDefaults(settings, builtinPacks) {
  const { activeModelPackId, modeDefaults } = settings.models;
  if (!activeModelPackId) return modeDefaults;
  if (activeModelPackId.startsWith("custom:")) {
    const name = activeModelPackId.slice("custom:".length);
    const pack = settings.customModelPacks.find((p) => p.name === name);
    if (pack) return pack.models;
    return modeDefaults;
  }
  const builtin = builtinPacks.find((p) => p.id === activeModelPackId);
  if (builtin) return builtin.models;
  return modeDefaults;
}
function resolveOmModel(settings, builtinOmPacks) {
  const { activeOmPackId, omModelOverride } = settings.models;
  if (!activeOmPackId) return omModelOverride;
  if (activeOmPackId === "custom") return omModelOverride;
  const pack = builtinOmPacks.find((p) => p.id === activeOmPackId);
  if (pack) return pack.modelId;
  return omModelOverride;
}
function saveSettings(settings, filePath = getSettingsPath()) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, JSON.stringify(settings, null, 2), "utf-8");
}

// src/onboarding/packs.ts
function getAvailableModePacks(access, savedCustomPacks = []) {
  const packs = [];
  const openaiCodex = "openai/gpt-5.4";
  const openaiFast = "openai/gpt-5.4-mini";
  const anthropicBuild = access.anthropic === "oauth" ? "anthropic/claude-opus-4-6" : "anthropic/claude-sonnet-4-5";
  if (access.anthropic) {
    packs.push({
      id: "anthropic",
      name: "Anthropic",
      description: access.anthropic === "oauth" ? "All Anthropic models via Max subscription" : "All Anthropic models via API key",
      models: {
        build: anthropicBuild,
        plan: anthropicBuild,
        fast: "anthropic/claude-haiku-4-5"
      }
    });
  }
  if (access.openai) {
    packs.push({
      id: "openai",
      name: "OpenAI",
      description: access.openai === "oauth" ? "All OpenAI models via Codex subscription" : "All OpenAI models via API key",
      models: {
        build: openaiCodex,
        plan: openaiCodex,
        fast: openaiFast
      }
    });
  }
  for (const cp of savedCustomPacks) {
    packs.push({
      id: `custom:${cp.name}`,
      name: cp.name,
      description: "Saved custom pack",
      models: {
        build: cp.models.build ?? "",
        plan: cp.models.plan ?? "",
        fast: cp.models.fast ?? ""
      }
    });
  }
  const hasCustom = savedCustomPacks.length > 0;
  packs.push({
    id: "custom",
    name: hasCustom ? "New Custom" : "Custom",
    description: "Choose a model for each mode",
    models: { build: "", plan: "", fast: "" }
  });
  return packs;
}
function getAvailableOmPacks(access) {
  const packs = [];
  if (access.google) {
    packs.push({
      id: "gemini",
      name: "Gemini Flash",
      description: access.google === "oauth" ? "Via Google OAuth" : "Via Google API key",
      modelId: "google/gemini-2.5-flash"
    });
  }
  if (access.anthropic) {
    packs.push({
      id: "anthropic",
      name: "Claude Haiku",
      description: access.anthropic === "oauth" ? "Via Max subscription" : "Via Anthropic API key",
      modelId: "anthropic/claude-haiku-4-5"
    });
  }
  if (access.openai) {
    packs.push({
      id: "openai",
      name: "OpenAI Mini",
      description: access.openai === "oauth" ? "Via Codex subscription" : "Via OpenAI API key",
      modelId: "openai/gpt-5.4-mini"
    });
  }
  if (access.deepseek) {
    packs.push({
      id: "deepseek",
      name: "DeepSeek",
      description: "Via DeepSeek API key",
      modelId: "deepseek/deepseek-chat"
    });
  }
  packs.push({
    id: "custom",
    name: "Custom",
    description: "Choose any available model",
    modelId: ""
  });
  return packs;
}
var ONBOARDING_VERSION = 1;
var currentThemeMode = "dark";
function getThemeMode() {
  return currentThemeMode;
}
var mastraBrand = {
  purple: "#7f45e0",
  // #b588fe brand is too washed out for terminal
  green: "#16c858",
  // brand green (dark mode primary)
  orange: "#fdac53",
  pink: "#ff69cc",
  blue: "#2563eb",
  // #6ccdfb brand is to washed out
  red: "#DC5663",
  // #ff4758 too intense
  yellow: "#e7e67b"
};
var darkSurface = {
  bg: "#020202",
  antiGrid: "#0d0d0d",
  elevationSm: "#1a1a1a",
  elevationLg: "#141414",
  hover: "#262626",
  white: "#f0f0f0",
  specialGray: "#cccccc",
  mainGray: "#939393",
  darkGray: "#848484",
  borderAntiGrid: "#141414",
  borderElevation: "#1a1a1a"
};
var lightSurface = {
  bg: "#ffffff",
  antiGrid: "#eaeaea",
  elevationSm: "#ebebeb",
  elevationLg: "#f0f0f0",
  hover: "#e0e0e0",
  white: "#1a1a1a",
  specialGray: "#444444",
  mainGray: "#636363",
  darkGray: "#666666",
  borderAntiGrid: "#e5e5e5",
  borderElevation: "#e0e0e0"
};
function getSurface() {
  return currentThemeMode === "dark" ? darkSurface : lightSurface;
}
var detectedTerminalBg;
function getContrastBg() {
  return detectedTerminalBg ?? getSurface().bg;
}
var adaptedBrand = {};
var adaptedSurface = {};
var textSurfaceKeys = ["white", "specialGray", "mainGray", "darkGray"];
var textThemeKeys = [
  "accent",
  "success",
  "error",
  "warning",
  "muted",
  "dim",
  "text",
  "thinkingText",
  "userMessageText",
  "toolTitle",
  "toolOutput",
  "textHighlight",
  "path",
  "number",
  "function"
];
var TUI_MIN_CONTRAST = 5.5;
var TERM_WIDTH_BUFFER = 3;
var getTermWidth = () => (process.stdout.columns || 80) - TERM_WIDTH_BUFFER;
var CHAT_INDENT = 2;
var BOX_INDENT = 0;
var BOX_INDENT_STR = "";
var BRAND_MIN_CONTRAST = 4.5;
function computeAdaptedColors() {
  const bg2 = getContrastBg();
  adaptedBrand = {};
  for (const [key, value] of Object.entries(mastraBrand)) {
    adaptedBrand[key] = ensureContrast(value, bg2, BRAND_MIN_CONTRAST);
  }
  adaptedSurface = {};
  const surface = getSurface();
  for (const key of textSurfaceKeys) {
    adaptedSurface[key] = ensureContrast(surface[key], bg2, TUI_MIN_CONTRAST);
  }
  const baseTheme = currentThemeMode === "light" ? lightTheme : darkTheme;
  const adapted = { ...baseTheme };
  for (const key of textThemeKeys) {
    adapted[key] = ensureContrast(baseTheme[key], bg2, TUI_MIN_CONTRAST);
  }
  currentTheme = adapted;
}
var mastra = new Proxy({}, {
  get(_target, prop) {
    if (prop in mastraBrand) {
      return adaptedBrand[prop] ?? mastraBrand[prop];
    }
    if (prop in adaptedSurface) {
      return adaptedSurface[prop];
    }
    const surface = getSurface();
    if (prop in surface) {
      return surface[prop];
    }
    return void 0;
  }
});
function tintHex(hex, factor) {
  const r = Math.floor(parseInt(hex.slice(1, 3), 16) * factor);
  const g = Math.floor(parseInt(hex.slice(3, 5), 16) * factor);
  const b = Math.floor(parseInt(hex.slice(5, 7), 16) * factor);
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}
var darkTheme = {
  // Core UI
  accent: "#16c858",
  // Brand green
  border: "#3f3f46",
  borderAccent: "#16c858",
  borderMuted: "#27272a",
  success: "#22c55e",
  error: "#ef4444",
  warning: "#f59e0b",
  muted: "#8c8c94",
  dim: "#84848c",
  text: "#fafafa",
  thinkingText: "#a1a1aa",
  // User messages
  userMessageBg: "#0f172a",
  // Slate blue
  userMessageText: "#fafafa",
  // System reminders
  systemReminderBg: "#1a1400",
  // Dark orange tint
  // Tool execution
  toolPendingBg: "#0a1a10",
  // Dark green tint (matches brand accent)
  toolSuccessBg: "#0a1a10",
  // Dark green tint (same as pending)
  toolErrorBg: "#1f0a0a",
  // Dark red tint
  toolBorderPending: "#52525b",
  // Zinc-600 dim grey for pending
  toolBorderSuccess: "#52525b",
  // Zinc-600 dim grey for success
  toolBorderError: "#ef4444",
  // Red for error
  toolTitle: "#fb923c",
  // Amber for tool names
  toolArgs: "#ffe4c4",
  // Bisque (warm cream) for tool arguments
  toolOutput: "#d4d4d8",
  textHighlight: "#c084fc",
  // Lavender for inline code, headings, links
  // Error display
  errorBg: "#291415",
  // Slightly lighter than toolErrorBg for contrast
  path: "#9ca3af",
  // Gray for file paths
  number: "#fbbf24",
  // Yellow for line numbers
  function: "#60a5fa",
  // Light blue for function names
  // Selection
  selectedBg: darkSurface.hover,
  // Overlays
  overlayBg: darkSurface.antiGrid
};
var lightTheme = {
  // Core UI
  accent: "#0d8020",
  // Brand green (light mode)
  border: "#d4d4d8",
  borderAccent: "#0d8020",
  borderMuted: "#e4e4e7",
  success: "#15803d",
  error: "#dc2626",
  warning: "#d97706",
  muted: "#595961",
  dim: "#67676f",
  text: "#18181b",
  thinkingText: "#595961",
  // User messages
  userMessageBg: "#f0fdf4",
  // Light green tint
  userMessageText: "#18181b",
  // System reminders
  systemReminderBg: "#fefce8",
  // Light yellow
  // Tool execution
  toolPendingBg: "#f0fdf4",
  // Light green tint (matches brand accent)
  toolSuccessBg: "#f0fdf4",
  // Light green tint (same as pending)
  toolErrorBg: "#fef2f2",
  // Light red
  toolBorderPending: "#a1a1aa",
  // Zinc-400 dim grey for pending
  toolBorderSuccess: "#a1a1aa",
  // Zinc-400 dim grey for success
  toolBorderError: "#dc2626",
  // Red for error
  toolTitle: "#c2410c",
  // Deep amber for light backgrounds
  toolArgs: "#92400e",
  // Deep amber-brown for light backgrounds
  toolOutput: "#3f3f46",
  textHighlight: "#7c3aed",
  // Deep violet for light backgrounds
  // Error display
  errorBg: "#fef2f2",
  // Light red
  path: "#6b7280",
  // Gray for file paths
  number: "#b45309",
  // Amber for line numbers
  function: "#2563eb",
  // Blue for function names
  // Selection
  selectedBg: lightSurface.hover,
  // Overlays
  overlayBg: lightSurface.antiGrid
};
var currentTheme = darkTheme;
computeAdaptedColors();
function getTheme() {
  return currentTheme;
}
function setTheme(colors) {
  currentTheme = colors;
}
function applyThemeMode(mode, terminalBgHex) {
  currentThemeMode = mode;
  currentTheme = mode === "light" ? lightTheme : darkTheme;
  detectedTerminalBg = terminalBgHex;
  computeAdaptedColors();
  if (process.stdout.isTTY) {
    const textHex = currentTheme.text;
    const r = parseInt(textHex.slice(1, 3), 16);
    const g = parseInt(textHex.slice(3, 5), 16);
    const b = parseInt(textHex.slice(5, 7), 16);
    process.stdout.write(
      `\x1B]10;rgb:${r.toString(16).padStart(2, "0")}/${g.toString(16).padStart(2, "0")}/${b.toString(16).padStart(2, "0")}\x07`
    );
  }
}
function restoreTerminalForeground() {
  if (process.stdout.isTTY) {
    process.stdout.write("\x1B]110\x07");
  }
}
function fg(color, text) {
  const hex = currentTheme[color];
  if (!hex) return text;
  return chalk__default.default.hex(hex)(text);
}
function bg(color, text) {
  const hex = currentTheme[color];
  if (!hex) return text;
  return chalk__default.default.bgHex(hex)(text);
}
function bold(text) {
  return chalk__default.default.bold(text);
}
function italic(text) {
  return chalk__default.default.italic(text);
}
function dim(text) {
  return chalk__default.default.dim(text);
}
function linearize(c) {
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}
function parseHex(hex) {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16) / 255, parseInt(h.slice(2, 4), 16) / 255, parseInt(h.slice(4, 6), 16) / 255];
}
function toHex(r, g, b) {
  const clamp = (v) => Math.max(0, Math.min(255, Math.round(v)));
  return `#${clamp(r).toString(16).padStart(2, "0")}${clamp(g).toString(16).padStart(2, "0")}${clamp(b).toString(16).padStart(2, "0")}`;
}
function luminance(hex) {
  const [r, g, b] = parseHex(hex);
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}
function contrastRatio(hex1, hex2) {
  const l1 = luminance(hex1);
  const l2 = luminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}
function rgbToHsl(r, g, b) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return [h * 360, s, l];
}
function hslToRgb(h, s, l) {
  h = h / 360;
  if (s === 0) return [l, l, l];
  const hue2rgb = (p2, q2, t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p2 + (q2 - p2) * 6 * t;
    if (t < 1 / 2) return q2;
    if (t < 2 / 3) return p2 + (q2 - p2) * (2 / 3 - t) * 6;
    return p2;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return [hue2rgb(p, q, h + 1 / 3), hue2rgb(p, q, h), hue2rgb(p, q, h - 1 / 3)];
}
function ensureContrast(fgHex, bgHex, minRatio = 4.5) {
  if (contrastRatio(fgHex, bgHex) >= minRatio) return fgHex;
  const [r, g, b] = parseHex(fgHex);
  const [h, s, origL] = rgbToHsl(r, g, b);
  const origCR = contrastRatio(fgHex, bgHex);
  function searchDirection(lighten) {
    const targetL = lighten ? 1 : 0;
    const extreme = lighten ? "#ffffff" : "#000000";
    const extremeCR = contrastRatio(extreme, bgHex);
    if (extremeCR <= origCR) return { hex: fgHex, contrast: origCR };
    let lo = 0;
    let hi = 1;
    let best = fgHex;
    let bestCR = origCR;
    for (let i = 0; i < 20; i++) {
      const mid = (lo + hi) / 2;
      const newL = origL + (targetL - origL) * mid;
      const [nr, ng, nb] = hslToRgb(h, s, newL);
      const candidate = toHex(nr * 255, ng * 255, nb * 255);
      const cr = contrastRatio(candidate, bgHex);
      if (cr >= minRatio) {
        best = candidate;
        bestCR = cr;
        hi = mid;
      } else {
        lo = mid;
      }
    }
    if (bestCR < minRatio && extremeCR > bestCR) {
      if (bestCR >= minRatio * 0.65) {
        return { hex: best, contrast: bestCR };
      }
      return { hex: extreme, contrast: extremeCR };
    }
    return { hex: best, contrast: bestCR };
  }
  const whiteContrast = contrastRatio("#ffffff", bgHex);
  const blackContrast = contrastRatio("#000000", bgHex);
  const primaryLighten = whiteContrast >= blackContrast;
  const primaryResult = searchDirection(primaryLighten);
  if (primaryResult.contrast >= minRatio) return primaryResult.hex;
  const altResult = searchDirection(!primaryLighten);
  if (altResult.contrast >= minRatio) return altResult.hex;
  return primaryResult.contrast >= altResult.contrast ? primaryResult.hex : altResult.hex;
}
var theme = {
  fg,
  bg,
  bold,
  italic,
  dim,
  getTheme,
  setTheme
};
function getMarkdownTheme() {
  const t = getTheme();
  return {
    heading: (text) => chalk__default.default.hex(t.textHighlight).bold(text),
    link: (text) => chalk__default.default.hex(t.textHighlight)(text),
    linkUrl: (text) => chalk__default.default.hex(t.muted)(text),
    code: (text) => chalk__default.default.hex(t.textHighlight).bold(text),
    codeBlock: (text) => chalk__default.default.hex(t.text)(text),
    codeBlockBorder: (text) => chalk__default.default.hex(t.dim)(text),
    quote: (text) => chalk__default.default.hex(t.muted).italic(text),
    quoteBorder: (text) => chalk__default.default.hex(t.borderMuted)(text),
    hr: (text) => chalk__default.default.hex(t.borderMuted)(text),
    listBullet: (text) => chalk__default.default.hex(t.textHighlight)(text),
    // Required by MarkdownTheme interface
    bold: (text) => chalk__default.default.bold(text),
    italic: (text) => chalk__default.default.italic(text),
    strikethrough: (text) => chalk__default.default.strikethrough(text),
    underline: (text) => chalk__default.default.underline(text)
  };
}
function getEditorTheme() {
  const t = getTheme();
  return {
    borderColor: (text) => chalk__default.default.hex(getContrastBg())(text),
    selectList: {
      selectedPrefix: (text) => chalk__default.default.hex(t.accent)(text),
      selectedText: (text) => chalk__default.default.bgHex(t.selectedBg)(text),
      description: (text) => chalk__default.default.hex(t.muted)(text),
      scrollInfo: (text) => chalk__default.default.hex(t.dim)(text),
      noMatch: (text) => chalk__default.default.hex(t.muted)(text)
    }
  };
}
function getSettingsListTheme() {
  const t = getTheme();
  return {
    label: (text, selected) => selected ? chalk__default.default.hex(t.text).bold(text) : chalk__default.default.hex(t.muted)(text),
    value: (text, selected) => selected ? chalk__default.default.hex(t.accent)(text) : chalk__default.default.hex(t.dim)(text),
    description: (text) => chalk__default.default.hex(t.muted).italic(text),
    cursor: chalk__default.default.hex(t.accent)("\u2192 "),
    hint: (text) => chalk__default.default.hex(t.dim)(text)
  };
}
function getSelectListTheme() {
  const t = getTheme();
  return {
    selectedPrefix: (text) => chalk__default.default.hex(t.accent)(text),
    selectedText: (text) => chalk__default.default.bgHex(t.selectedBg)(text),
    description: (text) => chalk__default.default.hex(t.muted)(text),
    scrollInfo: (text) => chalk__default.default.hex(t.dim)(text),
    noMatch: (text) => chalk__default.default.hex(t.muted)(text)
  };
}
var ThreadLockError = class extends Error {
  constructor(threadId, ownerPid) {
    super(`Thread ${threadId} is locked by another process (PID ${ownerPid})`);
    this.threadId = threadId;
    this.ownerPid = ownerPid;
    this.name = "ThreadLockError";
  }
  threadId;
  ownerPid;
};
function getLocksDir() {
  const dir = path__namespace.join(chunk4H755EGM_cjs.getAppDataDir(), "locks");
  if (!fs__namespace.existsSync(dir)) {
    fs__namespace.mkdirSync(dir, { recursive: true });
  }
  return dir;
}
function getLockPath(threadId) {
  const safeId = threadId.replace(/[^a-zA-Z0-9_-]/g, "_");
  return path__namespace.join(getLocksDir(), `${safeId}.lock`);
}
function isProcessAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}
function acquireThreadLock(threadId) {
  const lockPath = getLockPath(threadId);
  const myPid = process.pid;
  if (fs__namespace.existsSync(lockPath)) {
    try {
      const content = fs__namespace.readFileSync(lockPath, "utf-8").trim();
      const ownerPid = parseInt(content, 10);
      if (!isNaN(ownerPid) && ownerPid !== myPid && isProcessAlive(ownerPid)) {
        throw new ThreadLockError(threadId, ownerPid);
      }
    } catch (error) {
      if (error instanceof ThreadLockError) throw error;
    }
  }
  fs__namespace.writeFileSync(lockPath, String(myPid), { mode: 420 });
}
function releaseThreadLock(threadId) {
  const lockPath = getLockPath(threadId);
  const myPid = process.pid;
  try {
    if (!fs__namespace.existsSync(lockPath)) return;
    const content = fs__namespace.readFileSync(lockPath, "utf-8").trim();
    const ownerPid = parseInt(content, 10);
    if (ownerPid === myPid) {
      fs__namespace.unlinkSync(lockPath);
    }
  } catch {
  }
}
function releaseAllThreadLocks() {
  try {
    const locksDir = getLocksDir();
    const files = fs__namespace.readdirSync(locksDir);
    const myPid = String(process.pid);
    for (const file of files) {
      if (!file.endsWith(".lock")) continue;
      const lockPath = path__namespace.join(locksDir, file);
      try {
        const content = fs__namespace.readFileSync(lockPath, "utf-8").trim();
        if (content === myPid) {
          fs__namespace.unlinkSync(lockPath);
        }
      } catch {
      }
    }
  } catch {
  }
}

exports.BOX_INDENT = BOX_INDENT;
exports.BOX_INDENT_STR = BOX_INDENT_STR;
exports.CHAT_INDENT = CHAT_INDENT;
exports.MEMORY_GATEWAY_DEFAULT_URL = MEMORY_GATEWAY_DEFAULT_URL;
exports.MEMORY_GATEWAY_PROVIDER = MEMORY_GATEWAY_PROVIDER;
exports.ONBOARDING_VERSION = ONBOARDING_VERSION;
exports.TERM_WIDTH_BUFFER = TERM_WIDTH_BUFFER;
exports.THREAD_ACTIVE_MODEL_PACK_ID_KEY = THREAD_ACTIVE_MODEL_PACK_ID_KEY;
exports.ThreadLockError = ThreadLockError;
exports.acquireThreadLock = acquireThreadLock;
exports.applyThemeMode = applyThemeMode;
exports.getAvailableModePacks = getAvailableModePacks;
exports.getAvailableOmPacks = getAvailableOmPacks;
exports.getCustomProviderId = getCustomProviderId;
exports.getEditorTheme = getEditorTheme;
exports.getMarkdownTheme = getMarkdownTheme;
exports.getSelectListTheme = getSelectListTheme;
exports.getSettingsListTheme = getSettingsListTheme;
exports.getTermWidth = getTermWidth;
exports.getThemeMode = getThemeMode;
exports.loadSettings = loadSettings;
exports.luminance = luminance;
exports.mastra = mastra;
exports.mastraBrand = mastraBrand;
exports.releaseAllThreadLocks = releaseAllThreadLocks;
exports.releaseThreadLock = releaseThreadLock;
exports.resolveModelDefaults = resolveModelDefaults;
exports.resolveOmModel = resolveOmModel;
exports.resolveThreadActiveModelPackId = resolveThreadActiveModelPackId;
exports.restoreTerminalForeground = restoreTerminalForeground;
exports.saveSettings = saveSettings;
exports.theme = theme;
exports.tintHex = tintHex;
exports.toCustomProviderModelId = toCustomProviderModelId;
//# sourceMappingURL=chunk-B5N6IIM6.cjs.map
//# sourceMappingURL=chunk-B5N6IIM6.cjs.map