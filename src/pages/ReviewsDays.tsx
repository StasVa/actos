import React from "react";
import { Link } from "react-router-dom";
import { AppSidebar } from "@/components/AppSidebar";
import { SettingsPanel } from "@/components/SettingsPanel";
import { useStore } from "@/store/useStore";
import { formatHM } from "@/lib/timeStats";
import type { Action, DayEntry, Goal, ID, ISODate, Project } from "@/types";
import { DAY_TYPE_LABELS } from "./Index";
import { getOutcomeSummary } from "@/lib/outcomeUtils";
import { PageHeader } from "@/components/PageHeader";
import { FilterDropdown } from "@/components/FilterDropdown";
import { SortDropdown } from "@/components/SortDropdown";
import {
  REVIEW_SORT_OPTIONS,
  ReviewSortKey,
  computeAggregates,
  loadReviewSort,
  saveReviewSort,
  sortReviewEntries,
} from "@/lib/reviewSort";

const TODAY = new Date();
TODAY.setHours(0, 0, 0, 0);

function relativeLabel(iso: ISODate): string {
  const d = new Date(iso + "T00:00:00");
  const days = Math.round((TODAY.getTime() - d.getTime()) / 86400000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function longDate(iso: ISODate): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const DAY_TYPE_TONE: Record<string, string> = {
  execution: "bg-[hsl(var(--accent))]/20 text-[hsl(var(--accent))]",
  recovery: "bg-surface-hover text-text-secondary",
  "day-off": "bg-surface-hover text-text-tertiary",
  sick: "bg-surface-hover text-[hsl(var(--state-stalled))]",
};

interface DayRow {
  date: ISODate;
  entry?: DayEntry;
  doneActions: Action[];
  delegatedActions: Action[];
}

function buildDayRows(
  entries: DayEntry[],
  actions: Action[],
): DayRow[] {
  const dates = new Set<ISODate>();
  for (const e of entries) dates.add(e.date);
  for (const a of actions) {
    if (a.status === "done" && a.completedAt) dates.add(a.completedAt.slice(0, 10));
    if (a.status === "delegated" && a.delegatedAt) dates.add(a.delegatedAt.slice(0, 10));
  }
  const rows: DayRow[] = Array.from(dates).map((date) => {
    const entry = entries.find((e) => e.date === date);
    const doneActions = actions.filter(
      (a) => a.status === "done" && a.completedAt?.slice(0, 10) === date,
    );
    const delegatedActions = actions.filter(
      (a) => a.status === "delegated" && a.delegatedAt?.slice(0, 10) === date,
    );
    return { date, entry, doneActions, delegatedActions };
  });
  rows.sort((a, b) => b.date.localeCompare(a.date));
  return rows;
}

const RANGE_OPTIONS = [
  { value: "30", label: "Last 30 days", days: 30 },
  { value: "7", label: "Last 7 days", days: 7 },
  { value: "90", label: "Last 90 days", days: 90 },
  { value: "all", label: "All time", days: Infinity },
];

const DAY_TYPE_FILTERS = [
  { value: "all", label: "All" },
  { value: "execution", label: "Execution" },
  { value: "recovery", label: "Recovery" },
  { value: "day-off", label: "Day Off" },
  { value: "sick", label: "Sick" },
];

type SortKey = "recent" | "oldest";
const SORT_OPTIONS: FilterOption<SortKey>[] = [
  { value: "recent", label: "Recent first" },
  { value: "oldest", label: "Oldest first" },
];

const DayRowItem: React.FC<{
  row: DayRow;
  goals: Goal[];
  projects: Project[];
  allActions: Action[];
  logTime: boolean;
}> = ({ row, goals, projects, allActions, logTime }) => {
  const { date, entry, doneActions, delegatedActions } = row;
  // Approximate ritual count via plannedRitualIds minus skipped
  const ritualCount = entry
    ? Math.max(0, (entry.plannedRitualIds?.length ?? 0) - (entry.skippedRitualIds?.length ?? 0))
    : 0;
  // Time invested = full Done time + 20% Delegated time.
  const investedMin = (a: Action) => {
    const t = a.timeEstimateMinutes ?? 0;
    if (t <= 0) return 0;
    if (a.status === "done") return t;
    if (a.status === "delegated") return Math.round(t * 0.2);
    return 0;
  };
  const investedAll = [...doneActions, ...delegatedActions];
  const totalMin = investedAll.reduce((s, a) => s + investedMin(a), 0);

  const dt = entry?.dayType;
  const noPlan = !entry?.isPlanned && doneActions.length > 0 ? "(no plan)" : null;

  // Per-goal time invested
  const perGoal = goals
    .filter((g) => g.status === "active")
    .map((g) => {
      const min = investedAll
        .filter((a) => a.goalId === g.id)
        .reduce((s, a) => s + investedMin(a), 0);
      return { g, min };
    });

  const outcome = getOutcomeSummary(doneActions, delegatedActions, goals, projects, allActions);

  const stats: string[] = [];
  if (outcome.valueAdded > 0) stats.push(`+${outcome.valueAdded} value`);
  stats.push(`${doneActions.length} actions done`);
  if (ritualCount > 0) stats.push(`${ritualCount} rituals`);
  if (logTime && totalMin > 0) stats.push(`${formatHM(totalMin)} invested`);
  let mainPrefix = "";
  if (entry?.mainTaskActionId) {
    const main = doneActions.find((a) => a.id === entry.mainTaskActionId);
    mainPrefix = main ? "Main: ✓ Done · " : "Main: ✗ Not completed · ";
  }

  return (
    <Link
      to={`/reviews/days/${date}`}
      className="block px-5 py-4 border-b border-border-subtle hover:bg-surface-hover transition-colors"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[14px] font-medium text-text-primary">{longDate(date)}</span>
          {dt && (
            <span
              className={`font-mono text-[10px] uppercase px-1.5 py-0.5 rounded-[3px] ${DAY_TYPE_TONE[dt] ?? "bg-surface-hover text-text-tertiary"}`}
            >
              {DAY_TYPE_LABELS[dt]}
            </span>
          )}
          {noPlan && (
            <span className="font-mono text-[10px] uppercase text-text-tertiary">{noPlan}</span>
          )}
        </div>
        <span className="font-mono text-[11px] text-text-tertiary tabular-nums">
          {relativeLabel(date)}
        </span>
      </div>
      <div className="mt-1 font-mono text-[12px] text-text-secondary tabular-nums">
        {mainPrefix}
        {stats.join(" · ")}
      </div>
      {logTime && perGoal.some((x) => x.min > 0) && (
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] text-text-tertiary">
          {perGoal.map(({ g, min }) => (
            <span key={g.id} className="flex items-center gap-1">
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: `hsl(var(--${g.color}))` }}
              />
              <span>{g.title}</span>
              <span className="text-text-tertiary">— {min > 0 ? formatHM(min) : "0"}</span>
            </span>
          ))}
        </div>
      )}
    </Link>
  );
};

