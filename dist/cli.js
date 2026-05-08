#!/usr/bin/env node
import { createMastraCode } from './chunk-JU4Q32RY.js';
import { detectTerminalTheme, MastraTUI, getCurrentVersion } from './chunk-JZ65YZN6.js';
import { restoreTerminalForeground, releaseAllThreadLocks, loadSettings, applyThemeMode } from './chunk-OXZXGLCJ.js';
import { getAppDataDir } from './chunk-WGXQUI3D.js';
import * as fs from 'fs';
import fs__default from 'fs';
import { parseArgs } from 'util';
import * as path from 'path';

// src/error-classification.ts
function isStreamDestroyedError(err, depth = 0) {
  if (!err || depth > 5) return false;
  const e = err;
  if (e.code === "ERR_STREAM_DESTROYED") return true;
  if (typeof e.message === "string" && e.message.includes("stream was destroyed")) return true;
  if (e.cause && isStreamDestroyedError(e.cause, depth + 1)) return true;
  if (Array.isArray(e.errors) && e.errors.some((inner) => isStreamDestroyedError(inner, depth + 1)))
    return true;
  return false;
}
var MAX_LOG_SIZE = 5 * 1024 * 1024;
var KEEP_SIZE = 4 * 1024 * 1024;
function truncateLogFile(logFile) {
  try {
    const stat = fs.statSync(logFile);
    if (stat.size > MAX_LOG_SIZE) {
      const buf = Buffer.alloc(KEEP_SIZE);
      const fd = fs.openSync(logFile, "r");
      fs.readSync(fd, buf, 0, KEEP_SIZE, stat.size - KEEP_SIZE);
      fs.closeSync(fd);
      const firstNewline = buf.indexOf(10);
      const trimmed = firstNewline >= 0 ? buf.subarray(firstNewline + 1) : buf;
      fs.writeFileSync(logFile, trimmed);
    }
  } catch {
  }
}
function setupDebugLogging() {
  const debugEnabled = ["true", "1"].includes(process.env.MASTRA_DEBUG ?? "");
  if (debugEnabled) {
    const logFile = path.join(getAppDataDir(), "debug.log");
    truncateLogFile(logFile);
    const logStream = fs.createWriteStream(logFile, { flags: "a" });
    const fmt = (a) => {
      if (typeof a === "string") return a;
      if (a instanceof Error) return a.stack ?? `${a.name}: ${a.message}`;
      try {
        return JSON.stringify(a);
      } catch {
        return String(a);
      }
    };
    console.error = (...args) => {
      logStream.write(`[ERROR] ${(/* @__PURE__ */ new Date()).toISOString()} ${args.map(fmt).join(" ")}
`);
    };
    console.warn = (...args) => {
      logStream.write(`[WARN] ${(/* @__PURE__ */ new Date()).toISOString()} ${args.map(fmt).join(" ")}
`);
    };
  } else {
    const noop = () => {
    };
    console.error = noop;
    console.warn = noop;
  }
}

