import React from "react";
import { useTranslation } from "react-i18next";

type EmptyStateProps = {
  headline: string;
  description: string;
  ctaLabel?: string;
  onCta?: () => void;
  hint?: string | null;
};

/**
 * Shared empty state for list pages. Render only when the underlying entity
 * collection is truly empty (no filters applied). For filtered-empty cases,
 * use <FilteredEmpty /> instead.
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  headline,
  description,
  ctaLabel,
  onCta,
  hint,
}) => (
  <div
    className="flex flex-col items-center text-center mx-auto"
    style={{ maxWidth: 480, paddingTop: 80, gap: 12 }}
  >
    <div className="text-[18px] font-medium text-text-primary">{headline}</div>
    <div className="text-[14px] text-text-secondary leading-[1.5]" style={{ whiteSpace: "pre-line" }}>{description}</div>
    {ctaLabel && onCta && (
      <button
        type="button"
        onClick={onCta}
        className="mt-1 inline-flex items-center justify-center rounded-[4px] text-white text-[13px] font-medium transition-colors"
        style={{
          background: "hsl(var(--accent))",
          padding: "8px 16px",
          marginTop: 4,
        }}
        onMouseEnter={(e) =>
          ((e.currentTarget as HTMLButtonElement).style.background =
            "hsl(var(--accent-hover))")
        }
        onMouseLeave={(e) =>
          ((e.currentTarget as HTMLButtonElement).style.background = "hsl(var(--accent))")
        }
      >
        {ctaLabel}
      </button>
    )}
    {hint && (
      <div className="text-[12px] text-text-tertiary">{hint}</div>
    )}
  </div>
);

type FilteredEmptyProps = {
  onClear: () => void;
  message?: string;
};

export const FilteredEmpty: React.FC<FilteredEmptyProps> = ({
  onClear,
  message,
}) => {
  const { t } = useTranslation();
  return (
    <div
      className="flex flex-col items-center text-center"
      style={{ padding: "48px 24px", gap: 12 }}
    >
      <div className="text-[14px] text-text-secondary">{message ?? t("empty.filtered")}</div>
      <button
        type="button"
        onClick={onClear}
        className="text-[13px] text-text-secondary hover:text-text-primary transition-colors"
      >
        {t("common.clearFilters")}
      </button>
    </div>
  );
};

type ReviewEmptyProps = {
  message: string;
};

/** Read-only review pages: no CTA, no description block. */
export const ReviewEmpty: React.FC<ReviewEmptyProps> = ({ message }) => (
  <div
    className="text-center text-[14px] text-text-secondary"
    style={{ paddingTop: 80 }}
  >
    {message}
  </div>
);
