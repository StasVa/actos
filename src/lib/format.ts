import i18n from "@/i18n";

/** Format minutes as "Nm", "Hh", or "Hh Mm", localized via i18n. */
export function formatTime(minutes: number): string {
  const m = Math.max(0, Math.round(minutes));
  if (m < 60) return i18n.t("common.duration.minutes", { n: m });
  const h = Math.floor(m / 60);
  const rem = m % 60;
  if (m >= 600 || rem === 0) return i18n.t("common.duration.hours", { n: h });
  return i18n.t("common.duration.hoursMinutes", { h, m: rem });
}

/** Alias for clarity at new call sites. */
export const formatDuration = formatTime;
