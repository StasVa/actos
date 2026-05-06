import React from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { AppSidebar } from "@/components/AppSidebar";
import { SettingsPanel } from "@/components/SettingsPanel";
import { useStore } from "@/store/useStore";
import { formatHM } from "@/lib/timeStats";
import {
  formatWeekLabel,
  formatDayTypeDistribution,
  getWeekSummary,
  dateFromYearWeek,
  yearWeekFromDate,
} from "@/lib/weekUtils";
import { ActionRow } from "@/components/ActionRow";
import { AccomplishmentsSection, type AccomplishmentTile } from "@/components/AccomplishmentsSection";
import { addDays } from "date-fns";
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

const RITUAL_CELL_BG: Record<string, string> = {
  done: "hsl(var(--state-active))",
  skipped: "hsl(var(--surface-hover))",
  missed: "hsl(var(--state-stalled))",
  pending: "hsl(var(--surface-hover))",
  "n/a": "transparent",
};

const ReviewWeekDetail: React.FC = () => {
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

  const summary = React.useMemo(
    () => getWeekSummary(yearWeek, { actions, dayEntries, goals, projects, rituals }),
    [yearWeek, actions, dayEntries, goals, projects, rituals],
  );

  if (!summary) {
    return (
      <div className="min-h-screen bg-surface-base text-text-primary">
        <AppSidebar onOpenSettings={() => setSettingsOpen(true)} />
        <SettingsPanel open={settingsOpen} onOpenChange={setSettingsOpen} />
        <main className="ml-[220px] px-8 py-6 max-w-[900px]">
          <Link
            to="/reviews/weeks"
            className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-tertiary hover:text-text-primary transition-colors"
          >
            ← REVIEWS / WEEKS
          </Link>
          <div className="mt-8 text-[14px] text-text-secondary">Invalid week.</div>
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
    ? formatDayTypeDistribution(summary.dayTypeDistribution)
    : "";

  const totalMin = summary.totalTimeMinutes;
  const yMaxGoal = Math.max(1, ...summary.perGoalTime.map((p) => p.minutes));

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

  // Energy bar chart
  const energyBars = summary.days.map((d) => {
    const e = summary.dayEntriesByDate[d];
    return {
      date: d,
      morning: e?.morningEnergyScore ?? null,
      evening: e?.eveningEnergyScore ?? null,
    };
  });

  return (
    <div className="min-h-screen bg-surface-base text-text-primary">
      <AppSidebar onOpenSettings={() => setSettingsOpen(true)} />
      <SettingsPanel open={settingsOpen} onOpenChange={setSettingsOpen} />
      <main className="ml-[220px] px-8 py-6 max-w-[900px]">
        <Link
          to="/reviews/weeks"
          className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-tertiary hover:text-text-primary transition-colors"
        >
          ← REVIEWS / WEEKS
        </Link>
        <h1 className="mt-3 text-[28px] font-medium text-text-primary leading-tight">
          {formatWeekLabel(yearWeek)}
        </h1>
        <div className="mt-1 font-mono text-[12px] text-text-secondary">
          Week {isoWeekNum} · {isoWeekYear} · 7 days
        </div>
        {dayTypeLine && (
          <div className="mt-0.5 font-mono text-[12px] text-text-secondary">{dayTypeLine}</div>
        )}

        <div className="h-6" />
        <div className="border-t border-border-subtle" />
        <div className="h-8" />

        <div className="space-y-10">
          {/* ENERGY */}
          {settings.layers.logEnergy &&
            (summary.morningEnergyAvg != null || summary.eveningEnergyAvg != null) && (
              <section>
                <SectionHead meta="AVG MORNING / EVENING">Energy</SectionHead>
                <div className="flex items-baseline gap-8 mb-4">
                  <div>
                    <div className="font-mono text-[10px] uppercase text-text-tertiary">Morning</div>
                    <div className="text-[24px] tabular-nums text-text-primary">
                      {summary.morningEnergyAvg != null ? summary.morningEnergyAvg.toFixed(1) : "—"}
                    </div>
                  </div>
                  <div>
                    <div className="font-mono text-[10px] uppercase text-text-tertiary">Evening</div>
                    <div className="text-[24px] tabular-nums text-text-primary">
                      {summary.eveningEnergyAvg != null ? summary.eveningEnergyAvg.toFixed(1) : "—"}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-7 gap-2">
                  {energyBars.map((b) => (
                    <div key={b.date} className="flex flex-col items-center gap-1">
                      <div className="flex items-end gap-1 h-[60px]">
                        <div
                          title={b.morning != null ? `Morning ${b.morning}` : "no morning"}
                          className="w-2 rounded-sm"
                          style={{
                            height: `${((b.morning ?? 0) / 10) * 60}px`,
                            background: "hsl(var(--accent))",
                            opacity: b.morning == null ? 0.15 : 1,
                          }}
                        />
                        <div
                          title={b.evening != null ? `Evening ${b.evening}` : "no evening"}
                          className="w-2 rounded-sm"
                          style={{
                            height: `${((b.evening ?? 0) / 10) * 60}px`,
                            background: "hsl(var(--text-secondary))",
                            opacity: b.evening == null ? 0.15 : 1,
                          }}
                        />
                      </div>
                      <div className="font-mono text-[10px] text-text-tertiary">
                        {format(parseISO(b.date), "EEEEE")}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

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

          {/* DAYS */}
          <section>
            <SectionHead meta={`${summary.days.length}`}>Days</SectionHead>
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
                        {format(parseISO(d), "EEE MMM d")}
                      </span>
                      <span className="font-mono text-[12px] text-text-tertiary italic">
                        No activity logged
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
                      {format(parseISO(d), "EEE MMM d")}
                    </span>
                    {entry?.dayType && (
                      <span className="font-mono text-[10px] uppercase tracking-[0.06em] px-1.5 py-0.5 rounded-[3px] bg-surface-hover text-text-secondary">
                        {DAY_TYPE_LABELS[entry.dayType]}
                      </span>
                    )}
                    <span className="font-mono text-[12px] text-text-secondary tabular-nums flex-1 truncate">
                      <span className="text-text-primary">{dayActs.length}</span> actions
                      {ritualsDoneCount > 0 && (
                        <>
                          <span className="text-text-tertiary"> · </span>
                          <span className="text-text-primary">{ritualsDoneCount}</span> rituals
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
                meta={`${topActions.length + summary.delegatedActions.length + summary.droppedActions.length + summary.cancelledActions.length}`}
              >
                Actions this week
              </SectionHead>
              <div className="space-y-5">
                {topActions.length > 0 && (
                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-text-tertiary mb-1.5">
                      Done · {topActions.length}{topActions.length === summary.doneActions.length ? "" : ` (top ${topActions.length})`}
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
                              {g?.title ?? "—"} · {list.length}
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
                      Delegated · {summary.delegatedActions.length}
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
                      Dropped · {summary.droppedActions.length}
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
                      Cancelled · {summary.cancelledActions.length}
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

          {/* RITUALS */}
          {summary.ritualWeek.filter((r) => r.scheduledCount > 0).length > 0 && (
            <section>
              <SectionHead
                meta={`${summary.ritualWeek.filter((r) => r.scheduledCount > 0).length} ACTIVE`}
              >
                Rituals
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
                                  title={`${format(parseISO(inst.date), "EEE")}: ${inst.status}`}
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
                            {r.schedule} · <span className="text-text-secondary">{rw.doneCount}</span>{" "}
                            of {rw.scheduledCount} done
                            {rw.skippedCount > 0 && (
                              <>
                                {" · "}
                                <span className="text-text-secondary">{rw.skippedCount}</span> skipped
                              </>
                            )}
                            {rw.missedCount > 0 && (
                              <>
                                {" · "}
                                <span className="text-text-secondary">{rw.missedCount}</span> missed
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
          {summary.reflections.length > 0 && (
            <section>
              <SectionHead>Reflections</SectionHead>
              <div className="space-y-3">
                {summary.reflections.map(({ date: d, entry }) => (
                  <div key={d} className="border-l-2 border-border-default pl-3">
                    <div className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-tertiary mb-1">
                      {format(parseISO(d), "EEE MMM d")}
                      {entry.dayType && ` · ${DAY_TYPE_LABELS[entry.dayType]}`}
                    </div>
                    <div className="text-[14px] text-text-primary whitespace-pre-wrap">
                      {entry.reflectionText}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {summary.doneActions.length === 0 &&
            summary.closedProjects.length === 0 &&
            summary.closedGoals.length === 0 &&
            summary.reflections.length === 0 && (
              <div className="text-center py-12 text-[14px] text-text-secondary">
                No activity tracked this week.
              </div>
            )}
        </div>

        <div className="h-12" />
      </main>
    </div>
  );
};

export default ReviewWeekDetail;
