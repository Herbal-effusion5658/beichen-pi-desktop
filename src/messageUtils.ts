import type { AgentMessage } from "./types";

export function textFromContent(content: AgentMessage["content"] | unknown): string {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  return content
    .filter((block) => block && typeof block === "object" && (block as { type?: string }).type === "text")
    .map((block) => String((block as { text?: unknown }).text || ""))
    .join("");
}
