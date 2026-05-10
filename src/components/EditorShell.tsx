// Shared shell for entity editors.
// `new` mode → centered modal (640px desktop, bottom sheet < 768px).
// `edit` mode → slide-in panel from the right (480px), legacy behavior.
//
// Includes a discard guard: if the user attempts to close while `dirty` is
// true, an inline confirmation appears in-place (no nested modal).
//
// Inner panels can call `useEditorClose()` to trigger a guarded close from
// their own X/Cancel buttons.

import { createContext, useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useIsMobile } from "@/hooks/use-mobile";

const EditorCloseContext = createContext<() => void>(() => {});

export const useEditorClose = () => useContext(EditorCloseContext);

/** X button that triggers the shell's guarded close. */
export function EditorCloseX() {
  const { t } = useTranslation();
  const requestClose = useEditorClose();
  return (
    <button
      onClick={requestClose}
      className="w-7 h-7 inline-flex items-center justify-center rounded-[4px] text-text-tertiary hover:bg-surface-hover hover:text-text-primary transition-colors"
      aria-label={t("common.close")}
    >
      ✕
    </button>
  );
}

/** "Cancel" link button that triggers the shell's guarded close. */
export function EditorCancelButton({ label }: { label?: string }) {
  const { t } = useTranslation();
  const requestClose = useEditorClose();
  return (
    <button
      onClick={requestClose}
      className="text-[13px] text-text-secondary hover:text-text-primary px-3 py-1.5"
    >
      {label ?? t("common.cancel")}
    </button>
  );
}

export function EditorShell({
  mode,
  dirty,
  onClose,
  children,
}: {
  mode: "new" | "edit";
  dirty: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  const requestClose = () => {
    if (dirty && mode === "new") {
      setConfirmDiscard(true);
      return;
    }
    onClose();
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        if (confirmDiscard) {
          setConfirmDiscard(false);
        } else {
          requestClose();
        }
      }
    };
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dirty, mode, confirmDiscard]);

  // ── EDIT mode → slide-in panel (legacy)
  if (mode === "edit") {
    return (
      <EditorCloseContext.Provider value={requestClose}>
        <div
          className="fixed inset-0 z-[80]"
          style={{ background: "rgba(0,0,0,0.4)" }}
          onClick={requestClose}
        />
        <aside
          className="fixed top-0 right-0 bottom-0 z-[90] w-[480px] max-w-[100vw] bg-surface-base border-l border-border-subtle flex flex-col"
          style={{ boxShadow: "-8px 0 24px rgba(0,0,0,0.3)" }}
        >
          {children}
        </aside>
      </EditorCloseContext.Provider>
    );
  }

  // ── NEW mode → centered modal (or bottom sheet on mobile)
  return (
    <EditorCloseContext.Provider value={requestClose}>
      <div
        className="fixed inset-0 z-[190]"
        style={{
          background: "var(--backdrop)",
          backdropFilter: "blur(2px)",
          WebkitBackdropFilter: "blur(2px)",
        }}
        onClick={requestClose}
      />
      <div
        className={
          isMobile
            ? "fixed inset-x-0 bottom-0 z-[200] max-h-[90vh] bg-surface-elevated border-t border-border-subtle rounded-t-[12px] flex flex-col overflow-hidden"
            : "fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[200] w-[640px] max-w-[calc(100vw-32px)] max-h-[85vh] bg-surface-elevated border border-border-subtle rounded-[6px] flex flex-col overflow-hidden"
        }
        style={{ boxShadow: "0 24px 48px rgba(0,0,0,0.4)" }}
        role="dialog"
        aria-modal="true"
      >
        {isMobile && (
          <div className="flex justify-center pt-2 pb-1 shrink-0">
            <div className="h-1 w-10 rounded-full bg-border-default" />
          </div>
        )}
        {children}

        {/* Inline discard confirmation (covers panel) */}
        {confirmDiscard && (
          <div
            className="absolute inset-0 z-[10] flex items-center justify-center rounded-[6px]"
            style={{ background: "hsl(var(--surface-elevated) / 0.96)" }}
          >
            <div className="text-center px-6 max-w-[420px]">
              <div className="text-[15px] font-medium text-text-primary mb-1">
                Discard unsaved changes?
              </div>
              <div className="text-[13px] text-text-secondary mb-5">
                Your input will be lost.
              </div>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => setConfirmDiscard(false)}
                  className="text-[13px] text-text-secondary hover:text-text-primary px-3 py-1.5"
                >
                  Keep editing
                </button>
                <button
                  onClick={() => {
                    setConfirmDiscard(false);
                    onClose();
                  }}
                  className="text-[13px] font-medium px-3 py-1.5 rounded-[4px]"
                  style={{
                    color: "hsl(var(--text-warning))",
                    background: "hsl(var(--surface-hover))",
                  }}
                >
                  Discard
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </EditorCloseContext.Provider>
  );
}
