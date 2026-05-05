import React, { useEffect, useRef, useState } from "react";
import { FilterOption } from "./FilterDropdown";

type Props<T extends string> = {
  value: T;
  options: FilterOption<T>[];
  onChange: (v: T) => void;
  label?: string;
};

export function SortDropdown<T extends string>({
  value,
  options,
  onChange,
  label = "Sort",
}: Props<T>) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1 text-[12px] text-text-secondary hover:text-text-primary transition-colors"
      >
        <span>
          {label}: {current?.label ?? ""}
        </span>
        <span className="text-text-tertiary" style={{ fontSize: 10 }}>▾</span>
      </button>
      {open && (
        <div
          className="absolute right-0 z-50 bg-surface-elevated border border-border-subtle rounded-[4px]"
          style={{ top: "calc(100% + 4px)", minWidth: 180, padding: "4px 0" }}
        >
          {options.map((o) => {
            const selected = o.value === value;
            return (
              <button
                key={o.value}
                type="button"
                onClick={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
                className={`w-full flex items-center gap-2 text-left text-[13px] transition-colors ${
                  selected ? "bg-surface-hover" : "hover:bg-surface-hover"
                }`}
                style={{ padding: "6px 12px" }}
              >
                <span
                  className="flex-1 text-text-primary"
                  style={selected ? { color: "hsl(var(--accent))" } : undefined}
                >
                  {o.label}
                </span>
                {selected && (
                  <span style={{ color: "hsl(var(--accent))", fontSize: 12 }}>✓</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