// src/headless.ts
function hasHeadlessFlag(argv) {
  return argv.some((a) => a === "--prompt" || a === "-p");
}
var headlessOptions = {
  prompt: { type: "string", short: "p" },
  continue: { type: "boolean", short: "c", default: false },
  timeout: { type: "string" },
  // parsed to number after validation
  format: { type: "string", default: "default" },
  help: { type: "boolean", short: "h", default: false }
};
function parseHeadlessArgs(argv) {
  const { values, positionals } = parseArgs({
    args: argv.slice(2),
    options: headlessOptions,
    strict: false,
    allowPositionals: true
  });
  const format = String(values.format ?? "default");
  if (format !== "default" && format !== "json") {
    throw new Error('--format must be "default" or "json"');
  }
  let timeout;
  if (values.timeout !== void 0) {
    const raw = String(values.timeout);
    const parsed = Number(raw);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      throw new Error("--timeout must be a positive integer");
    }
    timeout = parsed;
  }
  const prompt = typeof values.prompt === "string" ? values.prompt : positionals[0];
  return {
    prompt,
    timeout,
    format,
    continue_: Boolean(values.continue)
  };
}
function truncate(s, max) {
  return s.length > max ? s.slice(0, max) + "..." : s;
}
function printHeadlessUsage() {
  process.stdout.write(`
Usage: mastracode --prompt <text> [options]

Headless (non-interactive) mode options:
  --prompt, -p <text>   The task to execute (required, or pipe via stdin)
  --continue, -c        Resume the most recent thread instead of creating a new one
  --timeout <seconds>   Exit with code 2 if not complete within timeout
  --format <type>       Output format: "default" or "json" (default: "default")

Exit codes:
  0  Agent completed successfully
  1  Error or aborted
  2  Timeout

Examples:
  mastracode --prompt "Fix the bug in auth.ts"
  mastracode --prompt "Add tests" --timeout 300
  mastracode -c --prompt "Continue where you left off"
  mastracode --prompt "Refactor utils" --format json
  echo "task description" | mastracode --prompt -

Run without --prompt for the interactive TUI.
`);
}
function resolveExitCode(reason) {
  return reason === "error" || reason === "aborted" ? 1 : 0;
}
function autoResolve(harness2, event) {
  switch (event.type) {
    case "sandbox_access_request": {
      harness2.respondToQuestion({ questionId: event.questionId, answer: "Yes" });
      return { resolved: true, label: `[auto-approved sandbox] ${event.path}`, json: { ...event, autoApproved: true } };
    }
    case "tool_approval_required": {
      harness2.respondToToolApproval({ decision: "approve" });
      return { resolved: true, label: `[auto-approved] ${event.toolName}`, json: { ...event, autoApproved: true } };
    }
    case "ask_question": {
      harness2.respondToQuestion({
        questionId: event.questionId,
        answer: "Proceed with your best judgment. Do not ask further questions."
      });
      return {
        resolved: true,
        label: `[auto-answered] ${truncate(event.question, 100)}`,
        json: { ...event, autoAnswered: true }
      };
    }
    case "plan_approval_required": {
      void harness2.respondToPlanApproval({ planId: event.planId, response: { action: "approved" } });
      return { resolved: true, label: `[auto-approved plan] ${event.title}`, json: { ...event, autoApproved: true } };
    }
    default:
      return { resolved: false };
  }
}
function formatDefault(event, ctx) {
  switch (event.type) {
    case "agent_start":
      ctx.lastTextLength = 0;
      break;
    case "message_update": {
      const fullText = event.message.content.filter((c) => c.type === "text").map((p) => p.text).join("");
      if (fullText.length > ctx.lastTextLength) {
        process.stdout.write(fullText.slice(ctx.lastTextLength));
        ctx.lastTextLength = fullText.length;
      }
      break;
    }
    case "message_end":
      ctx.lastTextLength = 0;
      process.stdout.write("\n");
      break;
    case "tool_start":
      process.stderr.write(`[tool] ${event.toolName}
`);
      break;
    case "tool_end":
      if (event.isError) process.stderr.write(`[tool error] ${truncate(String(event.result), 200)}
`);
      break;
    case "shell_output":
      process.stderr.write(event.output);
      break;
    case "subagent_start":
      process.stderr.write(`[subagent:${event.agentType}] ${truncate(event.task, 100)}
`);
      break;
    case "subagent_end":
      if (event.isError) process.stderr.write(`[subagent error] ${truncate(event.result, 200)}
`);
      break;
    case "error":
      process.stderr.write(`[error] ${event.error.message}
`);
      break;
  }
}
async function runHeadless(harness2, args, extension) {
  const emit = args.format === "json" ? (data) => process.stdout.write(JSON.stringify(data) + "\n") : null;
  let timeoutId;
  let timedOut = false;
  if (args.timeout) {
    timeoutId = setTimeout(() => {
      timedOut = true;
      if (emit) {
        emit({ type: "timeout", seconds: args.timeout });
      } else {
        process.stderr.write(`
Timeout: ${args.timeout}s elapsed. Aborting.
`);
      }
      harness2.abort();
    }, args.timeout * 1e3);
  }
  const streamCtx = { lastTextLength: 0 };
  const done = new Promise((resolve) => {
    harness2.subscribe((event) => {
      const result = autoResolve(harness2, event);
      if (result.resolved) {
        if (emit) emit(result.json);
        else process.stderr.write(result.label + "\n");
        return;
      }
      if (event.type === "agent_end") {
        if (emit) emit({ ...event });
        resolve(resolveExitCode(event.reason));
        return;
      }
      if (emit) {
        emit({ ...event });
      } else {
        formatDefault(event, streamCtx);
      }
    });
  });
  if (args.continue_) {
    const threads = await harness2.listThreads();
    if (threads.length > 0) {
      const sorted = [...threads].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
      await harness2.switchThread({ threadId: sorted[0].id });
      if (!emit) process.stderr.write(`[continued] thread ${sorted[0].id}
`);
    } else if (!emit) {
      process.stderr.write(`[info] No existing threads found, starting new thread
`);
    }
  }
  await extension.harnessAdapter.sendMessage(harness2, { content: args.prompt });
  const exitCode = await done;
  if (timeoutId) clearTimeout(timeoutId);
  return timedOut ? 2 : exitCode;
}
async function headlessMain() {
  if (process.argv.includes("--help") || process.argv.includes("-h")) {
    printHeadlessUsage();
    process.exit(0);
  }
  let args;
  try {
    args = parseHeadlessArgs(process.argv);
  } catch (e) {
    process.stderr.write(`Error: ${e.message}
`);
    process.exit(1);
  }
  let prompt = args.prompt;
  if (prompt === "-" || !prompt && !process.stdin.isTTY) {
    const chunks = [];
    for await (const chunk of process.stdin) {
      chunks.push(chunk);
    }
    prompt = Buffer.concat(chunks).toString("utf-8").trim();
  }
  if (!prompt) {
    printHeadlessUsage();
    process.stderr.write("Error: --prompt is required (or pipe via stdin)\n");
    process.exit(1);
  }
  const result = await createMastraCode({ initialState: { yolo: true } });
  const { harness: harness2, mcpManager: mcpManager2 } = result;
  if (mcpManager2?.hasServers()) {
    mcpManager2.initInBackground().catch(() => {
    });
  }
  setupDebugLogging();
  await result.extension.harnessAdapter.initHarness(harness2);
  const exitCode = await runHeadless(harness2, { ...args, prompt }, result.extension);
  releaseAllThreadLocks();
  await Promise.allSettled([mcpManager2?.disconnect(), harness2?.stopHeartbeats()]);
  process.exit(exitCode);
}

