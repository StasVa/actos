import React from "react";
import { Link } from "react-router-dom";
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

const RANGE_OPTIONS = [
  { value: "all", label: "All" },
  { value: "1m", label: "Last month" },
  { value: "3m", label: "Last 3 months" },
  { value: "6m", label: "Last 6 months" },
  { value: "ytd", label: "This year" },
];

const FilterDD: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}> = ({ label, value, onChange, options }) => (
  <div className="flex items-center gap-2">
    <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-text-tertiary">
      {label}
    </span>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="bg-surface-hover text-[12px] text-text-primary rounded-[3px] px-2 py-1 outline-none border border-transparent focus:border-border-default"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  </div>
);

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
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const actions = useStore((s) => s.actions);
  const dayEntries = useStore((s) => s.dayEntries);
  const goals = useStore((s) => s.goals);
  const projects = useStore((s) => s.projects);
  const rituals = useStore((s) => s.rituals);
  const settings = useStore((s) => s.settings);

  const [range, setRange] = React.useState("3m");
  const [goalFilter, setGoalFilter] = React.useState<string>("all");

  const allWeeks = React.useMemo(
    () => getWeeksWithActivity(actions, dayEntries),
    [actions, dayEntries],
  );

  const filteredWeeks = React.useMemo(() => {
    const cutoff = rangeStart(range);
    return allWeeks.filter((yw) => {
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
  }, [allWeeks, range, goalFilter, actions, dayEntries, goals, projects, rituals]);

  const goalById = (id: string) => goals.find((g) => g.id === id);

  return (
    <div className="min-h-screen bg-surface-base text-text-primary">
      <AppSidebar onOpenSettings={() => setSettingsOpen(true)} />
      <SettingsPanel open={settingsOpen} onOpenChange={setSettingsOpen} />
      <main className="ml-[220px] px-8 py-6 max-w-[1100px]">
        <header className="mb-6 flex items-end justify-between gap-4">
          <h1 className="text-[24px] font-medium text-text-primary leading-tight">Weeks</h1>
          <div className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-tertiary tabular-nums">
            {allWeeks.length} weeks tracked
          </div>
        </header>

        <div className="flex flex-wrap items-center gap-4 mb-3">
          <FilterDD label="Date range" value={range} onChange={setRange} options={RANGE_OPTIONS} />
          <FilterDD
            label="Goal"
            value={goalFilter}
            onChange={setGoalFilter}
            options={[
              { value: "all", label: "All" },
              ...goals.filter((g) => g.status === "active").map((g) => ({ value: g.id, label: g.title })),
            ]}
          />
        </div>

        <div className="h-6" />
        <div className="border-t border-border-subtle" />
        <div className="h-6" />

        <div className="bg-surface-elevated border border-border-subtle rounded-[6px] overflow-hidden">
          {filteredWeeks.length === 0 ? (
            <div className="p-10 text-center">
              <div className="text-[14px] text-text-secondary">
                {allWeeks.length === 0
                  ? "No tracked weeks yet. Start logging actions and your week summaries will appear here."
                  : "No weeks match these filters."}
              </div>
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
                        {o.outcomeAdded > 0 && (
                          <>
                            <span className="text-text-primary">+{o.outcomeAdded}</span> outcome
                            <span className="text-text-tertiary"> · </span>
                          </>
                        )}
                        <span className="text-text-primary">{s.doneActions.length}</span> actions done
                        {ritualConsistent > 0 && (
                          <>
                            <span className="text-text-tertiary"> · </span>
                            <span className="text-text-primary">{ritualConsistent}</span> rituals consistent
                          </>
                        )}
                        {settings.layers.logTime && s.totalTimeMinutes > 0 && (
                          <>
                            <span className="text-text-tertiary"> · </span>
                            <span className="text-text-primary">{formatHM(s.totalTimeMinutes)}</span> invested
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
