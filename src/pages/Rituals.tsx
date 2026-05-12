import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n";
import { LifetimeCounters } from "@/components/LifetimeCounters";
import { Link, useNavigate } from "react-router-dom";
import { Tooltip } from "@/components/Tooltip";
import { useStore } from "@/store/useStore";
import { useGoalsQuery } from "@/lib/queries/useGoals";
import { toast } from "sonner";
import { AppSidebar } from "@/components/AppSidebar";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { FilterDropdown, FilterOption } from "@/components/FilterDropdown";
import { SortDropdown } from "@/components/SortDropdown";

const G1 = "hsl(var(--goal-1))";
const G2 = "hsl(var(--goal-2))";
const G3 = "hsl(var(--goal-3))";
/* ===== Visual row shape (rendering layer; built from the store) ===== */
type RitualRow = {
  id: string;
  title: string;
  goalName: string;
  goalColor: string;
  scheduleLabel: string;
  scheduleShort: string;
  multiplier: string;
  totalCompletions: number;
  pendingToday: boolean;
  notDueToday?: boolean;
  lastDoneLabel: string;
  consistency: number[]; // 30 entries (0/1)
  frequency: number[]; // 12 entries
  freqMax: number;
  isMonthly: boolean;
  archived?: boolean;
  archivedAgoLabel?: string;
};

/* Date helpers for tooltips */
function dayLabel(daysFromToday: number): string {
  const t = i18n.t.bind(i18n);
  if (daysFromToday === 0) return t("rituals.relDay.today");
  if (daysFromToday === 1) return t("rituals.relDay.yesterday");
  const d = new Date();
  d.setDate(d.getDate() - daysFromToday);
  return d.toLocaleDateString(i18n.language, { month: "short", day: "numeric" });
}
function weekLabel(weeksFromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() - weeksFromNow * 7);
  const day = d.getDay();
  const diff = (day + 6) % 7;
  d.setDate(d.getDate() - diff);
  const md = d.toLocaleDateString(i18n.language, { month: "short", day: "numeric" });
  return i18n.t("reviews.detail.weekLabel", { start: md, end: "" }).replace(/\s*[—–-]\s*$/, "").trim() || `Week of ${md}`;
}
function monthLabel(monthsFromNow: number): string {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - monthsFromNow);
  return d.toLocaleDateString(i18n.language, { month: "short", year: "numeric" });
}


/* ===== Charts ===== */
const ConsistencyCalendar: React.FC<{ data: number[]; color: string; cellSize?: number }> = ({
  data,
  color,
  cellSize = 12,
}) => {
  const { t } = useTranslation();
  const last = data.length - 1;
  return (
    <div className="flex items-center gap-[2px]">
      {data.map((v, i) => {
        const daysFromToday = last - i;
        const status =
          daysFromToday === 0 && v === 0
            ? t("rituals.tip.pending")
            : v === 1
            ? t("rituals.tip.done")
            : t("rituals.tip.missed");
        const tip = (
          <div className="text-[12px] text-text-primary" style={{ fontFamily: "Inter, sans-serif" }}>
            {dayLabel(daysFromToday)} · <span className="font-mono text-text-secondary">{status}</span>
          </div>
        );
        return (
          <Tooltip key={i} content={tip}>
            <span
              className="inline-block hover:brightness-[1.15]"
              style={{
                width: cellSize,
                height: cellSize,
                borderRadius: 2,
                background: v === 1 ? color : "hsl(var(--surface-hover))",
                border: v === 1 ? "none" : "1px solid hsl(var(--border-subtle))",
                boxSizing: "border-box",
                transition: "filter 80ms ease",
              }}
            />
          </Tooltip>
        );
      })}
    </div>
  );
};

