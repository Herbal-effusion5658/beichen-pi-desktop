import assert from "node:assert/strict";
import test from "node:test";

import { textFromContent } from "../src/messageUtils.ts";

test("message text extraction tolerates malformed extension payloads", () => {
  assert.equal(textFromContent("plain"), "plain");
  assert.equal(textFromContent([{ type: "text", text: "one" }, { type: "thinking", thinking: "hidden" }, { type: "text", text: "two" }]), "onetwo");
  assert.equal(textFromContent(undefined), "");
  assert.equal(textFromContent(null), "");
  assert.equal(textFromContent({ type: "text", text: "not an array" }), "");
  assert.equal(textFromContent([null, { type: "text", text: 42 }]), "42");
});
