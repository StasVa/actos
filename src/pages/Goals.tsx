import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useStore, ritualMultiplier } from "@/store/useStore";
import { AppSidebar } from "@/components/AppSidebar";
import { MobileHeader } from "@/components/MobileHeader";
import { SettingsPanel } from "@/components/SettingsPanel";
import { CardMenu } from "@/components/CardMenu";
import { ConfirmModal } from "@/components/ConfirmModal";
import { FilterDropdown, FilterOption } from "@/components/FilterDropdown";
import { SortDropdown } from "@/components/SortDropdown";
import { Tooltip, SparkTooltipContent, StateDotTooltip, type DayInfo } from "@/components/Tooltip";
import { toast } from "sonner";
import type { Goal } from "@/types";

type StateFilter = "all" | "active" | "completed" | "dropped";
type TypeFilter = "all" | "short-term" | "mid-term";
type SortKey = "recent" | "created" | "progress";

const STATE_OPTIONS: FilterOption<StateFilter>[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "dropped", label: "Dropped" },
];
const TYPE_OPTIONS: FilterOption<TypeFilter>[] = [
  { value: "all", label: "All" },
  { value: "short-term", label: "Short-term" },
  { value: "mid-term", label: "Mid-term" },
];
const SORT_OPTIONS: FilterOption<SortKey>[] = [
  { value: "recent", label: "Recent activity" },
  { value: "created", label: "Created date" },
  { value: "progress", label: "Progress" },
];

function fmtAgo(iso?: string): string {
  if (!iso) return "—";
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days <= 0) return "today";
  if (days === 1) return "1d ago";
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function fmtTime(minutes: number): string {
  if (!minutes || minutes <= 0) return "0m";
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes - h * 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

type GoalMeta = {
  goal: Goal;
  progress: number;
  outcome: number;
  effort: number;
  lastIso?: string;
  state: "active" | "stalled";
  projects: { active: number; closed: number; dropped: number };
  rituals: { active: number; avgMultiplier: number };
  criteria: { met: number; total: number };
  time: { spent: number; remaining: number; hasData: boolean };
  spark: number[];
  sparkTips: DayInfo[];
};

/* === MeasureBar (mirrors Index.tsx variant) === */
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
    <div className="w-[36px] shrink-0 whitespace-nowrap text-right font-mono text-[11px] tabular-nums text-text-secondary leading-none">
      {percentage}%
    </div>
  </div>
);

/* === Sparkline (30 days) === */
const Sparkline: React.FC<{ data: number[]; color: string; tips: DayInfo[] }> = ({ data, color, tips }) => {
  const max = Math.max(1, ...data);
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

/* === Stat row === */
const StatRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="flex items-baseline justify-between gap-3">
    <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-text-tertiary shrink-0">
      {label}
    </span>
    <span className="font-mono text-[12px] tabular-nums text-text-primary text-right truncate min-w-0">{value}</span>
  </div>
);