/* 90-day calendar in 3 rows of 30 (for monthly rituals) */
const MonthlyConsistency: React.FC<{ data: number[]; color: string }> = ({ data, color }) => {
  const { t } = useTranslation();
  const last = data.length - 1;
  const rows = [data.slice(0, 30), data.slice(30, 60), data.slice(60, 90)];
  return (
    <div className="flex flex-col" style={{ gap: 4 }}>
      {rows.map((row, rIdx) => (
        <div key={rIdx} className="flex items-center gap-[2px]">
          {row.map((v, i) => {
            const idx = rIdx * 30 + i;
            const daysFromToday = last - idx;
            const status =
              daysFromToday === 0 && v === 0
                ? t("rituals.tip.pending")
                : v === 1
                ? t("rituals.tip.done")
                : t("rituals.tip.missed");
            const tip = (
              <div className="text-[12px] text-text-primary" style={{ fontFamily: "Inter, sans-serif" }}>
                {dayLabel(daysFromToday)} ·{" "}
                <span className="font-mono text-text-secondary">{status}</span>
              </div>
            );
            return (
              <Tooltip key={i} content={tip}>
                <span
                  className="inline-block hover:brightness-[1.15]"
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 1,
                    background: v === 1 ? color : "hsl(var(--surface-hover))",
                    border: v === 1 ? "none" : "1px solid hsl(var(--border-subtle))",
                    boxSizing: "border-box",
                    transition: "filter 80ms ease",
                  }}
                />
              </Tooltip>
            );
          })}
        </div>
      ))}
    </div>
  );
};

const FrequencyChart: React.FC<{ data: number[]; max: number; color: string; unit?: "week" | "month" }> = ({ data, max, color, unit = "week" }) => {
  const { t } = useTranslation();
  return (
    <div className="w-full flex items-end gap-[3px]" style={{ height: 44 }}>
      {data.map((v, i) => {
        const stepsFromNow = data.length - 1 - i;
        const h = max === 0 ? 0 : Math.round((v / max) * 44);
        const tip = (
          <div className="text-[12px] text-text-primary" style={{ fontFamily: "Inter, sans-serif" }}>
            {unit === "month" ? monthLabel(stepsFromNow) : weekLabel(stepsFromNow)} ·{" "}
            <span className="font-mono text-text-secondary">
              {v === 0 ? t("rituals.consistency.noCompletions") : t("rituals.consistency.done", { count: v })}
            </span>
          </div>
        );
        return (
          <Tooltip key={i} content={tip} className="flex-1 h-full flex items-end">
            <div
              className="w-full hover:brightness-[1.15]"
              style={{
                height: Math.max(h, v === 0 ? 0 : 2),
                background: v === 0 ? "transparent" : color,
                borderTopLeftRadius: 1,
                borderTopRightRadius: 1,
                transition: "filter 80ms ease",
              }}
            />
          </Tooltip>
        );
      })}
    </div>
  );
};

