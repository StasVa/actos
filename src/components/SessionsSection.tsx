// SessionsSection — shared component for displaying a list of sessions in
// drill-downs (Day/Week/Month) and on Project/Goal pages.
//
// Variants:
//   - "flat":     single chronological list (Day, Project, Goal)
//   - "by-day":   grouped by start date with day sub-headings (Week)
//   - "by-week":  per-week summary table that links to /reviews/weeks/:yw (Month)
//
// Each session row click opens a slide-in detail panel reused from the same
// component so all integration points behave consistently.

import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { useStore } from "@/store/useStore";
import type { Action, Goal, ID, Session } from "@/types";
import { formatTime } from "@/lib/format";
import {
  fmtSessionTime,
  getSessionsForWeek,
  sessionDurationMinutes,
  sessionOutcome,
  sessionPlannedMinutes,
} from "@/lib/sessionUtils";

/* ───────── Status pill ───────── */

const StatusPill: React.FC<{ status: Session["status"] }> = ({ status }) => {
  const color =
    status === "completed"
      ? "hsl(var(--state-active))"
      : status === "aborted"
      ? "hsl(var(--text-warning))"
      : "hsl(var(--accent))";
  const label = status === "in_progress" ? "ACTIVE" : status.toUpperCase();
  return (
    <span
      className="font-mono text-[10px] uppercase tracking-[0.06em] px-1.5 py-[2px] rounded-[3px]"
      style={{ background: "hsl(var(--surface-hover))", color }}
    >
      {label}
    </span>
  );
};

/* ───────── Compact session row ───────── */

interface RowProps {
  session: Session;
  outcome: number;
  /** Optional sub-line override (e.g. project subset stats). */
  subExtra?: string;
  /** Replaces the default left "time" header label. */
  leftLabel?: string;
  onClick: () => void;
}

const SessionRow: React.FC<RowProps> = ({ session, outcome, subExtra, leftLabel, onClick }) => {
  const dur = sessionDurationMinutes(session);
  const planned = sessionPlannedMinutes(session);
  const doneCount = session.completedActionIds.length;
  const droppedCount = session.droppedActionIds.length;
  const durStr = dur > 0 ? formatTime(dur) : "—";

  let modeLine: string;
  if (session.mode === "continuous") {
    modeLine = `Continuous · ${dur > 0 ? `${dur}min focused` : `${session.workDuration}min planned`}`;
  } else {
    const mode = session.mode === "pomodoro" ? "Pomodoro" : "Custom";
    modeLine = `${mode} · ${session.workDuration}min × ${session.cyclesCompleted}/${session.cyclesPlanned} cycles`;
  }

  const stats: string[] = [];
  if (outcome > 0) stats.push(`+${outcome} outcome`);
  if (doneCount > 0) stats.push(`${doneCount} done`);
  if (droppedCount > 0) stats.push(`${droppedCount} dropped`);

  const rightLabel =
    session.status === "aborted" && dur > 0
      ? `${formatTime(dur)} of ${formatTime(planned)}`
      : durStr;

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left cursor-pointer transition-colors hover:bg-surface-hover border-b border-border-subtle last:border-b-0"
      style={{ padding: "10px 14px" }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="text-[13px] font-medium text-text-primary">
          {leftLabel ?? fmtSessionTime(session.startedAt)}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <StatusPill status={session.status} />
          <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-secondary tabular-nums">
            · {rightLabel}
          </span>
        </div>
      </div>
      <div className="mt-0.5 font-mono text-[11px] text-text-secondary">{modeLine}</div>
      {(stats.length > 0 || subExtra) && (
        <div className="mt-0.5 font-mono text-[11px] text-text-secondary">
          {[...(subExtra ? [subExtra] : []), ...stats].join(" · ")}
        </div>
      )}
    </button>
  );
};

/* ───────── Detail panel ───────── */