const GoalCard: React.FC<{ m: GoalMeta; logTimeOn: boolean }> = ({ m, logTimeOn }) => {
  const { goal: g, progress, outcome, effort, lastIso, state, projects, rituals, criteria, time, spark, sparkTips } = m;
  const navigate = useNavigate();
  const openPanel = useStore((s) => s.openPanel);
  const markGoalComplete = useStore((s) => s.markGoalComplete);
  const dropGoal = useStore((s) => s.dropGoal);
  const deleteGoal = useStore((s) => s.deleteGoal);
  const [confirmDrop, setConfirmDrop] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const archived = g.status !== "active";
  const color = `hsl(var(--${g.color}))`;
  const typeLabel = g.type === "mid-term" ? "MID-TERM" : "SHORT-TERM";
  const stateColor =
    state === "active" ? "hsl(var(--state-active))" : "hsl(var(--state-stalled))";

  const showTime = logTimeOn && time.hasData;
  const showCriteria = criteria.total > 0;

  const isReadyToClose = !archived && progress >= 75;
  const isFullyReady =
    !archived && progress >= 100 && projects.active === 0 && projects.closed > 0;

  const projectsValue = (() => {
    const parts = [`${projects.active} active`, `${projects.closed} closed`];
    if (projects.dropped > 0) parts.push(`${projects.dropped} dropped`);
    return parts.join(" · ");
  })();

  const ritualsValue =
    rituals.active === 0
      ? "—"
      : `${rituals.active} active · ×${rituals.avgMultiplier.toFixed(2)} avg`;

  const closedLabel =
    g.status === "completed"
      ? `Completed ${fmtAgo(g.completedAt)}`
      : g.status === "dropped"
      ? `Dropped ${fmtAgo(g.droppedAt)}`
      : `Last activity: ${fmtAgo(lastIso)}`;

  const onCardClick = (e: React.MouseEvent) => {
    // Avoid navigation when interacting with menu/tooltips.
    const target = e.target as HTMLElement;
    if (target.closest("[data-card-menu]") || target.closest("[data-no-nav]")) return;
    navigate(`/goals/${g.id}`);
  };

  return (
    <>
      <div
        role="link"
        tabIndex={0}
        onClick={onCardClick}
        onKeyDown={(e) => {
          if (e.key === "Enter") navigate(`/goals/${g.id}`);
        }}
        className={`group relative rounded-[6px] bg-surface-raised border border-border-subtle hover:border-accent hover:bg-surface-hover transition-colors overflow-hidden cursor-pointer ${
          archived ? "opacity-70" : ""
        }`}
        style={{ minHeight: 360 }}
      >
        <span
          className="absolute left-0 top-0 bottom-0"
          style={{
            background: color,
            width: isReadyToClose ? 4 : 3,
            boxShadow: isFullyReady
              ? `0 0 12px 0 ${color}`
              : isReadyToClose
              ? `0 0 6px -1px ${color}`
              : undefined,
            filter: isReadyToClose ? "saturate(1.2) brightness(1.1)" : undefined,
          }}
        />

        <div className="pl-6 pr-6 py-6 flex flex-col gap-4">
          {/* Section 1 — Header */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
                <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-text-tertiary">
                  {typeLabel}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0" data-no-nav>
                {isReadyToClose && (
                  <span
                    className="font-mono uppercase tracking-[0.06em] rounded-[2px]"
                    style={{
                      fontSize: 9,
                      padding: "2px 6px",
                      background: isFullyReady ? color : "hsl(var(--surface-hover))",
                      color: isFullyReady
                        ? "hsl(var(--surface-base))"
                        : "hsl(var(--text-warning))",
                      letterSpacing: "0.06em",
                    }}
                  >
                    READY TO CLOSE
                  </span>
                )}
                <Tooltip content={<StateDotTooltip state={state} lastActivity={fmtAgo(lastIso)} />}>
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: stateColor }} />
                </Tooltip>
                <div data-card-menu onClick={(e) => e.stopPropagation()}>
                  <CardMenu
                    ariaLabel="Goal menu"
                    items={
                      archived
                        ? [
                            { label: "Re-open", onSelect: () => { useStore.getState().reopenGoal?.(g.id); toast("Goal re-opened"); } },
                            { label: "Edit", onSelect: () => openPanel({ kind: "goal", mode: "edit", id: g.id }) },
                            { label: "Delete", destructive: true, onSelect: () => setConfirmDelete(true) },
                          ]
                        : [
                            { label: "Edit", onSelect: () => openPanel({ kind: "goal", mode: "edit", id: g.id }) },
                            { label: "Mark complete", onSelect: () => { markGoalComplete(g.id); toast("Goal completed"); } },
                            { label: "Drop", destructive: true, onSelect: () => setConfirmDrop(true) },
                            { label: "Delete", destructive: true, onSelect: () => setConfirmDelete(true) },
                          ]
                    }
                  />
                </div>
              </div>
            </div>
            <h3 className="text-[18px] font-medium text-text-primary truncate leading-tight">
              {g.title}
            </h3>
          </div>

          {/* Section 2 — Big progress */}
          <div>
            <div className="font-medium text-text-primary leading-none tabular-nums" style={{ fontSize: 36 }}>
              {progress}%
            </div>
            <div className="font-mono text-[10px] uppercase tracking-[0.06em] text-text-tertiary mt-1">
              PROGRESS · VALUE
            </div>
          </div>

          {/* Section 3 — Bars */}
          <div className="flex flex-col gap-2">
            <MeasureBar label="VALUE" percentage={outcome} color={color} />
            <MeasureBar label="EFFORT" percentage={effort} color={color} opacity={0.6} />
          </div>

          {/* Section 4 — Stats */}
          <div className="border-t border-border-subtle pt-3 flex flex-col gap-2">
            <StatRow label="PROJECTS" value={projectsValue} />
            <StatRow label="RITUALS" value={ritualsValue} />
            {showCriteria && (
              <StatRow label="CRITERIA" value={`${criteria.met}/${criteria.total} met`} />
            )}
            {showTime && (
              <StatRow
                label="TIME"
                value={`${fmtTime(time.spent)} invested · ${fmtTime(time.remaining)} estimated remaining`}
              />
            )}
          </div>

          {/* Section 5 — Sparkline */}
          <div className="border-t border-border-subtle pt-3" data-no-nav onClick={(e) => e.stopPropagation()}>
            <div className="font-mono text-[10px] uppercase tracking-[0.06em] text-text-tertiary mb-2">
              ACTIVITY · LAST 30 DAYS
            </div>
            <Sparkline data={spark} color={color} tips={sparkTips} />
          </div>

          {/* Section 6 — Footer */}
          <div className="font-mono text-[11px] text-text-tertiary truncate">
            {closedLabel}
          </div>
        </div>
      </div>

      <ConfirmModal
        open={confirmDrop}
        title="Drop this goal?"
        body="Open projects, actions, and rituals under this goal will be dropped."
        confirmLabel="Drop goal"
        destructive
        onCancel={() => setConfirmDrop(false)}
        onConfirm={() => { dropGoal(g.id); toast("Goal dropped"); setConfirmDrop(false); }}
      />
      <ConfirmModal
        open={confirmDelete}
        title="Delete this goal?"
        body="This permanently removes the goal and ALL its projects, actions, rituals, and ideas."
        confirmLabel="Delete"
        destructive
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => { deleteGoal(g.id); toast("Goal deleted"); setConfirmDelete(false); }}
      />
    </>
  );
};