/* ===== Ritual card ===== */
const RitualCard: React.FC<{ r: RitualRow; onOpen: (r: RitualRow) => void; onMarkDone: (r: RitualRow) => void }> = ({ r, onOpen, onMarkDone }) => {
  const { t } = useTranslation();
  const isMonthly = r.isMonthly;
  return (
    <div
      onClick={() => onOpen(r)}
      className="rounded-[6px] bg-surface-raised border border-border-subtle hover:border-accent hover:bg-surface-hover transition-colors cursor-pointer p-5 flex flex-col"
      style={{ minHeight: 240 }}
    >
      {/* Header */}
      <div className="flex justify-between items-start gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: r.goalColor }} />
            <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-text-tertiary truncate">
              {r.goalName}
            </span>
          </div>
          <div className="mt-1 text-[16px] font-medium text-text-primary leading-tight">{r.title}</div>
          <div className="mt-1 font-mono text-[11px] uppercase tracking-[0.06em] text-text-secondary">
            {r.scheduleLabel}
          </div>
        </div>
        <div className="flex flex-col items-end shrink-0">
          <div className="font-mono font-medium text-text-primary tabular-nums" style={{ fontSize: 22 }}>
            {r.multiplier}
          </div>
          <div className="mt-1 font-mono text-[11px] text-text-tertiary tabular-nums">
            {t("rituals.completions", { count: r.totalCompletions })}
          </div>
        </div>
      </div>

      <div style={{ height: 20 }} />

      {/* Chart 1 */}
      <div>
        <div className="font-mono text-[10px] uppercase tracking-[0.06em] text-text-tertiary mb-1">
          {t("rituals.card.consistencyHeading")}
        </div>
        <ConsistencyCalendar data={r.consistency} color={r.goalColor} />
      </div>

      <div style={{ height: 12 }} />

      {/* Chart 2 */}
      <div>
        <div className="flex items-baseline justify-between mb-1">
          <div className="font-mono text-[10px] uppercase tracking-[0.06em] text-text-tertiary">
            {t("rituals.card.frequencyHeading")}
          </div>
          <div className="font-mono text-[9px] text-text-tertiary">{t("rituals.card.frequencyMax", { n: r.freqMax })}</div>
        </div>
        <FrequencyChart data={r.frequency} max={r.freqMax} color={r.goalColor} />
      </div>

      <div className="flex-1" style={{ minHeight: 20 }} />

      {/* Footer */}
      <div className="flex items-center justify-between mt-2">
        <div className="font-mono text-[11px] text-text-secondary tabular-nums">
          {t("rituals.card.lastDone", { label: r.lastDoneLabel })}
        </div>
        {r.pendingToday ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onMarkDone(r);
            }}
            className="px-3 py-1 rounded-[4px] border border-accent bg-transparent text-[12px] font-medium text-text-primary hover:bg-surface-hover transition-colors"
          >
            {t("rituals.card.markTodayDone")}
          </button>
        ) : isMonthly ? null : (
          <span className="font-mono text-[11px] text-text-tertiary">{t("rituals.notDueToday")}</span>
        )}
      </div>

      {isMonthly && r.pendingToday && (
        <div className="mt-1 font-mono text-[11px] uppercase tracking-[0.06em] text-text-tertiary tabular-nums">
          {t("rituals.card.dueThisMonth")}
        </div>
      )}
    </div>
  );
};

/* ===== Pending today list ===== */
const PendingToday: React.FC<{ items: RitualRow[]; onMarkDone: (r: RitualRow) => void; onOpen: (r: RitualRow) => void }> = ({ items, onMarkDone, onOpen }) => {
  const { t } = useTranslation();
  return (
  <section>
    <div className="text-[12px] font-medium uppercase tracking-[0.08em] text-text-secondary mb-3">
      {t("rituals.section.pendingToday", { count: items.length })}
    </div>
    <div className="rounded-[4px] overflow-hidden border border-border-subtle">
      {items.map((r, i) => (
        <div
          key={r.id}
          onClick={() => onOpen(r)}
          className={`flex items-center gap-3 pr-3 hover:bg-surface-hover transition-colors cursor-pointer ${
            i > 0 ? "border-t border-border-subtle" : ""
          }`}
          style={{ height: 36, padding: "8px 12px" }}
        >
          <span
            className="self-stretch shrink-0 -ml-3"
            style={{ width: 3, background: r.goalColor }}
          />
          <span
            className="inline-block rounded-[2px] border border-text-tertiary shrink-0"
            style={{ width: 16, height: 16 }}
          />
          <span className="text-[13px] font-medium text-text-primary">{r.title}</span>
          <span className="text-[12px] text-text-secondary">· {r.scheduleShort}</span>
          <div className="flex-1" />
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onMarkDone(r);
            }}
            className="text-[12px] text-text-secondary hover:text-text-primary"
          >
            {t("common.markDone")}
          </button>
        </div>
      ))}
    </div>
  </section>
  );
};

