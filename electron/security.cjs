"use strict";

const SAFE_EXTERNAL_PROTOCOLS = new Set(["http:", "https:", "mailto:"]);

function safeExternalUrl(value) {
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    const parsed = new URL(value);
    if (!SAFE_EXTERNAL_PROTOCOLS.has(parsed.protocol)) return null;
    if ((parsed.protocol === "http:" || parsed.protocol === "https:") && (parsed.username || parsed.password)) return null;
    return parsed.href;
  } catch {
    return null;
  }
}

function isSameDocumentNavigation(currentUrl, targetUrl) {
  try {
    const current = new URL(currentUrl);
    const target = new URL(targetUrl);
    current.hash = "";
    target.hash = "";
    return current.href === target.href;
  } catch {
    return false;
  }
}

module.exports = {
  SAFE_EXTERNAL_PROTOCOLS,
  safeExternalUrl,
  isSameDocumentNavigation,
};
