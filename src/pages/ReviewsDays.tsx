import React from "react";
import { Link } from "react-router-dom";
import { AppSidebar } from "@/components/AppSidebar";
import { SettingsPanel } from "@/components/SettingsPanel";
import { useStore } from "@/store/useStore";
import { formatHM } from "@/lib/timeStats";
import type { Action, DayEntry, Goal, ID, ISODate, Project } from "@/types";
import { DAY_TYPE_LABELS } from "./Index";
import { getOutcomeSummary } from "@/lib/outcomeUtils";

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

const DayRowItem: React.FC<{ row: DayRow; goals: Goal[]; logTime: boolean; logEnergy: boolean }> = ({
  row,
  goals,
  logTime,
  logEnergy,
}) => {
  const { date, entry, doneActions } = row;
  const ritualsDone =
    entry?.plannedRitualIds?.length != null
      ? Math.min(entry.plannedRitualIds.length, entry.plannedRitualIds.length)
      : 0;
  // Approximate ritual count via plannedRitualIds minus skipped
  const ritualCount = entry
    ? Math.max(0, (entry.plannedRitualIds?.length ?? 0) - (entry.skippedRitualIds?.length ?? 0))
    : 0;
  const totalMin = doneActions.reduce((s, a) => s + (a.timeEstimateMinutes ?? 0), 0);

  const dt = entry?.dayType;
  const noPlan = !entry?.isPlanned && doneActions.length > 0 ? "(no plan)" : null;

  // Per-goal effort
  const perGoal = goals
    .filter((g) => g.status === "active")
    .map((g) => {
      const min = doneActions
        .filter((a) => a.goalId === g.id)
        .reduce((s, a) => s + (a.timeEstimateMinutes ?? 0), 0);
      return { g, min };
    });

  const stats: string[] = [];
  stats.push(`${doneActions.length} actions done`);
  if (ritualCount > 0) stats.push(`${ritualCount} rituals`);
  if (logTime && totalMin > 0) stats.push(`${formatHM(totalMin)} invested`);
  if (logEnergy && entry?.morningEnergyScore != null) {
    const evening = entry.eveningEnergyScore != null ? ` / evening ${entry.eveningEnergyScore}` : "";
    stats.push(`Energy: morning ${entry.morningEnergyScore}${evening}`);
  }
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
  const settings = useStore((s) => s.settings);

  const [dayType, setDayType] = React.useState("all");
  const [goalFilter, setGoalFilter] = React.useState<string>("all");
  const [range, setRange] = React.useState("30");
  const [search, setSearch] = React.useState("");

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
      <main className="ml-[220px] px-8 py-6 max-w-[1100px]">
        <header className="mb-6 flex items-end justify-between gap-4">
          <h1 className="text-[24px] font-medium text-text-primary leading-tight">Days</h1>
          <div className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-tertiary tabular-nums">
            {allRows.length} days{lastActivity && ` · last activity ${relativeLabel(lastActivity)}`}
          </div>
        </header>

        <div className="flex flex-wrap items-center gap-4 mb-3">
          <FilterDD label="Day type" value={dayType} onChange={setDayType} options={DAY_TYPE_FILTERS} />
          <FilterDD
            label="Goal"
            value={goalFilter}
            onChange={setGoalFilter}
            options={[
              { value: "all", label: "All" },
              ...goals
                .filter((g) => g.status === "active")
                .map((g) => ({ value: g.id, label: g.title })),
            ]}
          />
          <FilterDD label="Date range" value={range} onChange={setRange} options={RANGE_OPTIONS.map(({ value, label }) => ({ value, label }))} />
        </div>

        {/* Search removed — global ⌘K palette handles search. */}

        <div className="h-6" />
        <div className="border-t border-border-subtle" />
        <div className="h-6" />

        <div className="bg-surface-elevated border border-border-subtle rounded-[6px] overflow-hidden">
          {filtered.length === 0 ? (
            <div className="p-10 text-center">
              <div className="font-mono text-[11px] text-text-tertiary">
                No days with activity match these filters.
              </div>
              {hasFilters && (
                <button
                  type="button"
                  onClick={() => {
                    setDayType("all");
                    setGoalFilter("all");
                    setRange("30");
                    setSearch("");
                  }}
                  className="mt-3 text-[12px] text-[hsl(var(--accent))] hover:brightness-110"
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
                logTime={settings.layers.logTime}
                logEnergy={settings.layers.logEnergy}
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
