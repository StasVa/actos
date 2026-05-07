/** Helpers for delegated action expected return date display. */

export type ReturnState = "overdue" | "today" | "tomorrow" | "soon" | "later" | "none";

export type ReturnInfo = {
  state: ReturnState;
  /** Days from today; negative = past. Undefined when no date. */
  diffDays?: number;
  /** Pill text (e.g. "return 2026-04-30 · 7d ago"). */
  text: string;
  /** Tooltip content. */
  tooltip: string;
  /** CSS color var for text. */
  color: string;
  /** CSS background (color-mix tint or "transparent"). */
  background: string;
  /** Whether to render as a pill (padding/radius). */
  pill: boolean;
  /** Italic style (for "no return date"). */
  italic: boolean;
};

function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function diffInDays(targetISO: string): number {
  const t = new Date(todayISO() + "T00:00:00").getTime();
  const r = new Date(targetISO + "T00:00:00").getTime();
  return Math.round((r - t) / 86400000);
}

export function getReturnInfo(expectedReturnDate?: string): ReturnInfo {
  if (!expectedReturnDate) {
    return {
      state: "none",
      text: "no return date",
      tooltip: "No expected return date set",
      color: "hsl(var(--text-tertiary))",
      background: "transparent",
      pill: false,
      italic: true,
    };
  }
  const diff = diffInDays(expectedReturnDate);
  if (diff < 0) {
    const n = Math.abs(diff);
    return {
      state: "overdue",
      diffDays: diff,
      text: `return ${expectedReturnDate} · ${n}d ago`,
      tooltip: `Overdue by ${n} day${n === 1 ? "" : "s"}`,
      color: "hsl(var(--text-warning))",
      background: "color-mix(in srgb, hsl(var(--text-warning)) 8%, transparent)",
      pill: true,
      italic: false,
    };
  }
  if (diff === 0) {
    return {
      state: "today",
      diffDays: 0,
      text: "return today",
      tooltip: "Expected return today",
      color: "hsl(var(--accent))",
      background: "color-mix(in srgb, hsl(var(--accent)) 8%, transparent)",
      pill: true,
      italic: false,
    };
  }
  if (diff === 1) {
    return {
      state: "tomorrow",
      diffDays: 1,
      text: `return tomorrow · ${expectedReturnDate}`,
      tooltip: "Expected return in 1 day",
      color: "hsl(var(--text-tertiary))",
      background: "transparent",
      pill: false,
      italic: false,
    };
  }
  if (diff <= 7) {
    return {
      state: "soon",
      diffDays: diff,
      text: `return in ${diff}d · ${expectedReturnDate}`,
      tooltip: `Expected return in ${diff} days`,
      color: "hsl(var(--text-tertiary))",
      background: "transparent",
      pill: false,
      italic: false,
    };
  }
  return {
    state: "later",
    diffDays: diff,
    text: `return ${expectedReturnDate}`,
    tooltip: `Expected return in ${diff} days`,
    color: "hsl(var(--text-tertiary))",
    background: "transparent",
    pill: false,
    italic: false,
  };
}
