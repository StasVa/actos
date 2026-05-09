import React, { useMemo, useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Tooltip } from "@/components/Tooltip";
import { LifetimeCounters } from "@/components/LifetimeCounters";
import { FilterDropdown, FilterOption } from "@/components/FilterDropdown";
import { SortDropdown } from "@/components/SortDropdown";
import { toast } from "sonner";
import { useStore } from "@/store/useStore";
import { AppSidebar } from "@/components/AppSidebar";
import { ProjectCard as SharedProjectCard } from "@/components/ProjectCard";
import { EmptyState, FilteredEmpty } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";

const G1 = "hsl(var(--goal-1))";
const G2 = "hsl(var(--goal-2))";
const G3 = "hsl(var(--goal-3))";
/* ===== Data shape (visual rendering only) ===== */
type GoalKey = "g1" | "g2" | "g3";
type ProjectState = "near" | "active" | "stalled" | "completed" | "dropped";

type Project = {
  id: string;
  goal: GoalKey;
  goalLabel: string;
  goalColor: string;
  title: string;
  done: number;
  total: number;
  last: string;
  lastDays: number;
  state: ProjectState;
  closedLabel?: string;
  closedSort?: number;
};

const GOAL_COLOR_VARS: Record<string, GoalKey> = {
  "goal-1": "g1",
  "goal-2": "g2",
  "goal-3": "g3",
};

function fmtAgo(iso?: string): { label: string; days: number } {
  if (!iso) return { label: "—", days: 999 };
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days <= 0) return { label: "today", days: 0 };
  if (days === 1) return { label: "1d ago", days: 1 };
  if (days < 30) return { label: `${days}d ago`, days };
  const d = new Date(iso);
  return {
    label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    days,
  };
}


/* ===== Tooltip content ===== */
const StateTooltip: React.FC<{ p: Project }> = ({ p }) => (
  <div className="font-mono text-[11px] leading-[1.6]">
    <div className="text-text-primary uppercase tracking-[0.06em]">
      {p.state === "stalled" ? "STALLED" : p.state === "near" ? "NEAR COMPLETION" : "ACTIVE"}
    </div>
    <div className="text-text-tertiary">Last activity {p.last}</div>
  </div>
);

/* ===== Project card (active grid) — navigates to /projects/:id ===== */
const ProjectCard: React.FC<{ p: Project }> = ({ p }) => (
  <SharedProjectCard projectId={p.id} goalLabel={p.goalLabel} goalColor={p.goalColor} />
);

/* ===== Closed list row (denser, history) — navigates ===== */
const ClosedRow: React.FC<{ p: Project }> = ({ p }) => {
  const isDropped = p.state === "dropped";
  return (
    <Link
      to={`/projects/${p.id}`}
      className="relative flex items-stretch border-b border-border-subtle hover:bg-surface-hover transition-colors cursor-pointer"
      style={{ minHeight: 48 }}
    >
      <span className="absolute left-0 top-0 bottom-0" style={{ background: p.goalColor, width: 3 }} />
      <div className="flex items-center justify-between gap-3 py-2.5 pr-4 w-full" style={{ paddingLeft: 19 }}>
        <div className="flex items-center gap-3 min-w-0">
          <span
            className="font-mono uppercase tracking-[0.08em] shrink-0"
            style={{
              fontSize: 10,
              padding: "2px 6px",
              borderRadius: 2,
              background: "hsl(var(--surface-hover))",
              color: isDropped ? "hsl(var(--status-dropped))" : "hsl(var(--status-done))",
            }}
          >
            {isDropped ? "DROPPED" : "DONE"}
          </span>
          <span
            className={`text-[13px] truncate ${
              isDropped ? "text-text-secondary" : "text-text-primary"
            }`}
          >
            {p.title}
          </span>
        </div>
        <div className="flex items-center gap-3 font-mono text-[11px] text-text-tertiary tabular-nums shrink-0">
          <span>
            {p.done}/{p.total}
          </span>
          <span>·</span>
          <span>{p.goalLabel}</span>
          <span>·</span>
          <span>{p.closedLabel}</span>
        </div>
      </div>
    </Link>
  );
};

