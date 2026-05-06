// Shared session selectors + aggregate stats.
//
// Date scoping uses the session's `startedAt` for membership in a
// day/week/month period (a session spanning midnight is attributed to its
// start day). Project/Goal scoping uses any plannedActionId belonging to the
// project/goal.

import type { Action, ID, Project, Session } from "@/types";
import { yearWeekFromDate } from "@/lib/weekUtils";
import { yearMonthFromDate } from "@/lib/monthUtils";

/* ───────── Period scoping ───────── */

export function getSessionsForDay(sessions: Session[], date: string): Session[] {
  return sessions
    .filter((s) => s.startedAt.slice(0, 10) === date)
    .slice()
    .sort((a, b) => a.startedAt.localeCompare(b.startedAt));
}

export function getSessionsForWeek(sessions: Session[], yearWeek: string): Session[] {
  return sessions
    .filter((s) => yearWeekFromDate(new Date(s.startedAt)) === yearWeek)
    .slice()
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt));
}

export function getSessionsForMonth(sessions: Session[], yearMonth: string): Session[] {
  return sessions
    .filter((s) => yearMonthFromDate(new Date(s.startedAt)) === yearMonth)
    .slice()
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt));
}

/* ───────── Entity scoping ───────── */

export function getSessionsForProject(
  sessions: Session[],
  actions: Action[],
  projectId: ID,
): Session[] {
  const projectActionIds = new Set(
    actions.filter((a) => a.projectId === projectId).map((a) => a.id),
  );
  return sessions
    .filter((s) => s.plannedActionIds.some((id) => projectActionIds.has(id)))
    .slice()
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt));
}

export function getSessionsForGoal(
  sessions: Session[],
  actions: Action[],
  projects: Project[],
  goalId: ID,
): Session[] {
  const goalProjectIds = new Set(projects.filter((p) => p.goalId === goalId).map((p) => p.id));
  const goalActionIds = new Set(
    actions
      .filter(
        (a) =>
          a.goalId === goalId ||
          (a.projectId != null && goalProjectIds.has(a.projectId)),
      )
      .map((a) => a.id),
  );
  return sessions
    .filter((s) => s.plannedActionIds.some((id) => goalActionIds.has(id)))
    .slice()
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt));
}

/* ───────── Per-session derived ───────── */

export function sessionDurationMinutes(s: Session): number {
  if (!s.endedAt) return 0;
  return Math.max(
    0,
    Math.round((new Date(s.endedAt).getTime() - new Date(s.startedAt).getTime()) / 60_000),
  );
}

export function sessionPlannedMinutes(s: Session): number {
  if (s.mode === "continuous") return s.workDuration;
  return s.workDuration * s.cyclesPlanned + s.breakDuration * Math.max(0, s.cyclesPlanned - 1);
}

export function sessionOutcome(s: Session, actions: Action[]): number {
  return s.completedActionIds
    .map((id) => actions.find((a) => a.id === id))
    .reduce((sum, a) => sum + (a?.impact ?? 0), 0);
}

/* ───────── Aggregate stats ───────── */

export interface SessionsAggregate {
  count: number;
  totalFocusMinutes: number;
  avgFocusMinutes: number;
  completionRate: number; // 0..100
  totalOutcome: number;
  totalActionsDone: number;
  totalActionsDropped: number;
}

export function getSessionsAggregateStats(
  sessions: Session[],
  actions: Action[],
): SessionsAggregate {
  const finished = sessions.filter((s) => s.status !== "in_progress");
  const total = finished.reduce((s, x) => s + sessionDurationMinutes(x), 0);
  const outcome = finished.reduce((s, x) => s + sessionOutcome(x, actions), 0);
  const done = finished.reduce((s, x) => s + x.completedActionIds.length, 0);
  const dropped = finished.reduce((s, x) => s + x.droppedActionIds.length, 0);
  const completed = finished.filter((s) => s.status === "completed").length;
  const rate = finished.length > 0 ? Math.round((completed / finished.length) * 100) : 0;
  const avg = finished.length > 0 ? Math.round(total / finished.length) : 0;
  return {
    count: sessions.length,
    totalFocusMinutes: total,
    avgFocusMinutes: avg,
    completionRate: rate,
    totalOutcome: outcome,
    totalActionsDone: done,
    totalActionsDropped: dropped,
  };
}

/* ───────── Formatting helpers ───────── */

export function fmtSessionTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}
