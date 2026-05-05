import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useStore } from "@/store/useStore";
import { AppSidebar } from "@/components/AppSidebar";
import { SettingsPanel } from "@/components/SettingsPanel";
import { CardMenu } from "@/components/CardMenu";
import { ConfirmModal } from "@/components/ConfirmModal";
import { FilterDropdown, FilterOption } from "@/components/FilterDropdown";
import { SortDropdown } from "@/components/SortDropdown";
import { Tooltip } from "@/components/Tooltip";
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

type GoalMeta = {
  goal: Goal;
  progress: number;
  outcome: number;
  effort: number;
  lastIso?: string;
};

const GoalCard: React.FC<{ m: GoalMeta }> = ({ m }) => {
  const { goal: g, progress, outcome, effort, lastIso } = m;
  const openPanel = useStore((s) => s.openPanel);
  const markGoalComplete = useStore((s) => s.markGoalComplete);
  const dropGoal = useStore((s) => s.dropGoal);
  const deleteGoal = useStore((s) => s.deleteGoal);
  const [confirmDrop, setConfirmDrop] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const archived = g.status !== "active";
  const color = `hsl(var(--${g.color}))`;
  const typeLabel = g.type === "mid-term" ? "MID-TERM" : "SHORT-TERM";

  const closedLabel =
    g.status === "completed"
      ? `Completed ${fmtAgo(g.completedAt)}`
      : g.status === "dropped"
      ? `Dropped ${fmtAgo(g.droppedAt)}`
      : `Last: ${fmtAgo(lastIso)}`;

  return (
    <>
      <div
        className={`group relative h-[160px] rounded-[6px] bg-surface-raised border border-border-subtle hover:border-accent transition-colors overflow-hidden ${
          archived ? "opacity-70" : ""
        }`}
      >
        <span
          className="absolute left-0 top-0 bottom-0"
          style={{ background: color, width: 3 }}
        />
        <Link to={`/goals/${g.id}`} className="block h-full pl-4 pr-3 py-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="text-[14px] font-medium text-text-primary truncate">{g.title}</div>
              <div className="font-mono text-[10px] uppercase tracking-[0.06em] text-text-tertiary mt-0.5">
                {typeLabel}
              </div>
            </div>
            <div className="shrink-0 -mt-1 -mr-1" onClick={(e) => e.preventDefault()}>
              <CardMenu
                ariaLabel="Goal menu"
                items={[
                  { label: "Edit", onSelect: () => openPanel({ kind: "goal", mode: "edit", id: g.id }) },
                  { label: "Mark complete", onSelect: () => { markGoalComplete(g.id); toast("Goal completed"); } },
                  { label: "Drop", destructive: true, onSelect: () => setConfirmDrop(true) },
                  { label: "Delete", destructive: true, onSelect: () => setConfirmDelete(true) },
                ]}
              />
            </div>
          </div>

          {!archived && (
            <div className="mt-2 font-mono text-[24px] font-medium text-text-primary leading-none tabular-nums">
              {progress}%
            </div>
          )}

          {!archived && (
            <div className="mt-3 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[9px] uppercase tracking-[0.06em] text-text-tertiary w-[44px]">
                  OUTCOME
                </span>
                <div className="flex-1 h-[5px] rounded-[2px] bg-surface-hover overflow-hidden">
                  <div className="h-full" style={{ width: `${outcome}%`, background: color }} />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[9px] uppercase tracking-[0.06em] text-text-tertiary w-[44px]">
                  EFFORT
                </span>
                <div className="flex-1 h-[5px] rounded-[2px] bg-surface-hover overflow-hidden">
                  <div className="h-full" style={{ width: `${effort}%`, background: color, opacity: 0.6 }} />
                </div>
              </div>
            </div>
          )}

          <div className="absolute left-4 right-3 bottom-3 font-mono text-[11px] text-text-tertiary truncate">
            {closedLabel}
          </div>
        </Link>
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

const GhostNewGoalCard: React.FC<{ disabled: boolean }> = ({ disabled }) => {
  const openPanel = useStore((s) => s.openPanel);
  const card = (
    <button
      type="button"
      disabled={disabled}
      onClick={() => openPanel({ kind: "goal", mode: "new" })}
      className={`h-[160px] w-full rounded-[6px] border border-dashed flex flex-col items-center justify-center gap-1 transition-colors ${
        disabled
          ? "border-border-subtle text-text-tertiary cursor-not-allowed"
          : "border-border-default text-text-secondary hover:border-accent hover:text-text-primary"
      }`}
    >
      <span className="text-[24px] leading-none">+</span>
      <span className="text-[13px]">New goal</span>
    </button>
  );
  if (disabled) {
    return (
      <Tooltip content="You have 3 active goals. Complete or drop one to add another.">
        <div>{card}</div>
      </Tooltip>
    );
  }
  return card;
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
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">{children}</div>
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
  const projects = useStore((s) => s.projects);
  const actions = useStore((s) => s.actions);

  const enriched: GoalMeta[] = useMemo(() => {
    return goals.map((g) => {
      const goalProjects = projects.filter((p) => p.goalId === g.id);
      const activeProjs = goalProjects.filter((p) => p.status === "active");
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
      const lastIso = actions
        .filter((a) => a.goalId === g.id)
        .map((a) => a.completedAt ?? a.delegatedAt ?? a.updatedAt ?? a.createdAt)
        .filter(Boolean)
        .sort()
        .at(-1);
      return { goal: g, progress: outcome, outcome, effort, lastIso: lastIso ?? undefined };
    });
  }, [goals, projects, actions]);

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

  const active = sorted.filter((m) => m.goal.status === "active" && m.progress < 75);
  const near = sorted.filter((m) => m.goal.status === "active" && m.progress >= 75);
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
      <main className="ml-[220px] px-8 py-6 max-w-[1400px]">
        <header className="mb-6 flex items-end justify-between gap-4">
          <h1 className="text-[24px] font-medium text-text-primary leading-tight">Goals</h1>
          <div className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-tertiary tabular-nums pb-1">
            {totalAll} goals · {totalActive} active · {totalCompleted} completed
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

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search goals..."
          className="w-full max-w-[720px] bg-surface-raised border border-border-subtle rounded-[4px] px-3 py-2 text-[13px] text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent"
        />

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
            {(active.length > 0 || stateFilter === "all" || stateFilter === "active") && (
              <SectionGrid label="ACTIVE" count={active.length}>
                {active.map((m) => <GoalCard key={m.goal.id} m={m} />)}
                {(stateFilter === "all" || stateFilter === "active") && (
                  <GhostNewGoalCard disabled={ghostDisabled} />
                )}
              </SectionGrid>
            )}

            {near.length > 0 && (
              <SectionGrid label="NEAR COMPLETION" count={near.length}>
                {near.map((m) => <GoalCard key={m.goal.id} m={m} />)}
              </SectionGrid>
            )}

            {completed.length > 0 && (
              <SectionGrid label="COMPLETED" count={completed.length} collapsible defaultOpen={false}>
                {completed.map((m) => <GoalCard key={m.goal.id} m={m} />)}
              </SectionGrid>
            )}

            {dropped.length > 0 && (
              <SectionGrid label="DROPPED" count={dropped.length} collapsible defaultOpen={false}>
                {dropped.map((m) => <GoalCard key={m.goal.id} m={m} />)}
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
