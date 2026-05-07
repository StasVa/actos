import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Zap, Leaf, Sun, Thermometer, type LucideIcon } from "lucide-react";
import { AppSidebar } from "@/components/AppSidebar";
import { Tooltip, SparkTooltipContent, StateDotTooltip } from "@/components/Tooltip";
import { LifetimeCounters } from "@/components/LifetimeCounters";
import { buildYouTubeTooltips, buildFitnessTooltips, buildReadingTooltips } from "@/lib/sparkTooltips";
import { useStore } from "@/store/useStore";
import { SettingsPanel } from "@/components/SettingsPanel";
import { ritualMultiplier } from "@/store/useStore";
import { CardMenu } from "@/components/CardMenu";
import { ConfirmModal } from "@/components/ConfirmModal";
import { PlanTodayModal, CloseDayModal, ClosePlanModal } from "@/components/PlanCloseModals";
import { ActionRow as SharedActionRow } from "@/components/ActionRow";
import { ProjectCard as SharedProjectCard } from "@/components/ProjectCard";
import { toast } from "sonner";
import { subscribeAppEvent } from "@/lib/appEvents";

export const TODAY_ISO = new Date().toISOString().slice(0, 10);
export const YESTERDAY_ISO = (() => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
})();

export const DAY_TYPE_LABELS: Record<string, string> = {
  execution: "Execution",
  recovery: "Recovery",
  "day-off": "Day Off",
  sick: "Sick",
};

export const DAY_TYPE_ICONS: Record<string, LucideIcon> = {
  execution: Zap,
  recovery: Leaf,
  "day-off": Sun,
  sick: Thermometer,
};

export const DayTypeIndicator: React.FC<{ dayType?: string }> = ({ dayType }) => {
  if (!dayType) return null;
  const Icon = DAY_TYPE_ICONS[dayType];
  const label = (DAY_TYPE_LABELS[dayType] ?? "").toUpperCase() + " DAY";
  return (
    <div className="flex items-center text-text-secondary mt-2">
      {Icon && <Icon size={12} className="mr-1.5" />}
      <span className="font-mono text-[11px] uppercase tracking-[0.06em]">{label}</span>
    </div>
  );
};


/* ===== Tokens ===== */
const G1 = "hsl(var(--goal-1))";
const G2 = "hsl(var(--goal-2))";
const G3 = "hsl(var(--goal-3))";

/* ===== Primitives ===== */
export const SectionLabel: React.FC<{ children: React.ReactNode; meta?: React.ReactNode }> = ({ children, meta }) => (
  <div className="flex items-center justify-between mb-3">
    <h2 className="text-[12px] font-medium uppercase tracking-[0.08em] text-text-secondary">{children}</h2>
    {meta && <div className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-tertiary">{meta}</div>}
  </div>
);

const Checkbox: React.FC<{ size?: number }> = ({ size = 14 }) => (
  <span
    className="inline-block rounded-[2px] border border-text-tertiary hover:border-text-secondary shrink-0"
    style={{ width: size, height: size }}
  />
);

const TimePill: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="font-mono text-[11px] text-text-secondary bg-surface-raised px-1.5 py-0.5 rounded-[2px] whitespace-nowrap">
    {children}
  </span>
);

const Strip: React.FC<{ color: string }> = ({ color }) => (
  <span className="self-stretch w-[3px] shrink-0" style={{ background: color }} />
);

/* Sidebar moved to src/components/AppSidebar.tsx */

/* ===== Hero: Active Goals ===== */
/* 30 days, weekday-heavy, building toward today (right edge) */
const SPARK_1 = [
  2, 3, 0, 0, 3, 4, 2,
  3, 4, 1, 0, 2, 3, 4,
  2, 3, 0, 1, 3, 4, 2,
  4, 5, 1, 0, 3, 4, 2,
  3, 5,
];
/* Active first ~21 days, then 9 days of zero (stalled) */
const SPARK_2 = [
  2, 3, 4, 0, 1, 3, 2,
  3, 4, 2, 0, 0, 3, 4,
  3, 2, 4, 0, 1, 3, 2,
  0, 0, 0, 0, 0, 0, 0,
  0, 0,
];
/* Reading goal — very consistent daily activity */
const SPARK_3 = [
  1, 2, 1, 1, 0, 2, 1,
  1, 1, 2, 1, 0, 1, 2,
  1, 1, 1, 0, 1, 2, 1,
  1, 1, 2, 1, 1, 0, 2,
  1, 1,
];

const Sparkline: React.FC<{ data: number[]; color: string; tips: import("@/components/Tooltip").DayInfo[] }> = ({ data, color, tips }) => {
  const max = 5;
  return (
    <div className="w-full h-7 flex items-end gap-[1px]">
      {data.map((v, i) => {
        const h = v === 0 ? 2 : Math.max(2, Math.round((v / max) * 28));
        return (
          <Tooltip key={i} content={<SparkTooltipContent info={tips[i]} />} className="flex-1 h-full flex items-end">
            <div
              className="w-full hover:brightness-[1.15]"
              style={{
                height: h,
                background: v === 0 ? "hsl(var(--border-subtle))" : color,
                transition: "filter 80ms ease",
              }}
            />
          </Tooltip>
        );
      })}
    </div>
  );
};

const MeasureBar: React.FC<{
  label: string;
  percentage: number;
  color: string;
  opacity?: number;
}> = ({ label, percentage, color, opacity = 1 }) => (
  <div
    className="grid w-full min-w-0 items-center gap-2"
    style={{ gridTemplateColumns: "60px minmax(0, 1fr) 36px" }}
  >
    <div className="w-[60px] shrink-0 whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.06em] text-text-tertiary leading-none">
      {label}
    </div>
    <div className="min-w-0 h-[7px] w-full overflow-hidden rounded-[2px] bg-surface-hover">
      <div
        className="block h-full rounded-[2px]"
        style={{ width: `${Math.max(0, Math.min(100, percentage))}%`, background: color, opacity }}
      />
    </div>
    <div className="w-[36px] shrink-0 whitespace-nowrap text-right font-mono text-[11px] tabular-nums text-text-primary leading-none">
      {percentage}%
    </div>
  </div>
);

const DualBars: React.FC<{ outcome: number; effort: number; color: string }> = ({ outcome, effort, color }) => (
  <div className="flex min-w-0 flex-col gap-2">
    <MeasureBar label="VALUE" percentage={outcome} color={color} />
    <MeasureBar label="EFFORT" percentage={effort} color={color} opacity={0.6} />
  </div>
);