const SectionGrid: React.FC<{
  label: string;
  count: number;
  collapsible?: boolean;
  defaultOpen?: boolean;
  children: React.ReactNode;
}> = ({ label, count, collapsible, defaultOpen = true, children }) => {
  const [open, setOpen] = useState(defaultOpen);
  const visible = collapsible ? open : true;
  return (
    <section>
      <button
        type="button"
        onClick={() => collapsible && setOpen((v) => !v)}
        disabled={!collapsible}
        className={`w-full text-left mb-3 flex items-baseline gap-2 ${
          collapsible ? "cursor-pointer" : "cursor-default"
        }`}
      >
        {collapsible && (
          <span className="font-mono text-[11px] text-text-tertiary">{open ? "▾" : "▸"}</span>
        )}
        <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-text-secondary">
          {label} · {count}
        </span>
      </button>
      {visible && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">{children}</div>
      )}
    </section>
  );
};

const Goals: React.FC = () => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [stateFilter, setStateFilter] = useState<StateFilter>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("recent");
  const [query, setQuery] = useState("");

  const goals = useStore((s) => s.goals);
  const storeProjects = useStore((s) => s.projects);
  const projects = useMemo(() => storeProjects.filter((p) => !p.isDraft), [storeProjects]);
  const actions = useStore((s) => s.actions);
  const rituals = useStore((s) => s.rituals);
  const settings = useStore((s) => s.settings);
  const logTimeOn = !!settings?.layers?.logTime;

  const enriched: GoalMeta[] = useMemo(() => {
    const now = Date.now();
    const todayMidnight = new Date();
    todayMidnight.setHours(0, 0, 0, 0);

    return goals.map((g) => {
      const goalProjects = projects.filter((p) => p.goalId === g.id);
      const activeProjs = goalProjects.filter((p) => p.status === "active");
      const closedProjs = goalProjects.filter((p) => p.status === "completed").length;
      const droppedProjs = goalProjects.filter((p) => p.status === "dropped").length;

      let totalCost = 0,
        doneCost = 0,
        doneOrDelegatedCost = 0;
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

      const goalActions = actions.filter((a) => a.goalId === g.id);
      const lastIso = goalActions
        .map((a) => a.completedAt ?? a.delegatedAt ?? a.updatedAt ?? a.createdAt)
        .filter(Boolean)
        .sort()
        .at(-1);

      // State: stalled if no activity in last 7 days
      const stalled =
        !lastIso || (now - new Date(lastIso).getTime()) / 86400000 > 7;
      const state: "active" | "stalled" =
        g.status === "active" && stalled ? "stalled" : "active";

      // Rituals
      const goalRituals = rituals.filter((r) => r.goalId === g.id && r.status === "active");
      const avgMult =
        goalRituals.length === 0
          ? 0
          : goalRituals.reduce((s, r) => s + ritualMultiplier(r.totalCompletions), 0) /
            goalRituals.length;

      // Criteria
      const totalCrit = g.successCriteria?.length ?? 0;
      const metCrit = g.successCriteria?.filter((c) => c.done).length ?? 0;

      // Time invested = full Done time + 20% Delegated time.
      const investedActions = goalActions.filter(
        (a) =>
          (a.status === "done" || a.status === "delegated") &&
          (a.timeEstimateMinutes ?? 0) > 0,
      );
      const openActionsWithTime = goalActions.filter(
        (a) =>
          (a.status === "backlog" || a.status === "planned") &&
          (a.timeEstimateMinutes ?? 0) > 0,
      );
      const spent = investedActions.reduce((s, a) => {
        const t = a.timeEstimateMinutes ?? 0;
        return s + (a.status === "done" ? t : Math.round(t * 0.2));
      }, 0);
      const remaining = openActionsWithTime.reduce(
        (s, a) => s + (a.timeEstimateMinutes ?? 0),
        0,
      );
      const hasTimeData = investedActions.length > 0;

      // Sparkline: last 30 days, count of done actions per day
      const spark: number[] = new Array(30).fill(0);
      const sparkActionTitles: string[][] = Array.from({ length: 30 }, () => []);
      for (const a of goalActions) {
        if (a.status !== "done" || !a.completedAt) continue;
        const d = new Date(a.completedAt);
        d.setHours(0, 0, 0, 0);
        const diffDays = Math.floor((todayMidnight.getTime() - d.getTime()) / 86400000);
        if (diffDays >= 0 && diffDays < 30) {
          const idx = 29 - diffDays;
          spark[idx] += 1;
          sparkActionTitles[idx].push(`✓ ${a.title}`);
        }
      }
      const sparkTips: DayInfo[] = spark.map((count, i) => ({
        daysFromToday: 29 - i,
        count,
        actions: sparkActionTitles[i],
      }));

      return {
        goal: g,
        progress: outcome,
        outcome,
        effort,
        lastIso: lastIso ?? undefined,
        state,
        projects: { active: activeProjs.length, closed: closedProjs, dropped: droppedProjs },
        rituals: { active: goalRituals.length, avgMultiplier: avgMult },
        criteria: { met: metCrit, total: totalCrit },
        time: { spent, remaining, hasData: hasTimeData },
        spark,
        sparkTips,
      };
    });
  }, [goals, projects, actions, rituals]);

  const filtered = useMemo(() => {
    return enriched.filter((m) => {
      if (typeFilter !== "all" && m.goal.type !== typeFilter) return false;
      if (stateFilter !== "all" && m.goal.status !== stateFilter) return false;
      if (query.trim() && !m.goal.title.toLowerCase().includes(query.trim().toLowerCase())) return false;
      return true;
    });
  }, [enriched, stateFilter, typeFilter, query]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      switch (sortKey) {
        case "recent":
          return (b.lastIso ?? "").localeCompare(a.lastIso ?? "");
        case "created":
          return (b.goal.createdAt ?? "").localeCompare(a.goal.createdAt ?? "");
        case "progress":
          return b.progress - a.progress;
      }
    });
    return arr;
  }, [filtered, sortKey]);

  const activeAll = sorted
    .filter((m) => m.goal.status === "active")
    .slice()
    .sort((a, b) => {
      const aReady = a.progress >= 75 ? 1 : 0;
      const bReady = b.progress >= 75 ? 1 : 0;
      if (aReady !== bReady) return bReady - aReady;
      return (b.lastIso ?? "").localeCompare(a.lastIso ?? "");
    });
  const completed = sorted.filter((m) => m.goal.status === "completed");
  const dropped = sorted.filter((m) => m.goal.status === "dropped");

  const totalActive = goals.filter((g) => g.status === "active").length;
  const totalCompleted = goals.filter((g) => g.status === "completed").length;
  const totalAll = goals.length;
  const ghostDisabled = totalActive >= 3;

  const noResults = sorted.length === 0;
  const noGoalsAtAll = goals.length === 0;

  return (
    <div className="min-h-screen bg-surface-base text-text-primary">
      <AppSidebar onOpenSettings={() => setSettingsOpen(true)} />
      <SettingsPanel open={settingsOpen} onOpenChange={setSettingsOpen} />
      <main className="app-main page-medium">
        <header className="mb-6 flex items-center justify-between gap-4">
          <h1 className="text-[24px] font-medium text-text-primary leading-tight">Goals</h1>
          <div className="flex items-center gap-4">
            <div className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-tertiary tabular-nums">
              {totalAll} goals · {totalActive} active · {totalCompleted} completed
            </div>
            {ghostDisabled ? (
              <Tooltip content="You have 3 active goals. Complete or drop one to add another.">
                <button
                  type="button"
                  disabled
                  aria-label="New goal"
                  className="inline-flex items-center justify-center gap-1 rounded-[4px] bg-surface-hover text-text-secondary min-w-[40px] min-h-[40px] sm:min-h-0 sm:min-w-0 sm:px-[16px] sm:py-[8px] text-[13px] font-medium cursor-not-allowed"
                >
                  <span className="text-[15px] leading-none">+</span>
                  <span className="hidden sm:inline">New goal</span>
                </button>
              </Tooltip>
            ) : (
              <button
                type="button"
                aria-label="New goal"
                onClick={() => useStore.getState().openPanel({ kind: "goal", mode: "new" })}
                className="inline-flex items-center justify-center gap-1 rounded-[4px] bg-accent hover:bg-accent-hover text-white min-w-[40px] min-h-[40px] sm:min-h-0 sm:min-w-0 sm:px-[16px] sm:py-[8px] text-[13px] font-medium transition-colors"
              >
                <span className="text-[15px] leading-none">+</span>
                <span className="hidden sm:inline">New goal</span>
              </button>
            )}
          </div>
        </header>

        <div className="flex flex-wrap items-center gap-2 mb-4">
          <FilterDropdown<StateFilter>
            label="STATE"
            value={stateFilter}
            defaultValue="all"
            options={STATE_OPTIONS}
            onChange={setStateFilter}
          />
          <FilterDropdown<TypeFilter>
            label="TYPE"
            value={typeFilter}
            defaultValue="all"
            options={TYPE_OPTIONS}
            onChange={setTypeFilter}
          />
          <div className="flex-1" />
          <SortDropdown<SortKey> value={sortKey} options={SORT_OPTIONS} onChange={setSortKey} />
        </div>

        {/* Search removed — global ⌘K palette handles search. */}

        <div className="my-6 border-t border-border-subtle" />

        {noGoalsAtAll ? (
          <div className="bg-surface-elevated border border-dashed border-border-subtle rounded-[6px] py-10 text-center">
            <div className="text-[14px] text-text-secondary">No goals yet.</div>
            <button
              onClick={() => useStore.getState().openPanel({ kind: "goal", mode: "new" })}
              className="mt-2 text-[13px] text-accent hover:text-accent-hover"
            >
              + New goal
            </button>
          </div>
        ) : noResults ? (
          <div className="font-mono text-[12px] text-text-tertiary px-3 py-6 text-center">
            No goals match these filters.
          </div>
        ) : (
          <div className="space-y-10">
            {(activeAll.length > 0 || stateFilter === "all" || stateFilter === "active") && activeAll.length > 0 && (
              <SectionGrid label="ACTIVE" count={activeAll.length}>
                {activeAll.map((m) => <GoalCard key={m.goal.id} m={m} logTimeOn={logTimeOn} />)}
              </SectionGrid>
            )}

            {completed.length > 0 && (
              <SectionGrid label="COMPLETED" count={completed.length} collapsible defaultOpen={false}>
                {completed.map((m) => <GoalCard key={m.goal.id} m={m} logTimeOn={logTimeOn} />)}
              </SectionGrid>
            )}

            {dropped.length > 0 && (
              <SectionGrid label="DROPPED" count={dropped.length} collapsible defaultOpen={false}>
                {dropped.map((m) => <GoalCard key={m.goal.id} m={m} logTimeOn={logTimeOn} />)}
              </SectionGrid>
            )}
          </div>
        )}

        <div className="h-12" />
      </main>
    </div>
  );
};

export default Goals;
