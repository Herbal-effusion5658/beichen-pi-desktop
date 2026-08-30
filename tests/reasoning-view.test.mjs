import assert from "node:assert/strict";
import test from "node:test";

import {
  buildConversationEntries,
  reasoningDispositionForMessage,
  thinkingBlocksFromContent,
} from "../src/reasoningView.ts";

test("Quantum UI shows the exact digest produced by the shared context compressor", () => {
  const thinking = "Start.\n" + "Explore repeated alternatives. ".repeat(60) + "Result verified.";
  const disposition = reasoningDispositionForMessage([{ type: "thinking", thinking }], "quantum", true);
  assert.equal(disposition.kind, "compressed");
  assert.ok(disposition.digests[0].length <= 480);
  assert.match(disposition.digests[0], /Start/);
  assert.match(disposition.digests[0], /Result verified/);
});

test("Ghost UI marks completed thinking deleted while live thinking remains unmarked", () => {
  const content = [{ type: "thinking", thinking: "full reasoning" }];
  assert.deepEqual(reasoningDispositionForMessage(content, "ghost", true), { kind: "deleted", digests: [] });
  assert.equal(reasoningDispositionForMessage(content, "ghost", false), null);
});

test("silent conversation keeps every assistant thinking block but only the final answer text", () => {
  const messages = [
    { role: "user", content: "task" },
    { role: "assistant", content: [{ type: "thinking", thinking: "step one" }, { type: "text", text: "progress" }, { type: "toolCall", name: "read" }] },
    { role: "assistant", content: [{ type: "thinking", thinking: "step two" }, { type: "text", text: "final" }] },
  ];
  const entries = buildConversationEntries(messages, true);
  assert.deepEqual(entries.map((entry) => [entry.message.role, entry.thinkingOnly, entry.contextSettled]), [
    ["user", false, true],
    ["assistant", true, true],
    ["assistant", false, true],
  ]);
  assert.deepEqual(thinkingBlocksFromContent(entries[1].message.content), ["step one"]);
});

test("assistant messages in the active tool loop are not marked compressed or deleted yet", () => {
  const entries = buildConversationEntries([
    { role: "user", content: "old" },
    { role: "assistant", content: [{ type: "thinking", thinking: "old thinking" }, { type: "text", text: "old final" }] },
    { role: "user", content: "active" },
    { role: "assistant", content: [{ type: "thinking", thinking: "active thinking" }, { type: "toolCall", name: "read" }] },
  ], true, true);
  assert.equal(entries[1].contextSettled, true);
  assert.equal(entries[3].contextSettled, false);
});
