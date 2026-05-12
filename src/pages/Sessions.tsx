import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useStore } from "@/store/useStore";
import { useGoalsQuery } from "@/lib/queries/useGoals";
import { useActionsQuery } from "@/lib/queries/useActions";
import { AppSidebar } from "@/components/AppSidebar";
import { ConfirmModal } from "@/components/ConfirmModal";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { FilterDropdown, FilterOption } from "@/components/FilterDropdown";
import { SortDropdown } from "@/components/SortDropdown";
import type { Action, Goal, ID, Session } from "@/types";
import { formatTime } from "@/lib/format";
import i18n from "@/i18n";

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

function fmtDateTime(iso: string, t: (k: string, opts?: any) => string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
  const lng = i18n.language || "en";
  const time = d.toLocaleTimeString(lng, { hour: "numeric", minute: "2-digit" });
  if (isSameDay(d, today)) return t("sessions.dateTime.today", { time });
  if (isSameDay(d, yesterday)) return t("sessions.dateTime.yesterday", { time });
  const date = d.toLocaleDateString(lng, { weekday: "short", month: "short", day: "numeric" });
  return t("sessions.dateTime.other", { date, time });
}

function fmtRelative(iso: string, t: (k: string, opts?: any) => string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return t("sessions.relTime.justNow");
  if (m < 60) return t("sessions.relTime.minAgo", { n: m });
  const h = Math.floor(m / 60);
  if (h < 24) return t("sessions.relTime.hoursAgo", { n: h });
  return t("sessions.relTime.daysAgo", { n: Math.floor(h / 24) });
}

/* ───────── Status pill ───────── */

