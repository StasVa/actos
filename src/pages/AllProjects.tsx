import React, { useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Tooltip } from "@/components/Tooltip";
import { LifetimeCounters } from "@/components/LifetimeCounters";
import { FilterDropdown, FilterOption } from "@/components/FilterDropdown";
import { SortDropdown } from "@/components/SortDropdown";
import { useStore } from "@/store/useStore";

const G1 = "hsl(var(--goal-1))";
const G2 = "hsl(var(--goal-2))";
const G3 = "hsl(var(--goal-3))";

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

const Sidebar: React.FC = () => {
  const { pathname } = useLocation();
  return (
    <aside className="fixed left-0 top-0 bottom-0 w-[220px] bg-surface-raised border-r border-border-subtle p-4 flex flex-col">
      <Link to="/" className="px-1 py-1 text-[17px] font-semibold text-text-primary tracking-tight">
        ActOS
      </Link>
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
      <div className="font-mono text-[11px] text-text-tertiary px-1">⌘K  Quick add</div>
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

/* ===== Data ===== */
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
  /** friendly last activity, e.g. "today", "2d ago", "11d ago" */
  last: string;
  /** numeric days since last activity for sorting */
  lastDays: number;
  state: ProjectState;
  /** for completed/dropped — closing label */
  closedLabel?: string;
  closedSort?: number; // higher = more recent close
  href?: string;
};

const PROJECTS: Project[] = [
  // Active / near
  {
    id: "shoot-video-1",
    goal: "g1",
    goalLabel: "YOUTUBE CHANNEL",
    goalColor: G1,
    title: "Shoot video #1",
    done: 3,
    total: 7,
    last: "today",
    lastDays: 0,
    state: "active",
    href: "/projects/shoot-video-1",
  },
  {
    id: "set-up-workspace",
    goal: "g1",
    goalLabel: "YOUTUBE CHANNEL",
    goalColor: G1,
    title: "Set up workspace",
    done: 4,
    total: 5,
    last: "2d ago",
    lastDays: 2,
    state: "near",
  },
  {
    id: "nutrition-plan",
    goal: "g2",
    goalLabel: "LOSE 5 KG",
    goalColor: G2,
    title: "Nutrition plan",
    done: 3,
    total: 4,
    last: "today",
    lastDays: 0,
    state: "near",
  },
  {
    id: "build-cardio",
    goal: "g2",
    goalLabel: "LOSE 5 KG",
    goalColor: G2,
    title: "Build cardio routine",
    done: 1,
    total: 6,
    last: "11d ago",
    lastDays: 11,
    state: "stalled",
  },
  {
    id: "daily-reading",
    goal: "g3",
    goalLabel: "READ 24 BOOKS",
    goalColor: G3,
    title: "Build daily reading habit",
    done: 8,
    total: 24,
    last: "today",
    lastDays: 0,
    state: "active",
  },
  // Closed / dropped
  {
    id: "content-pillars",
    goal: "g1",
    goalLabel: "YOUTUBE CHANNEL",
    goalColor: G1,
    title: "Define content pillars",
    done: 4,
    total: 4,
    last: "Apr 22",
    lastDays: 13,
    state: "completed",
    closedLabel: "Apr 22",
    closedSort: 422,
  },
  {
    id: "grocery-overhaul",
    goal: "g2",
    goalLabel: "LOSE 5 KG",
    goalColor: G2,
    title: "First grocery overhaul",
    done: 6,
    total: 6,
    last: "Apr 18",
    lastDays: 17,
    state: "completed",
    closedLabel: "Apr 18",
    closedSort: 418,
  },
  {
    id: "morning-runs",
    goal: "g2",
    goalLabel: "LOSE 5 KG",
    goalColor: G2,
    title: "Morning runs experiment",
    done: 2,
    total: 8,
    last: "Apr 10",
    lastDays: 25,
    state: "dropped",
    closedLabel: "Apr 10",
    closedSort: 410,
  },
];

const GOAL_NAMES: Record<GoalKey, string> = {
  g1: "Launch YouTube channel",
  g2: "Lose 5 kg",
  g3: "Read 24 books",
};

const GOAL_COLOR: Record<GoalKey, string> = { g1: G1, g2: G2, g3: G3 };

/* ===== Tooltip content ===== */
const StateTooltip: React.FC<{ p: Project }> = ({ p }) => (
  <div className="font-mono text-[11px] leading-[1.6]">
    <div className="text-text-primary uppercase tracking-[0.06em]">
      {p.state === "stalled" ? "STALLED" : p.state === "near" ? "NEAR COMPLETION" : "ACTIVE"}
    </div>
    <div className="text-text-tertiary">Last activity {p.last}</div>
  </div>
);

/* ===== Project card (active grid) ===== */
const ProjectCard: React.FC<{ p: Project }> = ({ p }) => {
  const pct = Math.round((p.done / p.total) * 100);
  const stateColor =
    p.state === "stalled"
      ? "hsl(var(--state-stalled))"
      : p.state === "near"
      ? "hsl(var(--accent))"
      : "hsl(var(--state-active))";
  const warnLast = p.lastDays >= 7;
  const inner = (
    <div className="group h-[124px] p-3 flex flex-col gap-2 rounded-[6px] bg-surface-raised border border-border-subtle hover:bg-surface-hover hover:border-accent cursor-pointer transition-colors duration-100">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: p.goalColor }} />
          <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-text-tertiary truncate">
            {p.goalLabel}
          </span>
        </div>
        <Tooltip content={<StateTooltip p={p} />}>
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: stateColor }} />
        </Tooltip>
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
          <span className="text-text-primary">
            {p.done}/{p.total}
          </span>
          <span className="text-text-tertiary"> · {pct}%</span>
        </div>
        <div className="text-text-secondary">
          Last: <span className={warnLast ? "text-text-warning" : "text-text-secondary"}>{p.last}</span>
        </div>
      </div>
    </div>
  );
  if (p.href) return <Link to={p.href} className="block">{inner}</Link>;
  return inner;
};

