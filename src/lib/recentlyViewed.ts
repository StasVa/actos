// Tracks the last N entities visited via Command Palette navigation so the
// palette's empty state can surface them. Stored in localStorage.

export type RecentKind = "goal" | "project" | "action" | "ritual" | "idea" | "day";

export interface RecentEntry {
  kind: RecentKind;
  id: string; // entity id, or ISO date for "day"
  at: number; // epoch ms
}

const KEY = "actos-recently-viewed";
const MAX = 5;

export function getRecent(): RecentEntry[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as RecentEntry[];
    return Array.isArray(parsed) ? parsed.slice(0, MAX) : [];
  } catch {
    return [];
  }
}

export function pushRecent(kind: RecentKind, id: string) {
  const list = getRecent().filter((e) => !(e.kind === kind && e.id === id));
  list.unshift({ kind, id, at: Date.now() });
  try {
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX)));
  } catch {
    /* ignore quota */
  }
}
