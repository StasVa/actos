import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

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
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number; minWidth: number } | null>(null);
  const isActive = value !== defaultValue;
  const current = options.find((o) => o.value === value);

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;
    const r = triggerRef.current.getBoundingClientRect();
    const minWidth = Math.max(160, r.width);
    setPos({
      top: r.bottom + 4,
      left: r.left,
      minWidth,
    });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t) || menuRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onScroll = () => setOpen(false);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
    };
  }, [open]);

  return (
    <div className="relative shrink-0">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex items-center gap-1.5 rounded-[4px] border bg-transparent transition-colors whitespace-nowrap shrink-0 ${
          isActive
            ? "border-[hsl(var(--accent))]"
            : "border-border-subtle hover:border-border-default hover:bg-surface-hover"
        }`}
        style={{ padding: "6px 10px" }}
      >
        <span className="font-mono uppercase tracking-[0.06em] text-text-tertiary whitespace-nowrap" style={{ fontSize: 10 }}>
          {label}:
        </span>
        {current?.dot && (
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: current.dot }} />
        )}
        <span
          className={`text-[13px] text-text-primary whitespace-nowrap ${isActive ? "font-medium" : ""}`}
        >
          {current?.label ?? ""}
        </span>
        <span className="text-text-tertiary" style={{ fontSize: 10 }}>▾</span>
      </button>
      {open && pos && createPortal(
        <div
          ref={menuRef}
          className="fixed z-[100] bg-surface-elevated border border-border-subtle rounded-[4px] shadow-md"
          style={{ top: pos.top, left: pos.left, minWidth: pos.minWidth, padding: "4px 0" }}
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
        </div>,
        document.body,
      )}
    </div>
  );
}
