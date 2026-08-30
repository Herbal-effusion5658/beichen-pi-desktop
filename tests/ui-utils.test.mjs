import assert from "node:assert/strict";
import test from "node:test";

import {
  accumulateReportedTokens,
  isNearScrollBottom,
  shouldResetBackendBeforeNewSession,
  shouldSubmitComposer,
  tokenSegmentWidth,
  workspaceLabel,
} from "../src/uiUtils.ts";

test("reported output tokens accumulate across a multi-tool agent run", () => {
  assert.equal(accumulateReportedTokens(0, 12), 12);
  assert.equal(accumulateReportedTokens(12, 8), 20);
  assert.equal(accumulateReportedTokens(20, Number.NaN), 20);
});

test("zero token categories render no fake segment", () => {
  assert.equal(tokenSegmentWidth(0, 100), 0);
  assert.equal(tokenSegmentWidth(-2, 100), 0);
  assert.equal(tokenSegmentWidth(1, 1000), 1.2);
  assert.equal(tokenSegmentWidth(50, 100), 50);
});

test("workspace labels handle Windows, UNC, and root paths", () => {
  assert.equal(workspaceLabel("C:\\"), "C:");
  assert.equal(workspaceLabel("C:\\Work\\Pi\\"), "Pi");
  assert.equal(workspaceLabel("\\\\server\\share\\"), "share");
  assert.equal(workspaceLabel("/"), "/");
});

test("composer Enter respects IME composition and Shift+Enter", () => {
  assert.equal(shouldSubmitComposer({ key: "Enter", shiftKey: false }), true);
  assert.equal(shouldSubmitComposer({ key: "Enter", shiftKey: true }), false);
  assert.equal(shouldSubmitComposer({ key: "Enter", shiftKey: false, isComposing: true }), false);
  assert.equal(shouldSubmitComposer({ key: "Enter", shiftKey: false, keyCode: 229 }), false);
});

test("new sessions recover a light or interrupted backend before clearing history", () => {
  assert.equal(shouldResetBackendBeforeNewSession({ routeTier: "full", restorePending: false, isStreaming: false }), false);
  assert.equal(shouldResetBackendBeforeNewSession({ routeTier: "light", restorePending: false, isStreaming: false }), true);
  assert.equal(shouldResetBackendBeforeNewSession({ routeTier: "full", restorePending: true, isStreaming: false }), true);
  assert.equal(shouldResetBackendBeforeNewSession({ routeTier: "full", restorePending: false, isStreaming: true }), true);
});

test("autoscroll follows output only while the viewport remains near the bottom", () => {
  assert.equal(isNearScrollBottom({ scrollHeight: 1000, scrollTop: 400, clientHeight: 400 }), false);
  assert.equal(isNearScrollBottom({ scrollHeight: 1000, scrollTop: 520, clientHeight: 400 }), true);
});
