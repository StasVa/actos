import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Tooltip } from "@/components/Tooltip";

const G1 = "hsl(var(--goal-1))";

type Props = {
  open: boolean;
  onClose: () => void;
  mode?: "edit" | "new";
};

const SCHEDULE_OPTIONS = ["Daily", "Weekdays", "Weekly", "Custom"] as const;
type ScheduleOpt = (typeof SCHEDULE_OPTIONS)[number];

/* 12 weeks consistency: positions 4 and 8 (1-indexed) missed */
const WEEKS: { label: string; done: boolean }[] = [
  { label: "Week of Feb 16", done: true },
  { label: "Week of Feb 23", done: true },
  { label: "Week of Mar 2", done: true },
  { label: "Week of Mar 9", done: false },
  { label: "Week of Mar 16", done: true },
  { label: "Week of Mar 23", done: true },
  { label: "Week of Mar 30", done: true },
  { label: "Week of Apr 6", done: false },
  { label: "Week of Apr 13", done: true },
  { label: "Week of Apr 20", done: true },
  { label: "Week of Apr 27", done: true },
  { label: "Week of May 4", done: true },
];

const HISTORY: { date: string; rel: string }[] = [
  { date: "Apr 28, 2026", rel: "Mon · last week" },
  { date: "Apr 21, 2026", rel: "Mon · 2 weeks ago" },
  { date: "Apr 14, 2026", rel: "Mon · 3 weeks ago" },
  { date: "Mar 31, 2026", rel: "Mon · 5 weeks ago" },
  { date: "Mar 24, 2026", rel: "Mon · 6 weeks ago" },
  { date: "Mar 17, 2026", rel: "Mon · 7 weeks ago" },
  { date: "Mar 10, 2026", rel: "Mon · 8 weeks ago" },
  { date: "Mar 3, 2026", rel: "Mon · 9 weeks ago" },
];

const TinyLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="font-mono text-[10px] uppercase tracking-[0.06em] text-text-tertiary mb-1">
    {children}
  </div>
);

const Divider: React.FC = () => (
  <div className="my-6 h-px w-full bg-border-subtle" />
);

