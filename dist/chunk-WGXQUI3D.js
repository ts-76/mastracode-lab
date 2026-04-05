import fs, { existsSync, readFileSync, mkdirSync, writeFileSync, chmodSync } from 'fs';
import path, { join, dirname } from 'path';
import { execSync } from 'child_process';
import { createHash } from 'crypto';
import os from 'os';

// src/auth/storage.ts
function git(args, cwd) {
  try {
    return execSync(`git ${args}`, {
      cwd,
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"]
    }).trim();
  } catch {
    return void 0;
  }
}
function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
function shortHash(str) {
  return createHash("sha256").update(str).digest("hex").slice(0, 12);
}
function normalizeGitUrl(url) {
  return url.replace(/\.git$/, "").replace(/^git@([^:]+):/, "https://$1/").replace(/^ssh:\/\/git@/, "https://").toLowerCase();
}
function detectProject(projectPath) {
  const absolutePath = path.resolve(projectPath);
  const gitDir = git("rev-parse --git-dir", absolutePath);
  const isGitRepo = gitDir !== void 0;
  let rootPath = absolutePath;
  let gitUrl;
  let gitBranch;
  let isWorktree = false;
  let mainRepoPath;
  if (isGitRepo) {
    rootPath = git("rev-parse --show-toplevel", absolutePath) || absolutePath;
    const commonDir = git("rev-parse --git-common-dir", absolutePath);
    if (commonDir && commonDir !== ".git" && commonDir !== gitDir) {
      isWorktree = true;
      mainRepoPath = path.dirname(path.resolve(rootPath, commonDir));
    }
    gitUrl = git("remote get-url origin", absolutePath);
    if (!gitUrl) {
      const remotes = git("remote", absolutePath);
      if (remotes) {
        const firstRemote = remotes.split("\n")[0];
        if (firstRemote) {
          gitUrl = git(`remote get-url ${firstRemote}`, absolutePath);
        }
      }
    }
    gitBranch = git("rev-parse --abbrev-ref HEAD", absolutePath);
  }
  let resourceIdSource;
  if (gitUrl) {
    resourceIdSource = normalizeGitUrl(gitUrl);
  } else if (mainRepoPath) {
    resourceIdSource = mainRepoPath;
  } else {
    resourceIdSource = rootPath;
  }
  const baseName = gitUrl ? gitUrl.split("/").pop()?.replace(/\.git$/, "") || "project" : path.basename(rootPath);
  const resourceId = `${slugify(baseName)}-${shortHash(resourceIdSource)}`;
  return {
    resourceId,
    name: baseName,
    rootPath,
    gitUrl,
    gitBranch,
    isWorktree,
    mainRepoPath
  };
}
function getCurrentGitBranch(cwd) {
  return git("rev-parse --abbrev-ref HEAD", cwd);
}
function getAppDataDir() {
  const platform = os.platform();
  let baseDir;
  if (platform === "darwin") {
    baseDir = path.join(os.homedir(), "Library", "Application Support");
  } else if (platform === "win32") {
    baseDir = process.env.APPDATA || path.join(os.homedir(), "AppData", "Roaming");
  } else {
    baseDir = process.env.XDG_DATA_HOME || path.join(os.homedir(), ".local", "share");
  }
  const appDir = path.join(baseDir, "mastracode");
  if (!fs.existsSync(appDir)) {
    fs.mkdirSync(appDir, { recursive: true });
  }
  return appDir;
}
function getDatabasePath() {
  if (process.env.MASTRA_DB_PATH) {
    return process.env.MASTRA_DB_PATH;
  }
  return path.join(getAppDataDir(), "mastra.db");
}
function getVectorDatabasePath() {
  return path.join(getAppDataDir(), "mastra-vectors.db");
}
function getStorageConfig(projectDir, storageSettings) {
  const envBackend = process.env.MASTRA_STORAGE_BACKEND;
  if (envBackend === "pg") {
    return resolvePgFromEnv();
  }
  if (envBackend === "libsql" || process.env.MASTRA_DB_URL) {
    return resolveLibSQLFromEnv();
  }
  if (storageSettings && storageSettings.backend === "pg") {
    return resolvePgFromSettings(storageSettings);
  }
  if (storageSettings && storageSettings.backend === "libsql" && storageSettings.libsql.url) {
    return {
      backend: "libsql",
      url: storageSettings.libsql.url,
      authToken: storageSettings.libsql.authToken,
      isRemote: !storageSettings.libsql.url.startsWith("file:")
    };
  }
  if (projectDir) {
    const projectConfig = loadDatabaseConfig(path.join(projectDir, ".mastracode", "database.json"));
    if (projectConfig) return projectConfig;
  }
  const globalConfig = loadDatabaseConfig(path.join(os.homedir(), ".mastracode", "database.json"));
  if (globalConfig) return globalConfig;
  return {
    backend: "libsql",
    url: `file:${getDatabasePath()}`,
    isRemote: false
  };
}
function resolveLibSQLFromEnv() {
  const url = process.env.MASTRA_DB_URL;
  return {
    backend: "libsql",
    url,
    authToken: process.env.MASTRA_DB_AUTH_TOKEN,
    isRemote: !url.startsWith("file:")
  };
}
function resolvePgFromEnv() {
  const connectionString = process.env.MASTRA_PG_CONNECTION_STRING;
  if (connectionString) {
    return {
      backend: "pg",
      connectionString,
      schemaName: process.env.MASTRA_PG_SCHEMA_NAME
    };
  }
  return {
    backend: "pg",
    host: process.env.MASTRA_PG_HOST,
    port: process.env.MASTRA_PG_PORT ? parseInt(process.env.MASTRA_PG_PORT, 10) : void 0,
    database: process.env.MASTRA_PG_DATABASE,
    user: process.env.MASTRA_PG_USER,
    password: process.env.MASTRA_PG_PASSWORD,
    schemaName: process.env.MASTRA_PG_SCHEMA_NAME
  };
}
function resolvePgFromSettings(settings) {
  const pg = settings.pg;
  return {
    backend: "pg",
    connectionString: pg.connectionString,
    host: pg.host,
    port: pg.port,
    database: pg.database,
    user: pg.user,
    password: pg.password,
    schemaName: pg.schemaName,
    disableInit: pg.disableInit,
    skipDefaultIndexes: pg.skipDefaultIndexes
  };
}
function loadDatabaseConfig(filePath) {
  try {
    if (!fs.existsSync(filePath)) return null;
    const raw = fs.readFileSync(filePath, "utf-8");
    const parsed = JSON.parse(raw);
    if (typeof parsed?.url === "string" && parsed.url) {
      return {
        backend: "libsql",
        url: parsed.url,
        authToken: typeof parsed.authToken === "string" ? parsed.authToken : void 0,
        isRemote: !parsed.url.startsWith("file:")
      };
    }
    return null;
  } catch {
    return null;
  }
}
function getUserId(projectDir) {
  if (process.env.MASTRA_USER_ID) {
    return process.env.MASTRA_USER_ID;
  }
  const cwd = projectDir || process.cwd();
  const email = git("config user.email", cwd);
  if (email) {
    return email;
  }
  return os.userInfo().username || "unknown";
}
function getOmScope(projectDir) {
  const envScope = process.env.MASTRA_OM_SCOPE;
  if (envScope === "thread" || envScope === "resource") {
    return envScope;
  }
  if (projectDir) {
    const scope2 = loadOmScopeFromConfig(path.join(projectDir, ".mastracode", "database.json"));
    if (scope2) return scope2;
  }
  const scope = loadOmScopeFromConfig(path.join(os.homedir(), ".mastracode", "database.json"));
  if (scope) return scope;
  return "thread";
}
function loadOmScopeFromConfig(filePath) {
  try {
    if (!fs.existsSync(filePath)) return null;
    const raw = fs.readFileSync(filePath, "utf-8");
    const parsed = JSON.parse(raw);
    if (parsed?.omScope === "thread" || parsed?.omScope === "resource") {
      return parsed.omScope;
    }
    return null;
  } catch {
    return null;
  }
}
function getResourceIdOverride(projectDir) {
  if (process.env.MASTRA_RESOURCE_ID) {
    return process.env.MASTRA_RESOURCE_ID;
  }
  if (projectDir) {
    const rid2 = loadStringField(path.join(projectDir, ".mastracode", "database.json"), "resourceId");
    if (rid2) return rid2;
  }
  const rid = loadStringField(path.join(os.homedir(), ".mastracode", "database.json"), "resourceId");
  if (rid) return rid;
  return null;
}
function loadStringField(filePath, field) {
  try {
    if (!fs.existsSync(filePath)) return null;
    const raw = fs.readFileSync(filePath, "utf-8");
    const parsed = JSON.parse(raw);
    const value = parsed?.[field];
    if (typeof value === "string" && value) {
      return value;
    }
    return null;
  } catch {
    return null;
  }
}

