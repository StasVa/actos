import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
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
  label,
}: Props<T>) {
  const { t } = useTranslation();
  const resolvedLabel = label ?? t("common.sort");
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number; minWidth: number } | null>(null);
  const current = options.find((o) => o.value === value);

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;
    const r = triggerRef.current.getBoundingClientRect();
    const minWidth = 180;
    setPos({
      top: r.bottom + 4,
      left: Math.max(8, r.right - minWidth),
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
    <div className="relative inline-block shrink-0">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1 text-[12px] text-text-secondary hover:text-text-primary transition-colors whitespace-nowrap"
      >
        <span className="whitespace-nowrap">
          {resolvedLabel}: {current?.label ?? ""}
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
