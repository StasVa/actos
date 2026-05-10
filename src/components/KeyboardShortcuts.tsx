// Global keyboard shortcuts + help overlay.
//
// Listens at document level; ignores keystrokes when focus is in an editable
// field or when a modifier (cmd/ctrl/alt) is held (those belong to ⌘K etc.).
//
// Shortcuts:
//   ?            Toggle help overlay
//   n            New action (opens ActionEditor in "new" mode)
//   g h          Go Home
//   g i          Go to Ideas
//   g r          Go to Rituals
//   g a          Go to All actions
//   g p          Go to All projects
//   g d          Go to All delegated
//   Esc          Close help overlay

import React from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useStore } from "@/store/useStore";
import { hasActiveGoal } from "@/lib/goalGuard";

const NAV_PATHS: Record<string, string> = {
  t: "/today",
  h: "/today",
  s: "/progress",
  o: "/goals",
  p: "/projects",
  a: "/actions",
  d: "/delegated",
  r: "/rituals",
  i: "/ideas",
  v: "/reviews",
};

function isEditableTarget(t: EventTarget | null): boolean {
  if (!(t instanceof HTMLElement)) return false;
  const tag = t.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (t.isContentEditable) return true;
  return false;
}

export function KeyboardShortcuts() {
  const { t } = useTranslation();
  const [helpOpen, setHelpOpen] = React.useState(false);
  const navigate = useNavigate();
  const openPanel = useStore((s) => s.openPanel);
  const gPendingRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (isEditableTarget(e.target)) return;

      const key = e.key;

      // ? — help (Shift+/ on US layouts produces "?")
      if (key === "?") {
        e.preventDefault();
        setHelpOpen((o) => !o);
        return;
      }

      // Esc closes help; otherwise let other handlers see it.
      if (key === "Escape" && helpOpen) {
        setHelpOpen(false);
        return;
      }

      // g-prefix nav
      if (gPendingRef.current !== null) {
        const path = NAV_PATHS[key.toLowerCase()];
        window.clearTimeout(gPendingRef.current);
        gPendingRef.current = null;
        if (path) {
          e.preventDefault();
          navigate(path);
        }
        return;
      }

      if (key === "g") {
        gPendingRef.current = window.setTimeout(() => {
          gPendingRef.current = null;
        }, 1200);
        return;
      }

      if (key === "n") {
        e.preventDefault();
        if (!hasActiveGoal()) { navigate("/onboarding/goal"); return; }
        openPanel({ kind: "action", mode: "new" });
        return;
      }
    };

    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      if (gPendingRef.current !== null) window.clearTimeout(gPendingRef.current);
    };
  }, [navigate, openPanel, helpOpen]);

  return (
    <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
      <DialogContent className="bg-surface-elevated border-border-subtle max-w-md">
        <DialogHeader>
          <DialogTitle className="text-text-primary text-[15px] font-medium">
            {t("shortcuts.title")}
          </DialogTitle>
        </DialogHeader>
        <div className="mt-2 space-y-4 text-[13px] text-text-secondary">
          <Section title={t("shortcuts.global")}>
            <Row keys={["⌘", "K"]} label={t("shortcuts.search")} />
            <Row keys={["?"]} label={t("shortcuts.help")} />
            <Row keys={["n"]} label={t("shortcuts.newAction")} />
            <Row keys={["Esc"]} label={t("shortcuts.close")} />
          </Section>
          <Section title={t("shortcuts.navigate")}>
            <Row keys={["g", "t"]} label={t("nav.today")} />
            <Row keys={["g", "s"]} label={t("progress.page.title")} />
            <Row keys={["g", "o"]} label={t("nav.goals")} />
            <Row keys={["g", "p"]} label={t("nav.projects")} />
            <Row keys={["g", "a"]} label={t("nav.actions")} />
            <Row keys={["g", "d"]} label={t("nav.delegated")} />
            <Row keys={["g", "r"]} label={t("nav.rituals")} />
            <Row keys={["g", "i"]} label={t("nav.ideas")} />
            <Row keys={["g", "v"]} label={t("nav.reviews")} />
          </Section>
        </div>
      </DialogContent>
    </Dialog>
  );
}

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div>
    <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-text-tertiary mb-2">
      {title}
    </div>
    <div className="space-y-1.5">{children}</div>
  </div>
);

const Row: React.FC<{ keys: string[]; label: string }> = ({ keys, label }) => (
  <div className="flex items-center justify-between">
    <span>{label}</span>
    <span className="flex items-center gap-1">
      {keys.map((k, i) => (
        <kbd
          key={i}
          className="font-mono text-[11px] px-1.5 py-0.5 rounded-[3px] bg-surface-hover border border-border-subtle text-text-primary"
        >
          {k}
        </kbd>
      ))}
    </span>
  </div>
);