/* ===== Section ===== */
const SectionHeader: React.FC<{
  label: string;
  count: number;
  meta?: string;
  warning?: boolean;
  collapsible?: boolean;
  collapsed?: boolean;
  onToggle?: () => void;
}> = ({ label, count, meta, warning, collapsible, collapsed, onToggle }) => (
  <button
    type="button"
    onClick={onToggle}
    disabled={!collapsible}
    className={`w-full flex items-baseline justify-between gap-3 mb-3 ${
      collapsible ? "cursor-pointer hover:opacity-80" : "cursor-default"
    }`}
  >
    <div className="flex items-baseline gap-2">
      {collapsible && (
        <span className="font-mono text-[11px] text-text-tertiary">{collapsed ? "▸" : "▾"}</span>
      )}
      <span
        className="font-mono uppercase tracking-[0.08em]"
        style={{
          fontSize: 11,
          color: warning ? "hsl(var(--text-warning))" : "hsl(var(--text-secondary))",
        }}
      >
        {label} · {count}
      </span>
    </div>
    {meta && (
      <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-text-tertiary tabular-nums">
        {meta}
      </span>
    )}
  </button>
);

/* ===== Top stats strip ===== */
const Pill: React.FC<{ label: string; value: number; warning?: boolean; accent?: boolean }> = ({
  label,
  value,
  warning,
  accent,
}) => {
  let valueColor = "hsl(var(--text-primary))";
  if (warning) valueColor = "hsl(var(--text-warning))";
  else if (accent) valueColor = "hsl(var(--accent))";
  return (
    <div className="flex items-baseline gap-2 px-3 py-2 bg-surface-raised border border-border-subtle rounded-[4px]">
      <span className="font-mono text-[18px] tabular-nums" style={{ color: valueColor }}>
        {value}
      </span>
      <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-text-tertiary">
        {label}
      </span>
    </div>
  );
};

/* ===== Page ===== */
type GoalFilter = "all" | GoalKey;
type StateFilter = "all" | "open" | "near" | "stalled" | "closed";
type SortKey = "recent" | "stalled" | "progress" | "title";

const GOAL_OPTIONS: FilterOption<GoalFilter>[] = [
  { value: "all", label: "All" },
  { value: "g1", label: "Launch YouTube", dot: G1 },
  { value: "g2", label: "Lose 5 kg", dot: G2 },
  { value: "g3", label: "Read 24 books", dot: G3 },
];

const STATE_OPTIONS: FilterOption<StateFilter>[] = [
  { value: "all", label: "All" },
  { value: "open", label: "Active" },
  { value: "near", label: "Near completion" },
  { value: "stalled", label: "Stalled" },
  { value: "closed", label: "Closed" },
];

const SORT_OPTIONS: FilterOption<SortKey>[] = [
  { value: "recent", label: "Recent activity" },
  { value: "stalled", label: "Stalled longest" },
  { value: "progress", label: "By progress" },
  { value: "title", label: "By title" },
];

function isOpen(p: Project) {
  return p.state === "active" || p.state === "near" || p.state === "stalled";
}