const StatusPill: React.FC<{ status: Session["status"] }> = ({ status }) => {
  const { t } = useTranslation();
  const color =
    status === "completed"
      ? "hsl(var(--state-active))"
      : status === "aborted"
      ? "hsl(var(--text-warning))"
      : "hsl(var(--accent))";
  const label =
    status === "in_progress"
      ? t("sessions.statusActive")
      : status === "completed"
      ? t("sessions.statusCompleted")
      : t("sessions.statusAborted");
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
  const { t } = useTranslation();
  const dur = durationMinutes(session);
  const planned = plannedMinutes(session);
  const doneCount = session.completedActionIds.length;
  const droppedCount = session.droppedActionIds.length;
  const durStr = dur != null ? formatTime(dur) : "—";

  let modeLine: string;
  if (session.mode === "continuous") {
    const label =
      dur != null
        ? t("sessions.row.minFocused", { n: dur })
        : t("sessions.row.minPlanned", { n: session.workDuration });
    modeLine = t("sessions.row.continuous", { label });
  } else {
    const mode = session.mode === "pomodoro" ? t("sessions.section.modePomodoro") : t("sessions.modeCustom");
    modeLine = t("sessions.row.cycles", {
      mode,
      work: session.workDuration,
      done: session.cyclesCompleted,
      total: session.cyclesPlanned,
    });
  }

  const stats: string[] = [];
  if (outcome > 0) stats.push(t("sessions.stats.value", { n: outcome }));
  if (doneCount > 0) stats.push(t("sessions.stats.done", { n: doneCount }));
  if (droppedCount > 0) stats.push(t("sessions.stats.dropped", { n: droppedCount }));

  const rightLabel =
    session.status === "aborted" && dur != null
      ? t("sessions.row.ofPlanned", { actual: formatTime(dur), planned: formatTime(planned) })
      : durStr;

  return (
    <div
      onClick={onClick}
      className="cursor-pointer transition-colors hover:bg-surface-hover border-b border-border-subtle"
      style={{ padding: "14px 20px" }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="text-[14px] font-medium text-text-primary">
          {fmtDateTime(session.startedAt, t)}
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
  const { t } = useTranslation();
  if (!action) return null;
  const goalColor = goal ? `hsl(var(--${goal.color}))` : "hsl(var(--border-default))";
  const pillColor =
    status === "done"
      ? "hsl(var(--state-active))"
      : status === "dropped"
      ? "hsl(var(--text-warning))"
      : "hsl(var(--text-tertiary))";
  const pillLabel =
    status === "untouched"
      ? t("common.label.notTouched")
      : status === "done"
      ? t("common.label.done")
      : t("common.label.dropped");
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
  const { t } = useTranslation();
  const actions = useActionsQuery().data ?? [];
  const goals = useGoalsQuery().data ?? [];
  const openPanel = useStore((s) => s.openPanel);
  const [menuOpen, setMenuOpen] = useState(false);

  const dur = durationMinutes(session);
  const outcome = outcomeFromSession(session, actions);

  const breakStr = session.mode === "continuous" ? "—" : t("sessions.detail.breakMin", { n: session.breakDuration });
  const modeLabel =
    session.mode === "pomodoro"
      ? t("sessions.section.modePomodoro")
      : session.mode === "continuous"
      ? t("sessions.modeContinuous")
      : t("sessions.modeCustom");
  const config = t("sessions.detail.config", {
    mode: modeLabel,
    work: session.workDuration,
    breakStr,
    cycles: session.cyclesPlanned,
  });

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
              {fmtDateTime(session.startedAt, t)}
            </div>
            <div className="mt-2">
              <StatusPill status={session.status} />
            </div>
          </div>
          <div className="flex items-center gap-1 relative">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="w-7 h-7 inline-flex items-center justify-center rounded-[3px] text-text-tertiary hover:bg-surface-hover hover:text-text-primary"
              aria-label={t("sessions.detail.aria.options")}
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
                  {t("sessions.detail.menu.delete")}
                </button>
              </div>
            )}
            <button
              onClick={onClose}
              className="w-7 h-7 inline-flex items-center justify-center rounded-[3px] text-text-tertiary hover:bg-surface-hover hover:text-text-primary"
              aria-label={t("sessions.detail.aria.close")}
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
                {t("sessions.detail.actual", { label: dur != null ? `${dur}min` : "—" })}
              </div>
              <div className="text-[14px] text-text-primary">
                {t("sessions.detail.completedCycles", { done: session.cyclesCompleted, total: session.cyclesPlanned })}
              </div>
              <div
                className="text-[14px]"
                style={{
                  color: outcome > 0 ? "hsl(var(--state-active))" : "hsl(var(--text-secondary))",
                }}
              >
                {outcome > 0 ? t("sessions.detail.impactAdded", { n: outcome }) : t("sessions.detail.zeroImpact")}
              </div>
            </div>

            <div>
              <div className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-secondary mb-2">
                {t("sessions.detail.actionsHeader", { n: session.plannedActionIds.length })}
              </div>
              {session.plannedActionIds.length === 0 ? (
                <div className="text-[13px] text-text-tertiary">{t("sessions.detail.noActions")}</div>
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
  const { t } = useTranslation();
  const planned = plannedMinutes(session);
  const elapsed = Math.max(0, Math.round((Date.now() - new Date(session.startedAt).getTime()) / 60000));
  const progress =
    session.mode === "continuous"
      ? t("sessions.banner.elapsed", { n: elapsed })
      : t("sessions.banner.cyclesProgress", {
          done: session.cyclesCompleted,
          total: session.cyclesPlanned,
          elapsed,
          planned,
        });
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
          {t("sessions.banner.label")}
        </div>
        <div className="mt-1 font-mono text-[12px] text-text-secondary">
          {t("sessions.banner.startedProgress", { rel: fmtRelative(session.startedAt, t), progress })}
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
        {t("sessions.banner.resume")}
      </Link>
    </div>
  );
};

/* ───────── Page ───────── */

type ModeFilter = "all" | "pomodoro" | "continuous";
type DateFilter = "all" | "7" | "30" | "90";
type SSortKey = "recent" | "oldest" | "duration" | "outcome";

function useModeOptions(t: (k: string) => string): FilterOption<ModeFilter>[] {
  return [
    { value: "all", label: t("common.all") },
    { value: "pomodoro", label: t("sessions.section.modePomodoro") },
    { value: "continuous", label: t("sessions.modeContinuous") },
  ];
}
function useDateOptions(t: (k: string) => string): FilterOption<DateFilter>[] {
  return [
    { value: "all", label: t("actions.filter.allTime") },
    { value: "7", label: t("sessions.filter.dateLast7") },
    { value: "30", label: t("sessions.filter.dateLast30") },
    { value: "90", label: t("sessions.filter.dateLast90") },
  ];
}
function useSortOptions(t: (k: string) => string): FilterOption<SSortKey>[] {
  return [
    { value: "recent", label: t("actions.sort.recent") },
    { value: "oldest", label: t("actions.sort.oldest") },
    { value: "duration", label: t("common.sort.longest") },
    { value: "outcome", label: t("common.sort.mostValue") },
  ];
}

const Sessions: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const sessions = useStore((s) => s.sessions);
  const actions = useActionsQuery().data ?? [];
  const deleteSession = useStore((s) => s.deleteSession);

  const [selectedId, setSelectedId] = useState<ID | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<ID | null>(null);
  const [visibleCount, setVisibleCount] = useState(20);
  const [modeFilter, setModeFilter] = useState<ModeFilter>("all");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [sortKey, setSortKey] = useState<SSortKey>("recent");

  const MODE_OPTIONS = useModeOptions(t);
  const SDATE_OPTIONS = useDateOptions(t);
  const SSORT_OPTIONS = useSortOptions(t);

  const activeSession = useMemo(
    () => sessions.find((s) => s.status === "in_progress") ?? null,
    [sessions],
  );

  const allFinished = useMemo(
    () => sessions.filter((s) => s.status !== "in_progress"),
    [sessions],
  );

  const history = useMemo(() => {
    const cutoff = dateFilter === "all" ? null : Date.now() - parseInt(dateFilter, 10) * 86400000;
    let arr = allFinished.filter((s) => {
      if (modeFilter !== "all" && s.mode !== modeFilter) return false;
      if (cutoff && new Date(s.startedAt).getTime() < cutoff) return false;
      return true;
    });
    arr = arr.slice().sort((a, b) => {
      switch (sortKey) {
        case "oldest":
          return new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime();
        case "duration":
          return (durationMinutes(b) ?? 0) - (durationMinutes(a) ?? 0);
        case "outcome":
          return outcomeFromSession(b, actions) - outcomeFromSession(a, actions);
        default:
          return new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime();
      }
    });
    return arr;
  }, [allFinished, modeFilter, dateFilter, sortKey, actions]);

  const stats = useMemo(() => {
    const totalMinutes = allFinished.reduce((sum, s) => sum + (durationMinutes(s) ?? 0), 0);
    const totalOutcome = allFinished.reduce((sum, s) => sum + outcomeFromSession(s, actions), 0);
    const completed = allFinished.filter((s) => s.status === "completed").length;
    const completionRate = allFinished.length > 0 ? Math.round((completed / allFinished.length) * 100) : 0;
    return {
      count: allFinished.length,
      totalMinutes,
      totalOutcome,
      completionRate,
    };
  }, [allFinished, actions]);

  const selected = selectedId ? sessions.find((s) => s.id === selectedId) ?? null : null;
  const hasHistory = allFinished.length > 0;

  const handleStart = () => {
    navigate("/sessions/new");
  };

  const totalHours = Math.round((stats.totalMinutes / 60) * 10) / 10;

  return (
    <div className="min-h-screen bg-background text-text-primary">
      <AppSidebar />
      <main className="app-main page-medium">
        <div className="px-4 md:px-10 pt-6 pb-4">
          <PageHeader
            title={t("sessions.page.title")}
            meta={t("sessions.meta", { count: stats.count, hours: totalHours })}
            cta={{
              label: t("sessions.cta.start"),
              onClick: handleStart,
              ariaLabel: t("sessions.aria.start"),
            }}
            filters={
              <>
                <FilterDropdown<ModeFilter>
                  label={t("common.label.mode")}
                  value={modeFilter}
                  defaultValue="all"
                  options={MODE_OPTIONS}
                  onChange={setModeFilter}
                />
                <FilterDropdown<DateFilter>
                  label={t("common.label.date")}
                  value={dateFilter}
                  defaultValue="all"
                  options={SDATE_OPTIONS}
                  onChange={setDateFilter}
                />
              </>
            }
            sort={
              <SortDropdown<SSortKey> value={sortKey} options={SSORT_OPTIONS} onChange={setSortKey} />
            }
          />
        </div>
        <div className="max-w-[960px] mx-auto px-8">


          {/* States */}
          {!activeSession && !hasHistory && (
            <EmptyState
              headline={t("sessions.empty.headline")}
              description={t("sessions.empty.description")}
              ctaLabel={t("sessions.empty.cta")}
              onCta={handleStart}
              hint={
                actions.filter((a) => a.status === "backlog" || a.status === "planned").length === 0
                  ? t("sessions.empty.hint")
                  : null
              }
            />
          )}

          {(activeSession || hasHistory) && (
            <div className="mt-6 space-y-6">
              {activeSession && <ActiveSessionBanner session={activeSession} />}

              {hasHistory && (
                <>
                  <div className="font-mono text-[12px] text-text-secondary tabular-nums">
                    {t("sessions.history.statsLine", {
                      count: stats.count,
                      focused: formatTime(stats.totalMinutes),
                      value: stats.totalOutcome,
                      rate: stats.completionRate,
                    })}
                  </div>

                  <div>
                    <div className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-secondary mb-2">
                      {t("sessions.history.recentHeading")}
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
                          {t("sessions.history.loadMore")}
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
        title={t("sessions.confirm.delete.title")}
        body={t("sessions.confirm.delete.body")}
        confirmLabel={t("sessions.confirm.delete.confirmLabel")}
        destructive
        onCancel={() => setConfirmDeleteId(null)}
        onConfirm={() => {
          if (confirmDeleteId) {
            deleteSession(confirmDeleteId);
            if (selectedId === confirmDeleteId) setSelectedId(null);
            toast.success(t("sessions.toast.deleted"));
          }
          setConfirmDeleteId(null);
        }}
      />
    </div>
  );
};

export default Sessions;
