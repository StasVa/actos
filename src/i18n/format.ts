/**
 * Locale-aware formatting helpers. Dates and numbers go through Intl.*,
 * not through i18n keys. Unit suffixes (e.g. "m", "h") DO go through i18n.
 */
import i18n from "./index";
import { formatTime as formatTimeUnits } from "@/lib/format";

function currentLocale(): string {
  return i18n.language || "en";
}

export function formatDate(
  value: Date | string | number,
  options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" },
  locale: string = currentLocale(),
): string {
  const d = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat(locale, options).format(d);
}

export function formatNumber(
  value: number,
  options: Intl.NumberFormatOptions = {},
  locale: string = currentLocale(),
): string {
  return new Intl.NumberFormat(locale, options).format(value);
}

/**
 * Relative formatting using Intl.RelativeTimeFormat. Returns something like
 * "today", "tomorrow", "yesterday", "in 3 days", "2 days ago".
 */
export function formatRelative(
  value: Date | string | number,
  locale: string = currentLocale(),
): string {
  const d = value instanceof Date ? value : new Date(value);
  const diffDays = Math.round((d.getTime() - Date.now()) / 86400000);
  if (diffDays === 0) return i18n.t("time.today");
  if (diffDays === 1) return i18n.t("time.tomorrow");
  if (diffDays === -1) return i18n.t("time.yesterday");
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  return rtf.format(diffDays, "day");
}

/**
 * formatTime — passes through the existing numeric formatter; the unit
 * suffixes ("m", "h") live in i18n keys (`time.minutesShort`, `time.hoursShort`)
 * for translation, but for now the legacy "Nm"/"Nh Mm" output is preserved
 * to avoid visible churn in Part 1.
 */
export function formatTime(minutes: number): string {
  return formatTimeUnits(minutes);
}
