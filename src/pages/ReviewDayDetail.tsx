import React from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { AppSidebar } from "@/components/AppSidebar";
import { SettingsPanel } from "@/components/SettingsPanel";
import { useStore } from "@/store/useStore";
import { formatHM } from "@/lib/timeStats";
import type { Action, Goal, Project, Ritual } from "@/types";
import { DAY_TYPE_LABELS } from "./Index";
import { ActionRow as SharedActionRow } from "@/components/ActionRow";
import { AccomplishmentsSection, type AccomplishmentTile } from "@/components/AccomplishmentsSection";
import { OutcomeAddedSection } from "@/components/OutcomeAddedSection";
import { SessionsSection } from "@/components/SessionsSection";
import { getOutcomeSummary } from "@/lib/outcomeUtils";
import { getSessionsForDay, sessionDurationMinutes } from "@/lib/sessionUtils";

const longDate = (iso: string) =>
  new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

const timeOnly = (iso?: string) =>
  iso ? new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : null;

const SectionHead: React.FC<{ children: React.ReactNode; meta?: string }> = ({ children, meta }) => (
  <div className="flex items-baseline justify-between mb-3">
    <h2 className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-tertiary">
      {children}
    </h2>
    {meta && (
      <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-tertiary tabular-nums">
        {meta}
      </span>
    )}
  </div>
);

const ActionLine: React.FC<{
  a: Action;
  icon: string;
  iconClass?: string;
  goalColor: string;
  parent: string;
  showTime: boolean;
  onClick: () => void;
}> = ({ a, icon, onClick }) => {
  // Sub-group icon ("✓" Done, "○" Skipped, "·" Not completed) determines visual state.
  const isDone = icon === "✓";
  const isSkipped = icon === "○";
  return (
    <SharedActionRow
      action={a}
      onClick={onClick}
      hideCheckbox
      terminal={isDone || isSkipped}
      rightPill={isDone ? { kind: "done" } : null}
    />
  );
};

const RitualLine: React.FC<{ r: Ritual; icon: string; iconClass?: string; goalColor: string; mult: number }> = ({
  r,
  icon,
  iconClass = "text-text-tertiary",
  goalColor,
  mult,
}) => (
  <div className="flex items-center gap-2.5 py-1.5">
    <span className={`font-mono text-[12px] ${iconClass}`}>{icon}</span>
    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: goalColor }} />
    <span className="text-[13px] text-text-primary truncate">{r.title}</span>
    <span className="font-mono text-[11px] text-text-tertiary truncate">· {r.schedule}</span>
    <div className="flex-1" />
    <span className="font-mono text-[11px] text-text-tertiary tabular-nums">×{mult.toFixed(1)}</span>
  </div>
);

const ClosedRow: React.FC<{
  title: string;
  stripeColor: string;
  pillLabel: "COMPLETED" | "DROPPED";
  subline: React.ReactNode;
  onClick: () => void;
}> = ({ title, stripeColor, pillLabel, subline, onClick }) => {
  const pillColor =
    pillLabel === "COMPLETED"
      ? "hsl(var(--state-active))"
      : "hsl(var(--text-warning, var(--state-stalled)))";
  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full flex items-stretch gap-3 rounded-[4px] hover:bg-surface-hover transition-colors text-left overflow-hidden"
    >
      <div className="w-[3px] shrink-0 self-stretch" style={{ background: stripeColor }} />
      <div className="flex-1 min-w-0 py-2 pr-3">
        <div className="flex items-center gap-3">
          <div className="text-[14px] font-medium text-text-primary truncate flex-1">{title}</div>
          <div
            className="font-mono text-[10px] uppercase tracking-[0.08em] tabular-nums shrink-0"
            style={{ color: pillColor }}
          >
            {pillLabel}
          </div>
        </div>
        <div className="mt-0.5 font-mono text-[11px] text-text-tertiary">{subline}</div>
      </div>
    </button>
  );
};