/* ===== Closed list row (denser, history) ===== */
const ClosedRow: React.FC<{ p: Project }> = ({ p }) => {
  const isDropped = p.state === "dropped";
  return (
    <div
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
    </div>
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
  const [goalFilter, setGoalFilter] = useState<GoalFilter>("all");
  const [stateFilter, setStateFilter] = useState<StateFilter>("all");
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("recent");
  const [archivedCollapsed, setArchivedCollapsed] = useState(false);

  const counts = useMemo(() => {
    const total = PROJECTS.length;
    const active = PROJECTS.filter((p) => p.state === "active").length;
    const near = PROJECTS.filter((p) => p.state === "near").length;
    const stalled = PROJECTS.filter((p) => p.state === "stalled").length;
    const closed = PROJECTS.filter((p) => p.state === "completed" || p.state === "dropped").length;
    return { total, active, near, stalled, closed };
  }, []);

  const filtered = useMemo(() => {
    return PROJECTS.filter((p) => {
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
  }, [goalFilter, stateFilter, query]);

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

  const meta = `${counts.total} PROJECTS · ${counts.active + counts.near} ACTIVE · ${counts.stalled} STALLED · ${counts.closed} CLOSED`;

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
      <Sidebar />
      <main className="ml-[220px] flex flex-col min-h-screen">
        {/* Page header */}
        <div className="px-10 pt-6 pb-3 shrink-0">
          <div className="flex items-baseline justify-between">
            <h1 className="text-[24px] font-medium text-text-primary">All projects</h1>
            <div className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-tertiary tabular-nums">
              {meta}
            </div>
          </div>

          {/* Triage strip */}
          <div className="mt-4 flex items-center gap-2 flex-wrap">
            <Pill label="ACTIVE" value={counts.active} />
            <Pill label="NEAR DONE" value={counts.near} accent />
            <Pill label="STALLED" value={counts.stalled} warning />
            <Pill label="CLOSED" value={counts.closed} />
          </div>

          {/* Filters row */}
          <div className="mt-4 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
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
                  className="ml-1 text-[12px] text-text-tertiary hover:text-text-secondary transition-colors"
                >
                  Clear filters
                </button>
              )}
            </div>
            <SortDropdown value={sortKey} options={SORT_OPTIONS} onChange={(v) => setSortKey(v)} />
          </div>

          {/* Search */}
          <div className="mt-3 max-w-[720px]">
            <div className="flex items-center gap-2 bg-surface-raised border border-border-subtle rounded-[4px] px-3 py-2 w-full">
              <span className="text-[12px] text-text-tertiary">⌕</span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search projects..."
                className="flex-1 bg-transparent outline-none text-[13px] text-text-primary placeholder:text-text-tertiary"
              />
            </div>
          </div>
        </div>

        <div className="border-t border-border-subtle" />

        {/* Sections */}
        <div className="flex-1 px-10 pt-8 pb-16 space-y-10">
          {filtered.length === 0 && (
            <div className="text-center py-16">
              <div className="text-[14px] text-text-secondary">No projects match these filters</div>
              <div className="mt-1 font-mono text-[11px] text-text-tertiary">
                Clear filters or change them above.
              </div>
            </div>
          )}

          {groups.near.length > 0 && (
            <section>
              <SectionHeader
                label="NEAR COMPLETION"
                count={groups.near.length}
                meta="≥ 75% DONE"
              />
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {groups.near.map((p) => (
                  <ProjectCard key={p.id} p={p} />
                ))}
              </div>
            </section>
          )}

          {groups.active.length > 0 && (
            <section>
              <SectionHeader label="ACTIVE" count={groups.active.length} meta="MOVING THIS WEEK" />
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
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
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
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

          {/* Add project affordance */}
          {filtered.length > 0 && (
            <div className="max-w-[480px]">
              <div
                className="flex items-center gap-3 rounded-[4px] px-3 transition-colors cursor-pointer hover:bg-surface-hover"
                style={{
                  height: 48,
                  border: "1px dashed hsl(var(--border-default))",
                }}
              >
                <span className="font-mono text-[16px] leading-none text-text-tertiary">+</span>
                <span className="text-[13px] text-text-tertiary">Add a project...</span>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AllProjects;
