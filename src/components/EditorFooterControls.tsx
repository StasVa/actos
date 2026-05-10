// Shared footer controls for entity edit modals (Action, Ritual, ...).
//
// Exports:
//   - SaveIndicator      — "Saved" / "Saving..." / "Save failed" pill
//   - useSaveIndicator   — hook returning { state, markEditing }
//   - EditorOverflowMenu — "..." popover with Duplicate / Drop / Delete rows
//   - DeleteTypeConfirm  — Tier-2 modal requiring user to type DELETE
//   - MarkDoneButton     — green-tinted Mark-done button with Check icon

import { useEffect, useRef, useState } from "react";
import { Check, Copy, MoreHorizontal, Trash2, XCircle, type LucideIcon } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// ─────────────────── Save indicator ───────────────────

export type SaveState = "saved" | "saving" | "justSaved" | "failed";

/** Tracks an "auto-save" lifecycle visualization. Call markEditing() on every
 *  user input — after `idleMs` of silence the state transitions to
 *  "justSaved" then settles to "saved". */
export function useSaveIndicator(idleMs = 500, flashMs = 800) {
  const [state, setState] = useState<SaveState>("saved");
  const idleTimer = useRef<number | null>(null);
  const flashTimer = useRef<number | null>(null);

  const markEditing = () => {
    if (flashTimer.current) {
      window.clearTimeout(flashTimer.current);
      flashTimer.current = null;
    }
    setState("saving");
    if (idleTimer.current) window.clearTimeout(idleTimer.current);
    idleTimer.current = window.setTimeout(() => {
      setState("justSaved");
      flashTimer.current = window.setTimeout(() => {
        setState("saved");
        flashTimer.current = null;
      }, flashMs);
    }, idleMs);
  };

  const markFailed = () => {
    if (idleTimer.current) window.clearTimeout(idleTimer.current);
    if (flashTimer.current) window.clearTimeout(flashTimer.current);
    setState("failed");
  };

  useEffect(() => {
    return () => {
      if (idleTimer.current) window.clearTimeout(idleTimer.current);
      if (flashTimer.current) window.clearTimeout(flashTimer.current);
    };
  }, []);

  return { state, markEditing, markFailed, setState };
}

export function SaveIndicator({
  state,
  onRetry,
}: {
  state: SaveState;
  onRetry?: () => void;
}) {
  if (state === "failed") {
    return (
      <div
        className="inline-flex items-center gap-1 text-[12px]"
        style={{ color: "hsl(var(--text-warning))", fontFamily: "Inter, sans-serif" }}
      >
        <span>Save failed</span>
        <span style={{ color: "hsl(var(--text-tertiary))" }}>·</span>
        <button
          type="button"
          onClick={onRetry}
          className="underline hover:no-underline"
          style={{ color: "hsl(var(--text-warning))" }}
        >
          retry
        </button>
      </div>
    );
  }

  if (state === "saving") {
    return (
      <div
        className="inline-flex items-center gap-1.5 text-[12px]"
        style={{ color: "hsl(var(--text-tertiary))", fontFamily: "Inter, sans-serif" }}
        aria-label="Saving"
      >
        <span
          className="inline-block w-1.5 h-1.5 rounded-full animate-pulse"
          style={{ background: "hsl(var(--text-tertiary))" }}
        />
        <span>Saving…</span>
      </div>
    );
  }

  const color =
    state === "justSaved" ? "hsl(var(--accent))" : "hsl(var(--text-tertiary))";
  return (
    <div
      className="inline-flex items-center gap-1 text-[12px] transition-colors"
      style={{ color, fontFamily: "Inter, sans-serif" }}
      aria-label="Saved"
    >
      <Check size={12} />
      <span>Saved</span>
    </div>
  );
}

// ─────────────────── Overflow menu ───────────────────

export type OverflowMenuItem = {
  label: string;
  icon: LucideIcon;
  onSelect: () => void;
  destructive?: boolean;
  /** Insert a divider above this item. */
  dividerAbove?: boolean;
};

