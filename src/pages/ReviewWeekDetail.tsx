import React from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { format, parseISO, addDays } from "date-fns";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n";
import { AppSidebar } from "@/components/AppSidebar";
import { SettingsPanel } from "@/components/SettingsPanel";
import { useStore } from "@/store/useStore";
import { formatHM } from "@/lib/timeStats";
import {
  formatWeekLabel,
  getWeekSummary,
  dateFromYearWeek,
  yearWeekFromDate,
  weekRange,
} from "@/lib/weekUtils";
import { ActionRow } from "@/components/ActionRow";
import { AccomplishmentsSection, type AccomplishmentTile } from "@/components/AccomplishmentsSection";
import { OutcomeAddedSection } from "@/components/OutcomeAddedSection";
import { SessionsSection } from "@/components/SessionsSection";
import { getOutcomeSummary } from "@/lib/outcomeUtils";
import { getSessionsForWeek, sessionDurationMinutes } from "@/lib/sessionUtils";
import type { Action, DayType } from "@/types";

const dayTypeLabelKey = (dt?: string): string => {
  switch (dt) {
    case "execution": return "today.dayType.execution";
    case "recovery": return "today.dayType.recovery";
    case "day-off": return "today.dayType.dayOff";
    case "sick": return "today.dayType.sick";
    default: return "";
  }
};

const localizedWeekLabel = (yw: string): string => {
  const r = weekRange(yw);
  if (!r) return formatWeekLabel(yw);
  const sameMonth = r.start.getMonth() === r.end.getMonth();
  const startLabel = r.start.toLocaleDateString(i18n.language, { month: "short", day: "numeric" });
  const endLabel = sameMonth
    ? r.end.toLocaleDateString(i18n.language, { day: "numeric" })
    : r.end.toLocaleDateString(i18n.language, { month: "short", day: "numeric" });
  return i18n.t("reviews.detail.weekLabel", { start: startLabel, end: endLabel });
};

const localizedDayTypeDist = (d: Record<DayType, number>): string => {
  const parts: string[] = [];
  (Object.keys(d) as DayType[]).forEach((k) => {
    if (d[k] > 0) {
      const key = dayTypeLabelKey(k);
      const label = key ? i18n.t(key) : k;
      parts.push(`${d[k]} ${label}`);
    }
  });
  return parts.join(" · ");
};

