import type { SurfaceMode } from "./types";

export type RouteTier = "full" | "light";

export interface AutoRouteInput {
  surface: SurfaceMode;
  currentRoute: RouteTier;
  message: string;
  messageCount: number;
  hasAttachments: boolean;
  isStreaming: boolean;
}

const SAFE_FIRST_TURN_GREETINGS = new Set([
  "你好",
  "您好",
  "嗨",
  "哈喽",
  "hello",
  "hi",
  "hey",
]);

export function normalizeGreeting(message: string) {
  return message
    .normalize("NFKC")
    .trim()
    .toLocaleLowerCase()
    .replace(/[\s!！。,.，?？~～]+/g, "");
}

/**
 * Intentionally conservative: only an isolated greeting at the very start of
 * a fresh Codex session may use the lightweight route. Any uncertainty keeps
 * the full prompt, tools, skills, context files, and reasoning profile.
 */
export function shouldUseLightRoute(input: AutoRouteInput) {
  if (input.surface !== "codex") return false;
  if (input.currentRoute !== "full") return false;
  if (input.messageCount !== 0 || input.hasAttachments || input.isStreaming) return false;
  return SAFE_FIRST_TURN_GREETINGS.has(normalizeGreeting(input.message));
}
