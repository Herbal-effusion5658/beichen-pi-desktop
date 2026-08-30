import assert from "node:assert/strict";
import test from "node:test";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { comparablePath, isPathInside, pathsEqual } = require("../electron/runtime-utils.cjs");

test("Windows workspace comparison is case-insensitive and separator-normalized", () => {
  assert.equal(pathsEqual("c:\\Work\\Pi", "C:\\work\\pi\\", "win32"), true);
  assert.equal(comparablePath("c:\\Work\\Pi\\", "win32"), "c:\\work\\pi");
  assert.equal(pathsEqual("C:\\Work\\Pi", "C:\\Work\\Other", "win32"), false);
});

test("POSIX workspace comparison remains case-sensitive", () => {
  assert.equal(pathsEqual("/work/Pi", "/work/pi", "linux"), false);
  assert.equal(pathsEqual("/work/pi/", "/work/pi", "linux"), true);
});

test("generated session cleanup accepts only descendants of the session root", () => {
  assert.equal(isPathInside("C:\\Agent\\sessions", "c:\\agent\\sessions\\project\\test.jsonl", "win32"), true);
  assert.equal(isPathInside("C:\\Agent\\sessions", "C:\\Agent\\auth.json", "win32"), false);
  assert.equal(isPathInside("/agent/sessions", "/agent/sessions/project/test.jsonl", "linux"), true);
  assert.equal(isPathInside("/agent/sessions", "/agent/settings.json", "linux"), false);
});
