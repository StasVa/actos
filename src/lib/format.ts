/** Format minutes as "Nm", "Hh", or "Hh Mm". Never uses "~" or "min". */
export function formatTime(minutes: number): string {
  const m = Math.max(0, Math.round(minutes));
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  if (m >= 600 || rem === 0) return `${h}h`;
  return `${h}h ${rem}m`;
}