const localizedEEEMMMd = (iso: string): string =>
  new Date(iso + "T00:00:00").toLocaleDateString(i18n.language, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

const SectionHead: React.FC<{ children: React.ReactNode; meta?: string }> = ({ children, meta }) => (
  <div className="flex items-baseline justify-between mb-3">
    <h2 className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-tertiary">{children}</h2>
    {meta && (
      <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-tertiary tabular-nums">
        {meta}
      </span>
    )}
  </div>
);

const RITUAL_CELL_BG: Record<string, string> = {
  done: "hsl(var(--state-active))",
  skipped: "hsl(var(--surface-hover))",
  missed: "hsl(var(--state-stalled))",
  pending: "hsl(var(--surface-hover))",
  "n/a": "transparent",
};

const ReviewWeekDetail: React.FC = () => {
  const { t } = useTranslation();
  const { yearWeek = "" } = useParams();
  const navigate = useNavigate();
  const [settingsOpen, setSettingsOpen] = React.useState(false);

  const actions = useStore((s) => s.actions);
  const dayEntries = useStore((s) => s.dayEntries);
  const goals = useStore((s) => s.goals);
  const projects = useStore((s) => s.projects);
  const rituals = useStore((s) => s.rituals);
  const settings = useStore((s) => s.settings);
  const openPanel = useStore((s) => s.openPanel);
  const allSessions = useStore((s) => s.sessions);

  const summary = React.useMemo(
    () => getWeekSummary(yearWeek, { actions, dayEntries, goals, projects, rituals }),
    [yearWeek, actions, dayEntries, goals, projects, rituals],
  );

  const prevYearWeek = React.useMemo(() => {
    const d = dateFromYearWeek(yearWeek);
    if (!d) return null;
    return yearWeekFromDate(addDays(d, -7));
  }, [yearWeek]);
  const prevSummary = React.useMemo(
    () =>
      prevYearWeek
        ? getWeekSummary(prevYearWeek, { actions, dayEntries, goals, projects, rituals })
        : null,
    [prevYearWeek, actions, dayEntries, goals, projects, rituals],
  );

  if (!summary) {
    return (
      <div className="min-h-screen bg-surface-base text-text-primary">
        <AppSidebar onOpenSettings={() => setSettingsOpen(true)} />
        <SettingsPanel open={settingsOpen} onOpenChange={setSettingsOpen} />
        <main className="app-main page-medium">
          <Link
            to="/reviews/weeks"
            className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-tertiary hover:text-text-primary transition-colors"
          >
            {t("reviews.detail.backWeeks")}
          </Link>
          <div className="mt-8 text-[14px] text-text-secondary">{t("reviews.detail.invalidWeek")}</div>
        </main>
      </div>
    );
  }

  const goalById = (id: string) => goals.find((g) => g.id === id);
  const projectById = (id: string | null) => (id ? projects.find((p) => p.id === id) : undefined);
  const ritualById = (id: string) => rituals.find((r) => r.id === id);

  const startD = dateFromYearWeek(yearWeek)!;
  const isoWeekNum = format(startD, "I");
  const isoWeekYear = format(startD, "RRRR");
  const dayTypeLine = settings.layers.planAndReview
    ? localizedDayTypeDist(summary.dayTypeDistribution)
    : "";

  const totalMin = summary.totalTimeMinutes;
  const yMaxGoal = Math.max(1, ...summary.perGoalTime.map((p) => p.minutes));

  const outcome = getOutcomeSummary(
    summary.doneActions,
    summary.delegatedActions,
    goals,
    projects,
    actions,
  );
  const prevOutcome = prevSummary
    ? getOutcomeSummary(
        prevSummary.doneActions,
        prevSummary.delegatedActions,
        goals,
        projects,
        actions,
      )
    : null;

  // Top contributing actions: Done, sorted by impact desc, top 10, grouped by goal
  const topActions = [...summary.doneActions]
    .sort((a, b) => (b.impact ?? 0) - (a.impact ?? 0))
    .slice(0, 10);
  const topByGoal = new Map<string, Action[]>();
  for (const a of topActions) {
    const arr = topByGoal.get(a.goalId) ?? [];
    arr.push(a);
    topByGoal.set(a.goalId, arr);
  }

  const openActionEdit = (id: string) => openPanel({ kind: "action", mode: "edit", id });

  return (
    <div className="min-h-screen bg-surface-base text-text-primary">
      <AppSidebar onOpenSettings={() => setSettingsOpen(true)} />
      <SettingsPanel open={settingsOpen} onOpenChange={setSettingsOpen} />
      <main className="app-main page-medium">
        <Link
          to="/reviews/weeks"
          className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-tertiary hover:text-text-primary transition-colors"
        >
          {t("reviews.detail.backWeeks")}
        </Link>
        <h1 className="mt-3 text-[28px] font-medium text-text-primary leading-tight">
          {localizedWeekLabel(yearWeek)}
        </h1>
        <div className="mt-1 font-mono text-[12px] text-text-secondary">
          {t("reviews.detail.weekHeader", { num: isoWeekNum, year: isoWeekYear })}
        </div>
        {dayTypeLine && (
          <div className="mt-0.5 font-mono text-[12px] text-text-secondary">{dayTypeLine}</div>
        )}

        <div className="h-6" />
        <div className="border-t border-border-subtle" />
        <div className="h-8" />

        <div className="space-y-10">
          {/* ACCOMPLISHMENTS */}
          {(() => {
            const tiles: AccomplishmentTile[] = [];
            const actionsCount = summary.doneActions.length;
            const ritualsCount = summary.ritualWeek.reduce((s, r) => s + r.doneCount, 0);
            const prevActionsCount = prevSummary?.doneActions.length ?? null;
            const prevRitualsCount =
              prevSummary?.ritualWeek.reduce((s, r) => s + r.doneCount, 0) ?? null;
            const prevTime = prevSummary?.totalTimeMinutes ?? null;
            const hasAny =
              outcome.valueAdded > 0 ||
              actionsCount > 0 ||
              ritualsCount > 0 ||
              summary.closedProjects.length > 0 ||
              summary.closedGoals.length > 0 ||
              (settings.layers.logTime && totalMin > 0);
            if (hasAny) {
              if (outcome.valueAdded > 0)
                tiles.push({
                  key: "outcome",
                  value: `+${outcome.valueAdded}`,
                  label: t("reviews.detail.tile.valueAdded"),
                  delta:
                    prevOutcome != null
                      ? outcome.valueAdded - prevOutcome.valueAdded
                      : null,
                  deltaLabel: t("reviews.detail.delta.vsLastWeek"),
                });
              tiles.push({
                key: "actions",
                value: String(actionsCount),
                label: t("reviews.detail.tile.actionsDone"),
                delta: prevActionsCount != null ? actionsCount - prevActionsCount : null,
                deltaLabel: t("reviews.detail.delta.vsLastWeek"),
              });
              tiles.push({
                key: "rituals",
                value: String(ritualsCount),
                label: t("reviews.detail.tile.ritualsDone"),
                delta: prevRitualsCount != null ? ritualsCount - prevRitualsCount : null,
                deltaLabel: t("reviews.detail.delta.vsLastWeek"),
              });
              if (settings.layers.logTime && totalMin > 0) {
                const deltaH =
                  prevTime != null
                    ? Math.round(((totalMin - prevTime) / 60) * 10) / 10
                    : null;
                tiles.push({
                  key: "time",
                  value: formatHM(totalMin),
                  label: t("reviews.detail.tile.timeInvested"),
                  delta: deltaH,
                  deltaLabel: t("reviews.detail.delta.hVsLastWeek"),
                });
              }
              if (summary.closedProjects.length > 0)
                tiles.push({
                  key: "projects",
                  value: String(summary.closedProjects.length),
                  label: t("reviews.detail.tile.projectsClosed"),
                });
              if (summary.closedGoals.length > 0)
                tiles.push({
                  key: "goals",
                  value: String(summary.closedGoals.length),
                  label: t("reviews.detail.tile.goalsClosed"),
                });
            }
            return <AccomplishmentsSection tiles={tiles} period="week" />;
          })()}

          {/* GOALS CLOSED */}
          {summary.closedGoals.length > 0 && (
            <section>
              <SectionHead>{t("reviews.detail.section.goalsClosed", { count: summary.closedGoals.length })}</SectionHead>
              <div className="space-y-1">
                {summary.closedGoals.map(({ entity: g, type, at }) => {
                  const goalColor = `hsl(var(--${g.color}))`;
                  const pillColor =
                    type === "completed" ? "hsl(var(--state-active))" : "hsl(var(--state-stalled))";
                  return (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => navigate(`/goals/${g.id}`)}
                      className="w-full flex items-stretch gap-3 rounded-[4px] hover:bg-surface-hover transition-colors text-left overflow-hidden"
                    >
                      <div className="w-[3px] shrink-0 self-stretch" style={{ background: goalColor }} />
                      <div className="flex-1 min-w-0 py-2 pr-3">
                        <div className="flex items-center gap-3">
                          <div className="text-[14px] font-medium text-text-primary truncate flex-1">
                            {g.title}
                          </div>
                          <div
                            className="font-mono text-[10px] uppercase tracking-[0.08em] tabular-nums shrink-0"
                            style={{ color: pillColor }}
                          >
                            {type === "completed" ? t("reviews.detail.pill.completed") : t("reviews.detail.pill.dropped")}
                          </div>
                        </div>
                        <div className="mt-0.5 font-mono text-[11px] text-text-tertiary">
                          {g.type === "mid-term" ? t("reviews.detail.goalType.midTerm") : t("reviews.detail.goalType.shortTerm")} · {parseISO(at).toLocaleDateString(i18n.language, { month: "short", day: "numeric" })}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* PROJECTS CLOSED */}
          {summary.closedProjects.length > 0 && (
            <section>
              <SectionHead>{t("reviews.detail.section.projectsClosed", { count: summary.closedProjects.length })}</SectionHead>
              <div className="space-y-1">
                {summary.closedProjects.map(({ entity: p, type, at }) => {
                  const g = goalById(p.goalId);
                  const goalColor = `hsl(var(--${g?.color ?? "goal-1"}))`;
                  const pillColor =
                    type === "completed" ? "hsl(var(--state-active))" : "hsl(var(--state-stalled))";
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => navigate(`/projects/${p.id}`)}
                      className="w-full flex items-stretch gap-3 rounded-[4px] hover:bg-surface-hover transition-colors text-left overflow-hidden"
                    >
                      <div className="w-[3px] shrink-0 self-stretch" style={{ background: goalColor }} />
                      <div className="flex-1 min-w-0 py-2 pr-3">
                        <div className="flex items-center gap-3">
                          <div className="text-[14px] font-medium text-text-primary truncate flex-1">
                            {p.title}
                          </div>
                          <div
                            className="font-mono text-[10px] uppercase tracking-[0.08em] tabular-nums shrink-0"
                            style={{ color: pillColor }}
                          >
                            {type === "completed" ? t("reviews.detail.pill.completed") : t("reviews.detail.pill.dropped")}
                          </div>
                        </div>
                        <div className="mt-0.5 font-mono text-[11px] text-text-tertiary">
                          {g?.title ?? t("reviews.detail.dash")} · {parseISO(at).toLocaleDateString(i18n.language, { month: "short", day: "numeric" })}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* VALUE ADDED */}
          <OutcomeAddedSection outcome={outcome} period="week" />

          {/* TIME INVESTED */}
          {settings.layers.logTime && totalMin > 0 && (
            <section>
              <SectionHead meta={formatHM(totalMin).toUpperCase()}>{t("reviews.detail.section.timeInvested")}</SectionHead>
              <div className="space-y-2">
                {summary.perGoalTime
                  .filter((row) => row.minutes > 0)
                  .map((row) => {
                    const g = goalById(row.goalId);
                    if (!g) return null;
                    const pct = (row.minutes / yMaxGoal) * 100;
                    return (
                      <div key={row.goalId}>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2 w-[220px] min-w-0">
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ background: `hsl(var(--${g.color}))` }}
                            />
                            <span className="text-[13px] text-text-primary truncate">{g.title}</span>
                            <span className="font-mono text-[11px] text-text-tertiary tabular-nums">
                              {Math.round(row.percentage)}%
                            </span>
                          </div>
                          <div className="flex-1 h-2 rounded-[2px] bg-surface-hover overflow-hidden">
                            <div
                              className="h-full rounded-[2px]"
                              style={{ width: `${pct}%`, background: `hsl(var(--${g.color}))` }}
                            />
                          </div>
                          <div className="w-[80px] text-right font-mono text-[12px] tabular-nums text-text-secondary">
                            {formatHM(row.minutes)}
                          </div>
                        </div>
                        {row.projects.length > 0 && (
                          <div className="mt-1 mb-1 pl-[18px] space-y-0.5">
                            {row.projects.map((p) => {
                              const proj = projectById(p.projectId);
                              return (
                                <div key={p.projectId} className="flex items-center gap-2">
                                  <span className="font-mono text-[12px] text-text-tertiary leading-none">
                                    └
                                  </span>
                                  <span className="text-[13px] text-text-secondary truncate flex-1">
                                    {proj?.title ?? t("reviews.detail.dash")}
                                  </span>
                                  <span className="font-mono text-[12px] tabular-nums text-text-tertiary">
                                    {formatHM(p.minutes)}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </section>
          )}

          {/* SESSIONS */}
          {(() => {
            const sessionsForWk = getSessionsForWeek(allSessions, yearWeek);
            if (sessionsForWk.length === 0) return null;
            const focusMin = sessionsForWk.reduce((s, x) => s + sessionDurationMinutes(x), 0);
            return (
              <section>
                <SectionHead meta={t("reviews.detail.section.sessionsMeta", { time: formatHM(focusMin).toUpperCase() })}>
                  {t("reviews.detail.section.sessions", { count: sessionsForWk.length })}
                </SectionHead>
                <SessionsSection sessions={sessionsForWk} variant="by-day" showStats initialLimit={10} />
              </section>
            );
          })()}

          {/* DAYS */}
          <section>
            <SectionHead meta={String(summary.days.length)}>{t("reviews.detail.section.days")}</SectionHead>
            <div className="rounded-[6px] border border-border-subtle overflow-hidden">
              {summary.days.map((d) => {
                const entry = summary.dayEntriesByDate[d];
                const dayActs = summary.doneActions.filter(
                  (a) => a.completedAt?.slice(0, 10) === d,
                );
                const ritualsDoneCount = summary.ritualWeek.reduce((s, r) => {
                  const inst = r.instances.find((i) => i.date === d);
                  return s + (inst?.status === "done" ? 1 : 0);
                }, 0);
                const dayMin = dayActs.reduce((s, a) => s + (a.timeEstimateMinutes ?? 0), 0);
                const hasActivity = !!entry || dayActs.length > 0;
                if (!hasActivity) {
                  return (
                    <div
                      key={d}
                      className="flex items-center gap-3 px-4 py-3 border-b border-border-subtle last:border-b-0"
                    >
                      <span className="text-[13px] text-text-tertiary w-[80px]">
                        {localizedEEEMMMd(d)}
                      </span>
                      <span className="font-mono text-[12px] text-text-tertiary italic">
                        {t("reviews.detail.day.noActivity")}
                      </span>
                    </div>
                  );
                }
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => navigate(`/reviews/days/${d}`)}
                    className="w-full flex items-center gap-3 px-4 py-3 border-b border-border-subtle last:border-b-0 hover:bg-surface-hover transition-colors text-left"
                  >
                    <span className="text-[13px] font-medium text-text-primary w-[80px] shrink-0">
                      {localizedEEEMMMd(d)}
                    </span>
                    {entry?.dayType && (
                      <span className="font-mono text-[10px] uppercase tracking-[0.06em] px-1.5 py-0.5 rounded-[3px] bg-surface-hover text-text-secondary">
                        {t(dayTypeLabelKey(entry.dayType))}
                      </span>
                    )}
                    <span className="font-mono text-[12px] text-text-secondary tabular-nums flex-1 truncate">
                      {t("reviews.detail.actionsCount", { count: dayActs.length })}
                      {ritualsDoneCount > 0 && (
                        <>
                          <span className="text-text-tertiary"> · </span>
                          {t("reviews.detail.ritualsCount", { count: ritualsDoneCount })}
                        </>
                      )}
                      {settings.layers.logTime && dayMin > 0 && (
                        <>
                          <span className="text-text-tertiary"> · </span>
                          <span className="text-text-primary">{formatHM(dayMin)}</span>
                        </>
                      )}
                    </span>
                    <span className="text-text-tertiary">→</span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* ACTIONS THIS WEEK */}
          {(topActions.length > 0 ||
            summary.delegatedActions.length > 0 ||
            summary.droppedActions.length > 0 ||
            summary.cancelledActions.length > 0) && (
            <section>
              <SectionHead
                meta={String(topActions.length + summary.delegatedActions.length + summary.droppedActions.length + summary.cancelledActions.length)}
              >
                {t("reviews.detail.section.actionsThisWeek")}
              </SectionHead>
              <div className="space-y-5">
                {topActions.length > 0 && (
                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-text-tertiary mb-1.5">
                      {topActions.length === summary.doneActions.length
                        ? t("reviews.detail.subgroup.done", { count: topActions.length })
                        : t("reviews.detail.subgroup.doneTop", { count: topActions.length })}
                    </div>
                    {Array.from(topByGoal.entries()).map(([gid, list]) => {
                      const g = goalById(gid);
                      return (
                        <div key={gid} className="mb-2">
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ background: `hsl(var(--${g?.color ?? "goal-1"}))` }}
                            />
                            <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-tertiary">
                              {g?.title ?? t("reviews.detail.dash")} · {list.length}
                            </span>
                          </div>
                          {list.map((a) => (
                            <ActionRow
                              key={a.id}
                              action={a}
                              hideCheckbox
                              terminal
                              rightPill={{ kind: "done" }}
                              onClick={() => openActionEdit(a.id)}
                            />
                          ))}
                        </div>
                      );
                    })}
                  </div>
                )}
                {summary.delegatedActions.length > 0 && (
                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-text-tertiary mb-1.5">
                      {t("reviews.detail.subgroup.delegated", { count: summary.delegatedActions.length })}
                    </div>
                    {summary.delegatedActions.map((a) => (
                      <ActionRow
                        key={a.id}
                        action={a}
                        hideCheckbox
                        terminal
                        onClick={() => openActionEdit(a.id)}
                      />
                    ))}
                  </div>
                )}
                {summary.droppedActions.length > 0 && (
                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-text-tertiary mb-1.5">
                      {t("reviews.detail.subgroup.dropped", { count: summary.droppedActions.length })}
                    </div>
                    {summary.droppedActions.map((a) => (
                      <ActionRow
                        key={a.id}
                        action={a}
                        hideCheckbox
                        terminal
                        onClick={() => openActionEdit(a.id)}
                      />
                    ))}
                  </div>
                )}
                {summary.cancelledActions.length > 0 && (
                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-text-tertiary mb-1.5">
                      {t("reviews.detail.subgroup.cancelled", { count: summary.cancelledActions.length })}
                    </div>
                    {summary.cancelledActions.map((a) => (
                      <ActionRow
                        key={a.id}
                        action={a}
                        hideCheckbox
                        terminal
                        onClick={() => openActionEdit(a.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </section>
          )}

          {/* RITUALS */}
          {summary.ritualWeek.filter((r) => r.scheduledCount > 0).length > 0 && (
            <section>
              <SectionHead
                meta={t("reviews.detail.section.activeMeta", { count: summary.ritualWeek.filter((r) => r.scheduledCount > 0).length })}
              >
                {t("reviews.detail.section.rituals", { count: summary.ritualWeek.filter((r) => r.scheduledCount > 0).length })}
              </SectionHead>
              <div className="space-y-2">
                {summary.ritualWeek
                  .filter((r) => r.scheduledCount > 0)
                  .map((rw) => {
                    const r = ritualById(rw.ritualId);
                    if (!r) return null;
                    const g = goalById(r.goalId);
                    const goalColor = `hsl(var(--${g?.color ?? "goal-1"}))`;
                    return (
                      <button
                        key={rw.ritualId}
                        type="button"
                        onClick={() =>
                          openPanel({ kind: "ritual", mode: "edit", id: rw.ritualId })
                        }
                        className="w-full flex items-stretch gap-3 rounded-[4px] hover:bg-surface-hover transition-colors text-left overflow-hidden"
                      >
                        <div className="w-[3px] shrink-0 self-stretch" style={{ background: goalColor }} />
                        <div className="flex-1 min-w-0 py-2 pr-3">
                          <div className="flex items-center gap-3">
                            <div className="text-[14px] font-medium text-text-primary truncate flex-1">
                              {r.title}
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              {rw.instances.map((inst, i) => (
                                <span
                                  key={i}
                                  title={`${parseISO(inst.date).toLocaleDateString(i18n.language, { weekday: "short" })}: ${t(`reviews.detail.ritualStatus.${inst.status === "n/a" ? "na" : inst.status}`, { defaultValue: inst.status })}`}
                                  className="w-3 h-3 rounded-[2px]"
                                  style={{
                                    background: RITUAL_CELL_BG[inst.status] ?? "transparent",
                                    border:
                                      inst.status === "n/a"
                                        ? "1px dashed hsl(var(--border-subtle))"
                                        : "none",
                                  }}
                                />
                              ))}
                            </div>
                          </div>
                          <div className="mt-0.5 font-mono text-[11px] text-text-tertiary tabular-nums">
                            {t("reviews.detail.ritual.scheduleSummary", { schedule: r.schedule, done: rw.doneCount, scheduled: rw.scheduledCount })}
                            {rw.skippedCount > 0 && (
                              <>
                                {" · "}
                                {t("reviews.detail.ritual.skippedExtra", { count: rw.skippedCount })}
                              </>
                            )}
                            {rw.missedCount > 0 && (
                              <>
                                {" · "}
                                {t("reviews.detail.ritual.missedExtra", { count: rw.missedCount })}
                              </>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
              </div>
            </section>
          )}

          {summary.doneActions.length === 0 &&
            summary.closedProjects.length === 0 &&
            summary.closedGoals.length === 0 &&
            summary.reflections.length === 0 && (
              <div className="text-center py-12 text-[14px] text-text-secondary">
                {t("reviews.detail.week.noActivity")}
              </div>
            )}
        </div>

        <div className="h-12" />
      </main>
    </div>
  );
};

export default ReviewWeekDetail;
