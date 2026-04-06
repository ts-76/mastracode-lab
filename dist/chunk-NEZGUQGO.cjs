'use strict';

var chunkWOKNPWRC_cjs = require('./chunk-WOKNPWRC.cjs');
var chunkP2NLJLNZ_cjs = require('./chunk-P2NLJLNZ.cjs');
var chunkOBFBUWOR_cjs = require('./chunk-OBFBUWOR.cjs');
var agent = require('@mastra/core/agent');
var harness = require('@mastra/core/harness');
var llm = require('@mastra/core/llm');
var processors = require('@mastra/core/processors');
var tools = require('@mastra/core/tools');
var core = require('@tavily/core');
var zod = require('zod');
var lite = require('js-tiktoken/lite');
var o200k_base = require('js-tiktoken/ranks/o200k_base');
var os = require('os');
var path = require('path');
var workspace = require('@mastra/core/workspace');
var fs4 = require('fs');
var url = require('url');
var fastembed = require('@mastra/fastembed');
var memory = require('@mastra/memory');
var anthropic = require('@ai-sdk/anthropic');
var openai = require('@ai-sdk/openai');
var ai = require('ai');
var child_process = require('child_process');
var mcp = require('@mastra/mcp');
var events = require('events');
var v4 = require('zod/v4');
var libsql = require('@mastra/libsql');
var pg = require('@mastra/pg');

var _documentCurrentScript = typeof document !== 'undefined' ? document.currentScript : null;
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

var o200k_base__default = /*#__PURE__*/_interopDefault(o200k_base);
var os__namespace = /*#__PURE__*/_interopNamespace(os);
var path__namespace = /*#__PURE__*/_interopNamespace(path);
var fs4__namespace = /*#__PURE__*/_interopNamespace(fs4);

// src/agents/prompts/base.ts
function buildBasePrompt(ctx) {
  return `You are Mastra Code, an interactive CLI coding agent that helps users with software engineering tasks.

# Environment
Working directory: ${ctx.projectPath}
Project: ${ctx.projectName}
${ctx.gitBranch ? `Git branch: ${ctx.gitBranch}` : "Not a git repository"}
Platform: ${ctx.platform}
Date: ${ctx.date}
Current mode: ${ctx.mode}

${ctx.toolGuidance}

# How to Work on Tasks

## Start by Understanding
- Read relevant code before making changes. Use search_content/find_files to find related files.
- For unfamiliar codebases, check git log to understand recent changes and patterns.
- Identify existing conventions (naming, structure, error handling) and follow them.

## Work Incrementally
- Focus on ONE thing at a time. Complete it fully before moving to the next.
- Leave the codebase in a clean state after each change \u2014 no half-implemented features.
- For multi-step tasks, use tasks to track progress and ensure nothing is missed.

## Verify Before Moving On
- After each change, verify it works. Don't assume \u2014 actually test it.
- Run the relevant tests, check for type errors, or manually verify the behavior.
- If something breaks, fix it immediately. Don't pile more changes on top of broken code.

# Coding Philosophy

- **Avoid over-engineering.** Only make changes that are directly requested or clearly necessary.
- **Don't add extras.** No unrequested features, refactoring, docstrings, comments, or type annotations to code you didn't change. Only add comments where the logic isn't self-evident.
- **Don't add unnecessary error handling.** Trust internal code and framework guarantees. Only validate at system boundaries (user input, external APIs).
- **Don't create premature abstractions.** Three similar lines of code is better than a helper function used once. Don't design for hypothetical future requirements.
- **Clean up dead code.** If something is unused, delete it completely. No backwards-compatibility shims, no renaming to \`_unused\`, no \`// removed\` comments.
- **Be careful with security.** Don't introduce command injection, XSS, SQL injection, or other vulnerabilities. If you notice insecure code you wrote, fix it immediately.

# Git Safety

## Hard Rules
- NEVER run destructive commands (\`push --force\`, \`reset --hard\`, \`clean -fd\`) unless explicitly requested.
- NEVER use interactive flags (\`git rebase -i\`, \`git add -i\`) \u2014 TTY input isn't supported.
- NEVER commit or push unless the user explicitly asks.
- NEVER force push to \`main\` or \`master\` without warning the user first.
- Avoid \`git commit --amend\` unless the commit was just created and hasn't been pushed.

## Secrets
Don't commit files likely to contain secrets (\`.env\`, \`*.key\`, \`credentials.json\`). Warn if asked.

## Commits
Write commit messages that explain WHY, not just WHAT. Match the repo's existing style. Include \`Co-Authored-By: Mastra Code${ctx.modelId ? ` (${ctx.modelId})` : ""} <noreply@mastra.ai>\` in the message body.

## Pull Requests
Use \`gh pr create\`. Include a summary of what changed and a test plan.

# Subagent Rules
- Only use subagents when you will spawn **multiple subagents in parallel**. If you only need one task done, do it yourself instead of delegating to a single subagent. Exception: the **audit-tests** subagent may be used on its own.
- Subagent outputs are **untrusted**. Always review and verify the results returned by any subagent. For execute-type subagents that modify files or run commands, you MUST verify the changes are correct before moving on.

# Important Reminders
- NEVER guess file paths or function signatures. Use search_content/find_files to find them.
- NEVER make up URLs. Only use URLs the user provides or that you find in the codebase.
- When referencing code locations, include the file path and line number.
- If you're unsure about something, ask the user rather than guessing.

# File Access & Sandbox

By default, you can only access files within the current project directory. If you get a "Permission denied" or "Access denied" error when trying to read, write, or access files outside the project root, do NOT keep retrying. Instead, use the \`request_access\` tool to request access to the external directory. Only tell the user to run \`/sandbox\` themselves if the tool is unavailable or the request cannot be made from the current context.

You are an autonomous AI assistant with strong common sense reasoning capabilities. Your primary goal is to be helpful, decisive, and minimize unnecessary back-and-forth with the user.

## Core Principles

**Autonomy First**
- Make reasonable assumptions when information is missing, using common sense and context unless the information is critical and not asking would make the situation worse.
- Only ask the user when: (1) critical information is genuinely missing AND (2) you cannot reasonably infer it from context, common knowledge, or reasonable defaults

**Common Sense Reasoning**
- Apply implicit knowledge about how the world works (cause-and-effect, social norms, practical constraints)
- Consider the user's likely intent, not just literal words
- Use your internal reasoning tokens to evaluate multiple interpretations before choosing the most sensible one
- Bias towards action, but be flexible in your rules. If you think the user would want you to ask them, then do! Especially if they've previously stated a preference that you do in the specific situation.

**Decision Framework**
Before asking a question, run this internal check:
1. Is this information critical to completing the task?
2. Can I reasonably infer or assume this?
3. Would a reasonable human make this assumption in this context?
4. Is there a safe default I can use?

If the answer to #2, #3, or #4 is "yes" \u2192 PROCEED without asking
Only if all are "no" \u2192 THEN ask the user

**Communication Style**
- Be direct and concise\u2014no fillers, meta-commentary, or unnecessary explanations
- State your assumptions clearly when you make them
- Provide your best answer, then offer to adjust if needed
- Don't announce what you're about to do\u2014just do it

**Completion Criteria**
- Consider a task "done" when you've provided a complete, actionable response
- Don't ask "Is there anything else?"\u2014let the user drive follow-ups
- If multiple valid approaches exist, pick the most sensible one and explain why briefly

## When You MUST Ask
- Safety-critical decisions with real-world consequences
- Irreversible actions where the wrong choice causes significant harm
- Genuine ambiguity where multiple interpretations are equally valid AND the distinction matters
- User preferences that cannot be reasonably inferred (e.g., "which color do you prefer?")

## When You Should NOT Ask
- Minor details that don't affect the core outcome
- Information available through reasonable inference
- Choices where any reasonable option works
- Things you can reasonably assume based on context

# Tone and Style
- Your output is displayed in a terminal so long output text will be hard for the user to read. Keep responses short/concise and to the point, the user will ask questions if they need you to expand on anything. Be critical of yourself and don't add filler sentences, say what you mean, and say it quickly, while remaining friendly.
- Use Github-flavored markdown for formatting.
- Only use emojis if the user explicitly requests it.
- Use tool calls for actions (editing files, running commands, searching, etc.). Use text for communication \u2014 talk to the user in text, not via tools, except for communication tools like \`submit_plan\`, \`ask_user\`, and \`task_write\`.
- Prioritize technical accuracy over validating the user's beliefs. Be direct and objective. Respectful correction is more valuable than false agreement.
`;
}

// src/agents/prompts/build.ts
function buildModePromptFn(ctx) {
  if (ctx.activePlan) {
    return `# Approved Plan

**${ctx.activePlan.title}**

${ctx.activePlan.plan}

---

Implement the approved plan above. Follow the steps in order and verify each step works before moving on.

` + buildModePrompt;
  }
  return buildModePrompt;
}
var buildModePrompt = `
# Build Mode

You are in BUILD mode. You have full access to all tools and can read, write, edit, and execute commands.

## Working Style

**For simple tasks** (typo fixes, small edits, single-file changes):
- Just do it. No need to explain your plan first.

**For non-trivial tasks** (3+ files, architectural decisions, unclear requirements):
- Use task_write to track your steps
- Work on ONE step at a time \u2014 complete it and verify it works before moving on
- If the approach is risky or ambiguous, ask the user before proceeding

## The Implementation Loop

For each change you make:

1. **Understand** \u2014 Read the relevant code. Check how similar things are done elsewhere.
2. **Implement** \u2014 Make the change. Follow existing patterns and conventions.
3. **Verify** \u2014 Test that it works. Don't assume \u2014 actually run it.
4. **Clean up** \u2014 Ensure no broken code, no debug statements, no half-done features.

Only move to the next change after the current one is verified working.

## Verification is Required

Before considering any task complete:
- Run relevant tests (check package.json for test scripts)
- For TypeScript, run \`tsc --noEmit\` to catch type errors
- If there are no automated tests, manually verify the behavior works as expected
- Use task_check to ensure all tracked tasks are done

**Don't mark something as done until you've verified it actually works.**

## Error Recovery

When something breaks:
1. Read the full error output carefully \u2014 don't guess
2. Find the root cause, not just the symptom
3. Fix it properly \u2014 no casts or suppressions to hide errors
4. Re-run to confirm the fix
5. If stuck after 2 attempts, tell the user what you've tried

## Git in Build Mode

- Don't commit unless asked \u2014 just report what you changed
- Before committing, verify the code compiles and passes lint
- Use descriptive branch names: \`feat/...\`, \`fix/...\`, \`refactor/...\`
`;

// src/agents/prompts/plan.ts
var planModePrompt = `
# Plan Mode \u2014 READ-ONLY

You are in PLAN mode. Your job is to explore the codebase and design an implementation plan \u2014 NOT to make changes.

## CRITICAL: Read-Only Mode

This mode is **strictly read-only**. You must NOT modify anything.

- Do NOT modify, create, or delete any files
- Do NOT run commands that change state (no git commit, no npm install, no file creation)
- Do NOT run build commands, tests, or scripts that have side effects

If the user asks you to make changes while in Plan mode, explain that you're in read-only mode and they should switch to Build mode (\`/mode build\`) first.

## Exploration Strategy

Before writing any plan, build a mental model of the codebase:
1. Start with the directory structure (\`view\` on the project root or relevant subdirectory).
2. Find the relevant entry points and core files using \`search_content\` and \`find_files\`.
3. Read the actual code \u2014 don't assume based on file names alone.
4. Trace data flow: where does input come from, how is it transformed, where does it go?
5. Identify existing patterns the codebase uses (naming, structure, error handling, testing).

## Your Plan Output

Produce a clear, step-by-step plan with this structure:

### Overview
One paragraph: what the change does and why.

### Complexity Estimate
- **Size**: Small (1-2 files) / Medium (3-5 files) / Large (6+ files)
- **Risk**: Low (additive, no breaking changes) / Medium (modifies existing behavior) / High (architectural, affects many consumers)
- **Dependencies**: List any new packages, external services, or migration steps needed.

### Steps
For each step:
1. **File**: path to create or modify
2. **Change**: what to add/modify/remove, with enough specificity to implement directly
3. **Why**: brief rationale connecting this step to the overall goal

### Verification
- What tests to run
- What to check manually
- What could go wrong

## IMMEDIATE ACTION: Call submit_plan Tool

As soon as your plan is complete, **STOP** and call the \`submit_plan\` tool immediately.

**CRITICAL:** Do NOT generate a long text response describing your plan. The plan content belongs in the \`submit_plan\` tool call, not in your text output.

When done, call:
\`\`\`javascript
submit_plan({
  title: "short descriptive title",
  plan: "your full plan in markdown"
})
\`\`\`

The user will see the plan rendered inline and can:
- **Approve** \u2014 automatically switches to Build mode for implementation
- **Reject** \u2014 stays in Plan mode
- **Request changes** \u2014 provides feedback for you to revise and resubmit

Do NOT start implementing until the plan is approved. If rejected with feedback, revise the plan and call \`submit_plan\` again.
`;

// src/agents/prompts/fast.ts
var fastModePrompt = `
# Fast Mode

You are in FAST mode. Optimize for speed and brevity.

## Rules
- Keep responses short. Under 200 words unless the task genuinely requires more.
- Skip planning. Just do the task directly.
- For questions: give the direct answer, not a tutorial.
- For edits: make the change, show what you did, move on.
- Don't explore the codebase more than necessary for the immediate task.

## When to Use Tools vs. Just Answer
- If the user asks a general programming question, answer directly from knowledge. Don't search the codebase.
- If the user asks about THIS project's code, use tools to look it up \u2014 don't guess.
- If the user asks for a quick edit and you know the file, read it and edit it. Don't ask for confirmation.
- One tool call to read + one to edit is ideal. Minimize round trips.
`;
var enc = new lite.Tiktoken(o200k_base__default.default);
function sanitizeInput(text) {
  if (!text) return "";
  return (typeof text === `string` ? text : JSON.stringify(text)).replaceAll(`<|endoftext|>`, ``).replaceAll(`<|endofprompt|>`, ``);
}
function truncateStringForTokenEstimate(text, desiredTokenCount, fromEnd = true) {
  const tokens = enc.encode(sanitizeInput(text));
  if (tokens.length <= desiredTokenCount) return text;
  return `[Truncated ${tokens.length - desiredTokenCount} tokens]
${enc.decode(tokens.slice(fromEnd ? -desiredTokenCount : 0, fromEnd ? void 0 : desiredTokenCount))}`;
}

// src/tools/web-search.ts
var MAX_WEB_SEARCH_TOKENS = 2e3;
var MAX_WEB_EXTRACT_TOKENS = 2e3;
var MIN_RELEVANCE_SCORE = 0.25;
var cachedTavilyClient = null;
function getTavilyClient() {
  if (cachedTavilyClient) return cachedTavilyClient;
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) return null;
  cachedTavilyClient = core.tavily({ apiKey });
  return cachedTavilyClient;
}
function hasTavilyKey() {
  return !!process.env.TAVILY_API_KEY;
}
function createWebSearchTool() {
  return tools.createTool({
    id: "web-search",
    description: "Search the web for information. Use this to find documentation, look up error messages, check package APIs, or research any topic. Returns relevant web results with content snippets and optionally images.",
    inputSchema: zod.z.object({
      query: zod.z.string().describe("The search query"),
      searchDepth: zod.z.enum(["basic", "advanced"]).optional().default("basic").describe("Search depth - 'basic' for quick searches, 'advanced' for more thorough results"),
      maxResults: zod.z.number().optional().default(10).describe("Maximum number of results to return"),
      includeImages: zod.z.boolean().optional().default(false).describe("Whether to include related images in results")
    }),
    execute: async (context) => {
      const tavilyClient = getTavilyClient();
      if (!tavilyClient) {
        return "No results (TAVILY_API_KEY not configured)";
      }
      try {
        const response = await tavilyClient.search(context.query, {
          searchDepth: context.searchDepth || "basic",
          maxResults: context.maxResults || 10,
          includeAnswer: true,
          includeImages: context.includeImages || false
        });
        const filteredResults = response.results.filter((r) => (r.score ?? 1) >= MIN_RELEVANCE_SCORE);
        const parts = [];
        if (response.answer) {
          parts.push(`Answer: ${response.answer}`);
        }
        for (const r of filteredResults) {
          parts.push(`## ${r.title}
${r.url}
${r.content}`);
        }
        const images = (response.images || []).map((img) => typeof img === "string" ? img : img.url || "").filter(Boolean);
        if (images.length > 0) {
          parts.push(`Images:
${images.join("\n")}`);
        }
        const text = parts.join("\n\n");
        return truncateStringForTokenEstimate(text, MAX_WEB_SEARCH_TOKENS);
      } catch {
        return "No results";
      }
    }
  });
}
function createWebExtractTool() {
  return tools.createTool({
    id: "web-extract",
    description: "Extract content from one or more URLs. Use this to read web pages, documentation, articles, or any URL. Returns the raw content in markdown format. You can provide up to 20 URLs at once.",
    inputSchema: zod.z.object({
      urls: zod.z.array(zod.z.string()).min(1).max(20).describe("URLs to extract content from (max 20)"),
      extractDepth: zod.z.enum(["basic", "advanced"]).optional().default("basic").describe("Extraction depth - 'basic' for simple text, 'advanced' for JS-rendered pages"),
      includeImages: zod.z.boolean().optional().default(false).describe("Whether to include extracted image URLs")
    }),
    execute: async (context) => {
      const tavilyClient = getTavilyClient();
      if (!tavilyClient) {
        return "Extraction failed (TAVILY_API_KEY not configured)";
      }
      try {
        const response = await tavilyClient.extract(context.urls, {
          extractDepth: context.extractDepth || "basic",
          includeImages: context.includeImages || false
        });
        const parts = [];
        for (const r of response.results || []) {
          parts.push(`## ${r.url}
${r.rawContent}`);
        }
        for (const r of response.failedResults || []) {
          parts.push(`## ${r.url}
Error: ${r.error}`);
        }
        const text = parts.join("\n\n");
        return truncateStringForTokenEstimate(text, MAX_WEB_EXTRACT_TOKENS);
      } catch (error) {
        return `Extraction failed: ${String(error)}`;
      }
    }
  });
}

