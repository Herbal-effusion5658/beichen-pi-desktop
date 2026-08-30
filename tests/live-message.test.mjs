import assert from "node:assert/strict";
import test from "node:test";

import { applyAssistantStreamEvent } from "../src/liveMessage.ts";

test("assistant stream assembly exposes thinking deltas in real time", () => {
  let message = applyAssistantStreamEvent(null, { type: "thinking_start", contentIndex: 0 });
  message = applyAssistantStreamEvent(message, { type: "thinking_delta", contentIndex: 0, delta: "first " });
  message = applyAssistantStreamEvent(message, { type: "thinking_delta", contentIndex: 0, delta: "step" });
  assert.deepEqual(message.content, [{ type: "thinking", thinking: "first step" }]);
  message = applyAssistantStreamEvent(message, { type: "thinking_end", contentIndex: 0, content: "first step complete" });
  assert.equal(message.content[0].thinking, "first step complete");
});

test("assistant stream assembly keeps thinking, text, and tool calls at content indexes", () => {
  let message = applyAssistantStreamEvent(null, { type: "thinking_delta", contentIndex: 0, delta: "reason" });
  message = applyAssistantStreamEvent(message, { type: "text_delta", contentIndex: 1, delta: "answer" });
  message = applyAssistantStreamEvent(message, { type: "toolcall_start", contentIndex: 2, id: "call-1", toolName: "read" });
  message = applyAssistantStreamEvent(message, { type: "toolcall_delta", contentIndex: 2, delta: '{"path":"a.ts"}' });
  message = applyAssistantStreamEvent(message, {
    type: "toolcall_end",
    contentIndex: 2,
    toolCall: { type: "toolCall", id: "call-1", name: "read", arguments: { path: "a.ts" } },
  });
  assert.deepEqual(message.content, [
    { type: "thinking", thinking: "reason" },
    { type: "text", text: "answer" },
    { type: "toolCall", id: "call-1", name: "read", arguments: { path: "a.ts" } },
  ]);
});