const AllProjects: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialState = ((): StateFilter => {
    const s = searchParams.get("state");
    if (s === "open" || s === "near" || s === "stalled" || s === "closed" || s === "all") return s;
    return "all";
  })();
  const [goalFilter, setGoalFilter] = useState<GoalFilter>("all");
  const [stateFilter, setStateFilter] = useState<StateFilter>(initialState);
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("recent");
  const [archivedCollapsed, setArchivedCollapsed] = useState(false);

  const storeProjects = useStore((s) => s.projects);
  const storeGoals = useStore((s) => s.goals);
  const storeActions = useStore((s) => s.actions);
  const openPanel = useStore((s) => s.openPanel);
  const createProject = useStore((s) => s.createProject);
  const navigate = useNavigate();

  // Derive the visual project rows from the live store (preserves the existing
  // renderer shape so the rest of the page stays unchanged).
  const goalKeyFor = (goalId: string): GoalKey => {
    const g = storeGoals.find((gg) => gg.id === goalId);
    return (g ? GOAL_COLOR_VARS[g.color] ?? "g1" : "g1");
  };
  const goalColorFor = (goalId: string): string => {
    const g = storeGoals.find((gg) => gg.id === goalId);
    return g ? `hsl(var(--${g.color}))` : "hsl(var(--text-tertiary))";
  };
  const goalLabelFor = (goalId: string): string => {
    const g = storeGoals.find((gg) => gg.id === goalId);
    return (g?.title ?? "—").toUpperCase();
  };

  const livePROJECTS: Project[] = useMemo(() => {
    return storeProjects.filter((p) => !p.isDraft).map((p) => {
      const acts = storeActions.filter(
        (a) => a.projectId === p.id && a.status !== "dropped" && a.status !== "cancelled",
      );
      const total = acts.length;
      const done = acts.filter((a) => a.status === "done" || a.status === "delegated").length;
      const lastIso = storeActions
        .filter((a) => a.projectId === p.id)
        .map((a) => a.completedAt ?? a.delegatedAt ?? a.updatedAt ?? a.createdAt)
        .filter(Boolean)
        .sort()
        .at(-1);
      const ago = fmtAgo(lastIso ?? undefined);

      let state: ProjectState;
      let closedLabel: string | undefined;
      let closedSort: number | undefined;
      if (p.status === "completed") {
        state = "completed";
        closedLabel = p.completedAt ? fmtAgo(p.completedAt).label : undefined;
        closedSort = p.completedAt ? new Date(p.completedAt).getTime() : 0;
      } else if (p.status === "dropped") {
        state = "dropped";
        closedLabel = p.droppedAt ? fmtAgo(p.droppedAt).label : undefined;
        closedSort = p.droppedAt ? new Date(p.droppedAt).getTime() : 0;
      } else {
        const pct = total > 0 ? done / total : 0;
        if (ago.days > 7) state = "stalled";
        else if (pct >= 0.75 && total > 0) state = "near";
        else state = "active";
      }

      return {
        id: p.id,
        goal: goalKeyFor(p.goalId),
        goalLabel: goalLabelFor(p.goalId),
        goalColor: goalColorFor(p.goalId),
        title: p.title,
        done,
        total: Math.max(total, 1),
        last: ago.label,
        lastDays: ago.days,
        state,
        closedLabel,
        closedSort,
      };
    });
  }, [storeProjects, storeActions, storeGoals]);



  const handleNewProject = () => {
    const goalId = storeGoals.find((g) => g.status === "active")?.id ?? storeGoals[0]?.id;
    if (!goalId) {
      toast.error("Create an active goal first");
      return;
    }
    const id = createProject({ title: "", goalId, isDraft: true });
    navigate(`/projects/${id}`);
  };

  const handleNewGoal = () => {
    openPanel({ kind: "goal", mode: "new" });
  };

  const counts = useMemo(() => {
    const total = livePROJECTS.length;
    const active = livePROJECTS.filter((p) => p.state === "active").length;
    const near = livePROJECTS.filter((p) => p.state === "near").length;
    const stalled = livePROJECTS.filter((p) => p.state === "stalled").length;
    const closed = livePROJECTS.filter((p) => p.state === "completed" || p.state === "dropped").length;
    return { total, active, near, stalled, closed };
  }, [livePROJECTS]);

  const filtered = useMemo(() => {
    return livePROJECTS.filter((p) => {
      if (goalFilter !== "all" && p.goal !== goalFilter) return false;
      if (stateFilter === "open" && !isOpen(p)) return false;
      if (stateFilter === "near" && p.state !== "near") return false;
      if (stateFilter === "stalled" && p.state !== "stalled") return false;
      if (stateFilter === "closed" && !(p.state === "completed" || p.state === "dropped"))
        return false;
      if (query.trim() && !p.title.toLowerCase().includes(query.trim().toLowerCase()))
        return false;
      return true;
    });
  }, [livePROJECTS, goalFilter, stateFilter, query]);


  const sortFn = useMemo(() => {
    return (a: Project, b: Project) => {
      switch (sortKey) {
        case "stalled":
          return b.lastDays - a.lastDays;
        case "progress":
          return b.done / b.total - a.done / a.total;
        case "title":
          return a.title.localeCompare(b.title);
        case "recent":
        default:
          return a.lastDays - b.lastDays;
      }
    };
  }, [sortKey]);

  const groups = useMemo(() => {
    const open = filtered.filter(isOpen);
    const near = open.filter((p) => p.state === "near").sort(sortFn);
    const active = open.filter((p) => p.state === "active").sort(sortFn);
    const stalled = open.filter((p) => p.state === "stalled").sort(sortFn);
    const closed = filtered
      .filter((p) => p.state === "completed" || p.state === "dropped")
      .sort((a, b) => (b.closedSort ?? 0) - (a.closedSort ?? 0));
    return { near, active, stalled, closed };
  }, [filtered, sortFn]);

  const meta = `${counts.total} PROJECTS · ${counts.active} ACTIVE · ${counts.near} NEAR DONE · ${counts.stalled} STALLED · ${counts.closed} CLOSED`;

  const anyApplied =
    goalFilter !== "all" ||
    stateFilter !== "all" ||
    sortKey !== "recent" ||
    query.trim() !== "";

  const clearFilters = () => {
    setGoalFilter("all");
    setStateFilter("all");
    setSortKey("recent");
    setQuery("");
  };

  return (
    <div className="min-h-screen bg-surface-base text-text-primary">
      <AppSidebar />
      <main className="app-main page-medium flex flex-col min-h-screen">
        <div className="px-4 md:px-10 pt-6 pb-4 shrink-0">
          <PageHeader
            title="Projects"
            meta={meta}
            cta={{
              label: "+ New project",
              onClick: handleNewProject,
              ariaLabel: "New project",
            }}
            filters={
              <>
                <FilterDropdown
                  label="GOAL"
                  value={goalFilter}
                  defaultValue="all"
                  options={GOAL_OPTIONS}
                  onChange={(v) => setGoalFilter(v)}
                />
                <FilterDropdown
                  label="STATE"
                  value={stateFilter}
                  defaultValue="all"
                  options={STATE_OPTIONS}
                  onChange={(v) => setStateFilter(v)}
                />
                {anyApplied && (
                  <button
                    onClick={clearFilters}
                    className="ml-1 text-[12px] text-text-tertiary hover:text-text-secondary transition-colors shrink-0"
                  >
                    Clear filters
                  </button>
                )}
              </>
            }
            sort={
              <SortDropdown value={sortKey} options={SORT_OPTIONS} onChange={(v) => setSortKey(v)} />
            }
          />
        </div>

        {/* Sections */}
        <div className="flex-1 px-10 pt-8 pb-16 space-y-10">
          {livePROJECTS.length === 0 ? (
            <EmptyState
              headline="No projects yet."
              description="Projects sit under goals and group related actions. Create one for each concrete piece of work you're moving forward."
              ctaLabel="+ New project"
              onCta={handleNewProject}
              hint={
                storeGoals.filter((g) => g.status === "active").length === 0
                  ? "You'll need a goal first."
                  : null
              }
            />
          ) : filtered.length === 0 ? (
            <FilteredEmpty onClear={clearFilters} />
          ) : null}

          {groups.near.length > 0 && (
            <section>
              <SectionHeader
                label="NEAR COMPLETION"
                count={groups.near.length}
                meta="≥ 75% DONE"
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {groups.near.map((p) => (
                  <ProjectCard key={p.id} p={p} />
                ))}
              </div>
            </section>
          )}

          {groups.active.length > 0 && (
            <section>
              <SectionHeader label="ACTIVE" count={groups.active.length} meta="MOVING THIS WEEK" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {groups.active.map((p) => (
                  <ProjectCard key={p.id} p={p} />
                ))}
              </div>
            </section>
          )}

          {groups.stalled.length > 0 && (
            <section>
              <SectionHeader
                label="STALLED"
                count={groups.stalled.length}
                meta="NO ACTIVITY ≥ 7 DAYS"
                warning
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {groups.stalled.map((p) => (
                  <ProjectCard key={p.id} p={p} />
                ))}
              </div>
            </section>
          )}

          {groups.closed.length > 0 && (
            <section>
              <SectionHeader
                label="ARCHIVED"
                count={groups.closed.length}
                meta="COMPLETED OR DROPPED"
                collapsible
                collapsed={archivedCollapsed}
                onToggle={() => setArchivedCollapsed((v) => !v)}
              />
              {!archivedCollapsed && (
                <div className="border-t border-border-subtle">
                  {groups.closed.map((p) => (
                    <ClosedRow key={p.id} p={p} />
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Add project affordance moved to page header "+ New project" button. */}
        </div>
      </main>
    </div>
  );
};

export default AllProjects;