// src/auth/pkce.ts
function base64urlEncode(bytes) {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}
async function generatePKCE() {
  const verifierBytes = new Uint8Array(32);
  crypto.getRandomValues(verifierBytes);
  const verifier = base64urlEncode(verifierBytes);
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const challenge = base64urlEncode(new Uint8Array(hashBuffer));
  return { verifier, challenge };
}

// src/auth/providers/anthropic.ts
var decode = (s) => atob(s);
var CLIENT_ID = decode("OWQxYzI1MGEtZTYxYi00NGQ5LTg4ZWQtNTk0NGQxOTYyZjVl");
var AUTHORIZE_URL = "https://claude.ai/oauth/authorize";
var TOKEN_URL = "https://console.anthropic.com/v1/oauth/token";
var REDIRECT_URI = "https://console.anthropic.com/oauth/code/callback";
var SCOPES = "org:create_api_key user:profile user:inference";
async function loginAnthropic(onAuthUrl, onPromptCode) {
  const { verifier, challenge } = await generatePKCE();
  const authParams = new URLSearchParams({
    code: "true",
    client_id: CLIENT_ID,
    response_type: "code",
    redirect_uri: REDIRECT_URI,
    scope: SCOPES,
    code_challenge: challenge,
    code_challenge_method: "S256",
    state: verifier
  });
  const authUrl = `${AUTHORIZE_URL}?${authParams.toString()}`;
  onAuthUrl(authUrl);
  const authCode = await onPromptCode();
  const splits = authCode.split("#");
  const code = splits[0];
  const state = splits[1];
  const tokenResponse = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      grant_type: "authorization_code",
      client_id: CLIENT_ID,
      code,
      state,
      redirect_uri: REDIRECT_URI,
      code_verifier: verifier
    })
  });
  if (!tokenResponse.ok) {
    const error = await tokenResponse.text();
    throw new Error(`Token exchange failed: ${error}`);
  }
  const tokenData = await tokenResponse.json();
  const expiresAt = Date.now() + tokenData.expires_in * 1e3 - 5 * 60 * 1e3;
  return {
    refresh: tokenData.refresh_token,
    access: tokenData.access_token,
    expires: expiresAt
  };
}
async function refreshAnthropicToken(refreshToken) {
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "refresh_token",
      client_id: CLIENT_ID,
      refresh_token: refreshToken
    })
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Anthropic token refresh failed: ${error}`);
  }
  const data = await response.json();
  return {
    refresh: data.refresh_token,
    access: data.access_token,
    expires: Date.now() + data.expires_in * 1e3 - 5 * 60 * 1e3
  };
}
var anthropicOAuthProvider = {
  id: "anthropic",
  name: "Anthropic (Claude Pro/Max)",
  async login(callbacks) {
    return loginAnthropic(
      (url) => callbacks.onAuth({ url }),
      () => callbacks.onPrompt({ message: "Paste the authorization code:" })
    );
  },
  async refreshToken(credentials) {
    return refreshAnthropicToken(credentials.refresh);
  },
  getApiKey(credentials) {
    return credentials.access;
  }
};

// src/auth/providers/openai-codex.ts
var _randomBytes = null;
var _http = null;
if (typeof process !== "undefined" && (process.versions?.node || process.versions?.bun)) {
  import('crypto').then((m) => {
    _randomBytes = m.randomBytes;
  });
  import('http').then((m) => {
    _http = m;
  });
}
var CLIENT_ID2 = "app_EMoamEEZ73f0CkXaXp7hrann";
var AUTHORIZE_URL2 = "https://auth.openai.com/oauth/authorize";
var TOKEN_URL2 = "https://auth.openai.com/oauth/token";
var REDIRECT_URI2 = "http://localhost:1455/auth/callback";
var SCOPE = "openid profile email offline_access";
var JWT_CLAIM_PATH = "https://api.openai.com/auth";
var SUCCESS_HTML = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Authentication successful</title>
</head>
<body>
  <p>Authentication successful. Return to your terminal to continue.</p>
</body>
</html>`;
function createState() {
  if (!_randomBytes) {
    throw new Error("OpenAI Codex OAuth is only available in Node.js environments");
  }
  return _randomBytes(16).toString("hex");
}
function parseAuthorizationInput(input) {
  const value = input.trim();
  if (!value) return {};
  try {
    const url = new URL(value);
    return {
      code: url.searchParams.get("code") ?? void 0,
      state: url.searchParams.get("state") ?? void 0
    };
  } catch {
  }
  if (value.includes("#")) {
    const [code, state] = value.split("#", 2);
    return { code, state };
  }
  if (value.includes("code=")) {
    const params = new URLSearchParams(value);
    return {
      code: params.get("code") ?? void 0,
      state: params.get("state") ?? void 0
    };
  }
  return { code: value };
}
function decodeJwt(token) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = parts[1] ?? "";
    const decoded = atob(payload);
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}
async function exchangeAuthorizationCode(code, verifier, redirectUri = REDIRECT_URI2) {
  const response = await fetch(TOKEN_URL2, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: CLIENT_ID2,
      code,
      code_verifier: verifier,
      redirect_uri: redirectUri
    })
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    console.error("[openai-codex] code->token failed:", response.status, text);
    return { type: "failed" };
  }
  const json = await response.json();
  if (!json.access_token || !json.refresh_token || typeof json.expires_in !== "number") {
    console.error("[openai-codex] token response missing fields:", json);
    return { type: "failed" };
  }
  return {
    type: "success",
    access: json.access_token,
    refresh: json.refresh_token,
    expires: Date.now() + json.expires_in * 1e3
  };
}
async function refreshAccessToken(refreshToken) {
  try {
    const response = await fetch(TOKEN_URL2, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        client_id: CLIENT_ID2
      })
    });
    if (!response.ok) {
      const text = await response.text().catch(() => "");
      console.error("[openai-codex] Token refresh failed:", response.status, text);
      return { type: "failed" };
    }
    const json = await response.json();
    if (!json.access_token || !json.refresh_token || typeof json.expires_in !== "number") {
      console.error("[openai-codex] Token refresh response missing fields:", json);
      return { type: "failed" };
    }
    return {
      type: "success",
      access: json.access_token,
      refresh: json.refresh_token,
      expires: Date.now() + json.expires_in * 1e3
    };
  } catch (error) {
    console.error("[openai-codex] Token refresh error:", error);
    return { type: "failed" };
  }
}
async function createAuthorizationFlow(originator = "pi") {
  const { verifier, challenge } = await generatePKCE();
  const state = createState();
  const url = new URL(AUTHORIZE_URL2);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", CLIENT_ID2);
  url.searchParams.set("redirect_uri", REDIRECT_URI2);
  url.searchParams.set("scope", SCOPE);
  url.searchParams.set("code_challenge", challenge);
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("state", state);
  url.searchParams.set("id_token_add_organizations", "true");
  url.searchParams.set("codex_cli_simplified_flow", "true");
  url.searchParams.set("originator", originator);
  return { verifier, state, url: url.toString() };
}
function startLocalOAuthServer(state) {
  if (!_http) {
    throw new Error("OpenAI Codex OAuth is only available in Node.js environments");
  }
  let lastCode = null;
  let cancelled = false;
  const server = _http.createServer((req, res) => {
    try {
      const url = new URL(req.url || "", "http://localhost");
      if (url.pathname !== "/auth/callback") {
        res.statusCode = 404;
        res.end("Not found");
        return;
      }
      if (url.searchParams.get("state") !== state) {
        res.statusCode = 400;
        res.end("State mismatch");
        return;
      }
      const code = url.searchParams.get("code");
      if (!code) {
        res.statusCode = 400;
        res.end("Missing authorization code");
        return;
      }
      res.statusCode = 200;
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.end(SUCCESS_HTML);
      lastCode = code;
    } catch {
      res.statusCode = 500;
      res.end("Internal error");
    }
  });
  return new Promise((resolve) => {
    server.listen(1455, "127.0.0.1", () => {
      resolve({
        close: () => server.close(),
        cancelWait: () => {
          cancelled = true;
        },
        waitForCode: async () => {
          const sleep = () => new Promise((r) => setTimeout(r, 100));
          for (let i = 0; i < 600; i += 1) {
            if (lastCode) return { code: lastCode };
            if (cancelled) return null;
            await sleep();
          }
          return null;
        }
      });
    }).on("error", (err) => {
      console.error(
        "[openai-codex] Failed to bind http://127.0.0.1:1455 (",
        err.code,
        ") Falling back to manual paste."
      );
      resolve({
        close: () => {
          try {
            server.close();
          } catch {
          }
        },
        cancelWait: () => {
        },
        waitForCode: async () => null
      });
    });
  });
}
function getAccountId(accessToken) {
  const payload = decodeJwt(accessToken);
  const auth = payload?.[JWT_CLAIM_PATH];
  const accountId = auth?.chatgpt_account_id;
  return typeof accountId === "string" && accountId.length > 0 ? accountId : null;
}
async function loginOpenAICodex(options) {
  const { verifier, state, url } = await createAuthorizationFlow(options.originator);
  const server = await startLocalOAuthServer(state);
  options.onAuth({
    url,
    instructions: "A browser window should open. Complete login to finish."
  });
  let code;
  try {
    if (options.onManualCodeInput) {
      let manualCode;
      let manualError;
      const manualPromise = options.onManualCodeInput().then((input) => {
        manualCode = input;
        server.cancelWait();
      }).catch((err) => {
        manualError = err instanceof Error ? err : new Error(String(err));
        server.cancelWait();
      });
      const result = await server.waitForCode();
      if (manualError) {
        throw manualError;
      }
      if (result?.code) {
        code = result.code;
      } else if (manualCode) {
        const parsed = parseAuthorizationInput(manualCode);
        if (parsed.state && parsed.state !== state) {
          throw new Error("State mismatch");
        }
        code = parsed.code;
      }
      if (!code) {
        await manualPromise;
        if (manualError) {
          throw manualError;
        }
        if (manualCode) {
          const parsed = parseAuthorizationInput(manualCode);
          if (parsed.state && parsed.state !== state) {
            throw new Error("State mismatch");
          }
          code = parsed.code;
        }
      }
    } else {
      const result = await server.waitForCode();
      if (result?.code) {
        code = result.code;
      }
    }
    if (!code) {
      const input = await options.onPrompt({
        message: "Paste the authorization code (or full redirect URL):"
      });
      const parsed = parseAuthorizationInput(input);
      if (parsed.state && parsed.state !== state) {
        throw new Error("State mismatch");
      }
      code = parsed.code;
    }
    if (!code) {
      throw new Error("Missing authorization code");
    }
    const tokenResult = await exchangeAuthorizationCode(code, verifier);
    if (tokenResult.type !== "success") {
      throw new Error("Token exchange failed");
    }
    const accountId = getAccountId(tokenResult.access);
    if (!accountId) {
      throw new Error("Failed to extract accountId from token");
    }
    return {
      access: tokenResult.access,
      refresh: tokenResult.refresh,
      expires: tokenResult.expires,
      accountId
    };
  } finally {
    server.close();
  }
}
async function refreshOpenAICodexToken(refreshToken) {
  const result = await refreshAccessToken(refreshToken);
  if (result.type !== "success") {
    throw new Error("Failed to refresh OpenAI Codex token");
  }
  const accountId = getAccountId(result.access);
  if (!accountId) {
    throw new Error("Failed to extract accountId from token");
  }
  return {
    access: result.access,
    refresh: result.refresh,
    expires: result.expires,
    accountId
  };
}
var openaiCodexOAuthProvider = {
  id: "openai-codex",
  name: "ChatGPT Plus/Pro (Codex Subscription)",
  usesCallbackServer: true,
  async login(callbacks) {
    return loginOpenAICodex({
      onAuth: callbacks.onAuth,
      onPrompt: callbacks.onPrompt,
      onProgress: callbacks.onProgress,
      onManualCodeInput: callbacks.onManualCodeInput
    });
  },
  async refreshToken(credentials) {
    return refreshOpenAICodexToken(credentials.refresh);
  },
  getApiKey(credentials) {
    return credentials.access;
  }
};

