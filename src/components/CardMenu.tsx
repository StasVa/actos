// Reusable "..." context menu for cards (Goal cards, Project cards, etc.).
//
// Renders a kebab button that, when clicked, opens a small popover. Critical:
// clicks on the trigger and inside the popover do NOT propagate up to the
// parent card's click handler — so the card's navigation behavior stays
// untouched while the menu provides edit/destructive actions.
//
// Usage:
//   <CardMenu items={[{ label: "Edit", onSelect: ... }, { label: "Drop",
//   destructive: true, onSelect: ... }]} />

import * as React from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export type CardMenuItem = {
  label: string;
  onSelect: () => void;
  destructive?: boolean;
  disabled?: boolean;
};

export const CardMenu: React.FC<{
  items: CardMenuItem[];
  ariaLabel?: string;
}> = ({ items, ariaLabel = "More" }) => {
  const [open, setOpen] = React.useState(false);

  const stop = (e: React.SyntheticEvent) => {
    e.stopPropagation();
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={ariaLabel}
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            setOpen((v) => !v);
          }}
          onMouseDown={stop}
          onPointerDown={stop}
          className="inline-flex items-center justify-center w-6 h-6 rounded-[3px] text-text-tertiary hover:bg-surface-hover hover:text-text-primary transition-colors leading-none"
        >
          <span className="text-[14px] -mt-1">⋯</span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={4}
        onClick={stop}
        onMouseDown={stop}
        onPointerDown={stop}
        className="w-44 p-1 bg-surface-elevated border-border-subtle"
      >
        <div className="flex flex-col">
          {items.map((it, i) => (
            <button
              key={i}
              type="button"
              disabled={it.disabled}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                if (it.disabled) return;
                setOpen(false);
                it.onSelect();
              }}
              className="text-left text-[12px] px-2 py-1.5 rounded-[3px] hover:bg-surface-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              style={{
                color: it.destructive
                  ? "hsl(var(--text-warning))"
                  : "hsl(var(--text-primary))",
              }}
            >
              {it.label}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};
