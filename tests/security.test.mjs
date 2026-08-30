import assert from "node:assert/strict";
import test from "node:test";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { isSameDocumentNavigation, safeExternalUrl } = require("../electron/security.cjs");

test("external URL policy allows only intentional browser and mail protocols", () => {
  assert.equal(safeExternalUrl("https://example.com/docs"), "https://example.com/docs");
  assert.equal(safeExternalUrl("http://127.0.0.1:8080/callback"), "http://127.0.0.1:8080/callback");
  assert.equal(safeExternalUrl("mailto:test@example.com"), "mailto:test@example.com");
  for (const value of [
    "javascript:alert(1)",
    "file:///C:/Windows/System32/calc.exe",
    "data:text/html,hello",
    "custom-protocol://payload",
    "https://user:password@example.com/",
    "not a url",
  ]) {
    assert.equal(safeExternalUrl(value), null, `${value} must be denied`);
  }
});

test("same-document navigation permits hash changes without opening a browser", () => {
  assert.equal(isSameDocumentNavigation("file:///app/index.html#one", "file:///app/index.html#two"), true);
  assert.equal(isSameDocumentNavigation("https://example.com/a", "https://example.com/b"), false);
});
