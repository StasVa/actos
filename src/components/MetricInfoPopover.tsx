import React from "react";
import { Info } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";

type Variant = "impact" | "valueEffort" | "ritualImpact";

const SIZES: Record<Variant, { width: number; padding: number }> = {
  impact: { width: 280, padding: 12 },
  ritualImpact: { width: 280, padding: 12 },
  valueEffort: { width: 320, padding: 16 },
};

export const MetricInfoPopover: React.FC<{
  variant: Variant;
  size?: number;
  ariaLabel?: string;
  className?: string;
}> = ({ variant, size, ariaLabel, className }) => {
  const { t } = useTranslation();
  const cfg = SIZES[variant];
  const iconSize = size ?? (variant === "valueEffort" ? 12 : 14);

  let body: React.ReactNode;
  if (variant === "impact" || variant === "ritualImpact") {
    body = (
      <div className="space-y-2">
        <div className="font-medium text-text-primary text-[13px]">
          {t(`metricInfo.${variant}.title`)}
        </div>
        <p className="text-text-primary text-[13px] leading-[1.5]">
          {t("metricInfo.impact.scale")}
        </p>
        <p className="text-text-primary text-[13px] leading-[1.5]">
          {t("metricInfo.impact.judgment")}
        </p>
      </div>
    );
  } else {
    body = (
      <div className="space-y-3">
        <div>
          <div className="font-medium text-text-primary text-[13px]">
            {t("metricInfo.value.title")}
          </div>
          <p className="text-text-primary text-[13px] leading-[1.5] mt-1">
            {t("metricInfo.value.body")}
          </p>
        </div>
        <div>
          <div className="font-medium text-text-primary text-[13px]">
            {t("metricInfo.effort.title")}
          </div>
          <p className="text-text-primary text-[13px] leading-[1.5] mt-1">
            {t("metricInfo.effort.body")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={ariaLabel ?? t("metricInfo.moreInfo")}
          className={`inline-flex items-center justify-center text-text-tertiary hover:text-text-secondary transition-colors cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-accent ${className ?? ""}`}
          onClick={(e) => e.stopPropagation()}
        >
          <Info size={iconSize} strokeWidth={1.75} />
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="center"
        sideOffset={6}
        collisionPadding={8}
        onClick={(e) => e.stopPropagation()}
        className="border border-border-subtle bg-surface-elevated text-text-primary shadow-md rounded-[6px]"
        style={{ width: cfg.width, padding: cfg.padding, fontFamily: "Inter, sans-serif" }}
      >
        {body}
      </PopoverContent>
    </Popover>
  );
};

export default MetricInfoPopover;
