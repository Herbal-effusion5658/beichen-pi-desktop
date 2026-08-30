import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { compactThinkingText, EMPTY_REASONING_DIGEST } from "./reasoning-context-core.ts";

export { compactThinkingText } from "./reasoning-context-core.ts";

type ContentBlock = { type?: string; [key: string]: unknown };
type MessageLike = { role?: string; content?: unknown; [key: string]: unknown };

const COMPLETE_INTERNAL_REASONING_BLOCK = /<(reasoning_digest|reasoning_removed)(?:\s[^>]*)?>[\s\S]*?<\/\1>/gi;
const OPEN_INTERNAL_REASONING_BLOCK = /<(reasoning_digest|reasoning_removed)(?:\s[^>]*)?>/i;
const ORPHAN_INTERNAL_REASONING_CLOSE = /<\/(reasoning_digest|reasoning_removed)>/gi;

export function stripInternalReasoningMarkersFromText(input: unknown) {
  if (typeof input !== "string" || !input) return typeof input === "string" ? input : "";
  let sanitized = input.replace(COMPLETE_INTERNAL_REASONING_BLOCK, "");
  const unclosedStart = sanitized.search(OPEN_INTERNAL_REASONING_BLOCK);
  if (unclosedStart >= 0) sanitized = sanitized.slice(0, unclosedStart);
  return sanitized.replace(ORPHAN_INTERNAL_REASONING_CLOSE, "").trimStart();
}

export function sanitizeAssistantReasoningLeak(message: MessageLike): MessageLike {
  if (message.role !== "assistant" || !Array.isArray(message.content)) return message;
  let changed = false;
  const content = (message.content as ContentBlock[]).flatMap((block) => {
    if (block?.type !== "text" || typeof block.text !== "string") return [block];
    const text = stripInternalReasoningMarkersFromText(block.text);
    if (text === block.text) return [block];
    changed = true;
    return text ? [{ ...block, text }] : [];
  });
  if (!changed) return message;
  if (!content.some((block) => block?.type === "text" && String(block.text || "").trim())) {
    content.push({ type: "text", text: "Completed." });
  }
  return { ...message, content };
}

function withoutThinking(message: MessageLike): MessageLike {
  const sanitizedMessage = sanitizeAssistantReasoningLeak(message);
  if (sanitizedMessage.role !== "assistant" || !Array.isArray(sanitizedMessage.content)) return sanitizedMessage;

  const original = sanitizedMessage.content as ContentBlock[];
  const content = original.filter((block) => block?.type !== "thinking");
  const removedThinking = content.length !== original.length;

  return {
    ...sanitizedMessage,
    content: removedThinking && content.length === 0
      ? [{ type: "text", text: "<reasoning_removed>Completed reasoning was removed from future context.</reasoning_removed>" }]
      : content,
  };
}

function withCompressedThinking(message: MessageLike): MessageLike {
  const sanitizedMessage = sanitizeAssistantReasoningLeak(message);
  if (sanitizedMessage.role !== "assistant" || !Array.isArray(sanitizedMessage.content)) return sanitizedMessage;

  return {
    ...sanitizedMessage,
    content: (sanitizedMessage.content as ContentBlock[]).flatMap((block) => {
      if (block?.type !== "thinking") return [block];
      const digest = compactThinkingText(block.thinking);
      return [{
        type: "text",
        text: `<reasoning_digest>${digest || EMPTY_REASONING_DIGEST}</reasoning_digest>`,
      }];
    }),
  };
}

export function transformContextForMode(mode: string | undefined, messages: MessageLike[]) {
  if (mode !== "ghost" && mode !== "quantum") return messages;

  const userIndexes = messages
    .map((message, index) => (message.role === "user" ? index : -1))
    .filter((index) => index >= 0);
  if (userIndexes.length === 0) return messages;

  // The latest user turn may still be inside a signed reasoning/tool loop.
  // Only turns before it have completed and are safe to post-process.
  const activeTurnStart = userIndexes[userIndexes.length - 1];
  return messages.map((message, index) => {
    if (index >= activeTurnStart) return message;
    return mode === "quantum" ? withCompressedThinking(message) : withoutThinking(message);
  });
}

export default function contextModes(pi: ExtensionAPI) {
  pi.on("message_end", async (event) => {
    const mode = process.env.BEICHEN_CONTEXT_MODE;
    if (mode !== "ghost" && mode !== "quantum") return;
    const message = sanitizeAssistantReasoningLeak(event.message as MessageLike);
    if (message === event.message) return;
    return { message: message as typeof event.message };
  });

  pi.on("context", async (event) => {
    const mode = process.env.BEICHEN_CONTEXT_MODE;
    if (mode !== "ghost" && mode !== "quantum") return;

    return {
      messages: transformContextForMode(mode, event.messages as MessageLike[]),
    };
  });
}