const GoalColumn: React.FC<{
  title: string;
  state: "active" | "stalled";
  type: string;
  target?: string;
  progress: number;
  meta: React.ReactNode[];
  outcome: number;
  effort: number;
  spark: number[];
  sparkTips: import("@/components/Tooltip").DayInfo[];
  lastActivity?: string;
  stalledFor?: string;
  color: string;
  recent: React.ReactNode;
  href?: string;
  menu?: React.ReactNode;
}> = ({ title, state, type, target, progress, meta, outcome, effort, spark, sparkTips, lastActivity, stalledFor, color, recent, href, menu }) => {
  const inner = (
    <div className="group min-w-0 overflow-hidden py-1 space-y-4">
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2.5 min-w-0">
        <Tooltip content={<StateDotTooltip state={state} lastActivity={lastActivity} stalledFor={stalledFor} />}>
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ background: state === "active" ? "hsl(var(--state-active))" : "hsl(var(--state-stalled))" }}
          />
        </Tooltip>
        <h3 className={`text-[18px] font-medium text-text-primary truncate ${href ? "group-hover:text-accent transition-colors" : ""}`}>{title}</h3>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {menu}
      </div>
    </div>

    <div className="flex gap-6 items-end">
      <div>
        <div className="font-mono font-medium text-text-primary leading-none" style={{ fontSize: 36 }}>
          {progress}%
        </div>
        <div className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-tertiary mt-2">Progress</div>
      </div>
      <div className="flex-1 flex flex-col gap-1.5 pb-1 min-w-0">
        {meta.map((m, i) => (
          <div key={i} className="font-mono text-[12px] text-text-secondary truncate">
            {m}
          </div>
        ))}
      </div>
    </div>

    <DualBars outcome={outcome} effort={effort} color={color} />

    <div>
      <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-text-tertiary mb-1.5">
        Activity · Last 30 days
      </div>
      <Sparkline data={spark} color={color} tips={sparkTips} />
    </div>

    <div className="font-mono text-[11px] text-text-tertiary leading-relaxed">{recent}</div>
    </div>
  );
  if (href) {
    return (
      <Link to={href} className="block min-w-0 overflow-hidden cursor-pointer px-6 first:pl-0 last:pr-0">
        {inner}
      </Link>
    );
  }
  return <div className="min-w-0 px-6 first:pl-0 last:pr-0">{inner}</div>;
};

/* ===== Goal column menu (composed in Hero) ===== */
const GoalColumnMenu: React.FC<{ goalId: string }> = ({ goalId }) => {
  const openPanel = useStore((s) => s.openPanel);
  const markGoalComplete = useStore((s) => s.markGoalComplete);
  const dropGoal = useStore((s) => s.dropGoal);
  const deleteGoal = useStore((s) => s.deleteGoal);
  const [confirmDrop, setConfirmDrop] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  return (
    <>
      <CardMenu
        ariaLabel="Goal menu"
        items={[
          { label: "Edit", onSelect: () => openPanel({ kind: "goal", mode: "edit", id: goalId }) },
          { label: "Mark complete", onSelect: () => { markGoalComplete(goalId); toast("Goal completed"); } },
          { label: "Drop", destructive: true, onSelect: () => setConfirmDrop(true) },
          { label: "Delete", destructive: true, onSelect: () => setConfirmDelete(true) },
        ]}
      />
      <ConfirmModal
        open={confirmDrop}
        title="Drop this goal?"
        body="Open projects, actions, and rituals under this goal will be dropped."
        confirmLabel="Drop goal"
        destructive
        onCancel={() => setConfirmDrop(false)}
        onConfirm={() => { dropGoal(goalId); toast("Goal dropped"); setConfirmDrop(false); }}
      />
      <ConfirmModal
        open={confirmDelete}
        title="Delete this goal?"
        body="This permanently removes the goal and ALL its projects, actions, rituals, and ideas."
        confirmLabel="Delete"
        destructive
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => { deleteGoal(goalId); toast("Goal deleted"); setConfirmDelete(false); }}
      />
    </>
  );
};

const SPARK_1_TIPS = buildYouTubeTooltips(SPARK_1);
const SPARK_2_TIPS = buildFitnessTooltips(SPARK_2);
const SPARK_3_TIPS = buildReadingTooltips(SPARK_3);

/* ===== Hero (live store-wired) ===== */
function buildSparkFromActions(
  actions: import("@/types").Action[],
  days = 30,
): { data: number[]; tips: import("@/components/Tooltip").DayInfo[] } {
  const data: number[] = new Array(days).fill(0);
  const titles: string[][] = Array.from({ length: days }, () => []);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (const a of actions) {
    const ts = a.completedAt ?? a.delegatedAt;
    if (!ts) continue;
    const d = new Date(ts);
    d.setHours(0, 0, 0, 0);
    const daysAgo = Math.round((today.getTime() - d.getTime()) / 86400000);
    if (daysAgo < 0 || daysAgo >= days) continue;
    const idx = days - 1 - daysAgo;
    data[idx] += 1;
    titles[idx].push(a.title);
  }
  const tips = data.map((count, i) => ({
    daysFromToday: days - 1 - i,
    count,
    actions: titles[i],
  }));
  return { data, tips };
}

