import React, { useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { toast } from "sonner";
import {
  Action,
  ActionStatus,
  GoalKey,
  GOALS,
  STATUS_LABEL,
  isActive,
  statusColorVar,
} from "@/lib/actionsData";
import { LifetimeCounters } from "@/components/LifetimeCounters";
import { formatTime } from "@/lib/format";
import { FilterDropdown, FilterOption } from "@/components/FilterDropdown";
import { SortDropdown } from "@/components/SortDropdown";
import { useStore } from "@/store/useStore";
import { toLegacyActions } from "@/lib/actionsAdapter";
import { GOAL_IDS, PROJECT_IDS } from "@/store/mockData";

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

/* ===== Filter chips ===== */
const Chip: React.FC<{
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  dot?: string;
}> = ({ active, onClick, children, dot }) => (
  <button
    onClick={onClick}
    className={`inline-flex items-center gap-1.5 px-[10px] py-1 rounded-[4px] border text-[12px] transition-colors ${
      active
        ? "bg-surface-hover text-text-primary border-accent"
        : "bg-transparent text-text-secondary border-border-default hover:text-text-primary"
    }`}
  >
    {dot && <span className="w-2 h-2 rounded-full" style={{ background: dot }} />}
    {children}
  </button>
);

const FilterGroup: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="flex items-center gap-2">
    <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-text-tertiary">{label}</span>
    <div className="flex items-center gap-1.5 flex-wrap">{children}</div>
  </div>
);

/* ===== Buttons ===== */
const GhostButton: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  accent?: boolean;
}> = ({ children, onClick, accent }) => (
  <button
    onClick={onClick}
    className={`h-9 px-4 text-[13px] font-medium rounded-[4px] border bg-transparent transition-colors ${
      accent
        ? "text-text-primary border-[hsl(var(--accent))] hover:bg-surface-hover"
        : "text-text-primary border-border-default hover:border-[hsl(var(--accent))] hover:bg-surface-hover"
    }`}
  >
    {children}
  </button>
);


const fakeAction = (label: string) => () => {
  // Placeholder for future interactivity.
  // eslint-disable-next-line no-console
  console.log(`[ActOS prototype] ${label} — full interactivity coming next`);
};