/* ===== Top stats (live) ===== */
const TopStats: React.FC<{ rows: RitualRow[]; allTime: number; activeCount: number; pendingCount: number; dueCount: number }> = ({ rows, allTime, activeCount, pendingCount, dueCount }) => {
  const { t } = useTranslation();
  // Week consistency: across all active daily/weekly rituals, fraction of "due" days hit in last 7.
  const weekDone = rows.reduce((sum, r) => sum + r.consistency.slice(-7).reduce((a, b) => a + b, 0), 0);
  const weekDue = rows.length * 7;
  const weekPct = weekDue > 0 ? Math.round((weekDone / weekDue) * 100) : 0;
  const stats = [
    { key: "active", label: t("rituals.stat.active.label"), value: `${activeCount}`, sub: activeCount === 1 ? t("rituals.stat.active.subOne") : t("rituals.stat.active.subOther") },
    { key: "pending", label: t("rituals.stat.pendingToday.label"), value: `${pendingCount}`, sub: t("rituals.stat.pendingToday.sub", { due: dueCount }) },
    { key: "week", label: t("rituals.stat.weekConsistency.label"), value: `${weekPct}%`, sub: t("rituals.stat.weekConsistency.sub", { done: weekDone, due: weekDue }) },
    { key: "alltime", label: t("rituals.stat.allTime.label"), value: `${allTime}`, sub: t("rituals.stat.allTime.sub") },
  ];
  return (
    <div
      className="bg-surface-elevated border border-border-subtle rounded-[6px] grid grid-cols-2 md:grid-cols-4 divide-x divide-border-subtle"
      style={{ minHeight: 88 }}
    >
      {stats.map((s) => (
        <div key={s.key} style={{ padding: "20px 24px" }}>
          <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-text-tertiary">
            {s.label}
          </div>
          <div style={{ height: 8 }} />
          <div className="font-mono font-medium text-text-primary tabular-nums" style={{ fontSize: 28, lineHeight: 1 }}>
            {s.value}
          </div>
          <div style={{ height: 4 }} />
          <div className="font-mono text-[10px] text-text-tertiary">{s.sub}</div>
        </div>
      ))}
    </div>
  );
};

