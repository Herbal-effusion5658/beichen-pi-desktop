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
    if (key) env[envName] = key;
  }
  return env;
}

async function runTurn(child, promptText) {
  return new Promise((resolve, reject) => {
    const id = `prompt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const startTime = Date.now();
    let thinkingText = "";
    let finalText = "";
    let usage = null;
    let stopReason = "";
    let errorMessage = "";
    let isSettled = false;

    const onData = (chunk) => {
      const lines = chunk.toString().split("\n");
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const msg = JSON.parse(line);
          if (msg.type === "message_update" && msg.assistantMessageEvent?.type === "thinking_delta") {
            thinkingText += msg.assistantMessageEvent.delta || "";
          }
          if (msg.type === "message_end" && msg.message?.role === "assistant") {
            if (msg.message.usage) usage = msg.message.usage;
            stopReason = msg.message.stopReason || "";
            errorMessage = msg.message.errorMessage || "";
            if (Array.isArray(msg.message.content)) {
              for (const part of msg.message.content) {
                if (part.type === "text") finalText += part.text || "";
                if (part.type === "thinking") thinkingText = part.thinking || thinkingText;
              }
            } else if (typeof msg.message.content === "string") {
              finalText = msg.message.content;
            }
          }
          if (msg.type === "agent_settled") {
            isSettled = true;
            child.stdout.off("data", onData);
            const durationMs = Date.now() - startTime;
            resolve({
              durationMs,
              thinkingLength: thinkingText.length,
              thinkingSnippet: thinkingText.slice(0, 160),
              finalText,
              usage,
              stopReason,
              errorMessage,
            });
          }
        } catch {}
      }
    };

    child.stdout.on("data", onData);
    child.stdin.write(JSON.stringify({ type: "prompt", id, message: promptText }) + "\n");

    setTimeout(() => {
      if (!isSettled) {
        child.stdout.off("data", onData);
        reject(new Error("Turn timeout (60s)"));
      }
    }, 60000);
  });
}

function startPiChild(profileId, env, provider, modelId, thinkingLevel) {
  const profile = getProfile(profileId);
  const args = [
    CLI_PATH,
    "--mode", "rpc",
    "--approve",
    "--thinking", thinkingLevel || "max",
    "--system-prompt", buildSystemPrompt("codex", profileId, "full"),
    "--tools", "read,powershell,edit,write,grep,find,ls",
    "--extension", EXTENSION_PATH,
  ];
  if (provider) args.push("--provider", provider);
  if (modelId) args.push("--model", modelId);

  const childEnv = {
    ...env,
    BEICHEN_CONTEXT_MODE: profile.contextMode,
  };

  const child = spawn(process.execPath, args, {
    cwd: os.tmpdir(),
    env: childEnv,
    stdio: ["pipe", "pipe", "pipe"],
  });

  return child;
}

app.whenReady().then(async () => {
  console.log("=== 北辰 Pi 实时在线对话与模式统计实测 ===\n");
  const settings = readJson(appSettingsPath(), {});
  const defaults = settings.defaults || {};
  const provider = defaults.provider || "beichen-custom-f620e252-f11";
  const modelId = defaults.modelId || "MiniMaxAI/MiniMax-M3";
  const thinkingLevel = defaults.thinkingLevel || "max";

  console.log(`当前激活模型: [${provider}] ${modelId}`);
  console.log(`思考强度: ${thinkingLevel}\n`);

  const env = prepareEnv(settings);
  const testQuestion1 = "请用2句话解释什么是量子隧穿效应？";
  const testQuestion2 = "它在现代芯片（如晶体管）中带来了什么主要挑战？请用1句话回答。";

  const modesToTest = ["codex", "ultra", "quantum", "ghost"];
  const results = [];

  for (const mode of modesToTest) {
    console.log(`----------------------------------------`);
    console.log(`▶ 正在测试模式: [${mode.toUpperCase()}] (${getProfile(mode).subtitle})...`);
    const child = startPiChild(mode, env, provider, modelId, thinkingLevel);

    try {
      // Wait for RPC ready
      await new Promise((r) => setTimeout(r, 1200));

      console.log(`  [回合 1] 提问: "${testQuestion1}"`);
      const turn1 = await runTurn(child, testQuestion1);
      if (turn1.stopReason === "error") {
        console.log(`  ✖ 回合 1 错误: ${turn1.errorMessage}`);
      } else {
        console.log(`  ✔ 回合 1 完成: 耗时 ${turn1.durationMs}ms | 思考字符数: ${turn1.thinkingLength} | 输出字数: ${turn1.finalText.length}`);
        if (turn1.usage) {
          console.log(`    Token 统计: 输入=${turn1.usage.input || 0}, 输出=${turn1.usage.output || 0}, 推理Token=${turn1.usage.reasoning || 0}, 总计=${turn1.usage.totalTokens || 0}`);
        }
        console.log(`    回复内容: ${turn1.finalText.trim()}`);
      }

      console.log(`  [回合 2] 提问: "${testQuestion2}" (验证历史思考如何进入上下文)`);
      const turn2 = await runTurn(child, testQuestion2);
      if (turn2.stopReason === "error") {
        console.log(`  ✖ 回合 2 错误: ${turn2.errorMessage}`);
      } else {
        console.log(`  ✔ 回合 2 完成: 耗时 ${turn2.durationMs}ms | 思考字符数: ${turn2.thinkingLength} | 输出字数: ${turn2.finalText.length}`);
        if (turn2.usage) {
          console.log(`    Token 统计: 输入=${turn2.usage.input || 0}, 输出=${turn2.usage.output || 0}, 推理Token=${turn2.usage.reasoning || 0}, 总计=${turn2.usage.totalTokens || 0}`);
        }
        console.log(`    回复内容: ${turn2.finalText.trim()}`);
      }

      results.push({
        mode,
        turn1,
        turn2,
      });
    } catch (err) {
      console.error(`  ✖ 测试失败: ${err.message}`);
      results.push({ mode, error: err.message });
    } finally {
      child.stdin.end();
      child.kill();
      await new Promise((r) => setTimeout(r, 600));
    }
  }

  console.log("\n========================================");
  console.log("             实测统计对比汇总           ");
  console.log("========================================");
  console.log(JSON.stringify(results, null, 2));

  app.exit(0);
});
