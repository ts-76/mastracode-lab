import { WORKSPACE_TOOLS } from '@mastra/core/workspace';

// src/tool-names.ts
var MC_TOOLS = {
  // Filesystem
  VIEW: "view",
  WRITE_FILE: "write_file",
  STRING_REPLACE_LSP: "string_replace_lsp",
  FIND_FILES: "find_files",
  DELETE_FILE: "delete_file",
  FILE_STAT: "file_stat",
  MKDIR: "mkdir",
  // Search
  SEARCH_CONTENT: "search_content",
  // Code intelligence
  AST_SMART_EDIT: "ast_smart_edit",
  // Sandbox
  EXECUTE_COMMAND: "execute_command",
  GET_PROCESS_OUTPUT: "get_process_output",
  KILL_PROCESS: "kill_process",
  // Code intelligence
  LSP_INSPECT: "lsp_inspect"
};
var TOOL_NAME_OVERRIDES = {
  [WORKSPACE_TOOLS.FILESYSTEM.READ_FILE]: { name: MC_TOOLS.VIEW },
  [WORKSPACE_TOOLS.FILESYSTEM.WRITE_FILE]: { name: MC_TOOLS.WRITE_FILE },
  [WORKSPACE_TOOLS.FILESYSTEM.EDIT_FILE]: { name: MC_TOOLS.STRING_REPLACE_LSP },
  [WORKSPACE_TOOLS.FILESYSTEM.LIST_FILES]: { name: MC_TOOLS.FIND_FILES },
  [WORKSPACE_TOOLS.FILESYSTEM.DELETE]: { name: MC_TOOLS.DELETE_FILE },
  [WORKSPACE_TOOLS.FILESYSTEM.FILE_STAT]: { name: MC_TOOLS.FILE_STAT },
  [WORKSPACE_TOOLS.FILESYSTEM.MKDIR]: { name: MC_TOOLS.MKDIR },
  [WORKSPACE_TOOLS.FILESYSTEM.GREP]: { name: MC_TOOLS.SEARCH_CONTENT },
  [WORKSPACE_TOOLS.FILESYSTEM.AST_EDIT]: { name: MC_TOOLS.AST_SMART_EDIT },
  [WORKSPACE_TOOLS.SANDBOX.EXECUTE_COMMAND]: { name: MC_TOOLS.EXECUTE_COMMAND },
  [WORKSPACE_TOOLS.SANDBOX.GET_PROCESS_OUTPUT]: { name: MC_TOOLS.GET_PROCESS_OUTPUT },
  [WORKSPACE_TOOLS.SANDBOX.KILL_PROCESS]: { name: MC_TOOLS.KILL_PROCESS },
  [WORKSPACE_TOOLS.LSP.LSP_INSPECT]: { name: MC_TOOLS.LSP_INSPECT }
};

// src/permissions.ts
var TOOL_CATEGORIES = {
  read: {
    label: "Read",
    description: "Read files, search, list directories"
  },
  edit: {
    label: "Edit",
    description: "Create, modify, or delete files"
  },
  execute: {
    label: "Execute",
    description: "Run shell commands"
  },
  mcp: {
    label: "MCP",
    description: "External MCP server tools"
  }
};
var TOOL_CATEGORY_MAP = {
  // Read-only tools — always safe
  [MC_TOOLS.VIEW]: "read",
  [MC_TOOLS.SEARCH_CONTENT]: "read",
  [MC_TOOLS.FIND_FILES]: "read",
  [MC_TOOLS.LSP_INSPECT]: "read",
  web_search: "read",
  "web-search": "read",
  web_extract: "read",
  "web-extract": "read",
  // Edit tools — modify files
  [MC_TOOLS.STRING_REPLACE_LSP]: "edit",
  [MC_TOOLS.AST_SMART_EDIT]: "edit",
  [MC_TOOLS.WRITE_FILE]: "edit",
  subagent: "edit",
  // Execute tools — run arbitrary commands
  [MC_TOOLS.EXECUTE_COMMAND]: "execute"
  // Interactive / planning tools — always allowed (no category needed)
  // ask_user, task_write, task_check, submit_plan, request_access
};
var ALWAYS_ALLOW_TOOLS = /* @__PURE__ */ new Set(["ask_user", "task_write", "task_check", "submit_plan", "request_access"]);
function getToolCategory(toolName) {
  if (ALWAYS_ALLOW_TOOLS.has(toolName)) return null;
  return TOOL_CATEGORY_MAP[toolName] ?? "mcp";
}
function getToolsForCategory(category) {
  return Object.entries(TOOL_CATEGORY_MAP).filter(([, cat]) => cat === category).map(([tool]) => tool);
}
var DEFAULT_POLICIES = {
  read: "allow",
  edit: "ask",
  execute: "ask",
  mcp: "ask"
};
var YOLO_POLICIES = {
  read: "allow",
  edit: "allow",
  execute: "allow",
  mcp: "allow"
};
function createDefaultRules() {
  return {
    categories: { ...DEFAULT_POLICIES },
    tools: {}
  };
}
var SessionGrants = class {
  grantedCategories = /* @__PURE__ */ new Set();
  grantedTools = /* @__PURE__ */ new Set();
  allowCategory(category) {
    this.grantedCategories.add(category);
  }
  allowTool(toolName) {
    this.grantedTools.add(toolName);
  }
  isGranted(toolName, category) {
    return this.grantedTools.has(toolName) || this.grantedCategories.has(category);
  }
  reset() {
    this.grantedCategories.clear();
    this.grantedTools.clear();
  }
  getGrantedCategories() {
    return [...this.grantedCategories];
  }
  getGrantedTools() {
    return [...this.grantedTools];
  }
};
function resolveApproval(toolName, rules, sessionGrants) {
  const category = getToolCategory(toolName);
  if (category === null) return "allow";
  const toolPolicy = rules.tools[toolName];
  if (toolPolicy) return toolPolicy;
  if (sessionGrants.isGranted(toolName, category)) return "allow";
  const categoryPolicy = rules.categories[category];
  if (categoryPolicy) return categoryPolicy;
  return DEFAULT_POLICIES[category] ?? "ask";
}

export { DEFAULT_POLICIES, MC_TOOLS, SessionGrants, TOOL_CATEGORIES, TOOL_NAME_OVERRIDES, YOLO_POLICIES, createDefaultRules, getToolCategory, getToolsForCategory, resolveApproval };
//# sourceMappingURL=chunk-JP7WKMD4.js.map
//# sourceMappingURL=chunk-JP7WKMD4.js.map