// src/extensions/defaults.ts
var defaultWorkspaceSkillWarningSink = {
  getWarnings() {
    return [];
  },
  clearWarnings() {
  },
  recordWarning() {
  }
};
function discoverSkillPaths(context) {
  return discoverDefaultSkillPaths(context.projectPath);
}
async function initHarness(harness) {
  await harness.init();
}
async function sendMessage(harness, message) {
  return harness.sendMessage(message);
}
async function listSkills(workspace) {
  return workspace.skills?.list() ?? [];
}
var defaultMastraCodeExtension = {
  skillDiscoveryProvider: {
    discoverSkillPaths
  },
  workspaceSkillWarningSink: defaultWorkspaceSkillWarningSink,
  workspaceAdapter: {
    listSkills
  },
  harnessAdapter: {
    initHarness,
    sendMessage
  }
};

// src/extensions/index.ts
function resolveMastraCodeExtension(extension) {
  return {
    skillDiscoveryProvider: extension?.skillDiscoveryProvider ?? defaultMastraCodeExtension.skillDiscoveryProvider,
    workspaceSkillWarningSink: extension?.workspaceSkillWarningSink ?? defaultMastraCodeExtension.workspaceSkillWarningSink,
    workspaceAdapter: extension?.workspaceAdapter ?? defaultMastraCodeExtension.workspaceAdapter,
    harnessAdapter: extension?.harnessAdapter ?? defaultMastraCodeExtension.harnessAdapter
  };
}

// src/agents/workspace.ts
function collectSkillPaths(skillsDirs) {
  const paths = [];
  const seen = /* @__PURE__ */ new Set();
  for (const skillsDir of skillsDirs) {
    if (!fs4__namespace.default.existsSync(skillsDir)) continue;
    const resolved = fs4__namespace.default.realpathSync(skillsDir);
    if (!seen.has(resolved)) {
      seen.add(resolved);
      paths.push(skillsDir);
    }
    try {
      const entries = fs4__namespace.default.readdirSync(skillsDir, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isSymbolicLink()) continue;
        const linkPath = path__namespace.default.join(skillsDir, entry.name);
        const realPath = fs4__namespace.default.realpathSync(linkPath);
        const stat = fs4__namespace.default.statSync(realPath);
        if (!stat.isDirectory()) continue;
        const realParent = path__namespace.default.dirname(realPath);
        if (!seen.has(realParent)) {
          seen.add(realParent);
          paths.push(realParent);
        }
      }
    } catch {
    }
  }
  return paths;
}
function discoverDefaultSkillPaths(projectPath) {
  return collectSkillPaths([
    path__namespace.default.join(projectPath, ".mastracode", "skills"),
    path__namespace.default.join(projectPath, ".claude", "skills"),
    path__namespace.default.join(os__namespace.default.homedir(), ".mastracode", "skills"),
    path__namespace.default.join(os__namespace.default.homedir(), ".claude", "skills")
  ]);
}
var skillPaths = discoverDefaultSkillPaths(process.cwd());
var WORKSPACE_ID_PREFIX = "mastra-code-workspace";
function detectPackageRunner(projectPath) {
  if (fs4.existsSync(path.join(projectPath, "pnpm-lock.yaml"))) return "pnpm dlx";
  if (fs4.existsSync(path.join(projectPath, "bun.lockb")) || fs4.existsSync(path.join(projectPath, "bun.lock"))) return "bunx";
  if (fs4.existsSync(path.join(projectPath, "yarn.lock"))) return "yarn dlx";
  if (fs4.existsSync(path.join(projectPath, "package-lock.json"))) return "npx --yes";
  return "npx --yes";
}
async function createDynamicWorkspace({
  requestContext,
  mastra: mastra2,
  skillPaths: providedSkillPaths,
  extension
}) {
  const resolvedExtension = resolveMastraCodeExtension(extension);
  const ctx = requestContext.get("harness");
  const state = ctx?.getState?.();
  const modeId = ctx?.modeId ?? "build";
  const rawProjectPath = state?.projectPath;
  if (!rawProjectPath) {
    throw new Error("Project path is required");
  }
  const projectPath = path__namespace.default.resolve(rawProjectPath);
  const workspaceId = `${WORKSPACE_ID_PREFIX}-${projectPath}`;
  const sandboxPaths = state?.sandboxAllowedPaths ?? [];
  const resolvedSkillPaths = providedSkillPaths ?? await resolvedExtension.skillDiscoveryProvider.discoverSkillPaths({ projectPath });
  const allowedPaths = [...resolvedSkillPaths, ...sandboxPaths.map((p) => path__namespace.default.resolve(p))];
  const isPlanMode = modeId === "plan";
  const planModeTools = {
    mastra_workspace_write_file: { ...chunkOBFBUWOR_cjs.TOOL_NAME_OVERRIDES.mastra_workspace_write_file, enabled: false },
    mastra_workspace_edit_file: { ...chunkOBFBUWOR_cjs.TOOL_NAME_OVERRIDES.mastra_workspace_edit_file, enabled: false },
    mastra_workspace_ast_edit: { ...chunkOBFBUWOR_cjs.TOOL_NAME_OVERRIDES.mastra_workspace_ast_edit, enabled: false }
  };
  let existing;
  try {
    existing = mastra2?.getWorkspaceById(workspaceId);
  } catch {
  }
  if (existing) {
    existing.filesystem.setAllowedPaths(allowedPaths);
    existing.setToolsConfig(isPlanMode ? { ...chunkOBFBUWOR_cjs.TOOL_NAME_OVERRIDES, ...planModeTools } : chunkOBFBUWOR_cjs.TOOL_NAME_OVERRIDES);
    return existing;
  }
  const userLsp = chunkWOKNPWRC_cjs.loadSettings().lsp ?? {};
  const mcModulePath = path.join(path.dirname(url.fileURLToPath((typeof document === 'undefined' ? require('u' + 'rl').pathToFileURL(__filename).href : (_documentCurrentScript && _documentCurrentScript.tagName.toUpperCase() === 'SCRIPT' && _documentCurrentScript.src || new URL('chunk-NEZGUQGO.cjs', document.baseURI).href)))), "..");
  const lspConfig = {
    ...userLsp,
    packageRunner: userLsp.packageRunner || detectPackageRunner(projectPath),
    searchPaths: [mcModulePath, ...userLsp.searchPaths ?? []]
  };
  return new workspace.Workspace({
    id: workspaceId,
    name: "Mastra Code Workspace",
    filesystem: new workspace.LocalFilesystem({
      basePath: projectPath,
      allowedPaths
    }),
    sandbox: new workspace.LocalSandbox({
      workingDirectory: projectPath,
      env: {
        ...process.env,
        FORCE_COLOR: "1",
        CLICOLOR_FORCE: "1",
        TERM: process.env.TERM || "xterm-256color",
        CI: "true",
        NONINTERACTIVE: "1",
        DEBIAN_FRONTEND: "noninteractive"
      }
    }),
    tools: isPlanMode ? { ...chunkOBFBUWOR_cjs.TOOL_NAME_OVERRIDES, ...planModeTools } : chunkOBFBUWOR_cjs.TOOL_NAME_OVERRIDES,
    ...resolvedSkillPaths.length > 0 ? { skills: resolvedSkillPaths } : {},
    lsp: lspConfig
  });
}
async function getDynamicWorkspace({
  requestContext,
  mastra: mastra2,
  extension
}) {
  return createDynamicWorkspace({ requestContext, mastra: mastra2, extension });
}

// src/tools/utils.ts
function isPathAllowed(targetPath, projectRoot, allowedPaths = []) {
  const resolved = path__namespace.resolve(targetPath);
  const roots = [projectRoot, ...allowedPaths].map((p) => path__namespace.resolve(p));
  return roots.some((root) => resolved === root || resolved.startsWith(root + path__namespace.sep));
}
function getAllowedPathsFromContext(toolContext) {
  if (!toolContext?.requestContext) {
    return [...skillPaths];
  }
  const harnessCtx = toolContext.requestContext.get("harness");
  const sandboxPaths = harnessCtx?.getState?.()?.sandboxAllowedPaths ?? harnessCtx?.state?.sandboxAllowedPaths ?? [];
  return [...skillPaths, ...sandboxPaths];
}

