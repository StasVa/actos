// Session Summary — full-page review shown after any session ends.
//
// Reachable via /sessions/:sessionId/summary. Triggered from:
//   • Natural completion (all cycles done)
//   • "End session" early completion
//   • "Abort" abort path
//
// Works for historical sessions too — direct URL load just renders the data.

import React, { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AppSidebar } from "@/components/AppSidebar";
import { useStore } from "@/store/useStore";

import {
  sessionDurationMinutes,
  sessionPlannedMinutes,
  sessionOutcome as outcomeFromSession,
  fmtSessionTime,
} from "@/lib/sessionUtils";
import type { Session } from "@/types";

function fmtDateTime(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
  const time = fmtSessionTime(iso);
  if (sameDay(d, today)) return `Today, ${time}`;
  if (sameDay(d, yesterday)) return `Yesterday, ${time}`;
  return `${d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  })}, ${time}`;
}

const StatTile: React.FC<{
  value: React.ReactNode;
  label: string;
  highlight?: boolean;
  positive?: boolean;
}> = ({ value, label, highlight, positive }) => (
  <div
    className="rounded-[6px] border border-border-subtle px-5 py-4 min-w-[140px]"
    style={{ background: "hsl(var(--surface-raised))" }}
  >
    <div
      className="text-[28px] sm:text-[30px] leading-tight font-medium tabular-nums"
      style={{
        color: highlight
          ? "hsl(var(--accent))"
          : positive
            ? "hsl(var(--state-active))"
            : "hsl(var(--text-primary))",
      }}
    >
      {value}
    </div>
    <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.06em] text-text-tertiary">
      {label}
    </div>
  </div>
);

const StatusPill: React.FC<{ session: Session }> = ({ session }) => {
  const dur = sessionDurationMinutes(session);
  const planned = sessionPlannedMinutes(session);
  const isEarly = session.status === "completed" && dur < planned;
  const label =
    session.status === "aborted"
      ? "ABORTED"
      : isEarly
        ? "COMPLETED EARLY"
        : "COMPLETED";
  const color =
    session.status === "aborted"
      ? "hsl(var(--text-warning))"
      : "hsl(var(--state-active))";
  return (
    <span
      className="font-mono text-[11px] uppercase tracking-[0.06em] px-2 py-[2px] rounded-[3px]"
      style={{ background: "hsl(var(--surface-hover))", color }}
    >
      {label}
    </span>
  );
};