const RitualPanel: React.FC<Props> = ({ open, onClose, mode = "edit" }) => {
  const isNew = mode === "new";
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(false);
  const [schedule, setSchedule] = useState<ScheduleOpt>(isNew ? "Daily" : "Weekly");
  const [title, setTitle] = useState(isNew ? "" : "Weekly project audit");
  const [impact, setImpact] = useState(5);
  const [time, setTime] = useState("30m");
  const [notes, setNotes] = useState(
    isNew
      ? ""
      : "Review what's moving across all projects in this goal. Identify stuck items and adjust scope if needed.",
  );
  const titleRef = React.useRef<HTMLInputElement>(null);

  // Mount / animate
  useEffect(() => {
    if (open) {
      setMounted(true);
      // Next frame, trigger transition
      const id = window.requestAnimationFrame(() => setVisible(true));
      return () => window.cancelAnimationFrame(id);
    } else if (mounted) {
      setVisible(false);
      const t = window.setTimeout(() => setMounted(false), 220);
      return () => window.clearTimeout(t);
    }
  }, [open, mounted]);

  // Escape key
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!mounted) return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.4)",
          opacity: visible ? 1 : 0,
          transition: "opacity 200ms ease",
          zIndex: 99,
        }}
      />
      {/* Panel */}
      <div
        role="dialog"
        aria-label="Edit ritual"
        className="bg-surface-elevated border-l border-border-subtle"
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          height: "100vh",
          width: "min(480px, 100vw)",
          zIndex: 100,
          transform: visible ? "translateX(0)" : "translateX(100%)",
          transition: "transform 200ms ease",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div className="flex flex-col flex-1">
          <div className="px-6 pt-6 pb-0 flex-1">
            {/* Sticky header */}
            <div
              className="sticky top-0 -mx-6 px-6 pb-4 mb-6 bg-surface-elevated border-b border-border-subtle flex items-center justify-between"
              style={{ zIndex: 1 }}
            >
              <div className="font-mono text-[11px] uppercase tracking-[0.08em] text-text-secondary">
                EDIT RITUAL
              </div>
              <button
                onClick={onClose}
                aria-label="Close"
                className="w-6 h-6 flex items-center justify-center text-text-secondary rounded-[4px] hover:bg-surface-hover hover:text-text-primary transition-colors text-[16px] leading-none cursor-pointer"
              >
                ×
              </button>
            </div>

            {/* Title */}
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-transparent text-text-primary text-[18px] font-medium outline-none border border-transparent rounded-[4px] focus:border-border-default focus:px-3 focus:py-2 transition-[padding,border-color] duration-100"
              style={{ fontFamily: "Inter, sans-serif" }}
            />

            <div className="h-3" />

            {/* Parent */}
            <div>
              <TinyLabel>PARENT</TinyLabel>
              <div className="w-full bg-surface-raised border border-border-subtle rounded-[4px] px-2.5 py-2 flex items-center gap-2 text-[13px] text-text-primary">
                <span className="w-2 h-2 rounded-full" style={{ background: G1 }} />
                <span>Launch YouTube channel</span>
                <span className="ml-auto text-text-tertiary text-[11px]">▾</span>
              </div>
            </div>

            <div className="h-3" />

            {/* Schedule */}
            <div>
              <TinyLabel>SCHEDULE</TinyLabel>
              <div className="w-full border border-border-subtle rounded-[4px] flex overflow-hidden">
                {SCHEDULE_OPTIONS.map((opt, i) => {
                  const active = schedule === opt;
                  return (
                    <button
                      key={opt}
                      onClick={() => setSchedule(opt)}
                      className={`flex-1 text-center text-[13px] py-1.5 transition-colors cursor-pointer ${
                        active
                          ? "bg-surface-hover text-text-primary font-medium"
                          : "text-text-secondary hover:text-text-primary"
                      } ${i > 0 ? "border-l border-border-subtle" : ""}`}
                      style={{ fontFamily: "Inter, sans-serif" }}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
              {schedule === "Weekly" && (
                <div className="mt-2 font-mono text-[11px] text-text-secondary">
                  On Mondays · Next: tomorrow
                </div>
              )}
            </div>

            <div className="h-6" />

            {/* Base impact */}
            <div>
              <TinyLabel>BASE IMPACT</TinyLabel>
              <div className="w-full bg-surface-raised border border-border-subtle rounded-[4px] px-2.5 py-1.5 flex items-center">
                <span className="font-mono text-[16px] text-text-primary tabular-nums flex-1">
                  {impact}
                </span>
                <button
                  onClick={() => setImpact(Math.max(0, impact - 1))}
                  className="w-4 h-4 flex items-center justify-center text-text-tertiary hover:text-text-primary text-[14px] leading-none cursor-pointer"
                  aria-label="Decrease"
                >
                  −
                </button>
                <button
                  onClick={() => setImpact(impact + 1)}
                  className="w-4 h-4 ml-2 flex items-center justify-center text-text-tertiary hover:text-text-primary text-[14px] leading-none cursor-pointer"
                  aria-label="Increase"
                >
                  +
                </button>
              </div>
              <div className="mt-1 font-mono text-[10px] text-text-tertiary">
                Per completed instance, at base level.
              </div>
            </div>

            <div className="h-6" />

            {/* Time estimate */}
            <div>
              <TinyLabel>TIME ESTIMATE</TinyLabel>
              <div className="w-full bg-surface-raised border border-border-subtle rounded-[4px] px-2.5 py-1.5">
                <input
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full bg-transparent outline-none font-mono text-[14px] text-text-primary tabular-nums"
                />
              </div>
              <div className="mt-1 font-mono text-[10px] text-text-tertiary">Per instance.</div>
            </div>

            <div className="h-6" />

            {/* Notes */}
            <div>
              <TinyLabel>NOTES</TinyLabel>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full bg-surface-raised border border-border-subtle rounded-[4px] px-2.5 py-2 text-[13px] text-text-primary outline-none resize-none focus:border-border-default transition-colors"
                style={{ fontFamily: "Inter, sans-serif" }}
              />
            </div>

            <Divider />

            {/* Multiplier */}
            <div className="font-mono text-[11px] uppercase tracking-[0.08em] text-text-secondary">
              MULTIPLIER
            </div>
            <div className="h-3" />
            <div className="font-mono text-[32px] font-medium text-text-primary tabular-nums leading-none">
              ×1.10
            </div>
            <div className="h-2" />
            <div className="font-mono">
              <span className="text-[13px] text-text-primary">Effective impact: 5.5</span>
              <span className="text-[11px] text-text-tertiary"> (base 5 × 1.10)</span>
            </div>

            <div className="h-4" />

            <TinyLabel>PROGRESS TO ×1.25</TinyLabel>
            <div className="w-full h-1.5 bg-surface-hover rounded-[2px] overflow-hidden">
              <div
                className="h-full rounded-[2px]"
                style={{ width: "40%", background: G1 }}
              />
            </div>
            <div className="mt-2 font-mono text-[11px] text-text-tertiary">
              12 of 30 completions · 18 to go
            </div>

            <Divider />

            {/* Recent consistency */}
            <div className="flex items-center justify-between">
              <div className="font-mono text-[11px] uppercase tracking-[0.08em] text-text-secondary">
                RECENT CONSISTENCY
              </div>
              <div className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-tertiary">
                10 OF 12 LAST WEEKS
              </div>
            </div>
            <div className="h-3" />
            <div className="flex" style={{ gap: 4 }}>
              {WEEKS.map((w, i) => (
                <Tooltip
                  key={i}
                  content={
                    <div>
                      <div
                        className="text-[12px] font-medium text-text-primary"
                        style={{ fontFamily: "Inter, sans-serif" }}
                      >
                        {w.label}
                      </div>
                      <div className="font-mono text-[11px] text-text-tertiary mt-1">
                        {w.done ? "Completed" : "Missed"}
                      </div>
                    </div>
                  }
                >
                  <div
                    style={{
                      width: 28,
                      height: 24,
                      borderRadius: 4,
                      background: w.done ? G1 : "hsl(var(--surface-hover))",
                    }}
                  />
                </Tooltip>
              ))}
            </div>
            <div className="mt-2 font-mono text-[10px] text-text-tertiary">
              Each block represents one week. Streak is not tracked — only total completions.
            </div>

            <Divider />

            {/* History */}
            <div className="flex items-center justify-between">
              <div className="font-mono text-[11px] uppercase tracking-[0.08em] text-text-secondary">
                HISTORY
              </div>
              <div className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-tertiary">
                12 ALL-TIME
              </div>
            </div>
            <div className="h-3" />
            <div>
              {HISTORY.map((h, i) => (
                <div
                  key={i}
                  className={`h-7 py-1 flex items-center justify-between ${
                    i > 0 ? "border-t border-border-subtle" : ""
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="text-[12px] leading-none"
                      style={{ color: "hsl(var(--status-done))" }}
                    >
                      ✓
                    </span>
                    <span
                      className="text-[12px] text-text-primary"
                      style={{ fontFamily: "Inter, sans-serif" }}
                    >
                      {h.date}
                    </span>
                  </div>
                  <div className="font-mono text-[10px] text-text-tertiary">{h.rel}</div>
                </div>
              ))}
            </div>
            <div className="h-3" />
            <a
              href="#"
              className="inline-block text-[12px] text-[hsl(var(--accent))] hover:text-text-primary hover:underline transition-colors"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              View all 12 completions
            </a>

            <div className="h-6" />
          </div>

          {/* Sticky bottom action bar */}
          <div
            className="sticky bottom-0 bg-surface-elevated border-t border-border-subtle flex items-center justify-between"
            style={{ padding: "16px 24px" }}
          >
            <button
              className="h-9 px-4 rounded-[4px] border text-[13px] font-medium text-text-primary bg-transparent transition-colors cursor-pointer"
              style={{
                borderColor: "hsl(var(--accent))",
                fontFamily: "Inter, sans-serif",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "hsl(var(--accent-muted))")
              }
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              Mark today done
            </button>
            <div className="flex items-center" style={{ gap: 12 }}>
              <button
                className="text-[12px] text-text-tertiary hover:text-text-secondary transition-colors cursor-pointer bg-transparent"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                Archive ritual
              </button>
              <button
                aria-label="More"
                className="w-6 h-6 rounded-[4px] text-text-tertiary hover:bg-surface-hover hover:text-text-primary transition-colors text-[16px] leading-none cursor-pointer flex items-center justify-center"
              >
                ···
              </button>
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
};

export default RitualPanel;
