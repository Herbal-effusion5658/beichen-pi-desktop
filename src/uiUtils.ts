export function tokenSegmentWidth(value: number, total: number, minimumVisiblePercent = 1.2) {
  if (!Number.isFinite(value) || !Number.isFinite(total) || value <= 0 || total <= 0) return 0;
  return Math.max(minimumVisiblePercent, (value / total) * 100);
}

export function accumulateReportedTokens(current: number, next: number) {
  const safeCurrent = Number.isFinite(current) && current > 0 ? current : 0;
  const safeNext = Number.isFinite(next) && next > 0 ? next : 0;
  return safeCurrent + safeNext;
}

export function workspaceLabel(cwd: string) {
  if (!cwd) return "—";
  const withoutTrailingSeparators = cwd.replace(/[\\/]+$/, "");
  return withoutTrailingSeparators.split(/[\\/]/).filter(Boolean).at(-1) || cwd;
}

export function shouldSubmitComposer(input: {
  key: string;
  shiftKey: boolean;
  isComposing?: boolean;
  keyCode?: number;
}) {
  return input.key === "Enter" && !input.shiftKey && !input.isComposing && input.keyCode !== 229;
}

export function shouldResetBackendBeforeNewSession(input: {
  routeTier?: string;
  restorePending: boolean;
  isStreaming: boolean;
}) {
  return input.routeTier !== "full" || input.restorePending || input.isStreaming;
}

export function isNearScrollBottom(input: {
  scrollHeight: number;
  scrollTop: number;
  clientHeight: number;
}, threshold = 96) {
  return input.scrollHeight - input.scrollTop - input.clientHeight <= threshold;
}
