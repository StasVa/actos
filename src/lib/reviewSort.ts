import type { Action } from "@/types";
import type { FilterOption } from "@/components/FilterDropdown";

export type ReviewSortKey =
  | "most_recent"
  | "oldest"
  | "most_actions"
  | "most_time"
  | "most_value"
  | "most_effort";

export const REVIEW_SORT_OPTIONS: FilterOption<ReviewSortKey>[] = [
  { value: "most_recent", label: "Most recent" },
  { value: "oldest", label: "Oldest" },
  { value: "most_actions", label: "Most actions done" },
  { value: "most_time", label: "Most time invested" },
  { value: "most_value", label: "Most value" },
  { value: "most_effort", label: "Most effort" },
];

const VALID = new Set<ReviewSortKey>(REVIEW_SORT_OPTIONS.map((o) => o.value));

export function loadReviewSort(storageKey: string): ReviewSortKey {
  try {
    const v = localStorage.getItem(storageKey);
    if (v && VALID.has(v as ReviewSortKey)) return v as ReviewSortKey;
  } catch {}
  return "most_recent";
}

export function saveReviewSort(storageKey: string, value: ReviewSortKey) {
  try {
    localStorage.setItem(storageKey, value);
  } catch {}
}

export interface ReviewAggregates {
  doneActions: number;
  timeInvested: number;
  value: number;
  effort: number;
}

export function computeAggregates(done: Action[], delegated: Action[]): ReviewAggregates {
  let doneActions = 0;
  let timeInvested = 0;
  let value = 0;
  let effort = 0;
  for (const a of done) {
    doneActions += 1;
    timeInvested += a.timeEstimateMinutes ?? 0;
    value += a.impact ?? 0;
    effort += a.impact ?? 0;
  }
  for (const a of delegated) {
    timeInvested += Math.round((a.timeEstimateMinutes ?? 0) * 0.2);
    value += a.impact ?? 0;
    effort += (a.impact ?? 0) * 0.2;
  }
  return { doneActions, timeInvested, value, effort };
}

export interface SortableEntry<T> {
  item: T;
  /** Period start as a sortable timestamp (ms). */
  periodStart: number;
  /** Stable id for tie-breaking. */
  id: string;
  /** createdAt timestamp (ms) for tie-breaking. Falls back to periodStart. */
  createdAt: number;
  aggregates: ReviewAggregates;
  /** True if the period was not tracked at all (no entry, no actions). */
  untracked?: boolean;
}

export function sortReviewEntries<T>(
  entries: SortableEntry<T>[],
  key: ReviewSortKey,
): T[] {
  const tieBreak = (a: SortableEntry<T>, b: SortableEntry<T>) => {
    const d = b.createdAt - a.createdAt;
    if (d !== 0) return d;
    return a.id < b.id ? -1 : 1;
  };

  const sorted = [...entries].sort((a, b) => {
    if (key === "most_recent") {
      const d = b.periodStart - a.periodStart;
      if (d !== 0) return d;
      return tieBreak(a, b);
    }
    if (key === "oldest") {
      const d = a.periodStart - b.periodStart;
      if (d !== 0) return d;
      return tieBreak(a, b);
    }
    // Numeric aggregate sorts (desc). Untracked entries are pushed to end.
    const aUntracked = !!a.untracked;
    const bUntracked = !!b.untracked;
    if (aUntracked !== bUntracked) return aUntracked ? 1 : -1;
    const field: keyof ReviewAggregates =
      key === "most_actions"
        ? "doneActions"
        : key === "most_time"
          ? "timeInvested"
          : key === "most_value"
            ? "value"
            : "effort";
    const d = (b.aggregates[field] ?? 0) - (a.aggregates[field] ?? 0);
    if (d !== 0) return d;
    return tieBreak(a, b);
  });
  return sorted.map((e) => e.item);
}
