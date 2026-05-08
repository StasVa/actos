import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { AppSidebar } from "@/components/AppSidebar";
import { MobileHeader } from "@/components/MobileHeader";
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
import { EmptyState, FilteredEmpty } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";

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





/* ===== Action row ===== */
const ActionRow: React.FC<{ action: Action; selected: boolean; onSelect: () => void }> = ({
  action,
  selected,
  onSelect,
}) => {
  const changeStatus = useStore((s) => s.changeActionStatus);
  const storeAction = useStore((s) => s.actions.find((x) => x.id === action.id));
  const openPanel = useStore((s) => s.openPanel);
  const goal = GOALS[action.goal];
  const isTerminal = !isActive(action.status);
  const isDone = action.status === "done";
  const checkboxDisabled =
    action.status === "delegated" ||
    action.status === "dropped" ||
    action.status === "cancelled";

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (checkboxDisabled) return;
    if (isDone) {
      const today = new Date().toISOString().slice(0, 10);
      changeStatus(action.id, "planned", { scheduledDate: today });
      toast.dismiss();
      toast.success("Action re-opened");
      return;
    }
    if (!storeAction?.impact || !storeAction?.timeEstimateMinutes) {
      toast.error("Set Impact and Time before marking done");
      openPanel({ kind: "action", mode: "edit", id: action.id });
      return;
    }
    changeStatus(action.id, "done");
    toast.dismiss();
    toast.success("Action marked done");
  };

  const bottomBits: React.ReactNode[] = [];
  bottomBits.push(<span key="goal">{goal.name}</span>);
  bottomBits.push(<span key="proj">{action.project}</span>);
  if (action.timeMinutes) bottomBits.push(<span key="time" className="tabular-nums">{formatTime(action.timeMinutes)}</span>);
  if (action.status === "delegated" && action.delegate)
    bottomBits.push(<span key="del">→ {action.delegate}</span>);

  const goalVar = `--goal-${action.goal === "g1" ? 1 : action.goal === "g2" ? 2 : 3}`;
  const impactBg = `color-mix(in srgb, hsl(var(${goalVar})) 15%, transparent)`;
  const impactFg = `hsl(var(${goalVar}))`;

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
            <button
              type="button"
              onClick={handleToggle}
              disabled={checkboxDisabled}
              title={checkboxDisabled ? "Re-open this action via the editor" : undefined}
              aria-label={isDone ? "Re-open" : "Mark done"}
              className="inline-flex items-center justify-center rounded-[2px] border shrink-0"
              style={{
                width: 16,
                height: 16,
                background: isDone ? goal.color : "transparent",
                borderColor: isDone ? goal.color : "hsl(var(--text-tertiary))",
                color: "hsl(var(--surface-base))",
                fontSize: 11,
                lineHeight: 1,
                opacity: checkboxDisabled ? 0.4 : 1,
                cursor: checkboxDisabled ? "not-allowed" : "pointer",
              }}
            >
              {isDone ? "✓" : ""}
            </button>
            <span
              className={`text-[15px] font-medium truncate ${
                isTerminal ? "text-text-secondary line-through" : "text-text-primary"
              }`}
            >
              {action.title}
            </span>
          </div>
          <div className="shrink-0 ml-3">
            {action.impact ? (
              <span
                className="inline-flex items-center justify-center font-medium tabular-nums"
                style={{
                  background: impactBg,
                  color: impactFg,
                  fontSize: 13,
                  padding: "4px 10px",
                  borderRadius: 4,
                  minWidth: 36,
                  textAlign: "center",
                  opacity: isTerminal ? 0.5 : 1,
                }}
              >
                I{action.impact}
              </span>
            ) : null}
          </div>
        </div>
        {/* Bottom row */}
        <div
          className={`flex items-center font-mono text-[12px] tabular-nums truncate ${
            isTerminal ? "text-text-tertiary" : "text-text-secondary"
          }`}
        >
          <span
            className="inline-block w-1.5 h-1.5 rounded-full mr-1.5 shrink-0"
            style={{ background: goal.color }}
          />
          <span className="truncate">
            {bottomBits.map((b, i) => (
              <React.Fragment key={i}>
                {i > 0 && <span className="mx-1.5 text-text-tertiary">·</span>}
                {b}
              </React.Fragment>
            ))}
          </span>
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
  const openPanel = useStore((s) => s.openPanel);
  const changeActionStatus = useStore((s) => s.changeActionStatus);
  const handleEdit = () =>
    openPanel({ kind: "action", mode: "edit", id: action.id });
  const handleMarkDone = () => {
    changeActionStatus(action.id, "done");
    toast.success("Action completed");
  };
  const handleReopen = () => {
    changeActionStatus(action.id, "planned");
    toast.success("Action re-opened");
  };
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
          <GhostButton onClick={handleEdit}>Edit action</GhostButton>
          {isActive(action.status) && (
            <GhostButton accent onClick={handleMarkDone}>
              Mark done
            </GhostButton>
          )}
          {action.status === "delegated" && (
            <>
              <GhostButton accent onClick={handleMarkDone}>
                Mark done
              </GhostButton>
              <GhostButton onClick={handleReopen}>Re-open</GhostButton>
            </>
          )}
          {(action.status === "done" ||
            action.status === "dropped" ||
            action.status === "cancelled") && (
            <GhostButton onClick={handleReopen}>Re-open</GhostButton>
          )}
        </div>
        <button
          onClick={handleEdit}
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

  const openAction = (id: string) => openPanel({ kind: "action", mode: "edit", id });

  return (
    <div className="min-h-screen bg-surface-base text-text-primary">
      <AppSidebar />
      <MobileHeader />
      <main className="app-main page-medium flex flex-col h-screen">
        <div className="px-4 md:px-10 pt-6 pb-4 shrink-0">
          <PageHeader
            title="Actions"
            meta={meta}
            cta={{
              label: "+ New action",
              onClick: () => openPanel({ kind: "action", mode: "new" }),
              ariaLabel: "New action",
            }}
            filters={
              <>
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
                    className="ml-1 text-[12px] text-text-tertiary hover:text-text-secondary transition-colors shrink-0"
                  >
                    Clear filters
                  </button>
                )}
              </>
            }
            sort={
              <SortDropdown
                value={sortKey}
                options={SORT_OPTIONS}
                onChange={(v) => setSortKey(v)}
              />
            }
          />
        </div>

        {/* Full-width list */}
        <div className="flex-1 overflow-y-auto min-h-0 pt-2 pl-8">
          {ACTIONS.length === 0 ? (
            <EmptyState
              headline="No actions yet."
              description="Actions are the concrete next steps under your projects. Capture them here as you think of them, then mark them done as you complete them."
              ctaLabel="+ New action"
              onCta={() => openPanel({ kind: "action", mode: "new" })}
              hint={
                storeProjects.filter((p) => !p.isDraft && p.status === "active").length === 0
                  ? "You'll need a goal and project first."
                  : null
              }
            />
          ) : filtered.length === 0 ? (
            <FilteredEmpty onClear={clearFilters} />
          ) : "single" in grouped ? (
            grouped.single!.map((a) => (
              <ActionRow key={a.id} action={a} selected={false} onSelect={() => openAction(a.id)} />
            ))
          ) : (
            <>
              {grouped.active!.length > 0 &&
                grouped.active!.map((a) => (
                  <ActionRow key={a.id} action={a} selected={false} onSelect={() => openAction(a.id)} />
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
                      <ActionRow key={a.id} action={a} selected={false} onSelect={() => openAction(a.id)} />
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
