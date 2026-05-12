import React from "react";
import { Link } from "react-router-dom";
import { Lock } from "lucide-react";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n";
import { AppSidebar } from "@/components/AppSidebar";
import { SettingsPanel } from "@/components/SettingsPanel";
import { LockModal, HistoryHint } from "@/components/LockModal";
import { useStore } from "@/store/useStore";
import { useProjectsQuery } from "@/lib/queries/useProjects";
import { useGoalsQuery } from "@/lib/queries/useGoals";
import { useActionsQuery } from "@/lib/queries/useActions";
import { useAuth } from "@/lib/useAuth";
import { formatHM } from "@/lib/timeStats";
import type { Action, DayEntry, Goal, ID, ISODate, Project } from "@/types";
import { getOutcomeSummary } from "@/lib/outcomeUtils";
import { PageHeader } from "@/components/PageHeader";
import { FilterDropdown } from "@/components/FilterDropdown";
import { SortDropdown } from "@/components/SortDropdown";
import {
  ReviewSortKey,
  computeAggregates,
  loadReviewSort,
  saveReviewSort,
  sortReviewEntries,
  useReviewSortOptions,
} from "@/lib/reviewSort";

const TODAY = new Date();
TODAY.setHours(0, 0, 0, 0);

const dayTypeKey = (dt?: string): string => {
  switch (dt) {
    case "execution": return "today.dayType.execution";
    case "recovery": return "today.dayType.recovery";
    case "day-off": return "today.dayType.dayOff";
    case "sick": return "today.dayType.sick";
    default: return "";
  }
};

function relativeLabel(iso: ISODate): string {
  const d = new Date(iso + "T00:00:00");
  const days = Math.round((TODAY.getTime() - d.getTime()) / 86400000);
  if (days <= 0) return i18n.t("reviews.relative.today");
  if (days === 1) return i18n.t("reviews.relative.yesterday");
  if (days < 30) return i18n.t("reviews.relative.daysAgo", { count: days });
  return d.toLocaleDateString(i18n.language, { month: "short", day: "numeric" });
}

