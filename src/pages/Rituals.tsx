import React, { useState } from "react";
import { LifetimeCounters } from "@/components/LifetimeCounters";
import { Link, useLocation } from "react-router-dom";
import { Tooltip } from "@/components/Tooltip";
import { useStore } from "@/store/useStore";
import { toast } from "sonner";

const G1 = "hsl(var(--goal-1))";
const G2 = "hsl(var(--goal-2))";
const G3 = "hsl(var(--goal-3))";

/* ===== Sidebar ===== */
const NAV = [
  { label: "Home", href: "/" },
  { label: "Weekly", href: "#" },
  { label: "Ideas", href: "/ideas" },
  { label: "Rituals", href: "/rituals" },
  { label: "All actions", href: "/all-actions" },
  { label: "All projects", href: "/all-projects" },
  { label: "All delegated", href: "/all-delegated" },
];

const Sidebar: React.FC = () => {
  const { pathname } = useLocation();
  return (
    <aside className="fixed left-0 top-0 bottom-0 w-[220px] bg-surface-raised border-r border-border-subtle p-4 flex flex-col">
      <Link to="/" className="px-1 py-1 text-[17px] font-semibold text-text-primary tracking-tight">
        ActOS
      </Link>
      <nav className="mt-8 flex flex-col gap-1">
        {NAV.map((item) => {
          const active =
            (item.href === "/" && pathname === "/") ||
            (item.href !== "/" && item.href !== "#" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.label}
              to={item.href}
              className={`px-2.5 py-1.5 rounded-[4px] text-[13px] transition-colors ${
                active
                  ? "bg-surface-hover text-text-primary font-medium"
                  : "text-text-secondary font-normal hover:text-text-primary"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="flex-1" />
      <div className="font-mono text-[11px] text-text-tertiary px-1">⌘K  Quick add</div>
      <div className="mt-4 font-mono text-[11px] text-text-secondary px-1 leading-[1.7]">
        <LifetimeCounters />
      </div>
      <div className="mt-3 flex items-center gap-2 p-1 rounded-[4px] hover:bg-surface-hover cursor-pointer">
        <span className="w-7 h-7 rounded-full bg-surface-hover flex items-center justify-center font-mono text-[11px] text-text-primary">
          AK
        </span>
        <span className="font-mono text-[11px] text-text-secondary truncate">ak@email</span>
      </div>
    </aside>
  );
};

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
const MONTH_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
function dayLabel(daysFromToday: number): string {
  if (daysFromToday === 0) return "Today";
  if (daysFromToday === 1) return "Yesterday";
  const d = new Date();
  d.setDate(d.getDate() - daysFromToday);
  return `${MONTH_SHORT[d.getMonth()]} ${d.getDate()}`;
}
function weekLabel(weeksFromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() - weeksFromNow * 7);
  const day = d.getDay();
  const diff = (day + 6) % 7;
  d.setDate(d.getDate() - diff);
  return `Week of ${MONTH_SHORT[d.getMonth()]} ${d.getDate()}`;
}
function monthLabel(monthsFromNow: number): string {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - monthsFromNow);
  return `${MONTH_SHORT[d.getMonth()]} ${d.getFullYear()}`;
}


/* ===== Charts ===== */
const ConsistencyCalendar: React.FC<{ data: number[]; color: string; cellSize?: number }> = ({
  data,
  color,
  cellSize = 12,
}) => {
  const last = data.length - 1;
  return (
    <div className="flex items-center gap-[2px]">
      {data.map((v, i) => {
        const daysFromToday = last - i;
        const status =
          daysFromToday === 0 && v === 0
            ? "Pending"
            : v === 1
            ? "Done"
            : "Missed";
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
                ? "Pending"
                : v === 1
                ? "Done"
                : "Missed";
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
  return (
    <div className="w-full flex items-end gap-[3px]" style={{ height: 44 }}>
      {data.map((v, i) => {
        const stepsFromNow = data.length - 1 - i;
        const h = max === 0 ? 0 : Math.round((v / max) * 44);
        const tip = (
          <div className="text-[12px] text-text-primary" style={{ fontFamily: "Inter, sans-serif" }}>
            {unit === "month" ? monthLabel(stepsFromNow) : weekLabel(stepsFromNow)} ·{" "}
            <span className="font-mono text-text-secondary">
              {v === 0 ? "No completions" : `${v} done`}
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
  const isMonthly = r.scheduleLabel.startsWith("MONTHLY");
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
            {r.totalCompletions} completions
          </div>
        </div>
      </div>

      <div style={{ height: 20 }} />

      {/* Chart 1 */}
      <div>
        <div className="font-mono text-[10px] uppercase tracking-[0.06em] text-text-tertiary mb-1">
          LAST 30 DAYS · CONSISTENCY
        </div>
        <ConsistencyCalendar data={r.consistency} color={r.goalColor} />
      </div>

      <div style={{ height: 12 }} />

      {/* Chart 2 */}
      <div>
        <div className="flex items-baseline justify-between mb-1">
          <div className="font-mono text-[10px] uppercase tracking-[0.06em] text-text-tertiary">
            12 WEEKS · FREQUENCY
          </div>
          <div className="font-mono text-[9px] text-text-tertiary">max: {r.freqMax}</div>
        </div>
        <FrequencyChart data={r.frequency} max={r.freqMax} color={r.goalColor} />
      </div>

      <div className="flex-1" style={{ minHeight: 20 }} />

      {/* Footer */}
      <div className="flex items-center justify-between mt-2">
        <div className="font-mono text-[11px] text-text-secondary tabular-nums">
          Last done: {r.lastDoneLabel}
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
            Mark today done
          </button>
        ) : isMonthly ? null : (
          <span className="font-mono text-[11px] text-text-tertiary">Not due today</span>
        )}
      </div>

      {isMonthly && (
        <div className="mt-1 font-mono text-[11px] uppercase tracking-[0.06em] text-text-tertiary tabular-nums">
          DUE: MAY 1 ·{" "}
          <span style={{ color: "hsl(var(--text-warning))" }}>4 DAYS OVERDUE</span>
        </div>
      )}
    </div>
  );
};

/* ===== Pending today list ===== */
const PendingToday: React.FC<{ items: RitualRow[]; onMarkDone: (r: RitualRow) => void; onOpen: (r: RitualRow) => void }> = ({ items, onMarkDone, onOpen }) => (
  <section>
    <div className="text-[12px] font-medium uppercase tracking-[0.08em] text-text-secondary mb-3">
      Pending today · {items.length}
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
            Mark done
          </button>
        </div>
      ))}
    </div>
  </section>
);

/* ===== Top stats ===== */
const TopStats: React.FC = () => {
  const stats = [
    { label: "ACTIVE", value: "5", sub: "rituals" },
    { label: "PENDING TODAY", value: "3", sub: "of 4 due" },
    { label: "WEEK CONSISTENCY", value: "86%", sub: "12 of 14" },
    { label: "ALL TIME", value: "94", sub: "completions" },
  ];
  return (
    <div
      className="bg-surface-elevated border border-border-subtle rounded-[6px] grid grid-cols-2 md:grid-cols-4 divide-x divide-border-subtle"
      style={{ minHeight: 88 }}
    >
      {stats.map((s) => (
        <div key={s.label} style={{ padding: "20px 24px" }}>
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

/* ===== Archived ===== */
const ArchivedSection: React.FC = () => {
  const [open, setOpen] = useState(false);
  return (
    <section>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-[12px] font-medium uppercase tracking-[0.08em] text-text-tertiary hover:text-text-secondary cursor-pointer"
      >
        {open ? "▾" : "▸"} ARCHIVED · 1
      </button>
      {open && (
        <div className="mt-3 rounded-[4px] overflow-hidden border border-border-subtle">
          <div
            className="flex items-center gap-3 pr-3 hover:bg-surface-hover transition-colors"
            style={{ height: 36, padding: "8px 12px" }}
          >
            <span
              className="self-stretch shrink-0 -ml-3"
              style={{ width: 3, background: "hsl(var(--state-stalled))" }}
            />
            <span className="text-[13px] text-text-tertiary">Daily meditation</span>
            <span className="font-mono text-[11px] text-text-tertiary">
              · DAILY · 9 completions · archived 2 weeks ago
            </span>
            <div className="flex-1" />
            <a
              href="#"
              onClick={(e) => e.preventDefault()}
              className="text-[12px] text-text-tertiary hover:text-text-secondary"
            >
              Restore
            </a>
          </div>
        </div>
      )}
    </section>
  );
};

/* ===== Page ===== */
const Rituals: React.FC = () => {
  const storeRituals = useStore((s) => s.rituals);
  const storeGoals = useStore((s) => s.goals);
  const openPanel = useStore((s) => s.openPanel);
  const markRitualInstanceDone = useStore((s) => s.markRitualInstanceDone);

  const pending = RITUALS.filter((r) => r.pendingToday);

  // Bridge static visual rows → real store records by title.
  const findStoreRitual = (r: RitualRow) =>
    storeRituals.find((sr) => sr.title.toLowerCase() === r.title.toLowerCase());

  const handleOpen = (r: RitualRow) => {
    const match = findStoreRitual(r);
    if (match) {
      openPanel({ kind: "ritual", mode: "edit", id: match.id });
    } else {
      openPanel({
        kind: "ritual",
        mode: "new",
        prefill: {
          title: r.title,
          goalId: storeGoals.find((g) => g.status === "active")?.id,
        },
      });
    }
  };

  const handleAddRitual = () => {
    openPanel({
      kind: "ritual",
      mode: "new",
      prefill: { goalId: storeGoals.find((g) => g.status === "active")?.id },
    });
  };

  const handleMarkDone = (r: RitualRow) => {
    const match = findStoreRitual(r);
    if (!match) {
      toast.error("Ritual not found in store");
      return;
    }
    const today = new Date().toISOString().slice(0, 10);
    if (match.completionHistory.some((c) => c.date === today)) {
      toast("Already logged today");
      return;
    }
    markRitualInstanceDone(match.id);
    toast(`Logged · ${match.totalCompletions + 1} completion${match.totalCompletions + 1 === 1 ? "" : "s"}`);
  };

  return (
    <div className="min-h-screen bg-surface-base text-text-primary">
      <Sidebar />
      <main className="ml-[220px]" style={{ padding: "32px 40px" }}>
        <div className="mx-auto" style={{ maxWidth: 1100 }}>
          {/* Header */}
          <div className="flex items-baseline justify-between">
            <h1 className="text-[24px] font-medium text-text-primary" style={{ fontWeight: 500 }}>
              Rituals
            </h1>
            <div className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-tertiary tabular-nums">
              5 ACTIVE · 3 PENDING TODAY · 86% WEEK CONSISTENCY
            </div>
          </div>

          <div style={{ height: 24 }} />
          <TopStats />

          <div style={{ height: 24 }} />
          {pending.length > 0 && (
            <PendingToday items={pending} onMarkDone={handleMarkDone} onOpen={handleOpen} />
          )}

          <div style={{ height: 32 }} />

          {/* Active rituals grid */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <div className="text-[12px] font-medium uppercase tracking-[0.08em] text-text-secondary">
                Active rituals · 5
              </div>
              <div className="font-mono text-[11px] text-text-secondary">Sort: by consistency</div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {RITUALS.map((r) => (
                <RitualCard key={r.id} r={r} onOpen={handleOpen} onMarkDone={handleMarkDone} />
              ))}
              <button
                type="button"
                onClick={handleAddRitual}
                className="group rounded-[6px] bg-transparent border border-dashed border-border-default hover:border-solid hover:border-accent hover:bg-surface-hover transition-colors cursor-pointer flex flex-col items-center justify-center"
                style={{ minHeight: 240 }}
              >
                <span
                  className="font-mono text-text-tertiary group-hover:text-text-primary transition-colors leading-none"
                  style={{ fontSize: 28 }}
                >
                  +
                </span>
                <span style={{ height: 8 }} />
                <span
                  className="text-[14px] text-text-secondary group-hover:text-text-primary transition-colors"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  Add ritual
                </span>
              </button>
            </div>
          </section>

          <div style={{ height: 24 }} />
          <ArchivedSection />

          <div style={{ height: 32 }} />
        </div>
      </main>
    </div>
  );
};

export default Rituals;
