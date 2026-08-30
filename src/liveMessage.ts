import type { AgentMessage, ContentBlock, MessageUsage } from "./types";

export interface AssistantStreamEvent {
  type?: string;
  contentIndex?: number;
  delta?: string;
  content?: string;
  id?: string;
  toolName?: string;
  toolCall?: ContentBlock;
  [key: string]: unknown;
}

function cloneContent(content: AgentMessage["content"] | undefined): ContentBlock[] {
  if (typeof content === "string") return [{ type: "text", text: content }];
  if (!Array.isArray(content)) return [];
  return content.map((block) => ({ ...block }));
}

function eventIndex(event: AssistantStreamEvent, content: ContentBlock[]) {
  return Number.isInteger(event.contentIndex) && Number(event.contentIndex) >= 0
    ? Number(event.contentIndex)
    : content.length;
}

function setBlock(content: ContentBlock[], index: number, block: ContentBlock) {
  while (content.length <= index) content.push({ type: "pending" });
  content[index] = block;
}

export function applyAssistantStreamEvent(
  current: AgentMessage | null,
  event: AssistantStreamEvent | undefined,
  usage?: MessageUsage,
): AgentMessage {
  const base: AgentMessage = current?.role === "assistant"
    ? current
    : { role: "assistant", content: [], timestamp: Date.now() };
  if (!event?.type) return usage ? { ...base, usage } : base;

  const content = cloneContent(base.content);
  const index = eventIndex(event, content);
  const existing = content[index];
  const delta = typeof event.delta === "string" ? event.delta : "";

  switch (event.type) {
    case "thinking_start":
      setBlock(content, index, { type: "thinking", thinking: "" });
      break;
    case "thinking_delta":
      setBlock(content, index, {
        ...(existing?.type === "thinking" ? existing : {}),
        type: "thinking",
        thinking: `${existing?.type === "thinking" ? String(existing.thinking || "") : ""}${delta}`,
      });
      break;
    case "thinking_end":
      setBlock(content, index, {
        ...(existing?.type === "thinking" ? existing : {}),
        type: "thinking",
        thinking: typeof event.content === "string" ? event.content : String(existing?.thinking || ""),
      });
      break;
    case "text_start":
      setBlock(content, index, { type: "text", text: "" });
      break;
    case "text_delta":
      setBlock(content, index, {
        ...(existing?.type === "text" ? existing : {}),
        type: "text",
        text: `${existing?.type === "text" ? String(existing.text || "") : ""}${delta}`,
      });
      break;
    case "text_end":
      setBlock(content, index, {
        ...(existing?.type === "text" ? existing : {}),
        type: "text",
        text: typeof event.content === "string" ? event.content : String(existing?.text || ""),
      });
      break;
    case "toolcall_start":
      setBlock(content, index, {
        type: "toolCall",
        id: String(event.id || ""),
        name: String(event.toolName || "tool"),
        arguments: {},
        argumentsText: "",
      });
      break;
    case "toolcall_delta": {
      const argumentsText = `${existing?.type === "toolCall" ? String(existing.argumentsText || "") : ""}${delta}`;
      let args = existing?.type === "toolCall" ? existing.arguments : {};
      try {
        args = JSON.parse(argumentsText);
      } catch {
        // Keep the last complete object while arguments are still streaming.
      }
      setBlock(content, index, {
        ...(existing?.type === "toolCall" ? existing : {}),
        type: "toolCall",
        arguments: args,
        argumentsText,
      });
      break;
    }
    case "toolcall_end":
      setBlock(content, index, event.toolCall ? { ...event.toolCall, type: "toolCall" } : {
        ...(existing?.type === "toolCall" ? existing : {}),
        type: "toolCall",
      });
      break;
    default:
      return usage ? { ...base, usage } : base;
  }

  return { ...base, content, ...(usage ? { usage } : {}) };
}
