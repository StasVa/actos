import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AppSidebar } from "@/components/AppSidebar";
import { SettingsPanel } from "@/components/SettingsPanel";
import { useStore } from "@/store/useStore";
import { formatHM } from "@/lib/timeStats";
import {
  dateFromYearMonth,
  formatMonthDayTypeDistribution,
  formatMonthLabel,
  formatMonthRelative,
  getMonthSummary,
  getMonthsWithActivity,
} from "@/lib/monthUtils";
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




function rangeStart(value: string): Date | null {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  if (value === "all") return null;
  if (value === "6m") {
    const d = new Date(now);
    d.setMonth(d.getMonth() - 6);
    return d;
  }
  if (value === "12m") {
    const d = new Date(now);
    d.setMonth(d.getMonth() - 12);
    return d;
  }
  if (value === "ytd") return new Date(now.getFullYear(), 0, 1);
  return null;
}

const ReviewsMonths: React.FC = () => {
  const { t } = useTranslation();
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const actions = useStore((s) => s.actions);
  const dayEntries = useStore((s) => s.dayEntries);
  const goals = useStore((s) => s.goals);
  const projects = useStore((s) => s.projects);
  const rituals = useStore((s) => s.rituals);
  const settings = useStore((s) => s.settings);

  const [range, setRange] = React.useState("12m");
  const [goalFilter, setGoalFilter] = React.useState<string>("all");
  const [sortKey, setSortKey] = React.useState<ReviewSortKey>(() => loadReviewSort("actos.reviews.months.sort"));
  React.useEffect(() => saveReviewSort("actos.reviews.months.sort", sortKey), [sortKey]);
  const SORT_OPTIONS = useReviewSortOptions();

  const RANGE_OPTIONS = React.useMemo(() => [
    { value: "12m", label: t("reviews.filters.range.last12m") },
    { value: "6m", label: t("reviews.filters.range.last6m") },
    { value: "ytd", label: t("reviews.filters.range.thisYear") },
    { value: "all", label: t("reviews.filters.range.all") },
  ], [t]);

  const allMonths = React.useMemo(
    () => getMonthsWithActivity(actions, dayEntries),
    [actions, dayEntries],
  );

  const filteredMonths = React.useMemo(() => {
    const cutoff = rangeStart(range);
    const filtered = allMonths.filter((ym) => {
      if (cutoff) {
        const d = dateFromYearMonth(ym);
        if (d && d < cutoff) return false;
      }
      if (goalFilter !== "all") {
        const summary = getMonthSummary(ym, { actions, dayEntries, goals, projects, rituals });
        const has = summary?.doneActions.some((a) => a.goalId === goalFilter);
        if (!has) return false;
      }
      return true;
    });
    const sortable = filtered.map((ym) => {
      const s = getMonthSummary(ym, { actions, dayEntries, goals, projects, rituals });
      const done = s?.doneActions ?? [];
      const delegated = s?.delegatedActions ?? [];
      const periodStart = dateFromYearMonth(ym)?.getTime() ?? 0;
      return {
        item: ym,
        periodStart,
        id: ym,
        createdAt: periodStart,
        aggregates: computeAggregates(done, delegated),
        untracked: !s,
      };
    });
    return sortReviewEntries(sortable, sortKey);
  }, [allMonths, range, goalFilter, actions, dayEntries, goals, projects, rituals, sortKey]);

  const goalById = (id: string) => goals.find((g) => g.id === id);

  return (
    <div className="min-h-screen bg-surface-base text-text-primary">
      <AppSidebar onOpenSettings={() => setSettingsOpen(true)} />
      <SettingsPanel open={settingsOpen} onOpenChange={setSettingsOpen} />
      <main className="app-main page-medium">
        <PageHeader
          title={t("reviews.months.title")}
          meta={t("reviews.months.meta", { count: allMonths.length })}
          filters={
            <>
              <FilterDropdown
                label={t("reviews.filters.label.goal")}
                value={goalFilter}
                defaultValue="all"
                options={[
                  { value: "all", label: t("reviews.filters.all") },
                  ...goals.filter((g) => g.status === "active").map((g) => ({ value: g.id, label: g.title, dot: `hsl(var(--${g.color}))` })),
                ]}
                onChange={setGoalFilter}
              />
              <FilterDropdown label={t("reviews.filters.label.date")} value={range} defaultValue={range} options={RANGE_OPTIONS} onChange={setRange} />
            </>
          }
          sort={<SortDropdown<ReviewSortKey> value={sortKey} options={REVIEW_SORT_OPTIONS} onChange={setSortKey} />}
        />
        <div style={{ height: 24 }} />

        <div className="bg-surface-elevated border border-border-subtle rounded-[6px] overflow-hidden">
          {filteredMonths.length === 0 ? (
            <div className="p-10 text-center">
              <div className="text-[14px] text-text-secondary">
                {allMonths.length === 0
                  ? t("reviews.empty.months")
                  : t("reviews.empty.monthsFiltered")}
              </div>
            </div>
          ) : (
            filteredMonths.map((ym) => {
              const s = getMonthSummary(ym, { actions, dayEntries, goals, projects, rituals });
              if (!s) return null;
              const dayTypeLine = settings.layers.planAndReview
                ? formatMonthDayTypeDistribution(s.dayTypeDistribution)
                : "";
              const ritualConsistent = s.ritualMonth.filter(
                (r) => r.scheduledCount > 0 && r.doneCount === r.scheduledCount,
              ).length;
              return (
                <Link
                  key={ym}
                  to={`/reviews/months/${ym}`}
                  className="block px-6 py-4 border-b border-border-subtle hover:bg-surface-hover transition-colors"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="text-[15px] font-medium text-text-primary">
                      {formatMonthLabel(ym)}
                    </span>
                    <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-tertiary tabular-nums">
                      {formatMonthRelative(ym)}
                    </span>
                  </div>
                  {dayTypeLine && (
                    <div className="mt-1 font-mono text-[12px] text-text-secondary">
                      {dayTypeLine}
                    </div>
                  )}
                  {(() => {
                    const o = getOutcomeSummary(
                      s.doneActions,
                      s.delegatedActions,
                      goals,
                      projects,
                      actions,
                    );
                    return (
                      <div className="mt-1 font-mono text-[12px] text-text-secondary tabular-nums">
                        {o.valueAdded > 0 && (
                          <>
                            <span className="text-text-primary">+{o.valueAdded}</span> {t("reviews.row.valueWord")}
                            <span className="text-text-tertiary"> · </span>
                          </>
                        )}
                        <span className="text-text-primary">{s.doneActions.length}</span> {t("reviews.row.actionsDoneWord")}
                        {ritualConsistent > 0 && (
                          <>
                            <span className="text-text-tertiary"> · </span>
                            <span className="text-text-primary">{ritualConsistent}</span> {t("reviews.row.ritualsConsistent", { count: ritualConsistent })}
                          </>
                        )}
                        {settings.layers.logTime && s.totalTimeMinutes > 0 && (
                          <>
                            <span className="text-text-tertiary"> · </span>
                            <span className="text-text-primary">{formatHM(s.totalTimeMinutes)}</span> {t("reviews.row.investedWord")}
                          </>
                        )}
                      </div>
                    );
                  })()}
                  {settings.layers.logTime &&
                    s.totalTimeMinutes > 0 &&
                    s.perGoalTime.some((p) => p.minutes > 0) && (
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] tabular-nums">
                        {s.perGoalTime
                          .filter((p) => p.minutes > 0)
                          .map((p) => {
                            const g = goalById(p.goalId);
                            return (
                              <span key={p.goalId} className="flex items-center gap-1.5 text-text-secondary">
                                <span
                                  className="w-1.5 h-1.5 rounded-full"
                                  style={{ background: `hsl(var(--${g?.color ?? "goal-1"}))` }}
                                />
                                <span className="text-text-secondary">{g?.title ?? "—"}</span>
                                <span className="text-text-primary">{formatHM(p.minutes)}</span>
                                <span className="text-text-tertiary">· {Math.round(p.percentage)}%</span>
                              </span>
                            );
                          })}
                      </div>
                    )}
                </Link>
              );
            })
          )}
        </div>
        <div className="h-12" />
      </main>
    </div>
  );
};

export default ReviewsMonths;