function relativeDayLabel(iso?: string): string {
  if (!iso) return "no activity yet";
  const t = new Date(iso).getTime();
  const days = Math.floor((Date.now() - t) / 86400000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  return `${days} days ago`;
}

export const Hero: React.FC = () => {
  const goals = useStore((s) => s.goals);
  const projects = useStore((s) => s.projects);
  const actions = useStore((s) => s.actions);

  const activeGoals = goals.filter((g) => g.status === "active");
  if (activeGoals.length === 0) {
    return (
      <div className="bg-surface-elevated border border-border-subtle rounded-[6px] p-10 text-center">
        <div className="text-[14px] text-text-secondary">No active goals.</div>
        <div className="font-mono text-[11px] text-text-tertiary mt-1">
          Press ⌘K → “New goal” to start.
        </div>
      </div>
    );
  }

  return (
    <div
      className="grid w-full divide-x divide-border-subtle rounded-[6px] border border-border-subtle bg-surface-elevated p-6"
      style={{ gridTemplateColumns: `repeat(${activeGoals.length}, minmax(0, 1fr))` }}
    >
      {activeGoals.map((g) => {
        const goalProjects = projects.filter((p) => p.goalId === g.id);
        const projectsClosed = goalProjects.filter((p) => p.status === "completed").length;
        const projectsTotal = goalProjects.length;
        const goalActions = actions.filter((a) => a.goalId === g.id);
        const actionsDone = goalActions.filter((a) => a.status === "done").length;

        const lastActivityIso = goalActions
          .map((a) => a.completedAt ?? a.delegatedAt ?? a.updatedAt ?? a.createdAt)
          .filter(Boolean)
          .sort()
          .at(-1);
        const lastLabel = relativeDayLabel(lastActivityIso ?? undefined);
        const days = lastActivityIso
          ? Math.floor((Date.now() - new Date(lastActivityIso).getTime()) / 86400000)
          : 999;
        const state: "active" | "stalled" = days <= 7 ? "active" : "stalled";

        // Outcome / Effort
        const activeProjs = goalProjects.filter((p) => p.status === "active");
        let totalCost = 0, doneCost = 0, doneOrDelegatedCost = 0;
        for (const p of activeProjs) {
          const acts = actions.filter(
            (a) => a.projectId === p.id && a.status !== "dropped" && a.status !== "cancelled",
          );
          for (const a of acts) {
            const c = a.impact ?? 0;
            totalCost += c;
            if (a.status === "done") doneCost += c;
            if (a.status === "done" || a.status === "delegated") doneOrDelegatedCost += c;
          }
        }
        const outcome = totalCost > 0 ? Math.round((doneOrDelegatedCost / totalCost) * 100) : 0;
        const effort = totalCost > 0 ? Math.round((doneCost / totalCost) * 100) : 0;
        const progress = outcome;

        const targetLabel = g.targetDate
          ? `TARGET ${new Date(g.targetDate)
              .toLocaleDateString("en-US", { month: "short", day: "numeric" })
              .toUpperCase()}`
          : undefined;

        const recentDone = goalActions
          .filter((a) => a.status === "done")
          .sort((a, b) => (b.completedAt ?? "").localeCompare(a.completedAt ?? ""))
          .slice(0, 3)
          .map((a) => a.title);

        const spark = buildSparkFromActions(goalActions, 30);

        return (
          <GoalColumn
            key={g.id}
            href={`/goals/${g.id}`}
            title={g.title}
            state={state}
            type={g.type === "mid-term" ? "MID-TERM" : "SHORT-TERM"}
            target={targetLabel}
            progress={progress}
            meta={[
              <><span className="text-text-primary tabular-nums">{projectsClosed}</span> of <span className="text-text-primary tabular-nums">{projectsTotal}</span> projects closed</>,
              <><span className="text-text-primary tabular-nums">{actionsDone}</span> actions done</>,
              <><span className="text-text-tertiary">Last activity:</span> <span className="text-text-primary">{lastLabel}</span></>,
            ]}
            outcome={outcome}
            effort={effort}
            spark={spark.data}
            sparkTips={spark.tips}
            lastActivity={state === "active" ? lastLabel : undefined}
            stalledFor={state === "stalled" ? `${days} days` : undefined}
            color={`hsl(var(--${g.color}))`}
            recent={
              recentDone.length > 0 ? (
                <>
                  <span className="text-text-tertiary">Recent: </span>
                  {recentDone.map((t, i) => (
                    <React.Fragment key={i}>
                      {i > 0 && <span className="text-text-tertiary"> · </span>}
                      <span className="text-text-tertiary">✓ </span>
                      <span className="text-text-secondary">{t}</span>
                    </React.Fragment>
                  ))}
                </>
              ) : (
                <>No closed actions yet.</>
              )
            }
            menu={<GoalColumnMenu goalId={g.id} />}
          />
        );
      })}
    </div>
  );
};

/* ===== Active project card (navigates; "..." opens edit/destructive menu) ===== */
type ActiveProjectMeta = {
  id: string;
  title: string;
  goalLabel: string;
  goalColor: string;
  state: "active" | "stalled";
  hasActions: boolean;
  done: number;
  total: number;
  last: string;
  warnLast: boolean;
};

const ActiveProjectCard: React.FC<{ p: ActiveProjectMeta; pct: number }> = ({ p, pct }) => {
  const markProjectComplete = useStore((s) => s.markProjectComplete);
  const dropProject = useStore((s) => s.dropProject);
  const deleteProject = useStore((s) => s.deleteProject);
  const [confirmDrop, setConfirmDrop] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <>
      <Link to={`/projects/${p.id}`} className="block">
        <div className="group relative h-[120px] p-3 flex flex-col gap-2 rounded-[6px] bg-surface-raised border border-border-subtle hover:bg-surface-hover hover:border-accent cursor-pointer transition-colors duration-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: p.goalColor }} />
              <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-text-tertiary truncate">
                {p.goalLabel}
              </span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Tooltip content={<StateDotTooltip state={p.state} lastActivity={p.last} stalledFor={p.last} />}>
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ background: p.state === "active" ? "hsl(var(--state-active))" : "hsl(var(--state-stalled))" }}
                />
              </Tooltip>
              <CardMenu
                ariaLabel="Project menu"
                items={[
                  { label: "Mark complete", onSelect: () => { markProjectComplete(p.id); toast("Project completed"); } },
                  { label: "Drop", destructive: true, onSelect: () => setConfirmDrop(true) },
                  { label: "Delete", destructive: true, onSelect: () => setConfirmDelete(true) },
                ]}
              />
            </div>
          </div>
          <div
            className="flex-1 text-[15px] font-medium text-text-primary leading-[1.3] overflow-hidden"
            style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}
          >
            {p.title}
          </div>
          <div className="h-1 w-full bg-surface-hover rounded-[2px] overflow-hidden">
            <div className="h-full rounded-[2px]" style={{ width: `${pct}%`, background: p.goalColor }} />
          </div>
          <div className="flex items-center justify-between font-mono text-[11px] tabular-nums">
            <div>
              <span className="text-text-secondary">{p.done}/{p.hasActions ? p.total : 0}</span>
              <span className="text-text-tertiary"> actions</span>
            </div>
            <div>
              <span className="text-text-tertiary">Last: </span>
              <span className={p.warnLast ? "text-text-warning" : "text-text-secondary"}>{p.last}</span>
            </div>
          </div>
        </div>
      </Link>
      <ConfirmModal
        open={confirmDrop}
        title="Drop this project?"
        body="Open actions in this project will be dropped. You can re-open it later."
        confirmLabel="Drop project"
        destructive
        onCancel={() => setConfirmDrop(false)}
        onConfirm={() => { dropProject(p.id); toast("Project dropped"); setConfirmDrop(false); }}
      />
      <ConfirmModal
        open={confirmDelete}
        title="Delete this project?"
        body="This permanently removes the project and all its actions. This cannot be undone."
        confirmLabel="Delete"
        destructive
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => { deleteProject(p.id); toast("Project deleted"); setConfirmDelete(false); }}
      />
    </>
  );
};