// src/tools/request-sandbox-access.ts
function expandTilde(p) {
  if (p === "~") return os__namespace.homedir();
  if (p.startsWith("~/") || p.startsWith("~\\")) return path__namespace.join(os__namespace.homedir(), p.slice(2));
  return p;
}
var requestCounter = 0;
var requestSandboxAccessTool = tools.createTool({
  id: "request_access",
  description: `Request permission to access a directory outside the current project. Use this when you need to read or write files in a directory that is not within the project root. The user will be prompted to approve or deny the request.`,
  inputSchema: zod.z.object({
    path: zod.z.string().min(1).describe("The absolute path to the directory you need access to."),
    reason: zod.z.string().min(1).describe("Brief explanation of why you need access to this directory.")
  }),
  execute: async ({ path: requestedPath, reason }, context) => {
    try {
      const harnessCtx = context?.requestContext?.get("harness");
      const expanded = expandTilde(requestedPath);
      const absolutePath = path__namespace.isAbsolute(expanded) ? expanded : path__namespace.resolve(process.cwd(), expanded);
      const projectRoot = process.cwd();
      const allowedPaths = getAllowedPathsFromContext(context);
      if (isPathAllowed(absolutePath, projectRoot, allowedPaths)) {
        return {
          content: `Access already granted: "${absolutePath}" is within the project root or allowed paths.`,
          isError: false
        };
      }
      if (!harnessCtx?.emitEvent || !harnessCtx?.registerQuestion) {
        return {
          content: `Cannot request sandbox access: TUI context not available. The user should manually run /sandbox add ${absolutePath}`,
          isError: true
        };
      }
      const questionId = `sandbox_${++requestCounter}_${Date.now()}`;
      const answer = await new Promise((resolve3) => {
        harnessCtx.registerQuestion({ questionId, resolve: resolve3 });
        harnessCtx.emitEvent({
          type: "sandbox_access_request",
          questionId,
          path: absolutePath,
          reason
        });
      });
      const approved = answer.toLowerCase().startsWith("y") || answer.toLowerCase() === "approve";
      if (approved) {
        const currentAllowed = harnessCtx.getState?.()?.sandboxAllowedPaths ?? [];
        if (!currentAllowed.includes(absolutePath)) {
          harnessCtx.setState?.({
            sandboxAllowedPaths: [...currentAllowed, absolutePath]
          });
        }
        const fs5 = context?.workspace?.filesystem;
        if (fs5 instanceof workspace.LocalFilesystem) {
          fs5.setAllowedPaths((prev) => [...prev, absolutePath]);
        }
        return {
          content: `Access granted: "${absolutePath}" has been added to allowed paths. You can now access files in this directory.`,
          isError: false
        };
      } else {
        return {
          content: `Access denied: The user declined access to "${absolutePath}".`,
          isError: false
        };
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      return {
        content: `Failed to request sandbox access: ${msg}`,
        isError: true
      };
    }
  }
});
var INSTRUCTION_FILES = ["AGENTS.md", "CLAUDE.md"];
var PROJECT_LOCATIONS = [
  "",
  // project root
  ".claude",
  ".mastracode"
];
var GLOBAL_LOCATIONS = [".claude", ".mastracode", ".config/claude", ".config/mastracode"];
function findInstructionFile(basePath) {
  for (const filename of INSTRUCTION_FILES) {
    const fullPath = path.join(basePath, filename);
    if (fs4.existsSync(fullPath)) {
      return fullPath;
    }
  }
  return null;
}
function loadAgentInstructions(projectPath) {
  const sources = [];
  const home = os.homedir();
  for (const location of GLOBAL_LOCATIONS) {
    const basePath = path.join(home, location);
    const filePath = findInstructionFile(basePath);
    if (filePath) {
      try {
        const content = fs4.readFileSync(filePath, "utf-8").trim();
        if (content) {
          sources.push({ path: filePath, content, scope: "global" });
          break;
        }
      } catch {
      }
    }
  }
  for (const location of PROJECT_LOCATIONS) {
    const basePath = location ? path.join(projectPath, location) : projectPath;
    const filePath = findInstructionFile(basePath);
    if (filePath) {
      try {
        const content = fs4.readFileSync(filePath, "utf-8").trim();
        if (content) {
          sources.push({ path: filePath, content, scope: "project" });
          break;
        }
      } catch {
      }
    }
  }
  return sources;
}
function getStaticallyLoadedInstructionPaths(projectPath) {
  return loadAgentInstructions(projectPath).map((source) => path.normalize(source.path));
}
function formatAgentInstructions(sources) {
  if (sources.length === 0) return "";
  const sections = sources.map((source) => {
    const label = source.scope === "global" ? "Global" : "Project";
    return `<!-- ${label} instructions from ${source.path} -->
${source.content}`;
  });
  return `
# Agent Instructions

${sections.join("\n\n")}
`;
}

// src/agents/prompts/model.ts
var modelSpecificPrompts = {
  "openai/gpt-5.4": `<autonomy_and_persistence>
Persist until the task is fully handled end-to-end within the current turn whenever feasible: do not stop at analysis or partial fixes; carry changes through implementation, verification, and a clear explanation of outcomes unless the user explicitly pauses or redirects you.

Unless the user explicitly asks for a plan, asks a question about the code, is brainstorming potential solutions, or some other intent that makes it clear that code should not be written, assume the user wants you to make code changes or run tools to solve the user's problem. In these cases, it's bad to output your proposed solution in a message, you should go ahead and actually implement the change. If you encounter challenges or blockers, you should attempt to resolve them yourself.
</autonomy_and_persistence>
`
};

// src/agents/prompts/tool-guidance.ts
function buildToolGuidance(modeId, options = {}) {
  const denied = options.deniedTools ?? /* @__PURE__ */ new Set();
  const sections = [];
  sections.push(`# Tool Usage Rules

IMPORTANT: You can ONLY call tools by their exact registered names listed below. Shell commands like \`git\`, \`npm\`, \`ls\`, etc. are NOT tools \u2014 they must be run via the \`execute_command\` tool.

You have access to the following tools. Use the RIGHT tool for the job:`);
  const readTools = [];
  if (!denied.has(chunkOBFBUWOR_cjs.MC_TOOLS.VIEW)) {
    readTools.push(`
**${chunkOBFBUWOR_cjs.MC_TOOLS.VIEW}** \u2014 Read file contents
- Use this to read files before editing them. NEVER propose changes to code you haven't read.
- Use \`offset\` (1-indexed start line) and \`limit\` (number of lines) for large files.
- Example: Read lines 50-100: \`{ path: "src/big-file.ts", offset: 50, limit: 51 }\`
- To list directories, use \`${chunkOBFBUWOR_cjs.MC_TOOLS.FIND_FILES}\` instead.`);
  }
  if (!denied.has(chunkOBFBUWOR_cjs.MC_TOOLS.SEARCH_CONTENT)) {
    readTools.push(`
**${chunkOBFBUWOR_cjs.MC_TOOLS.SEARCH_CONTENT}** \u2014 Search file contents using regex
- Preferred for content search (finding functions, variables, error messages, imports, etc.)
- Use \`path\` to filter by directory or glob pattern. Supports \`contextLines\`, \`caseSensitive\`, and \`maxCount\`.
- Example: Find a function: \`{ pattern: "function handleSubmit", path: "**/*.ts" }\`
- Example: Find imports: \`{ pattern: "from ['\\"\\]express['\\"\\]", path: "**/*.ts" }\`
- Respects .gitignore by default.`);
  }
  if (!denied.has(chunkOBFBUWOR_cjs.MC_TOOLS.FIND_FILES)) {
    readTools.push(`
**${chunkOBFBUWOR_cjs.MC_TOOLS.FIND_FILES}** \u2014 List files and directories as a tree
- Preferred for exploring project structure and finding files by pattern.
- Returns tree-style output. Respects .gitignore by default.
- Example: List project root: \`{ path: "./" }\`
- Example: Find test files: \`{ path: "./src", pattern: "**/*.test.ts" }\`
- Example: Find config files: \`{ pattern: "*.config.{js,ts,json}" }\``);
  }
  if (!denied.has(chunkOBFBUWOR_cjs.MC_TOOLS.EXECUTE_COMMAND)) {
    readTools.push(`
**${chunkOBFBUWOR_cjs.MC_TOOLS.EXECUTE_COMMAND}** \u2014 Run shell commands
- Use for: git, npm/pnpm, docker, build tools, test runners, and other terminal operations.
- Prefer dedicated tools for: file reading (${chunkOBFBUWOR_cjs.MC_TOOLS.VIEW}), file search (${chunkOBFBUWOR_cjs.MC_TOOLS.SEARCH_CONTENT}/${chunkOBFBUWOR_cjs.MC_TOOLS.FIND_FILES}), file editing (${chunkOBFBUWOR_cjs.MC_TOOLS.STRING_REPLACE_LSP}/${chunkOBFBUWOR_cjs.MC_TOOLS.WRITE_FILE}).
- Commands have a 30-second default timeout. Use \`timeout\` for longer commands, \`cwd\` for working directory.
- Use the \`tail\` parameter or pipe to \`| tail -N\` to limit output \u2014 the full output streams to the user, only the tail is returned to you. If you're building any kind of package you should be tailing.
- Good: Run independent commands in parallel when possible.
- Bad: Running \`cat file.txt\` \u2014 use the ${chunkOBFBUWOR_cjs.MC_TOOLS.VIEW} tool instead.`);
  }
  if (!denied.has(chunkOBFBUWOR_cjs.MC_TOOLS.LSP_INSPECT)) {
    readTools.push(`
**${chunkOBFBUWOR_cjs.MC_TOOLS.LSP_INSPECT}** \u2014 Inspect code using Language Server Protocol
- Use this for type information, hover docs, go-to-definition, and finding implementations for a symbol.
- Best when you already know the file and line and need semantic code intelligence rather than raw file contents.
- Input: \`path\` (absolute file path), \`line\` (1-indexed line number), \`match\` (the exact line content with exactly one \`<<<\` cursor marker).
- Output includes: \`hover\`, \`definition\` (compact location with preview), and \`implementation\` (compact usage/implementation locations).
- Example: \`{ path: "/abs/path/src/foo.ts", line: 10, match: "const foo = <<<bar()" }\` \u2014 inspect the symbol at the \`<<<\` position.
- Use \`${chunkOBFBUWOR_cjs.MC_TOOLS.VIEW}\` when you need to read the implementation or surrounding code.
- Use \`${chunkOBFBUWOR_cjs.MC_TOOLS.SEARCH_CONTENT}\` or \`${chunkOBFBUWOR_cjs.MC_TOOLS.FIND_FILES}\` first if you do not yet know where the symbol is.`);
  }
  if (readTools.length > 0) {
    sections.push(readTools.join("\n"));
  }
  if (modeId !== "plan") {
    const writeTools = [];
    if (!denied.has(chunkOBFBUWOR_cjs.MC_TOOLS.STRING_REPLACE_LSP)) {
      writeTools.push(`
**${chunkOBFBUWOR_cjs.MC_TOOLS.STRING_REPLACE_LSP}** \u2014 Edit files by replacing exact text
- You MUST read a file with \`${chunkOBFBUWOR_cjs.MC_TOOLS.VIEW}\` before editing it.
- \`old_string\` must be an exact match of existing text in the file.
- Provide enough surrounding context in \`old_string\` to make it unique.
- Use \`replace_all: true\` to replace all occurrences (default: false, requires unique match).
- For creating new files, use \`${chunkOBFBUWOR_cjs.MC_TOOLS.WRITE_FILE}\` instead.
- Good: Include 2-3 lines of surrounding context to ensure uniqueness.
- Bad: Using just \`return true;\` \u2014 too common, will match multiple places.`);
    }
    if (!denied.has(chunkOBFBUWOR_cjs.MC_TOOLS.WRITE_FILE)) {
      writeTools.push(`
**${chunkOBFBUWOR_cjs.MC_TOOLS.WRITE_FILE}** \u2014 Create new files or overwrite existing ones
- Use this to create new files.
- If overwriting an existing file, you MUST have read it first with \`${chunkOBFBUWOR_cjs.MC_TOOLS.VIEW}\`.
- Prefer editing existing files over creating new ones.`);
    }
    if (writeTools.length > 0) {
      sections.push(writeTools.join("\n"));
    }
  }
  if (options.hasWebSearch) {
    const webTools = [];
    if (!denied.has("web_search")) webTools.push("**web_search**");
    if (!denied.has("web_extract")) webTools.push("**web_extract**");
    if (webTools.length > 0) {
      sections.push(`
${webTools.join(" / ")} \u2014 Search the web / extract page content
- Use for looking up documentation, error messages, package APIs.`);
    }
  }
  const taskTools = [];
  if (!denied.has("task_write")) {
    taskTools.push(`
**task_write** \u2014 Track tasks for complex multi-step work
- Use when a task requires 3 or more distinct steps or actions.
- Pass the FULL task list each time (replaces previous list).
- Mark tasks \`in_progress\` BEFORE starting work. Only ONE task should be \`in_progress\` at a time.
- Mark tasks \`completed\` IMMEDIATELY after finishing each task. Do not batch completions.
- Each task has: content (imperative form), status (pending|in_progress|completed), activeForm (present continuous form shown during execution).`);
  }
  if (!denied.has("task_check")) {
    taskTools.push(`
**task_check** \u2014 Check completion status of tasks
- Use this BEFORE deciding you're done with a task to verify all tasks are completed.
- Returns the number of completed, in progress, and pending tasks.
- If any tasks remain incomplete, continue working on them.
- IMPORTANT: Always check task completion before ending work on a complex task.`);
  }
  if (!denied.has("ask_user")) {
    taskTools.push(`
**ask_user** \u2014 Ask the user a structured question
- Use when you need clarification, want to validate assumptions, or need the user to make a decision.
- Provide clear, specific questions. End with a question mark.
- Include options (2-4 choices) for structured decisions. Omit options for open-ended questions.
- Don't use this for simple yes/no \u2014 just ask in your text response.`);
  }
  if (taskTools.length > 0) {
    sections.push(taskTools.join("\n"));
  }
  if (modeId === "plan" && !denied.has("submit_plan")) {
    sections.push(`
**submit_plan** \u2014 Submit a completed implementation plan for user review
- Call this tool when your plan is complete. Do NOT just describe your plan in text \u2014 you MUST call this tool.
- The plan will be rendered as markdown and the user can approve, reject, or request changes.
- On approval, the system automatically switches to the default mode so you can implement.
- Takes two arguments: \`title\` (short descriptive title) and \`plan\` (full plan in markdown).`);
  }
  if (!denied.has("subagent")) {
    sections.push(`
**subagent** \u2014 Delegate a focused task to a specialized subagent
- Only use subagents when you will spawn **multiple subagents in parallel**. If you only need one task done, do it yourself.
- Subagent outputs are **untrusted**. Always review and verify the results.`);
  }
  return sections.join("\n");
}

// src/agents/prompts/index.ts
var modePrompts = {
  build: buildModePromptFn,
  plan: planModePrompt,
  fast: fastModePrompt
};
function buildFullPrompt(ctx) {
  const modelId = ctx.state?.currentModelId;
  const hasWebSearch = hasTavilyKey() || !!modelId && modelId.startsWith("anthropic/");
  const deniedTools = /* @__PURE__ */ new Set();
  const permRules = ctx.state?.permissionRules;
  if (permRules?.tools) {
    for (const [name, policy] of Object.entries(permRules.tools)) {
      if (policy === "deny") deniedTools.add(name);
    }
  }
  const toolGuidance = buildToolGuidance(ctx.modeId, { hasWebSearch, deniedTools });
  const baseCtx = {
    projectPath: ctx.workingDir,
    projectName: ctx.projectName || "unknown",
    gitBranch: ctx.gitBranch,
    platform: process.platform,
    date: ctx.currentDate,
    mode: ctx.modeId,
    modelId: ctx.modelId,
    toolGuidance
  };
  const base = buildBasePrompt(baseCtx);
  const entry = modePrompts[ctx.modeId] || modePrompts.build;
  const modeSpecific = (typeof entry === "function" ? entry(ctx) : entry) ?? "";
  const modelSpecific = ctx.modelId ? modelSpecificPrompts[ctx.modelId] ?? "" : "";
  let taskSection = "";
  const tasks = ctx.state?.tasks;
  if (tasks && tasks.length > 0) {
    const lines = tasks.map((t) => {
      const icon = t.status === "completed" ? "\u2713" : t.status === "in_progress" ? "\u25B8" : "\u25CB";
      return `  ${icon} [${t.status}] ${t.content}`;
    });
    taskSection = `
<current-task-list>
${lines.join("\n")}
</current-task-list>
`;
  }
  const instructionSources = loadAgentInstructions(ctx.workingDir);
  const instructionsSection = formatAgentInstructions(instructionSources);
  const sections = [
    base,
    taskSection.trim(),
    instructionsSection.trim(),
    modelSpecific.trim(),
    modeSpecific.trim()
  ].filter(Boolean);
  return sections.join("\n\n");
}

// src/agents/instructions.ts
function getDynamicInstructions({ requestContext }) {
  const harnessContext = requestContext.get("harness");
  const state = harnessContext?.state;
  const modeId = harnessContext?.modeId ?? "build";
  const projectPath = state?.projectPath ?? process.cwd();
  const promptCtx = {
    projectPath,
    projectName: state?.projectName ?? "",
    gitBranch: chunkP2NLJLNZ_cjs.getCurrentGitBranch(projectPath) ?? state?.gitBranch,
    platform: process.platform,
    date: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
    mode: modeId,
    modelId: state?.currentModelId || void 0,
    activePlan: state?.activePlan ?? null,
    modeId,
    currentDate: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
    workingDir: state?.projectPath ?? process.cwd(),
    state
  };
  return buildFullPrompt(promptCtx);
}

// src/constants.ts
var DEFAULT_OM_MODEL_ID = process.env.DEFAULT_OM_MODEL_ID ?? "google/gemini-2.5-flash";
var DEFAULT_OBS_THRESHOLD = 3e4;
var DEFAULT_REF_THRESHOLD = 4e4;
var claudeCodeIdentity = "You are Claude Code, Anthropic's official CLI for Claude.";
var authStorageInstance = null;
function getAuthStorage() {
  if (!authStorageInstance) {
    authStorageInstance = new chunkP2NLJLNZ_cjs.AuthStorage();
  }
  return authStorageInstance;
}
function setAuthStorage(storage) {
  authStorageInstance = storage ?? null;
}
var claudeCodeMiddleware = {
  specificationVersion: "v3",
  transformParams: async ({ params }) => {
    const systemMessage = {
      role: "system",
      content: claudeCodeIdentity
    };
    if (params.temperature) {
      delete params.topP;
    }
    return {
      ...params,
      prompt: [systemMessage, ...params.prompt]
    };
  }
};
var promptCacheMiddleware = {
  specificationVersion: "v3",
  transformParams: async ({ params }) => {
    const prompt = [...params.prompt];
    const cacheControl = { type: "ephemeral", ttl: "5m" };
    const addCacheToMessage = (msg) => {
      if (typeof msg.content === "string") {
        return {
          ...msg,
          providerOptions: {
            ...msg.providerOptions,
            anthropic: { ...msg.providerOptions?.anthropic, cacheControl }
          }
        };
      }
      if (Array.isArray(msg.content) && msg.content.length > 0) {
        const content = [...msg.content];
        const lastPart = content[content.length - 1];
        content[content.length - 1] = {
          ...lastPart,
          providerOptions: {
            ...lastPart.providerOptions,
            anthropic: { ...lastPart.providerOptions?.anthropic, cacheControl }
          }
        };
        return { ...msg, content };
      }
      return msg;
    };
    let lastSystemIdx = -1;
    for (let i = prompt.length - 1; i >= 0; i--) {
      if (prompt[i].role === "system") {
        lastSystemIdx = i;
        break;
      }
    }
    if (lastSystemIdx >= 0) {
      prompt[lastSystemIdx] = addCacheToMessage(prompt[lastSystemIdx]);
    }
    const lastIdx = prompt.length - 1;
    if (lastIdx >= 0 && lastIdx !== lastSystemIdx) {
      prompt[lastIdx] = addCacheToMessage(prompt[lastIdx]);
    }
    return { ...params, prompt };
  }
};
function buildAnthropicOAuthFetch(opts = {}) {
  return (async (url, init) => {
    const storage = opts.authStorage ?? getAuthStorage();
    storage.reload();
    const storedCred = storage.get("anthropic");
    if (storedCred?.type === "api_key") {
      throw new Error("Anthropic API key credential is configured, but OAuth is required.");
    }
    const accessToken = await storage.getApiKey("anthropic");
    if (!accessToken) {
      throw new Error("Not logged in to Anthropic. Run /login first.");
    }
    const headers = new Headers();
    if (init?.headers) {
      const source = init.headers instanceof Headers ? init.headers : Array.isArray(init.headers) ? new Headers(init.headers) : new Headers(init.headers);
      source.forEach((value, key) => {
        const lower = key.toLowerCase();
        if (lower !== "authorization" && lower !== "x-api-key") {
          headers.set(key, value);
        }
      });
    }
    headers.set("Authorization", `Bearer ${accessToken}`);
    headers.set(
      "anthropic-beta",
      "oauth-2025-04-20,claude-code-20250219,interleaved-thinking-2025-05-14,fine-grained-tool-streaming-2025-05-14"
    );
    headers.set("anthropic-version", "2023-06-01");
    try {
      return await fetch(url, { ...init, headers });
    } catch (error) {
      if (error && typeof error === "object") {
        Object.assign(error, {
          requestUrl: url instanceof URL ? url.toString() : typeof url === "string" ? url : url.url
        });
      }
      throw error;
    }
  });
}
function opencodeClaudeMaxProvider(modelId = "claude-sonnet-4-20250514", options) {
  const headers = options?.headers;
  if (process.env.NODE_ENV === "test" || process.env.VITEST) {
    const anthropic2 = anthropic.createAnthropic({
      apiKey: "test-api-key",
      headers
    });
    return ai.wrapLanguageModel({
      model: anthropic2(modelId),
      middleware: [claudeCodeMiddleware, promptCacheMiddleware]
    });
  }
  const anthropic$1 = anthropic.createAnthropic({
    apiKey: "oauth-placeholder",
    headers,
    fetch: buildAnthropicOAuthFetch()
  });
  return ai.wrapLanguageModel({
    model: anthropic$1(modelId),
    middleware: [claudeCodeMiddleware, promptCacheMiddleware]
  });
}
var CODEX_API_ENDPOINT = "https://chatgpt.com/backend-api/codex/responses";
var authStorageInstance2 = null;
function getAuthStorage2() {
  if (!authStorageInstance2) {
    authStorageInstance2 = new chunkP2NLJLNZ_cjs.AuthStorage();
  }
  return authStorageInstance2;
}
function setAuthStorage2(storage) {
  authStorageInstance2 = storage ?? null;
}
var CODEX_INSTRUCTIONS = `You are an interactive CLI tool that helps users with software engineering tasks. Use the instructions below and the tools available to you to assist the user.

IMPORTANT: You should be concise, direct, and helpful. Focus on solving the user's problem efficiently.`;
var GPT5_MODEL_RE = /^gpt-5(?:\.|-|$)/;
function getEffectiveThinkingLevel(modelId, level) {
  if (GPT5_MODEL_RE.test(modelId) && level === "off") {
    return "low";
  }
  return level;
}
var THINKING_LEVEL_TO_REASONING_EFFORT = {
  off: void 0,
  low: "low",
  medium: "medium",
  high: "high",
  xhigh: "xhigh"
};
function createCodexMiddleware(reasoningEffort) {
  return {
    specificationVersion: "v3",
    transformParams: async ({ params }) => {
      if (params.temperature !== void 0 && params.temperature !== null) {
        delete params.topP;
      }
      params.providerOptions = {
        ...params.providerOptions,
        openai: {
          ...params.providerOptions?.openai ?? {},
          instructions: CODEX_INSTRUCTIONS,
          // Codex API requires store to be false
          store: false,
          // Enable reasoning for Codex models — without this, the model
          // skips the reasoning/action phase and goes straight to final_answer,
          // resulting in narration instead of tool calls.
          ...reasoningEffort ? { reasoningEffort } : {}
        }
      };
      return params;
    }
  };
}
function buildOpenAICodexOAuthFetch(opts = {}) {
  return (async (url, init) => {
    const storage = opts.authStorage ?? getAuthStorage2();
    storage.reload();
    const cred = storage.get("openai-codex");
    if (!cred || cred.type !== "oauth") {
      throw new Error("Not logged in to OpenAI Codex. Run /login first.");
    }
    let accessToken = cred.access;
    if (Date.now() >= cred.expires) {
      const refreshedToken = await storage.getApiKey("openai-codex");
      if (!refreshedToken) {
        throw new Error("Failed to refresh OpenAI Codex token. Please /login again.");
      }
      accessToken = refreshedToken;
      storage.reload();
    }
    const accountId = cred.accountId;
    const headers = new Headers();
    if (init?.headers) {
      if (init.headers instanceof Headers) {
        init.headers.forEach((value, key) => {
          if (key.toLowerCase() !== "authorization") {
            headers.set(key, value);
          }
        });
      } else if (Array.isArray(init.headers)) {
        for (const [key, value] of init.headers) {
          if (key.toLowerCase() !== "authorization" && value !== void 0) {
            headers.set(key, String(value));
          }
        }
      } else {
        for (const [key, value] of Object.entries(init.headers)) {
          if (key.toLowerCase() !== "authorization" && value !== void 0) {
            headers.set(key, String(value));
          }
        }
      }
    }
    headers.set("Authorization", `Bearer ${accessToken}`);
    if (accountId) {
      headers.set("ChatGPT-Account-Id", accountId);
    }
    const parsed = url instanceof URL ? url : new URL(typeof url === "string" ? url : url.url);
    const shouldRewrite = opts.rewriteUrl !== false && (parsed.pathname.includes("/v1/responses") || parsed.pathname.includes("/chat/completions"));
    const finalUrl = shouldRewrite ? new URL(CODEX_API_ENDPOINT) : parsed;
    try {
      return await fetch(finalUrl, { ...init, headers });
    } catch (error) {
      if (error && typeof error === "object") {
        Object.assign(error, {
          requestUrl: finalUrl.toString()
        });
      }
      throw error;
    }
  });
}
function openaiCodexProvider(modelId = "codex-mini-latest", options) {
  const requestedLevel = options?.thinkingLevel ?? "medium";
  const effectiveLevel = getEffectiveThinkingLevel(modelId, requestedLevel);
  const reasoningEffort = THINKING_LEVEL_TO_REASONING_EFFORT[effectiveLevel];
  const middleware = createCodexMiddleware(reasoningEffort);
  const headers = options?.headers;
  if (process.env.NODE_ENV === "test" || process.env.VITEST) {
    const openai2 = openai.createOpenAI({
      apiKey: "test-api-key",
      headers
    });
    return ai.wrapLanguageModel({
      model: openai2.responses(modelId),
      middleware: [middleware]
    });
  }
  const openai$1 = openai.createOpenAI({
    apiKey: "oauth-dummy-key",
    headers,
    fetch: buildOpenAICodexOAuthFetch()
  });
  return ai.wrapLanguageModel({
    model: openai$1.responses(modelId),
    middleware: [middleware]
  });
}

// src/agents/model.ts
var authStorage = new chunkP2NLJLNZ_cjs.AuthStorage();
var OPENAI_PREFIX = "openai/";
var MASTRA_GATEWAY_PREFIX = "mastra/";
var CODEX_OPENAI_MODEL_REMAPS = {
  "gpt-5.3": "gpt-5.3-codex",
  "gpt-5.2": "gpt-5.2-codex",
  "gpt-5.1": "gpt-5.1-codex",
  "gpt-5.1-mini": "gpt-5.1-codex-mini",
  "gpt-5": "gpt-5-codex"
};
function getHarnessHeaders(requestContext) {
  const harnessContext = requestContext?.get("harness");
  const headers = {
    ...harnessContext?.threadId ? { "x-thread-id": harnessContext.threadId } : {},
    ...harnessContext?.resourceId ? { "x-resource-id": harnessContext.resourceId } : {}
  };
  return Object.keys(headers).length > 0 ? headers : void 0;
}
function stripMastraGatewayPrefix(modelId) {
  return modelId.startsWith(MASTRA_GATEWAY_PREFIX) ? modelId.substring(MASTRA_GATEWAY_PREFIX.length) : modelId;
}
function normalizeAnthropicModelId(modelId) {
  return modelId.replace(/\.(?=\d)/g, "-");
}
function remapOpenAIModelForCodexOAuth(modelId) {
  const normalizedModelId = stripMastraGatewayPrefix(modelId);
  if (!normalizedModelId.startsWith(OPENAI_PREFIX)) {
    return modelId;
  }
  const openaiModelId = normalizedModelId.substring(OPENAI_PREFIX.length);
  if (openaiModelId.includes("-codex")) {
    return modelId;
  }
  const codexModelId = CODEX_OPENAI_MODEL_REMAPS[openaiModelId];
  if (!codexModelId) {
    return modelId;
  }
  const remappedModelId = `${OPENAI_PREFIX}${codexModelId}`;
  return modelId.startsWith(MASTRA_GATEWAY_PREFIX) ? `${MASTRA_GATEWAY_PREFIX}${remappedModelId}` : remappedModelId;
}
function getAnthropicApiKey() {
  const storedCred = authStorage.get("anthropic");
  if (storedCred?.type === "api_key" && storedCred.key.trim().length > 0) {
    return storedCred.key.trim();
  }
  return void 0;
}
function getOpenAIApiKey() {
  const storedCred = authStorage.get("openai-codex");
  if (storedCred?.type === "api_key" && storedCred.key.trim().length > 0) {
    return storedCred.key.trim();
  }
  return void 0;
}
function anthropicApiKeyProvider(modelId, apiKey, headers) {
  const anthropic$1 = anthropic.createAnthropic({ apiKey, headers });
  return ai.wrapLanguageModel({
    model: anthropic$1(modelId),
    middleware: [promptCacheMiddleware]
  });
}
function openaiApiKeyProvider(modelId, apiKey, headers) {
  const openai$1 = openai.createOpenAI({ apiKey, headers });
  return ai.wrapLanguageModel({
    model: openai$1.responses(modelId),
    middleware: []
  });
}
function resolveModel(modelId, options) {
  authStorage.reload();
  const headers = getHarnessHeaders(options?.requestContext);
  const isMastraGatewayModel = modelId.startsWith(MASTRA_GATEWAY_PREFIX);
  const normalizedModelId = stripMastraGatewayPrefix(modelId);
  const [providerId, modelName] = normalizedModelId.split("/", 2);
  const settings = chunkWOKNPWRC_cjs.loadSettings();
  const customProvider = !isMastraGatewayModel && providerId && modelName ? settings.customProviders.find((provider) => {
    return providerId === chunkWOKNPWRC_cjs.getCustomProviderId(provider.name);
  }) : void 0;
  if (customProvider) {
    return new llm.ModelRouterLanguageModel({
      id: normalizedModelId,
      url: customProvider.url,
      apiKey: customProvider.apiKey,
      headers
    });
  }
  const mgApiKey = authStorage.getStoredApiKey(chunkWOKNPWRC_cjs.MEMORY_GATEWAY_PROVIDER) ?? process.env["MASTRA_GATEWAY_API_KEY"];
  if (mgApiKey && isMastraGatewayModel) {
    const rawBase = settings.memoryGateway?.baseUrl ?? process.env["MASTRA_GATEWAY_URL"] ?? "https://gateway-api.mastra.ai";
    const gatewayBaseURL = rawBase.replace(/\/+$/, "").replace(/\/v1$/, "") + "/v1";
    const anthropicCred = authStorage.get("anthropic");
    const openaiCred = authStorage.get("openai-codex");
    if (normalizedModelId.startsWith("anthropic/") && anthropicCred?.type === "oauth") {
      const bareModelId = normalizeAnthropicModelId(normalizedModelId.substring("anthropic/".length));
      const anthropic$1 = anthropic.createAnthropic({
        apiKey: "oauth-gateway-placeholder",
        baseURL: gatewayBaseURL,
        headers: {
          [llm.GATEWAY_AUTH_HEADER]: `Bearer ${mgApiKey}`,
          ...headers
        },
        fetch: buildAnthropicOAuthFetch({ authStorage })
      });
      return ai.wrapLanguageModel({
        model: anthropic$1(bareModelId),
        middleware: [claudeCodeMiddleware, promptCacheMiddleware]
      });
    }
    if (normalizedModelId.startsWith("openai/") && openaiCred?.type === "oauth") {
      const resolvedModelId = options?.remapForCodexOAuth ? remapOpenAIModelForCodexOAuth(normalizedModelId) : normalizedModelId;
      const resolvedBareModelId = resolvedModelId.substring("openai/".length);
      const requestedLevel = options?.thinkingLevel ?? "medium";
      const effectiveLevel = getEffectiveThinkingLevel(resolvedBareModelId, requestedLevel);
      const reasoningEffort = THINKING_LEVEL_TO_REASONING_EFFORT[effectiveLevel];
      const middleware = createCodexMiddleware(reasoningEffort);
      const openai$1 = openai.createOpenAI({
        apiKey: "oauth-gateway-placeholder",
        baseURL: gatewayBaseURL,
        headers: {
          [llm.GATEWAY_AUTH_HEADER]: `Bearer ${mgApiKey}`,
          ...headers
        },
        fetch: buildOpenAICodexOAuthFetch({ authStorage, rewriteUrl: false })
      });
      return ai.wrapLanguageModel({
        model: openai$1.responses(resolvedBareModelId),
        middleware: [middleware]
      });
    }
    const gateway = new llm.MastraGateway({
      apiKey: mgApiKey,
      baseUrl: gatewayBaseURL.replace(/\/v1$/, "")
    });
    return new llm.ModelRouterLanguageModel({ id: `mastra/${normalizedModelId}`, headers }, [
      gateway
    ]);
  }
  const isAnthropicModel = normalizedModelId.startsWith("anthropic/");
  const isOpenAIModel = normalizedModelId.startsWith(OPENAI_PREFIX);
  const isMoonshotModel = normalizedModelId.startsWith("moonshotai/");
  if (isMoonshotModel) {
    if (!process.env.MOONSHOT_AI_API_KEY) {
      throw new Error(`Need MOONSHOT_AI_API_KEY`);
    }
    return anthropic.createAnthropic({
      apiKey: process.env.MOONSHOT_AI_API_KEY,
      baseURL: "https://api.moonshot.ai/anthropic/v1",
      name: "moonshotai.anthropicv1",
      headers
    })(normalizedModelId.substring("moonshotai/".length));
  } else if (isAnthropicModel) {
    const bareModelId = normalizeAnthropicModelId(normalizedModelId.substring("anthropic/".length));
    const storedCred = authStorage.get("anthropic");
    if (storedCred?.type === "oauth") {
      return opencodeClaudeMaxProvider(bareModelId, { headers });
    }
    if (storedCred?.type === "api_key" && storedCred.key.trim().length > 0) {
      return anthropicApiKeyProvider(bareModelId, storedCred.key.trim(), headers);
    }
    const apiKey = getAnthropicApiKey();
    if (apiKey) {
      return anthropicApiKeyProvider(bareModelId, apiKey, headers);
    }
    return opencodeClaudeMaxProvider(bareModelId, { headers });
  } else if (isOpenAIModel) {
    const bareModelId = normalizedModelId.substring(OPENAI_PREFIX.length);
    const storedCred = authStorage.get("openai-codex");
    if (storedCred?.type === "oauth") {
      const resolvedModelId = options?.remapForCodexOAuth ? remapOpenAIModelForCodexOAuth(normalizedModelId) : normalizedModelId;
      return openaiCodexProvider(resolvedModelId.substring(OPENAI_PREFIX.length), {
        thinkingLevel: options?.thinkingLevel,
        headers
      });
    }
    const apiKey = getOpenAIApiKey();
    if (apiKey) {
      return openaiApiKeyProvider(bareModelId, apiKey, headers);
    }
    return new llm.ModelRouterLanguageModel({ id: normalizedModelId, headers });
  } else {
    return new llm.ModelRouterLanguageModel({ id: normalizedModelId, headers });
  }
}
function getDynamicModel({ requestContext }) {
  const harnessContext = requestContext.get("harness");
  const modelId = harnessContext?.state?.currentModelId;
  if (!modelId) {
    throw new Error("No model selected. Use /models to select a model first.");
  }
  const thinkingLevel = harnessContext?.state?.thinkingLevel;
  return resolveModel(modelId, { thinkingLevel, requestContext });
}

// src/agents/memory.ts
var cachedMemory = null;
var cachedMemoryKey = null;
function getHarnessState(requestContext) {
  return requestContext.get("harness")?.getState?.();
}
function getObserverModel({ requestContext }) {
  const state = getHarnessState(requestContext);
  return resolveModel(state?.observerModelId ?? DEFAULT_OM_MODEL_ID, {
    remapForCodexOAuth: true,
    requestContext
  });
}
function getReflectorModel({ requestContext }) {
  const state = getHarnessState(requestContext);
  return resolveModel(state?.reflectorModelId ?? DEFAULT_OM_MODEL_ID, {
    remapForCodexOAuth: true,
    requestContext
  });
}
function getDynamicMemory(storage, vector) {
  return ({ requestContext }) => {
    const state = getHarnessState(requestContext);
    const omScope = state?.omScope ?? chunkP2NLJLNZ_cjs.getOmScope(state?.projectPath);
    const obsThreshold = state?.observationThreshold ?? DEFAULT_OBS_THRESHOLD;
    const refThreshold = state?.reflectionThreshold ?? DEFAULT_REF_THRESHOLD;
    const observerPreviousObservationTokens = 1e3;
    const cacheKey = `${obsThreshold}:${refThreshold}:${omScope}:${observerPreviousObservationTokens}`;
    if (cachedMemory && cachedMemoryKey === cacheKey) {
      return cachedMemory;
    }
    const isResourceScope = omScope === "resource";
    cachedMemory = new memory.Memory({
      storage,
      vector: vector || false,
      embedder: vector ? fastembed.fastembed.small : void 0,
      options: {
        observationalMemory: {
          enabled: true,
          retrieval: vector ? { vector: true } : true,
          scope: omScope,
          observation: {
            bufferTokens: isResourceScope ? false : 1 / 5,
            bufferActivation: isResourceScope ? void 0 : 2e3,
            model: getObserverModel,
            messageTokens: obsThreshold,
            blockAfter: 2,
            previousObserverTokens: observerPreviousObservationTokens,
            threadTitle: true,
            instruction: 'Messages wrapped in <system-reminder type="dynamic-agents-md" ...>...</system-reminder> are ephemeral project-context instructions injected from files on disk. Do NOT observe or extract information from these messages \u2014 they are reloaded automatically when needed and should not be stored in memory.'
          },
          reflection: {
            bufferActivation: isResourceScope ? void 0 : 1 / 2,
            blockAfter: 1.1,
            model: getReflectorModel,
            observationTokens: refThreshold
          }
        }
      }
    });
    cachedMemoryKey = cacheKey;
    return cachedMemory;
  };
}
var executeSubagent = {
  id: "execute",
  name: "Execute",
  description: "Task execution with write capabilities. Use for 'implement feature X', 'fix bug Y', 'refactor module Z'.",
  instructions: `You are a focused execution agent. Your job is to complete a specific, well-defined task by making the necessary changes to the codebase.

## Rules
- You have FULL ACCESS to read, write, and execute within your task scope.
- Stay focused on the specific task given. Do not make unrelated changes.
- Read files before modifying them \u2014 use view first, then string_replace_lsp or write_file.
- Verify your changes work by running relevant tests or checking for errors.

## Tool Strategy
- **Read first**: Always view a file before editing it
- **Edit precisely**: Use string_replace_lsp with enough context to match uniquely
- **Use specialized tools**: Prefer view/search_content/find_files over shell commands for reading
- **Parallelize**: Make independent tool calls together (e.g., view multiple files at once)

## Workflow
. Understand the task and explore relevant code
. For complex tasks (3+ steps): use task_write to track progress
. Make changes incrementally \u2014 verify each change before moving on
. Run tests or type-check to verify
. If you created tasks: ALWAYS call task_check before finishing

## Efficiency
Your output returns to the parent agent. Be concise:
- Don't repeat file contents in your response
- Summarize what changed, don't narrate each step
- Keep your final summary under 300 words

## Output Format
End with a structured summary:
. **Completed**: What you implemented (1-2 sentences)
. **Changes**: Files modified/created
. **Verification**: How you verified it works
. **Notes**: Follow-up needed (if any)`,
  tools: {
    task_write: harness.taskWriteTool,
    task_check: harness.taskCheckTool
  }
};

// src/agents/subagents/explore.ts
var exploreSubagent = {
  id: "explore",
  name: "Explore",
  description: "Read-only codebase exploration. Use for questions like 'find all usages of X', 'how does module Y work'.",
  instructions: `You are an expert code explorer. Your job is to investigate a codebase and answer a specific question or gather specific information.

## Rules
- You have READ-ONLY access. You cannot modify files or run commands.
- Be thorough \u2014 search broadly first, then drill into relevant files.
- After gathering enough information, produce a clear, concise summary of your findings.

## Tool Strategy
- **Start broad**: Use find_files (glob) to understand project structure
- **Search smart**: Use search_content (grep) with specific patterns \u2014 avoid overly broad searches
- **Read efficiently**: Use view with view_range for large files \u2014 don't read entire files if you only need a section
- **Parallelize**: Make multiple independent tool calls in one round when exploring different areas

## Efficiency
Your output returns to the parent agent. Be concise:
- Don't include raw file contents in your response \u2014 summarize what you found
- Reference files by path and line number, not by copying code
- If a search returns many results, report the count and key examples, not every match

## Output Format
End with a structured summary:
. **Answer**: Direct answer to the question (1-2 sentences)
. **Key Files**: Most relevant files with line numbers
. **Details**: Additional context if needed

Keep your summary under 300 words.`,
  allowedWorkspaceTools: [chunkOBFBUWOR_cjs.MC_TOOLS.VIEW, chunkOBFBUWOR_cjs.MC_TOOLS.SEARCH_CONTENT, chunkOBFBUWOR_cjs.MC_TOOLS.FIND_FILES]
};

// src/agents/subagents/plan.ts
var planSubagent = {
  id: "plan",
  name: "Plan",
  description: "Read-only analysis and planning. Use for 'create an implementation plan for X', 'analyze the architecture of Y'.",
  instructions: `You are an expert software architect and planner. Your job is to analyze a codebase and produce a detailed implementation plan for a given task.

## Rules
- You have READ-ONLY access. You cannot modify files or run commands.
- First, explore the codebase to understand existing patterns, architecture, and conventions.
- Produce a concrete, actionable plan \u2014 not vague suggestions.

## Tool Strategy
- **Discover structure**: Use find_files (glob) to understand project layout and find relevant files
- **Find patterns**: Use search_content (grep) to locate existing implementations, imports, and conventions
- **Understand deeply**: Use view with view_range to read specific sections of key files
- **Parallelize**: Make multiple independent tool calls when exploring different areas

## Efficiency
Your output returns to the parent agent. Be concise:
- Don't include raw file contents \u2014 reference by path and line number
- Focus on actionable details, not general observations
- If you find many similar patterns, describe the pattern once with examples

## Output Format
Structure your plan as:

. **Summary**: One-paragraph overview (2-3 sentences)
. **Files to Change**: List each file with specific changes needed
. **Implementation Order**: Numbered steps in dependency order
. **Risks**: Potential issues or edge cases (if any)

Be specific about code locations (file paths, function names, line numbers). Keep the plan actionable and under 500 words.`,
  allowedWorkspaceTools: [chunkOBFBUWOR_cjs.MC_TOOLS.VIEW, chunkOBFBUWOR_cjs.MC_TOOLS.SEARCH_CONTENT, chunkOBFBUWOR_cjs.MC_TOOLS.FIND_FILES]
};
function wrapToolWithHooks(toolName, tool, hookManager) {
  if (!hookManager || typeof tool?.execute !== "function") {
    return tool;
  }
  return {
    ...tool,
    async execute(input, toolContext) {
      const preResult = await hookManager.runPreToolUse(toolName, input);
      if (!preResult.allowed) {
        return {
          error: preResult.blockReason ?? `Blocked by PreToolUse hook for tool "${toolName}"`
        };
      }
      let output;
      let toolError = false;
      try {
        output = await tool.execute(input, toolContext);
        return output;
      } catch (error) {
        toolError = true;
        output = {
          error: error instanceof Error ? error.message : String(error)
        };
        throw error;
      } finally {
        await hookManager.runPostToolUse(toolName, input, output, toolError).catch(() => void 0);
      }
    }
  };
}
function createDynamicTools(mcpManager, extraTools, hookManager, disabledTools) {
  return function getDynamicTools({ requestContext }) {
    const ctx = requestContext.get("harness");
    const state = ctx?.getState?.();
    const modelId = state?.currentModelId;
    const isAnthropicModel = modelId?.startsWith("anthropic/");
    const isOpenAIModel = modelId?.startsWith("openai/");
    const tools = {
      request_access: requestSandboxAccessTool
    };
    if (hasTavilyKey()) {
      tools.web_search = createWebSearchTool();
      tools.web_extract = createWebExtractTool();
    } else if (isAnthropicModel) {
      const anthropic$1 = anthropic.createAnthropic({});
      tools.web_search = anthropic$1.tools.webSearch_20250305();
    } else if (isOpenAIModel) {
      const openai$1 = openai.createOpenAI({});
      tools.web_search = openai$1.tools.webSearch();
    }
    if (mcpManager) {
      const mcpTools = mcpManager.getTools();
      Object.assign(tools, mcpTools);
    }
    if (extraTools) {
      const resolved = typeof extraTools === "function" ? extraTools({ requestContext }) : extraTools;
      for (const [name, tool] of Object.entries(resolved)) {
        if (!(name in tools)) {
          tools[name] = tool;
        }
      }
    }
    if (disabledTools?.length) {
      for (const toolName of disabledTools) {
        delete tools[toolName];
      }
    }
    const permissionRules = state?.permissionRules;
    if (permissionRules?.tools) {
      for (const [name, policy] of Object.entries(permissionRules.tools)) {
        if (policy === "deny") {
          delete tools[name];
        }
      }
    }
    for (const [toolName, tool] of Object.entries(tools)) {
      tools[toolName] = wrapToolWithHooks(toolName, tool, hookManager);
    }
    return tools;
  };
}
var VALID_EVENTS = [
  "PreToolUse",
  "PostToolUse",
  "Stop",
  "UserPromptSubmit",
  "SessionStart",
  "SessionEnd"
];
function loadHooksConfig(projectDir) {
  const globalPath = getGlobalHooksPath();
  const projectPath = getProjectHooksPath(projectDir);
  const globalConfig = loadSingleConfig(globalPath);
  const projectConfig = loadSingleConfig(projectPath);
  return mergeConfigs(globalConfig, projectConfig);
}
function getProjectHooksPath(projectDir) {
  return path__namespace.join(projectDir, ".mastracode", "hooks.json");
}
function getGlobalHooksPath() {
  return path__namespace.join(os__namespace.homedir(), ".mastracode", "hooks.json");
}
function loadSingleConfig(filePath) {
  try {
    if (!fs4__namespace.existsSync(filePath)) return {};
    const raw = fs4__namespace.readFileSync(filePath, "utf-8");
    return validateConfig(JSON.parse(raw));
  } catch {
    return {};
  }
}
function validateConfig(raw) {
  if (!raw || typeof raw !== "object") return {};
  const config = {};
  const obj = raw;
  for (const event of VALID_EVENTS) {
    if (Array.isArray(obj[event])) {
      const hooks = obj[event].filter(isValidHook);
      if (hooks.length > 0) {
        config[event] = hooks;
      }
    }
  }
  return config;
}
function isValidHook(raw) {
  if (!raw || typeof raw !== "object") return false;
  const obj = raw;
  return obj.type === "command" && typeof obj.command === "string";
}
function mergeConfigs(global, project) {
  const merged = {};
  for (const event of VALID_EVENTS) {
    const combined = [...global[event] ?? [], ...project[event] ?? []];
    if (combined.length > 0) {
      merged[event] = combined;
    }
  }
  return merged;
}

// src/hooks/types.ts
function isBlockingEvent(event) {
  return event === "PreToolUse" || event === "Stop" || event === "UserPromptSubmit";
}

// src/hooks/executor.ts
var DEFAULT_TIMEOUT = 1e4;
async function executeHook(hook, stdinPayload) {
  const timeout = hook.timeout ?? DEFAULT_TIMEOUT;
  const startTime = Date.now();
  return new Promise((resolve3) => {
    const isWindows = process.platform === "win32";
    const shell = isWindows ? "cmd" : "/bin/sh";
    const shellArgs = isWindows ? ["/c", hook.command] : ["-c", hook.command];
    const child = child_process.spawn(shell, shellArgs, {
      stdio: ["pipe", "pipe", "pipe"],
      cwd: stdinPayload.cwd,
      env: {
        ...process.env,
        MASTRA_HOOK_EVENT: stdinPayload.hook_event_name
      }
    });
    let stdout = "";
    let stderr = "";
    let timedOut = false;
    let resolved = false;
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGKILL");
    }, timeout);
    child.stdout?.on("data", (data) => {
      stdout += data.toString();
    });
    child.stderr?.on("data", (data) => {
      stderr += data.toString();
    });
    child.on("close", (exitCode) => {
      clearTimeout(timer);
      if (resolved) return;
      resolved = true;
      let parsedStdout;
      if (stdout.trim()) {
        try {
          parsedStdout = JSON.parse(stdout.trim());
        } catch {
        }
      }
      resolve3({
        hook,
        exitCode: exitCode ?? 1,
        stdout: parsedStdout,
        stderr: stderr.trim() || void 0,
        timedOut,
        durationMs: Date.now() - startTime
      });
    });
    child.on("error", (error) => {
      clearTimeout(timer);
      if (resolved) return;
      resolved = true;
      resolve3({
        hook,
        exitCode: 1,
        stderr: error.message,
        timedOut: false,
        durationMs: Date.now() - startTime
      });
    });
    try {
      child.stdin?.write(JSON.stringify(stdinPayload));
      child.stdin?.end();
    } catch {
    }
  });
}
function matchesHook(hook, context) {
  if (!hook.matcher) return true;
  if (hook.matcher.tool_name) {
    if (!context.tool_name) return false;
    try {
      return new RegExp(hook.matcher.tool_name).test(context.tool_name);
    } catch {
      return false;
    }
  }
  return true;
}
async function runHooksForEvent(hooks, stdinPayload, matchContext = {}) {
  const results = [];
  const warnings = [];
  let additionalContext;
  const applicable = hooks.filter((h) => matchesHook(h, matchContext));
  if (applicable.length === 0) {
    return { allowed: true, results: [], warnings: [] };
  }
  const blocking = isBlockingEvent(stdinPayload.hook_event_name);
  for (const hook of applicable) {
    const result = await executeHook(hook, stdinPayload);
    results.push(result);
    if (result.stdout?.additionalContext) {
      additionalContext = additionalContext ? `${additionalContext}
${result.stdout.additionalContext}` : result.stdout.additionalContext;
    }
    if (result.timedOut) {
      warnings.push(`Hook timed out after ${hook.timeout ?? DEFAULT_TIMEOUT}ms: ${hook.command}`);
      continue;
    }
    if (result.exitCode === 2 && blocking) {
      const reason = result.stdout?.reason || result.stderr || `Blocked by hook: ${hook.description || hook.command}`;
      return {
        allowed: false,
        blockReason: reason,
        additionalContext,
        results,
        warnings
      };
    }
    if (result.exitCode === 0) continue;
    const warnMsg = result.stderr || `Hook exited with code ${result.exitCode}`;
    warnings.push(`${hook.description || hook.command}: ${warnMsg}`);
  }
  return { allowed: true, additionalContext, results, warnings };
}

