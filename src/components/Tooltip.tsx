import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n";

type Props = {
  content: React.ReactNode;
  children: React.ReactElement;
  /** Optional className applied to the trigger wrapper */
  className?: string;
  /** Show delay (ms). Default 250. */
  showDelay?: number;
  /** Hide delay (ms). Default 100. */
  hideDelay?: number;
};

/**
 * Tooltip — top-placed, no shadow, no animation, viewport-aware.
 * Uses a portal so it can escape overflow:hidden parents.
 */
export const Tooltip = React.forwardRef<HTMLSpanElement, Props>(function Tooltip(
  { content, children, className, showDelay = 250, hideDelay = 100 },
  forwardedRef,
) {
  const triggerRef = useRef<HTMLSpanElement | null>(null);
  const tipRef = useRef<HTMLDivElement | null>(null);
  const showTimer = useRef<number | null>(null);
  const hideTimer = useRef<number | null>(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);

  const clearTimers = () => {
    if (showTimer.current) window.clearTimeout(showTimer.current);
    if (hideTimer.current) window.clearTimeout(hideTimer.current);
    showTimer.current = null;
    hideTimer.current = null;
  };

  const handleEnter = () => {
    clearTimers();
    showTimer.current = window.setTimeout(() => setOpen(true), showDelay);
  };
  const handleLeave = () => {
    clearTimers();
    hideTimer.current = window.setTimeout(() => setOpen(false), hideDelay);
  };

  useEffect(() => {
    if (!open) {
      setPos(null);
      return;
    }
    // Position after render so we can measure tooltip size
    const measure = () => {
      const trig = triggerRef.current;
      const tip = tipRef.current;
      if (!trig || !tip) return;
      const tRect = trig.getBoundingClientRect();
      const tipRect = tip.getBoundingClientRect();
      const margin = 8;
      let left = tRect.left + tRect.width / 2 - tipRect.width / 2;
      let top = tRect.top - tipRect.height - margin;
      // Keep in viewport horizontally
      const vw = window.innerWidth;
      if (left < 8) left = 8;
      if (left + tipRect.width > vw - 8) left = vw - 8 - tipRect.width;
      // Flip below if above is off-screen
      if (top < 8) top = tRect.bottom + margin;
      setPos({ left, top });
    };
    measure();
    window.addEventListener("scroll", measure, true);
    window.addEventListener("resize", measure);
    return () => {
      window.removeEventListener("scroll", measure, true);
      window.removeEventListener("resize", measure);
    };
  }, [open]);

  useEffect(() => () => clearTimers(), []);

  return (
    <>
      <span
        ref={(node) => {
          triggerRef.current = node;
          if (typeof forwardedRef === "function") forwardedRef(node);
          else if (forwardedRef) forwardedRef.current = node;
        }}
        className={className}
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
        style={{ display: "inline-flex" }}
      >
        {children}
      </span>
      {open &&
        createPortal(
          <div
            ref={tipRef}
            role="tooltip"
            onMouseEnter={() => clearTimers()}
            onMouseLeave={handleLeave}
            style={{
              position: "fixed",
              left: pos?.left ?? -9999,
              top: pos?.top ?? -9999,
              maxWidth: 280,
              zIndex: 100,
              background: "hsl(var(--surface-elevated))",
              border: "1px solid hsl(var(--border-default))",
              borderRadius: 4,
              padding: "8px 10px",
              pointerEvents: "auto",
              visibility: pos ? "visible" : "hidden",
            }}
          >
            {content}
          </div>,
          document.body,
        )}
    </>
  );
});

/* ===== Helpers for tooltip content ===== */

export type DayInfo = {
  /** Index from end: 0 = today, 1 = yesterday, etc. */
  daysFromToday: number;
  count: number;
  actions: string[];
};

export function formatDayLabel(daysFromToday: number): string {
  const lang = i18n.language || "en";
  if (daysFromToday === 0) return i18n.t("tooltip.today");
  if (daysFromToday === 1) return i18n.t("tooltip.yesterday");
  const d = new Date();
  d.setDate(d.getDate() - daysFromToday);
  return new Intl.DateTimeFormat(lang, { weekday: "long", month: "long", day: "numeric" }).format(d);
}

export const SparkTooltipContent: React.FC<{ info: DayInfo }> = ({ info }) => {
  const { t } = useTranslation();
  const countLabel =
    info.count === 0
      ? t("tooltip.noActivity")
      : t("tooltip.actionsDone", { count: info.count });
  const shown = info.actions.slice(0, 4);
  const more = info.actions.length - shown.length;
  return (
    <div>
      <div className="text-[12px] font-medium text-text-primary" style={{ fontFamily: "Inter, sans-serif" }}>
        {formatDayLabel(info.daysFromToday)}
      </div>
      <div className="font-mono text-[11px] text-text-tertiary mt-1">{countLabel}</div>
      {info.count > 0 && shown.length > 0 && (
        <>
          <div
            style={{
              height: 1,
              background: "hsl(var(--border-subtle))",
              margin: "6px 0",
            }}
          />
          <div className="flex flex-col" style={{ gap: 2 }}>
            {shown.map((tt, i) => (
              <div key={i} className="text-[11px] text-text-secondary leading-snug">
                {tt}
              </div>
            ))}
            {more > 0 && (
              <div className="text-[11px] text-text-tertiary italic">{t("tooltip.andMore", { count: more })}</div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export const StateDotTooltip: React.FC<{ state: "active" | "stalled"; lastActivity?: string; stalledFor?: string }> = ({
  state,
  lastActivity,
  stalledFor,
}) => {
  const { t } = useTranslation();
  const last = lastActivity ?? t("tooltip.lastActivityToday");
  const stalled = stalledFor ?? t("tooltip.stalledDefault");
  if (state === "active") {
    return (
      <div className="text-[12px] text-text-primary" style={{ fontFamily: "Inter, sans-serif" }}>
        {t("tooltip.activeLast", { last })}
      </div>
    );
  }
  return (
    <div className="text-[12px] text-text-primary" style={{ fontFamily: "Inter, sans-serif" }}>
      <span dangerouslySetInnerHTML={{ __html: t("tooltip.stalledNoActivity", { stalled: `<span style="color: hsl(var(--text-warning))">${stalled}</span>` }) }} />
    </div>
  );
};
