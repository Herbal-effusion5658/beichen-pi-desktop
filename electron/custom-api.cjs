"use strict";

const CUSTOM_PROVIDER_PREFIX = "beichen-custom-";
const API_TYPES = new Set([
  "openai-completions",
  "openai-responses",
  "anthropic-messages",
  "google-generative-ai",
]);
const THINKING_FORMATS = new Set(["auto", "openai", "openrouter", "deepseek", "qwen"]);

function requiredText(value, label, maxLength) {
  const text = String(value || "").trim();
  if (!text) throw new Error(`${label}不能为空`);
  if (text.length > maxLength) throw new Error(`${label}不能超过 ${maxLength} 个字符`);
  return text;
}

function boundedInteger(value, fallback, min, max, label) {
  const number = value === "" || value == null ? fallback : Number(value);
  if (!Number.isSafeInteger(number) || number < min || number > max) {
    throw new Error(`${label}必须是 ${min.toLocaleString()}–${max.toLocaleString()} 之间的整数`);
  }
  return number;
}

function normalizeBaseUrl(value) {
  const raw = requiredText(value, "API 地址", 2048);
  let parsed;
  try {
    parsed = new URL(raw);
  } catch {
    throw new Error("API 地址必须是完整的 http:// 或 https:// URL");
  }
  if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error("API 地址只支持 HTTP 或 HTTPS");
  if (parsed.username || parsed.password) throw new Error("请勿把账号或密钥写进 API 地址");
  return parsed.toString().replace(/\/+$/, "");
}

function normalizeCustomApiInput(input, options = {}) {
  if (!input || typeof input !== "object") throw new Error("自定义 API 配置无效");
  const api = String(input.api || "openai-completions");
  if (!API_TYPES.has(api)) throw new Error("不支持的 API 协议");
  const thinkingFormat = String(input.thinkingFormat || "auto");
  if (!THINKING_FORMATS.has(thinkingFormat)) throw new Error("不支持的思考协议");

  const contextWindow = boundedInteger(input.contextWindow, 128000, 1024, 10_000_000, "上下文上限");
  const maxTokens = boundedInteger(input.maxTokens, 16384, 256, 2_000_000, "最大输出 Token");
  if (maxTokens > contextWindow) throw new Error("最大输出 Token 不能超过上下文上限");

  const providerId = input.providerId || options.providerId;
  if (providerId && !new RegExp(`^${CUSTOM_PROVIDER_PREFIX}[a-z0-9-]+$`).test(providerId)) {
    throw new Error("自定义服务商标识无效");
  }
  const reasoning = Boolean(input.reasoning);

  return {
    providerId,
    name: requiredText(input.name, "接入名称", 80),
    baseUrl: normalizeBaseUrl(input.baseUrl),
    api,
    modelId: requiredText(input.modelId, "模型 ID", 240),
    modelName: String(input.modelName || input.modelId || "").trim().slice(0, 120) || requiredText(input.modelId, "模型 ID", 240),
    contextWindow,
    maxTokens,
    reasoning,
    imageInput: Boolean(input.imageInput),
    extendedThinking: reasoning && Boolean(input.extendedThinking),
    thinkingFormat: reasoning ? thinkingFormat : "auto",
    supportsDeveloperRole: ["openai-completions", "openai-responses"].includes(api)
      ? Boolean(input.supportsDeveloperRole)
      : false,
    authHeader: Boolean(input.authHeader),
    useApiKey: input.useApiKey !== false,
    apiKey: typeof input.apiKey === "string" ? input.apiKey.trim() : "",
  };
}

function envNameForProvider(providerId) {
  return `BEICHEN_CUSTOM_API_${String(providerId).replace(/[^a-zA-Z0-9]/g, "_").toUpperCase()}`;
}

function buildProviderConfig(entry) {
  const compat = {};
  if (["openai-completions", "openai-responses"].includes(entry.api)) {
    compat.supportsDeveloperRole = Boolean(entry.supportsDeveloperRole);
    if (entry.reasoning && entry.thinkingFormat !== "auto") {
      compat.thinkingFormat = entry.thinkingFormat;
      compat.supportsReasoningEffort = true;
    }
  }

  const model = {
    id: entry.modelId,
    name: entry.modelName || entry.modelId,
    reasoning: Boolean(entry.reasoning),
    input: entry.imageInput ? ["text", "image"] : ["text"],
    contextWindow: entry.contextWindow,
    maxTokens: entry.maxTokens,
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
  };
  if (entry.reasoning && entry.extendedThinking) {
    model.thinkingLevelMap = {
      minimal: "minimal",
      low: "low",
      medium: "medium",
      high: "high",
      xhigh: "xhigh",
      max: "max",
    };
  }

  return {
    baseUrl: entry.baseUrl,
    api: entry.api,
    apiKey: `$${envNameForProvider(entry.providerId)}`,
    ...(entry.authHeader ? { authHeader: true } : {}),
    ...(Object.keys(compat).length ? { compat } : {}),
    models: [model],
  };
}

function mergeManagedProviders(modelsConfig, entries, managedProviderIds = []) {
  const source = modelsConfig && typeof modelsConfig === "object" && !Array.isArray(modelsConfig) ? modelsConfig : {};
  const existingProviders = source.providers && typeof source.providers === "object" && !Array.isArray(source.providers)
    ? source.providers
    : {};
  const providers = { ...existingProviders };
  for (const providerId of managedProviderIds) delete providers[providerId];
  for (const entry of entries) providers[entry.providerId] = buildProviderConfig(entry);
  return { ...source, providers };
}

module.exports = {
  API_TYPES,
  CUSTOM_PROVIDER_PREFIX,
  THINKING_FORMATS,
  buildProviderConfig,
  envNameForProvider,
  mergeManagedProviders,
  normalizeCustomApiInput,
};