// src/main.ts
var harness;
var mcpManager;
var hookManager;
var authStorage;
process.on("uncaughtException", (error) => {
  if (isStreamDestroyedError(error)) return;
  handleFatalError(error);
});
process.on("unhandledRejection", (reason) => {
  if (isStreamDestroyedError(reason)) return;
  handleFatalError(reason instanceof Error ? reason : new Error(String(reason)));
});
async function tuiMain() {
  const result = await createMastraCode();
  harness = result.harness;
  mcpManager = result.mcpManager;
  hookManager = result.hookManager;
  authStorage = result.authStorage;
  if (result.storageWarning) {
    console.info(`\u26A0 ${result.storageWarning}`);
  }
  setupDebugLogging();
  const envTheme = process.env.MASTRA_THEME?.toLowerCase();
  let themeMode;
  let detectedBgHex;
  if (envTheme === "dark" || envTheme === "light") {
    themeMode = envTheme;
  } else {
    const settings = loadSettings();
    const themePref = settings.preferences.theme;
    if (themePref === "dark" || themePref === "light") {
      themeMode = themePref;
    } else {
      const detection = await detectTerminalTheme();
      themeMode = detection.mode;
      detectedBgHex = detection.detectedBgHex;
    }
  }
  applyThemeMode(themeMode, detectedBgHex);
  const tui = new MastraTUI({
    harness,
    hookManager,
    authStorage,
    mcpManager,
    extension: result.extension,
    appName: "Mastra Code",
    version: getCurrentVersion(),
    inlineQuestions: true
  });
  tui.run().catch((error) => {
    handleFatalError(error);
  });
}
var asyncCleanup = async () => {
  releaseAllThreadLocks();
  await Promise.allSettled([mcpManager?.disconnect(), harness?.stopHeartbeats()]);
};
process.on("beforeExit", () => {
  void asyncCleanup();
});
process.on("exit", () => {
  restoreTerminalForeground();
  releaseAllThreadLocks();
});
process.on("SIGINT", () => {
  void asyncCleanup().finally(() => process.exit(0));
});
process.on("SIGTERM", () => {
  void asyncCleanup().finally(() => process.exit(0));
});
function hasEconnrefused(err, depth = 0) {
  if (!err || depth > 5) return false;
  const e = err;
  if (e.code === "ECONNREFUSED") return true;
  if (e.cause) return hasEconnrefused(e.cause, depth + 1);
  if (Array.isArray(e.errors)) return e.errors.some((inner) => hasEconnrefused(inner, depth + 1));
  return false;
}
function handleFatalError(error) {
  const write = (msg2) => process.stderr.write(msg2 + "\n");
  if (hasEconnrefused(error)) {
    const settings = loadSettings();
    const connStr = settings.storage?.pg?.connectionString;
    const target = connStr ?? "localhost:5432";
    write(
      `
Failed to connect to PostgreSQL at ${target}.
Make sure the database is running and accessible.

To switch back to LibSQL:
  Set MASTRA_STORAGE_BACKEND=libsql or change the backend in /settings
`
    );
    process.exit(1);
  }
  const msg = `Fatal error: ${error instanceof Error ? error.message : String(error)}`;
  write(msg);
  try {
    const crashLog = `[${(/* @__PURE__ */ new Date()).toISOString()}] ${msg}
${error instanceof Error && error.stack ? error.stack + "\n" : ""}`;
    fs__default.appendFileSync("/tmp/mastra-crash.log", crashLog);
  } catch {
  }
  if (error instanceof Error && error.stack) {
    write(error.stack);
  }
  process.exit(1);
}
var main = hasHeadlessFlag(process.argv) ? headlessMain : tuiMain;
main().catch((error) => {
  handleFatalError(error);
});
//# sourceMappingURL=cli.js.map
//# sourceMappingURL=cli.js.map