// src/hooks/manager.ts
var HookManager = class {
  config;
  projectDir;
  sessionId;
  constructor(projectDir, sessionId) {
    this.projectDir = projectDir;
    this.sessionId = sessionId;
    this.config = loadHooksConfig(projectDir);
  }
  reload() {
    this.config = loadHooksConfig(this.projectDir);
  }
  setSessionId(sessionId) {
    this.sessionId = sessionId;
  }
  hasHooks() {
    return Object.keys(this.config).length > 0;
  }
  getConfig() {
    return this.config;
  }
  getConfigPaths() {
    return {
      project: getProjectHooksPath(this.projectDir),
      global: getGlobalHooksPath()
    };
  }
  // =========================================================================
  // Event Methods
  // =========================================================================
  async runPreToolUse(toolName, toolInput) {
    const hooks = this.config.PreToolUse;
    if (!hooks || hooks.length === 0) {
      return { allowed: true, results: [], warnings: [] };
    }
    const stdin = {
      session_id: this.sessionId,
      cwd: this.projectDir,
      hook_event_name: "PreToolUse",
      tool_name: toolName,
      tool_input: toolInput
    };
    return runHooksForEvent(hooks, stdin, { tool_name: toolName });
  }
  async runPostToolUse(toolName, toolInput, toolOutput, toolError) {
    const hooks = this.config.PostToolUse;
    if (!hooks || hooks.length === 0) {
      return { allowed: true, results: [], warnings: [] };
    }
    const stdin = {
      session_id: this.sessionId,
      cwd: this.projectDir,
      hook_event_name: "PostToolUse",
      tool_name: toolName,
      tool_input: toolInput,
      tool_output: toolOutput,
      tool_error: toolError
    };
    return runHooksForEvent(hooks, stdin, { tool_name: toolName });
  }
  async runUserPromptSubmit(userMessage) {
    const hooks = this.config.UserPromptSubmit;
    if (!hooks || hooks.length === 0) {
      return { allowed: true, results: [], warnings: [] };
    }
    const stdin = {
      session_id: this.sessionId,
      cwd: this.projectDir,
      hook_event_name: "UserPromptSubmit",
      user_message: userMessage
    };
    return runHooksForEvent(hooks, stdin);
  }
  async runStop(assistantMessage, stopReason) {
    const hooks = this.config.Stop;
    if (!hooks || hooks.length === 0) {
      return { allowed: true, results: [], warnings: [] };
    }
    const stdin = {
      session_id: this.sessionId,
      cwd: this.projectDir,
      hook_event_name: "Stop",
      assistant_message: assistantMessage,
      stop_reason: stopReason
    };
    return runHooksForEvent(hooks, stdin);
  }
  async runSessionStart() {
    const hooks = this.config.SessionStart;
    if (!hooks || hooks.length === 0) {
      return { allowed: true, results: [], warnings: [] };
    }
    const stdin = {
      session_id: this.sessionId,
      cwd: this.projectDir,
      hook_event_name: "SessionStart"
    };
    return runHooksForEvent(hooks, stdin);
  }
  async runSessionEnd() {
    const hooks = this.config.SessionEnd;
    if (!hooks || hooks.length === 0) {
      return { allowed: true, results: [], warnings: [] };
    }
    const stdin = {
      session_id: this.sessionId,
      cwd: this.projectDir,
      hook_event_name: "SessionEnd"
    };
    return runHooksForEvent(hooks, stdin);
  }
  /**
   * Fire notification hooks (non-blocking, fire-and-forget).
   * Called when the TUI is waiting for user input.
   */
  runNotification(reason, message) {
    const hooks = this.config.Notification;
    if (!hooks || hooks.length === 0) return;
    const stdin = {
      session_id: this.sessionId,
      cwd: this.projectDir,
      hook_event_name: "Notification",
      reason,
      message
    };
    runHooksForEvent(hooks, stdin).catch(() => {
    });
  }
};
function loadMcpConfig(projectDir) {
  const claudeConfig = loadClaudeSettings(projectDir);
  const globalConfig = loadSingleConfig2(getGlobalMcpPath());
  const projectConfig = loadSingleConfig2(getProjectMcpPath(projectDir));
  return mergeConfigs2(claudeConfig, globalConfig, projectConfig);
}
function getProjectMcpPath(projectDir) {
  return path__namespace.join(projectDir, ".mastracode", "mcp.json");
}
function getGlobalMcpPath() {
  return path__namespace.join(os__namespace.homedir(), ".mastracode", "mcp.json");
}
function getClaudeSettingsPath(projectDir) {
  return path__namespace.join(projectDir, ".claude", "settings.local.json");
}
function loadSingleConfig2(filePath) {
  try {
    if (!fs4__namespace.existsSync(filePath)) return {};
    const raw = fs4__namespace.readFileSync(filePath, "utf-8");
    return validateConfig2(JSON.parse(raw));
  } catch {
    return {};
  }
}
function loadClaudeSettings(projectDir) {
  try {
    const filePath = getClaudeSettingsPath(projectDir);
    if (!fs4__namespace.existsSync(filePath)) return {};
    const raw = fs4__namespace.readFileSync(filePath, "utf-8");
    const parsed = JSON.parse(raw);
    if (parsed?.mcpServers && typeof parsed.mcpServers === "object") {
      return validateConfig2({ mcpServers: parsed.mcpServers });
    }
    return {};
  } catch {
    return {};
  }
}
function classifyServerEntry(raw) {
  if (!raw || typeof raw !== "object") {
    return { kind: "skip", reason: "Invalid entry: expected an object" };
  }
  const obj = raw;
  const hasCommand = typeof obj.command === "string";
  const hasUrl = typeof obj.url === "string";
  if (hasCommand && hasUrl) {
    return { kind: "skip", reason: 'Cannot specify both "command" and "url"' };
  }
  if (hasCommand) {
    return { kind: "stdio" };
  }
  if (hasUrl) {
    try {
      new URL(obj.url);
    } catch {
      return { kind: "skip", reason: `Invalid URL: "${obj.url}"` };
    }
    return { kind: "http" };
  }
  return { kind: "skip", reason: 'Missing required field: "command" (stdio) or "url" (http)' };
}
function validateConfig2(raw) {
  if (!raw || typeof raw !== "object") return {};
  const obj = raw;
  if (!obj.mcpServers || typeof obj.mcpServers !== "object") return {};
  const servers = {};
  const skippedServers = [];
  const rawServers = obj.mcpServers;
  for (const [name, entry] of Object.entries(rawServers)) {
    const classification = classifyServerEntry(entry);
    if (classification.kind === "stdio") {
      const e = entry;
      servers[name] = {
        command: e.command,
        args: Array.isArray(e.args) ? e.args : void 0,
        env: typeof e.env === "object" && e.env !== null ? e.env : void 0
      };
    } else if (classification.kind === "http") {
      const e = entry;
      servers[name] = {
        url: e.url,
        headers: typeof e.headers === "object" && e.headers !== null ? e.headers : void 0
      };
    } else {
      skippedServers.push({ name, reason: classification.reason });
    }
  }
  const result = {};
  if (Object.keys(servers).length > 0) {
    result.mcpServers = servers;
  }
  if (skippedServers.length > 0) {
    result.skippedServers = skippedServers;
  }
  return result;
}
function mergeConfigs2(...configs) {
  const merged = {};
  const allSkipped = [];
  for (const config of configs) {
    if (config.mcpServers) {
      for (const [name, server] of Object.entries(config.mcpServers)) {
        merged[name] = server;
      }
    }
    if (config.skippedServers) {
      allSkipped.push(...config.skippedServers);
    }
  }
  const validNames = new Set(Object.keys(merged));
  const filteredSkipped = allSkipped.filter((s) => !validNames.has(s.name));
  const skippedMap = /* @__PURE__ */ new Map();
  for (const s of filteredSkipped) {
    skippedMap.set(s.name, s);
  }
  const result = {};
  if (Object.keys(merged).length > 0) {
    result.mcpServers = merged;
  }
  if (skippedMap.size > 0) {
    result.skippedServers = Array.from(skippedMap.values());
  }
  return result;
}

