import React from "react";
import { Tooltip } from "@/components/Tooltip";
import { getReturnInfo } from "@/lib/returnDate";

function compactText(expectedReturnDate?: string): string {
  const info = getReturnInfo(expectedReturnDate);
  if (info.state === "none") return "no return date";
  const diff = info.diffDays ?? 0;
  if (info.state === "overdue") return `${Math.abs(diff)}d overdue`;
  if (info.state === "today") return "due today";
  if (diff <= 7) return `in ${diff}d`;
  // 8+ days: short month/day
  const d = new Date(expectedReturnDate + "T00:00:00");
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export const ReturnDatePill: React.FC<{
  expectedReturnDate?: string;
  compact?: boolean;
}> = ({ expectedReturnDate, compact = false }) => {
  const info = getReturnInfo(expectedReturnDate);
  const style: React.CSSProperties = {
    fontSize: 12,
    color: info.color,
    background: compact ? "transparent" : info.background,
    fontStyle: info.italic ? "italic" : "normal",
    whiteSpace: "nowrap",
  };
  if (info.pill && !compact) {
    style.padding = "3px 8px";
    style.borderRadius = 3;
  }
  return (
    <Tooltip content={info.tooltip}>
      <span className="font-mono tabular-nums" style={style}>
        {compact ? compactText(expectedReturnDate) : info.text}
      </span>
    </Tooltip>
  );
};