/* ===== Archived (live) ===== */
const ArchivedSection: React.FC<{ rows: RitualRow[]; onRestore: (id: string) => void }> = ({ rows, onRestore }) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  if (rows.length === 0) return null;
  return (
    <section>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-[12px] font-medium uppercase tracking-[0.08em] text-text-tertiary hover:text-text-secondary cursor-pointer"
      >
        {open ? "▾" : "▸"} {t("rituals.section.archived", { count: rows.length })}
      </button>
      {open && (
        <div className="mt-3 rounded-[4px] overflow-hidden border border-border-subtle">
          {rows.map((r, i) => (
            <div
              key={r.id}
              className={`flex items-center gap-3 pr-3 hover:bg-surface-hover transition-colors ${i > 0 ? "border-t border-border-subtle" : ""}`}
              style={{ height: 36, padding: "8px 12px" }}
            >
              <span
                className="self-stretch shrink-0 -ml-3"
                style={{ width: 3, background: "hsl(var(--state-stalled))" }}
              />
              <span className="text-[13px] text-text-tertiary">{r.title}</span>
              <span className="font-mono text-[11px] text-text-tertiary">
                {t("rituals.archivedRow.body", { schedule: r.scheduleLabel, count: r.totalCompletions })}
                {r.archivedAgoLabel ? t("rituals.archivedSuffix", { ago: r.archivedAgoLabel }) : ""}
              </span>
              <div className="flex-1" />
              <button
                type="button"
                onClick={() => onRestore(r.id)}
                className="text-[12px] text-text-tertiary hover:text-text-secondary"
              >
                {t("common.restore")}
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

/* ===== Helpers: derive RitualRow from store ===== */
const TODAY_ISO = new Date().toISOString().slice(0, 10);

function isMonthlyRitual(schedule: string): boolean {
  return schedule === "monthly";
}

function ritualDueToday(schedule: string, scheduleConfig?: import("@/types").RitualScheduleConfig): boolean {
  const dow = new Date().getDay(); // 0=Sun
  switch (schedule) {
    case "daily": return true;
    case "weekdays": return dow >= 1 && dow <= 5;
    case "weekly": {
      const target = scheduleConfig?.weekday;
      return target === undefined ? true : target === dow;
    }
    case "monthly": {
      const target = scheduleConfig?.monthDay ?? 1;
      return new Date().getDate() === target;
    }
    case "custom": {
      const days = scheduleConfig?.customDays;
      return days && days.length > 0 ? days.includes(dow) : true;
    }
    default: return true;
  }
}

function multLabel(total: number): string {
  if (total < 3) return "×1.00";
  if (total < 7) return "×1.10";
  if (total < 14) return "×1.25";
  if (total < 30) return "×1.50";
  if (total < 60) return "×1.75";
  if (total < 100) return "×2.00";
  return "×2.50";
}

function buildConsistency(history: { date: string }[], days = 30): number[] {
  const set = new Set(history.map((h) => h.date));
  const arr: number[] = [];
  const base = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(base);
    d.setDate(base.getDate() - i);
    arr.push(set.has(d.toISOString().slice(0, 10)) ? 1 : 0);
  }
  return arr;
}

function buildFrequency(history: { date: string }[], unit: "week" | "month", buckets: number): number[] {
  const arr = new Array(buckets).fill(0);
  const now = new Date();
  for (const h of history) {
    const d = new Date(h.date);
    let stepsAgo: number;
    if (unit === "week") {
      stepsAgo = Math.floor((now.getTime() - d.getTime()) / (7 * 86400000));
    } else {
      stepsAgo = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
    }
    if (stepsAgo >= 0 && stepsAgo < buckets) {
      arr[buckets - 1 - stepsAgo] += 1;
    }
  }
  return arr;
}

function lastDoneLabel(history: { date: string }[]): string {
  const t = i18n.t.bind(i18n);
  if (history.length === 0) return t("rituals.lastDone.never");
  const sorted = [...history].sort((a, b) => b.date.localeCompare(a.date));
  const last = sorted[0].date;
  if (last === TODAY_ISO) return t("rituals.lastDone.today");
  const yest = new Date();
  yest.setDate(yest.getDate() - 1);
  if (last === yest.toISOString().slice(0, 10)) return t("rituals.lastDone.yesterday");
  const d = new Date(last);
  return d.toLocaleDateString(i18n.language, { month: "short", day: "numeric" });
}

function archivedAgoLabel(iso?: string): string | undefined {
  if (!iso) return undefined;
  const t = i18n.t.bind(i18n);
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days < 7) return t("rituals.archivedAgo.daysAgo", { n: days });
  if (days < 30) return t("rituals.archivedAgo.weeksAgo", { n: Math.round(days / 7) });
  return t("rituals.archivedAgo.monthsAgo", { n: Math.round(days / 30) });
}

function buildRitualRow(
  r: import("@/types").Ritual,
  goalsById: Record<string, import("@/types").Goal>,
): RitualRow {
  const goal = goalsById[r.goalId];
  const goalColor = goal ? `hsl(var(--${goal.color}))` : "hsl(var(--text-tertiary))";
  const goalName = goal?.title ?? "—";
  const monthly = isMonthlyRitual(r.schedule);
  const consistency = monthly
    ? new Array(30).fill(0).concat()
    : buildConsistency(r.completionHistory, 30);
  const frequency = monthly
    ? buildFrequency(r.completionHistory, "month", 12)
    : buildFrequency(r.completionHistory, "week", 12);
  const freqMax = Math.max(1, ...frequency);
  const doneToday = r.completionHistory.some((c) => c.date === TODAY_ISO);
  const dueToday = ritualDueToday(r.schedule, r.scheduleConfig);
  const scheduleLabel = (() => {
    const t = i18n.t.bind(i18n);
    const dayKeys = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
    const dayName = (idx: number) => t(`rituals.weekday.${dayKeys[idx]}`);
    if (r.schedule === "weekly") {
      const base = t("rituals.scheduleLabel.weekly");
      if (r.scheduleConfig?.weekday !== undefined) {
        return t("rituals.scheduleLabel.weeklyOn", { day: dayName(r.scheduleConfig.weekday) });
      }
      return base;
    }
    if (r.schedule === "custom") {
      if (r.scheduleConfig?.customDays?.length) {
        return t("rituals.scheduleLabel.customOn", { days: r.scheduleConfig.customDays.map(dayName).join(" ") });
      }
      return t("rituals.scheduleLabel.custom");
    }
    if (r.schedule === "monthly") {
      const day = r.scheduleConfig?.monthDay ?? 1;
      return t("rituals.scheduleLabel.monthlyDay", { n: day });
    }
    if (r.schedule === "daily") return t("rituals.scheduleLabel.daily");
    if (r.schedule === "weekdays") return t("rituals.scheduleLabel.weekdays");
    return String(r.schedule).toUpperCase();
  })();
  return {
    id: r.id,
    title: r.title,
    goalName,
    goalColor,
    scheduleLabel,
    scheduleShort: r.schedule,
    multiplier: multLabel(r.totalCompletions),
    totalCompletions: r.totalCompletions,
    pendingToday: dueToday && !doneToday,
    notDueToday: !dueToday,
    lastDoneLabel: lastDoneLabel(r.completionHistory),
    consistency,
    frequency,
    freqMax,
    isMonthly: monthly,
    archived: r.status === "archived",
    archivedAgoLabel: archivedAgoLabel(r.archivedAt),
  };
}

/* ===== Page ===== */
type RStateFilter = "all" | "active" | "archived";
type RSortKey = "recent" | "title" | "completions";
function useRStateOptions(): FilterOption<RStateFilter>[] {
  const { t } = useTranslation();
  return [
    { value: "all", label: t("common.all") },
    { value: "active", label: t("common.state.active") },
    { value: "archived", label: t("common.state.archived") },
  ];
}
function useRSortOptions(): FilterOption<RSortKey>[] {
  const { t } = useTranslation();
  return [
    { value: "recent", label: t("common.sort.recentActivity") },
    { value: "title", label: t("common.sort.byTitle") },
    { value: "completions", label: t("common.sort.mostCompletions") },
  ];
}

const Rituals: React.FC = () => {
  const { t } = useTranslation();
  const storeRituals = useStore((s) => s.rituals);
  const { data: storeGoalsData, isLoading: goalsLoading } = useGoalsQuery();
  const storeGoals = storeGoalsData ?? [];
  const openPanel = useStore((s) => s.openPanel);
  const markRitualInstanceDone = useStore((s) => s.markRitualInstanceDone);
  const restoreRitual = useStore((s) => s.restoreRitual);

  const [stateFilter, setStateFilter] = useState<RStateFilter>("all");
  const [goalFilter, setGoalFilter] = useState<string>("all");
  const [sortKey, setSortKey] = useState<RSortKey>("recent");
  const stateOptions = useRStateOptions();
  const sortOptions = useRSortOptions();

  const goalsById = React.useMemo(() => {
    const m: Record<string, import("@/types").Goal> = {};
    for (const g of storeGoals) m[g.id] = g;
    return m;
  }, [storeGoals]);

  const matchesGoal = (rGoalId: string) => goalFilter === "all" || rGoalId === goalFilter;

  const activeRows = React.useMemo(
    () =>
      storeRituals
        .filter((r) => r.status === "active" && matchesGoal(r.goalId))
        .map((r) => buildRitualRow(r, goalsById)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [storeRituals, goalsById, goalFilter],
  );
  const archivedRows = React.useMemo(
    () =>
      storeRituals
        .filter((r) => r.status === "archived" && matchesGoal(r.goalId))
        .map((r) => buildRitualRow(r, goalsById)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [storeRituals, goalsById, goalFilter],
  );

  const totalRituals = storeRituals.length;
  const totalActive = storeRituals.filter((r) => r.status === "active").length;
  const totalArchived = storeRituals.filter((r) => r.status === "archived").length;

  const pending = activeRows.filter((r) => r.pendingToday);
  const dueCount = activeRows.filter((r) => !r.notDueToday).length;
  const allTime = storeRituals.reduce((s, r) => s + r.totalCompletions, 0);

  const handleOpen = (r: RitualRow) => {
    openPanel({ kind: "ritual", mode: "edit", id: r.id });
  };

  const navigate = useNavigate();
  const hasActiveGoals = storeGoals.some((g) => g.status === "active");

  const handleAddRitual = () => {
    if (!hasActiveGoals) { navigate("/onboarding/goal"); return; }
    openPanel({
      kind: "ritual",
      mode: "new",
      prefill: { goalId: storeGoals.find((g) => g.status === "active")?.id },
    });
  };

  const handleMarkDone = (r: RitualRow) => {
    const match = storeRituals.find((sr) => sr.id === r.id);
    if (!match) return;
    if (match.completionHistory.some((c) => c.date === TODAY_ISO)) {
      toast(t("rituals.toast.alreadyLogged"));
      return;
    }
    markRitualInstanceDone(match.id);
    toast.success(t("rituals.toast.logged", { count: match.totalCompletions + 1 }));
  };

  const handleRestore = (id: string) => {
    restoreRitual(id);
    toast.success(t("rituals.toast.restored"));
  };

  const goalOptions: FilterOption<string>[] = [
    { value: "all", label: t("common.all") },
    ...storeGoals
      .filter((g) => g.status === "active")
      .map((g) => ({ value: g.id, label: g.title, dot: `hsl(var(--${g.color}))` })),
  ];

  const sortRows = (rows: RitualRow[]) => {
    const arr = [...rows];
    arr.sort((a, b) => {
      if (sortKey === "title") return a.title.localeCompare(b.title);
      if (sortKey === "completions") return b.totalCompletions - a.totalCompletions;
      return 0;
    });
    return arr;
  };

  const showActive = stateFilter !== "archived";
  const showArchived = stateFilter !== "active";
  const sortedActiveRows = sortRows(activeRows);
  const sortedArchivedRows = sortRows(archivedRows);

  return (
    <div className="min-h-screen bg-surface-base text-text-primary">
      <AppSidebar />
      <main className="app-main page-medium">
        <PageHeader
          title={t("rituals.page.title")}
          meta={t("rituals.meta", { total: totalRituals, active: totalActive, archived: totalArchived })}
          cta={{
            label: t("rituals.newRitual"),
            onClick: handleAddRitual,
            ariaLabel: t("rituals.aria.newRitual"),
            disabled: !hasActiveGoals,
            disabledTooltip: t("rituals.disabledTooltip"),
          }}
          filters={
            <>
              <FilterDropdown<RStateFilter>
                label={t("common.label.state")}
                value={stateFilter}
                defaultValue="all"
                options={stateOptions}
                onChange={setStateFilter}
              />
              <FilterDropdown<string>
                label={t("common.label.goal")}
                value={goalFilter}
                defaultValue="all"
                options={goalOptions}
                onChange={setGoalFilter}
              />
            </>
          }
          sort={
            <SortDropdown<RSortKey> value={sortKey} options={sortOptions} onChange={setSortKey} />
          }
        />

        <div style={{ height: 24 }} />
        <div className="mx-auto" style={{ maxWidth: 1100 }}>
          {storeRituals.length === 0 ? (
            !goalsLoading && !hasActiveGoals ? (
              <EmptyState
                headline={t("rituals.empty.noGoals.headline")}
                description={t("rituals.empty.noGoals.description")}
                ctaLabel={t("goals.empty.noGoals.cta")}
                onCta={() => navigate("/onboarding/goal")}
              />
            ) : (
              <EmptyState
                headline={t("rituals.empty.noRituals.headline")}
                description={t("rituals.empty.noRituals.description")}
                ctaLabel={t("rituals.newRitual")}
                onCta={handleAddRitual}
              />
            )
          ) : (
            <>
              <TopStats
                rows={activeRows}
                allTime={allTime}
                activeCount={activeRows.length}
                pendingCount={pending.length}
                dueCount={dueCount}
              />

              <div style={{ height: 24 }} />
              {pending.length > 0 && showActive && (
                <PendingToday items={pending} onMarkDone={handleMarkDone} onOpen={handleOpen} />
              )}

              <div style={{ height: 32 }} />

              {showActive && (
                <section>
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-[12px] font-medium uppercase tracking-[0.08em] text-text-secondary">
                      {t("rituals.section.activeRituals", { count: sortedActiveRows.length })}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {sortedActiveRows.map((r) => (
                      <RitualCard key={r.id} r={r} onOpen={handleOpen} onMarkDone={handleMarkDone} />
                    ))}
                  </div>
                  {sortedActiveRows.length === 0 && (
                    <div className="mt-4 font-mono text-[11px] text-text-tertiary text-center">
                      {t("rituals.empty.noActiveMatch")}
                    </div>
                  )}
                </section>
              )}

              {showArchived && (
                <>
                  <div style={{ height: 24 }} />
                  <ArchivedSection rows={sortedArchivedRows} onRestore={handleRestore} />
                </>
              )}

              <div style={{ height: 32 }} />
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default Rituals;

