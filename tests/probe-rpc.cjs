"use strict";

const { app, safeStorage } = require("electron");
const { spawn } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const { PROFILES, buildSystemPrompt, getProfile } = require("../electron/prompts.cjs");
const { envNameForProvider } = require("../electron/custom-api.cjs");

const ROOT_DIR = path.resolve(__dirname, "..");
const EXTENSION_PATH = path.join(ROOT_DIR, "resources", "pi-extensions", "context-modes.ts");
const CLI_PATH = path.join(ROOT_DIR, "node_modules", "@earendil-works", "pi-coding-agent", "dist", "bundle", "cli.js");

function appSettingsPath() {
  const appData = process.env.APPDATA || path.join(os.homedir(), "AppData", "Roaming");
  return path.join(appData, "beichen-pi-desktop", "beichen-settings.json");
}

function readJson(filePath, fallback = {}) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function decryptCustomApiKey(entry) {
  if (entry.useApiKey === false) return "beichen-local";
  if (!entry.encryptedApiKey || !safeStorage.isEncryptionAvailable()) return "";
  try {
    return safeStorage.decryptString(Buffer.from(entry.encryptedApiKey, "base64"));
  } catch {
    return "";
  }
}

function prepareEnv(settings) {
  const env = { ...process.env, FORCE_COLOR: "0", ELECTRON_RUN_AS_NODE: "1" };
  const customApis = Array.isArray(settings.customApis) ? settings.customApis : [];
  for (const entry of customApis) {
    const envName = envNameForProvider(entry.providerId);
    const key = decryptCustomApiKey(entry);
    if (key) {
      env[envName] = key;
      console.log(`[probe] Configured env for ${entry.providerId}: ${envName} (len: ${key.length})`);
    } else {
      console.log(`[probe] No key for ${entry.providerId}`);
    }
  }
  return env;
}

app.whenReady().then(async () => {
  const settings = readJson(appSettingsPath(), {});
  const defaults = settings.defaults || {};
  const provider = defaults.provider || "beichen-custom-f620e252-f11";
  const modelId = defaults.modelId || "MiniMaxAI/MiniMax-M3";
  const env = prepareEnv(settings);

  console.log(`[probe] Starting Pi with provider=${provider}, model=${modelId}`);
  const args = [
    CLI_PATH,
    "--mode", "rpc",
    "--approve",
    "--provider", provider,
    "--model", modelId,
    "--thinking", "low",
    "--system-prompt", buildSystemPrompt("codex", "codex", "full"),
    "--tools", "read,powershell,edit,write,grep,find,ls",
    "--extension", EXTENSION_PATH,
  ];

  const child = spawn(process.execPath, args, {
    cwd: os.tmpdir(),
    env: { ...env, BEICHEN_CONTEXT_MODE: "standard" },
    stdio: ["pipe", "pipe", "pipe"],
  });

  child.stdout.on("data", (chunk) => {
    console.log(`[stdout] ${chunk.toString().trim()}`);
  });

  child.stderr.on("data", (chunk) => {
    console.error(`[stderr] ${chunk.toString().trim()}`);
  });

  setTimeout(() => {
    console.log("[probe] Sending prompt: 什么是1+1？");
    child.stdin.write(JSON.stringify({ type: "prompt", id: "p1", message: "什么是1+1？只回复一个数字" }) + "\n");
  }, 1500);

  setTimeout(() => {
    console.log("[probe] Done waiting. Exiting.");
    child.stdin.end();
    child.kill();
    app.exit(0);
  }, 25000);
});
