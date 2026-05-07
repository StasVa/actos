import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useStore } from "@/store/useStore";
import { AppSidebar } from "@/components/AppSidebar";
import { MobileHeader } from "@/components/MobileHeader";
import { ConfirmModal } from "@/components/ConfirmModal";
import type { Action, Goal, ID, Session } from "@/types";
import { formatTime } from "@/lib/format";

/* ───────── Helpers ───────── */

function durationMinutes(s: Session): number | null {
  if (!s.endedAt) return null;
  return Math.max(0, Math.round((new Date(s.endedAt).getTime() - new Date(s.startedAt).getTime()) / 60000));
}

function plannedMinutes(s: Session): number {
  if (s.mode === "continuous") return s.workDuration;
  return s.workDuration * s.cyclesPlanned + s.breakDuration * Math.max(0, s.cyclesPlanned - 1);
}

function outcomeFromSession(s: Session, actions: Action[]): number {
  return s.completedActionIds
    .map((id) => actions.find((a) => a.id === id))
    .reduce((sum, a) => sum + (a?.impact ?? 0), 0);
}

function fmtDateTime(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  if (isSameDay(d, today)) return `Today, ${time}`;
  if (isSameDay(d, yesterday)) return `Yesterday, ${time}`;
  return `${d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}, ${time}`;
}

function fmtRelative(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

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
      className="font-mono text-[11px] uppercase tracking-[0.06em] px-2 py-[2px] rounded-[3px]"
      style={{ background: "hsl(var(--surface-hover))", color }}
    >
      {label}
    </span>
  );
};

/* ───────── Session row ───────── */

