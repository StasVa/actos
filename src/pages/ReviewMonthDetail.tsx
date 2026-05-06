import React from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { AppSidebar } from "@/components/AppSidebar";
import { SettingsPanel } from "@/components/SettingsPanel";
import { useStore, ritualMultiplier } from "@/store/useStore";
import { formatHM } from "@/lib/timeStats";
import {
  formatMonthLabel,
  formatMonthDayTypeDistribution,
  getMonthSummary,
  yearMonthFromDate,
  dateFromYearMonth,
} from "@/lib/monthUtils";
import {
  formatWeekLabel,
  formatWeekRelative,
  weekRange,
} from "@/lib/weekUtils";
import { ActionRow } from "@/components/ActionRow";
import { AccomplishmentsSection, type AccomplishmentTile } from "@/components/AccomplishmentsSection";
import { OutcomeAddedSection } from "@/components/OutcomeAddedSection";
import { SessionsSection } from "@/components/SessionsSection";
import { getOutcomeSummary } from "@/lib/outcomeUtils";
import { getSessionsForMonth, sessionDurationMinutes } from "@/lib/sessionUtils";
import { addMonths } from "date-fns";
import { DAY_TYPE_LABELS } from "./Index";
import type { Action } from "@/types";

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

const ReviewMonthDetail: React.FC = () => {
  const { yearMonth = "" } = useParams();
  const navigate = useNavigate();
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [showAllReflections, setShowAllReflections] = React.useState(false);

  const actions = useStore((s) => s.actions);
  const dayEntries = useStore((s) => s.dayEntries);
  const goals = useStore((s) => s.goals);
  const projects = useStore((s) => s.projects);
  const rituals = useStore((s) => s.rituals);
  const settings = useStore((s) => s.settings);
  const openPanel = useStore((s) => s.openPanel);
  const allSessions = useStore((s) => s.sessions);

  const summary = React.useMemo(
    () => getMonthSummary(yearMonth, { actions, dayEntries, goals, projects, rituals }),
    [yearMonth, actions, dayEntries, goals, projects, rituals],
  );

  const prevYearMonth = React.useMemo(() => {
    const d = dateFromYearMonth(yearMonth);
    if (!d) return null;
    return yearMonthFromDate(addMonths(d, -1));
  }, [yearMonth]);
  const prevSummary = React.useMemo(
    () =>
      prevYearMonth
        ? getMonthSummary(prevYearMonth, { actions, dayEntries, goals, projects, rituals })
        : null,
    [prevYearMonth, actions, dayEntries, goals, projects, rituals],
  );

  if (!summary) {
    return (
      <div className="min-h-screen bg-surface-base text-text-primary">
        <AppSidebar onOpenSettings={() => setSettingsOpen(true)} />
        <SettingsPanel open={settingsOpen} onOpenChange={setSettingsOpen} />
        <main className="ml-[var(--sidebar-w,220px)] px-8 py-6 max-w-[900px]">
          <Link
            to="/reviews/months"
            className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-tertiary hover:text-text-primary transition-colors"
          >
            ← REVIEWS / MONTHS
          </Link>
          <div className="mt-8 text-[14px] text-text-secondary">Invalid month.</div>
        </main>
      </div>
    );
  }

  const goalById = (id: string) => goals.find((g) => g.id === id);
  const projectById = (id: string | null) => (id ? projects.find((p) => p.id === id) : undefined);
  const ritualById = (id: string) => rituals.find((r) => r.id === id);

  const dayTypeLine = settings.layers.planAndReview
    ? formatMonthDayTypeDistribution(summary.dayTypeDistribution)
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

  // Top contributing actions: top 15 by impact, grouped by goal
  const topActions = [...summary.doneActions]
    .sort((a, b) => (b.impact ?? 0) - (a.impact ?? 0))
    .slice(0, 15);
  const topByGoal = new Map<string, Action[]>();
  for (const a of topActions) {
    const arr = topByGoal.get(a.goalId) ?? [];
    arr.push(a);
    topByGoal.set(a.goalId, arr);
  }

  const openActionEdit = (id: string) => openPanel({ kind: "action", mode: "edit", id });

  // Energy weekly bars
  const energyMax = 10;
  const weekRangeLabel = (yw: string): string => {
    const r = weekRange(yw);
    if (!r) return yw;
    return `${format(r.start, "MMM d")} — ${format(r.end, "MMM d")}`;
  };

  const ritualMonthRows = summary.ritualMonth.filter((r) => r.scheduledCount > 0);

  return (
    <div className="min-h-screen bg-surface-base text-text-primary">
      <AppSidebar onOpenSettings={() => setSettingsOpen(true)} />
      <SettingsPanel open={settingsOpen} onOpenChange={setSettingsOpen} />
      <main className="ml-[var(--sidebar-w,220px)] px-8 py-6 max-w-[900px]">
        <Link
          to="/reviews/months"
          className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-tertiary hover:text-text-primary transition-colors"
        >
          ← REVIEWS / MONTHS
        </Link>
        <h1 className="mt-3 text-[28px] font-medium text-text-primary leading-tight">
          {formatMonthLabel(yearMonth)}
        </h1>
        <div className="mt-1 font-mono text-[12px] text-text-secondary">
          {summary.days.length} days · {summary.weeks.length} weeks tracked
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
            const ritualsCount = summary.ritualMonth.reduce((s, r) => s + r.doneCount, 0);
            const prevActionsCount = prevSummary?.doneActions.length ?? null;
            const prevRitualsCount =
              prevSummary?.ritualMonth.reduce((s, r) => s + r.doneCount, 0) ?? null;
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
                  label: "Value added",
                  delta:
                    prevOutcome != null
                      ? outcome.valueAdded - prevOutcome.valueAdded
                      : null,
                  deltaLabel: "vs last month",
                });
              tiles.push({
                key: "actions",
                value: String(actionsCount),
                label: "Actions done",
                delta: prevActionsCount != null ? actionsCount - prevActionsCount : null,
                deltaLabel: "vs last month",
              });
              tiles.push({
                key: "rituals",
                value: String(ritualsCount),
                label: "Rituals done",
                delta: prevRitualsCount != null ? ritualsCount - prevRitualsCount : null,
                deltaLabel: "vs last month",
              });
              if (settings.layers.logTime && totalMin > 0) {
                const deltaH =
                  prevTime != null
                    ? Math.round(((totalMin - prevTime) / 60) * 10) / 10
                    : null;
                tiles.push({
                  key: "time",
                  value: formatHM(totalMin),
                  label: "Time invested",
                  delta: deltaH,
                  deltaLabel: "h vs last month",
                });
              }
              if (summary.closedProjects.length > 0)
                tiles.push({
                  key: "projects",
                  value: String(summary.closedProjects.length),
                  label: "Projects closed",
                });
              if (summary.closedGoals.length > 0)
                tiles.push({
                  key: "goals",
                  value: String(summary.closedGoals.length),
                  label: "Goals closed",
                });
            }
            return <AccomplishmentsSection tiles={tiles} period="month" />;
          })()}

          {/* GOALS CLOSED */}
          {summary.closedGoals.length > 0 && (
            <section>
              <SectionHead meta={`${summary.closedGoals.length}`}>Goals closed</SectionHead>
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
                            {type === "completed" ? "COMPLETED" : "DROPPED"}
                          </div>
                        </div>
                        <div className="mt-0.5 font-mono text-[11px] text-text-tertiary">
                          {g.type === "mid-term" ? "MID-TERM" : "SHORT-TERM"} · {format(parseISO(at), "MMM d")}
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
              <SectionHead meta={`${summary.closedProjects.length}`}>Projects closed</SectionHead>
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
                            {type === "completed" ? "COMPLETED" : "DROPPED"}
                          </div>
                        </div>
                        <div className="mt-0.5 font-mono text-[11px] text-text-tertiary">
                          {g?.title ?? "—"} · {format(parseISO(at), "MMM d")}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* VALUE ADDED */}
          <OutcomeAddedSection outcome={outcome} period="month" />

          {/* ENERGY section removed */}

          {/* TIME INVESTED */}
          {settings.layers.logTime && totalMin > 0 && (
            <section>
              <SectionHead meta={formatHM(totalMin).toUpperCase()}>Time invested</SectionHead>
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
                                    {proj?.title ?? "—"}
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
            const sessionsForMo = getSessionsForMonth(allSessions, yearMonth);
            if (sessionsForMo.length === 0) return null;
            const focusMin = sessionsForMo.reduce((s, x) => s + sessionDurationMinutes(x), 0);
            return (
              <section>
                <SectionHead meta={`${formatHM(focusMin).toUpperCase()} FOCUSED`}>
                  Sessions · {sessionsForMo.length}
                </SectionHead>
                <SessionsSection sessions={sessionsForMo} variant="by-week" showStats />
              </section>
            );
          })()}

          {/* WEEKS */}
          <section>
            <SectionHead meta={`${summary.weeks.length}`}>Weeks</SectionHead>
            <div className="rounded-[6px] border border-border-subtle overflow-hidden">
              {summary.weeks.map((wk) => {
                const r = weekRange(wk);
                if (!r) return null;
                const wkDays = r.days;
                const wkActions = summary.doneActions.filter((a) =>
                  wkDays.includes(a.completedAt?.slice(0, 10) ?? ""),
                );
                const wkMin = wkActions.reduce((s, a) => s + (a.timeEstimateMinutes ?? 0), 0);
                // Rituals: sum done across days in this week intersected with month
                const wkRitualsDone = summary.ritualMonth.reduce((s, rm) => {
                  const slot = rm.weeks.find((w) => w.yearWeek === wk);
                  return s + (slot?.doneCount ?? 0);
                }, 0);
                // Per-goal time for this week
                const perGoalWk = goals
                  .filter((g) => g.status === "active")
                  .map((g) => ({
                    g,
                    min: wkActions
                      .filter((a) => a.goalId === g.id)
                      .reduce((s, a) => s + (a.timeEstimateMinutes ?? 0), 0),
                  }))
                  .filter((x) => x.min > 0);

                return (
                  <button
                    key={wk}
                    type="button"
                    onClick={() => navigate(`/reviews/weeks/${wk}`)}
                    className="w-full flex items-center gap-3 px-4 py-3 border-b border-border-subtle last:border-b-0 hover:bg-surface-hover transition-colors text-left"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="text-[14px] font-medium text-text-primary">
                          {formatWeekLabel(wk)}
                        </span>
                        <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-text-tertiary">
                          {formatWeekRelative(wk)}
                        </span>
                      </div>
                      <div className="mt-0.5 font-mono text-[12px] text-text-secondary tabular-nums">
                        <span className="text-text-primary">{wkActions.length}</span> actions
                        {wkRitualsDone > 0 && (
                          <>
                            <span className="text-text-tertiary"> · </span>
                            <span className="text-text-primary">{wkRitualsDone}</span> rituals
                          </>
                        )}
                        {settings.layers.logTime && wkMin > 0 && (
                          <>
                            <span className="text-text-tertiary"> · </span>
                            <span className="text-text-primary">{formatHM(wkMin)}</span>
                          </>
                        )}
                      </div>
                      {settings.layers.logTime && perGoalWk.length > 0 && (
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] text-text-tertiary tabular-nums">
                          {perGoalWk.map(({ g, min }) => (
                            <span key={g.id} className="flex items-center gap-1">
                              <span
                                className="w-1.5 h-1.5 rounded-full"
                                style={{ background: `hsl(var(--${g.color}))` }}
                              />
                              <span>{g.title}</span>
                              <span className="text-text-tertiary">— {formatHM(min)}</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <span className="text-text-tertiary shrink-0">→</span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* TOP CONTRIBUTING ACTIONS */}
          {topActions.length > 0 && (
            <section>
              <SectionHead meta={`${topActions.length}`}>Top contributing actions</SectionHead>
              <div className="space-y-3">
                {Array.from(topByGoal.entries()).map(([gid, list]) => {
                  const g = goalById(gid);
                  return (
                    <div key={gid}>
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ background: `hsl(var(--${g?.color ?? "goal-1"}))` }}
                        />
                        <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-tertiary">
                          {g?.title ?? "—"} · {list.length} action{list.length === 1 ? "" : "s"}
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
            </section>
          )}

          {/* RITUALS */}
          {ritualMonthRows.length > 0 && (
            <section>
              <SectionHead meta={`${ritualMonthRows.length} ACTIVE`}>Rituals</SectionHead>
              <div className="space-y-2">
                {ritualMonthRows.map((rm) => {
                  const r = ritualById(rm.ritualId);
                  if (!r) return null;
                  const g = goalById(r.goalId);
                  const goalColor = `hsl(var(--${g?.color ?? "goal-1"}))`;
                  const mult = ritualMultiplier(r.totalCompletions);
                  return (
                    <button
                      key={rm.ritualId}
                      type="button"
                      onClick={() => openPanel({ kind: "ritual", mode: "edit", id: rm.ritualId })}
                      className="w-full flex items-stretch gap-3 rounded-[4px] hover:bg-surface-hover transition-colors text-left overflow-hidden"
                    >
                      <div className="w-[3px] shrink-0 self-stretch" style={{ background: goalColor }} />
                      <div className="flex-1 min-w-0 py-2 pr-3">
                        <div className="flex items-center gap-3">
                          <div className="text-[14px] font-medium text-text-primary truncate flex-1">
                            {r.title}
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            {rm.weeks.map((w, i) => {
                              const rate = w.scheduledCount > 0 ? w.doneCount / w.scheduledCount : 0;
                              const bg =
                                w.scheduledCount === 0
                                  ? "transparent"
                                  : rate >= 0.999
                                    ? "hsl(var(--state-active))"
                                    : rate >= 0.5
                                      ? "hsl(var(--accent))"
                                      : "hsl(var(--state-stalled))";
                              return (
                                <span
                                  key={i}
                                  title={`Week ${w.yearWeek.slice(-2)}: ${w.doneCount}/${w.scheduledCount}`}
                                  className="w-4 h-3 rounded-[2px]"
                                  style={{
                                    background: bg,
                                    opacity: w.scheduledCount === 0 ? 0.4 : Math.max(0.35, rate),
                                    border:
                                      w.scheduledCount === 0
                                        ? "1px dashed hsl(var(--border-subtle))"
                                        : "none",
                                  }}
                                />
                              );
                            })}
                          </div>
                          <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-text-tertiary tabular-nums shrink-0">
                            ×{mult.toFixed(2)}
                          </span>
                        </div>
                        <div className="mt-0.5 font-mono text-[11px] text-text-tertiary tabular-nums">
                          {r.schedule} · <span className="text-text-secondary">{rm.doneCount}</span>{" "}
                          of {rm.scheduledCount} done
                          {rm.skippedCount > 0 && (
                            <>
                              {" · "}
                              <span className="text-text-secondary">{rm.skippedCount}</span> skipped
                            </>
                          )}
                          {rm.missedCount > 0 && (
                            <>
                              {" · "}
                              <span className="text-text-secondary">{rm.missedCount}</span> missed
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

          {/* REFLECTIONS */}
          {settings.layers.planAndReview &&
            (summary.substantiveReflections.length > 0 ||
              summary.shortReflections.length > 0) && (
              <section>
                <SectionHead>Reflections</SectionHead>
                <div className="space-y-3">
                  {summary.substantiveReflections.map((r) => (
                    <div key={r.date} className="border-l-2 border-border-default pl-3">
                      <div className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-tertiary mb-1">
                        {format(parseISO(r.date), "EEE MMM d")}
                        {r.dayType && ` · ${DAY_TYPE_LABELS[r.dayType]}`}
                      </div>
                      <div className="text-[14px] text-text-primary whitespace-pre-wrap">
                        {r.text}
                      </div>
                    </div>
                  ))}

                  {summary.shortReflections.length > 0 && !showAllReflections && (
                    <button
                      type="button"
                      onClick={() => setShowAllReflections(true)}
                      className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-tertiary hover:text-text-primary transition-colors"
                    >
                      And {summary.shortReflections.length} short reflection
                      {summary.shortReflections.length === 1 ? "" : "s"} — view all →
                    </button>
                  )}

                  {showAllReflections &&
                    summary.shortReflections.map((r) => (
                      <div key={r.date} className="border-l-2 border-border-subtle pl-3">
                        <div className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-tertiary mb-1">
                          {format(parseISO(r.date), "EEE MMM d")}
                          {r.dayType && ` · ${DAY_TYPE_LABELS[r.dayType]}`}
                        </div>
                        <div className="text-[13px] text-text-secondary whitespace-pre-wrap">
                          {r.text}
                        </div>
                      </div>
                    ))}
                </div>
              </section>
            )}

          {summary.doneActions.length === 0 &&
            summary.closedProjects.length === 0 &&
            summary.closedGoals.length === 0 &&
            summary.substantiveReflections.length === 0 &&
            summary.shortReflections.length === 0 && (
              <div className="text-center py-12 text-[14px] text-text-secondary">
                No activity tracked this month.
              </div>
            )}
        </div>

        <div className="h-12" />
      </main>
    </div>
  );
};

export default ReviewMonthDetail;
