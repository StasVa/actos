// ISO week helpers and per-week computed summaries (Reviews · Weeks).

import {
  startOfISOWeek,
  endOfISOWeek,
  format,
  parseISO,
  getISOWeek,
  getISOWeekYear,
  setISOWeek,
  setISOWeekYear,
  addDays,
  differenceInCalendarWeeks,
} from "date-fns";
import type { Action, DayEntry, DayType, Goal, ID, ISODate, Project, Ritual } from "@/types";

const ISO_DATE = (d: Date): ISODate => format(d, "yyyy-MM-dd");

export function yearWeekFromDate(d: Date): string {
  return `${getISOWeekYear(d)}-W${String(getISOWeek(d)).padStart(2, "0")}`;
}

export function dateFromYearWeek(yw: string): Date | null {
  const m = /^(\d{4})-W(\d{1,2})$/.exec(yw);
  if (!m) return null;
  const year = Number(m[1]);
  const week = Number(m[2]);
  let d = setISOWeekYear(new Date(), year);
  d = setISOWeek(d, week);
  return startOfISOWeek(d);
}

export function weekRange(yw: string): { start: Date; end: Date; days: ISODate[] } | null {
  const start = dateFromYearWeek(yw);
  if (!start) return null;
  const end = endOfISOWeek(start);
  const days: ISODate[] = [];
  for (let i = 0; i < 7; i++) days.push(ISO_DATE(addDays(start, i)));
  return { start, end, days };
}

export function formatWeekLabel(yw: string): string {
  const r = weekRange(yw);
  if (!r) return yw;
  const sameMonth = r.start.getMonth() === r.end.getMonth();
  const startLabel = format(r.start, "MMM d");
  const endLabel = sameMonth ? format(r.end, "d") : format(r.end, "MMM d");
  return `Week of ${startLabel} — ${endLabel}`;
}

export function formatWeekRelative(yw: string, today = new Date()): string {
  const start = dateFromYearWeek(yw);
  if (!start) return "";
  const diff = differenceInCalendarWeeks(startOfISOWeek(today), start, { weekStartsOn: 1 });
  if (diff === 0) return "This week";
  if (diff === 1) return "Last week";
  if (diff > 0) return `${diff} weeks ago`;
  if (diff === -1) return "Next week";
  return `${Math.abs(diff)} weeks ahead`;
}

export interface PerGoalProjectTime {
  projectId: ID;
  minutes: number;
}
export interface PerGoalTimeRow {
  goalId: ID;
  minutes: number;
  percentage: number;
  projects: PerGoalProjectTime[];
}

export interface RitualWeekInstance {
  date: ISODate;
  status: "done" | "skipped" | "missed" | "pending" | "n/a";
}
export interface RitualWeekSummary {
  ritualId: ID;
  instances: RitualWeekInstance[];
  doneCount: number;
  skippedCount: number;
  missedCount: number;
  scheduledCount: number;
}

export interface ClosedEntity<T> {
  entity: T;
  type: "completed" | "dropped";
  at: ISODate;
}

export interface WeekSummary {
  yearWeek: string;
  startDate: ISODate;
  endDate: ISODate;
  days: ISODate[];
  dayEntriesByDate: Record<ISODate, DayEntry | undefined>;
  doneActions: Action[];
  delegatedActions: Action[];
  droppedActions: Action[];
  cancelledActions: Action[];
  reflections: { date: ISODate; entry: DayEntry }[];
  closedProjects: ClosedEntity<Project>[];
  closedGoals: ClosedEntity<Goal>[];
  dayTypeDistribution: Record<DayType, number>;
  totalTimeMinutes: number;
  morningEnergyAvg: number | null;
  eveningEnergyAvg: number | null;
  perGoalTime: PerGoalTimeRow[];
  ritualsActive: Ritual[];
  ritualWeek: RitualWeekSummary[];
}