// src/mcp/manager.ts
var MASTRACODE_MCP_TIMEOUT_MS = 7 * 24 * 60 * 60 * 1e3;
function getTransport(cfg) {
  return "url" in cfg ? "http" : "stdio";
}
function createMcpManager(projectDir, extraServers) {
  const applyExtraServers = (base) => {
    if (!extraServers || Object.keys(extraServers).length === 0) return base;
    return { ...base, mcpServers: { ...base.mcpServers, ...extraServers } };
  };
  let config = applyExtraServers(loadMcpConfig(projectDir));
  let client = null;
  let tools = {};
  let serverStatuses = /* @__PURE__ */ new Map();
  let stderrLogs = /* @__PURE__ */ new Map();
  let initialized = false;
  const MAX_STDERR_LINES = 200;
  function captureStderr(serverName) {
    if (!client || typeof client.getServerStderr !== "function") return;
    const stream = client.getServerStderr(serverName);
    if (!stream) return;
    let buffer = "";
    const lines = stderrLogs.get(serverName) ?? [];
    stderrLogs.set(serverName, lines);
    stream.on("data", (chunk) => {
      buffer += chunk.toString();
      const parts = buffer.split("\n");
      buffer = parts.pop();
      for (const line of parts) {
        if (line.trim()) {
          lines.push(line);
          if (lines.length > MAX_STDERR_LINES) {
            lines.shift();
          }
        }
      }
    });
    stream.on("end", () => {
      if (buffer.trim()) {
        lines.push(buffer);
        if (lines.length > MAX_STDERR_LINES) {
          lines.shift();
        }
      }
    });
  }
  function buildServerDefs(servers) {
    const defs = {};
    for (const [name, cfg] of Object.entries(servers)) {
      if ("url" in cfg) {
        const httpCfg = cfg;
        defs[name] = {
          url: new URL(httpCfg.url),
          requestInit: httpCfg.headers ? { headers: httpCfg.headers } : void 0
        };
      } else {
        defs[name] = { command: cfg.command, args: cfg.args, env: cfg.env, stderr: "pipe" };
      }
    }
    return defs;
  }
  async function connectAndCollectTools() {
    const servers = config.mcpServers;
    if (!servers || Object.keys(servers).length === 0) {
      return;
    }
    const serverNames = Object.keys(servers);
    for (const name of serverNames) {
      serverStatuses.set(name, {
        name,
        connected: false,
        connecting: true,
        toolCount: 0,
        toolNames: [],
        transport: getTransport(servers[name])
      });
    }
    client = new mcp.MCPClient({
      id: "mastra-code-mcp",
      servers: buildServerDefs(servers),
      timeout: MASTRACODE_MCP_TIMEOUT_MS
    });
    try {
      const { toolsets, errors } = await client.listToolsetsWithErrors();
      for (const [serverName, serverTools] of Object.entries(toolsets)) {
        for (const [toolName, toolConfig] of Object.entries(serverTools)) {
          tools[`${serverName}_${toolName}`] = toolConfig;
        }
      }
      for (const name of serverNames) {
        const serverTools = toolsets[name];
        if (serverTools && Object.keys(serverTools).length > 0) {
          const toolNames = Object.keys(serverTools).map((t) => `${name}_${t}`);
          serverStatuses.set(name, {
            name,
            connected: true,
            toolCount: toolNames.length,
            toolNames,
            transport: getTransport(servers[name])
          });
        } else {
          serverStatuses.set(name, {
            name,
            connected: false,
            toolCount: 0,
            toolNames: [],
            transport: getTransport(servers[name]),
            error: errors[name] ?? "Failed to connect"
          });
        }
      }
      for (const name of serverNames) {
        captureStderr(name);
      }
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      for (const name of serverNames) {
        serverStatuses.set(name, {
          name,
          connected: false,
          toolCount: 0,
          toolNames: [],
          transport: getTransport(servers[name]),
          error: errMsg
        });
      }
    }
  }
  async function disconnect() {
    if (client) {
      try {
        await client.disconnect();
      } catch {
      }
      client = null;
    }
  }
  return {
    async init() {
      if (initialized) return;
      await connectAndCollectTools();
      initialized = true;
    },
    async initInBackground() {
      await this.init();
      const statuses = Array.from(serverStatuses.values());
      const connected = statuses.filter((s) => s.connected);
      const failed = statuses.filter((s) => !s.connected);
      return {
        connected,
        failed,
        skipped: [...config.skippedServers ?? []],
        totalTools: connected.reduce((sum, s) => sum + s.toolCount, 0)
      };
    },
    async reload() {
      await disconnect();
      config = applyExtraServers(loadMcpConfig(projectDir));
      tools = {};
      serverStatuses = /* @__PURE__ */ new Map();
      stderrLogs = /* @__PURE__ */ new Map();
      initialized = false;
      await connectAndCollectTools();
      initialized = true;
    },
    async reconnectServer(name) {
      const cfg = config.mcpServers?.[name];
      if (!cfg) {
        return {
          name,
          connected: false,
          toolCount: 0,
          toolNames: [],
          transport: "stdio",
          error: `Server "${name}" not found in config`
        };
      }
      if (!client) {
        return {
          name,
          connected: false,
          toolCount: 0,
          toolNames: [],
          transport: getTransport(cfg),
          error: "MCP client not initialized"
        };
      }
      const transport = getTransport(cfg);
      const prefix = `${name}_`;
      for (const key of Object.keys(tools)) {
        if (key.startsWith(prefix)) {
          delete tools[key];
        }
      }
      stderrLogs.delete(name);
      serverStatuses.set(name, {
        name,
        connected: false,
        connecting: true,
        toolCount: 0,
        toolNames: [],
        transport
      });
      try {
        await client.reconnectServer(name);
        captureStderr(name);
        const { toolsets, errors } = await client.listToolsetsWithErrors();
        const serverTools = toolsets[name];
        const serverError = errors[name];
        if (serverError) {
          const status = {
            name,
            connected: false,
            toolCount: 0,
            toolNames: [],
            transport,
            error: serverError
          };
          serverStatuses.set(name, status);
          return status;
        } else if (serverTools && Object.keys(serverTools).length > 0) {
          const toolNames = Object.keys(serverTools).map((t) => `${name}_${t}`);
          for (const [toolName, toolConfig] of Object.entries(serverTools)) {
            tools[`${name}_${toolName}`] = toolConfig;
          }
          const status = {
            name,
            connected: true,
            toolCount: toolNames.length,
            toolNames,
            transport
          };
          serverStatuses.set(name, status);
          return status;
        } else {
          const status = {
            name,
            connected: false,
            toolCount: 0,
            toolNames: [],
            transport,
            error: "Failed to connect"
          };
          serverStatuses.set(name, status);
          return status;
        }
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error);
        const status = {
          name,
          connected: false,
          toolCount: 0,
          toolNames: [],
          transport,
          error: errMsg
        };
        serverStatuses.set(name, status);
        return status;
      }
    },
    disconnect,
    getTools() {
      return { ...tools };
    },
    hasServers() {
      const hasConfigured = config.mcpServers !== void 0 && Object.keys(config.mcpServers).length > 0;
      const hasSkipped = config.skippedServers !== void 0 && config.skippedServers.length > 0;
      return hasConfigured || hasSkipped;
    },
    getServerStatuses() {
      return Array.from(serverStatuses.values());
    },
    getSkippedServers() {
      return [...config.skippedServers ?? []];
    },
    getConfigPaths() {
      return {
        project: getProjectMcpPath(projectDir),
        global: getGlobalMcpPath(),
        claude: getClaudeSettingsPath(projectDir)
      };
    },
    getConfig() {
      return config;
    },
    getServerLogs(name) {
      return [...stderrLogs.get(name) ?? []];
    }
  };
}
var stateSchema = zod.z.object({
  projectPath: zod.z.string().optional(),
  projectName: zod.z.string().optional(),
  gitBranch: zod.z.string().optional(),
  lastCommand: zod.z.string().optional(),
  currentModelId: zod.z.string().default(""),
  // Subagent model settings (per-thread/per-mode)
  subagentModelId: zod.z.string().optional(),
  // Thread-level default for subagents
  // Observational Memory model settings
  observerModelId: zod.z.string().default(DEFAULT_OM_MODEL_ID),
  reflectorModelId: zod.z.string().default(DEFAULT_OM_MODEL_ID),
  // Observational Memory threshold settings
  observationThreshold: zod.z.number().default(3e4),
  reflectionThreshold: zod.z.number().default(4e4),
  // Observational Memory scope — 'thread' (per-conversation) or 'resource' (shared across threads)
  omScope: zod.z.enum(["thread", "resource"]).optional(),
  // Thinking level for model reasoning effort
  thinkingLevel: zod.z.enum(["off", "low", "medium", "high", "xhigh"]).default("off"),
  // YOLO mode — auto-approve all tool calls
  yolo: zod.z.boolean().default(false),
  // Permission rules — per-category and per-tool approval policies
  permissionRules: zod.z.object({
    categories: zod.z.record(zod.z.string(), zod.z.enum(["allow", "ask", "deny"])).default({}),
    tools: zod.z.record(zod.z.string(), zod.z.enum(["allow", "ask", "deny"])).default({})
  }).default({ categories: {}, tools: {} }),
  // Smart editing mode — use AST-based analysis for code edits
  smartEditing: zod.z.boolean().default(true),
  // Notification mode — alert when TUI needs user attention
  notifications: zod.z.enum(["bell", "system", "both", "off"]).default("off"),
  // Task list (persisted per-thread)
  tasks: zod.z.array(
    zod.z.object({
      content: zod.z.string(),
      status: zod.z.enum(["pending", "in_progress", "completed"]),
      activeForm: zod.z.string()
    })
  ).default([]),
  // Sandbox allowed paths (per-thread, absolute paths allowed in addition to project root)
  sandboxAllowedPaths: zod.z.array(zod.z.string()).default([]),
  // Active plan (set when a plan is approved in Plan mode)
  activePlan: zod.z.object({
    title: zod.z.string(),
    plan: zod.z.string(),
    approvedAt: zod.z.string()
  }).nullable().default(null)
});
var MessageBus = class extends events.EventEmitter {
  messages = [];
  constructor() {
    super();
    this.setMaxListeners(100);
  }
  /**
   * Send a message from one member to another (or broadcast).
   * Returns true if the message was delivered to at least one listener.
   */
  send(message) {
    this.messages.push(message);
    this.emit(`message:${message.toMemberId}`, message);
    if (message.toMemberId !== "broadcast") {
      this.emit("message:broadcast", message);
    }
    this.emit("message", message);
    return true;
  }
  /**
   * Get the next message addressed to a specific member.
   * Returns a promise that resolves when a message arrives.
   */
  async receive(memberId, timeoutMs = 3e4) {
    const existing = this.messages.find(
      (m) => (m.toMemberId === memberId || m.toMemberId === "broadcast") && m.timestamp > Date.now() - timeoutMs
    );
    if (existing) return existing;
    return new Promise((resolve3, reject) => {
      const timer = setTimeout(() => {
        this.off(`message:${memberId}`, handler);
        this.off("message:broadcast", broadcastHandler);
        reject(new Error(`Message timeout for member "${memberId}" after ${timeoutMs}ms`));
      }, timeoutMs);
      const cleanup = () => {
        clearTimeout(timer);
        this.off(`message:${memberId}`, handler);
        this.off("message:broadcast", broadcastHandler);
      };
      const handler = (msg) => {
        cleanup();
        resolve3(msg);
      };
      const broadcastHandler = (msg) => {
        cleanup();
        resolve3(msg);
      };
      this.on(`message:${memberId}`, handler);
      this.on("message:broadcast", broadcastHandler);
    });
  }
  /**
   * Get all messages for a specific member (including broadcasts).
   */
  getMessagesFor(memberId) {
    return this.messages.filter((m) => m.toMemberId === memberId || m.toMemberId === "broadcast");
  }
  /**
   * Get all messages sent by a specific member.
   */
  getMessagesFrom(memberId) {
    return this.messages.filter((m) => m.fromMemberId === memberId);
  }
  /** Get all messages. */
  getAllMessages() {
    return [...this.messages];
  }
  /** Clear all messages. */
  clear() {
    this.messages = [];
    this.removeAllListeners();
  }
};
function createTeamMessageTool(memberId, bus, teamId, emitEvent) {
  return tools.createTool({
    id: "team_message",
    description: "Send a message to another team member or broadcast to all members.",
    inputSchema: v4.z.object({
      toMemberId: v4.z.string().describe('ID of the receiving member, or "broadcast" to send to all'),
      content: v4.z.string().describe("Message content")
    }),
    execute: async ({ toMemberId, content }) => {
      const message = {
        fromMemberId: memberId,
        toMemberId,
        content,
        timestamp: Date.now()
      };
      bus.send(message);
      emitEvent?.({
        type: "team_message_sent",
        teamId,
        from: memberId,
        to: toMemberId
      });
      return { content: `Message sent to ${toMemberId}` };
    }
  });
}
function buildMemberTools(member, bus, teamId, harnessTools, emitEvent) {
  const merged = { ...member.tools };
  merged["team_message"] = createTeamMessageTool(member.id, bus, teamId, emitEvent);
  if (harnessTools) {
    if (member.allowedHarnessTools) {
      for (const toolId of member.allowedHarnessTools) {
        if (harnessTools[toolId] && !merged[toolId]) {
          merged[toolId] = harnessTools[toolId];
        }
      }
    } else {
      for (const [toolId, tool] of Object.entries(harnessTools)) {
        if (!merged[toolId]) {
          merged[toolId] = tool;
        }
      }
    }
  }
  return merged;
}
async function runTeam(opts) {
  const {
    team,
    task,
    resolveModel: resolveModel2,
    harnessTools,
    fallbackModelId,
    emitEvent,
    abortSignal,
    requestContext,
    workspace
  } = opts;
  const bus = new MessageBus();
  emitEvent?.({ type: "team_start", teamId: team.id, task });
  const maxConcurrency = team.maxConcurrency ?? team.members.length;
  const memberEntries = team.members.map((member) => {
    const modelId = member.defaultModelId ?? fallbackModelId;
    if (!modelId) {
      return { member, agent: null, tools: void 0, error: `No model ID for member "${member.id}"` };
    }
    let model;
    try {
      model = resolveModel2(modelId);
      console.log(`[team-runner] Resolved model for member "${member.id}": modelId=${modelId}, modelType=${typeof model}`);
    } catch (err) {
      console.error(`[team-runner] Model resolution failed for member "${member.id}":`, err);
      return {
        member,
        agent: null,
        tools: void 0,
        error: `Failed to resolve model "${modelId}" for member "${member.id}": ${err instanceof Error ? err.message : String(err)}`
      };
    }
    const memberTools = buildMemberTools(member, bus, team.id, harnessTools, emitEvent);
    const agent$1 = new agent.Agent({
      id: `team-${team.id}-member-${member.id}`,
      name: member.name,
      instructions: member.instructions,
      model,
      tools: memberTools,
      workspace
    });
    return { member, agent: agent$1, tools: memberTools, error: null };
  });
  const setupErrors = memberEntries.filter((e) => e.error);
  if (setupErrors.length > 0) {
    const results = setupErrors.map((e) => ({
      memberId: e.member.id,
      result: e.error,
      isError: true
    }));
    emitEvent?.({ type: "team_end", teamId: team.id, results: Object.fromEntries(results.map((r) => [r.memberId, r.result])) });
    return { teamId: team.id, members: results, summary: results.map((r) => `**${r.memberId}**: ERROR - ${r.result}`).join("\n") };
  }
  const validEntries = memberEntries.filter((e) => e.agent);
  const chunks = [];
  for (let i = 0; i < validEntries.length; i += maxConcurrency) {
    chunks.push(validEntries.slice(i, i + maxConcurrency));
  }
  const allResults = [];
  for (const chunk of chunks) {
    if (abortSignal?.aborted) break;
    const chunkResults = await Promise.allSettled(
      chunk.map(async ({ member, agent, tools: memberTools }) => {
        emitEvent?.({ type: "team_member_start", teamId: team.id, memberId: member.id });
        try {
          const allWorkspaceToolNames = workspace ? new Set(Object.keys({})) : void 0;
          const allowedWs = member.allowedWorkspaceTools ? new Set(member.allowedWorkspaceTools) : void 0;
          const toolNames = Object.keys(memberTools);
          console.log(`[team-runner] Starting member "${member.id}" with tools=[${toolNames.join(",")}], maxSteps=${member.maxSteps ?? 50}`);
          try {
            const diagStorage = new chunkP2NLJLNZ_cjs.AuthStorage();
            diagStorage.reload();
            const diagCred = diagStorage.get("anthropic");
            console.log(`[team-runner] Auth diagnostic for "${member.id}": credType=${diagCred?.type}, hasCred=${!!diagCred}`);
            if (diagCred?.type === "oauth") {
              const diagKey = await diagStorage.getApiKey("anthropic");
              console.log(`[team-runner] Auth diagnostic for "${member.id}": hasAccessToken=${!!diagKey}, keyLen=${diagKey?.length ?? 0}`);
            }
          } catch (diagErr) {
            console.error(`[team-runner] Auth diagnostic failed for "${member.id}":`, diagErr);
          }
          const response = await agent.stream(task, {
            maxSteps: member.maxSteps ?? 50,
            abortSignal,
            requireToolApproval: false,
            requestContext,
            prepareStep: allowedWs && allWorkspaceToolNames ? ({ tools }) => ({
              activeTools: Object.keys(tools ?? {}).filter(
                (k) => !allWorkspaceToolNames.has(k) || allowedWs.has(k)
              )
            }) : void 0
          });
          let text = "";
          let chunkCount = 0;
          let toolCalls = 0;
          for await (const chunk2 of response.fullStream) {
            chunkCount++;
            if (chunk2.type === "text-delta") {
              text += chunk2.payload.text;
            } else if (chunk2.type === "tool-call") {
              toolCalls++;
            }
          }
          const fullOutput = await response.getFullOutput();
          const resultText = fullOutput.text || text;
          console.log(`[team-runner] Member "${member.id}" finished: chunks=${chunkCount}, toolCalls=${toolCalls}, textLen=${resultText.length}`);
          const result = resultText || "(no output)";
          emitEvent?.({ type: "team_member_end", teamId: team.id, memberId: member.id, result, isError: false });
          return { memberId: member.id, result, isError: false };
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : String(err);
          const errorStack = err instanceof Error ? err.stack : void 0;
          console.error(`[team-runner] Member "${member.id}" execution error: ${errorMsg}`);
          console.error(`[team-runner] Member "${member.id}" stack:`, errorStack);
          emitEvent?.({ type: "team_member_end", teamId: team.id, memberId: member.id, result: errorMsg, isError: true });
          return { memberId: member.id, result: errorMsg, isError: true };
        }
      })
    );
    for (const r of chunkResults) {
      if (r.status === "fulfilled") {
        allResults.push(r.value);
      } else {
        allResults.push({ memberId: "unknown", result: r.reason?.message ?? "Unknown error", isError: true });
      }
    }
  }
  bus.clear();
  const resultsMap = Object.fromEntries(allResults.map((r) => [r.memberId, r.result]));
  emitEvent?.({ type: "team_end", teamId: team.id, results: resultsMap });
  const summary = allResults.map((r) => {
    const prefix = r.isError ? "ERROR" : "DONE";
    return `**${r.memberId}** [${prefix}]: ${r.result}`;
  }).join("\n\n---\n\n");
  return { teamId: team.id, members: allResults, summary };
}
function createTeamDispatchTool(opts) {
  const { teams, resolveModel: resolveModel2, harnessTools, fallbackModelId } = opts;
  const teamIds = teams.map((t) => t.id);
  const teamDescriptions = teams.map((t) => `- **${t.id}** (${t.name}): ${t.description}`).join("\n");
  return tools.createTool({
    id: "team_dispatch",
    description: `Dispatch a task to a team of parallel agents. Each team member works independently on the same task, then results are collected and returned.

Available teams:
${teamDescriptions}

Use this tool when:
- You want to run multiple agents in parallel on the same task
- Different perspectives or approaches are needed simultaneously
- You need specialized agents to coordinate via messaging`,
    inputSchema: v4.z.object({
      teamId: v4.z.enum(teamIds).describe("ID of the team to dispatch"),
      task: v4.z.string().describe("The task description. All team members receive the same task.")
    }),
    execute: async ({ teamId, task }, context) => {
      const team = teams.find((t) => t.id === teamId);
      if (!team) {
        return {
          content: `Unknown team: ${teamId}. Available teams: ${teamIds.join(", ")}`,
          isError: true
        };
      }
      const harnessCtx = context?.requestContext?.get("harness");
      const emitEvent = (event) => {
        harnessCtx?.emitEvent?.(event);
      };
      const currentModelId = harnessCtx?.state?.currentModelId ?? harnessCtx?.getState?.()?.currentModelId;
      const resolvedFallbackModelId = currentModelId ?? fallbackModelId;
      const resolvedTools = harnessTools?.current;
      try {
        const result = await runTeam({
          team,
          task,
          resolveModel: resolveModel2,
          harnessTools: resolvedTools,
          fallbackModelId: resolvedFallbackModelId,
          emitEvent,
          abortSignal: harnessCtx?.abortSignal,
          requestContext: context?.requestContext,
          workspace: context?.workspace
        });
        return {
          content: result.summary,
          isError: result.members.some((m) => m.isError)
        };
      } catch (err) {
        return {
          content: `Team dispatch failed: ${err instanceof Error ? err.message : String(err)}`,
          isError: true
        };
      }
    }
  });
}