export function EditorOverflowMenu({
  items,
  ariaLabel = "More actions",
}: {
  items: OverflowMenuItem[];
  ariaLabel?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={ariaLabel}
          className="w-8 h-8 inline-flex items-center justify-center rounded-[4px] text-text-tertiary hover:bg-surface-hover hover:text-text-primary transition-colors"
        >
          <MoreHorizontal size={16} />
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="start"
        sideOffset={6}
        className="z-[210] w-[200px] p-1 bg-surface-elevated border border-border-subtle rounded-[6px]"
      >
        {items.map((it, i) => {
          const Icon = it.icon;
          return (
            <div key={i}>
              {it.dividerAbove && (
                <div
                  className="my-1 h-px"
                  style={{ background: "hsl(var(--border-subtle))" }}
                />
              )}
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  it.onSelect();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-[13px] rounded-[3px] hover:bg-surface-hover transition-colors text-left"
                style={{
                  color: it.destructive
                    ? "hsl(var(--text-warning))"
                    : "hsl(var(--text-primary))",
                }}
              >
                <Icon size={14} />
                <span>{it.label}</span>
              </button>
            </div>
          );
        })}
      </PopoverContent>
    </Popover>
  );
}

/** Convenience helpers for standard items. */
export const overflowDuplicate = (onSelect: () => void): OverflowMenuItem => ({
  label: "Duplicate",
  icon: Copy,
  onSelect,
});
export const overflowDrop = (onSelect: () => void, label = "Drop"): OverflowMenuItem => ({
  label,
  icon: XCircle,
  onSelect,
});
export const overflowDelete = (onSelect: () => void): OverflowMenuItem => ({
  label: "Delete",
  icon: Trash2,
  onSelect,
  destructive: true,
  dividerAbove: true,
});

// ─────────────────── Tier-2 delete confirmation ───────────────────

export function DeleteTypeConfirm({
  open,
  title,
  body,
  keyword = "DELETE",
  confirmLabel = "Delete",
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  body?: React.ReactNode;
  keyword?: string;
  confirmLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const [text, setText] = useState("");
  useEffect(() => {
    if (!open) setText("");
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;
  const matches = text.trim() === keyword;

  return (
    <div
      className="fixed inset-0 z-[220] flex items-center justify-center"
      style={{ background: "var(--backdrop)" }}
      onClick={onCancel}
    >
      <div
        className="w-[440px] max-w-[90vw] bg-surface-elevated border border-border-subtle rounded-[6px] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-[16px] font-medium text-text-primary">{title}</h2>
        {body && (
          <div className="mt-3 text-[13px] text-text-secondary leading-[1.5]">{body}</div>
        )}
        <div className="mt-4">
          <label className="block text-[12px] text-text-secondary mb-1.5">
            Type <span className="font-mono text-text-primary">{keyword}</span> to confirm
          </label>
          <input
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && matches) onConfirm();
            }}
            className="w-full bg-surface-raised border border-border-subtle rounded-[4px] px-2 py-1.5 text-[13px] text-text-primary outline-none"
            placeholder={keyword}
          />
        </div>
        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="text-[13px] text-text-secondary hover:text-text-primary transition-colors px-3 py-1.5"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!matches}
            onClick={onConfirm}
            className="text-[13px] font-medium px-3 py-1.5 rounded-[4px] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              color: "hsl(var(--text-warning))",
              background: "hsl(var(--surface-hover))",
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────── Mark done button ───────────────────

export function MarkDoneButton({
  onClick,
  disabled,
  disabledTooltip,
  label = "Mark done",
}: {
  onClick: () => void;
  disabled?: boolean;
  disabledTooltip?: string;
  label?: string;
}) {
  const button = (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-disabled={disabled}
      className="inline-flex items-center gap-1.5 text-[13px] font-medium px-3 py-1.5 rounded-[4px] transition-colors disabled:cursor-not-allowed"
      style={{
        background: disabled
          ? "hsl(var(--state-active) / 0.35)"
          : "hsl(var(--state-active))",
        color: "hsl(var(--surface-base))",
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.background = "hsl(var(--state-active) / 0.88)";
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          e.currentTarget.style.background = "hsl(var(--state-active))";
        }
      }}
    >
      <Check size={16} />
      <span>{label}</span>
    </button>
  );

  if (!disabled || !disabledTooltip) return button;

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-block">{button}</span>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-[12px]">
          {disabledTooltip}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
