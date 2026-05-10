// History lock modal — shown when a Free user clicks a >90d entry on Reviews/Sessions.
// Reused everywhere a lock is encountered.

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

interface LockModalProps {
  open: boolean;
  onClose: () => void;
}

export function LockModal({ open, onClose }: LockModalProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{ background: "var(--backdrop)" }}
      onClick={onClose}
    >
      <div
        className="w-[440px] max-w-[90vw] bg-surface-elevated border border-border-subtle rounded-[6px] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-[16px] font-medium text-text-primary">
          {t("lock.heading")}
        </h2>
        <div className="mt-3 text-[13px] text-text-secondary leading-[1.5]">
          {t("lock.body")}
        </div>
        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="text-[13px] text-text-secondary hover:text-text-primary transition-colors px-3 py-1.5"
          >
            {t("lock.maybeLater")}
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              navigate("/settings/subscription");
            }}
            className="text-[13px] font-medium px-3 py-1.5 rounded-[4px] text-white transition-colors"
            style={{ background: "hsl(var(--accent))" }}
          >
            {t("lock.cta")}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Inline footer hint for charts/lists when Free user has data >90d. */
export function HistoryHint({ children }: { children?: React.ReactNode }) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  return (
    <div
      className="mt-2 text-[12px] text-text-tertiary"
      style={{ fontFamily: "Inter" }}
    >
      {children ?? t("lock.hint.prefix")}
      <button
        type="button"
        onClick={() => navigate("/settings/subscription")}
        className="underline hover:text-text-secondary transition-colors"
      >
        {t("lock.hint.cta")}
      </button>{" "}
      {t("lock.hint.suffix")}
    </div>
  );
}
