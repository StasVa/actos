// Close day — full-page recap shown when DayEntry.isClosed === true.
//
// Replaces the old CloseDayModal. Pure summary view with no input fields
// (reflection has been removed from the model).

import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { useStore, ritualMultiplier } from "@/store/useStore";
import { ConfirmModal } from "@/components/ConfirmModal";
import { ActionRow as SharedActionRow } from "@/components/ActionRow";
import { ImpactPill } from "@/components/MetaPills";
import type { Action, Ritual } from "@/types";
import { DAY_TYPE_ICONS, DAY_TYPE_LABELS, TODAY_ISO } from "@/pages/Index";

const Tile: React.FC<{ value: React.ReactNode; label: string; sub?: string }> = ({
  value,
  label,
  sub,
}) => (
  <div
    className="rounded-[6px] border border-border-subtle"
    style={{ background: "hsl(var(--surface-raised))", padding: "16px 20px" }}
  >
    <div className="text-[24px] md:text-[28px] leading-tight font-medium tabular-nums text-text-primary">
      {value}
    </div>
    <div className="mt-1 font-mono text-[11px] uppercase tracking-[0.06em] text-text-tertiary">
      {label}
    </div>
    {sub && (
      <div className="mt-1 font-mono text-[11px] text-text-secondary tabular-nums">
        {sub}
      </div>
    )}
  </div>
);

const SectionHeader: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-tertiary mb-2">
    {children}
  </div>
);