const SessionRow: React.FC<{
  session: Session;
  outcome: number;
  onClick: () => void;
}> = ({ session, outcome, onClick }) => {
  const dur = durationMinutes(session);
  const planned = plannedMinutes(session);
  const doneCount = session.completedActionIds.length;
  const droppedCount = session.droppedActionIds.length;
  const durStr = dur != null ? formatTime(dur) : "—";

  let modeLine: string;
  if (session.mode === "continuous") {
    modeLine = `Continuous · ${dur != null ? `${dur}min focused` : `${session.workDuration}min planned`}`;
  } else {
    const mode = session.mode === "pomodoro" ? "Pomodoro" : "Custom";
    modeLine = `${mode} · ${session.workDuration}min × ${session.cyclesCompleted}/${session.cyclesPlanned} cycles`;
  }

  const stats: string[] = [];
  if (outcome > 0) stats.push(`+${outcome} value`);
  if (doneCount > 0) stats.push(`${doneCount} done`);
  if (droppedCount > 0) stats.push(`${droppedCount} dropped`);

  const rightLabel =
    session.status === "aborted" && dur != null
      ? `${formatTime(dur)} of ${formatTime(planned)} planned`
      : durStr;

  return (
    <div
      onClick={onClick}
      className="cursor-pointer transition-colors hover:bg-surface-hover border-b border-border-subtle"
      style={{ padding: "14px 20px" }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="text-[14px] font-medium text-text-primary">
          {fmtDateTime(session.startedAt)}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <StatusPill status={session.status} />
          <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-secondary">
            · {rightLabel}
          </span>
        </div>
      </div>
      <div className="mt-1 font-mono text-[12px] text-text-secondary">{modeLine}</div>
      {stats.length > 0 && (
        <div className="mt-0.5 font-mono text-[12px] text-text-secondary">
          {stats.join(" · ")}
        </div>
      )}
    </div>
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

const SessionDetailPanel: React.FC<{
  session: Session;
  onClose: () => void;
  onDelete: () => void;
}> = ({ session, onClose, onDelete }) => {
  const actions = useStore((s) => s.actions);
  const goals = useStore((s) => s.goals);
  const openPanel = useStore((s) => s.openPanel);
  const [menuOpen, setMenuOpen] = useState(false);

  const dur = durationMinutes(session);
  const outcome = outcomeFromSession(session, actions);

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
              {fmtDateTime(session.startedAt)}
            </div>
            <div className="mt-2">
              <StatusPill status={session.status} />
            </div>
          </div>
          <div className="flex items-center gap-1 relative">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="w-7 h-7 inline-flex items-center justify-center rounded-[3px] text-text-tertiary hover:bg-surface-hover hover:text-text-primary"
              aria-label="Session options"
            >
              <span className="text-[16px] -mt-1">⋯</span>
            </button>
            {menuOpen && (
              <div className="absolute right-7 top-7 w-40 z-10 rounded-[4px] border border-border-subtle bg-surface-elevated p-1 shadow-md">
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onDelete();
                  }}
                  className="block w-full text-left text-[12px] px-2 py-1.5 rounded-[3px] hover:bg-surface-hover text-text-warning"
                >
                  Delete session
                </button>
              </div>
            )}
            <button
              onClick={onClose}
              className="w-7 h-7 inline-flex items-center justify-center rounded-[3px] text-text-tertiary hover:bg-surface-hover hover:text-text-primary"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-5 space-y-5">
            <div className="font-mono text-[12px] text-text-secondary">{config}</div>

            <div className="space-y-1.5">
              <div className="text-[14px] text-text-primary">
                Actual: {dur != null ? `${dur}min` : "—"}
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

/* ───────── Active session banner ───────── */

const ActiveSessionBanner: React.FC<{ session: Session }> = ({ session }) => {
  const planned = plannedMinutes(session);
  const elapsed = Math.max(0, Math.round((Date.now() - new Date(session.startedAt).getTime()) / 60000));
  const progress =
    session.mode === "continuous"
      ? `${elapsed}min elapsed`
      : `${session.cyclesCompleted}/${session.cyclesPlanned} cycles · ${elapsed}min of ~${planned}min`;
  return (
    <div
      className="rounded-[6px] border border-border-subtle p-5 flex items-center justify-between gap-4"
      style={{ background: "hsl(var(--surface-elevated))" }}
    >
      <div>
        <div
          className="font-mono text-[11px] uppercase tracking-[0.06em]"
          style={{ color: "hsl(var(--accent))" }}
        >
          ACTIVE SESSION
        </div>
        <div className="mt-1 font-mono text-[12px] text-text-secondary">
          Started {fmtRelative(session.startedAt)} · {progress}
        </div>
      </div>
      <Link
        to="/sessions/active"
        className="h-9 px-4 inline-flex items-center text-[13px] font-medium rounded-[4px] transition-colors"
        style={{
          background: "hsl(var(--accent))",
          color: "hsl(var(--accent-foreground))",
        }}
      >
        Resume
      </Link>
    </div>
  );
};

/* ───────── Page ───────── */

const PrimaryButton: React.FC<{ onClick?: () => void; children: React.ReactNode }> = ({
  onClick,
  children,
}) => (
  <button
    onClick={onClick}
    className="text-[15px] font-medium rounded-[4px] transition-colors"
    style={{
      padding: "12px 24px",
      background: "hsl(var(--accent))",
      color: "hsl(var(--accent-foreground))",
    }}
  >
    {children}
  </button>
);

const Sessions: React.FC = () => {
  const navigate = useNavigate();
  const sessions = useStore((s) => s.sessions);
  const actions = useStore((s) => s.actions);
  const deleteSession = useStore((s) => s.deleteSession);

  const [selectedId, setSelectedId] = useState<ID | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<ID | null>(null);
  const [visibleCount, setVisibleCount] = useState(20);

  const activeSession = useMemo(
    () => sessions.find((s) => s.status === "in_progress") ?? null,
    [sessions],
  );

  const history = useMemo(
    () =>
      sessions
        .filter((s) => s.status !== "in_progress")
        .slice()
        .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()),
    [sessions],
  );

  const stats = useMemo(() => {
    const finished = history;
    const totalMinutes = finished.reduce((sum, s) => sum + (durationMinutes(s) ?? 0), 0);
    const totalOutcome = finished.reduce((sum, s) => sum + outcomeFromSession(s, actions), 0);
    const completed = finished.filter((s) => s.status === "completed").length;
    const completionRate = finished.length > 0 ? Math.round((completed / finished.length) * 100) : 0;
    return {
      count: finished.length,
      totalMinutes,
      totalOutcome,
      completionRate,
    };
  }, [history, actions]);

  const selected = selectedId ? sessions.find((s) => s.id === selectedId) ?? null : null;
  const hasHistory = history.length > 0;

  const handleStart = () => {
    navigate("/sessions/new");
  };

  return (
    <div className="min-h-screen bg-background text-text-primary">
      <AppSidebar />
      <MobileHeader />
      <main className="pl-[var(--sidebar-w,220px)] max-md:pl-0 mx-auto">
        <div className="max-w-[960px] mx-auto px-8 py-8">
          {/* Header */}
          <div className="flex items-end justify-between gap-4 pb-4 border-b border-border-subtle">
            <h1 className="text-[28px] font-medium tracking-tight">Sessions</h1>
            <div className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-tertiary">
              {stats.count} sessions · {formatTime(stats.totalMinutes)} tracked all-time
            </div>
          </div>

          {/* States */}
          {!activeSession && !hasHistory && (
            <div className="py-16 flex flex-col items-center text-center">
              <div className="max-w-[640px] w-full flex flex-col items-center gap-6">
                <PrimaryButton onClick={handleStart}>+ Start a session</PrimaryButton>
                <p className="text-[14px] text-text-secondary leading-[1.6]">
                  Sessions are focused work blocks where you commit to specific actions for a set
                  time.
                  <br />
                  <br />
                  Pick how long you want to work, what you want to do, and the timer keeps you on
                  track. When time runs out, mark what you finished. The app records every session
                  so you can see your real focused time and the value you created.
                  <br />
                  <br />
                  Sessions are also visible on Day, Week, and Month reviews, and on individual
                  project pages.
                </p>
                <button
                  className="text-[13px] hover:underline"
                  style={{ color: "hsl(var(--accent))" }}
                  onClick={() => toast.info("Docs coming soon")}
                >
                  Learn more
                </button>
              </div>
            </div>
          )}

          {(activeSession || hasHistory) && (
            <div className="mt-6 space-y-6">
              {activeSession ? (
                <ActiveSessionBanner session={activeSession} />
              ) : (
                <div className="flex justify-start">
                  <PrimaryButton onClick={handleStart}>+ Start a session</PrimaryButton>
                </div>
              )}

              {hasHistory && (
                <>
                  <div className="font-mono text-[12px] text-text-secondary tabular-nums">
                    {stats.count} sessions · {formatTime(stats.totalMinutes)} focused time ·{" "}
                    +{stats.totalOutcome} value added · {stats.completionRate}% completion rate
                  </div>

                  <div>
                    <div className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-secondary mb-2">
                      RECENT SESSIONS
                    </div>
                    <div className="border-t border-border-subtle">
                      {history.slice(0, visibleCount).map((s) => (
                        <SessionRow
                          key={s.id}
                          session={s}
                          outcome={outcomeFromSession(s, actions)}
                          onClick={() => setSelectedId(s.id)}
                        />
                      ))}
                    </div>
                    {history.length > visibleCount && (
                      <div className="mt-3">
                        <button
                          onClick={() => setVisibleCount((v) => v + 20)}
                          className="text-[13px] hover:underline"
                          style={{ color: "hsl(var(--accent))" }}
                        >
                          Load more
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </main>

      {selected && (
        <SessionDetailPanel
          session={selected}
          onClose={() => setSelectedId(null)}
          onDelete={() => setConfirmDeleteId(selected.id)}
        />
      )}

      <ConfirmModal
        open={!!confirmDeleteId}
        title="Delete this session?"
        body="The session record will be removed. Actions completed during it remain Done/Dropped."
        confirmLabel="Delete"
        destructive
        onCancel={() => setConfirmDeleteId(null)}
        onConfirm={() => {
          if (confirmDeleteId) {
            deleteSession(confirmDeleteId);
            if (selectedId === confirmDeleteId) setSelectedId(null);
            toast.success("Session deleted");
          }
          setConfirmDeleteId(null);
        }}
      />
    </div>
  );
};

export default Sessions;
