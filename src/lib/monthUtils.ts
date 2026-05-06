// Month-scoped computed summaries for Reviews · Months.
// Pure derivation — no persisted entity for "month".

import {
  startOfMonth,
  endOfMonth,
  format,
  parseISO,
  differenceInCalendarMonths,
  addDays,
  getDaysInMonth,
} from "date-fns";
import type {
  Action,
  DayEntry,
  DayType,
  Goal,
  ID,
  ISODate,
  Project,
  Ritual,
} from "@/types";
import { yearWeekFromDate } from "./weekUtils";
import { timeInvestedMinutes } from "./timeStats";

const ISO_DATE = (d: Date): ISODate => format(d, "yyyy-MM-dd");

export function yearMonthFromDate(d: Date): string {
  return format(d, "yyyy-MM");
}

export function dateFromYearMonth(ym: string): Date | null {
  const m = /^(\d{4})-(\d{2})$/.exec(ym);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function monthRange(ym: string): { start: Date; end: Date; days: ISODate[] } | null {
  const start = dateFromYearMonth(ym);
  if (!start) return null;
  const end = endOfMonth(start);
  const days: ISODate[] = [];
  const total = getDaysInMonth(start);
  for (let i = 0; i < total; i++) days.push(ISO_DATE(addDays(start, i)));
  return { start, end, days };
}

export function formatMonthLabel(ym: string): string {
  const d = dateFromYearMonth(ym);
  if (!d) return ym;
  return format(d, "MMMM yyyy");
}

export function formatMonthRelative(ym: string, today = new Date()): string {
  const d = dateFromYearMonth(ym);
  if (!d) return "";
  const diff = differenceInCalendarMonths(startOfMonth(today), d);
  if (diff === 0) return "This month";
  if (diff === 1) return "Last month";
  if (diff > 0) return `${diff} months ago`;
  if (diff === -1) return "Next month";
  return `${Math.abs(diff)} months ahead`;
}

export interface MonthPerGoalProjectTime {
  projectId: ID;
  minutes: number;
}
export interface MonthPerGoalTimeRow {
  goalId: ID;
  minutes: number;
  percentage: number;
  projects: MonthPerGoalProjectTime[];
}

export interface MonthRitualWeekCell {
  yearWeek: string;
  scheduledCount: number;
  doneCount: number;
}
export interface MonthRitualSummary {
  ritualId: ID;
  scheduledCount: number;
  doneCount: number;
  skippedCount: number;
  missedCount: number;
  weeks: MonthRitualWeekCell[];
}

export interface MonthClosedEntity<T> {
  entity: T;
  type: "completed" | "dropped";
  at: ISODate;
}

export interface SubstantiveReflection {
  date: ISODate;
  dayType?: DayType;
  text: string;
}
export interface ShortReflection {
  date: ISODate;
  dayType?: DayType;
  text: string;
}

export interface MonthSummary {
  yearMonth: string;
  startDate: ISODate;
  endDate: ISODate;
  days: ISODate[];
  weeks: string[];
  dayEntriesByDate: Record<ISODate, DayEntry | undefined>;
  doneActions: Action[];
  delegatedActions: Action[];
  droppedActions: Action[];
  cancelledActions: Action[];
  closedProjects: MonthClosedEntity<Project>[];
  closedGoals: MonthClosedEntity<Goal>[];
  dayTypeDistribution: Record<DayType, number>;
  totalTimeMinutes: number;
  morningEnergyAvg: number | null;
  eveningEnergyAvg: number | null;
  weeklyEnergy: { yearWeek: string; morning: number | null; evening: number | null }[];
  perGoalTime: MonthPerGoalTimeRow[];
  ritualsActive: Ritual[];
  ritualMonth: MonthRitualSummary[];
  substantiveReflections: SubstantiveReflection[];
  shortReflections: ShortReflection[];
}

const SUBSTANTIVE_WORD_THRESHOLD = 30;
function wordCount(s: string): number {
  return s.trim().split(/\s+/).filter(Boolean).length;
}

export function getMonthSummary(
  ym: string,
  data: {
    actions: Action[];
    dayEntries: DayEntry[];
    goals: Goal[];
    projects: Project[];
    rituals: Ritual[];
  },
): MonthSummary | null {
  const range = monthRange(ym);
  if (!range) return null;
  const { days } = range;
  const startDate = days[0];
  const endDate = days[days.length - 1];

  const inMonth = (iso?: string) =>
    !!iso && iso.slice(0, 10) >= startDate && iso.slice(0, 10) <= endDate;

  const dayEntriesByDate: Record<ISODate, DayEntry | undefined> = {};
  for (const d of days) dayEntriesByDate[d] = data.dayEntries.find((e) => e.date === d);

  const doneActions = data.actions.filter((a) => a.status === "done" && inMonth(a.completedAt));
  const delegatedActions = data.actions.filter(
    (a) => a.status === "delegated" && inMonth(a.delegatedAt),
  );
  const droppedActions = data.actions.filter(
    (a) => a.status === "dropped" && inMonth(a.droppedAt),
  );
  const cancelledActions = data.actions.filter(
    (a) => a.status === "cancelled" && inMonth(a.cancelledAt),
  );

  // Weeks intersecting the month
  const weekSet = new Set<string>();
  for (const d of days) weekSet.add(yearWeekFromDate(parseISO(d)));
  const weeks = Array.from(weekSet).sort((a, b) => b.localeCompare(a));

  const closedProjects: MonthClosedEntity<Project>[] = [];
  for (const p of data.projects) {
    if (inMonth(p.completedAt))
      closedProjects.push({ entity: p, type: "completed", at: p.completedAt!.slice(0, 10) });
    else if (inMonth(p.droppedAt))
      closedProjects.push({ entity: p, type: "dropped", at: p.droppedAt!.slice(0, 10) });
  }
  closedProjects.sort((a, b) => a.at.localeCompare(b.at));

  const closedGoals: MonthClosedEntity<Goal>[] = [];
  for (const g of data.goals) {
    if (inMonth(g.completedAt))
      closedGoals.push({ entity: g, type: "completed", at: g.completedAt!.slice(0, 10) });
    else if (inMonth(g.droppedAt))
      closedGoals.push({ entity: g, type: "dropped", at: g.droppedAt!.slice(0, 10) });
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

  const investedActions = [...doneActions, ...delegatedActions];
  const totalTimeMinutes = investedActions.reduce((s, a) => s + timeInvestedMinutes(a), 0);

  const morningScores: number[] = [];
  const eveningScores: number[] = [];
  for (const d of days) {
    const e = dayEntriesByDate[d];
    if (e?.morningEnergyScore != null) morningScores.push(e.morningEnergyScore);
    if (e?.eveningEnergyScore != null) eveningScores.push(e.eveningEnergyScore);
  }
  const avg = (xs: number[]) => (xs.length === 0 ? null : xs.reduce((s, x) => s + x, 0) / xs.length);

  // Per-week energy averages (weeks ascending for chart)
  const weeksAsc = [...weeks].sort();
  const weeklyEnergy = weeksAsc.map((wk) => {
    const wkDays = days.filter((d) => yearWeekFromDate(parseISO(d)) === wk);
    const m: number[] = [];
    const e: number[] = [];
    for (const d of wkDays) {
      const ent = dayEntriesByDate[d];
      if (ent?.morningEnergyScore != null) m.push(ent.morningEnergyScore);
      if (ent?.eveningEnergyScore != null) e.push(ent.eveningEnergyScore);
    }
    return { yearWeek: wk, morning: avg(m), evening: avg(e) };
  });

  const perGoalTime: MonthPerGoalTimeRow[] = data.goals
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
      const projects: MonthPerGoalProjectTime[] = Array.from(byProject.entries())
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
  const ritualMonth: MonthRitualSummary[] = ritualsActive.map((r) => {
    let scheduledCount = 0;
    let doneCount = 0;
    let skippedCount = 0;
    let missedCount = 0;
    const weekMap = new Map<string, { scheduled: number; done: number }>();
    for (const wk of weeksAsc) weekMap.set(wk, { scheduled: 0, done: 0 });

    for (const d of days) {
      const entry = dayEntriesByDate[d];
      const planned = entry?.plannedRitualIds?.includes(r.id) ?? false;
      const skipped = entry?.skippedRitualIds?.includes(r.id) ?? false;
      const completion = r.completionHistory.find((c) => c.date === d);
      const isDone = !!completion && (completion.status === "done" || !completion.status);
      const wk = yearWeekFromDate(parseISO(d));
      const slot = weekMap.get(wk);

      if (isDone) {
        doneCount++;
        scheduledCount++;
        if (slot) {
          slot.done++;
          slot.scheduled++;
        }
      } else if (skipped) {
        skippedCount++;
        scheduledCount++;
        if (slot) slot.scheduled++;
      } else if (planned) {
        missedCount++;
        scheduledCount++;
        if (slot) slot.scheduled++;
      }
    }

    const weeksArr: MonthRitualWeekCell[] = weeksAsc.map((wk) => {
      const slot = weekMap.get(wk)!;
      return { yearWeek: wk, scheduledCount: slot.scheduled, doneCount: slot.done };
    });

    return {
      ritualId: r.id,
      scheduledCount,
      doneCount,
      skippedCount,
      missedCount,
      weeks: weeksArr,
    };
  });

  const substantiveReflections: SubstantiveReflection[] = [];
  const shortReflections: ShortReflection[] = [];
  for (const d of days) {
    const e = dayEntriesByDate[d];
    const text = e?.reflectionText?.trim();
    if (!text) continue;
    if (wordCount(text) > SUBSTANTIVE_WORD_THRESHOLD) {
      substantiveReflections.push({ date: d, dayType: e?.dayType, text });
    } else {
      shortReflections.push({ date: d, dayType: e?.dayType, text });
    }
  }

  return {
    yearMonth: ym,
    startDate,
    endDate,
    days,
    weeks,
    dayEntriesByDate,
    doneActions,
    delegatedActions,
    droppedActions,
    cancelledActions,
    closedProjects,
    closedGoals,
    dayTypeDistribution,
    totalTimeMinutes,
    morningEnergyAvg: avg(morningScores),
    eveningEnergyAvg: avg(eveningScores),
    weeklyEnergy,
    perGoalTime,
    ritualsActive,
    ritualMonth,
    substantiveReflections,
    shortReflections,
  };
}

export function getMonthsWithActivity(
  actions: Action[],
  dayEntries: DayEntry[],
): string[] {
  const set = new Set<string>();
  for (const a of actions) {
    if (a.status === "done" && a.completedAt) {
      set.add(yearMonthFromDate(parseISO(a.completedAt.slice(0, 10))));
    }
  }
  for (const e of dayEntries) {
    set.add(yearMonthFromDate(parseISO(e.date)));
  }
  return Array.from(set).sort((a, b) => b.localeCompare(a));
}

const DAY_TYPE_SHORT_LABEL: Record<DayType, string> = {
  execution: "Execution",
  recovery: "Recovery",
  "day-off": "Day Off",
  sick: "Sick",
};

export function formatMonthDayTypeDistribution(d: Record<DayType, number>): string {
  const parts: string[] = [];
  (Object.keys(d) as DayType[]).forEach((k) => {
    if (d[k] > 0) parts.push(`${d[k]} ${DAY_TYPE_SHORT_LABEL[k]}`);
  });
  return parts.join(" · ");
}