export function getWeekSummary(
  yw: string,
  data: {
    actions: Action[];
    dayEntries: DayEntry[];
    goals: Goal[];
    projects: Project[];
    rituals: Ritual[];
  },
): WeekSummary | null {
  const range = weekRange(yw);
  if (!range) return null;
  const { days } = range;
  const startDate = days[0];
  const endDate = days[days.length - 1];

  const inWeek = (iso?: string) => !!iso && iso.slice(0, 10) >= startDate && iso.slice(0, 10) <= endDate;

  const dayEntriesByDate: Record<ISODate, DayEntry | undefined> = {};
  for (const d of days) dayEntriesByDate[d] = data.dayEntries.find((e) => e.date === d);

  const doneActions = data.actions.filter((a) => a.status === "done" && inWeek(a.completedAt));

  const reflections = days
    .map((d) => ({ date: d, entry: dayEntriesByDate[d] }))
    .filter((x): x is { date: ISODate; entry: DayEntry } => !!x.entry && !!x.entry.reflectionText?.trim());

  const closedProjects: ClosedEntity<Project>[] = [];
  for (const p of data.projects) {
    if (inWeek(p.completedAt)) closedProjects.push({ entity: p, type: "completed", at: p.completedAt!.slice(0, 10) });
    else if (inWeek(p.droppedAt)) closedProjects.push({ entity: p, type: "dropped", at: p.droppedAt!.slice(0, 10) });
  }
  closedProjects.sort((a, b) => a.at.localeCompare(b.at));

  const closedGoals: ClosedEntity<Goal>[] = [];
  for (const g of data.goals) {
    if (inWeek(g.completedAt)) closedGoals.push({ entity: g, type: "completed", at: g.completedAt!.slice(0, 10) });
    else if (inWeek(g.droppedAt)) closedGoals.push({ entity: g, type: "dropped", at: g.droppedAt!.slice(0, 10) });
  }
  closedGoals.sort((a, b) => a.at.localeCompare(b.at));

  const dayTypeDistribution: Record<DayType, number> = {
    execution: 0,
    recovery: 0,
    "day-off": 0,
    sick: 0,
  };
  for (const d of days) {
    const e = dayEntriesByDate[d];
    if (e?.dayType) dayTypeDistribution[e.dayType]++;
  }

  const totalTimeMinutes = doneActions.reduce((s, a) => s + (a.timeEstimateMinutes ?? 0), 0);

  const morningScores: number[] = [];
  const eveningScores: number[] = [];
  for (const d of days) {
    const e = dayEntriesByDate[d];
    if (e?.morningEnergyScore != null) morningScores.push(e.morningEnergyScore);
    if (e?.eveningEnergyScore != null) eveningScores.push(e.eveningEnergyScore);
  }
  const avg = (xs: number[]) => (xs.length === 0 ? null : xs.reduce((s, x) => s + x, 0) / xs.length);

  const perGoalTime: PerGoalTimeRow[] = data.goals
    .filter((g) => g.status === "active")
    .map((g) => {
      const goalActs = doneActions.filter((a) => a.goalId === g.id);
      const minutes = goalActs.reduce((s, a) => s + (a.timeEstimateMinutes ?? 0), 0);
      const byProject = new Map<ID, number>();
      for (const a of goalActs) {
        if (!a.projectId) continue;
        const m = a.timeEstimateMinutes ?? 0;
        if (m <= 0) continue;
        byProject.set(a.projectId, (byProject.get(a.projectId) ?? 0) + m);
      }
      const projects: PerGoalProjectTime[] = Array.from(byProject.entries())
        .map(([projectId, minutes]) => ({ projectId, minutes }))
        .sort((a, b) => b.minutes - a.minutes);
      return {
        goalId: g.id,
        minutes,
        percentage: totalTimeMinutes > 0 ? (minutes / totalTimeMinutes) * 100 : 0,
        projects,
      };
    })
    .sort((a, b) => b.minutes - a.minutes);

  const ritualsActive = data.rituals.filter((r) => r.status === "active");
  const ritualWeek: RitualWeekSummary[] = ritualsActive.map((r) => {
    const instances: RitualWeekInstance[] = days.map((d) => {
      const entry = dayEntriesByDate[d];
      const planned = entry?.plannedRitualIds?.includes(r.id) ?? false;
      const skipped = entry?.skippedRitualIds?.includes(r.id) ?? false;
      const completion = r.completionHistory.find((c) => c.date === d);
      if (completion && (completion.status === "done" || !completion.status))
        return { date: d, status: "done" };
      if (skipped) return { date: d, status: "skipped" };
      if (planned) return { date: d, status: "missed" };
      return { date: d, status: "n/a" };
    });
    return {
      ritualId: r.id,
      instances,
      doneCount: instances.filter((i) => i.status === "done").length,
      skippedCount: instances.filter((i) => i.status === "skipped").length,
      missedCount: instances.filter((i) => i.status === "missed").length,
      scheduledCount: instances.filter((i) => i.status !== "n/a").length,
    };
  });

  return {
    yearWeek: yw,
    startDate,
    endDate,
    days,
    dayEntriesByDate,
    doneActions,
    reflections,
    closedProjects,
    closedGoals,
    dayTypeDistribution,
    totalTimeMinutes,
    morningEnergyAvg: avg(morningScores),
    eveningEnergyAvg: avg(eveningScores),
    perGoalTime,
    ritualsActive,
    ritualWeek,
  };
}

export function getWeeksWithActivity(
  actions: Action[],
  dayEntries: DayEntry[],
): string[] {
  const set = new Set<string>();
  for (const a of actions) {
    if (a.status === "done" && a.completedAt) {
      set.add(yearWeekFromDate(parseISO(a.completedAt.slice(0, 10))));
    }
  }
  for (const e of dayEntries) {
    set.add(yearWeekFromDate(parseISO(e.date)));
  }
  return Array.from(set).sort((a, b) => b.localeCompare(a));
}

export const DAY_TYPE_SHORT_LABEL: Record<DayType, string> = {
  execution: "Execution",
  recovery: "Recovery",
  "day-off": "Day Off",
  sick: "Sick",
};

export function formatDayTypeDistribution(d: Record<DayType, number>): string {
  const parts: string[] = [];
  (Object.keys(d) as DayType[]).forEach((k) => {
    if (d[k] > 0) parts.push(`${d[k]} ${DAY_TYPE_SHORT_LABEL[k]}`);
  });
  return parts.join(" · ");
}