function longDate(iso: ISODate): string {
  return new Date(iso + "T00:00:00").toLocaleDateString(i18n.language, {
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

type SortKey = ReviewSortKey;

const DayRowItem: React.FC<{
  row: DayRow;
  goals: Goal[];
  projects: Project[];
  allActions: Action[];
  logTime: boolean;
  locked?: boolean;
  onLockedClick?: () => void;
}> = ({ row, goals, projects, allActions, logTime, locked, onLockedClick }) => {
  const { t } = useTranslation();
  const { date, entry, doneActions, delegatedActions } = row;
  const ritualCount = entry
    ? Math.max(0, (entry.plannedRitualIds?.length ?? 0) - (entry.skippedRitualIds?.length ?? 0))
    : 0;
  const investedMin = (a: Action) => {
    const tm = a.timeEstimateMinutes ?? 0;
    if (tm <= 0) return 0;
    if (a.status === "done") return tm;
    if (a.status === "delegated") return Math.round(tm * 0.2);
    return 0;
  };
  const investedAll = [...doneActions, ...delegatedActions];
  const totalMin = investedAll.reduce((s, a) => s + investedMin(a), 0);

  const dt = entry?.dayType;
  const noPlan = !entry?.isPlanned && doneActions.length > 0 ? t("reviews.row.noPlan") : null;

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
  if (outcome.valueAdded > 0) stats.push(t("reviews.row.valueAdded", { count: outcome.valueAdded }));
  stats.push(t("reviews.row.actionsDone", { count: doneActions.length }));
  if (ritualCount > 0) stats.push(t("reviews.row.rituals", { count: ritualCount }));
  if (logTime && totalMin > 0) stats.push(t("reviews.row.invested", { time: formatHM(totalMin) }));
  let mainPrefix = "";
  if (entry?.mainTaskActionId) {
    const main = doneActions.find((a) => a.id === entry.mainTaskActionId);
    mainPrefix = main ? t("reviews.row.mainDone") : t("reviews.row.mainNotCompleted");
  }

  const dtLabelKey = dayTypeKey(dt);

  const inner = (
    <>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[14px] font-medium text-text-primary">{longDate(date)}</span>
          {dt && dtLabelKey && (
            <span
              className={`font-mono text-[10px] uppercase px-1.5 py-0.5 rounded-[3px] ${DAY_TYPE_TONE[dt] ?? "bg-surface-hover text-text-tertiary"}`}
            >
              {t(dtLabelKey)}
            </span>
          )}
          {noPlan && (
            <span className="font-mono text-[10px] uppercase text-text-tertiary">{noPlan}</span>
          )}
        </div>
        <span className="font-mono text-[11px] text-text-tertiary tabular-nums flex items-center gap-2">
          {relativeLabel(date)}
          {locked && <Lock size={14} style={{ color: "hsl(var(--text-tertiary))" }} />}
        </span>
      </div>
      <div
        className="mt-1 font-mono text-[12px] text-text-secondary tabular-nums"
        style={{ opacity: locked ? 0.5 : 1 }}
      >
        {mainPrefix}
        {stats.join(" · ")}
      </div>
      {logTime && perGoal.some((x) => x.min > 0) && (
        <div
          className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] text-text-tertiary"
          style={{ opacity: locked ? 0.5 : 1 }}
        >
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
    </>
  );

  if (locked) {
    return (
      <button
        type="button"
        onClick={onLockedClick}
        className="block w-full text-left px-5 py-4 border-b border-border-subtle hover:bg-surface-hover transition-colors"
      >
        {inner}
      </button>
    );
  }
  return (
    <Link
      to={`/reviews/days/${date}`}
      className="block px-5 py-4 border-b border-border-subtle hover:bg-surface-hover transition-colors"
    >
      {inner}
    </Link>
  );
};

const ReviewsDays: React.FC = () => {
  const { t } = useTranslation();
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [lockOpen, setLockOpen] = React.useState(false);
  const dayEntries = useStore((s) => s.dayEntries);
  const actions = useActionsQuery().data ?? [];
  const goals = useGoalsQuery().data ?? [];
  const projects = useProjectsQuery().data ?? [];
  const settings = useStore((s) => s.settings);
  const { user } = useAuth();
  const isFree = user?.subscriptionTier !== "all-in";

  const [dayType, setDayType] = React.useState("all");
  const [goalFilter, setGoalFilter] = React.useState<string>("all");
  const [range, setRange] = React.useState("30");
  const [search, setSearch] = React.useState("");
  const [sortKey, setSortKey] = React.useState<SortKey>(() => loadReviewSort("actos.reviews.days.sort"));
  React.useEffect(() => saveReviewSort("actos.reviews.days.sort", sortKey), [sortKey]);
  const SORT_OPTIONS = useReviewSortOptions();

  const RANGE_OPTIONS = React.useMemo(() => [
    { value: "30", label: t("reviews.filters.range.last30"), days: 30 },
    { value: "7", label: t("reviews.filters.range.last7"), days: 7 },
    { value: "90", label: t("reviews.filters.range.last90"), days: 90 },
    { value: "all", label: t("reviews.filters.range.allTime"), days: Infinity },
  ], [t]);

  const DAY_TYPE_FILTERS = React.useMemo(() => [
    { value: "all", label: t("reviews.filters.all") },
    { value: "execution", label: t("today.dayType.execution") },
    { value: "recovery", label: t("today.dayType.recovery") },
    { value: "day-off", label: t("today.dayType.dayOff") },
    { value: "sick", label: t("today.dayType.sick") },
  ], [t]);

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

  const sorted = React.useMemo(() => {
    const sortable = filtered.map((r) => {
      const agg = computeAggregates(r.doneActions, r.delegatedActions);
      const untracked = !r.entry && r.doneActions.length === 0 && r.delegatedActions.length === 0;
      const periodStart = new Date(r.date + "T00:00:00").getTime();
      return { item: r, periodStart, id: r.date, createdAt: periodStart, aggregates: agg, untracked };
    });
    return sortReviewEntries(sortable, sortKey);
  }, [filtered, sortKey]);

  const hasFilters =
    dayType !== "all" || goalFilter !== "all" || range !== "30" || search.trim() !== "";

  return (
    <div className="min-h-screen bg-surface-base text-text-primary">
      <AppSidebar onOpenSettings={() => setSettingsOpen(true)} />
      <SettingsPanel open={settingsOpen} onOpenChange={setSettingsOpen} />
      <main className="app-main page-medium">
        <PageHeader
          title={t("reviews.days.title")}
          meta={t("reviews.days.meta", { count: allRows.length })}
          filters={
            <>
              <FilterDropdown label={t("reviews.filters.label.dayType")} value={dayType} defaultValue="all" options={DAY_TYPE_FILTERS} onChange={setDayType} />
              <FilterDropdown
                label={t("reviews.filters.label.goal")}
                value={goalFilter}
                defaultValue="all"
                options={[
                  { value: "all", label: t("reviews.filters.all") },
                  ...goals.filter((g) => g.status === "active").map((g) => ({
                    value: g.id, label: g.title, dot: `hsl(var(--${g.color}))`,
                  })),
                ]}
                onChange={setGoalFilter}
              />
              <FilterDropdown label={t("reviews.filters.label.date")} value={range} defaultValue="30" options={RANGE_OPTIONS.map(({ value, label }) => ({ value, label }))} onChange={setRange} />
            </>
          }
          sort={<SortDropdown<SortKey> value={sortKey} options={SORT_OPTIONS} onChange={setSortKey} />}
        />
        <div style={{ height: 24 }} />

        <div className="bg-surface-elevated border border-border-subtle rounded-[6px] overflow-hidden">
          {allRows.length === 0 ? (
            <div className="text-center text-[14px] text-text-secondary" style={{ paddingTop: 80, paddingBottom: 80 }}>
              {t("reviews.empty.days")}
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-10 text-center">
              <div className="text-[14px] text-text-secondary">{t("reviews.filters.noMatch")}</div>
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
                  {t("reviews.filters.clear")}
                </button>
              )}
            </div>
          ) : (
            sorted.map((row) => {
              const ageDays =
                (Date.now() - new Date(row.date + "T00:00:00").getTime()) / 86400000;
              const locked = isFree && ageDays > 90;
              return (
                <DayRowItem
                  key={row.date}
                  row={row}
                  goals={goals}
                  projects={projects}
                  allActions={actions}
                  logTime={settings.layers.logTime}
                  locked={locked}
                  onLockedClick={() => setLockOpen(true)}
                />
              );
            })
          )}
        </div>
        {isFree && allRows.some((r) => (Date.now() - new Date(r.date + "T00:00:00").getTime()) / 86400000 > 90) && (
          <HistoryHint />
        )}
        <LockModal open={lockOpen} onClose={() => setLockOpen(false)} />
        <div className="h-12" />
      </main>
    </div>
  );
};

export default ReviewsDays;
