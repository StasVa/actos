import React, { useEffect, useRef, useState } from "react";

export type FilterOption<T extends string> = {
  value: T;
  label: string;
  dot?: string;
};

type Props<T extends string> = {
  label: string;
  value: T;
  defaultValue: T;
  options: FilterOption<T>[];
  onChange: (v: T) => void;
};

export function FilterDropdown<T extends string>({
  label,
  value,
  defaultValue,
  options,
  onChange,
}: Props<T>) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const isActive = value !== defaultValue;
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
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex items-center gap-1.5 rounded-[4px] border bg-transparent transition-colors ${
          isActive
            ? "border-[hsl(var(--accent))]"
            : "border-border-subtle hover:border-border-default hover:bg-surface-hover"
        }`}
        style={{ padding: "6px 10px" }}
      >
        <span className="font-mono uppercase tracking-[0.06em] text-text-tertiary" style={{ fontSize: 10 }}>
          {label}:
        </span>
        {current?.dot && (
          <span className="w-2 h-2 rounded-full" style={{ background: current.dot }} />
        )}
        <span
          className={`text-[13px] text-text-primary ${isActive ? "font-medium" : ""}`}
        >
          {current?.label ?? ""}
        </span>
        <span className="text-text-tertiary" style={{ fontSize: 10 }}>▾</span>
      </button>
      {open && (
        <div
          className="absolute left-0 z-50 bg-surface-elevated border border-border-subtle rounded-[4px]"
          style={{ top: "calc(100% + 4px)", minWidth: Math.max(160, ref.current?.offsetWidth ?? 0), padding: "4px 0" }}
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
                {o.dot && (
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: o.dot }} />
                )}
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