// src/auth/storage.ts
var PROVIDER_DEFAULT_MODELS = {
  anthropic: "anthropic/claude-opus-4-6",
  "openai-codex": "openai/gpt-5.4"
};
var oauthProviderRegistry = /* @__PURE__ */ new Map([
  [anthropicOAuthProvider.id, anthropicOAuthProvider],
  [openaiCodexOAuthProvider.id, openaiCodexOAuthProvider]
]);
function getOAuthProvider(id) {
  return oauthProviderRegistry.get(id);
}
function getOAuthProviders() {
  return Array.from(oauthProviderRegistry.values());
}
var AuthStorage = class {
  constructor(authPath = join(getAppDataDir(), "auth.json")) {
    this.authPath = authPath;
    this.reload();
  }
  data = {};
  /**
   * Reload credentials from disk.
   */
  reload() {
    if (!existsSync(this.authPath)) {
      this.data = {};
      return;
    }
    try {
      this.data = JSON.parse(readFileSync(this.authPath, "utf-8"));
    } catch {
      this.data = {};
    }
  }
  /**
   * Save credentials to disk.
   */
  save() {
    const dir = dirname(this.authPath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true, mode: 448 });
    }
    writeFileSync(this.authPath, JSON.stringify(this.data, null, 2), "utf-8");
    chmodSync(this.authPath, 384);
  }
  /**
   * Get credential for a provider.
   */
  get(provider) {
    return this.data[provider] ?? void 0;
  }
  /**
   * Set credential for a provider.
   */
  set(provider, credential) {
    this.data[provider] = credential;
    this.save();
  }
  /**
   * Remove credential for a provider.
   */
  remove(provider) {
    delete this.data[provider];
    this.save();
  }
  /**
   * List all providers with credentials.
   */
  list() {
    return Object.keys(this.data);
  }
  /**
   * Check if credentials exist for a provider.
   */
  has(provider) {
    return provider in this.data;
  }
  /**
   * Check if logged in via OAuth for a provider.
   */
  isLoggedIn(provider) {
    const cred = this.data[provider];
    return cred?.type === "oauth";
  }
  /**
   * Check if a stored API key exists for a provider.
   * Keys are stored under `apikey:<provider>` in auth.json.
   */
  hasStoredApiKey(provider) {
    const cred = this.data[`apikey:${provider}`];
    return cred?.type === "api_key" && cred.key.length > 0;
  }
  /**
   * Get a stored API key for a provider, if any.
   */
  getStoredApiKey(provider) {
    const cred = this.data[`apikey:${provider}`];
    return cred?.type === "api_key" && cred.key.length > 0 ? cred.key : void 0;
  }
  /**
   * Store an API key for a provider.
   * Also sets the corresponding environment variable so model resolution can find it.
   */
  setStoredApiKey(provider, key, envVar) {
    this.set(`apikey:${provider}`, { type: "api_key", key });
    if (envVar) {
      process.env[envVar] = key;
    }
  }
  /**
   * Load all stored API keys into process.env.
   * Called at startup so model resolution can find stored keys.
   * Only sets env vars that aren't already set (env vars take precedence).
   */
  loadStoredApiKeysIntoEnv(providerEnvVars) {
    for (const [key, cred] of Object.entries(this.data)) {
      if (!key.startsWith("apikey:") || cred.type !== "api_key" || !cred.key) continue;
      const provider = key.substring("apikey:".length);
      const envVar = providerEnvVars[provider];
      if (envVar && !process.env[envVar]) {
        process.env[envVar] = cred.key;
      }
    }
  }
  /**
   * Login to an OAuth provider.
   */
  async login(providerId, callbacks) {
    const provider = getOAuthProvider(providerId);
    if (!provider) {
      throw new Error(`Unknown OAuth provider: ${providerId}`);
    }
    const credentials = await provider.login(callbacks);
    this.set(providerId, { type: "oauth", ...credentials });
  }
  /**
   * Logout from a provider.
   */
  logout(provider) {
    this.remove(provider);
  }
  /**
   * Get API key for a provider, auto-refreshing OAuth tokens if needed.
   */
  async getApiKey(providerId) {
    const cred = this.data[providerId];
    if (cred?.type === "api_key") {
      return cred.key;
    }
    if (cred?.type === "oauth") {
      const provider = getOAuthProvider(providerId);
      if (!provider) {
        return void 0;
      }
      if (Date.now() >= cred.expires) {
        try {
          const newCreds = await provider.refreshToken(cred);
          this.set(providerId, { type: "oauth", ...newCreds });
          return provider.getApiKey(newCreds);
        } catch {
          return void 0;
        }
      }
      return provider.getApiKey(cred);
    }
    return void 0;
  }
};

export { AuthStorage, PROVIDER_DEFAULT_MODELS, detectProject, getAppDataDir, getCurrentGitBranch, getDatabasePath, getOAuthProvider, getOAuthProviders, getOmScope, getResourceIdOverride, getStorageConfig, getUserId, getVectorDatabasePath };
//# sourceMappingURL=chunk-WGXQUI3D.js.map
//# sourceMappingURL=chunk-WGXQUI3D.js.map