import assert from "node:assert/strict";
import test from "node:test";
import { createRequire } from "node:module";
import {
  compactThinkingText,
  transformContextForMode,
} from "../resources/pi-extensions/context-modes.ts";

const require = createRequire(import.meta.url);
const { PROFILES, buildSystemPrompt, getProfile } = require("../electron/prompts.cjs");

test("Mode 1: CODEX profile configuration and prompt", () => {
  const profile = getProfile("codex");
  assert.equal(profile.id, "codex");
  assert.equal(profile.label, "CODEX");
  assert.equal(profile.subtitle, "精简 Pi Codex");
  assert.equal(profile.silent, false);
  assert.equal(profile.contextMode, "standard");
  assert.equal(profile.hidden, undefined);

  const prompt = buildSystemPrompt("codex", "codex");
  assert.match(prompt, /You are Beichen Pi, a Codex-style autonomous coding agent/);
  assert.match(prompt, /Profile: Codex\./);
  assert.match(prompt, /Show only sparse, useful milestone updates/);
  assert.match(prompt, /The model and thinking level are independent user controls/);
  assert.match(prompt, /Pi's native automatic context compaction remains enabled/);
});

test("Mode 2: BENCHMARK profile configuration and prompt", () => {
  const profile = getProfile("benchmark");
  assert.equal(profile.id, "benchmark");
  assert.equal(profile.label, "BENCHMARK");
  assert.equal(profile.subtitle, "极致跑分与验证");
  assert.equal(profile.silent, false);
  assert.equal(profile.contextMode, "standard");
  assert.equal(profile.hidden, undefined);

  const prompt = buildSystemPrompt("codex", "benchmark");
  assert.match(prompt, /Profile: Benchmark\./);
  assert.match(prompt, /Maximize the real benchmark result/);
  assert.match(prompt, /reproducible baseline/);
  assert.match(prompt, /Avoid progress filler, metric gaming/);
});

test("Mode 3: EXTREME EFFICIENCY is hidden from UI", () => {
  const profile = PROFILES.efficiency;
  assert.ok(profile);
  assert.equal(profile.hidden, true);

  const visibleProfiles = Object.values(PROFILES).filter((p) => !p.hidden).map((p) => p.id);
  assert.deepEqual(visibleProfiles, ["codex", "benchmark", "ultra", "quantum", "ghost"]);
  assert.ok(!visibleProfiles.includes("efficiency"));
});

test("Mode 4: ULTRA MAX profile configuration, prompt, and context behavior", () => {
  const profile = getProfile("ultra");
  assert.equal(profile.id, "ultra");
  assert.equal(profile.label, "ULTRA MAX");
  assert.equal(profile.subtitle, "精简静默执行");
  assert.equal(profile.silent, true);
  assert.equal(profile.contextMode, "ultra");
  assert.equal(profile.hidden, undefined);

  const prompt = buildSystemPrompt("codex", "ultra");
  assert.match(prompt, /Profile: Ultra Max\./);
  assert.match(prompt, /work without progress narration, status prose, tool summaries/);
  assert.match(prompt, /Think and use tools normally/);
  assert.match(prompt, /emit one complete final answer only after the run is settled/);

  // Context behavior: Ultra Max does not touch reasoning blocks in past turns
  const messages = [
    { role: "user", content: "turn 1" },
    {
      role: "assistant",
      content: [
        { type: "thinking", thinking: "deep reasoning in turn 1" },
        { type: "text", text: "result 1" },
      ],
    },
    { role: "user", content: "turn 2" },
    {
      role: "assistant",
      content: [
        { type: "thinking", thinking: "deep reasoning in turn 2" },
        { type: "text", text: "result 2" },
      ],
    },
  ];
  const transformed = transformContextForMode("ultra", messages);
  assert.equal(transformed, messages, "Ultra Max must not modify messages");
  assert.equal(transformed[1].content[0].type, "thinking");
});

test("Mode 5: QUANTUM COLLAPSE profile, prompt, and completed-turn reasoning compression", () => {
  const profile = getProfile("quantum");
  assert.equal(profile.id, "quantum");
  assert.equal(profile.label, "QUANTUM COLLAPSE");
  assert.equal(profile.subtitle, "回合后思考压缩");
  assert.equal(profile.silent, true);
  assert.equal(profile.contextMode, "quantum");
  assert.equal(profile.hidden, undefined);

  const prompt = buildSystemPrompt("codex", "quantum");
  assert.match(prompt, /Profile: Quantum Collapse\./);
  assert.match(prompt, /Execute exactly like Ultra Max: think fully, use tools normally, and stay silent/);
  assert.match(prompt, /Only after a turn is complete, the harness compresses that completed turn's reasoning for future context/);
  assert.match(prompt, /do not shorten current reasoning or replace Pi's native compaction/);

  // Multi-turn context transformation:
  const turn1Thinking = "Analyze requirements: Step 1 checked codebase. Step 2 verified dependencies. Decision: Therefore we use approach X. Verified test passed.";
  const turn2Thinking = "Current active turn reasoning with signature";
  const messages = [
    { role: "user", content: "first question" },
    {
      role: "assistant",
      content: [
        { type: "thinking", thinking: turn1Thinking, signature: "sig1" },
        { type: "text", text: "Answer 1" },
      ],
    },
    { role: "user", content: "second question" },
    {
      role: "assistant",
      content: [
        { type: "thinking", thinking: turn2Thinking, signature: "sig2" },
        { type: "toolCall", name: "read", arguments: { path: "foo.txt" } },
      ],
    },
  ];

  const transformed = transformContextForMode("quantum", messages);

  // Turn 1 (completed turn before the last user message):
  const turn1Assistant = transformed[1];
  assert.equal(turn1Assistant.content[0].type, "text");
  assert.match(turn1Assistant.content[0].text, /^<reasoning_digest>/);
  assert.match(turn1Assistant.content[0].text, /Therefore we use approach X|Verified test passed/);
  assert.equal(turn1Assistant.content[1].type, "text");
  assert.equal(turn1Assistant.content[1].text, "Answer 1");

  // Turn 2 (active turn at index 2 and 3):
  const turn2Assistant = transformed[3];
  assert.equal(turn2Assistant.content[0].type, "thinking", "Active turn reasoning MUST remain intact");
  assert.equal(turn2Assistant.content[0].thinking, turn2Thinking);
  assert.equal(turn2Assistant.content[0].signature, "sig2");
  assert.equal(turn2Assistant.content[1].type, "toolCall");
});

test("Mode 6: GHOST PAYLOAD profile, prompt, and completed-turn reasoning removal", () => {
  const profile = getProfile("ghost");
  assert.equal(profile.id, "ghost");
  assert.equal(profile.label, "GHOST PAYLOAD");
  assert.equal(profile.subtitle, "回合后思考剔除");
  assert.equal(profile.silent, true);
  assert.equal(profile.contextMode, "ghost");
  assert.equal(profile.hidden, undefined);

  const prompt = buildSystemPrompt("codex", "ghost");
  assert.match(prompt, /Profile: Ghost Payload\./);
  assert.match(prompt, /Execute exactly like Ultra Max: think fully, use tools normally, and stay silent/);
  assert.match(prompt, /Only after a turn is complete, the harness removes that completed turn's reasoning from future context/);
  assert.match(prompt, /while retaining final answers and tool evidence/);
  assert.match(prompt, /do not reduce current reasoning or replace Pi's native compaction/);

  // Multi-turn context transformation:
  const turn1Thinking = "Turn 1 massive reasoning blocks 12345";
  const turn2Thinking = "Active turn reasoning blocks 67890";
  const messages = [
    { role: "user", content: "first question" },
    {
      role: "assistant",
      content: [
        { type: "thinking", thinking: turn1Thinking, signature: "sig1" },
        { type: "text", text: "Answer 1" },
      ],
    },
    { role: "toolResult", content: [{ type: "text", text: "tool result 1" }] },
    { role: "user", content: "second question" },
    {
      role: "assistant",
      content: [
        { type: "thinking", thinking: turn2Thinking, signature: "sig2" },
        { type: "text", text: "Answer 2" },
      ],
    },
  ];

  const transformed = transformContextForMode("ghost", messages);

  // Turn 1 (completed turn): thinking block completely removed, text and toolResult retained
  assert.deepEqual(transformed[1].content, [{ type: "text", text: "Answer 1" }]);
  assert.deepEqual(transformed[2].content, [{ type: "text", text: "tool result 1" }]);

  // Turn 2 (active turn): thinking block retained byte-for-byte
  assert.equal(transformed[4].content[0].type, "thinking");
  assert.equal(transformed[4].content[0].thinking, turn2Thinking);
  assert.equal(transformed[4].content[0].signature, "sig2");
});

test("Single-turn interaction (first turn): Quantum and Ghost do not strip active reasoning", () => {
  const singleTurn = [
    { role: "user", content: "hello" },
    {
      role: "assistant",
      content: [
        { type: "thinking", thinking: "first turn thinking", signature: "sig" },
        { type: "toolCall", name: "find" },
      ],
    },
  ];

  const quantumSingle = transformContextForMode("quantum", singleTurn);
  assert.equal(quantumSingle[1].content[0].type, "thinking");
  assert.equal(quantumSingle[1].content[0].thinking, "first turn thinking");

  const ghostSingle = transformContextForMode("ghost", singleTurn);
  assert.equal(ghostSingle[1].content[0].type, "thinking");
  assert.equal(ghostSingle[1].content[0].thinking, "first turn thinking");
});

test("Auto router / Light route compatibility with profiles", () => {
  // When light routing triggers (isolated first turn greeting), light prompt is used
  const lightPrompt = buildSystemPrompt("codex", "ultra", "light");
  assert.match(lightPrompt, /isolated first-turn greeting/);
  assert.ok(lightPrompt.length < 300);

  // Normal turn uses the profile prompt
  const fullPrompt = buildSystemPrompt("codex", "ultra", "full");
  assert.match(fullPrompt, /Profile: Ultra Max\./);
});
