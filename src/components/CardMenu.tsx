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
  const rootRef = React.useRef<HTMLDivElement | null>(null);

  const stop = (e: React.SyntheticEvent) => {
    e.stopPropagation();
  };

  React.useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative" onClick={stop} onMouseDown={stop} onPointerDown={stop}>
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

      {open && (
        <div
          className="absolute right-0 top-[calc(100%+4px)] z-50 w-44 rounded-[6px] border border-border-subtle bg-surface-elevated p-1 shadow-md"
          onClick={stop}
          onMouseDown={stop}
          onPointerDown={stop}
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
        </div>
      )}
    </div>
  );
};