/* ===== Inline-add row (create new action) ===== */
const InlineAddAction: React.FC = () => {
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [project, setProject] = useState("Shoot video #1");
  const [popoverOpen, setPopoverOpen] = useState(false);
  const popRef = React.useRef<HTMLDivElement>(null);

  const storeProjects = useStore((s) => s.projects);
  const storeActions = useStore((s) => s.actions);
  const createAction = useStore((s) => s.createAction);
  const openPanel = useStore((s) => s.openPanel);

  React.useEffect(() => {
    if (!popoverOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (popRef.current && !popRef.current.contains(e.target as Node)) setPopoverOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPopoverOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [popoverOpen]);

  // Build active projects grouped by goal from the live store.
  const projectsByGoal = React.useMemo(() => {
    const titleByGoalKey = new Map<GoalKey, Set<string>>();
    const titleToId: Record<string, string> = {};
    const titleToGoalId: Record<string, string> = {};
    for (const p of storeProjects) {
      if (p.status !== "active") continue;
      const goalKey = (Object.entries(GOAL_IDS).find(([, id]) => id === p.goalId)?.[0] ??
        "g1") as GoalKey;
      if (!titleByGoalKey.has(goalKey)) titleByGoalKey.set(goalKey, new Set());
      titleByGoalKey.get(goalKey)!.add(p.title);
      titleToId[p.title] = p.id;
      titleToGoalId[p.title] = p.goalId;
    }
    const groups = (Object.keys(GOALS) as GoalKey[])
      .filter((g) => titleByGoalKey.has(g))
      .map((g) => ({ goal: g, projects: Array.from(titleByGoalKey.get(g)!) }));
    return { groups, titleToId, titleToGoalId };
  }, [storeProjects]);

  const active = focused || hovered;

  return (
    <div className="px-10 pb-2">
      <div className="max-w-[720px]">
        <div
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          className="flex items-center gap-3 rounded-[4px] px-3 transition-colors"
          style={{
            height: 48,
            background: "transparent",
            border: `1px ${active ? "solid" : "dashed"} ${
              active ? "hsl(var(--accent))" : "hsl(var(--border-default))"
            }`,
          }}
        >
          <span
            className="font-mono text-[16px] leading-none shrink-0"
            style={{ color: active ? "hsl(var(--text-secondary))" : "hsl(var(--text-tertiary))" }}
          >
            +
          </span>
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && value.trim()) {
                const projectId = projectsByGoal.titleToId[project];
                const goalId = projectsByGoal.titleToGoalId[project];
                const newId = createAction({
                  title: value.trim(),
                  projectId: projectId ?? null,
                  goalId,
                });
                toast(`Action added to ${project}`);
                setValue("");
                openPanel({ kind: "action", mode: "edit", id: newId });
              }
            }}
            placeholder="Add an action..."
            className="flex-1 bg-transparent outline-none text-[13px] text-text-primary placeholder:text-text-tertiary"
          />
          <div className="relative shrink-0" ref={popRef}>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setPopoverOpen((v) => !v)}
              className="inline-flex items-center gap-1.5 px-2 py-1 rounded-[4px] hover:bg-surface-hover transition-colors"
            >
              <span className="font-mono text-[11px] text-text-tertiary">→</span>
              <span className="font-mono text-[11px] text-text-secondary">{project}</span>
              <span className="font-mono text-[11px] text-text-tertiary">▾</span>
            </button>
            {popoverOpen && (
              <div
                className="absolute right-0 top-[calc(100%+4px)] z-20 min-w-[220px] bg-surface-elevated border border-border-default rounded-[4px] py-1.5 shadow-lg"
              >
                {projectsByGoal.groups.map(({ goal, projects }) => (
                  <div key={goal}>
                    <div className="flex items-center gap-1.5 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.08em] text-text-tertiary">
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ background: GOALS[goal].color }}
                      />
                      {GOALS[goal].short}
                    </div>
                    {projects.map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => {
                          setProject(p);
                          setPopoverOpen(false);
                        }}
                        className="w-full text-left px-3 py-1.5 text-[13px] text-text-primary hover:bg-surface-hover flex items-center justify-between gap-2"
                      >
                        <span className="truncate">{p}</span>
                        {p === project && (
                          <span className="text-text-secondary text-[12px]">✓</span>
                        )}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};


/* ===== Action row ===== */
const ActionRow: React.FC<{ action: Action; selected: boolean; onSelect: () => void }> = ({
  action,
  selected,
  onSelect,
}) => {
  const goal = GOALS[action.goal];
  const isTerminal = !isActive(action.status);
  const bottomBits: React.ReactNode[] = [];
  bottomBits.push(<span key="goal">{goal.short}</span>);
  bottomBits.push(<span key="proj">{action.project}</span>);
  if (action.impact) bottomBits.push(<span key="imp">I{action.impact}</span>);
  if (action.timeMinutes) bottomBits.push(<span key="time">{formatTime(action.timeMinutes)}</span>);
  if (action.status === "delegated" && action.delegate)
    bottomBits.push(<span key="del">→ {action.delegate.toUpperCase()}</span>);

  return (
    <div
      onClick={onSelect}
      className={`relative flex items-stretch cursor-pointer border-b border-border-subtle transition-colors ${
        selected ? "bg-surface-elevated" : "hover:bg-surface-hover"
      }`}
      style={{ minHeight: 56 }}
    >
      <span
        className="absolute left-0 top-0 bottom-0"
        style={{
          background: selected ? "hsl(var(--accent))" : goal.color,
          width: selected ? 2 : 3,
        }}
      />
      <div className="flex flex-col gap-1 py-3 pr-4 w-full" style={{ paddingLeft: 16 + (selected ? 2 : 3) }}>
        {/* Top row */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <span
              className="inline-flex items-center justify-center rounded-[2px] border shrink-0"
              style={{
                width: 16,
                height: 16,
                background: action.status === "done" ? goal.color : "transparent",
                borderColor:
                  action.status === "done" ? goal.color : "hsl(var(--text-tertiary))",
                color: "hsl(var(--surface-base))",
                fontSize: 11,
                lineHeight: 1,
              }}
            >
              {action.status === "done" ? "✓" : ""}
            </span>
            <span
              className={`text-[14px] font-medium truncate ${
                isTerminal ? "text-text-secondary line-through" : "text-text-primary"
              }`}
            >
              {action.title}
            </span>
          </div>
          <div className="shrink-0">
            {action.status === "planned" && action.scheduledLabel && (
              <span
                className="font-mono uppercase tracking-[0.06em] text-text-secondary bg-surface-hover"
                style={{ fontSize: 10, padding: "2px 6px", borderRadius: 2 }}
              >
                {action.scheduledLabel}
              </span>
            )}
            {action.status === "done" && (
              <span
                className="font-mono"
                style={{ color: "hsl(var(--status-done))", fontSize: 12 }}
              >
                ✓
              </span>
            )}
          </div>
        </div>
        {/* Bottom row */}
        <div className="flex items-center font-mono text-[11px] text-text-tertiary tabular-nums">
          <span
            className="inline-block w-1.5 h-1.5 rounded-full mr-1.5 shrink-0"
            style={{ background: goal.color }}
          />
          {bottomBits.map((b, i) => (
            <React.Fragment key={i}>
              {i > 0 && <span className="mx-1.5">·</span>}
              {b}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ===== Group header ===== */
const GroupHeader: React.FC<{
  label: string;
  count: number;
  collapsible?: boolean;
  collapsed?: boolean;
  onToggle?: () => void;
}> = ({ label, count, collapsible, collapsed, onToggle }) => (
  <button
    type="button"
    onClick={onToggle}
    disabled={!collapsible}
    className={`w-full flex items-center gap-2 px-3 h-8 bg-surface-raised border-b border-border-subtle text-left ${
      collapsible ? "cursor-pointer hover:bg-surface-hover" : "cursor-default"
    }`}
  >
    {collapsible && (
      <span className="font-mono text-[11px] text-text-tertiary">{collapsed ? "▸" : "▾"}</span>
    )}
    <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-text-tertiary">
      {label} · {count}
    </span>
  </button>
);

/* ===== Detail ===== */
const StatusPill: React.FC<{ status: ActionStatus }> = ({ status }) => (
  <span
    className="inline-flex items-center font-mono uppercase tracking-[0.08em] rounded-[4px]"
    style={{
      padding: "4px 8px",
      fontSize: 10,
      background: "hsl(var(--surface-hover))",
      color: statusColorVar(status),
    }}
  >
    {STATUS_LABEL[status]}
  </span>
);

const ActionDetail: React.FC<{ action: Action }> = ({ action }) => {
  const goal = GOALS[action.goal];
  const isOverdue =
    action.status === "delegated" &&
    action.expectedReturnDelta !== undefined &&
    action.expectedReturnDelta < 0;

  const quickInfoBits: React.ReactNode[] = [
    `IMPACT ${action.impact}`,
    formatTime(action.timeMinutes),
  ];
  if (action.status === "planned" && action.scheduledLabel) {
    quickInfoBits.push(`SCHEDULED ${action.scheduledLabel}`);
  }
  quickInfoBits.push(`CREATED ${action.createdLabel.toUpperCase()}`);

  return (
    <div className="px-10 py-8">
      <div className="max-w-[540px] mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.06em] text-text-tertiary">
        <span className="w-2 h-2 rounded-full" style={{ background: goal.color }} />
        <span className="hover:text-text-secondary cursor-pointer transition-colors">
          {goal.name}
        </span>
        <span>·</span>
        <span className="hover:text-text-secondary cursor-pointer transition-colors">
          {action.project}
        </span>
      </div>

      <div className="h-3" />
      <StatusPill status={action.status} />

      <div className="h-4" />
      <h1 className="text-[22px] font-medium text-text-primary leading-tight">{action.title}</h1>

      <div className="h-8" />
      <div className="font-mono text-[13px] text-text-tertiary tabular-nums">
        {quickInfoBits.map((b, i) => (
          <React.Fragment key={i}>
            {i > 0 && <span> · </span>}
            <span>{b}</span>
          </React.Fragment>
        ))}
        {action.status === "delegated" && action.delegate && (
          <>
            <span> · </span>
            <span>→ {action.delegate.toUpperCase()}</span>
            {action.expectedReturnLabel && (
              <>
                <span> · EXPECTED </span>
                <span style={{ color: isOverdue ? "hsl(var(--text-warning))" : undefined }}>
                  {action.expectedReturnLabel}
                </span>
              </>
            )}
          </>
        )}
      </div>

      {action.notes && (
        <>
          <div className="h-8" />
          <div className="font-mono text-[11px] uppercase tracking-[0.08em] text-text-secondary">
            NOTES
          </div>
          <div className="h-3" />
          <p className="text-[14px] text-text-primary leading-[1.6]">{action.notes}</p>
        </>
      )}

      <div className="h-12" />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GhostButton onClick={fakeAction("Edit action")}>Edit action</GhostButton>
          {isActive(action.status) && (
            <GhostButton accent onClick={fakeAction("Mark done")}>
              Mark done
            </GhostButton>
          )}
          {action.status === "delegated" && (
            <>
              <GhostButton accent onClick={fakeAction("Mark delegated done")}>
                Mark done
              </GhostButton>
              <GhostButton onClick={fakeAction("Re-open delegation")}>Re-open</GhostButton>
            </>
          )}
          {(action.status === "done" ||
            action.status === "dropped" ||
            action.status === "cancelled") && (
            <GhostButton onClick={fakeAction("Re-open action")}>Re-open</GhostButton>
          )}
        </div>
        <button
          onClick={fakeAction("Open menu")}
          className="w-6 h-6 inline-flex items-center justify-center rounded-[4px] text-text-tertiary hover:bg-surface-hover hover:text-text-secondary transition-colors"
        >
          ···
        </button>
      </div>
      </div>
    </div>
  );
};

/* ===== Empty states ===== */
const EmptyDetail: React.FC = () => (
  <div className="h-full flex flex-col items-center justify-center text-center px-10">
    <div className="text-[14px] text-text-secondary">Select an action to view details</div>
  </div>
);

const EmptyFiltered: React.FC<{ onClear: () => void }> = ({ onClear }) => (
  <div className="h-full flex flex-col items-center justify-center text-center px-10">
    <div className="text-[14px] text-text-secondary">No actions match these filters</div>
    <div className="mt-1 font-mono text-[11px] text-text-tertiary">
      Clear filters or change them above.
    </div>
    <div className="mt-4">
      <GhostButton onClick={onClear}>Clear filters</GhostButton>
    </div>
  </div>
);

/* ===== Page ===== */
type StatusFilter = "all" | ActionStatus;
type GoalFilter = "all" | GoalKey;
type DateFilter = "all" | "today" | "week" | "month";
type SortKey = "recent" | "oldest" | "impact" | "scheduled";

const STATUS_OPTIONS: FilterOption<StatusFilter>[] = [
  { value: "all", label: "All" },
  { value: "backlog", label: "Backlog" },
  { value: "planned", label: "Planned" },
  { value: "done", label: "Done" },
  { value: "delegated", label: "Delegated" },
  { value: "dropped", label: "Dropped" },
  { value: "cancelled", label: "Cancelled" },
];

const DATE_OPTIONS: FilterOption<DateFilter>[] = [
  { value: "all", label: "All time" },
  { value: "today", label: "Today" },
  { value: "week", label: "This week" },
  { value: "month", label: "This month" },
];

const GOAL_OPTIONS: FilterOption<GoalFilter>[] = [
  { value: "all", label: "All" },
  { value: "g1", label: "Launch YouTube", dot: GOALS.g1.color },
  { value: "g2", label: "Lose 5 kg", dot: GOALS.g2.color },
  { value: "g3", label: "Read 24 books", dot: GOALS.g3.color },
];

const SORT_OPTIONS: FilterOption<SortKey>[] = [
  { value: "recent", label: "Recent first" },
  { value: "oldest", label: "Oldest first" },
  { value: "impact", label: "By impact" },
  { value: "scheduled", label: "By scheduled date" },
];

const AllActions: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [goalFilter, setGoalFilter] = useState<GoalFilter>("all");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("recent");
  const [query, setQuery] = useState("");
  const [terminalCollapsed, setTerminalCollapsed] = useState(false);

  // Live store data → legacy renderer shape (rendering JSX is unchanged).
  const storeActions = useStore((s) => s.actions);
  const storeProjects = useStore((s) => s.projects);
  const openPanel = useStore((s) => s.openPanel);
  const ACTIONS = useMemo(
    () => toLegacyActions(storeActions, storeProjects),
    [storeActions, storeProjects],
  );

  const filtered = useMemo(() => {
    return ACTIONS.filter((a) => {
      if (statusFilter !== "all" && a.status !== statusFilter) return false;
      if (goalFilter !== "all" && a.goal !== goalFilter) return false;
      if (dateFilter === "today") {
        const isToday = a.scheduledSort === 0 || a.createdLabel === "May 5";
        if (!isToday) return false;
      }
      if (query.trim() && !a.title.toLowerCase().includes(query.trim().toLowerCase())) return false;
      return true;
    });
  }, [ACTIONS, statusFilter, goalFilter, dateFilter, query]);

  const meta = useMemo(() => {
    const total = ACTIONS.length;
    const active = ACTIONS.filter((a) => isActive(a.status)).length;
    const done = ACTIONS.filter((a) => a.status === "done").length;
    const delegated = ACTIONS.filter((a) => a.status === "delegated").length;
    return `${total} ACTIONS · ${active} ACTIVE · ${done} DONE · ${delegated} DELEGATED`;
  }, [ACTIONS]);

  const sortFn = useMemo(() => {
    return (a: Action, b: Action) => {
      switch (sortKey) {
        case "oldest":
          return a.changedSort - b.changedSort;
        case "impact":
          return (b.impact ?? 0) - (a.impact ?? 0);
        case "scheduled": {
          const sa = a.scheduledSort ?? Number.POSITIVE_INFINITY;
          const sb = b.scheduledSort ?? Number.POSITIVE_INFINITY;
          return sa - sb;
        }
        case "recent":
        default:
          return b.changedSort - a.changedSort;
      }
    };
  }, [sortKey]);

  const grouped = useMemo(() => {
    if (statusFilter !== "all") {
      return { single: [...filtered].sort(sortFn) };
    }
    const active = filtered.filter((a) => isActive(a.status)).sort(sortFn);
    const terminal = filtered.filter((a) => !isActive(a.status)).sort(sortFn);
    return { active, terminal };
  }, [filtered, statusFilter, sortFn]);

  const anyApplied =
    statusFilter !== "all" ||
    goalFilter !== "all" ||
    dateFilter !== "all" ||
    sortKey !== "recent" ||
    query.trim() !== "";

  const clearFilters = () => {
    setStatusFilter("all");
    setGoalFilter("all");
    setDateFilter("all");
    setSortKey("recent");
    setQuery("");
  };

  const noop = () => {};

  return (
    <div className="min-h-screen bg-surface-base text-text-primary">
      <Sidebar />
      <main className="ml-[220px] flex flex-col h-screen">
        {/* Page header */}
        <div className="px-10 pt-6 pb-3 shrink-0">
          <div className="flex items-baseline justify-between">
            <h1 className="text-[24px] font-medium text-text-primary">All actions</h1>
            <div className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-tertiary tabular-nums">
              {meta}
            </div>
          </div>

          {/* Filters row */}
          <div className="mt-3 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <FilterDropdown
                label="STATUS"
                value={statusFilter}
                defaultValue="all"
                options={STATUS_OPTIONS}
                onChange={(v) => setStatusFilter(v)}
              />
              <FilterDropdown
                label="GOAL"
                value={goalFilter}
                defaultValue="all"
                options={GOAL_OPTIONS}
                onChange={(v) => setGoalFilter(v)}
              />
              <FilterDropdown
                label="DATE"
                value={dateFilter}
                defaultValue="all"
                options={DATE_OPTIONS}
                onChange={(v) => setDateFilter(v)}
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
            <SortDropdown
              value={sortKey}
              options={SORT_OPTIONS}
              onChange={(v) => setSortKey(v)}
            />
          </div>

          {/* Search */}
          <div className="mt-3 max-w-[720px]">
            <div className="flex items-center gap-2 bg-surface-raised border border-border-subtle rounded-[4px] px-3 py-2 w-full">
              <span className="text-[12px] text-text-tertiary">⌕</span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search actions..."
                className="flex-1 bg-transparent outline-none text-[13px] text-text-primary placeholder:text-text-tertiary"
              />
            </div>
          </div>
        </div>

        <div className="border-t border-border-subtle" />

        {/* Inline-add */}
        <div className="pt-6">
          <InlineAddAction />
        </div>

        {/* Full-width list */}
        <div className="flex-1 overflow-y-auto min-h-0 pt-2 pl-8">
          {filtered.length === 0 ? (
            <div className="p-8 text-center font-mono text-[11px] text-text-tertiary">
              No actions match these filters.
            </div>
          ) : "single" in grouped ? (
            grouped.single!.map((a) => (
              <ActionRow key={a.id} action={a} selected={false} onSelect={noop} />
            ))
          ) : (
            <>
              {grouped.active!.length > 0 &&
                grouped.active!.map((a) => (
                  <ActionRow key={a.id} action={a} selected={false} onSelect={noop} />
                ))}
              {grouped.terminal!.length > 0 && (
                <>
                  <GroupHeader
                    label="TERMINAL"
                    count={grouped.terminal!.length}
                    collapsible
                    collapsed={terminalCollapsed}
                    onToggle={() => setTerminalCollapsed((v) => !v)}
                  />
                  {!terminalCollapsed &&
                    grouped.terminal!.map((a) => (
                      <ActionRow key={a.id} action={a} selected={false} onSelect={noop} />
                    ))}
                </>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default AllActions;
