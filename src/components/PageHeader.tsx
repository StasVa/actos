import React from "react";
import { Tooltip } from "@/components/Tooltip";

export type PageHeaderCta = {
  label: string;
  onClick?: () => void;
  ariaLabel?: string;
  disabled?: boolean;
  disabledTooltip?: string;
};

type Props = {
  title: string;
  /** Aggregate counts string, already pre-formatted (e.g. "7 PROJECTS · 5 ACTIVE"). */
  meta?: React.ReactNode;
  /** Primary CTA button. Omit on read-only review pages. */
  cta?: PageHeaderCta;
  /** Filter dropdowns (left side on desktop, scrollable on mobile). */
  filters?: React.ReactNode;
  /** Sort dropdown (pushed to the right on desktop, last item on mobile). */
  sort?: React.ReactNode;
  /** Optional row between filter bar and divider (e.g. tabs). */
  belowMeta?: React.ReactNode;
};

const CtaButton: React.FC<{ cta: PageHeaderCta }> = ({ cta }) => {
  const className =
    "inline-flex items-center justify-center rounded-[4px] text-white text-[13px] font-medium transition-colors whitespace-nowrap";
  const style: React.CSSProperties = {
    background: cta.disabled ? "hsl(var(--surface-hover))" : "hsl(var(--accent))",
    color: cta.disabled ? "hsl(var(--text-secondary))" : "white",
    padding: "8px 16px",
    minHeight: 40,
    cursor: cta.disabled ? "not-allowed" : "pointer",
  };
  const btn = (
    <button
      type="button"
      onClick={cta.disabled ? undefined : cta.onClick}
      disabled={cta.disabled}
      aria-label={cta.ariaLabel ?? cta.label}
      className={className}
      style={style}
    >
      {cta.label}
    </button>
  );
  if (cta.disabled && cta.disabledTooltip) {
    return <Tooltip content={cta.disabledTooltip}>{btn}</Tooltip>;
  }
  return btn;
};

export const PageHeader: React.FC<Props> = ({
  title,
  meta,
  cta,
  filters,
  sort,
  belowMeta,
}) => {
  return (
    <div>
      {/* Row 1 — title + CTA */}
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-[20px] sm:text-[24px] md:text-[28px] font-medium text-text-primary leading-tight">
          {title}
        </h1>
        {cta && <CtaButton cta={cta} />}
      </div>

      {/* Row 2 — meta line */}
      {meta && (
        <div
          className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-tertiary tabular-nums flex flex-wrap items-center"
          style={{ marginTop: 8, columnGap: 0, rowGap: 4 }}
        >
          {meta}
        </div>
      )}

      {belowMeta && <div style={{ marginTop: 16 }}>{belowMeta}</div>}

      {/* Row 3 — divider */}
      <div className="border-t border-border-subtle" style={{ marginTop: 16 }} />

      {/* Row 4 — filter bar */}
      {(filters || sort) && (
        <div
          className="flex items-center gap-2 md:flex-wrap flex-nowrap overflow-x-auto scrollbar-hide"
          style={{ marginTop: 16, WebkitOverflowScrolling: "touch" }}
        >
          {filters}
          {sort && <div className="md:ml-auto shrink-0">{sort}</div>}
        </div>
      )}
    </div>
  );
};

export default PageHeader;
