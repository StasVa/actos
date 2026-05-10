/** Helpers for delegated action expected return date display. */

export type ReturnState = "overdue" | "today" | "tomorrow" | "soon" | "later" | "none";

export type ReturnInfo = {
  state: ReturnState;
  /** Days from today; negative = past. Undefined when no date. */
  diffDays?: number;
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
      color: "hsl(var(--text-tertiary))",
      background: "transparent",
      pill: false,
      italic: true,
    };
  }
  const diff = diffInDays(expectedReturnDate);
  if (diff < 0) {
    return {
      state: "overdue",
      diffDays: diff,
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
      color: "hsl(var(--text-tertiary))",
      background: "transparent",
      pill: false,
      italic: false,
    };
  }
  return {
    state: "later",
    diffDays: diff,
    color: "hsl(var(--text-tertiary))",
    background: "transparent",
    pill: false,
    italic: false,
  };
}