const ReviewsDays: React.FC = () => {
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const dayEntries = useStore((s) => s.dayEntries);
  const actions = useStore((s) => s.actions);
  const goals = useStore((s) => s.goals);
  const projects = useStore((s) => s.projects);
  const settings = useStore((s) => s.settings);

  const [dayType, setDayType] = React.useState("all");
  const [goalFilter, setGoalFilter] = React.useState<string>("all");
  const [range, setRange] = React.useState("30");
  const [search, setSearch] = React.useState("");
  const [sortKey, setSortKey] = React.useState<SortKey>("recent");

  const allRows = React.useMemo(
    () => buildDayRows(dayEntries, actions),
    [dayEntries, actions],
  );

  const rangeDays = RANGE_OPTIONS.find((r) => r.value === range)?.days ?? 30;
  const cutoff = new Date();
  cutoff.setHours(0, 0, 0, 0);
  cutoff.setDate(cutoff.getDate() - rangeDays);

  const filtered = allRows.filter((r) => {
    if (rangeDays !== Infinity) {
      const d = new Date(r.date + "T00:00:00");
      if (d < cutoff) return false;
    }
    if (dayType !== "all" && r.entry?.dayType !== dayType) return false;
    if (goalFilter !== "all") {
      const has = r.doneActions.some((a) => a.goalId === goalFilter);
      if (!has) return false;
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      const refl = r.entry?.reflectionText?.toLowerCase() ?? "";
      const intent = r.entry?.morningIntentNote?.toLowerCase() ?? "";
      if (!refl.includes(q) && !intent.includes(q)) return false;
    }
    return true;
  });

  const lastActivity = allRows[0]?.date;
  const hasFilters =
    dayType !== "all" || goalFilter !== "all" || range !== "30" || search.trim() !== "";

  return (
    <div className="min-h-screen bg-surface-base text-text-primary">
      <AppSidebar onOpenSettings={() => setSettingsOpen(true)} />
      <SettingsPanel open={settingsOpen} onOpenChange={setSettingsOpen} />
      <main className="app-main page-medium">
        <PageHeader
          title="Days"
          meta={`${allRows.length} DAYS TRACKED`}
          filters={
            <>
              <FilterDropdown label="DAY TYPE" value={dayType} defaultValue="all" options={DAY_TYPE_FILTERS} onChange={setDayType} />
              <FilterDropdown
                label="GOAL"
                value={goalFilter}
                defaultValue="all"
                options={[
                  { value: "all", label: "All" },
                  ...goals.filter((g) => g.status === "active").map((g) => ({
                    value: g.id, label: g.title, dot: `hsl(var(--${g.color}))`,
                  })),
                ]}
                onChange={setGoalFilter}
              />
              <FilterDropdown label="DATE" value={range} defaultValue="30" options={RANGE_OPTIONS.map(({ value, label }) => ({ value, label }))} onChange={setRange} />
            </>
          }
          sort={<SortDropdown<SortKey> value={sortKey} options={SORT_OPTIONS} onChange={setSortKey} />}
        />
        <div style={{ height: 24 }} />

        <div className="bg-surface-elevated border border-border-subtle rounded-[6px] overflow-hidden">
          {allRows.length === 0 ? (
            <div className="text-center text-[14px] text-text-secondary" style={{ paddingTop: 80, paddingBottom: 80 }}>
              No days tracked yet. Days appear here once you plan or close them.
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-10 text-center">
              <div className="text-[14px] text-text-secondary">No items match these filters.</div>
              {hasFilters && (
                <button
                  type="button"
                  onClick={() => {
                    setDayType("all");
                    setGoalFilter("all");
                    setRange("30");
                    setSearch("");
                  }}
                  className="mt-3 text-[13px] text-text-secondary hover:text-text-primary transition-colors"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            filtered.map((row) => (
              <DayRowItem
                key={row.date}
                row={row}
                goals={goals}
                projects={projects}
                allActions={actions}
                logTime={settings.layers.logTime}
              />
            ))
          )}
        </div>
        <div className="h-12" />
      </main>
    </div>
  );
};

export default ReviewsDays;