const ReviewDayDetail: React.FC = () => {
  const { date = "" } = useParams();
  const navigate = useNavigate();
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const dayEntry = useStore((s) => s.dayEntries.find((d) => d.date === date));
  const actions = useStore((s) => s.actions);
  const rituals = useStore((s) => s.rituals);
  const goals = useStore((s) => s.goals);
  const projects = useStore((s) => s.projects);
  const settings = useStore((s) => s.settings);
  const reopenDay = useStore((s) => (s as any).reopenDay);
  const updateDayEntry = useStore((s) => (s as any).updateDayEntry);
  const openPanel = useStore((s) => s.openPanel);

  const [editingReflection, setEditingReflection] = React.useState(false);
  const [reflectionDraft, setReflectionDraft] = React.useState("");

  const goalById = (id: string) => goals.find((g) => g.id === id);
  const projectById = (id: string | null) =>
    id ? projects.find((p) => p.id === id) : undefined;
  const breadcrumb = (a: Action) => {
    const g = goalById(a.goalId);
    const p = projectById(a.projectId);
    if (g && p) return `${g.title} · ${p.title}`;
    return g?.title ?? "";
  };
  const goalColorOf = (a: Action | Ritual) =>
    `hsl(var(--${goalById((a as any).goalId)?.color ?? "goal-1"}))`;

  // Status transitions on this day
  const sameDay = (iso?: string) => !!iso && iso.slice(0, 10) === date;

  const doneToday = actions.filter((a) => a.status === "done" && sameDay(a.completedAt));
  const delegatedToday = actions.filter(
    (a) => a.status === "delegated" && sameDay(a.delegatedAt),
  );
  const droppedToday = actions.filter(
    (a) => a.status === "dropped" && sameDay(a.droppedAt),
  );
  const cancelledToday = actions.filter(
    (a) => a.status === "cancelled" && sameDay(a.cancelledAt),
  );

  const planned = (dayEntry?.plannedActionIds ?? [])
    .map((id) => actions.find((a) => a.id === id))
    .filter(Boolean) as Action[];

  const transitionedIds = new Set([
    ...doneToday.map((a) => a.id),
    ...delegatedToday.map((a) => a.id),
    ...droppedToday.map((a) => a.id),
    ...cancelledToday.map((a) => a.id),
  ]);
  const notCompleted = planned.filter(
    (a) => !transitionedIds.has(a.id) && a.status !== "done",
  );

  // Rituals
  const plannedRituals = (dayEntry?.plannedRitualIds ?? [])
    .map((id) => rituals.find((r) => r.id === id))
    .filter(Boolean) as Ritual[];
  const ritualSkippedSet = new Set(dayEntry?.skippedRitualIds ?? []);
  const ritualsDone: Ritual[] = [];
  const ritualsMissed: Ritual[] = [];
  const ritualsSkippedList: Ritual[] = [];
  for (const r of plannedRituals) {
    if (ritualSkippedSet.has(r.id)) {
      ritualsSkippedList.push(r);
      continue;
    }
    const c = r.completionHistory.find((c) => c.date === date);
    if (c && (c.status === "done" || !c.status)) ritualsDone.push(r);
    else ritualsMissed.push(r);
  }
  const ritualMult = (r: Ritual) => 1 + Math.min(r.totalCompletions, 100) * 0.01;

  // ─── Closed entities on this date ───
  const sameDate = (iso?: string) => !!iso && iso.slice(0, 10) === date;
  type Closed<T> = { entity: T; type: "completed" | "dropped"; at: string };

  const closedProjects: Closed<Project>[] = projects
    .flatMap<Closed<Project>>((p) => {
      if (sameDate(p.completedAt)) return [{ entity: p, type: "completed", at: p.completedAt! }];
      if (sameDate(p.droppedAt)) return [{ entity: p, type: "dropped", at: p.droppedAt! }];
      return [];
    })
    .sort((a, b) => a.at.localeCompare(b.at));

  const closedGoals: Closed<Goal>[] = goals
    .flatMap<Closed<Goal>>((g) => {
      if (sameDate(g.completedAt)) return [{ entity: g, type: "completed", at: g.completedAt! }];
      if (sameDate(g.droppedAt)) return [{ entity: g, type: "dropped", at: g.droppedAt! }];
      return [];
    })
    .sort((a, b) => a.at.localeCompare(b.at));

  // Time per goal (with per-project breakdown)
  const perGoal = goals
    .filter((g) => g.status === "active")
    .map((g) => {
      const goalDone = doneToday.filter((a) => a.goalId === g.id);
      const min = goalDone.reduce((s, a) => s + (a.timeEstimateMinutes ?? 0), 0);
      // Aggregate by project (skip null projectId — those are goal-level backlog).
      const byProject = new Map<string, number>();
      for (const a of goalDone) {
        if (!a.projectId) continue;
        const t = a.timeEstimateMinutes ?? 0;
        if (t <= 0) continue;
        byProject.set(a.projectId, (byProject.get(a.projectId) ?? 0) + t);
      }
      const projectRows = Array.from(byProject.entries())
        .map(([pid, m]) => ({ project: projects.find((p) => p.id === pid), min: m }))
        .filter((row) => !!row.project)
        .sort((a, b) => b.min - a.min) as { project: Project; min: number }[];
      return { g, min, projectRows };
    })
    .sort((a, b) => b.min - a.min);
  const totalMin = perGoal.reduce((s, x) => s + x.min, 0);
  const yMax = Math.max(1, ...perGoal.map((x) => x.min));

  // Outcome added (Done + Delegated impact, scoped to active goals)
  const outcome = React.useMemo(
    () => getOutcomeSummary(doneToday, delegatedToday, goals, projects, actions),
    [doneToday, delegatedToday, goals, projects, actions],
  );

  // Sessions started on this day
  const allSessions = useStore((s) => s.sessions);
  const sessionsForDay = React.useMemo(
    () => getSessionsForDay(allSessions, date),
    [allSessions, date],
  );

  // No data at all (closed entities also count as data)
  const hasAnyData =
    !!dayEntry ||
    doneToday.length > 0 ||
    ritualsDone.length > 0 ||
    closedProjects.length > 0 ||
    closedGoals.length > 0;

  const main =
    dayEntry?.mainTaskActionId
      ? actions.find((a) => a.id === dayEntry.mainTaskActionId)
      : undefined;

  const dtLabel = dayEntry?.dayType ? `${DAY_TYPE_LABELS[dayEntry.dayType]} day` : null;
  const startedT = timeOnly(dayEntry?.startedAt);
  const closedT = timeOnly(dayEntry?.closedAt);
  const subParts: string[] = [];
  if (dtLabel) subParts.push(dtLabel);
  if (startedT) subParts.push(`Started ${startedT}`);
  if (dayEntry?.isClosed && closedT) subParts.push(`Closed ${closedT}`);
  else if (dayEntry && !dayEntry.isClosed) subParts.push("Not closed");

  // Part 6 — show "Not planned · X actions logged" when no formal plan but activity exists
  const isNotPlanned = !dayEntry || dayEntry.isPlanned === false;
  if (isNotPlanned && doneToday.length > 0 && subParts.length === 0) {
    subParts.push(`Not planned · ${doneToday.length} action${doneToday.length === 1 ? "" : "s"} logged`);
  }

  const handleReopen = () => {
    if (typeof reopenDay === "function") {
      reopenDay(date);
    } else if (typeof updateDayEntry === "function") {
      updateDayEntry(date, { isClosed: false });
    }
    toast("Day re-opened");
  };

  const startEditReflection = () => {
    setReflectionDraft(dayEntry?.reflectionText ?? "");
    setEditingReflection(true);
  };
  const saveReflection = () => {
    if (typeof updateDayEntry === "function") {
      updateDayEntry(date, { reflectionText: reflectionDraft });
    }
    setEditingReflection(false);
    toast("Reflection saved");
  };

  const openActionEdit = (id: string) => {
    openPanel({ kind: "action", mode: "edit", id });
  };

  const openActionAddRetro = () => {
    openPanel({
      kind: "action",
      mode: "new",
      prefill: {
        scheduledDate: date,
        status: "done",
        completedAt: new Date(date + "T12:00:00").toISOString(),
      },
    });
  };

  // Stats helpers (Part 5)
  const actionTotal =
    doneToday.length +
    delegatedToday.length +
    droppedToday.length +
    cancelledToday.length +
    notCompleted.length;
  const actionSubgroupCount =
    (doneToday.length > 0 ? 1 : 0) +
    (delegatedToday.length > 0 ? 1 : 0) +
    (droppedToday.length > 0 ? 1 : 0) +
    (cancelledToday.length > 0 ? 1 : 0) +
    (notCompleted.length > 0 ? 1 : 0);
  const actionTimeMin = doneToday.reduce((s, a) => s + (a.timeEstimateMinutes ?? 0), 0);
  const showActionTimeMeta = settings.layers.logTime && actionTimeMin > 0;

  const ritualTotal = plannedRituals.length;
  const ritualSubgroupCount =
    (ritualsDone.length > 0 ? 1 : 0) +
    (ritualsSkippedList.length > 0 ? 1 : 0) +
    (ritualsMissed.length > 0 ? 1 : 0);

  // Goal closed sub-line: type + days active
  const daysActive = (g: Goal) => {
    const start = new Date(g.createdAt).getTime();
    const end = new Date((g.completedAt || g.droppedAt || g.createdAt) as string).getTime();
    return Math.max(1, Math.round((end - start) / 86400000));
  };

  return (
    <div className="min-h-screen bg-surface-base text-text-primary">
      <AppSidebar onOpenSettings={() => setSettingsOpen(true)} />
      <SettingsPanel open={settingsOpen} onOpenChange={setSettingsOpen} />
      <main className="ml-[220px] px-8 py-6 max-w-[900px]">
        <Link
          to="/reviews/days"
          className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-tertiary hover:text-text-primary transition-colors"
        >
          ← REVIEWS
        </Link>
        <h1 className="mt-3 text-[24px] font-medium text-text-primary leading-tight">
          {date ? longDate(date) : "—"}
        </h1>
        {subParts.length > 0 && (
          <div className="mt-1 font-mono text-[13px] text-text-tertiary">
            {subParts.join(" · ")}
          </div>
        )}

        <div className="h-6" />
        <div className="border-t border-border-subtle" />
        <div className="h-8" />

        {!hasAnyData ? (
          <div className="text-center py-16">
            <div className="text-[14px] text-text-secondary">
              No activity logged for this day.
            </div>
            <Link to="/reviews/days" className="inline-block mt-3 text-[12px] text-[hsl(var(--accent))]">
              Back to reviews
            </Link>
          </div>
        ) : (
          <div className="space-y-10">
            {/* ACCOMPLISHMENTS */}
            {(() => {
              const tiles: AccomplishmentTile[] = [];
              const hasAny =
                outcome.outcomeAdded > 0 ||
                doneToday.length > 0 ||
                ritualsDone.length > 0 ||
                closedProjects.length > 0 ||
                closedGoals.length > 0 ||
                sessionsForDay.length > 0 ||
                (settings.layers.logTime && actionTimeMin > 0);
              if (hasAny) {
                if (outcome.outcomeAdded > 0)
                  tiles.push({ key: "outcome", value: `+${outcome.outcomeAdded}`, label: "Outcome added" });
                tiles.push({ key: "actions", value: String(doneToday.length), label: "Actions done" });
                tiles.push({ key: "rituals", value: String(ritualsDone.length), label: "Rituals done" });
                if (settings.layers.logTime && actionTimeMin > 0)
                  tiles.push({ key: "time", value: formatHM(actionTimeMin), label: "Time invested" });
                if (sessionsForDay.length > 0)
                  tiles.push({ key: "sessions", value: String(sessionsForDay.length), label: "Sessions" });
                if (closedProjects.length > 0)
                  tiles.push({ key: "projects", value: String(closedProjects.length), label: "Projects closed" });
                if (closedGoals.length > 0)
                  tiles.push({ key: "goals", value: String(closedGoals.length), label: "Goals closed" });
              }
              return <AccomplishmentsSection tiles={tiles} period="day" />;
            })()}

            {/* GOALS CLOSED */}
            {closedGoals.length > 0 && (
              <section>
                <SectionHead>Goals closed · {closedGoals.length}</SectionHead>
                <div className="space-y-1">
                  {closedGoals.map(({ entity: g, type }) => {
                    const goalColor = `hsl(var(--${g.color}))`;
                    const typeBadge = g.type === "mid-term" ? "MID-TERM" : "SHORT-TERM";
                    const days = daysActive(g);
                    return (
                      <ClosedRow
                        key={g.id}
                        title={g.title}
                        stripeColor={goalColor}
                        pillLabel={type === "completed" ? "COMPLETED" : "DROPPED"}
                        subline={`${typeBadge} · ${days} day${days === 1 ? "" : "s"} active`}
                        onClick={() => navigate(`/goals/${g.id}`)}
                      />
                    );
                  })}
                </div>
              </section>
            )}

            {/* PROJECTS CLOSED */}
            {closedProjects.length > 0 && (
              <section>
                <SectionHead>Projects closed · {closedProjects.length}</SectionHead>
                <div className="space-y-1">
                  {closedProjects.map(({ entity: p, type }) => {
                    const g = goalById(p.goalId);
                    const goalColor = `hsl(var(--${g?.color ?? "goal-1"}))`;
                    return (
                      <ClosedRow
                        key={p.id}
                        title={p.title}
                        stripeColor={goalColor}
                        pillLabel={type === "completed" ? "COMPLETED" : "DROPPED"}
                        subline={
                          <span className="inline-flex items-center gap-1.5">
                            <span
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ background: goalColor }}
                            />
                            {g?.title ?? "—"}
                          </span>
                        }
                        onClick={() => navigate(`/projects/${p.id}`)}
                      />
                    );
                  })}
                </div>
              </section>
            )}

            {/* OUTCOME ADDED */}
            <OutcomeAddedSection outcome={outcome} period="day" />

            {/* ENERGY */}
            {settings.layers.logEnergy &&
              (dayEntry?.morningEnergyScore != null || dayEntry?.eveningEnergyScore != null) && (
                <section>
                  <SectionHead>Energy</SectionHead>
                  <div className="space-y-1 text-[14px] text-text-primary">
                    <div>
                      Morning:{" "}
                      {dayEntry?.morningEnergyScore != null ? `${dayEntry.morningEnergyScore}/10` : "not logged"}
                    </div>
                    <div>
                      Evening:{" "}
                      {dayEntry?.eveningEnergyScore != null ? `${dayEntry.eveningEnergyScore}/10` : "not logged"}
                    </div>
                  </div>
                </section>
              )}

            {/* TIME INVESTED */}
            {settings.layers.logTime && totalMin > 0 && (
              <section>
                <SectionHead meta={`Total: ${formatHM(totalMin)}`}>Time invested</SectionHead>
                <div className="space-y-2">
                  {perGoal.map(({ g, min, projectRows }) => {
                    const pct = yMax > 0 ? (min / yMax) * 100 : 0;
                    const showProjects = projectRows.length >= 1;
                    return (
                      <div key={g.id}>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2 w-[200px] min-w-0">
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ background: `hsl(var(--${g.color}))` }}
                            />
                            <span className="text-[13px] text-text-primary truncate">{g.title}</span>
                          </div>
                          <div className="flex-1 h-2 rounded-[2px] bg-surface-hover overflow-hidden">
                            <div
                              className="h-full rounded-[2px]"
                              style={{
                                width: `${pct}%`,
                                background: `hsl(var(--${g.color}))`,
                              }}
                            />
                          </div>
                          <div className="w-[80px] text-right font-mono text-[12px] tabular-nums text-text-secondary">
                            {min > 0 ? formatHM(min) : "—"}
                          </div>
                        </div>
                        {showProjects && (
                          <div className="mt-1 mb-1 pl-[18px] space-y-0.5">
                            {projectRows.map(({ project, min: pMin }) => (
                              <div key={project.id} className="flex items-center gap-2">
                                <span className="font-mono text-[12px] text-text-tertiary leading-none">
                                  └
                                </span>
                                <span className="text-[13px] text-text-secondary truncate flex-1">
                                  {project.title}
                                </span>
                                <span className="font-mono text-[12px] tabular-nums text-text-tertiary">
                                  {formatHM(pMin)}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* MAIN TASK */}
            {main && (
              <section>
                <SectionHead>Main task</SectionHead>
                <div className="flex items-center gap-2 text-[14px]">
                  <span className="w-2 h-2 rounded-full" style={{ background: goalColorOf(main) }} />
                  {main.status === "done" ? (
                    <span className="text-text-primary">✓ Done — {main.title}</span>
                  ) : (
                    <span className="text-[hsl(var(--state-stalled))]">
                      ✗ Not completed — {main.title}
                    </span>
                  )}
                </div>
              </section>
            )}

            {/* ACTIONS */}
            <section>
              <SectionHead meta={showActionTimeMeta ? formatHM(actionTimeMin) : undefined}>
                Actions · {actionTotal}
              </SectionHead>
              {actionTotal === 0 ? (
                <div className="text-[13px] text-text-tertiary italic mb-3">No actions tracked.</div>
              ) : (
                <div>
                  {doneToday.length > 0 && (
                    <>
                      {actionSubgroupCount > 1 && (
                        <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-text-tertiary mt-2 mb-1">
                          Done · {doneToday.length}
                        </div>
                      )}
                      {doneToday.map((a) => (
                        <ActionLine
                          key={a.id}
                          a={a}
                          icon="✓"
                          iconClass="text-text-secondary"
                          goalColor={goalColorOf(a)}
                          parent={breadcrumb(a)}
                          showTime={settings.layers.logTime}
                          onClick={() => openActionEdit(a.id)}
                        />
                      ))}
                    </>
                  )}
                  {delegatedToday.length > 0 && (
                    <>
                      {actionSubgroupCount > 1 && (
                        <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-text-tertiary mt-3 mb-1">
                          Delegated · {delegatedToday.length}
                        </div>
                      )}
                      {delegatedToday.map((a) => (
                        <ActionLine
                          key={a.id}
                          a={a}
                          icon="→"
                          goalColor={goalColorOf(a)}
                          parent={breadcrumb(a)}
                          showTime={settings.layers.logTime}
                          onClick={() => openActionEdit(a.id)}
                        />
                      ))}
                    </>
                  )}
                  {droppedToday.length > 0 && (
                    <>
                      {actionSubgroupCount > 1 && (
                        <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-text-tertiary mt-3 mb-1">
                          Dropped · {droppedToday.length}
                        </div>
                      )}
                      {droppedToday.map((a) => (
                        <ActionLine
                          key={a.id}
                          a={a}
                          icon="○"
                          goalColor={goalColorOf(a)}
                          parent={breadcrumb(a)}
                          showTime={settings.layers.logTime}
                          onClick={() => openActionEdit(a.id)}
                        />
                      ))}
                    </>
                  )}
                  {cancelledToday.length > 0 && (
                    <>
                      {actionSubgroupCount > 1 && (
                        <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-text-tertiary mt-3 mb-1">
                          Cancelled · {cancelledToday.length}
                        </div>
                      )}
                      {cancelledToday.map((a) => (
                        <ActionLine
                          key={a.id}
                          a={a}
                          icon="✗"
                          goalColor={goalColorOf(a)}
                          parent={breadcrumb(a)}
                          showTime={settings.layers.logTime}
                          onClick={() => openActionEdit(a.id)}
                        />
                      ))}
                    </>
                  )}

                  {notCompleted.length > 0 && (
                    <>
                      {actionSubgroupCount > 1 && (
                        <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-text-tertiary mt-3 mb-1">
                          Not completed · {notCompleted.length}
                        </div>
                      )}
                      {notCompleted.map((a) => (
                        <ActionLine
                          key={a.id}
                          a={a}
                          icon="·"
                          goalColor={goalColorOf(a)}
                          parent={breadcrumb(a)}
                          showTime={settings.layers.logTime}
                          onClick={() => openActionEdit(a.id)}
                        />
                      ))}
                    </>
                  )}
                </div>
              )}

              {/* + Add action to this day */}
              <button
                type="button"
                onClick={openActionAddRetro}
                className="group mt-3 w-full h-12 flex items-center justify-center gap-2 rounded-[4px] border border-dashed border-border-subtle hover:border-solid hover:border-[hsl(var(--accent))] transition-colors"
              >
                <span className="font-mono text-[16px] text-text-tertiary group-hover:text-text-primary transition-colors">
                  +
                </span>
                <span className="text-[13px] text-text-secondary group-hover:text-text-primary transition-colors">
                  Add action to this day
                </span>
              </button>
            </section>
            {/* RITUALS */}
            {plannedRituals.length > 0 && (
              <section>
                <SectionHead>Rituals · {ritualTotal}</SectionHead>
                {ritualsDone.length > 0 && (
                  <>
                    {ritualSubgroupCount > 1 && (
                      <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-text-tertiary mt-2 mb-1">
                        Done · {ritualsDone.length}
                      </div>
                    )}
                    {ritualsDone.map((r) => (
                      <RitualLine
                        key={r.id}
                        r={r}
                        icon="✓"
                        iconClass="text-text-secondary"
                        goalColor={goalColorOf(r)}
                        mult={ritualMult(r)}
                      />
                    ))}
                  </>
                )}
                {ritualsSkippedList.length > 0 && (
                  <>
                    {ritualSubgroupCount > 1 && (
                      <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-text-tertiary mt-3 mb-1">
                        Skipped · {ritualsSkippedList.length}
                      </div>
                    )}
                    {ritualsSkippedList.map((r) => (
                      <RitualLine key={r.id} r={r} icon="○" goalColor={goalColorOf(r)} mult={ritualMult(r)} />
                    ))}
                  </>
                )}
                {ritualsMissed.length > 0 && (
                  <>
                    {ritualSubgroupCount > 1 && (
                      <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-text-tertiary mt-3 mb-1">
                        Missed · {ritualsMissed.length}
                      </div>
                    )}
                    {ritualsMissed.map((r) => (
                      <RitualLine key={r.id} r={r} icon="✗" goalColor={goalColorOf(r)} mult={ritualMult(r)} />
                    ))}
                  </>
                )}
              </section>
            )}

            {/* REFLECTION */}
            <section>
              <SectionHead>Reflection</SectionHead>
              {editingReflection ? (
                <>
                  <textarea
                    value={reflectionDraft}
                    onChange={(e) => setReflectionDraft(e.target.value)}
                    rows={4}
                    className="w-full bg-surface-hover rounded-[4px] px-3 py-2 text-[13px] text-text-primary outline-none border border-transparent focus:border-border-default placeholder:text-text-tertiary resize-none"
                    placeholder="What worked? What didn't?"
                  />
                  <div className="mt-2 flex gap-3">
                    <button
                      type="button"
                      onClick={saveReflection}
                      className="text-[12px] text-[hsl(var(--accent))] font-medium"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingReflection(false)}
                      className="text-[12px] text-text-tertiary hover:text-text-primary"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              ) : dayEntry?.reflectionText ? (
                <div className="text-[14px] text-text-primary whitespace-pre-wrap">
                  {dayEntry.reflectionText}
                </div>
              ) : (
                <div className="text-[13px] text-text-tertiary italic">No reflection logged</div>
              )}
            </section>

            {/* FOOTER */}
            <section className="pt-4 border-t border-border-subtle flex flex-wrap items-center gap-4">
              {dayEntry?.isClosed && (
                <button
                  type="button"
                  onClick={handleReopen}
                  className="text-[13px] text-text-secondary hover:text-text-primary transition-colors"
                >
                  Re-open day
                </button>
              )}
              {!editingReflection && (
                <button
                  type="button"
                  onClick={startEditReflection}
                  className="text-[13px] text-text-secondary hover:text-text-primary transition-colors"
                >
                  Edit reflection
                </button>
              )}
            </section>
          </div>
        )}

        <div className="h-12" />
      </main>
    </div>
  );
};

export default ReviewDayDetail;
