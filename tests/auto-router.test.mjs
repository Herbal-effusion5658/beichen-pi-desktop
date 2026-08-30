import assert from "node:assert/strict";
import test from "node:test";
import { normalizeGreeting, shouldUseLightRoute } from "../src/autoRouter.ts";

const base = {
  surface: "codex",
  currentRoute: "full",
  message: "你好",
  messageCount: 0,
  hasAttachments: false,
  isStreaming: false,
};

test("normalizes harmless greeting punctuation only", () => {
  assert.equal(normalizeGreeting("  你好！ "), "你好");
  assert.equal(normalizeGreeting("HELLO..."), "hello");
});

test("routes only an isolated first-turn greeting", () => {
  for (const message of ["你好", "您好！", "Hi", "hello...", "嗨"]) {
    assert.equal(shouldUseLightRoute({ ...base, message }), true, message);
  }
});

test("never light-routes ambiguous or capable work", () => {
  const blocked = [
    { message: "你好，帮我修改代码" },
    { message: "hello fix this bug" },
    { message: "/skill:remotion-create" },
    { messageCount: 1 },
    { hasAttachments: true },
    { isStreaming: true },
    { surface: "chatgpt" },
    { currentRoute: "light" },
  ];
  for (const patch of blocked) {
    assert.equal(shouldUseLightRoute({ ...base, ...patch }), false, JSON.stringify(patch));
  }
});
