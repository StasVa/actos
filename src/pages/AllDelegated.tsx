import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { AppSidebar } from "@/components/AppSidebar";
import { ReturnDatePill } from "@/components/ReturnDatePill";
import { useIsMobile } from "@/hooks/use-mobile";
import { FilterDropdown, FilterOption } from "@/components/FilterDropdown";
import { SortDropdown } from "@/components/SortDropdown";
import { useStore } from "@/store/useStore";
import { useProjectsQuery } from "@/lib/queries/useProjects";
import { useGoalsQuery } from "@/lib/queries/useGoals";
import { useActionsQuery } from "@/lib/queries/useActions";
import type { Action, Goal, Project } from "@/types";
import { EmptyState as SharedEmptyState, FilteredEmpty } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";

/* ===== helpers ===== */
const TODAY_ISO = "2026-05-05";

function daysBetween(a: string, b: string): number {
  const ta = new Date(a + "T00:00:00.000Z").getTime();
  const tb = new Date(b + "T00:00:00.000Z").getTime();
  return Math.round((ta - tb) / 86400000);
}

function relativeShortKey(iso: string): { key: string; opts?: Record<string, unknown> } {
  const d = daysBetween(iso, TODAY_ISO);
  if (d === 0) return { key: "delegated.return.today" };
  if (d < 0) return { key: "delegated.return.daysAgo", opts: { count: -d } };
  return { key: "delegated.return.inDays", opts: { count: d } };
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
        width: 40,
        textAlign: "center",
        boxSizing: "border-box",
        background: `color-mix(in srgb, ${color}, transparent 85%)`,
        color,
      }}
    >
      I{impact}
    </span>
  ) : null;