const DetailRow: React.FC<{
  action: Action | undefined;
  status: "done" | "dropped" | "untouched";
  goal: Goal | undefined;
  onClick: () => void;
}> = ({ action, status, goal, onClick }) => {
  if (!action) return null;
  const goalColor = goal ? `hsl(var(--${goal.color}))` : "hsl(var(--border-default))";
  const pillColor =
    status === "done"
      ? "hsl(var(--state-active))"
      : status === "dropped"
      ? "hsl(var(--text-warning))"
      : "hsl(var(--text-tertiary))";
  const pillLabel = status === "untouched" ? "NOT TOUCHED" : status.toUpperCase();
  return (
    <div
      onClick={onClick}
      className="group flex items-stretch cursor-pointer hover:bg-surface-hover transition-colors border-b border-border-subtle"
    >
      <span className="w-[3px] shrink-0" style={{ background: goalColor }} />
      <div className="flex-1 min-w-0 flex items-center justify-between gap-3 py-3 pl-3 pr-2">
        <div className="min-w-0">
          <div className="text-[13px] text-text-primary truncate">{action.title}</div>
          {goal && (
            <div className="font-mono text-[11px] text-text-tertiary truncate">
              {goal.title}
            </div>
          )}
        </div>
        <span
          className="shrink-0 font-mono text-[10px] uppercase tracking-[0.06em] px-2 py-[2px] rounded-[3px]"
          style={{ background: "hsl(var(--surface-hover))", color: pillColor }}
        >
          {pillLabel}
        </span>
      </div>
    </div>
  );
};

function fmtPanelDateTime(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  if (sameDay(d, today)) return `Today, ${time}`;
  if (sameDay(d, yesterday)) return `Yesterday, ${time}`;
  return `${d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}, ${time}`;
}

