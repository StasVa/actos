// Session Summary — full-page review shown after any session ends.

import React, { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AppSidebar } from "@/components/AppSidebar";
import { useStore } from "@/store/useStore";
import { useGoalsQuery } from "@/lib/queries/useGoals";
import { useProjectsQuery } from "@/lib/queries/useProjects";
import { useActionsQuery } from "@/lib/queries/useActions";
import { useSessionsQuery, useSetSessionReflectionMutation } from "@/lib/queries/useSessions";
import { useActionById } from "@/lib/selectors";

import {
  sessionDurationMinutes,
  sessionPlannedMinutes,
  sessionOutcome as outcomeFromSession,
  fmtSessionTime,
} from "@/lib/sessionUtils";
import type { Session } from "@/types";

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
  const { t } = useTranslation();
  const dur = sessionDurationMinutes(session);
  const planned = sessionPlannedMinutes(session);
  const isEarly = session.status === "completed" && dur < planned;
  const label =
    session.status === "aborted"
      ? t("sessionSummary.status.aborted")
      : isEarly
        ? t("sessionSummary.status.completedEarly")
        : t("sessionSummary.status.completed");
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
  const { t } = useTranslation();
  const action = useActionById(actionId);
  const goalsList = useGoalsQuery().data ?? [];
  const goal = action ? goalsList.find((g) => g.id === action.goalId) : undefined;
  const projectsList = useProjectsQuery().data ?? [];
  const project = action?.projectId
    ? projectsList.find((p) => p.id === action.projectId)
    : undefined;
  if (!action) return null;
  const goalColor = goal ? `hsl(var(--${goal.color}))` : "hsl(var(--border-default))";
  const pillColor =
    status === "done"
      ? "hsl(var(--state-active))"
      : status === "dropped"
        ? "hsl(var(--text-warning))"
        : "hsl(var(--text-tertiary))";
  const pillLabel =
    status === "done"
      ? t("sessionSummary.action.done")
      : status === "dropped"
        ? t("sessionSummary.action.dropped")
        : t("sessionSummary.action.notTouched");
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
  const { t, i18n } = useTranslation();
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const sessions = useSessionsQuery().data ?? [];
  const session = sessions.find((x) => x.id === sessionId) ?? null;
  const actions = useActionsQuery().data ?? [];
  const settings = useStore((s) => s.settings);
  const setSessionReflectionMutation = useSetSessionReflectionMutation();
  const setSessionReflection = (id: string, reflection: string) =>
    setSessionReflectionMutation.mutate({ sessionId: id, reflection });
  const openPanel = useStore((s) => s.openPanel);

  const [reflection, setReflection] = useState<string>(session?.reflection ?? "");

  const fmtDateTime = (iso: string): string => {
    const d = new Date(iso);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const sameDay = (a: Date, b: Date) =>
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate();
    const time = fmtSessionTime(iso);
    if (sameDay(d, today)) return t("sessionSummary.date.today", { time });
    if (sameDay(d, yesterday)) return t("sessionSummary.date.yesterday", { time });
    const date = d.toLocaleDateString(i18n.language, {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
    return t("sessionSummary.date.full", { date, time });
  };

  const fmtDur = (mins: number): string => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? t("sessionSummary.duration.hm", { hours: h, minutes: m }) : t("sessionSummary.duration.m", { count: m });
  };

  const computed = useMemo(() => {
    if (!session) return null;
    const dur = sessionDurationMinutes(session);
    const planned = sessionPlannedMinutes(session);
    const outcome = outcomeFromSession(session, actions);
    const focusBlock = session.workDuration;
    const breakBlock = session.breakDuration;
    const cyclesDone = session.cyclesCompleted;
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
            <h1 className="text-[20px] font-medium">{t("sessionSummary.notFound.title")}</h1>
            <p className="mt-2 text-[13px] text-text-secondary">
              {t("sessionSummary.notFound.body")}
            </p>
            <button
              onClick={() => navigate("/sessions")}
              className="mt-6 text-[13px] hover:underline"
              style={{ color: "hsl(var(--accent))" }}
            >
              {t("sessionSummary.notFound.go")}
            </button>
          </div>
        </main>
      </div>
    );
  }

  const { dur, planned, outcome, cyclesDone, focusEstimate, breakEstimate, plannedFocus, breakBlock, isEarly, saved } =
    computed;

  const headline = session.status === "aborted" ? t("sessionSummary.heading.ended") : t("sessionSummary.heading.complete");
  const subline = (() => {
    const date = fmtDateTime(session.startedAt);
    if (session.status === "aborted") return t("sessionSummary.subline.aborted", { date, count: dur });
    if (isEarly) return t("sessionSummary.subline.early", { date, count: dur });
    return t("sessionSummary.subline.normal", { date, count: dur });
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
              {t("sessionSummary.section.accomplishments")}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatTile
                value={`+${outcome}`}
                label={t("sessionSummary.tile.value")}
                highlight
              />
              <StatTile
                value={session.completedActionIds.length}
                label={t("sessionSummary.tile.actions")}
                positive={allDone}
              />
              <StatTile
                value={fmtDur(dur)}
                label={t("sessionSummary.tile.focused")}
              />
              {session.mode !== "continuous" && (
                <StatTile
                  value={`${cyclesDone}/${session.cyclesPlanned}`}
                  label={t("sessionSummary.tile.cycles")}
                />
              )}
              {isEarly && saved > 0 && (
                <StatTile value={`${saved}m`} label={t("sessionSummary.tile.timeSaved")} positive />
              )}
            </div>
          </section>

          {/* Actions */}
          <section className="mt-8">
            <h2 className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-tertiary mb-3">
              {t("sessionSummary.section.actions", { count: session.plannedActionIds.length })}
            </h2>
            {session.plannedActionIds.length === 0 ? (
              <div className="text-[13px] text-text-tertiary">{t("sessionSummary.actions.empty")}</div>
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
                {t("sessionSummary.section.time")}
              </h2>
              <div className="space-y-1.5 font-mono text-[12px] tabular-nums">
                <div className="text-text-secondary">{t("sessionSummary.time.planned", { count: planned })}</div>
                <div className="text-text-primary font-medium">
                  {t("sessionSummary.time.focused", { count: focusEstimate })}
                  {focusEstimate < plannedFocus && (
                    <span className="text-text-tertiary font-normal ml-2">
                      {t("sessionSummary.time.lessThanPlanned", { count: plannedFocus - focusEstimate })}
                    </span>
                  )}
                </div>
                {breakEstimate > 0 && breakBlock > 0 && (
                  <div className="text-text-secondary">{t("sessionSummary.time.breaks", { count: breakEstimate })}</div>
                )}
              </div>
            </section>
          )}

          {/* Reflection */}
          {planActive && (
            <section className="mt-8">
              <h2 className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-tertiary mb-3">
                {t("sessionSummary.section.reflection")}
              </h2>
              <textarea
                value={reflection}
                onChange={(e) => setReflection(e.target.value)}
                onBlur={() => setSessionReflection(session.id, reflection)}
                placeholder={t("sessionSummary.reflection.placeholder")}
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
              {t("sessionSummary.footer.viewLink")}
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
              {t("sessionSummary.footer.done")}
            </button>
          </footer>
        </div>
      </main>
    </div>
  );
};

export default SessionSummary;
