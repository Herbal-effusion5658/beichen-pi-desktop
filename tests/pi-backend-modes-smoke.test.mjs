import assert from "node:assert/strict";
import test from "node:test";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, "..");
const CLI_PATH = path.join(ROOT_DIR, "node_modules", "@earendil-works", "pi-coding-agent", "dist", "bundle", "cli.js");
const EXTENSION_PATH = path.join(ROOT_DIR, "resources", "pi-extensions", "context-modes.ts");

function testPiRpcWithMode(contextMode, profilePrompt) {
  return new Promise((resolve, reject) => {
    const args = [
      CLI_PATH,
      "--mode", "rpc",
      "--approve",
      "--system-prompt", profilePrompt,
      "--tools", "read,powershell,edit,write,grep,find,ls",
      "--extension", EXTENSION_PATH,
    ];

    const env = {
      ...process.env,
      BEICHEN_CONTEXT_MODE: contextMode,
      FORCE_COLOR: "0",
    };

    const child = spawn(process.execPath, args, {
      cwd: ROOT_DIR,
      env,
      stdio: ["pipe", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    let resolved = false;

    child.stdout.on("data", (chunk) => {
      stdout += chunk;
      const lines = stdout.split("\n");
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const msg = JSON.parse(line);
          if (msg.type === "response" && msg.id === "test-get-state") {
            resolved = true;
            child.stdin.end();
            child.kill();
            resolve({ success: true, state: msg.data });
            return;
          }
        } catch {
          // not complete line yet
        }
      }
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });

    child.on("error", (err) => {
      if (!resolved) reject(err);
    });

    child.on("exit", (code) => {
      if (!resolved) {
        reject(new Error(`Pi exited early with code ${code}. Stderr: ${stderr}`));
      }
    });

    // Send get_state command
    setTimeout(() => {
      child.stdin.write(JSON.stringify({ type: "get_state", id: "test-get-state" }) + "\n");
    }, 500);

    // Timeout
    setTimeout(() => {
      if (!resolved) {
        child.kill();
        reject(new Error(`Timeout waiting for Pi RPC response. Stderr: ${stderr}`));
      }
    }, 15000);
  });
}

test("Pi RPC loads context-modes extension in quantum mode", async () => {
  const result = await testPiRpcWithMode("quantum", "You are Beichen Pi in quantum mode");
  assert.ok(result.success);
  assert.ok(result.state);
});

test("Pi RPC loads context-modes extension in ghost mode", async () => {
  const result = await testPiRpcWithMode("ghost", "You are Beichen Pi in ghost mode");
  assert.ok(result.success);
  assert.ok(result.state);
});

test("Pi RPC loads context-modes extension in ultra mode", async () => {
  const result = await testPiRpcWithMode("ultra", "You are Beichen Pi in ultra mode");
  assert.ok(result.success);
  assert.ok(result.state);
});