/* ===== Active Projects (live store-wired) ===== */
export const ActiveProjects: React.FC = () => {
  const goals = useStore((s) => s.goals);
  const projects = useStore((s) => s.projects);
  const actions = useStore((s) => s.actions);

  const activeProjects = projects.filter((p) => p.status === "active" && !p.isDraft);
  const projectsWithMeta = activeProjects.map((p) => {
    const goal = goals.find((g) => g.id === p.goalId);
    const projActions = actions.filter(
      (a) => a.projectId === p.id && a.status !== "dropped" && a.status !== "cancelled",
    );
    const total = projActions.length;
    const done = projActions.filter((a) => a.status === "done" || a.status === "delegated").length;
    const lastIso = projActions
      .map((a) => a.completedAt ?? a.delegatedAt ?? a.updatedAt ?? a.createdAt)
      .filter(Boolean)
      .sort()
      .at(-1);
    const days = lastIso
      ? Math.floor((Date.now() - new Date(lastIso).getTime()) / 86400000)
      : 999;
    const state: "active" | "stalled" = days <= 7 ? "active" : "stalled";
    let last: string;
    if (!lastIso) last = "—";
    else if (days <= 0) last = "today";
    else if (days === 1) last = "1d ago";
    else last = `${days}d ago`;
    return {
      id: p.id,
      goalLabel: (goal?.title ?? "").toUpperCase(),
      goalColor: goal ? `hsl(var(--${goal.color}))` : "hsl(var(--text-tertiary))",
      title: p.title,
      done,
      total: Math.max(total, 1),
      hasActions: total > 0,
      last,
      state,
      warnLast: days > 7,
    };
  });

  const stalledCount = projectsWithMeta.filter((p) => p.state === "stalled").length;

  return (
    <section>
      <SectionLabel meta={`${projectsWithMeta.length} ACTIVE · ${stalledCount} STALLED`}>
        Active projects · {projectsWithMeta.length}
      </SectionLabel>
      {projectsWithMeta.length === 0 ? (
        <div className="bg-surface-raised border border-dashed border-border-subtle rounded-[6px] py-8 text-center">
          <div className="text-[13px] text-text-secondary">No active projects.</div>
          <div className="font-mono text-[11px] text-text-tertiary mt-1">
            Press ⌘K → “New project”.
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))" }}>
          {projectsWithMeta.map((p) => (
            <SharedProjectCard
              key={p.id}
              projectId={p.id}
              goalLabel={p.goalLabel}
              goalColor={p.goalColor}
            />
          ))}
        </div>
      )}
    </section>
  );
};

/* ===== Today (live store-wired) ===== */
export function fmtTime(min?: number): string | null {
  if (!min) return null;
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  return `${m}m`;
}