function fmtHM(min: number) {
  if (min <= 0) return "0m";
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export const CloseDayRecap: React.FC = () => {
  const date = TODAY_ISO;
  const navigate = useNavigate();
  const reopenDay = useStore((s) => s.reopenDay);
  const dayEntry = useStore((s) => s.dayEntries.find((d) => d.date === date));
  const actions = useStore((s) => s.actions);
  const rituals = useStore((s) => s.rituals);
  const goals = useStore((s) => s.goals);
  const projects = useStore((s) => s.projects);
  const sessions = useStore((s) => s.sessions);
  const openPanel = useStore((s) => s.openPanel);
  const [confirmReopen, setConfirmReopen] = React.useState(false);

  const sameDay = (iso?: string) => !!iso && iso.slice(0, 10) === date;

  const doneActions = actions.filter((a) => a.status === "done" && sameDay(a.completedAt));
  const delegatedActions = actions.filter(
    (a) => a.status === "delegated" && sameDay(a.delegatedAt),
  );

  const investedMin = (a: Action) => {
    const t = a.timeEstimateMinutes ?? 0;
    if (t <= 0) return 0;
    if (a.status === "done") return t;
    if (a.status === "delegated") return Math.round(t * 0.2);
    return 0;
  };

  const focusedMin = doneActions.reduce((s, a) => s + (a.timeEstimateMinutes ?? 0), 0);
  const investedMinTotal =
    doneActions.reduce((s, a) => s + investedMin(a), 0) +
    delegatedActions.reduce((s, a) => s + investedMin(a), 0);

  const valueAdded =
    doneActions.reduce((s, a) => s + (a.impact ?? 0), 0) +
    Math.round(delegatedActions.reduce((s, a) => s + (a.impact ?? 0), 0) * 0.2);

  const ritualsDoneCount = rituals.filter((r) =>
    r.completionHistory.some((c) => c.date === date && (c.status === "done" || !c.status)),
  ).length;

  const sessionsToday = sessions.filter((s) => sameDay(s.startedAt));
  const sessionsFocusedMin = sessionsToday.reduce((sum, s) => {
    const start = new Date(s.startedAt).getTime();
    const end = s.endedAt ? new Date(s.endedAt).getTime() : start;
    return sum + Math.max(0, Math.round((end - start) / 60000));
  }, 0);

  // Per-project grouping of done actions
  const byProject = new Map<string, Action[]>();
  for (const a of doneActions) {
    if (!a.projectId) continue;
    const arr = byProject.get(a.projectId) ?? [];
    arr.push(a);
    byProject.set(a.projectId, arr);
  }
  const touchedProjects = Array.from(byProject.entries())
    .map(([pid, acts]) => ({ project: projects.find((p) => p.id === pid), acts }))
    .filter((row) => !!row.project) as { project: typeof projects[number]; acts: Action[] }[];

  // Per-goal contribution
  const perGoal = goals
    .filter((g) => g.status === "active")
    .map((g) => {
      const goalActs = [...doneActions, ...delegatedActions].filter((a) => a.goalId === g.id);
      const value =
        goalActs
          .filter((a) => a.status === "done")
          .reduce((s, a) => s + (a.impact ?? 0), 0) +
        Math.round(
          goalActs
            .filter((a) => a.status === "delegated")
            .reduce((s, a) => s + (a.impact ?? 0), 0) * 0.2,
        );
      const min = goalActs.reduce((s, a) => s + investedMin(a), 0);
      return { g, value, min };
    })
    .filter((x) => x.value > 0 || x.min > 0);

  // Rituals breakdown
  const plannedRituals = (dayEntry?.plannedRitualIds ?? [])
    .map((id) => rituals.find((r) => r.id === id))
    .filter(Boolean) as Ritual[];
  const skippedSet = new Set(dayEntry?.skippedRitualIds ?? []);
  const ritualsDoneList: Ritual[] = [];
  const ritualsMissedList: Ritual[] = [];
  const ritualsSkippedList: Ritual[] = [];
  for (const r of plannedRituals) {
    if (skippedSet.has(r.id)) {
      ritualsSkippedList.push(r);
      continue;
    }
    const c = r.completionHistory.find((c) => c.date === date);
    if (c && (c.status === "done" || !c.status)) ritualsDoneList.push(r);
    else ritualsMissedList.push(r);
  }
  const ritualsTotalScheduled = plannedRituals.length;

  const goalById = (id: string) => goals.find((g) => g.id === id);
  const colorVar = (goalId: string) => {
    const g = goalById(goalId);
    return g ? `hsl(var(--${g.color}))` : "hsl(var(--text-tertiary))";
  };

  const dateObj = new Date(date + "T00:00:00");
  const dateLabel = dateObj.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  const dayType = dayEntry?.dayType;
  const Icon = dayType ? DAY_TYPE_ICONS[dayType] : null;
  const dayTypeLabel = dayType ? `${(DAY_TYPE_LABELS[dayType] ?? "").toUpperCase()} DAY` : null;

  const showGreeting = focusedMin >= 120;

  const handleReopen = () => {
    reopenDay(date);
    toast("Day re-opened");
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <header>
        <h1 className="text-[28px] md:text-[32px] font-medium text-text-primary leading-tight">
          Day closed
        </h1>
        <div className="flex items-center gap-2 mt-2 text-text-secondary">
          <span className="text-[14px]">{dateLabel}</span>
          {dayTypeLabel && (
            <>
              <span className="text-text-tertiary">·</span>
              {Icon && <Icon size={12} />}
              <span className="font-mono text-[11px] uppercase tracking-[0.06em]">
                {dayTypeLabel}
              </span>
            </>
          )}
        </div>
        {showGreeting && (
          <div className="mt-2 text-[16px] text-text-primary">Solid work today.</div>
        )}
      </header>

      <div className="border-t border-border-subtle" />

      {/* Stat tiles */}
      <section className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Tile value={`+${valueAdded}`} label="VALUE ADDED" />
        <Tile value={doneActions.length} label="ACTIONS DONE" />
        <Tile value={ritualsDoneCount} label="RITUALS DONE" />
        {sessionsToday.length > 0 && (
          <Tile
            value={sessionsToday.length}
            label="SESSIONS"
            sub={sessionsFocusedMin > 0 ? `${fmtHM(sessionsFocusedMin)} focused` : undefined}
          />
        )}
        <Tile value={fmtHM(investedMinTotal)} label="TIME INVESTED" />
      </section>

      {/* PROJECTS */}
      {touchedProjects.length > 0 && (
        <section>
          <SectionHeader>PROJECTS · {touchedProjects.length}</SectionHeader>
          <div>
            {touchedProjects.map(({ project, acts }) => {
              const c = colorVar(project!.goalId);
              return (
                <Link
                  key={project!.id}
                  to={`/projects/${project!.id}`}
                  className="relative flex items-center gap-3 py-2.5 pr-3 hover:bg-surface-hover transition-colors border-b border-border-subtle"
                  style={{ paddingLeft: 11 }}
                >
                  <span
                    className="absolute left-0 top-0 bottom-0"
                    style={{ background: c, width: 3 }}
                  />
                  <span className="text-[14px] text-text-primary truncate flex-1">
                    {project!.title}
                  </span>
                  <span className="font-mono text-[12px] text-text-secondary tabular-nums shrink-0">
                    {acts.length} action{acts.length === 1 ? "" : "s"} done
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* GOALS */}
      {perGoal.length > 0 && (
        <section>
          <SectionHeader>GOALS</SectionHeader>
          <div className="space-y-1.5">
            {perGoal.map(({ g, value, min }) => (
              <Link
                key={g.id}
                to={`/goals/${g.id}`}
                className="flex items-center gap-2 py-1.5 hover:opacity-80 transition-opacity"
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ background: `hsl(var(--${g.color}))` }}
                />
                <span className="text-[14px] text-text-primary truncate flex-1">{g.title}</span>
                <span className="font-mono text-[12px] text-text-secondary tabular-nums shrink-0">
                  +{value} value · {fmtHM(min)}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ACTIONS */}
      <section>
        <SectionHeader>ACTIONS DONE · {doneActions.length}</SectionHeader>
        {doneActions.length === 0 ? (
          <div className="text-[13px] text-text-tertiary italic">
            No actions completed today.
          </div>
        ) : (
          <div>
            {doneActions.map((a) => {
              const goal = goalById(a.goalId);
              const project = a.projectId ? projects.find((p) => p.id === a.projectId) : null;
              const bottom: React.ReactNode[] = [];
              if (goal) bottom.push(<span key="g">{goal.title}</span>);
              if (project) bottom.push(<span key="p">{project.title}</span>);
              if (a.timeEstimateMinutes && a.timeEstimateMinutes > 0)
                bottom.push(
                  <span key="t" className="tabular-nums">
                    {fmtHM(a.timeEstimateMinutes)}
                  </span>,
                );
              return (
                <SharedActionRow
                  key={a.id}
                  action={a}
                  rightPill={{
                    kind: "custom",
                    node: (
                      <ImpactPill
                        impact={a.impact}
                        goalColor={colorVar(a.goalId)}
                        dimmed
                      />
                    ),
                  }}
                  bottomSegments={bottom}
                  onClick={() => openPanel({ kind: "action", mode: "edit", id: a.id })}
                />
              );
            })}
          </div>
        )}
      </section>

      {/* RITUALS */}
      {ritualsTotalScheduled > 0 && (
        <section>
          <SectionHeader>
            RITUALS · {ritualsDoneList.length} done · {ritualsSkippedList.length} skipped ·{" "}
            {ritualsMissedList.length} missed
          </SectionHeader>
          <div className="space-y-1">
            {[
              ...ritualsDoneList.map((r) => ({ r, status: "done" as const })),
              ...ritualsSkippedList.map((r) => ({ r, status: "skipped" as const })),
              ...ritualsMissedList.map((r) => ({ r, status: "missed" as const })),
            ].map(({ r, status }) => {
              const c = colorVar(r.goalId);
              const icon = status === "done" ? "✓" : status === "skipped" ? "○" : "✗";
              const dimmed = status !== "done";
              return (
                <div
                  key={r.id + status}
                  className={`relative flex items-center gap-3 py-2 pr-3 ${dimmed ? "opacity-60" : ""}`}
                  style={{ paddingLeft: 11 }}
                >
                  <span
                    className="absolute left-0 top-0 bottom-0"
                    style={{ background: c, width: 3 }}
                  />
                  <span className="font-mono text-[12px] w-3 shrink-0 text-text-secondary">
                    {icon}
                  </span>
                  <span
                    className={`text-[14px] truncate flex-1 ${
                      status === "done" ? "text-text-primary" : "text-text-secondary line-through"
                    }`}
                  >
                    {r.title}
                  </span>
                  <span className="font-mono text-[11px] text-text-tertiary tabular-nums shrink-0">
                    ×{ritualMultiplier(r.totalCompletions).toFixed(2)}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between gap-4 pt-4 border-t border-border-subtle">
        <button
          type="button"
          onClick={() => setConfirmReopen(true)}
          className="text-[13px] text-text-secondary hover:text-text-primary transition"
        >
          Re-open day
        </button>
        <button
          type="button"
          onClick={() => navigate(`/reviews/days/${date}`)}
          className="text-[13px] text-[hsl(var(--accent))] hover:brightness-110 transition"
        >
          View in Days →
        </button>
      </div>

      <ConfirmModal
        open={confirmReopen}
        title="Re-open this day?"
        body="You'll be able to mark more actions and re-close it later."
        confirmLabel="Re-open"
        onCancel={() => setConfirmReopen(false)}
        onConfirm={() => {
          handleReopen();
          setConfirmReopen(false);
        }}
      />
    </div>
  );
};

export default CloseDayRecap;
