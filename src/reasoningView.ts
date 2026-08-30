import { compactThinkingText, EMPTY_REASONING_DIGEST } from "../resources/pi-extensions/reasoning-context-core.ts";
import { textFromContent } from "./messageUtils.ts";
import type { AgentMessage, ContentBlock, ProfileId } from "./types.ts";

export interface ConversationEntry {
  message: AgentMessage;
  thinkingOnly: boolean;
  contextSettled: boolean;
}

export interface ReasoningDisposition {
  kind: "compressed" | "deleted";
  digests: string[];
}

export function thinkingBlocksFromContent(content: AgentMessage["content"] | unknown) {
  if (!Array.isArray(content)) return [];
  return content
    .filter((block): block is ContentBlock => Boolean(block) && typeof block === "object" && block.type === "thinking")
    .map((block) => String(block.thinking || ""))
    .filter(Boolean);
}

function hasToolCall(content: AgentMessage["content"] | unknown) {
  return Array.isArray(content) && content.some((block) => block?.type === "toolCall");
}

export function reasoningDispositionForMessage(
  content: AgentMessage["content"] | unknown,
  profile: ProfileId | undefined,
  completed: boolean,
): ReasoningDisposition | null {
  const thinkingBlocks = thinkingBlocksFromContent(content);
  if (!completed || !thinkingBlocks.length) return null;
  if (profile === "ghost") return { kind: "deleted", digests: [] };
  if (profile === "quantum") {
    return {
      kind: "compressed",
      digests: thinkingBlocks.map((thinking) => compactThinkingText(thinking) || EMPTY_REASONING_DIGEST),
    };
  }
  return null;
}

export function buildConversationEntries(messages: AgentMessage[], silent: boolean, activeRun = false): ConversationEntry[] {
  const conversation = messages.filter((message) => message.role === "user" || message.role === "assistant");
  const latestUserIndex = activeRun
    ? conversation.reduce((last, message, index) => message.role === "user" ? index : last, -1)
    : conversation.length;
  const contextSettledAt = (index: number) => !activeRun || index < latestUserIndex;
  if (!silent) return conversation.map((message, index) => ({ message, thinkingOnly: false, contextSettled: contextSettledAt(index) }));

  const entries: ConversationEntry[] = [];
  let assistantTurn: Array<{ message: AgentMessage; index: number }> = [];
  const flushAssistantTurn = () => {
    if (!assistantTurn.length) return;
    const final = [...assistantTurn].reverse().find(({ message }) =>
      textFromContent(message.content).trim() && !hasToolCall(message.content))
      || [...assistantTurn].reverse().find(({ message }) => textFromContent(message.content).trim())
      || assistantTurn.at(-1);
    for (const entry of assistantTurn) {
      const thinkingOnly = entry !== final;
      if (!thinkingOnly || thinkingBlocksFromContent(entry.message.content).length) {
        entries.push({ message: entry.message, thinkingOnly, contextSettled: contextSettledAt(entry.index) });
      }
    }
    assistantTurn = [];
  };

  for (let index = 0; index < conversation.length; index += 1) {
    const message = conversation[index];
    if (message.role === "user") {
      flushAssistantTurn();
      entries.push({ message, thinkingOnly: false, contextSettled: contextSettledAt(index) });
    } else {
      assistantTurn.push({ message, index });
    }
  }
  flushAssistantTurn();
  return entries;
}
