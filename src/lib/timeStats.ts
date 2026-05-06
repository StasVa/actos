// Time investment helpers — derive per-goal time aggregates and per-day series.
// Time Invested formula:
//   • Done       → time × 1.0
//   • Delegated  → time × 0.2 (symmetric with Effort discount)
//   • Other      → 0
// Use timeInvestedMinutes(action) for any "time invested" calculation.

import type { Action, Goal, Project, ID, ISODate } from "@/types";

/** Delegation discount factor for time invested (matches Effort discount). */
export const DELEGATION_TIME_FACTOR = 0.2;

/** Minutes of time-invested credit a single action contributes. */
export function timeInvestedMinutes(a: Action): number {
  const t = a.timeEstimateMinutes ?? 0;
  if (t <= 0) return 0;
  if (a.status === "done") return t;
  if (a.status === "delegated") return Math.round(t * DELEGATION_TIME_FACTOR);
  return 0;
}

/** Sum of time-invested across a list of actions. */
export function sumTimeInvested(actions: Action[]): number {
  let total = 0;
  for (const a of actions) total += timeInvestedMinutes(a);
  return total;
}

export interface PerProjectTimeStats {
  project: Project;
  total30d: number;
  totalAllTime: number;
}

export interface PerGoalTimeStats {
  goal: Goal;
  totalAllTime: number; // minutes
  total30d: number; // minutes
  series30d: number[]; // length 30, oldest → today
  perProject: PerProjectTimeStats[]; // sorted by total30d desc, 0-time filtered out
  isClosed: boolean; // goal is completed/dropped (within recent window)
}

export interface TimeStatsResult {
  perGoal: PerGoalTimeStats[];
  total30d: number;
  totalAllTime: number;
  yMax: number; // unified y-axis max across all goals' series
  hasAny: boolean; // true if any Done action with time > 0 exists
}

const MS_DAY = 86400000;

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function computeTimeStats(
  actions: Action[],
  goals: Goal[],
  days = 30,
  now: Date = new Date(),
  projects: Project[] = [],
): TimeStatsResult {
  const today = startOfDay(now);
  const windowMs = days * MS_DAY;
  const includedGoals = goals.filter((g) => {
    if (g.status === "active") return true;
    const stamp = g.completedAt ?? g.droppedAt;
    if (!stamp) return false;
    return today.getTime() - startOfDay(new Date(stamp)).getTime() <= windowMs;
  });
  let hasAny = false;

  const perGoal: PerGoalTimeStats[] = includedGoals.map((g) => {
    const goalActions = actions.filter(
      (a) =>
        a.goalId === g.id &&
        (a.status === "done" || a.status === "delegated") &&
        (a.timeEstimateMinutes ?? 0) > 0,
    );
    const series = new Array(days).fill(0);
    let total30d = 0;
    let totalAllTime = 0;
    // per-project accumulators
    const projAll = new Map<string, number>();
    const proj30 = new Map<string, number>();
    for (const a of goalActions) {
      const min = timeInvestedMinutes(a);
      if (min <= 0) continue;
      totalAllTime += min;
      hasAny = true;
      if (a.projectId) {
        projAll.set(a.projectId, (projAll.get(a.projectId) ?? 0) + min);
      }
      const stamp = a.status === "done" ? a.completedAt : a.delegatedAt;
      if (!stamp) continue;
      const d = startOfDay(new Date(stamp));
      const daysAgo = Math.round((today.getTime() - d.getTime()) / MS_DAY);
      if (daysAgo < 0 || daysAgo >= days) continue;
      const idx = days - 1 - daysAgo;
      series[idx] += min;
      total30d += min;
      if (a.projectId) {
        proj30.set(a.projectId, (proj30.get(a.projectId) ?? 0) + min);
      }
    }
    const projectIds = new Set<string>([...projAll.keys(), ...proj30.keys()]);
    const perProject: PerProjectTimeStats[] = [];
    for (const pid of projectIds) {
      const p = projects.find((pp) => pp.id === pid);
      if (!p) continue;
      const t30 = proj30.get(pid) ?? 0;
      const tAll = projAll.get(pid) ?? 0;
      if (t30 === 0 && tAll === 0) continue;
      perProject.push({ project: p, total30d: t30, totalAllTime: tAll });
    }
    perProject.sort((a, b) => b.total30d - a.total30d || b.totalAllTime - a.totalAllTime);
    return {
      goal: g,
      totalAllTime,
      total30d,
      series30d: series,
      perProject,
      isClosed: g.status !== "active",
    };
  });

  const total30d = perGoal.reduce((s, x) => s + x.total30d, 0);
  const totalAllTime = perGoal.reduce((s, x) => s + x.totalAllTime, 0);
  const yMax = Math.max(1, ...perGoal.flatMap((p) => p.series30d));

  return { perGoal, total30d, totalAllTime, yMax, hasAny };
}

export function formatHM(minutes: number): string {
  const m = Math.max(0, Math.round(minutes));
  if (m === 0) return "0";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  if (rem === 0) return `${h}h`;
  return `${h}h ${rem}m`;
}

export function formatDateLabel(daysAgo: number, days = 30): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - daysAgo);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function isoForDaysAgo(daysAgo: number): ISODate {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

/** Map series index (0..days-1) → ISO date. */
export function seriesIdxToISO(idx: number, days = 30): ISODate {
  return isoForDaysAgo(days - 1 - idx);
}

export function findGoalById(goals: Goal[], id: ID): Goal | undefined {
  return goals.find((g) => g.id === id);
}
