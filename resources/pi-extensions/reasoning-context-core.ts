export const REASONING_DIGEST_LIMIT = 480;
export const EMPTY_REASONING_DIGEST = "Reasoning completed; rely on the retained final answer and tool evidence.";

const DECISION_SIGNAL = /(?:therefore|thus|because|decision|decided|result|verified|failed|passed|root cause|next|must|should|因此|所以|决定|结论|结果|验证|通过|失败|根因|下一步|必须|应该)/i;

function clipMiddle(value: string, limit: number) {
  if (value.length <= limit) return value;
  const headLength = Math.max(1, Math.floor(limit * 0.68));
  const tailLength = Math.max(1, limit - headLength - 3);
  return `${value.slice(0, headLength).trimEnd()} … ${value.slice(-tailLength).trimStart()}`;
}

export function compactThinkingText(input: unknown, limit = REASONING_DIGEST_LIMIT) {
  if (typeof input !== "string") return "";
  const normalized = input
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  if (!normalized || normalized.length <= limit) return normalized;

  const segments = normalized
    .split(/\n+/)
    .flatMap((line) => line.match(/[^。！？!?]+[。！？!?]?/g) || [line])
    .map((segment) => segment.trim())
    .filter(Boolean);
  const selected = [
    ...segments.slice(0, 2),
    ...segments.filter((segment) => DECISION_SIGNAL.test(segment)).slice(0, 5),
    ...segments.slice(-2),
  ].filter((segment, index, all) => all.indexOf(segment) === index);

  return clipMiddle(selected.join(" ") || normalized, limit);
}
