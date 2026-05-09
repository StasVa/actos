import React from "react";
import { formatTime } from "@/lib/format";

type Size = "default" | "mini";

const sizeStyles: Record<Size, { padding: string; fontSize: number; width: number; borderRadius: number }> = {
  default: { padding: "4px 10px", fontSize: 13, width: 40, borderRadius: 4 },
  mini: { padding: "2px 6px", fontSize: 10, width: 34, borderRadius: 3 },
};

const timeSizeStyles: Record<Size, { padding: string; fontSize: number; width: number; borderRadius: number }> = {
  default: { padding: "4px 10px", fontSize: 12, width: 64, borderRadius: 4 },
  mini: { padding: "2px 6px", fontSize: 10, width: 0, borderRadius: 3 },
};

/**
 * ImpactPill — goal-tinted pill showing impact value (e.g. "I8").
 * Used in Plan today / Session Builder Available pane rows and preset previews.
 */
export const ImpactPill: React.FC<{
  impact?: number;
  goalColor: string;
  size?: Size;
  dimmed?: boolean;
}> = ({ impact, goalColor, size = "default", dimmed = false }) => {
  if (!impact) return null;
  const s = sizeStyles[size];
  return (
    <span
      className="inline-flex items-center justify-center font-medium tabular-nums shrink-0"
      style={{
        padding: s.padding,
        borderRadius: s.borderRadius,
        fontSize: s.fontSize,
        width: s.width,
        textAlign: "center",
        boxSizing: "border-box",
        background: `color-mix(in srgb, ${goalColor} 15%, transparent)`,
        color: goalColor,
        opacity: dimmed ? 0.5 : 1,
      }}
    >
      I{impact}
    </span>
  );
};

/**
 * TimePill — neutral pill showing estimated time (e.g. "20m", "1h 30m").
 * Used in Plan today / Session Builder picker rows where the meta line is
 * shortened to "Goal · Project" only.
 */
export const TimePill: React.FC<{
  minutes?: number;
  size?: Size;
  dimmed?: boolean;
}> = ({ minutes, size = "default", dimmed = false }) => {
  if (!minutes) return null;
  const s = timeSizeStyles[size];
  return (
    <span
      className="inline-flex items-center justify-center font-mono tabular-nums shrink-0"
      style={{
        padding: s.padding,
        borderRadius: s.borderRadius,
        fontSize: s.fontSize,
        width: s.width,
        textAlign: "center",
        boxSizing: "border-box",
        background: "hsl(var(--surface-hover))",
        color: "hsl(var(--text-secondary))",
        opacity: dimmed ? 0.5 : 1,
      }}
    >
      {formatTime(minutes)}
    </span>
  );
};
