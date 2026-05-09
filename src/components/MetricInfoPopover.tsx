import React from "react";
import { Info } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";

type Variant = "impact" | "valueEffort" | "ritualImpact";

const COPY: Record<Variant, { width: number; padding: number; body: React.ReactNode }> = {
  impact: {
    width: 280,
    padding: 12,
    body: (
      <div className="space-y-2">
        <div className="font-medium text-text-primary text-[13px]">
          How much does this task move your goal?
        </div>
        <p className="text-text-primary text-[13px] leading-[1.5]">
          1 = small thing, 10 = critical.
        </p>
        <p className="text-text-primary text-[13px] leading-[1.5]">
          You decide — this is your judgment of importance, not time spent.
        </p>
      </div>
    ),
  },
  ritualImpact: {
    width: 280,
    padding: 12,
    body: (
      <div className="space-y-2">
        <div className="font-medium text-text-primary text-[13px]">
          How much does each completion of this ritual move your goal?
        </div>
        <p className="text-text-primary text-[13px] leading-[1.5]">
          1 = small thing, 10 = critical.
        </p>
        <p className="text-text-primary text-[13px] leading-[1.5]">
          You decide — this is your judgment of importance, not time spent.
        </p>
      </div>
    ),
  },
  valueEffort: {
    width: 320,
    padding: 16,
    body: (
      <div className="space-y-3">
        <div>
          <div className="font-medium text-text-primary text-[13px]">
            Value — how far the goal has moved
          </div>
          <p className="text-text-primary text-[13px] leading-[1.5] mt-1">
            Sum of Impact for finished work, divided by total planned Impact. Delegated tasks count fully — work done is work done.
          </p>
        </div>
        <div>
          <div className="font-medium text-text-primary text-[13px]">
            Effort — your personal workload
          </div>
          <p className="text-text-primary text-[13px] leading-[1.5] mt-1">
            Same math, but delegated tasks count at 20% — you handed off, you didn't do the work yourself. So if Effort is lower than Value, your delegation is paying off.
          </p>
        </div>
      </div>
    ),
  },
};

export const MetricInfoPopover: React.FC<{
  variant: Variant;
  size?: number;
  ariaLabel?: string;
  className?: string;
}> = ({ variant, size, ariaLabel, className }) => {
  const cfg = COPY[variant];
  const iconSize = size ?? (variant === "valueEffort" ? 12 : 14);
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={ariaLabel ?? "More info"}
          className={`inline-flex items-center justify-center text-text-tertiary hover:text-text-secondary transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-accent rounded ${className ?? ""}`}
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
        {cfg.body}
      </PopoverContent>
    </Popover>
  );
};

export default MetricInfoPopover;
