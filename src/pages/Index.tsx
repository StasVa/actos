import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Tooltip, SparkTooltipContent, StateDotTooltip } from "@/components/Tooltip";
import { LifetimeCounters } from "@/components/LifetimeCounters";
import { buildYouTubeTooltips, buildFitnessTooltips, buildReadingTooltips } from "@/lib/sparkTooltips";
import { useStore } from "@/store/useStore";
import { DayStartPanel } from "@/components/DayStartPanel";
import { SettingsPanel } from "@/components/SettingsPanel";
import { ritualMultiplier } from "@/store/useStore";
import { CardMenu } from "@/components/CardMenu";
import { ConfirmModal } from "@/components/ConfirmModal";
import { toast } from "sonner";

const TODAY_ISO = new Date().toISOString().slice(0, 10);

/* ===== Tokens ===== */
const G1 = "hsl(var(--goal-1))";
const G2 = "hsl(var(--goal-2))";
const G3 = "hsl(var(--goal-3))";

/* ===== Primitives ===== */
const SectionLabel: React.FC<{ children: React.ReactNode; meta?: React.ReactNode }> = ({ children, meta }) => (
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

/* ===== Sidebar ===== */
const NAV: { label: string; href: string }[] = [
  { label: "Home", href: "/" },
  { label: "Weekly", href: "#" },
  { label: "Ideas", href: "/ideas" },
  { label: "Rituals", href: "/rituals" },
  { label: "All actions", href: "/all-actions" },
  { label: "All projects", href: "/all-projects" },
  { label: "All delegated", href: "/all-delegated" },
];

const Sidebar: React.FC<{ onOpenSettings: () => void }> = ({ onOpenSettings }) => {
  const { pathname } = useLocation();
  return (
  <aside className="fixed left-0 top-0 bottom-0 w-[220px] bg-surface-raised border-r border-border-subtle p-4 flex flex-col">
    <div className="px-1 py-1 text-[17px] font-semibold text-text-primary tracking-tight">ActOS</div>
    <nav className="mt-8 flex flex-col gap-1">
      {NAV.map((item) => {
        const active =
          (item.href === "/" && pathname === "/") ||
          (item.href !== "/" && item.href !== "#" && pathname.startsWith(item.href));
        return (
          <Link
            key={item.label}
            to={item.href}
            className={`px-2.5 py-1.5 rounded-[4px] text-[13px] transition-colors ${
              active
                ? "bg-surface-hover text-text-primary font-medium"
                : "text-text-secondary font-normal hover:text-text-primary"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>

    <div className="flex-1" />

    <button
      type="button"
      onClick={onOpenSettings}
      className="text-left px-2.5 py-1.5 rounded-[4px] text-[13px] text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors mb-2"
    >
      Settings
    </button>
    <div className="font-mono text-[11px] text-text-tertiary px-1">⌘K  Quick add</div>
      <div className="font-mono text-[11px] text-text-tertiary px-1">?   Shortcuts</div>
    <div className="mt-4 font-mono text-[11px] text-text-secondary px-1 leading-[1.7]">
      <LifetimeCounters />
    </div>
    <div className="mt-3 flex items-center gap-2 p-1 rounded-[4px] hover:bg-surface-hover cursor-pointer">
      <span className="w-7 h-7 rounded-full bg-surface-hover flex items-center justify-center font-mono text-[11px] text-text-primary">
        AK
      </span>
      <span className="font-mono text-[11px] text-text-secondary truncate">ak@email</span>
    </div>
  </aside>
  );
};

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

const DualBars: React.FC<{ outcome: number; effort: number; color: string }> = ({ outcome, effort, color }) => (
  <div className="space-y-3">
    <div>
      <div className="flex justify-between font-mono text-[10px] uppercase tracking-[0.08em] text-text-tertiary mb-1">
        <span>Outcome</span>
        <span>{outcome}%</span>
      </div>
      <div className="h-2 w-full bg-surface-hover rounded-[1px] overflow-hidden">
        <div className="h-full" style={{ width: `${outcome}%`, background: color }} />
      </div>
    </div>
    <div>
      <div className="flex justify-between font-mono text-[10px] uppercase tracking-[0.08em] text-text-tertiary mb-1">
        <span>Effort</span>
        <span>{effort}%</span>
      </div>
      <div className="h-2 w-full bg-surface-hover rounded-[1px] overflow-hidden">
        <div className="h-full" style={{ width: `${effort}%`, background: color, opacity: 0.6 }} />
      </div>
    </div>
  </div>
);

const GoalColumn: React.FC<{
  title: string;
  state: "active" | "stalled";
  type: string;
  target?: string;
  progress: number;
  meta: string[];
  outcome: number;
  effort: number;
  spark: number[];
  sparkTips: import("@/components/Tooltip").DayInfo[];
  lastActivity?: string;
  stalledFor?: string;
  color: string;
  recent: React.ReactNode;
  href?: string;
}> = ({ title, state, type, target, progress, meta, outcome, effort, spark, sparkTips, lastActivity, stalledFor, color, recent, href }) => {
  const inner = (
    <div className="px-6 py-1 space-y-4 first:pl-0 last:pr-0 group">
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2.5 min-w-0">
        <Tooltip content={<StateDotTooltip state={state} lastActivity={lastActivity} stalledFor={stalledFor} />}>
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ background: state === "active" ? "hsl(var(--state-active))" : "hsl(var(--state-stalled))" }}
          />
        </Tooltip>
        <h3 className={`text-[18px] font-medium text-text-primary truncate ${href ? "group-hover:text-accent transition-colors" : ""}`}>{title}</h3>
        <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-text-tertiary shrink-0">{type}</span>
      </div>
      {target && (
        <div className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-tertiary shrink-0">{target}</div>
      )}
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

    <div className="font-mono text-[11px] text-text-secondary leading-relaxed">{recent}</div>
    </div>
  );
  if (href) {
    return (
      <Link to={href} className="block cursor-pointer">
        {inner}
      </Link>
    );
  }
  return inner;
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

const Hero: React.FC = () => {
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
      className="bg-surface-elevated border border-border-subtle rounded-[6px] p-6 grid divide-x divide-border-subtle"
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
              `${projectsClosed} of ${projectsTotal} projects ${projectsTotal === 1 ? "closed" : "closed"}`,
              `${actionsDone} actions done`,
              `Last activity: ${lastLabel}`,
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
                <>Recent: {recentDone.map((t) => `✓ ${t}`).join(" · ")}</>
              ) : (
                <>No closed actions yet.</>
              )
            }
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
  const openPanel = useStore((s) => s.openPanel);
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
                  { label: "Edit", onSelect: () => openPanel({ kind: "project", mode: "edit", id: p.id }) },
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
              <span className="text-text-primary">{p.done}/{p.hasActions ? p.total : 0}</span>
              <span className="text-text-tertiary"> actions</span>
            </div>
            <div className="text-text-secondary">
              Last:{" "}
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
const ActiveProjects: React.FC = () => {
  const goals = useStore((s) => s.goals);
  const projects = useStore((s) => s.projects);
  const actions = useStore((s) => s.actions);

  const activeProjects = projects.filter((p) => p.status === "active");
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
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {projectsWithMeta.map((p) => {
            const pct = p.hasActions ? Math.round((p.done / p.total) * 100) : 0;
            return (
              <ActiveProjectCard
                key={p.id}
                p={p}
                pct={pct}
              />
            );
          })}
        </div>
      )}
    </section>
  );
};

/* ===== Today (live store-wired) ===== */
function fmtTime(min?: number): string | null {
  if (!min) return null;
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  return `${m}m`;
}

const Today: React.FC = () => {
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
  const markRitualInstanceDone = useStore((s) => s.markRitualInstanceDone);

  const [quickAdd, setQuickAdd] = useState("");

  const todays = actions
    .filter((a) => a.scheduledDate === TODAY_ISO && a.status === "planned")
    .sort((a, b) => (b.impact ?? 0) - (a.impact ?? 0));

  const mainTaskId = dayEntry?.mainTaskActionId;
  const mainTask = mainTaskId ? actions.find((a) => a.id === mainTaskId) : undefined;
  const others = todays.filter((a) => a.id !== mainTaskId);

  const todaysRituals = rituals.filter((r) => r.status === "active");
  const ritualsTotal = todaysRituals.length;

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

  const handleToggleDone = (id: string) => {
    changeActionStatus(id, "done");
    toast.success("Action completed");
  };

  const handleQuickAdd = () => {
    const t = quickAdd.trim();
    if (!t) return;
    const id = createAction({ title: t, scheduledDate: TODAY_ISO });
    setQuickAdd("");
    toast.success("Action added to today");
    openPanel({ kind: "action", mode: "edit", id });
  };

  const handleRitualToggle = (ritualId: string, alreadyDone: boolean) => {
    if (alreadyDone) return;
    markRitualInstanceDone(ritualId);
    toast.success("Ritual logged");
  };

  return (
    <section>
      <SectionLabel meta={`${todays.length} ACTIONS · ${ritualsTotal} RITUALS`}>Today</SectionLabel>
      <div className="space-y-2">
        {mainTask && (
          <div
            onClick={() => openPanel({ kind: "action", mode: "edit", id: mainTask.id })}
            className="flex items-center gap-3 px-3 py-2 bg-surface-raised rounded-[4px] cursor-pointer hover:bg-surface-hover transition-colors"
          >
            <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-text-tertiary">MAIN</span>
            <span className="text-[13px] font-medium text-text-primary">{mainTask.title}</span>
            <span className="text-[12px] text-text-secondary">{breadcrumb(mainTask.goalId, mainTask.projectId)}</span>
            <div className="flex-1" />
            {fmtTime(mainTask.timeEstimateMinutes) && (
              <TimePill>{fmtTime(mainTask.timeEstimateMinutes)}</TimePill>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); handleToggleDone(mainTask.id); }}
              className="inline-block rounded-[2px] border border-text-tertiary hover:border-accent shrink-0"
              style={{ width: 14, height: 14 }}
              aria-label="Mark done"
            />
          </div>
        )}

        {others.length === 0 && !mainTask && (
          <div className="px-3 py-6 text-center font-mono text-[11px] text-text-tertiary border border-dashed border-border-subtle rounded-[4px]">
            No actions scheduled for today. Add one below.
          </div>
        )}

        {others.map((a) => {
          const time = fmtTime(a.timeEstimateMinutes);
          return (
            <div
              key={a.id}
              onClick={() => openPanel({ kind: "action", mode: "edit", id: a.id })}
              className="flex items-center gap-3 pr-3 h-8 rounded-[2px] hover:bg-surface-hover transition-colors overflow-hidden cursor-pointer"
            >
              <Strip color={colorVar(a.goalId)} />
              <button
                onClick={(e) => { e.stopPropagation(); handleToggleDone(a.id); }}
                className="ml-1 inline-block rounded-[2px] border border-text-tertiary hover:border-accent shrink-0"
                style={{ width: 14, height: 14 }}
                aria-label="Mark done"
              />
              <span className="text-[13px] text-text-primary truncate">{a.title}</span>
              <span className="text-[12px] text-text-secondary truncate">{breadcrumb(a.goalId, a.projectId)}</span>
              <div className="flex-1" />
              {a.delegateName && (
                <span className="font-mono text-[11px] text-text-tertiary">→ {a.delegateName}</span>
              )}
              {time && <TimePill>{time}</TimePill>}
            </div>
          );
        })}

        {todaysRituals.length > 0 && (
          <div className="flex flex-wrap gap-x-6 gap-y-2 pt-1">
            {todaysRituals.map((r) => {
              const doneToday = r.completionHistory.some((c) => c.date === TODAY_ISO);
              const mult = ritualMultiplier(r.totalCompletions);
              const color = colorVar(r.goalId);
              return (
                <div
                  key={r.id}
                  onClick={() => openPanel({ kind: "ritual", mode: "edit", id: r.id })}
                  className="flex items-center gap-2 cursor-pointer group"
                >
                  <button
                    onClick={(e) => { e.stopPropagation(); handleRitualToggle(r.id, doneToday); }}
                    className="w-2.5 h-2.5 rounded-full border transition-colors"
                    style={{
                      borderColor: color,
                      background: doneToday ? color : "transparent",
                    }}
                    aria-label={doneToday ? "Done today" : "Mark ritual done"}
                  />
                  <span className="text-[13px] text-text-primary group-hover:text-accent transition-colors">{r.title}</span>
                  <span className="font-mono text-[11px] text-text-tertiary">
                    {r.schedule[0].toUpperCase() + r.schedule.slice(1)} · {r.totalCompletions} done · ×{mult.toFixed(2)}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex items-center gap-2 bg-surface-raised border border-border-subtle rounded-[4px] px-3 py-2 mt-2">
          <input
            value={quickAdd}
            onChange={(e) => setQuickAdd(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleQuickAdd(); }}
            className="flex-1 bg-transparent text-[13px] text-text-primary placeholder:text-text-tertiary focus:outline-none"
            placeholder="Add an action for today…"
          />
          <span className="font-mono text-[11px] text-text-tertiary">⏎</span>
        </div>
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

const RecentlyClosed: React.FC = () => {
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

const Delegated: React.FC = () => {
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
      <Link to="/all-delegated" className="inline-block mt-2 text-[12px] text-accent hover:text-accent-hover">
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

/* ===== Page ===== */
const Index: React.FC = () => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  return (
    <div className="min-h-screen bg-surface-base text-text-primary">
      <Sidebar onOpenSettings={() => setSettingsOpen(true)} />
      <SettingsPanel open={settingsOpen} onOpenChange={setSettingsOpen} />
      <main className="ml-[220px] px-8 py-6">
        <header className="mb-6">
          <h1 className="text-[20px] font-medium text-text-primary">Tuesday, May 5</h1>
          <div className="font-mono text-[12px] text-text-tertiary mt-0.5">Execution day</div>
        </header>

        <Hero />

        <div className="h-8" />
        <ActiveProjects />
        <div className="h-8 border-b border-border-subtle" />

        <div className="h-8" />
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
          <Today />
          <DayStartPanel />
        </div>

        <div className="my-6 border-t border-border-subtle" />
        <HeavyLift />

        <div className="my-6 border-t border-border-subtle" />
        <QuickMoves />

        <div className="h-8" />
        <UtilityRow />

        <div className="h-8" />
      </main>
    </div>
  );
};

export default Index;
