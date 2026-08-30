import assert from "node:assert/strict";
import test from "node:test";

import {
  compactThinkingText,
  sanitizeAssistantReasoningLeak,
  stripInternalReasoningMarkersFromText,
  transformContextForMode,
} from "../resources/pi-extensions/context-modes.ts";

function sampleMessages() {
  const longReasoning = [
    "Inspect the repository and identify the relevant implementation before editing.",
    ...Array.from({ length: 20 }, (_, index) => `Exploration branch ${index + 1} considered a non-critical alternative with repeated detail.`),
    "Root cause verified: the old mode changed completed reasoning at the wrong lifecycle boundary.",
    "Therefore the result should preserve current-turn reasoning and process it only after completion.",
  ].join("\n");

  return [
    { role: "user", content: "first task" },
    {
      role: "assistant",
      content: [
        { type: "thinking", thinking: longReasoning, signature: "old-signature" },
        { type: "text", text: "first final result" },
      ],
    },
    { role: "toolResult", content: [{ type: "text", text: "old evidence" }] },
    { role: "user", content: "current task" },
    {
      role: "assistant",
      content: [
        { type: "thinking", thinking: "current signed reasoning", signature: "active-signature" },
        { type: "toolCall", name: "read" },
      ],
    },
  ];
}

test("Quantum creates a bounded digest only for completed turns", () => {
  const original = sampleMessages();
  const transformed = transformContextForMode("quantum", original);
  const oldContent = transformed[1].content;

  assert.equal(oldContent[0].type, "text");
  assert.match(oldContent[0].text, /^<reasoning_digest>/);
  assert.match(oldContent[0].text, /Root cause verified|Therefore the result/);
  assert.ok(oldContent[0].text.length < original[1].content[0].thinking.length);
  assert.deepEqual(oldContent[1], { type: "text", text: "first final result" });
  assert.deepEqual(transformed[4], original[4], "active signed tool loop must stay byte-for-byte equivalent");
});

test("Ghost removes completed reasoning but preserves current-turn reasoning", () => {
  const original = sampleMessages();
  const transformed = transformContextForMode("ghost", original);

  assert.deepEqual(transformed[1].content, [{ type: "text", text: "first final result" }]);
  assert.deepEqual(transformed[4], original[4]);
});

test("Ghost never emits an empty assistant content array", () => {
  const transformed = transformContextForMode("ghost", [
    { role: "user", content: "old" },
    { role: "assistant", content: [{ type: "thinking", thinking: "thinking only" }] },
    { role: "user", content: "current" },
  ]);
  assert.deepEqual(transformed[1].content, [{
    type: "text",
    text: "<reasoning_removed>Completed reasoning was removed from future context.</reasoning_removed>",
  }]);
});

test("standard and Ultra contexts do not post-process reasoning", () => {
  const original = sampleMessages();
  assert.equal(transformContextForMode("standard", original), original);
  assert.equal(transformContextForMode("ultra", original), original);
});

test("thinking compressor is local, deterministic, and bounded", () => {
  const source = "Start.\n" + "Repeated exploration without a decision. ".repeat(80) + "Result verified and ready.";
  const first = compactThinkingText(source, 180);
  const second = compactThinkingText(source, 180);
  assert.equal(first, second);
  assert.ok(first.length <= 180);
  assert.match(first, /Start/);
  assert.match(first, /Result verified/);
});

test("completed internal digest tags are removed while the final answer remains", () => {
  const leaked = "<reasoning_digest>private compressed reasoning</reasoning_digest>T4:final answer";
  assert.equal(stripInternalReasoningMarkersFromText(leaked), "T4:final answer");
  assert.equal(
    stripInternalReasoningMarkersFromText("prefix<reasoning_digest>one</reasoning_digest><reasoning_removed>two</reasoning_removed>final"),
    "prefixfinal",
  );
});

test("unclosed internal digest tags cannot leak their payload", () => {
  assert.equal(stripInternalReasoningMarkersFromText("safe prefix<reasoning_digest>private and unclosed"), "safe prefix");
});

test("assistant message sanitizer removes leaked digest blocks before persistence", () => {
  const original = {
    role: "assistant",
    content: [
      { type: "thinking", thinking: "current reasoning", signature: "valid" },
      { type: "text", text: "<reasoning_digest>private</reasoning_digest>FINAL" },
    ],
  };
  assert.deepEqual(sanitizeAssistantReasoningLeak(original), {
    ...original,
    content: [
      original.content[0],
      { type: "text", text: "FINAL" },
    ],
  });
});