const ReturnedPill: React.FC<{ completedAt?: string }> = ({ completedAt }) => {
  const { t } = useTranslation();
  if (!completedAt) return null;
  const iso = completedAt.slice(0, 10);
  const rs = relativeShortKey(iso);
  const label = t(rs.key, rs.opts);
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
      {t("delegated.return.returned", { label })}
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
  const color = goal ? `hsl(var(--${goal.color}))` : "hsl(var(--text-tertiary))";
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div
        onClick={onClick}
        className="relative flex cursor-pointer border-b border-border-subtle hover:bg-surface-hover transition-colors"
        style={{ minHeight: 72 }}
      >
        <span
          className="absolute left-0 top-0 bottom-0"
          style={{ background: color, width: 3 }}
        />
        <div className="flex flex-col gap-1 w-full" style={{ padding: "12px 16px" }}>
          <div className="flex items-center justify-between gap-2">
            <div className="text-[15px] font-medium text-text-primary truncate min-w-0 flex-1">
              {action.title}
            </div>
            <ImpactPill impact={action.impact} color={color} />
          </div>
          <div className="font-mono text-[12px] text-text-secondary tabular-nums truncate flex items-center gap-2">
            <span className="text-text-primary truncate">
              → {action.delegateName ?? "—"}
            </span>
            <span className="text-text-tertiary">·</span>
            {variant === "active" ? (
              <ReturnDatePill expectedReturnDate={action.expectedReturnDate} compact />
            ) : (
              <ReturnedPill completedAt={action.completedAt} />
            )}
          </div>
        </div>
      </div>
    );
  }

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
}) => {
  const { t } = useTranslation();
  return (
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
            {k === "active" ? t("delegated.tab.active") : t("delegated.tab.returned")}
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
};

/* ===== Date range ===== */
type DateRange = "all" | "30" | "90" | "365";
type SortKey = "due" | "delegated" | "impact" | "title";

/* ===== Page ===== */
const AllDelegated: React.FC = () => {
  const { t } = useTranslation();
  const actions = useActionsQuery().data ?? [];
  const goals = useGoalsQuery().data ?? [];
  const projects = useProjectsQuery().data ?? [];
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
  const [sortKey, setSortKey] = useState<SortKey>("due");

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
      { value: "all", label: t("common.all") },
      ...Array.from(set)
        .sort()
        .map((n) => ({ value: n, label: n })),
    ];
  }, [actions, t]);

  const goalOptions = useMemo<FilterOption<string>[]>(
    () => [
      { value: "all", label: t("common.all") },
      ...goals
        .filter((g) => g.status === "active")
        .map((g) => ({ value: g.id, label: g.title, dot: g.color })),
    ],
    [goals, t],
  );

  const dateOptions: FilterOption<DateRange>[] = useMemo(() => [
    { value: "all", label: t("delegated.filter.dateAllTime") },
    { value: "30", label: t("delegated.filter.dateLast30") },
    { value: "90", label: t("delegated.filter.dateLast90") },
    { value: "365", label: t("delegated.filter.dateLastYear") },
  ], [t]);

  const activeSortOptions: FilterOption<SortKey>[] = useMemo(() => [
    { value: "due", label: t("delegated.sort.due") },
    { value: "delegated", label: t("delegated.sort.delegatedActive") },
    { value: "impact", label: t("delegated.sort.impact") },
    { value: "title", label: t("delegated.sort.title") },
  ], [t]);

  const returnedSortOptions: FilterOption<SortKey>[] = useMemo(() => [
    { value: "delegated", label: t("delegated.sort.delegatedReturned") },
    { value: "impact", label: t("delegated.sort.impact") },
    { value: "title", label: t("delegated.sort.title") },
  ], [t]);

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

  const sortFn = (a: Action, b: Action) => {
    switch (sortKey) {
      case "impact":
        return (b.impact ?? 0) - (a.impact ?? 0);
      case "title":
        return a.title.localeCompare(b.title);
      case "delegated": {
        const ta = a.delegatedAt ?? a.completedAt ?? "";
        const tb = b.delegatedAt ?? b.completedAt ?? "";
        return tb.localeCompare(ta);
      }
      case "due":
      default: {
        const da = a.expectedReturnDate
          ? daysBetween(a.expectedReturnDate, TODAY_ISO)
          : Number.POSITIVE_INFINITY;
        const db = b.expectedReturnDate
          ? daysBetween(b.expectedReturnDate, TODAY_ISO)
          : Number.POSITIVE_INFINITY;
        return da - db;
      }
    }
  };

  const activeList = useMemo(() => {
    return applyFilters(allActive, false).sort(sortFn);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allActive, delegateFilter, goalFilter, sortKey]);

  const returnedList = useMemo(() => {
    return applyFilters(allReturned, true).sort((a, b) => {
      if (sortKey === "due") {
        const ta = a.completedAt ?? "";
        const tb = b.completedAt ?? "";
        return tb.localeCompare(ta);
      }
      return sortFn(a, b);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allReturned, delegateFilter, goalFilter, dateRange, sortKey]);

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
    setSortKey("due");
  };
  const anyFilter =
    delegateFilter !== "all" ||
    goalFilter !== "all" ||
    (tab === "returned" && dateRange !== "all");

  const metaLine = (
    <>
      <span>{t("delegated.meta.active", { count: aggregates.active })}</span>
      <span className="mx-1.5">·</span>
      <span style={{ color: aggregates.overdue > 0 ? "hsl(var(--text-warning))" : undefined }}>
        {t("delegated.meta.overdue", { count: aggregates.overdue })}
      </span>
      <span className="mx-1.5">·</span>
      <span style={{ color: aggregates.today > 0 ? "hsl(var(--accent))" : undefined }}>
        {t("delegated.meta.dueToday", { count: aggregates.today })}
      </span>
    </>
  );

  return (
    <div className="min-h-screen bg-surface-base text-text-primary">
      <AppSidebar />
      <main className="app-main page-medium flex flex-col h-screen">
        <div className="px-4 md:px-10 pt-6 pb-4 shrink-0">
          <PageHeader
            title={t("delegated.page.title")}
            meta={metaLine}
            cta={{
              label: t("delegated.actions.create.cta"),
              onClick: newDelegated,
              ariaLabel: t("delegated.actions.create.aria"),
            }}
            belowMeta={<TabBar value={tab} onChange={setTab} />}
            filters={
              <>
                <FilterDropdown
                  label={t("delegated.filter.delegate")}
                  value={delegateFilter}
                  defaultValue="all"
                  options={delegateOptions}
                  onChange={setDelegateFilter}
                />
                <FilterDropdown
                  label={t("delegated.filter.goal")}
                  value={goalFilter}
                  defaultValue="all"
                  options={goalOptions}
                  onChange={setGoalFilter}
                />
                {tab === "returned" && (
                  <FilterDropdown
                    label={t("delegated.filter.date")}
                    value={dateRange}
                    defaultValue="all"
                    options={dateOptions}
                    onChange={(v) => setDateRange(v as DateRange)}
                  />
                )}
                {anyFilter && (
                  <button
                    onClick={clearFilters}
                    className="ml-1 text-[12px] text-text-tertiary hover:text-text-secondary transition-colors shrink-0"
                  >
                    {t("common.clearFilters")}
                  </button>
                )}
              </>
            }
            sort={
              <SortDropdown<SortKey>
                value={sortKey}
                options={tab === "active" ? activeSortOptions : returnedSortOptions}
                onChange={setSortKey}
              />
            }
          />
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {(tab === "active" ? allActive.length === 0 : allReturned.length === 0) ? (
            tab === "active" ? (
              <SharedEmptyState
                headline={t("delegated.empty.active.heading")}
                description={t("delegated.empty.active.body")}
                ctaLabel={t("delegated.actions.create")}
                onCta={newDelegated}
              />
            ) : (
              <SharedEmptyState
                headline={t("delegated.empty.returned.heading")}
                description={t("delegated.empty.returned.body")}
              />
            )
          ) : list.length === 0 ? (
            <FilteredEmpty onClear={clearFilters} />
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


export default AllDelegated;
