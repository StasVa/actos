import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AppSidebar } from "@/components/AppSidebar";
import { SettingsPanel } from "@/components/SettingsPanel";
import { useStore } from "@/store/useStore";
import { formatHM } from "@/lib/timeStats";
import {
  getWeekSummary,
  getWeeksWithActivity,
  formatWeekLabel,
  formatWeekRelative,
  formatDayTypeDistribution,
  dateFromYearWeek,
} from "@/lib/weekUtils";
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
  if (value === "1m") {
    const d = new Date(now);
    d.setMonth(d.getMonth() - 1);
    return d;
  }
  if (value === "3m") {
    const d = new Date(now);
    d.setMonth(d.getMonth() - 3);
    return d;
  }
  if (value === "6m") {
    const d = new Date(now);
    d.setMonth(d.getMonth() - 6);
    return d;
  }
  if (value === "ytd") return new Date(now.getFullYear(), 0, 1);
  return null;
}

const ReviewsWeeks: React.FC = () => {
  const { t } = useTranslation();
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const actions = useStore((s) => s.actions);
  const dayEntries = useStore((s) => s.dayEntries);
  const goals = useStore((s) => s.goals);
  const projects = useStore((s) => s.projects);
  const rituals = useStore((s) => s.rituals);
  const settings = useStore((s) => s.settings);

  const [range, setRange] = React.useState("3m");
  const [goalFilter, setGoalFilter] = React.useState<string>("all");
  const [sortKey, setSortKey] = React.useState<ReviewSortKey>(() => loadReviewSort("actos.reviews.weeks.sort"));
  React.useEffect(() => saveReviewSort("actos.reviews.weeks.sort", sortKey), [sortKey]);

  const RANGE_OPTIONS = React.useMemo(() => [
    { value: "all", label: t("reviews.filters.range.all") },
    { value: "1m", label: t("reviews.filters.range.lastMonth") },
    { value: "3m", label: t("reviews.filters.range.last3m") },
    { value: "6m", label: t("reviews.filters.range.last6m") },
    { value: "ytd", label: t("reviews.filters.range.thisYear") },
  ], [t]);

  const allWeeks = React.useMemo(
    () => getWeeksWithActivity(actions, dayEntries),
    [actions, dayEntries],
  );

  const filteredWeeks = React.useMemo(() => {
    const cutoff = rangeStart(range);
    const filtered = allWeeks.filter((yw) => {
      if (cutoff) {
        const d = dateFromYearWeek(yw);
        if (d && d < cutoff) return false;
      }
      if (goalFilter !== "all") {
        const summary = getWeekSummary(yw, { actions, dayEntries, goals, projects, rituals });
        const has = summary?.doneActions.some((a) => a.goalId === goalFilter);
        if (!has) return false;
      }
      return true;
    });
    const sortable = filtered.map((yw) => {
      const s = getWeekSummary(yw, { actions, dayEntries, goals, projects, rituals });
      const done = s?.doneActions ?? [];
      const delegated = s?.delegatedActions ?? [];
      const periodStart = dateFromYearWeek(yw)?.getTime() ?? 0;
      return {
        item: yw,
        periodStart,
        id: yw,
        createdAt: periodStart,
        aggregates: computeAggregates(done, delegated),
        untracked: !s,
      };
    });
    return sortReviewEntries(sortable, sortKey);
  }, [allWeeks, range, goalFilter, actions, dayEntries, goals, projects, rituals, sortKey]);

  const goalById = (id: string) => goals.find((g) => g.id === id);

  return (
    <div className="min-h-screen bg-surface-base text-text-primary">
      <AppSidebar onOpenSettings={() => setSettingsOpen(true)} />
      <SettingsPanel open={settingsOpen} onOpenChange={setSettingsOpen} />
      <main className="app-main page-medium">
        <PageHeader
          title={t("reviews.weeks.title")}
          meta={t("reviews.weeks.meta", { count: allWeeks.length })}
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
          {allWeeks.length === 0 ? (
            <div className="text-center text-[14px] text-text-secondary" style={{ paddingTop: 80, paddingBottom: 80 }}>
              {t("reviews.empty.weeks")}
            </div>
          ) : filteredWeeks.length === 0 ? (
            <div className="p-10 text-center">
              <div className="text-[14px] text-text-secondary">{t("reviews.filters.noMatch")}</div>
              <button
                type="button"
                onClick={() => { setRange("all"); setGoalFilter("all"); }}
                className="mt-3 text-[13px] text-text-secondary hover:text-text-primary transition-colors"
              >
                {t("reviews.filters.clear")}
              </button>
            </div>
          ) : (
            filteredWeeks.map((yw) => {
              const s = getWeekSummary(yw, { actions, dayEntries, goals, projects, rituals });
              if (!s) return null;
              const dayTypeLine = settings.layers.planAndReview
                ? formatDayTypeDistribution(s.dayTypeDistribution)
                : "";
              const ritualConsistent = s.ritualWeek.filter(
                (r) => r.scheduledCount > 0 && r.doneCount === r.scheduledCount,
              ).length;
              return (
                <Link
                  key={yw}
                  to={`/reviews/weeks/${yw}`}
                  className="block px-6 py-4 border-b border-border-subtle hover:bg-surface-hover transition-colors"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="text-[15px] font-medium text-text-primary">
                      {formatWeekLabel(yw)}
                    </span>
                    <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-tertiary tabular-nums">
                      {formatWeekRelative(yw)}
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

export default ReviewsWeeks;