// src/harness/model-tiers.ts
var TIER_PATTERNS = [
  // Heavy tier — flagship / reasoning models
  { pattern: /opus|o3|o4|ultra|max|pro-.*(?:1\.5|2)/i, tier: "heavy" },
  // Light tier — fast / mini models
  { pattern: /mini|flash|haiku|nano|turbo|instant|fast/i, tier: "light" }
  // Medium tier — default (sonnet, gpt-4o, etc.)
  // Everything else falls to medium
];
function classifyTier(modelId) {
  const modelName = modelId.split("/")[1] ?? modelId;
  for (const { pattern, tier } of TIER_PATTERNS) {
    if (pattern.test(modelName)) return tier;
  }
  return "medium";
}
function classifyModels(models) {
  return models.filter((m) => m.hasApiKey).map((m) => ({
    ...m,
    tier: classifyTier(m.id)
  }));
}
function getModelForTier(tiered, tier) {
  const match = tiered.find((m) => m.tier === tier);
  if (match) return match.id;
  return tiered[0]?.id;
}
var HEAVY_KEYWORDS = [
  "refactor",
  "architect",
  "design",
  "implement",
  "rewrite",
  "migrate",
  "complex",
  "critical",
  "production",
  "safety",
  "security"
];
var LIGHT_KEYWORDS = [
  "search",
  "find",
  "list",
  "format",
  "simple",
  "quick",
  "check",
  "validate",
  "count",
  "summarize",
  "extract"
];
function inferComplexity(instructions, task) {
  const text = `${instructions} ${task}`.toLowerCase();
  const heavyScore = HEAVY_KEYWORDS.filter((kw) => text.includes(kw)).length;
  const lightScore = LIGHT_KEYWORDS.filter((kw) => text.includes(kw)).length;
  if (heavyScore > lightScore + 1) return "heavy";
  if (lightScore > heavyScore + 1) return "light";
  return "medium";
}
function autoAssignModels(members, task, availableModels) {
  const tiered = classifyModels(availableModels);
  const assignments = /* @__PURE__ */ new Map();
  for (const member of members) {
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

// src/harness/team-create-tool.ts
var MemberSchema = v4.z.object({
  id: v4.z.string().describe('Unique member identifier (e.g. "researcher", "implementer")'),
  name: v4.z.string().describe("Human-readable display name"),
  instructions: v4.z.string().describe("Instructions that guide the member's behavior"),
  defaultModelId: v4.z.string().optional().describe(`Override model ID (e.g. "anthropic/claude-sonnet-4-20250514", "openai/gpt-4o"). If omitted, uses the parent agent's current model.`),
  maxSteps: v4.z.number().optional().describe("Maximum steps for this member's execution loop")
});
var TeamCreateInputSchema = v4.z.object({
  teamName: v4.z.string().describe("Name for the new team"),
  description: v4.z.string().describe("Brief description of what this team will accomplish"),
  task: v4.z.string().describe("The task to dispatch to all team members"),
  members: v4.z.array(MemberSchema).min(1).max(8).describe("Team member definitions (1-8 members)"),
  maxConcurrency: v4.z.number().optional().describe("Max members running in parallel. Default: all"),
  modelStrategy: v4.z.enum(["user_select", "ai_auto", "manual"]).optional().default("manual").describe(
    'How to pick models: "manual" = use defaultModelId as-is, "user_select" = show TUI picker, "ai_auto" = auto-assign by task complexity'
  )
});
function createTeamCreateTool(opts) {
  const { resolveModel: resolveModel2, fallbackModelId, harnessTools } = opts;
  return tools.createTool({
    id: "team_create",
    description: `Dynamically create and dispatch a team of parallel agents. Define the team members inline with their own instructions, then all members work on the same task simultaneously.

Use this tool when:
- A task is complex enough to benefit from parallel work by multiple agents
- Different perspectives or approaches are needed simultaneously
- The user explicitly asks for a team, swarm, or group of agents
- You need to decompose a large task into sub-tasks run by specialized agents

When in doubt about whether a task warrants a team, prefer creating one.

Guidelines for choosing members:
- Keep teams small (2-4 members is usually optimal)
- Give each member a clear, focused role with specific instructions
- Members share the same task but apply different perspectives or responsibilities
- All members can communicate via the team_message tool`,
    inputSchema: TeamCreateInputSchema,
    execute: async (input, context) => {
      const { teamName, description, task, members, maxConcurrency, modelStrategy } = input;
      const team = {
        id: teamName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
        name: teamName,
        description,
        members: members.map((m) => ({
          id: m.id,
          name: m.name,
          instructions: m.instructions,
          defaultModelId: m.defaultModelId,
          maxSteps: m.maxSteps
        })),
        maxConcurrency
      };
      const harnessCtx = context?.requestContext?.get("harness");
      const emitEvent = (event) => {
        harnessCtx?.emitEvent?.(event);
      };
      const currentModelId = harnessCtx?.state?.currentModelId ?? harnessCtx?.getState?.()?.currentModelId;
      const resolvedFallbackModelId = currentModelId ?? fallbackModelId;
      if (modelStrategy === "ai_auto") {
        const availableModels = harnessCtx?.listAvailableModels?.() ?? [];
        const assignments = autoAssignModels(
          team.members.map((m) => ({ id: m.id, name: m.name, instructions: m.instructions, defaultModelId: m.defaultModelId })),
          task,
          availableModels
        );
        for (const member of team.members) {
          const assigned = assignments.get(member.id);
          if (assigned && !member.defaultModelId) {
            member.defaultModelId = assigned;
          }
        }
      } else if (modelStrategy === "user_select") {
        const availableModels = harnessCtx?.listAvailableModels?.() ?? [];
        const questionId = `team-model-${Date.now()}`;
        const userSelections = await new Promise((resolve3) => {
          harnessCtx?.registerQuestion?.(questionId, (answer) => {
            try {
              resolve3(JSON.parse(answer));
            } catch {
              resolve3(null);
            }
          });
          emitEvent({
            type: "team_model_select",
            questionId,
            teamName,
            members: team.members.map((m) => ({ id: m.id, name: m.name, defaultModelId: m.defaultModelId })),
            availableModels
          });
        });
        if (userSelections) {
          for (const member of team.members) {
            if (userSelections[member.id]) {
              member.defaultModelId = userSelections[member.id];
            }
          }
        }
      }
      const resolvedTools = harnessTools?.current;
      try {
        const result = await runTeam({
          team,
          task,
          resolveModel: resolveModel2,
          harnessTools: resolvedTools,
          fallbackModelId: resolvedFallbackModelId,
          emitEvent,
          abortSignal: harnessCtx?.abortSignal,
          requestContext: context?.requestContext,
          workspace: context?.workspace
        });
        return {
          content: `Team "${teamName}" completed:

${result.summary}`,
          isError: result.members.some((m) => m.isError)
        };
      } catch (err) {
        return {
          content: `Team "${teamName}" failed: ${err instanceof Error ? err.message : String(err)}`,
          isError: true
        };
      }
    }
  });
}
var CACHE_DIR = path__namespace.default.join(os__namespace.default.homedir(), ".cache", "mastra");
var CACHE_FILE = path__namespace.default.join(CACHE_DIR, "gateway-refresh-time");
var GLOBAL_PROVIDER_REGISTRY_JSON = path__namespace.default.join(CACHE_DIR, "provider-registry.json");
var GLOBAL_PROVIDER_TYPES_DTS = path__namespace.default.join(CACHE_DIR, "provider-types.generated.d.ts");
var DEFAULT_SYNC_INTERVAL_MS = 5 * 60 * 1e3;
var isSyncing = false;
async function atomicWriteFile(filePath, content) {
  const randomSuffix = Math.random().toString(36).substring(2, 15);
  const tempPath = `${filePath}.${process.pid}.${Date.now()}.${randomSuffix}.tmp`;
  try {
    await fs4__namespace.default.promises.writeFile(tempPath, content, "utf-8");
    await fs4__namespace.default.promises.rename(tempPath, filePath);
  } catch (error) {
    try {
      await fs4__namespace.default.promises.unlink(tempPath);
    } catch {
    }
    throw error;
  }
}
async function fetchProvidersFromGateways(gateways = [new llm.ModelsDevGateway({}), new llm.NetlifyGateway(), new llm.MastraGateway()]) {
  const allProviders = {};
  const allModels = {};
  for (const gateway of gateways) {
    try {
      if (!await gateway.shouldEnable()) {
        continue;
      }
      const providers = await gateway.fetchProviders();
      const isProviderRegistry = gateway.id === "models.dev";
      for (const [providerId, config] of Object.entries(providers)) {
        const typeProviderId = isProviderRegistry ? providerId : providerId === gateway.id ? gateway.id : `${gateway.id}/${providerId}`;
        allProviders[typeProviderId] = config;
        allModels[typeProviderId] = config.models.sort();
      }
    } catch (error) {
      console.warn(`[GatewaySync] Failed to fetch from ${gateway.id}:`, error);
    }
  }
  return { providers: allProviders, models: allModels };
}
function generateTypesContent(models) {
  const providerModelsEntries = Object.entries(models).map(([provider, modelList]) => {
    const modelsList = modelList.map((m) => `'${m}'`);
    const needsQuotes = !/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(provider);
    const providerKey = needsQuotes ? `'${provider}'` : provider;
    const singleLine = `  readonly ${providerKey}: readonly [${modelsList.join(", ")}];`;
    if (singleLine.length > 120) {
      const formattedModels = modelList.map((m) => `    '${m}',`).join("\n");
      return `  readonly ${providerKey}: readonly [
${formattedModels}
  ];`;
    }
    return singleLine;
  }).join("\n");
  return `/**
 * THIS FILE IS AUTO-GENERATED - DO NOT EDIT
 * Generated from model gateway providers
 */

export type ProviderModelsMap = {
${providerModelsEntries}
};

export type Provider = keyof ProviderModelsMap;

export interface ProviderModels {
  [key: string]: string[];
}

export type ModelRouterModelId =
  | {
      [P in Provider]: \`\${P}/\${ProviderModelsMap[P][number]}\`;
    }[Provider]
  | (string & {});

export type ModelForProvider<P extends Provider> = ProviderModelsMap[P][number];
`;
}
function getLastSyncTime() {
  try {
    if (!fs4__namespace.default.existsSync(CACHE_FILE)) {
      return null;
    }
    const timestamp = fs4__namespace.default.readFileSync(CACHE_FILE, "utf-8").trim();
    return new Date(parseInt(timestamp, 10));
  } catch {
    return null;
  }
}
function saveLastSyncTime(date) {
  try {
    if (!fs4__namespace.default.existsSync(CACHE_DIR)) {
      fs4__namespace.default.mkdirSync(CACHE_DIR, { recursive: true });
    }
    fs4__namespace.default.writeFileSync(CACHE_FILE, date.getTime().toString(), "utf-8");
  } catch (error) {
    console.warn("[GatewaySync] Failed to save sync time:", error);
  }
}
async function syncGateways(force = false) {
  if (isSyncing && !force) {
    return;
  }
  if (!force) {
    const lastSync = getLastSyncTime();
    if (lastSync) {
      const timeSinceSync = Date.now() - lastSync.getTime();
      if (timeSinceSync < DEFAULT_SYNC_INTERVAL_MS) {
        return;
      }
    }
  }
  isSyncing = true;
  try {
    const { providers, models } = await fetchProvidersFromGateways();
    await fs4__namespace.default.promises.mkdir(CACHE_DIR, { recursive: true });
    const registryData = {
      providers,
      models,
      version: "1.0.0"
    };
    await atomicWriteFile(GLOBAL_PROVIDER_REGISTRY_JSON, JSON.stringify(registryData, null, 2));
    const typesContent = generateTypesContent(models);
    await atomicWriteFile(GLOBAL_PROVIDER_TYPES_DTS, typesContent);
    const now = /* @__PURE__ */ new Date();
    saveLastSyncTime(now);
  } catch (error) {
    console.error("[GatewaySync] \u274C Sync failed:", error);
  } finally {
    isSyncing = false;
  }
}
function createFallbackLibSQL() {
  return new libsql.LibSQLStore({
    id: "mastra-code-storage",
    url: `file:${chunkP2NLJLNZ_cjs.getDatabasePath()}`
  });
}
async function createStorage(config) {
  if (config.backend === "pg") {
    return createPgStorage(config);
  }
  return {
    storage: new libsql.LibSQLStore({
      id: "mastra-code-storage",
      url: config.url,
      ...config.authToken ? { authToken: config.authToken } : {}
    }),
    backend: "libsql"
  };
}
async function createPgStorage(config) {
  if (!config.connectionString && !config.host) {
    return {
      storage: createFallbackLibSQL(),
      backend: "libsql",
      warning: "PostgreSQL backend selected but no connection info configured. Using LibSQL fallback. Set a connection string via /settings."
    };
  }
  const base = {
    id: "mastra-code-storage",
    ...config.schemaName ? { schemaName: config.schemaName } : {},
    ...config.disableInit ? { disableInit: config.disableInit } : {},
    ...config.skipDefaultIndexes ? { skipDefaultIndexes: config.skipDefaultIndexes } : {}
  };
  const store = config.connectionString ? new pg.PostgresStore({ ...base, connectionString: config.connectionString }) : new pg.PostgresStore({
    ...base,
    host: config.host,
    port: config.port,
    database: config.database,
    user: config.user,
    password: config.password
  });
  try {
    await store.init();
  } catch (err) {
    const msg = err?.message ?? String(err);
    const target = config.connectionString ?? `${config.host}:${config.port ?? 5432}`;
    try {
      await store.close();
    } catch {
    }
    return {
      storage: createFallbackLibSQL(),
      backend: "libsql",
      warning: `Failed to connect to PostgreSQL at ${target}: ${msg}
Using LibSQL fallback. Fix the connection via /settings.`
    };
  }
  return { storage: store, backend: "pg" };
}
async function createVectorStore(config, effectiveBackend = config.backend) {
  if (effectiveBackend === "pg") {
    const pgConfig = config;
    if (!pgConfig.connectionString && !pgConfig.host) return void 0;
    const { PgVector } = await import('@mastra/pg');
    return new PgVector({
      id: "mastra-code-vectors",
      connectionString: pgConfig.connectionString ?? `postgresql://${pgConfig.user}:${pgConfig.password}@${pgConfig.host}:${pgConfig.port ?? 5432}/${pgConfig.database}`
    });
  }
  return new libsql.LibSQLVector({
    id: "mastra-code-vectors",
    url: `file:${chunkP2NLJLNZ_cjs.getVectorDatabasePath()}`
  });
}

// src/index.ts
var PROVIDER_TO_OAUTH_ID = {
  anthropic: "anthropic",
  openai: "openai-codex"
};
function createAuthStorage() {
  const authStorage2 = new chunkP2NLJLNZ_cjs.AuthStorage();
  setAuthStorage(authStorage2);
  setAuthStorage2(authStorage2);
  return authStorage2;
}
async function createMastraCode(config) {
  const cwd = config?.cwd ?? process.cwd();
  const extension = resolveMastraCodeExtension(config?.extension);
  const gatewayRegistry = llm.GatewayRegistry.getInstance({ useDynamicLoading: true });
  const authStorage2 = createAuthStorage();
  const globalSettings = chunkWOKNPWRC_cjs.loadSettings();
  const storedGatewayKey = authStorage2.getStoredApiKey(chunkWOKNPWRC_cjs.MEMORY_GATEWAY_PROVIDER);
  const storedGatewayUrl = globalSettings.memoryGateway?.baseUrl;
  if (storedGatewayKey) {
    process.env["MASTRA_GATEWAY_API_KEY"] ??= storedGatewayKey;
  }
  if (storedGatewayUrl) {
    process.env["MASTRA_GATEWAY_URL"] ??= storedGatewayUrl;
  }
  try {
    const registry = llm.PROVIDER_REGISTRY;
    const providerEnvVars = {};
    for (const [provider, cfg] of Object.entries(registry)) {
      const envVars = cfg?.apiKeyEnvVar;
      providerEnvVars[provider] = Array.isArray(envVars) ? envVars[0] : envVars;
    }
    providerEnvVars[chunkWOKNPWRC_cjs.MEMORY_GATEWAY_PROVIDER] ??= "MASTRA_GATEWAY_API_KEY";
    authStorage2.loadStoredApiKeysIntoEnv(providerEnvVars);
  } catch {
    authStorage2.loadStoredApiKeysIntoEnv({
      [chunkWOKNPWRC_cjs.MEMORY_GATEWAY_PROVIDER]: "MASTRA_GATEWAY_API_KEY",
      anthropic: "ANTHROPIC_API_KEY",
      openai: "OPENAI_API_KEY",
      google: "GOOGLE_GENERATIVE_AI_API_KEY",
      cerebras: "CEREBRAS_API_KEY",
      deepseek: "DEEPSEEK_API_KEY"
    });
  }
  try {
    await gatewayRegistry.syncGateways(true);
  } catch (error) {
    console.warn("Failed to sync gateways at startup", error);
  }
  const mgApiKey = authStorage2.getStoredApiKey(chunkWOKNPWRC_cjs.MEMORY_GATEWAY_PROVIDER) ?? process.env["MASTRA_GATEWAY_API_KEY"];
  const project = chunkP2NLJLNZ_cjs.detectProject(cwd);
  const resourceIdOverride = chunkP2NLJLNZ_cjs.getResourceIdOverride(project.rootPath);
  if (resourceIdOverride) {
    project.resourceId = resourceIdOverride;
    project.resourceIdOverride = true;
  }
  const storageConfig = config?.storage ?? chunkP2NLJLNZ_cjs.getStorageConfig(project.rootPath, globalSettings.storage);
  const storageResult = await createStorage(storageConfig);
  const storage = storageResult.storage;
  const storageWarning = storageResult.warning;
  const vectorStore = await createVectorStore(storageConfig, storageResult.backend);
  const memory = getDynamicMemory(storage, vectorStore);
  const mcpManager = config?.disableMcp ? void 0 : createMcpManager(project.rootPath, config?.mcpServers);
  const hookManager = config?.disableHooks ? void 0 : new HookManager(project.rootPath, "session-init");
  if (hookManager?.hasHooks()) {
    const hookConfig = hookManager.getConfig();
    const hookCount = Object.values(hookConfig).reduce((sum, hooks) => sum + (hooks?.length ?? 0), 0);
    console.info(`Hooks: ${hookCount} hook(s) configured`);
  }
  const harnessToolBag = { current: void 0 };
  function buildEffectiveExtraTools(cfg) {
    const base = cfg?.extraTools;
    const teams = cfg?.teams;
    const teamToolRecord = {};
    if (!cfg?.disableTeams) {
      teamToolRecord["team_create"] = createTeamCreateTool({
        resolveModel: (id) => resolveModel(id),
        harnessTools: harnessToolBag,
        fallbackModelId: "anthropic/claude-sonnet-4-20250514"
      });
      if (teams && teams.length > 0) {
        teamToolRecord["team_dispatch"] = createTeamDispatchTool({
          teams,
          resolveModel: (id) => resolveModel(id),
          harnessTools: harnessToolBag
        });
      }
    }
    if (!base) return Object.keys(teamToolRecord).length > 0 ? teamToolRecord : void 0;
    if (typeof base === "function") {
      return (ctx) => ({
        ...base(ctx),
        ...teamToolRecord
      });
    }
    return { ...base, ...teamToolRecord };
  }
  const dynamicTools = createDynamicTools(mcpManager, buildEffectiveExtraTools(config), hookManager, config?.disabledTools);
  harnessToolBag.current = dynamicTools;
  const codeAgent = new agent.Agent({
    id: "code-agent",
    name: "Code Agent",
    instructions: getDynamicInstructions,
    model: getDynamicModel,
    tools: dynamicTools,
    inputProcessors: [
      new processors.AgentsMDInjector({
        getIgnoredInstructionPaths: ({ requestContext }) => {
          const harnessContext = requestContext.get("harness");
          const projectPath = harnessContext?.getState?.()?.projectPath ?? harnessContext?.state?.projectPath ?? project.rootPath;
          return getStaticallyLoadedInstructionPaths(projectPath);
        }
      })
    ]
  });
  const defaultSubagents = [exploreSubagent, planSubagent, executeSubagent];
  const defaultModes = [
    {
      id: "build",
      name: "Build",
      default: true,
      defaultModelId: "anthropic/claude-opus-4-6",
      color: chunkWOKNPWRC_cjs.mastra.green,
      agent: codeAgent
    },
    {
      id: "plan",
      name: "Plan",
      defaultModelId: "openai/gpt-5.2-codex",
      color: chunkWOKNPWRC_cjs.mastra.purple,
      agent: codeAgent
    },
    {
      id: "fast",
      name: "Fast",
      defaultModelId: "cerebras/zai-glm-4.7",
      color: chunkWOKNPWRC_cjs.mastra.orange,
      agent: codeAgent
    }
  ];
  const defaultHeartbeatHandlers = [
    {
      id: "gateway-sync",
      intervalMs: 5 * 60 * 1e3,
      handler: () => syncGateways()
    }
  ];
  const anthropicCred = authStorage2.get("anthropic");
  const openaiCred = authStorage2.get("openai-codex");
  const startupAccess = {
    anthropic: anthropicCred?.type === "oauth" ? "oauth" : anthropicCred?.type === "api_key" && anthropicCred.key.trim().length > 0 ? "apikey" : false,
    openai: openaiCred?.type === "oauth" ? "oauth" : openaiCred?.type === "api_key" && openaiCred.key.trim().length > 0 ? "apikey" : false,
    cerebras: process.env.CEREBRAS_API_KEY ? "apikey" : false,
    google: process.env.GOOGLE_GENERATIVE_AI_API_KEY ? "apikey" : false,
    deepseek: process.env.DEEPSEEK_API_KEY ? "apikey" : false
  };
  if (mgApiKey) {
    if (!startupAccess.anthropic) startupAccess.anthropic = "apikey";
    if (!startupAccess.openai) startupAccess.openai = "apikey";
  }
  try {
    const registry = llm.PROVIDER_REGISTRY;
    for (const [provider, config2] of Object.entries(registry)) {
      if (startupAccess[provider] && startupAccess[provider] !== false) continue;
      if (provider === "anthropic" || provider === "openai") continue;
      const envVars = config2?.apiKeyEnvVar;
      const envVarList = Array.isArray(envVars) ? envVars : envVars ? [envVars] : [];
      if (envVarList.some((envVar) => process.env[envVar])) {
        startupAccess[provider] = "apikey";
      }
    }
  } catch {
  }
  const builtinPacks = chunkWOKNPWRC_cjs.getAvailableModePacks(startupAccess);
  const builtinOmPacks = chunkWOKNPWRC_cjs.getAvailableOmPacks(startupAccess);
  const effectiveDefaults = chunkWOKNPWRC_cjs.resolveModelDefaults(globalSettings, builtinPacks);
  const effectiveOmModel = chunkWOKNPWRC_cjs.resolveOmModel(globalSettings, builtinOmPacks);
  const effectiveObservationThreshold = globalSettings.models.omObservationThreshold ?? void 0;
  const effectiveReflectionThreshold = globalSettings.models.omReflectionThreshold ?? void 0;
  const modes = (config?.modes ?? defaultModes).map((mode) => {
    const savedModel = effectiveDefaults[mode.id];
    return savedModel ? { ...mode, defaultModelId: savedModel } : mode;
  });
  const configuredSubagents = config?.subagents ?? [];
  const subagentsById = new Map(defaultSubagents.map((subagent) => [subagent.id, subagent]));
  for (const subagent of configuredSubagents) {
    subagentsById.set(subagent.id, subagent);
  }
  const mergedSubagents = Array.from(subagentsById.values());
  const subagentModeMap = { explore: "fast", plan: "plan", execute: "build" };
  const subagents = mergedSubagents.map((sa) => {
    const modeId = subagentModeMap[sa.id];
    const model = modeId ? effectiveDefaults[modeId] : void 0;
    let filtered = sa;
    if (config?.disabledTools?.length) {
      if (sa.allowedWorkspaceTools) {
        filtered = {
          ...filtered,
          allowedWorkspaceTools: sa.allowedWorkspaceTools.filter((t) => !config.disabledTools.includes(t))
        };
      }
      if (sa.tools) {
        filtered = {
          ...filtered,
          tools: Object.fromEntries(Object.entries(sa.tools).filter(([k]) => !config.disabledTools.includes(k)))
        };
      }
    }
    return model ? { ...filtered, defaultModelId: model } : filtered;
  });
  const globalInitialState = {};
  if (effectiveOmModel) {
    globalInitialState.observerModelId = effectiveOmModel;
    globalInitialState.reflectorModelId = effectiveOmModel;
  }
  if (effectiveObservationThreshold !== void 0) {
    globalInitialState.observationThreshold = effectiveObservationThreshold;
  }
  if (effectiveReflectionThreshold !== void 0) {
    globalInitialState.reflectionThreshold = effectiveReflectionThreshold;
  }
  if (globalSettings.preferences.yolo !== null) {
    globalInitialState.yolo = globalSettings.preferences.yolo;
  }
  globalInitialState.thinkingLevel = globalSettings.preferences.thinkingLevel;
  if (config?.omScope) {
    globalInitialState.omScope = config.omScope;
  }
  for (const [key, modelId] of Object.entries(globalSettings.models.subagentModels)) {
    if (key === "_default") {
      globalInitialState.subagentModelId = modelId;
    } else {
      globalInitialState[`subagentModelId_${key}`] = modelId;
    }
  }
  const harness$1 = new harness.Harness({
    id: "mastra-code",
    resourceId: project.resourceId,
    storage,
    memory,
    stateSchema,
    subagents,
    resolveModel,
    toolCategoryResolver: chunkOBFBUWOR_cjs.getToolCategory,
    initialState: {
      projectPath: project.rootPath,
      projectName: project.name,
      gitBranch: project.gitBranch,
      yolo: true,
      ...globalInitialState,
      ...config?.initialState
    },
    workspace: config?.workspace ?? ((args) => getDynamicWorkspace({ ...args, extension })),
    modes,
    heartbeatHandlers: config?.heartbeatHandlers ?? defaultHeartbeatHandlers,
    modelAuthChecker: (provider) => {
      const gatewayKey = authStorage2.getStoredApiKey(chunkWOKNPWRC_cjs.MEMORY_GATEWAY_PROVIDER) ?? process.env["MASTRA_GATEWAY_API_KEY"];
      if (gatewayKey) {
        const providerConfig = gatewayRegistry.getProviders()[provider];
        if (providerConfig?.gateway === "mastra") return true;
      }
      const oauthId = PROVIDER_TO_OAUTH_ID[provider];
      if (oauthId && authStorage2.isLoggedIn(oauthId)) {
        return true;
      }
      if (authStorage2.hasStoredApiKey(provider)) {
        return true;
      }
      if (provider === "anthropic") {
        const cred = authStorage2.get("anthropic");
        if (cred?.type === "api_key" && cred.key.trim().length > 0) {
          return true;
        }
      }
      if (provider === "openai") {
        const cred = authStorage2.get("openai-codex");
        if (cred?.type === "api_key" && cred.key.trim().length > 0) {
          return true;
        }
      }
      const customProvider = chunkWOKNPWRC_cjs.loadSettings().customProviders.find((entry) => {
        return provider === chunkWOKNPWRC_cjs.getCustomProviderId(entry.name);
      });
      if (customProvider) {
        return true;
      }
      return void 0;
    },
    modelUseCountProvider: () => chunkWOKNPWRC_cjs.loadSettings().modelUseCounts,
    modelUseCountTracker: (modelId) => {
      try {
        const settings = chunkWOKNPWRC_cjs.loadSettings();
        settings.modelUseCounts[modelId] = (settings.modelUseCounts[modelId] ?? 0) + 1;
        chunkWOKNPWRC_cjs.saveSettings(settings);
      } catch (error) {
        console.error("Failed to persist model usage count", error);
      }
    },
    customModelCatalogProvider: () => {
      const settings = chunkWOKNPWRC_cjs.loadSettings();
      const customModels = [];
      for (const provider of settings.customProviders) {
        const providerId = chunkWOKNPWRC_cjs.getCustomProviderId(provider.name);
        for (const modelName of provider.models) {
          customModels.push({
            id: chunkWOKNPWRC_cjs.toCustomProviderModelId(provider.name, modelName),
            provider: providerId,
            modelName,
            hasApiKey: true,
            apiKeyEnvVar: void 0
          });
        }
      }
      return customModels;
    },
    threadLock: {
      acquire: chunkWOKNPWRC_cjs.acquireThreadLock,
      release: chunkWOKNPWRC_cjs.releaseThreadLock
    }
  });
  if (hookManager) {
    harness$1.subscribe((event) => {
      if (event.type === "thread_changed") {
        hookManager.setSessionId(event.threadId);
      } else if (event.type === "thread_created") {
        hookManager.setSessionId(event.thread.id);
      }
    });
  }
  return { harness: harness$1, mcpManager, hookManager, authStorage: authStorage2, resolveModel, storageWarning, extension };
}

exports.createAuthStorage = createAuthStorage;
exports.createMastraCode = createMastraCode;
//# sourceMappingURL=chunk-NEZGUQGO.cjs.map
//# sourceMappingURL=chunk-NEZGUQGO.cjs.map