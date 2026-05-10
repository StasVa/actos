import React from "react";
import { useTranslation } from "react-i18next";

export interface AccomplishmentTile {
  /** Identifier for React keying. */
  key: string;
  /** Big number / value, already formatted (e.g. "12", "3h 20m"). */
  value: string;
  /** Tile label, e.g. "ACTIONS DONE". */
  label: string;
  /**
   * Optional comparison delta vs previous period (Week/Month only).
   * Provide a numeric delta and a unit label ("vs last week" / "vs last month").
   * If delta is null/undefined, no comparison line renders.
   * Positive uses state-active color; negative uses state-stalled (warning).
   */
  delta?: number | null;
  deltaLabel?: string;
}

interface Props {
  tiles: AccomplishmentTile[];
  /** Period word for empty-state line: "day" | "week" | "month". */
  period: "day" | "week" | "month";
}

const AccomplishmentTileView: React.FC<{ tile: AccomplishmentTile }> = ({ tile }) => {
  const hasDelta = tile.delta != null && tile.deltaLabel;
  const sign = tile.delta != null && tile.delta > 0 ? "+" : "";
  const deltaColor =
    tile.delta == null || tile.delta === 0
      ? "hsl(var(--text-secondary))"
      : tile.delta > 0
        ? "hsl(var(--state-active))"
        : "hsl(var(--state-stalled))";
  return (
    <div
      className="rounded-[6px] border border-border-subtle px-5 py-4 min-w-[140px] sm:min-w-[160px]"
      style={{ background: "hsl(var(--surface-raised))" }}
    >
      <div className="text-[28px] sm:text-[30px] leading-tight font-medium tabular-nums text-text-primary">
        {tile.value}
      </div>
      <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.06em] text-text-tertiary">
        {tile.label}
      </div>
      {hasDelta && (
        <div
          className="mt-1 font-mono text-[11px] tabular-nums"
          style={{ color: deltaColor }}
        >
          {sign}
          {tile.delta} {tile.deltaLabel}
        </div>
      )}
    </div>
  );
};

export const AccomplishmentsSection: React.FC<Props> = ({ tiles, period }) => {
  const { t } = useTranslation();
  return (
    <section>
      <h2 className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-tertiary mb-3">
        {t("accomplishments.heading")}
      </h2>
      {tiles.length === 0 ? (
        <div className="text-[13px] text-text-tertiary">
          {t(`accomplishments.empty.${period}` as const)}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {tiles.map((tile) => (
            <AccomplishmentTileView key={tile.key} tile={tile} />
          ))}
        </div>
      )}
    </section>
  );
};

export default AccomplishmentsSection;
