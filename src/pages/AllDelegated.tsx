import React, { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { AppSidebar } from "@/components/AppSidebar";
import { MobileHeader } from "@/components/MobileHeader";
import { ReturnDatePill } from "@/components/ReturnDatePill";
import { FilterDropdown, FilterOption } from "@/components/FilterDropdown";
import { useStore } from "@/store/useStore";
import type { Action, Goal, Project } from "@/types";
import { EmptyState as SharedEmptyState, FilteredEmpty } from "@/components/EmptyState";

/* ===== helpers ===== */
const TODAY_ISO = "2026-05-05";

function daysBetween(a: string, b: string): number {
  const ta = new Date(a + "T00:00:00.000Z").getTime();
  const tb = new Date(b + "T00:00:00.000Z").getTime();
  return Math.round((ta - tb) / 86400000);
}

function relativeShort(iso: string): string {
  const d = daysBetween(iso, TODAY_ISO);
  if (d === 0) return "today";
  if (d === -1) return "1d ago";
  if (d < 0) return `${-d}d ago`;
  if (d === 1) return "in 1d";
  return `in ${d}d`;
}

/* ===== Pills ===== */
const ImpactPill: React.FC<{ impact?: number; color: string }> = ({ impact, color }) =>
  impact ? (
    <span
      className="inline-flex items-center justify-center font-medium tabular-nums shrink-0"
      style={{
        padding: "4px 10px",
        borderRadius: 4,
        fontSize: 13,
        minWidth: 36,
        textAlign: "center",
        background: `color-mix(in srgb, ${color}, transparent 85%)`,
        color,
      }}
    >
      I{impact}
    </span>
  ) : null;

const ReturnedPill: React.FC<{ completedAt?: string }> = ({ completedAt }) => {
  if (!completedAt) return null;
  const iso = completedAt.slice(0, 10);
  return (
    <span
      className="font-mono tabular-nums shrink-0"
      style={{
        fontSize: 12,
        color: "hsl(var(--text-tertiary))",
        background: "hsl(var(--surface-hover))",
        padding: "3px 8px",
        borderRadius: 3,
        whiteSpace: "nowrap",
      }}
    >
      returned {relativeShort(iso)}
    </span>
  );
};

/* ===== Row ===== */
type RowVariant = "active" | "returned";
const DelegationRow: React.FC<{
  action: Action;
  goal?: Goal;
  project?: Project;
  variant: RowVariant;
  onClick: () => void;
}> = ({ action, goal, project, variant, onClick }) => {
  const color = goal?.color ?? "hsl(var(--text-tertiary))";
  return (
    <div
      onClick={onClick}
      className="relative flex items-center cursor-pointer border-b border-border-subtle hover:bg-surface-hover transition-colors"
      style={{ minHeight: 58 }}
    >
      <span
        className="absolute left-0 top-0 bottom-0"
        style={{ background: color, width: 3 }}
      />
      <div className="flex items-center gap-3 py-2.5 pr-4 w-full" style={{ paddingLeft: 16 }}>
        <div className="flex flex-col gap-0.5 min-w-0 flex-1">
          <div className="text-[14px] font-medium text-text-primary truncate">
            {action.title}
          </div>
          <div className="font-mono text-[12px] text-text-secondary tabular-nums truncate">
            <span className="text-text-tertiary">→ </span>
            <span className="text-text-primary">{action.delegateName ?? "—"}</span>
            {goal && (
              <>
                <span className="mx-1.5 text-text-tertiary">·</span>
                <span>{goal.title}</span>
              </>
            )}
            {project && (
              <>
                <span className="mx-1.5 text-text-tertiary">·</span>
                <span>{project.title}</span>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {variant === "active" ? (
            <ReturnDatePill expectedReturnDate={action.expectedReturnDate} />
          ) : (
            <ReturnedPill completedAt={action.completedAt} />
          )}
          <ImpactPill impact={action.impact} color={color} />
        </div>
      </div>
    </div>
  );
};

/* ===== Aggregate counts ===== */
const Counter: React.FC<{ label: string; count: number; color?: string }> = ({
  label,
  count,
  color,
}) => (
  <div className="flex items-baseline gap-2">
    <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-text-tertiary">
      {label}
    </span>
    <span
      className="font-mono text-[13px] tabular-nums"
      style={{ color: color ?? "hsl(var(--text-primary))" }}
    >
      {count}
    </span>
  </div>
);

/* ===== Tabs ===== */
type TabKey = "active" | "returned";
const TabBar: React.FC<{ value: TabKey; onChange: (v: TabKey) => void }> = ({
  value,
  onChange,
}) => (
  <div className="flex items-center gap-6 border-b border-border-subtle">
    {(["active", "returned"] as TabKey[]).map((k) => {
      const active = value === k;
      return (
        <button
          key={k}
          onClick={() => onChange(k)}
          className="relative pb-2 text-[14px] font-medium transition-colors"
          style={{
            color: active ? "hsl(var(--text-primary))" : "hsl(var(--text-secondary))",
          }}
        >
          {k === "active" ? "Active" : "Returned"}
          {active && (
            <span
              className="absolute left-0 right-0 -bottom-px h-[2px]"
              style={{ background: "hsl(var(--accent))" }}
            />
          )}
        </button>
      );
    })}
  </div>
);

/* ===== Date range ===== */
type DateRange = "all" | "30" | "90" | "365";
const DATE_OPTIONS: FilterOption<DateRange>[] = [
  { value: "all", label: "All time" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
  { value: "365", label: "Last year" },
];

/* ===== Page ===== */
const AllDelegated: React.FC = () => {
  const actions = useStore((s) => s.actions);
  const goals = useStore((s) => s.goals);
  const projects = useStore((s) => s.projects);
  const openPanel = useStore((s) => s.openPanel);

  const goalById = useMemo(() => {
    const m = new Map<string, Goal>();
    for (const g of goals) m.set(g.id, g);
    return m;
  }, [goals]);
  const projectById = useMemo(() => {
    const m = new Map<string, Project>();
    for (const p of projects) m.set(p.id, p);
    return m;
  }, [projects]);

  const [tab, setTab] = useState<TabKey>("active");
  const [delegateFilter, setDelegateFilter] = useState<string>("all");
  const [goalFilter, setGoalFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<DateRange>("all");

  // Active = currently delegated. Returned = done with delegate name (was returned).
  const allActive = useMemo(
    () => actions.filter((a) => a.status === "delegated"),
    [actions],
  );
  const allReturned = useMemo(
    () => actions.filter((a) => a.status === "done" && !!a.delegateName),
    [actions],
  );

  const aggregates = useMemo(() => {
    let overdue = 0;
    let today = 0;
    for (const a of allActive) {
      if (!a.expectedReturnDate) continue;
      const d = daysBetween(a.expectedReturnDate, TODAY_ISO);
      if (d < 0) overdue++;
      else if (d === 0) today++;
    }
    return { active: allActive.length, overdue, today };
  }, [allActive]);

  const delegateOptions = useMemo<FilterOption<string>[]>(() => {
    const set = new Set<string>();
    for (const a of actions) if (a.delegateName) set.add(a.delegateName);
    return [
      { value: "all", label: "All" },
      ...Array.from(set)
        .sort()
        .map((n) => ({ value: n, label: n })),
    ];
  }, [actions]);

  const goalOptions = useMemo<FilterOption<string>[]>(
    () => [
      { value: "all", label: "All" },
      ...goals
        .filter((g) => g.status === "active")
        .map((g) => ({ value: g.id, label: g.title, dot: g.color })),
    ],
    [goals],
  );

  const applyFilters = (list: Action[], useDate: boolean): Action[] => {
    return list.filter((a) => {
      if (delegateFilter !== "all" && a.delegateName !== delegateFilter) return false;
      if (goalFilter !== "all" && a.goalId !== goalFilter) return false;
      if (useDate && dateRange !== "all") {
        const stamp = a.completedAt ?? a.delegatedAt;
        if (!stamp) return false;
        const days = -daysBetween(stamp.slice(0, 10), TODAY_ISO);
        if (days > parseInt(dateRange, 10)) return false;
      }
      return true;
    });
  };

  const activeList = useMemo(() => {
    const filtered = applyFilters(allActive, false);
    return filtered.sort((a, b) => {
      const da = a.expectedReturnDate
        ? daysBetween(a.expectedReturnDate, TODAY_ISO)
        : Number.POSITIVE_INFINITY;
      const db = b.expectedReturnDate
        ? daysBetween(b.expectedReturnDate, TODAY_ISO)
        : Number.POSITIVE_INFINITY;
      return da - db;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allActive, delegateFilter, goalFilter]);

  const returnedList = useMemo(() => {
    const filtered = applyFilters(allReturned, true);
    return filtered.sort((a, b) => {
      const ta = a.completedAt ?? "";
      const tb = b.completedAt ?? "";
      return tb.localeCompare(ta);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allReturned, delegateFilter, goalFilter, dateRange]);

  const list = tab === "active" ? activeList : returnedList;

  const openAction = (id: string) =>
    openPanel({ kind: "action", mode: "edit", id });

  const newDelegated = () =>
    openPanel({
      kind: "action",
      mode: "new",
      prefill: { status: "delegated" },
    });

  const clearFilters = () => {
    setDelegateFilter("all");
    setGoalFilter("all");
    setDateRange("all");
  };
  const anyFilter =
    delegateFilter !== "all" ||
    goalFilter !== "all" ||
    (tab === "returned" && dateRange !== "all");

  return (
    <div className="min-h-screen bg-surface-base text-text-primary">
      <AppSidebar />
      <MobileHeader />
      <main className="app-main page-medium flex flex-col h-screen">
        {/* Header */}
        <div className="px-10 pt-6 pb-3 shrink-0">
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-[24px] font-medium text-text-primary">Delegated</h1>
            <button
              onClick={newDelegated}
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-[4px] text-[13px] font-medium text-white transition-colors"
              style={{ background: "hsl(var(--accent))" }}
            >
              <Plus size={14} />
              New delegated action
            </button>
          </div>

          {/* Aggregate counts */}
          <div className="flex items-center gap-6 py-3">
            <Counter label="ACTIVE" count={aggregates.active} />
            <span className="text-text-tertiary">·</span>
            <Counter
              label="OVERDUE"
              count={aggregates.overdue}
              color={
                aggregates.overdue > 0
                  ? "hsl(var(--text-warning))"
                  : "hsl(var(--text-tertiary))"
              }
            />
            <span className="text-text-tertiary">·</span>
            <Counter
              label="DUE TODAY"
              count={aggregates.today}
              color={
                aggregates.today > 0
                  ? "hsl(var(--accent))"
                  : "hsl(var(--text-tertiary))"
              }
            />
          </div>

          {/* Tabs */}
          <TabBar value={tab} onChange={setTab} />

          {/* Filters */}
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <FilterDropdown
              label="DELEGATE"
              value={delegateFilter}
              defaultValue="all"
              options={delegateOptions}
              onChange={setDelegateFilter}
            />
            <FilterDropdown
              label="GOAL"
              value={goalFilter}
              defaultValue="all"
              options={goalOptions}
              onChange={setGoalFilter}
            />
            {tab === "returned" && (
              <FilterDropdown
                label="RANGE"
                value={dateRange}
                defaultValue="all"
                options={DATE_OPTIONS}
                onChange={(v) => setDateRange(v as DateRange)}
              />
            )}
            {anyFilter && (
              <button
                onClick={clearFilters}
                className="ml-1 text-[12px] text-text-tertiary hover:text-text-secondary transition-colors"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>

        <div className="border-t border-border-subtle" />

        {/* List */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {list.length === 0 ? (
            <EmptyState
              tab={tab}
              filtered={anyFilter}
              onClear={clearFilters}
              onCreate={newDelegated}
            />
          ) : (
            list.map((a) => (
              <DelegationRow
                key={a.id}
                action={a}
                goal={goalById.get(a.goalId)}
                project={a.projectId ? projectById.get(a.projectId) : undefined}
                variant={tab}
                onClick={() => openAction(a.id)}
              />
            ))
          )}
        </div>
      </main>
    </div>
  );
};

const EmptyState: React.FC<{
  tab: TabKey;
  filtered: boolean;
  onClear: () => void;
  onCreate: () => void;
}> = ({ tab, filtered, onClear, onCreate }) => {
  if (filtered) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center px-10 py-16">
        <div className="text-[14px] text-text-secondary">
          No delegations match these filters.
        </div>
        <button
          onClick={onClear}
          className="mt-3 text-[13px] transition-colors hover:opacity-80"
          style={{ color: "hsl(var(--accent))" }}
        >
          Clear filters
        </button>
      </div>
    );
  }
  if (tab === "active") {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center px-10 py-16">
        <div className="text-[15px] text-text-primary">Nothing delegated yet.</div>
        <div className="mt-2 text-[13px] text-text-secondary max-w-[420px]">
          When you delegate an action, it appears here. Click "New delegated action"
          or change an existing action's status to Delegated.
        </div>
        <button
          onClick={onCreate}
          className="inline-flex items-center gap-1.5 mt-4 h-9 px-3 rounded-[4px] text-[13px] font-medium text-white transition-colors"
          style={{ background: "hsl(var(--accent))" }}
        >
          <Plus size={14} />
          New delegated action
        </button>
      </div>
    );
  }
  return (
    <div className="h-full flex flex-col items-center justify-center text-center px-10 py-16">
      <div className="text-[15px] text-text-primary">
        No returned delegations in this date range.
      </div>
      <div className="mt-2 text-[13px] text-text-secondary max-w-[420px]">
        Adjust filters or select a wider range to see history.
      </div>
    </div>
  );
};

export default AllDelegated;