export const TodayZone: React.FC<{
  onPlanClick: () => void;
  onCloseClick: () => void;
}> = ({ onPlanClick, onCloseClick }) => {
  const goals = useStore((s) => s.goals);
  const projects = useStore((s) => s.projects);
  const actions = useStore((s) => s.actions);
  const rituals = useStore((s) => s.rituals);
  const dayEntry = useStore((s) =>
    s.dayEntries.find((d) => d.date === TODAY_ISO),
  );
  const settings = useStore((s) => s.settings);
  const changeActionStatus = useStore((s) => s.changeActionStatus);
  const createAction = useStore((s) => s.createAction);
  const openPanel = useStore((s) => s.openPanel);
  const updateDayEntry = useStore((s) => s.updateDayEntry);
  const markRitualInstanceDone = useStore((s) => s.markRitualInstanceDone);
  const skipRitualInstance = useStore((s) => s.skipRitualInstance);

  const [quickAdd, setQuickAdd] = useState("");
  

  const goalById = (id: string) => goals.find((g) => g.id === id);
  const projectById = (id: string | null) =>
    id ? projects.find((p) => p.id === id) : undefined;
  const colorVar = (goalId: string) => {
    const g = goalById(goalId);
    return g ? `hsl(var(--${g.color}))` : "hsl(var(--text-tertiary))";
  };
  const breadcrumb = (goalId: string, projectId: string | null) => {
    const g = goalById(goalId);
    const p = projectById(projectId);
    if (g && p) return `· ${g.title} · ${p.title}`;
    if (g) return `· ${g.title}`;
    return "";
  };

  const planAndReview = settings.layers.planAndReview;
  const isPlanned = !!dayEntry?.isPlanned;
  const isClosed = !!dayEntry?.isClosed;

  // ─── STATE A: today not yet planned ───
  if (!isPlanned) {
    const preScheduledCount = actions.filter(
      (a) =>
        a.scheduledDate === TODAY_ISO &&
        (a.status === "planned" || a.status === "backlog"),
    ).length;
    return (
      <section>
        <div
          className="bg-surface-elevated border border-border-subtle rounded-[8px] text-center"
          style={{ padding: "32px 40px" }}
        >
          <div className="text-[20px] font-medium text-text-primary leading-snug">
            What are you doing today?
          </div>
          <div className="text-[14px] text-text-secondary mt-2">
            Pick today's actions to start.
          </div>
          {preScheduledCount > 0 && (
            <div className="font-mono text-[12px] text-text-tertiary mt-3 tabular-nums">
              {preScheduledCount} action{preScheduledCount === 1 ? "" : "s"} already scheduled for today
            </div>
          )}
          <button
            type="button"
            onClick={onPlanClick}
            className="mt-6 inline-block rounded-[4px] bg-[hsl(var(--accent))] text-white font-medium hover:brightness-110 transition"
            style={{ padding: "12px 32px", fontSize: 15 }}
          >
            Start your day →
          </button>
        </div>
      </section>
    );
  }

  // Compute action lists.
  // When planAndReview off: fall back to scheduledDate=today.
  // When planned: use plannedActionIds + any new actions scheduled for today.
  const plannedSet = new Set(dayEntry?.plannedActionIds ?? []);
  const includeAction = (a: typeof actions[number]) =>
    planAndReview && isPlanned
      ? plannedSet.has(a.id) || a.scheduledDate === TODAY_ISO
      : a.scheduledDate === TODAY_ISO;
  const todays = actions
    .filter((a) => includeAction(a))
    .filter((a) => a.status !== "dropped" && a.status !== "cancelled")
    .sort((a, b) => {
      const aDone = a.status === "done" ? 1 : 0;
      const bDone = b.status === "done" ? 1 : 0;
      if (aDone !== bDone) return aDone - bDone; // active first
      return (b.impact ?? 0) - (a.impact ?? 0);
    });

  const mainTaskId = dayEntry?.mainTaskActionId;
  const mainTask = mainTaskId ? actions.find((a) => a.id === mainTaskId) : undefined;
  const others = todays.filter((a) => a.id !== mainTaskId);

  // Rituals: show all rituals due today (kept + skipped, with skipped visually faded).
  const skippedRitualSet = new Set(dayEntry?.skippedRitualIds ?? []);
  const plannedRitualSet = new Set(dayEntry?.plannedRitualIds ?? []);
  const todaysRituals = rituals.filter((r) => {
    if (r.status !== "active") return false;
    if (planAndReview && isPlanned) {
      return plannedRitualSet.has(r.id) || skippedRitualSet.has(r.id);
    }
    return true;
  });
  const ritualsTotal = todaysRituals.length;

  const handleToggleDone = (id: string) => {
    changeActionStatus(id, "done");
    toast.success("Action completed");
  };

  const handleQuickAdd = () => {
    const t = quickAdd.trim();
    if (!t) return;
    const id = createAction({ title: t, scheduledDate: TODAY_ISO });
    setQuickAdd("");
    // If a plan exists, append to plannedActionIds.
    if (isPlanned) {
      updateDayEntry(TODAY_ISO, {
        plannedActionIds: [...(dayEntry?.plannedActionIds ?? []), id],
      });
    }
    toast.success("Action added to today");
    openPanel({ kind: "action", mode: "edit", id });
  };

  const handleRitualDone = (ritualId: string, alreadyDone: boolean) => {
    if (alreadyDone) return;
    markRitualInstanceDone(ritualId);
    toast.success("Ritual logged");
  };

  const unskipRitualInstance = useStore((s) => s.unskipRitualInstance);

  const handleRitualSkipToggle = (ritualId: string, currentlySkipped: boolean) => {
    if (currentlySkipped) {
      unskipRitualInstance(ritualId);
      if (isPlanned) {
        updateDayEntry(TODAY_ISO, {
          plannedRitualIds: [...(dayEntry?.plannedRitualIds ?? []), ritualId],
          skippedRitualIds: (dayEntry?.skippedRitualIds ?? []).filter((id) => id !== ritualId),
        });
      }
      toast("Ritual restored");
    } else {
      skipRitualInstance(ritualId);
      if (isPlanned) {
        updateDayEntry(TODAY_ISO, {
          plannedRitualIds: (dayEntry?.plannedRitualIds ?? []).filter((id) => id !== ritualId),
          skippedRitualIds: [...(dayEntry?.skippedRitualIds ?? []), ritualId],
        });
      }
      toast("Ritual skipped today");
    }
  };

  const handleReopen = () => {
    updateDayEntry(TODAY_ISO, { isClosed: false, closedAt: undefined });
    toast("Day re-opened");
  };

  // ─── STATE C: closed ───
  if (planAndReview && isClosed) {
    const doneActions = todays.filter((a) => a.status === "done").length;
    const ritualsDoneCount = todaysRituals.filter((r) =>
      r.completionHistory.some(
        (c) => c.date === TODAY_ISO && (c.status === "done" || !c.status),
      ),
    ).length;
    const valueAdded = todays
      .filter((a) => a.status === "done")
      .reduce((s, a) => s + (a.impact ?? 0), 0);
    const minutes = todays
      .filter((a) => a.status === "done")
      .reduce((s, a) => s + (a.timeEstimateMinutes ?? 0), 0);
    const focusH = (minutes / 60).toFixed(1);
    return (
      <section>
        <div className="bg-surface-elevated border border-border-subtle rounded-[6px] p-5 space-y-3">
          <div className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-tertiary">
            DAY CLOSED
          </div>
          <div className="font-mono text-[13px] text-text-secondary tabular-nums">
            {doneActions} actions done · {ritualsDoneCount} rituals done · +{valueAdded} value · {focusH}h focused
          </div>
          {dayEntry?.reflectionText && (
            <div className="text-[13px] text-text-primary leading-[1.5] border-l-2 border-border-default pl-3 italic">
              {dayEntry.reflectionText}
            </div>
          )}
          <button
            type="button"
            onClick={handleReopen}
            className="text-[12px] text-text-warning hover:brightness-110 transition"
          >
            Re-open day
          </button>
        </div>
      </section>
    );
  }

  // ─── STATE B (or planAndReview off): in-progress ───
  const doneActionsCount = todays.filter((a) => a.status === "done").length;
  const remainingActionsCount = todays.length - doneActionsCount;

  return (
    <section>
      <div className="space-y-6">
        {mainTask && (
          <div>
            <div className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-tertiary mb-2">
              MAIN TASK
            </div>
            <div
              onClick={() => openPanel({ kind: "action", mode: "edit", id: mainTask.id })}
              className="flex items-center gap-3 px-4 py-3 bg-surface-elevated border border-border-subtle rounded-[6px] cursor-pointer hover:bg-surface-hover transition-colors"
            >
              <span className="text-[18px] font-medium text-text-primary truncate">{mainTask.title}</span>
              <span className="font-mono text-[12px] text-text-secondary truncate">
                {breadcrumb(mainTask.goalId, mainTask.projectId)}
              </span>
              <div className="flex-1" />
              {mainTask.impact > 0 && (
                <span className="font-mono text-[11px] text-text-secondary">I{mainTask.impact}</span>
              )}
              {fmtTime(mainTask.timeEstimateMinutes) && (
                <TimePill>{fmtTime(mainTask.timeEstimateMinutes)}</TimePill>
              )}
            </div>
          </div>
        )}

        {/* ACTIONS GROUP */}
        <div>
          <div className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-tertiary">
            TODAY'S ACTIONS · {todays.length}
          </div>
          {todays.length > 0 && (
            <div className="font-mono text-[12px] text-text-secondary mt-1 mb-2 tabular-nums">
              {doneActionsCount} done · {remainingActionsCount} remaining
            </div>
          )}
          {todays.length === 0 ? (
            <div className="px-3 py-4 text-center font-mono text-[11px] text-text-tertiary border border-dashed border-border-subtle rounded-[4px]">
              No actions for today.
            </div>
          ) : (
            <div>
              {todays.map((a) => (
                <SharedActionRow
                  key={a.id}
                  action={a}
                  onClick={() => openPanel({ kind: "action", mode: "edit", id: a.id })}
                  onToggleDone={() => {
                    if (a.status !== "done") handleToggleDone(a.id);
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* RITUALS GROUP */}
        <div>
          {(() => {
            const doneCount = todaysRituals.filter((r) =>
              r.completionHistory.some(
                (c) => c.date === TODAY_ISO && (c.status === "done" || !c.status),
              ),
            ).length;
            const skippedCount = todaysRituals.filter((r) => skippedRitualSet.has(r.id)).length;
            const pendingCount = ritualsTotal - doneCount - skippedCount;
            return (
              <>
                <div className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-tertiary">
                  TODAY'S RITUALS · {ritualsTotal}
                </div>
                {ritualsTotal > 0 && (
                  <div className="font-mono text-[12px] text-text-secondary mb-2 mt-1 tabular-nums">
                    {doneCount} done · {pendingCount} pending · {skippedCount} skipped
                  </div>
                )}
              </>
            );
          })()}
          {todaysRituals.length === 0 ? (
            <div className="font-mono text-[11px] text-text-tertiary px-3 py-2">No rituals today.</div>
          ) : (
            <div className="space-y-1">
              {todaysRituals.map((r) => {
                const doneToday = r.completionHistory.some(
                  (c) => c.date === TODAY_ISO && (c.status === "done" || !c.status),
                );
                const isSkipped = skippedRitualSet.has(r.id);
                const mult = ritualMultiplier(r.totalCompletions);
                const color = colorVar(r.goalId);
                return (
                  <div
                    key={r.id}
                    className={`flex items-center gap-2 pr-3 h-8 rounded-[2px] hover:bg-surface-hover transition-colors group ${
                      isSkipped ? "opacity-50" : ""
                    }`}
                  >
                    <button
                      onClick={() => !isSkipped && handleRitualDone(r.id, doneToday)}
                      disabled={isSkipped}
                      className="ml-2 w-2.5 h-2.5 rounded-full border transition-colors shrink-0 disabled:cursor-not-allowed"
                      style={{ borderColor: color, background: doneToday ? color : "transparent" }}
                      aria-label={doneToday ? "Done today" : "Mark ritual done"}
                    />
                    <span
                      className={`text-[13px] truncate cursor-pointer ${
                        doneToday || isSkipped ? "text-text-tertiary line-through" : "text-text-primary"
                      }`}
                      onClick={() => openPanel({ kind: "ritual", mode: "edit", id: r.id })}
                    >
                      {r.title}
                    </span>
                    <span className="font-mono text-[11px] text-text-tertiary truncate">
                      {r.schedule[0].toUpperCase() + r.schedule.slice(1)} · ×{mult.toFixed(2)}
                    </span>
                    <div className="flex-1" />
                    {doneToday ? (
                      <span className="font-mono text-[11px] text-text-secondary">✓ Done</span>
                    ) : (
                      <button
                        onClick={() => handleRitualSkipToggle(r.id, isSkipped)}
                        className="text-[11px] text-text-tertiary hover:text-text-primary transition"
                      >
                        {isSkipped ? "Restore" : "Skip"}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* INLINE-ADD — sticky at bottom of viewport on mobile */}
        <div
          className="flex items-center gap-2 rounded-[4px] px-3 py-2 bg-surface-raised border border-dashed border-border-subtle md:static max-md:fixed max-md:left-0 max-md:right-0 max-md:bottom-0 max-md:z-40 max-md:bg-surface-base max-md:border-0 max-md:border-t max-md:border-solid max-md:border-border-subtle max-md:rounded-none max-md:px-4 max-md:py-3"
        >
          <input
            value={quickAdd}
            onChange={(e) => setQuickAdd(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleQuickAdd(); }}
            className="flex-1 bg-transparent text-[13px] text-text-primary placeholder:text-text-tertiary focus:outline-none"
            placeholder="+ Add action for today…"
          />
          <span className="font-mono text-[11px] text-text-tertiary">⏎</span>
        </div>

        {/* CLOSE DAY */}
        {planAndReview && (
          <button
            type="button"
            onClick={onCloseClick}
            className="w-full md:w-auto px-5 py-2 rounded-[4px] border border-[hsl(var(--accent))] text-[hsl(var(--accent))] text-[13px] font-medium hover:bg-surface-hover transition"
          >
            Close day
          </button>
        )}
      </div>
    </section>
  );
};


/* ===== Heavy Lift (live) ===== */
const HeavyLift: React.FC = () => {
  const actions = useStore((s) => s.actions);
  const goals = useStore((s) => s.goals);
  const projects = useStore((s) => s.projects);
  const openPanel = useStore((s) => s.openPanel);
  const changeStatus = useStore((s) => s.changeActionStatus);

  const items = actions
    .filter((a) => (a.status === "planned" || a.status === "backlog"))
    .filter((a) => (a.impact ?? 0) >= 6 && (a.timeEstimateMinutes ?? 0) >= 60)
    .sort((a, b) => (b.impact ?? 0) - (a.impact ?? 0))
    .slice(0, 3);

  return (
    <section>
      <SectionLabel meta="HIGH IMPACT · HIGH EFFORT">Heavy lift today</SectionLabel>
      {items.length === 0 ? (
        <div className="font-mono text-[11px] text-text-tertiary px-3 py-2">
          No heavy-lift candidates. Add actions with impact ≥ 6 and time ≥ 1h.
        </div>
      ) : (
        <div className="space-y-1">
          {items.map((a) => {
            const g = goals.find((gg) => gg.id === a.goalId);
            const p = a.projectId ? projects.find((pp) => pp.id === a.projectId) : undefined;
            const c = g ? `hsl(var(--${g.color}))` : "hsl(var(--text-tertiary))";
            const time = fmtTime(a.timeEstimateMinutes);
            const crumb = `${g?.title ?? ""}${p ? ` · ${p.title}` : ""}`;
            return (
              <div
                key={a.id}
                className="group flex items-center gap-3 pr-3 min-h-9 rounded-[2px] hover:bg-surface-hover transition-colors overflow-hidden"
              >
                <Strip color={c} />
                <div className="w-[52px] pl-2">
                  <div className="font-mono text-[10px] uppercase tracking-[0.06em] text-text-tertiary leading-none">IMPACT</div>
                  <div className="font-mono text-[16px] text-text-primary leading-tight">{a.impact}</div>
                </div>
                <div className="min-w-0 flex-1 py-1.5">
                  <div className="text-[13px] font-medium text-text-primary truncate">{a.title}</div>
                  <div className="text-[11px] text-text-secondary truncate">{crumb}</div>
                </div>
                {time && <span className="font-mono text-[12px] text-text-secondary whitespace-nowrap">{time}</span>}
                <button
                  onClick={() => { changeStatus(a.id, "done"); toast.success("Action completed"); }}
                  className="text-[12px] text-accent hover:text-accent-hover whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  Mark done
                </button>
                <button
                  onClick={() => openPanel({ kind: "action", mode: "edit", id: a.id })}
                  className="text-[12px] text-text-secondary hover:text-text-primary whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  Open
                </button>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};

/* ===== Quick Moves (live) ===== */
const QuickMoves: React.FC = () => {
  const actions = useStore((s) => s.actions);
  const goals = useStore((s) => s.goals);
  const projects = useStore((s) => s.projects);
  const openPanel = useStore((s) => s.openPanel);
  const changeStatus = useStore((s) => s.changeActionStatus);

  const items = actions
    .filter((a) => a.status === "planned" || a.status === "backlog")
    .filter((a) => (a.impact ?? 0) >= 4 && (a.timeEstimateMinutes ?? 31) <= 30)
    .sort((a, b) => (b.impact ?? 0) - (a.impact ?? 0))
    .slice(0, 5);

  return (
    <section>
      <SectionLabel meta="HIGH IMPACT · LOW EFFORT">Quick moves</SectionLabel>
      {items.length === 0 ? (
        <div className="font-mono text-[11px] text-text-tertiary px-3 py-2">
          No quick wins available. Add actions with impact ≥ 4 and time ≤ 30m.
        </div>
      ) : (
        <div className="space-y-0.5">
          {items.map((a) => {
            const g = goals.find((gg) => gg.id === a.goalId);
            const p = a.projectId ? projects.find((pp) => pp.id === a.projectId) : undefined;
            const c = g ? `hsl(var(--${g.color}))` : "hsl(var(--text-tertiary))";
            const time = fmtTime(a.timeEstimateMinutes) ?? "";
            const meta = `I${a.impact}${time ? ` · ${time}` : ""}`;
            return (
              <div
                key={a.id}
                onClick={() => openPanel({ kind: "action", mode: "edit", id: a.id })}
                className="flex items-center gap-3 pr-3 h-7 rounded-[2px] hover:bg-surface-hover transition-colors overflow-hidden cursor-pointer"
              >
                <Strip color={c} />
                <button
                  onClick={(e) => { e.stopPropagation(); changeStatus(a.id, "done"); toast.success("Action completed"); }}
                  className="ml-1 inline-block rounded-[2px] border border-text-tertiary hover:border-accent shrink-0"
                  style={{ width: 14, height: 14 }}
                  aria-label="Mark done"
                />
                <span className="text-[13px] text-text-primary truncate">{a.title}</span>
                <span className="text-[12px] text-text-secondary truncate">· {g?.title}{p ? ` · ${p.title}` : ""}</span>
                <div className="flex-1" />
                {a.delegateName && (
                  <span className="font-mono text-[11px] text-text-tertiary">→ {a.delegateName}</span>
                )}
                <span className="font-mono text-[11px] text-text-secondary whitespace-nowrap">{meta}</span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};

/* ===== Bottom Utility Row ===== */
const TinyHeader: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="font-mono text-[10px] uppercase tracking-[0.06em] text-text-tertiary">{children}</div>
);

export const RecentlyClosed: React.FC = () => {
  const projects = useStore((s) => s.projects);
  const goals = useStore((s) => s.goals);
  const items = projects
    .filter((p) => p.status === "completed" && p.completedAt)
    .sort((a, b) => (b.completedAt ?? "").localeCompare(a.completedAt ?? ""))
    .slice(0, 3)
    .map((p) => {
      const g = goals.find((gg) => gg.id === p.goalId);
      const d = new Date(p.completedAt!);
      return {
        id: p.id,
        c: g ? `hsl(var(--${g.color}))` : "hsl(var(--text-tertiary))",
        name: p.title,
        date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      };
    });
  return (
    <div className="p-4">
      <TinyHeader>RECENTLY CLOSED · {items.length}</TinyHeader>
      <div className="mt-3 space-y-1.5">
        {items.length === 0 && (
          <div className="font-mono text-[11px] text-text-tertiary">No closed projects yet.</div>
        )}
        {items.map((it) => (
          <div key={it.id} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: it.c }} />
            <span className="text-[12px] text-text-primary truncate">{it.name}</span>
            <span className="font-mono text-[11px] text-text-tertiary whitespace-nowrap">· {it.date}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export const Delegated: React.FC = () => {
  const actions = useStore((s) => s.actions);
  const items = actions.filter((a) => a.status === "delegated").slice(0, 4);
  return (
    <div className="p-4">
      <TinyHeader>DELEGATED · {items.length} ACTIVE</TinyHeader>
      <div className="mt-3 space-y-1.5">
        {items.length === 0 && (
          <div className="font-mono text-[11px] text-text-tertiary">No delegations.</div>
        )}
        {items.map((a) => (
          <div key={a.id} className="flex items-baseline gap-1 min-w-0">
            <span className="text-[12px] text-text-primary truncate">{a.title}</span>
            {a.delegateName && (
              <span className="font-mono text-[11px] text-text-tertiary whitespace-nowrap">· → {a.delegateName}</span>
            )}
          </div>
        ))}
      </div>
      <Link to="/delegated" className="inline-block mt-2 text-[12px] text-accent hover:text-accent-hover">
        View all →
      </Link>
    </div>
  );
};

const ThisWeek: React.FC = () => {
  const actions = useStore((s) => s.actions);
  const projects = useStore((s) => s.projects);
  const cutoff = Date.now() - 7 * 86400000;
  const inWeek = (iso?: string) => !!iso && new Date(iso).getTime() >= cutoff;
  const done = actions.filter((a) => a.status === "done" && inWeek(a.completedAt)).length;
  const delegated = actions.filter((a) => a.status === "delegated" && inWeek(a.delegatedAt)).length;
  const dropped = actions.filter(
    (a) => (a.status === "dropped" || a.status === "cancelled") && inWeek(a.droppedAt ?? a.cancelledAt),
  ).length;
  const projClosed = projects.filter((p) => p.status === "completed" && inWeek(p.completedAt)).length;
  const stats = [
    { n: `${done}`, label: "actions done" },
    { n: `${delegated}`, label: "delegated" },
    { n: `${dropped}`, label: "dropped" },
    { n: `${projClosed}`, label: "projects closed" },
  ];
  return (
    <div className="p-4">
      <TinyHeader>THIS WEEK</TinyHeader>
      <div className="mt-3 space-y-1.5 font-mono text-[12px]">
        {stats.map((s, i) => (
          <div key={i} className="flex items-baseline gap-3">
            <span className="text-text-primary tabular-nums w-4 text-right">{s.n}</span>
            <span className="text-text-tertiary">{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const UtilityRow: React.FC = () => (
  <div className="grid grid-cols-3 divide-x divide-border-subtle border border-border-subtle rounded-[6px] bg-surface-elevated">
    <RecentlyClosed />
    <Delegated />
    <ThisWeek />
  </div>
);

/* ===== Yesterday review card ===== */
const YesterdayCard: React.FC = () => {
  const goals = useStore((s) => s.goals);
  const actions = useStore((s) => s.actions);
  const rituals = useStore((s) => s.rituals);
  const yEntry = useStore((s) => s.dayEntries.find((d) => d.date === YESTERDAY_ISO));

  const yDate = new Date(YESTERDAY_ISO + "T00:00:00");
  const headerDate = yDate
    .toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
    .toUpperCase();

  const dtLabel = yEntry?.dayType ? `${DAY_TYPE_LABELS[yEntry.dayType]} day` : "Not planned";

  // Stats
  const yActions = actions.filter((a) => a.completedAt?.slice(0, 10) === YESTERDAY_ISO && a.status === "done");
  const yDelegated = actions.filter(
    (a) => a.delegatedAt?.slice(0, 10) === YESTERDAY_ISO && a.status === "delegated",
  );
  const actionsDone = yActions.length;
  const ritualsDone = rituals.reduce(
    (n, r) =>
      n +
      (r.completionHistory.some(
        (c) => c.date === YESTERDAY_ISO && (c.status === "done" || !c.status),
      )
        ? 1
        : 0),
    0,
  );
  // Time invested = full Done time + 20% Delegated time.
  const investedMinFor = (a: typeof actions[number]) => {
    const t = a.timeEstimateMinutes ?? 0;
    if (t <= 0) return 0;
    if (a.status === "done") return t;
    if (a.status === "delegated") return Math.round(t * 0.2);
    return 0;
  };
  const investedAll = [...yActions, ...yDelegated];
  const totalMin = investedAll.reduce((sum, a) => sum + investedMinFor(a), 0);
  const hours = totalMin >= 60 ? `${(totalMin / 60).toFixed(1)}h` : `${totalMin}m`;

  // Per-goal time invested
  const perGoal = goals
    .filter((g) => g.status === "active")
    .map((g) => {
      const min = investedAll
        .filter((a) => a.goalId === g.id)
        .reduce((s, a) => s + investedMinFor(a), 0);
      return { g, min };
    })
    .filter((x) => x.min > 0);

  // Last activity
  const lastIso = yActions
    .map((a) => a.completedAt)
    .filter(Boolean)
    .sort()
    .at(-1);
  const lastTime = lastIso
    ? new Date(lastIso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : null;

  return (
    <section className="bg-surface-elevated border border-border-subtle rounded-[6px] p-6">
      <div className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-tertiary">
        YESTERDAY · {headerDate}
      </div>
      <div className="mt-2 text-[14px] text-text-primary">{dtLabel}</div>
      <div className="mt-1 font-mono text-[13px] text-text-secondary tabular-nums">
        {actionsDone} actions done · {ritualsDone} rituals · {hours} invested
      </div>
      {perGoal.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5">
          {perGoal.map(({ g, min }) => (
            <div key={g.id} className="flex items-center gap-1.5 font-mono text-[12px] text-text-secondary">
              <span className="w-2 h-2 rounded-full" style={{ background: `hsl(var(--${g.color}))` }} />
              <span className="text-text-primary">{g.title}</span>
              <span className="text-text-tertiary">·</span>
              <span className="tabular-nums">
                {min >= 60 ? `${(min / 60).toFixed(1)}h` : `${min}m`}
              </span>
            </div>
          ))}
        </div>
      )}
      {lastTime && (
        <div className="mt-3 font-mono text-[12px] text-text-tertiary">
          Last activity: {lastTime}
        </div>
      )}
      <Link
        to={`/reviews/days/${YESTERDAY_ISO}`}
        className="inline-block mt-4 text-[12px] text-text-secondary hover:text-text-primary transition-colors"
      >
        View full review →
      </Link>
    </section>
  );
};

/* ===== Page (Today) ===== */
const Index: React.FC = () => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [planOpen, setPlanOpen] = useState(false);
  const [closeOpen, setCloseOpen] = useState(false);
  const [combinedOpen, setCombinedOpen] = useState(false);

  const settings = useStore((s) => s.settings);
  const todayEntry = useStore((s) => s.dayEntries.find((d) => d.date === TODAY_ISO));
  const yesterdayEntry = useStore((s) => s.dayEntries.find((d) => d.date === YESTERDAY_ISO));
  const actions = useStore((s) => s.actions);
  const rituals = useStore((s) => s.rituals);

  // Auto-open Plan or Combined modal once per day on first visit.
  useEffect(() => {
    // Plan & Review is now always-on; no layer gate.
    const flagKey = `actos-day-prompt-${TODAY_ISO}`;
    if (sessionStorage.getItem(flagKey)) return;
    if (todayEntry?.isPlanned) return;
    sessionStorage.setItem(flagKey, "1");
    if (yesterdayEntry && !yesterdayEntry.isClosed && (yesterdayEntry.isPlanned || yesterdayEntry.startedAt)) {
      setCombinedOpen(true);
    } else {
      setPlanOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Listen for global Command Palette events (open Plan/Close/Settings).
  useEffect(() => {
    const unsubs = [
      subscribeAppEvent("open-plan-today", () => setPlanOpen(true)),
      subscribeAppEvent("open-close-day", () => setCloseOpen(true)),
      subscribeAppEvent("open-settings", () => setSettingsOpen(true)),
    ];
    return () => unsubs.forEach((u) => u());
  }, []);

  const isPlanned = !!todayEntry?.isPlanned;
  const isClosed = !!todayEntry?.isClosed;
  const planAndReview = settings.layers.planAndReview;

  // Header date + meta
  const today = new Date();
  const headerDate = today.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  const startedTime = todayEntry?.startedAt
    ? new Date(todayEntry.startedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : null;
  const dayTypeLabel = todayEntry?.dayType ? `${DAY_TYPE_LABELS[todayEntry.dayType]} day` : null;
  const subLine =
    isPlanned && dayTypeLabel
      ? `${dayTypeLabel}${startedTime ? ` · Started ${startedTime}` : ""}`
      : "";

  // Aggregate stats for header right
  const plannedSet = new Set(todayEntry?.plannedActionIds ?? []);
  const todaysActionCount = actions.filter(
    (a) =>
      a.status !== "dropped" &&
      a.status !== "cancelled" &&
      (planAndReview && isPlanned
        ? plannedSet.has(a.id) || a.scheduledDate === TODAY_ISO
        : a.scheduledDate === TODAY_ISO),
  ).length;
  const plannedRitualSet = new Set(todayEntry?.plannedRitualIds ?? []);
  const todaysRitualCount = rituals.filter(
    (r) => r.status === "active" && (planAndReview && isPlanned ? plannedRitualSet.has(r.id) : true),
  ).length;
  const aggMeta = isPlanned ? `${todaysActionCount} actions · ${todaysRitualCount} rituals` : "";

  // Yesterday card visibility: show if yesterday wasn't closed OR today isn't planned
  const showYesterday = (!yesterdayEntry?.isClosed || !isPlanned) && !!(
    yesterdayEntry || actions.some((a) => a.completedAt?.slice(0, 10) === YESTERDAY_ISO)
  );

  return (
    <div className="min-h-screen bg-surface-base text-text-primary">
      <AppSidebar onOpenSettings={() => setSettingsOpen(true)} />
      <SettingsPanel open={settingsOpen} onOpenChange={setSettingsOpen} />
      <PlanTodayModal open={planOpen} onClose={() => setPlanOpen(false)} />
      <CloseDayModal open={closeOpen} onClose={() => setCloseOpen(false)} />
      <ClosePlanModal open={combinedOpen} onClose={() => setCombinedOpen(false)} />
      <main className="ml-[var(--sidebar-w,220px)] px-8 py-6 max-w-[1200px]">
        <header className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[24px] font-medium text-text-primary leading-tight">{headerDate}</h1>
            {subLine && (
              <div className="font-mono text-[13px] text-text-tertiary mt-1">{subLine}</div>
            )}
          </div>
          {aggMeta && (
            <div className="font-mono text-[13px] text-text-tertiary tabular-nums pt-2">
              {aggMeta}
            </div>
          )}
        </header>

        {showYesterday && !isClosed && (
          <>
            <YesterdayCard />
            <div className="h-8" />
          </>
        )}

        <TodayZone
          onPlanClick={() => setPlanOpen(true)}
          onCloseClick={() => setCloseOpen(true)}
        />

        <div className="h-12" />
      </main>
    </div>
  );
};

export default Index;

