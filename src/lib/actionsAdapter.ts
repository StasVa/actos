// Adapter that maps the new store's Action[] (rich timestamps) into the
// "legacy" shape used by AllActions.tsx and AllDelegated.tsx renderers.
//
// Rendering code in those pages is intact — only the data source is swapped.
// Friendly date labels ("TODAY", "MAY 8", "Apr 28") are recomputed from real
// ISO dates against TODAY (2026-05-05 in this prototype).

import type { Action as StoreAction, ActionStatus } from "@/types";
import type { Action as LegacyAction, GoalKey } from "@/lib/actionsData";
import { GOAL_IDS } from "@/store/mockData";

const TODAY_ISO = "2026-05-05";

const MONTH_ABBR = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const MONTH_PRETTY = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function diffDaysFromToday(iso: string): number {
  const a = new Date(iso + "T00:00:00.000Z").getTime();
  const b = new Date(TODAY_ISO + "T00:00:00.000Z").getTime();
  return Math.round((a - b) / 86400000);
}

function shortLabel(iso?: string, upper = false): string | undefined {
  if (!iso) return undefined;
  const d = new Date(iso + "T00:00:00.000Z");
  const m = upper ? MONTH_ABBR[d.getUTCMonth()] : MONTH_PRETTY[d.getUTCMonth()];
  return `${m} ${d.getUTCDate()}`;
}

function scheduledLabel(iso?: string): string | undefined {
  if (!iso) return undefined;
  const delta = diffDaysFromToday(iso);
  if (delta === 0) return "TODAY";
  if (delta === 1) return "TOMORROW";
  return shortLabel(iso, true);
}

function expectedLabel(iso?: string): string | undefined {
  if (!iso) return undefined;
  const delta = diffDaysFromToday(iso);
  if (delta === 0) return "TODAY";
  return shortLabel(iso, true);
}

const GOAL_TO_KEY: Record<string, GoalKey> = {
  [GOAL_IDS.g1]: "g1",
  [GOAL_IDS.g2]: "g2",
  [GOAL_IDS.g3]: "g3",
};

// Map projectId → human title (needed because legacy renderer uses string title).
// Built per-call so it picks up any new projects from the store.
function buildProjectTitleMap(
  projects: { id: string; title: string }[],
): Record<string, string> {
  const map: Record<string, string> = {};
  for (const p of projects) map[p.id] = p.title;
  return map;
}

export function toLegacyAction(
  a: StoreAction,
  projectTitleById: Record<string, string>,
): LegacyAction {
  const goalKey = GOAL_TO_KEY[a.goalId] ?? "g1";
  const projectTitle = a.projectId ? projectTitleById[a.projectId] ?? "—" : "—";
  const createdISO = a.createdAt.slice(0, 10);
  const lastChangedISO =
    a.completedAt ?? a.delegatedAt ?? a.droppedAt ?? a.cancelledAt ?? a.updatedAt ?? a.createdAt;
  const changedSort = new Date(lastChangedISO).getTime() / 60000; // minutes since epoch — monotonic
  const expectedDelta = a.expectedReturnDate ? diffDaysFromToday(a.expectedReturnDate) : undefined;
  const delegatedDelta = a.delegatedAt
    ? -diffDaysFromToday(a.delegatedAt.slice(0, 10))
    : undefined;
  return {
    id: a.id,
    title: a.title,
    goal: goalKey,
    project: projectTitle,
    status: a.status as ActionStatus,
    impact: a.impact ?? 0,
    timeMinutes: a.timeEstimateMinutes ?? 0,
    scheduledLabel: scheduledLabel(a.scheduledDate),
    scheduledSort: a.scheduledDate ? diffDaysFromToday(a.scheduledDate) : undefined,
    createdLabel: shortLabel(createdISO) ?? "—",
    changedSort,
    notes: a.notes,
    timeline: a.timeline.map((t) => ({
      date: shortLabel(t.at.slice(0, 10)) ?? "—",
      text: t.text,
    })),
    delegate: (a.delegateName as LegacyAction["delegate"]) ?? undefined,
    expectedReturnLabel: expectedLabel(a.expectedReturnDate),
    expectedReturnDelta: expectedDelta,
    expectedReturnDate: a.expectedReturnDate,
    delegatedLabel: a.delegatedAt ? shortLabel(a.delegatedAt.slice(0, 10)) : undefined,
    delegatedAgoDays: delegatedDelta,
    delegationNote: a.delegateNote,
  };
}

export function toLegacyActions(
  storeActions: StoreAction[],
  projects: { id: string; title: string }[],
): LegacyAction[] {
  const map = buildProjectTitleMap(projects);
  return storeActions.map((a) => toLegacyAction(a, map));
}

export { GOAL_TO_KEY };
