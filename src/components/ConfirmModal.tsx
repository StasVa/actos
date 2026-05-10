// Tier 1 confirmation modal — used for non-permanent destructive ops:
// drop project/goal, cancel/drop action, discard idea, archive ritual, etc.
//
// Backdrop click / Esc / Cancel button all close. Confirm button optionally
// styled as warning (amber) for destructive actions.

import { useEffect } from "react";
import { useTranslation } from "react-i18next";

interface ConfirmModalProps {
  open: boolean;
  title: string;
  body?: React.ReactNode;
  cancelLabel?: string;
  confirmLabel?: string;
  destructive?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmModal({
  open,
  title,
  body,
  cancelLabel,
  confirmLabel,
  destructive = false,
  onCancel,
  onConfirm,
}: ConfirmModalProps) {
  const { t } = useTranslation();
  const resolvedCancel = cancelLabel ?? t("common.cancel");
  const resolvedConfirm = confirmLabel ?? t("common.confirm");
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
      if (e.key === "Enter") onConfirm();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onCancel, onConfirm]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
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
        <div className="mt-6 flex items-center justify-end gap-3">
          {resolvedCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="text-[13px] text-text-secondary hover:text-text-primary transition-colors px-3 py-1.5"
            >
              {resolvedCancel}
            </button>
          )}
          <button
            type="button"
            onClick={onConfirm}
            className="text-[13px] font-medium px-3 py-1.5 rounded-[4px] transition-colors"
            style={{
              color: destructive ? "hsl(var(--text-warning))" : "hsl(var(--text-primary))",
              background: "hsl(var(--surface-hover))",
            }}
          >
            {resolvedConfirm}
          </button>
        </div>
      </div>
    </div>
  );
}
