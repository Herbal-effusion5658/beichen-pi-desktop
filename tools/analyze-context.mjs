import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import {
  createAgentSession,
  DefaultResourceLoader,
  estimateTokens,
  SessionManager,
} from "@earendil-works/pi-coding-agent";

const require = createRequire(import.meta.url);
const { buildSystemPrompt } = require("../electron/prompts.cjs");
const cwd = process.cwd();
const agentDir = path.join(os.homedir(), ".pi", "agent");

function estimateText(text) {
  return estimateTokens({ role: "user", content: text, timestamp: 0 });
}

async function measure(name, { customPrompt, tools, noSkills = false }) {
  const loader = new DefaultResourceLoader({
    cwd,
    agentDir,
    noExtensions: true,
    noSkills,
    noPromptTemplates: true,
    noThemes: true,
    ...(customPrompt ? { systemPromptOverride: () => customPrompt } : {}),
  });
  await loader.reload();

  const { session } = await createAgentSession({
    cwd,
    resourceLoader: loader,
    sessionManager: SessionManager.inMemory(cwd),
    tools,
  });

  const systemPrompt = session.agent.state.systemPrompt;
  const toolDefinitions = session.agent.state.tools.map((tool) => ({
    name: tool.name,
    description: tool.description,
    parameters: tool.parameters,
  }));
  const toolText = JSON.stringify(toolDefinitions);
  const result = {
    name,
    skillCount: loader.getSkills().skills.length,
    systemPromptCharacters: systemPrompt.length,
    systemPromptEstimatedTokens: estimateText(systemPrompt),
    toolCount: toolDefinitions.length,
    toolDefinitionCharacters: toolText.length,
    toolDefinitionsEstimatedTokens: estimateText(toolText),
    combinedEstimatedTokens: estimateText(systemPrompt) + estimateText(toolText),
  };
  session.dispose();
  return result;
}

const results = [];
results.push(
  await measure("Beichen automatic light route", {
    customPrompt: buildSystemPrompt("codex", "codex", "light"),
    tools: [],
    noSkills: true,
  }),
);
results.push(
  await measure("Pi default without skills", {
    tools: ["read", "powershell", "edit", "write"],
    noSkills: true,
  }),
);
results.push(
  await measure("Pi default", {
    tools: ["read", "powershell", "edit", "write"],
  }),
);
results.push(
  await measure("Beichen Codex without skills", {
    customPrompt: buildSystemPrompt("codex", "codex"),
    tools: ["read", "powershell", "edit", "write", "grep", "find", "ls"],
    noSkills: true,
  }),
);
results.push(
  await measure("Beichen Codex current", {
    customPrompt: buildSystemPrompt("codex", "codex"),
    tools: ["read", "powershell", "edit", "write", "grep", "find", "ls"],
  }),
);

console.log(JSON.stringify(results, null, 2));
