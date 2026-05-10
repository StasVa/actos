import React from "react";
import { useTranslation } from "react-i18next";
import { Tooltip } from "@/components/Tooltip";
import { getReturnInfo, ReturnInfo } from "@/lib/returnDate";

function formatShortDate(iso: string, locale: string): string {
  const d = new Date(iso + "T00:00:00");
  return new Intl.DateTimeFormat(locale, { month: "short", day: "numeric" }).format(d);
}

function buildText(
  info: ReturnInfo,
  iso: string | undefined,
  compact: boolean,
  t: (k: string, opts?: Record<string, unknown>) => string,
  locale: string,
): string {
  if (info.state === "none") return t("delegated.return.noDate");
  const diff = info.diffDays ?? 0;
  const dateLabel = iso ? formatShortDate(iso, locale) : "";

  if (compact) {
    if (info.state === "overdue") return t("delegated.return.compact.overdue", { count: Math.abs(diff) });
    if (info.state === "today") return t("delegated.return.compact.today");
    if (diff <= 7) return t("delegated.return.compact.soon", { count: diff });
    return dateLabel;
  }

  switch (info.state) {
    case "overdue":
      return t("delegated.return.text.overdue", { date: dateLabel, count: Math.abs(diff) });
    case "today":
      return t("delegated.return.text.today");
    case "tomorrow":
      return t("delegated.return.text.tomorrow", { date: dateLabel });
    case "soon":
      return t("delegated.return.text.soon", { date: dateLabel, count: diff });
    case "later":
    default:
      return t("delegated.return.text.later", { date: dateLabel });
  }
}

function buildTooltip(
  info: ReturnInfo,
  t: (k: string, opts?: Record<string, unknown>) => string,
): string {
  const diff = info.diffDays ?? 0;
  switch (info.state) {
    case "none":
      return t("delegated.return.tooltip.none");
    case "overdue":
      return t("delegated.return.tooltip.overdue", { count: Math.abs(diff) });
    case "today":
      return t("delegated.return.tooltip.today");
    default:
      return t("delegated.return.tooltip.upcoming", { count: diff });
  }
}

export const ReturnDatePill: React.FC<{
  expectedReturnDate?: string;
  compact?: boolean;
}> = ({ expectedReturnDate, compact = false }) => {
  const { t, i18n } = useTranslation();
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
    <Tooltip content={buildTooltip(info, t)}>
      <span className="font-mono tabular-nums" style={style}>
        {buildText(info, expectedReturnDate, compact, t, i18n.language || "en")}
      </span>
    </Tooltip>
  );
};
