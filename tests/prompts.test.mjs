import assert from "node:assert/strict";
import test from "node:test";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { PROFILES, buildSystemPrompt, getProfile } = require("../electron/prompts.cjs");

test("all requested performance profiles exist", () => {
  assert.deepEqual(Object.keys(PROFILES), [
    "codex",
    "benchmark",
    "efficiency",
    "ultra",
    "quantum",
    "ghost",
  ]);
  assert.equal(PROFILES.efficiency.hidden, true);
  assert.deepEqual(
    Object.values(PROFILES).filter((profile) => !profile.hidden).map((profile) => profile.id),
    ["codex", "benchmark", "ultra", "quantum", "ghost"],
  );
});

test("profiles retain recommendations only as first-run defaults", () => {
  for (const id of ["benchmark", "ultra", "quantum", "ghost"]) {
    assert.equal(getProfile(id).recommendedThinking, "max");
  }
});

test("performance prompts never override the runtime-selected thinking level", () => {
  for (const id of Object.keys(PROFILES)) {
    const prompt = buildSystemPrompt("codex", id);
    assert.match(prompt, /independent user controls/i);
    assert.match(prompt, /native automatic context compaction remains enabled/i);
    assert.doesNotMatch(prompt, /use (?:high|the highest) reasoning|lowest reasoning effort|disable reasoning/i);
  }
});

test("Codex uses a compact Pi contract and Benchmark is score-focused", () => {
  const codex = buildSystemPrompt("codex", "codex");
  const benchmark = buildSystemPrompt("codex", "benchmark");
  assert.ok(codex.length < 1800, `Codex prompt should stay compact, received ${codex.length} characters`);
  assert.match(codex, /Codex-style autonomous coding agent/i);
  assert.match(benchmark, /Maximize the real benchmark result/i);
  assert.match(benchmark, /reproducible baseline/i);
});

test("silent profiles preserve full current reasoning and only post-process completed turns", () => {
  const ultra = buildSystemPrompt("codex", "ultra");
  const quantum = buildSystemPrompt("codex", "quantum");
  const ghost = buildSystemPrompt("codex", "ghost");
  assert.match(ultra, /Think and use tools normally/i);
  assert.match(ultra, /one complete final answer/i);
  assert.match(quantum, /Only after a turn is complete/i);
  assert.match(quantum, /compresses that completed turn's reasoning/i);
  assert.match(quantum, /do not shorten current reasoning/i);
  assert.match(ghost, /Only after a turn is complete/i);
  assert.match(ghost, /removes that completed turn's reasoning/i);
  assert.match(ghost, /do not reduce current reasoning/i);
  assert.doesNotMatch(`${quantum}\n${ghost}`, /free tokens|unlimited context|not billed/i);
});

test("ChatGPT and Codex prompts remain distinct", () => {
  assert.notEqual(buildSystemPrompt("chatgpt", "codex"), buildSystemPrompt("codex", "codex"));
});

test("light route stays much smaller than the full Codex contract", () => {
  const light = buildSystemPrompt("codex", "ultra", "light");
  const full = buildSystemPrompt("codex", "ultra", "full");
  assert.ok(light.length < full.length * 0.35);
  assert.match(light, /isolated first-turn greeting/);
});
