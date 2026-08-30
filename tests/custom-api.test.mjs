import assert from "node:assert/strict";
import test from "node:test";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  buildProviderConfig,
  envNameForProvider,
  mergeManagedProviders,
  normalizeCustomApiInput,
} = require("../electron/custom-api.cjs");

function validInput(overrides = {}) {
  return {
    name: "Local Model",
    baseUrl: "http://127.0.0.1:11434/v1/",
    api: "openai-completions",
    apiKey: "super-secret",
    modelId: "qwen-test",
    modelName: "Qwen Test",
    contextWindow: 128000,
    maxTokens: 16384,
    reasoning: true,
    imageInput: true,
    extendedThinking: true,
    thinkingFormat: "qwen",
    supportsDeveloperRole: false,
    authHeader: false,
    useApiKey: true,
    ...overrides,
  };
}

test("custom API input is normalized and bounded", () => {
  const config = normalizeCustomApiInput(validInput(), { providerId: "beichen-custom-test123" });
  assert.equal(config.baseUrl, "http://127.0.0.1:11434/v1");
  assert.equal(config.providerId, "beichen-custom-test123");
  assert.equal(config.contextWindow, 128000);
  assert.throws(() => normalizeCustomApiInput(validInput({ baseUrl: "file:///tmp/model" })), /HTTP/);
  assert.throws(() => normalizeCustomApiInput(validInput({ baseUrl: "https://secret@example.com/v1" })), /账号或密钥/);
  assert.throws(() => normalizeCustomApiInput(validInput({ maxTokens: 200000 })), /不能超过上下文/);
});

test("models.json provider uses an environment reference and never stores the API key", () => {
  const entry = normalizeCustomApiInput(validInput(), { providerId: "beichen-custom-test123" });
  const provider = buildProviderConfig(entry);
  const serialized = JSON.stringify(provider);
  assert.equal(provider.apiKey, `$${envNameForProvider(entry.providerId)}`);
  assert.doesNotMatch(serialized, /super-secret/);
  assert.equal(provider.models[0].reasoning, true);
  assert.deepEqual(provider.models[0].input, ["text", "image"]);
  assert.equal(provider.models[0].thinkingLevelMap.max, "max");
  assert.equal(provider.compat.thinkingFormat, "qwen");
});

test("managed custom providers merge without touching user-owned providers", () => {
  const entry = normalizeCustomApiInput(validInput(), { providerId: "beichen-custom-current" });
  const merged = mergeManagedProviders(
    { providers: { user_proxy: { baseUrl: "https://user.example/v1" }, "beichen-custom-old": { baseUrl: "https://old.example" } } },
    [entry],
    ["beichen-custom-old", "beichen-custom-current"],
  );
  assert.equal(merged.providers.user_proxy.baseUrl, "https://user.example/v1");
  assert.equal(merged.providers["beichen-custom-old"], undefined);
  assert.equal(merged.providers["beichen-custom-current"].models[0].id, "qwen-test");
});

test("keyless local APIs remain configurable without embedding a credential", () => {
  const entry = normalizeCustomApiInput(validInput({ useApiKey: false, apiKey: "" }), { providerId: "beichen-custom-local" });
  const provider = buildProviderConfig(entry);
  assert.match(provider.apiKey, /^\$BEICHEN_CUSTOM_API_/);
});