export const SessionDetailPanel: React.FC<{
  session: Session;
  onClose: () => void;
}> = ({ session, onClose }) => {
  const actions = useStore((s) => s.actions);
  const goals = useStore((s) => s.goals);
  const openPanel = useStore((s) => s.openPanel);

  const dur = sessionDurationMinutes(session);
  const outcome = sessionOutcome(session, actions);

  const breakStr = session.mode === "continuous" ? "—" : `${session.breakDuration}min break`;
  const config = `${session.mode[0].toUpperCase() + session.mode.slice(1)} · ${session.workDuration}min work / ${breakStr} · ${session.cyclesPlanned} cycles planned`;

  return (
    <div
      className="fixed inset-0 z-[90] flex justify-end"
      style={{ background: "rgba(0,0,0,0.4)" }}
      onClick={onClose}
    >
      <div
        className="h-full w-full sm:w-[480px] bg-surface-raised border-l border-border-subtle flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between p-5 border-b border-border-subtle">
          <div>
            <div className="text-[18px] font-medium text-text-primary">
              {fmtPanelDateTime(session.startedAt)}
            </div>
            <div className="mt-2">
              <StatusPill status={session.status} />
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 inline-flex items-center justify-center rounded-[3px] text-text-tertiary hover:bg-surface-hover hover:text-text-primary"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-5 space-y-5">
            <div className="font-mono text-[12px] text-text-secondary">{config}</div>
            <div className="space-y-1.5">
              <div className="text-[14px] text-text-primary">
                Actual: {dur > 0 ? `${dur}min` : "—"}
              </div>
              <div className="text-[14px] text-text-primary">
                Completed {session.cyclesCompleted} of {session.cyclesPlanned} cycles
              </div>
              <div
                className="text-[14px]"
                style={{
                  color: outcome > 0 ? "hsl(var(--state-active))" : "hsl(var(--text-secondary))",
                }}
              >
                {outcome > 0 ? `+${outcome} Impact added to active goals` : "+0 Impact added"}
              </div>
            </div>

            <div>
              <div className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-secondary mb-2">
                ACTIONS · {session.plannedActionIds.length} PLANNED
              </div>
              {session.plannedActionIds.length === 0 ? (
                <div className="text-[13px] text-text-tertiary">No actions were planned.</div>
              ) : (
                <div className="border-t border-border-subtle">
                  {session.plannedActionIds.map((aid) => {
                    const action = actions.find((a) => a.id === aid);
                    const goal = action ? goals.find((g) => g.id === action.goalId) : undefined;
                    let status: "done" | "dropped" | "untouched" = "untouched";
                    if (session.completedActionIds.includes(aid)) status = "done";
                    else if (session.droppedActionIds.includes(aid)) status = "dropped";
                    return (
                      <DetailRow
                        key={aid}
                        action={action}
                        status={status}
                        goal={goal}
                        onClick={() => {
                          if (action) openPanel({ kind: "action", mode: "edit", id: action.id });
                        }}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ───────── Top-level section ───────── */

export type SessionsSectionVariant = "flat" | "by-day" | "by-week";

export interface PerProjectSubset {
  /** Set of action ids belonging to the entity (project or goal). */
  entityActionIds: Set<ID>;
}

interface Props {
  sessions: Session[];
  variant?: SessionsSectionVariant;
  /**
   * If provided, each row's sub-line includes "from this {scopeLabel}: X planned, Y done".
   * Used on Project/Goal pages.
   */
  scope?: { actionIds: Set<ID>; label: string };
  /** Show aggregate stats row (Week/Month). */
  showStats?: boolean;
  /** Initial collapse limit for flat lists (Week). */
  initialLimit?: number;
}

export const SessionsSection: React.FC<Props> = ({
  sessions,
  variant = "flat",
  scope,
  showStats = false,
  initialLimit,
}) => {
  const navigate = useNavigate();
  const actions = useStore((s) => s.actions);
  const allSessions = useStore((s) => s.sessions);
  const [selectedId, setSelectedId] = useState<ID | null>(null);
  const [expanded, setExpanded] = useState(false);

  const totalMin = sessions.reduce((sum, s) => sum + sessionDurationMinutes(s), 0);
  const avgMin =
    sessions.length > 0 ? Math.round(totalMin / sessions.length) : 0;
  const finished = sessions.filter((s) => s.status !== "in_progress");
  const completed = finished.filter((s) => s.status === "completed").length;
  const completionRate = finished.length > 0 ? Math.round((completed / finished.length) * 100) : 0;

  const selected = selectedId ? allSessions.find((s) => s.id === selectedId) ?? null : null;

  const subsetFor = (s: Session): string | undefined => {
    if (!scope) return undefined;
    const planned = s.plannedActionIds.filter((id) => scope.actionIds.has(id));
    const done = planned.filter((id) => s.completedActionIds.includes(id));
    if (planned.length === 0) return undefined;
    return `from this ${scope.label}: ${planned.length} planned, ${done.length} done`;
  };

  /* ─── flat ─── */
  if (variant === "flat") {
    const limit = initialLimit && !expanded ? initialLimit : sessions.length;
    const visible = sessions.slice(0, limit);
    return (
      <>
        {showStats && finished.length > 0 && (
          <div className="mb-3 font-mono text-[12px] text-text-secondary tabular-nums">
            Total focused:{" "}
            <span className="text-text-primary">{formatTime(totalMin)}</span> · Avg session:{" "}
            <span className="text-text-primary">{formatTime(avgMin)}</span> · Completion rate:{" "}
            <span className="text-text-primary">{completionRate}%</span>
          </div>
        )}
        <div className="rounded-[6px] border border-border-subtle overflow-hidden bg-surface-elevated">
          {visible.map((s) => (
            <SessionRow
              key={s.id}
              session={s}
              outcome={sessionOutcome(s, actions)}
              subExtra={subsetFor(s)}
              onClick={() => setSelectedId(s.id)}
            />
          ))}
        </div>
        {initialLimit && sessions.length > initialLimit && !expanded && (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="mt-2 font-mono text-[11px] uppercase tracking-[0.06em] text-text-tertiary hover:text-text-primary transition-colors"
          >
            Show all {sessions.length} sessions →
          </button>
        )}
        {selected && <SessionDetailPanel session={selected} onClose={() => setSelectedId(null)} />}
      </>
    );
  }

  /* ─── by-day (Week drill-down) ─── */
  if (variant === "by-day") {
    const groups = useMemo(() => {
      const map = new Map<string, Session[]>();
      for (const s of sessions) {
        const d = s.startedAt.slice(0, 10);
        const arr = map.get(d) ?? [];
        arr.push(s);
        map.set(d, arr);
      }
      return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
    }, [sessions]);

    return (
      <>
        {showStats && finished.length > 0 && (
          <div className="mb-3 font-mono text-[12px] text-text-secondary tabular-nums">
            Total focused:{" "}
            <span className="text-text-primary">{formatTime(totalMin)}</span> · Avg session:{" "}
            <span className="text-text-primary">{formatTime(avgMin)}</span> · Completion rate:{" "}
            <span className="text-text-primary">{completionRate}%</span>
          </div>
        )}
        <div className="space-y-4">
          {groups.map(([date, list]) => (
            <div key={date}>
              <div className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-tertiary mb-1.5">
                {format(parseISO(date), "EEE, MMM d").toUpperCase()}
              </div>
              <div className="rounded-[6px] border border-border-subtle overflow-hidden bg-surface-elevated">
                {list
                  .slice()
                  .sort((a, b) => a.startedAt.localeCompare(b.startedAt))
                  .map((s) => (
                    <SessionRow
                      key={s.id}
                      session={s}
                      outcome={sessionOutcome(s, actions)}
                      subExtra={subsetFor(s)}
                      onClick={() => setSelectedId(s.id)}
                    />
                  ))}
              </div>
            </div>
          ))}
        </div>
        {selected && <SessionDetailPanel session={selected} onClose={() => setSelectedId(null)} />}
      </>
    );
  }

  /* ─── by-week (Month drill-down) ─── */
  // Build per-week rows using yearWeek bucketing.
  const weekSet = new Set<string>();
  for (const s of sessions) {
    const yw = (function () {
      // Local helper to avoid circular import; mirrors yearWeekFromDate.
      // Use the lib helper for correctness.
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      return require("@/lib/weekUtils").yearWeekFromDate(new Date(s.startedAt)) as string;
    })();
    weekSet.add(yw);
  }
  const weekRows = Array.from(weekSet)
    .sort()
    .reverse()
    .map((yw) => {
      const wkSessions = getSessionsForWeek(sessions, yw);
      const wkMin = wkSessions.reduce((s, x) => s + sessionDurationMinutes(x), 0);
      const wkOutcome = wkSessions.reduce((s, x) => s + sessionOutcome(x, actions), 0);
      return { yearWeek: yw, count: wkSessions.length, minutes: wkMin, outcome: wkOutcome };
    });

  // Best week stat
  const bestWeek = weekRows.reduce((best, r) => (r.minutes > (best?.minutes ?? -1) ? r : best),
    null as { yearWeek: string; minutes: number } | null);

  return (
    <>
      {showStats && finished.length > 0 && (
        <div className="mb-3 font-mono text-[12px] text-text-secondary tabular-nums">
          Total focused:{" "}
          <span className="text-text-primary">{formatTime(totalMin)}</span> · Avg session:{" "}
          <span className="text-text-primary">{formatTime(avgMin)}</span> · Completion rate:{" "}
          <span className="text-text-primary">{completionRate}%</span>
          {bestWeek && bestWeek.minutes > 0 && (
            <>
              {" · Best week: "}
              <span className="text-text-primary">{formatTime(bestWeek.minutes)}</span>
            </>
          )}
        </div>
      )}
      <div className="rounded-[6px] border border-border-subtle overflow-hidden">
        {weekRows.map((r) => {
          const { weekRange, formatWeekLabel } = require("@/lib/weekUtils") as typeof import("@/lib/weekUtils");
          const range = weekRange(r.yearWeek);
          const label = range
            ? `Week of ${format(range.start, "MMM d")} – ${format(range.end, "MMM d")}`
            : formatWeekLabel(r.yearWeek);
          return (
            <button
              key={r.yearWeek}
              type="button"
              onClick={() => navigate(`/reviews/weeks/${r.yearWeek}`)}
              className="w-full flex items-center gap-3 px-4 py-3 border-b border-border-subtle last:border-b-0 hover:bg-surface-hover transition-colors text-left"
            >
              <span className="text-[13px] font-medium text-text-primary flex-1 truncate">
                {label}
              </span>
              <span className="font-mono text-[12px] text-text-secondary tabular-nums">
                <span className="text-text-primary">{r.count}</span> session{r.count === 1 ? "" : "s"}
                <span className="text-text-tertiary"> · </span>
                <span className="text-text-primary">{formatTime(r.minutes)}</span>
                {r.outcome > 0 && (
                  <>
                    <span className="text-text-tertiary"> · </span>
                    <span className="text-text-primary">+{r.outcome}</span> outcome
                  </>
                )}
              </span>
              <span className="text-text-tertiary shrink-0">→</span>
            </button>
          );
        })}
      </div>
      {selected && <SessionDetailPanel session={selected} onClose={() => setSelectedId(null)} />}
    </>
  );
};