const ActionRow: React.FC<{
  actionId: string;
  status: "done" | "dropped" | "untouched";
  onClick: () => void;
}> = ({ actionId, status, onClick }) => {
  const action = useStore((s) => s.actions.find((a) => a.id === actionId));
  const goal = useStore((s) =>
    action ? s.goals.find((g) => g.id === action.goalId) : undefined,
  );
  const project = useStore((s) =>
    action?.projectId ? s.projects.find((p) => p.id === action.projectId) : undefined,
  );
  if (!action) return null;
  const goalColor = goal ? `hsl(var(--${goal.color}))` : "hsl(var(--border-default))";
  const pillColor =
    status === "done"
      ? "hsl(var(--state-active))"
      : status === "dropped"
        ? "hsl(var(--text-warning))"
        : "hsl(var(--text-tertiary))";
  const pillLabel = status === "untouched" ? "NOT TOUCHED" : status.toUpperCase();
  const dim = status === "untouched";
  return (
    <div
      onClick={onClick}
      className="relative flex items-stretch cursor-pointer hover:bg-surface-hover transition-colors border-b border-border-subtle"
      style={{ minHeight: 56, opacity: dim ? 0.6 : 1 }}
    >
      <span className="w-[3px] shrink-0" style={{ background: goalColor }} />
      <div className="flex-1 min-w-0 flex items-center justify-between gap-3 py-3 pl-3 pr-4">
        <div className="min-w-0 flex flex-col gap-1">
          <span
            className={`text-[15px] font-medium truncate text-text-primary ${
              dim ? "italic" : ""
            }`}
          >
            {action.title}
          </span>
          <div className="flex items-center font-mono text-[12px] tabular-nums text-text-secondary truncate">
            {goal && <span className="truncate">{goal.title}</span>}
            {project && (
              <>
                <span className="mx-1.5 text-text-tertiary">·</span>
                <span className="truncate">{project.title}</span>
              </>
            )}
            {action.impact > 0 && (
              <>
                <span className="mx-1.5 text-text-tertiary">·</span>
                <span>I{action.impact}</span>
              </>
            )}
          </div>
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

const SessionSummary: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const session = useStore((s) => s.sessions.find((x) => x.id === sessionId)) ?? null;
  const actions = useStore((s) => s.actions);
  const settings = useStore((s) => s.settings);
  const setSessionReflection = useStore((s) => s.setSessionReflection);
  const openPanel = useStore((s) => s.openPanel);

  const [reflection, setReflection] = useState<string>(session?.reflection ?? "");

  const computed = useMemo(() => {
    if (!session) return null;
    const dur = sessionDurationMinutes(session);
    const planned = sessionPlannedMinutes(session);
    const outcome = outcomeFromSession(session, actions);
    const focusBlock = session.workDuration;
    const breakBlock = session.breakDuration;
    const cyclesDone = session.cyclesCompleted;
    // Estimate actual focus / break minutes:
    const actualFocus =
      session.mode === "continuous"
        ? dur
        : Math.min(dur, focusBlock * cyclesDone + (dur > 0 ? Math.min(focusBlock, dur) : 0));
    // Better estimate: cap focus at planned focus, breaks = remainder.
    const plannedFocus =
      session.mode === "continuous" ? focusBlock : focusBlock * session.cyclesPlanned;
    const focusEstimate = Math.min(dur, plannedFocus);
    const breakEstimate = Math.max(0, dur - focusEstimate);
    const isEarly = session.status === "completed" && dur < planned;
    const saved = isEarly ? planned - dur : 0;
    return {
      dur,
      planned,
      outcome,
      cyclesDone,
      focusEstimate,
      breakEstimate,
      plannedFocus,
      breakBlock,
      isEarly,
      saved,
    };
  }, [session, actions]);

  if (!session || !computed) {
    return (
      <div className="min-h-screen bg-background text-text-primary">
        <AppSidebar />
      <main className="app-main page-medium">
          <div className="max-w-[760px] mx-auto px-8 py-16 text-center">
            <h1 className="text-[20px] font-medium">Session not found</h1>
            <p className="mt-2 text-[13px] text-text-secondary">
              This session no longer exists.
            </p>
            <button
              onClick={() => navigate("/sessions")}
              className="mt-6 text-[13px] hover:underline"
              style={{ color: "hsl(var(--accent))" }}
            >
              Go to sessions →
            </button>
          </div>
        </main>
      </div>
    );
  }

  const { dur, planned, outcome, cyclesDone, focusEstimate, breakEstimate, plannedFocus, breakBlock, isEarly, saved } =
    computed;

  const headline = session.status === "aborted" ? "Session ended" : "Session complete";
  const subline = (() => {
    const date = fmtDateTime(session.startedAt);
    if (session.status === "aborted") return `${date} · aborted after ${dur} min`;
    if (isEarly) return `${date} · ended early after ${dur} min`;
    return `${date} · ${dur} min focused`;
  })();

  const allDone =
    session.plannedActionIds.length > 0 &&
    session.plannedActionIds.every((id) => session.completedActionIds.includes(id));

  const planActive = settings.layers.planAndReview;
  const logTime = settings.layers.logTime;

  return (
    <div className="min-h-screen bg-background text-text-primary">
      <AppSidebar />
      <main className="app-main page-medium">
        <div className="max-w-[760px] mx-auto px-6 md:px-8 py-10 pb-24">
          {/* Header */}
          <header className="pb-5 border-b border-border-subtle">
            <div className="flex items-center gap-3">
              <h1 className="text-[28px] font-medium tracking-tight">{headline}</h1>
              <StatusPill session={session} />
            </div>
            <div className="mt-2 font-mono text-[12px] text-text-secondary">{subline}</div>
          </header>

          {/* Accomplishments */}
          <section className="mt-8">
            <h2 className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-tertiary mb-3">
              Accomplishments
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatTile
                value={`+${outcome}`}
                label="Value added"
                highlight
              />
              <StatTile
                value={session.completedActionIds.length}
                label="Actions done"
                positive={allDone}
              />
              <StatTile
                value={(() => {
                  const h = Math.floor(dur / 60);
                  const m = dur % 60;
                  return h > 0 ? `${h}h ${m}m` : `${m}m`;
                })()}
                label="Focused"
              />
              {session.mode !== "continuous" && (
                <StatTile
                  value={`${cyclesDone}/${session.cyclesPlanned}`}
                  label="Cycles"
                />
              )}
              {isEarly && saved > 0 && (
                <StatTile value={`${saved}m`} label="Time saved" positive />
              )}
            </div>
          </section>

          {/* Actions */}
          <section className="mt-8">
            <h2 className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-tertiary mb-3">
              Actions · {session.plannedActionIds.length}
            </h2>
            {session.plannedActionIds.length === 0 ? (
              <div className="text-[13px] text-text-tertiary">No actions were planned.</div>
            ) : (
              <div className="border-t border-border-subtle">
                {session.plannedActionIds.map((aid) => {
                  let status: "done" | "dropped" | "untouched" = "untouched";
                  if (session.completedActionIds.includes(aid)) status = "done";
                  else if (session.droppedActionIds.includes(aid)) status = "dropped";
                  return (
                    <ActionRow
                      key={aid}
                      actionId={aid}
                      status={status}
                      onClick={() =>
                        openPanel({ kind: "action", mode: "edit", id: aid })
                      }
                    />
                  );
                })}
              </div>
            )}
          </section>

          {/* Time breakdown */}
          {logTime && (
            <section className="mt-8">
              <h2 className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-tertiary mb-3">
                Time
              </h2>
              <div className="space-y-1.5 font-mono text-[12px] tabular-nums">
                <div className="text-text-secondary">Planned: {planned} min</div>
                <div className="text-text-primary font-medium">
                  Focused: {focusEstimate} min
                  {focusEstimate < plannedFocus && (
                    <span className="text-text-tertiary font-normal ml-2">
                      ({plannedFocus - focusEstimate}min less than planned)
                    </span>
                  )}
                </div>
                {breakEstimate > 0 && breakBlock > 0 && (
                  <div className="text-text-secondary">Breaks: {breakEstimate} min</div>
                )}
              </div>
            </section>
          )}

          {/* Reflection */}
          {planActive && (
            <section className="mt-8">
              <h2 className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-tertiary mb-3">
                Reflection
              </h2>
              <textarea
                value={reflection}
                onChange={(e) => setReflection(e.target.value)}
                onBlur={() => setSessionReflection(session.id, reflection)}
                placeholder="How did this session go?"
                rows={3}
                className="w-full rounded-[6px] border border-border-subtle bg-surface-raised px-3 py-2 text-[13px] text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent transition-colors resize-none"
              />
            </section>
          )}

          {/* Footer */}
          <footer className="mt-10 flex items-center justify-between">
            <Link
              to="/sessions"
              className="text-[13px] text-text-secondary hover:text-text-primary transition-colors"
            >
              View on /sessions
            </Link>
            <button
              onClick={() => {
                if (reflection !== (session.reflection ?? "")) {
                  setSessionReflection(session.id, reflection);
                }
                navigate(planActive ? "/today" : "/sessions");
              }}
              className="text-[14px] font-medium rounded-[4px] transition-colors"
              style={{
                padding: "10px 24px",
                background: "hsl(var(--accent))",
                color: "hsl(var(--accent-foreground))",
              }}
            >
              Done
            </button>
          </footer>
        </div>
      </main>
    </div>
  );
};

export default SessionSummary;
