// Settings sheet — layer toggles, default goal, reset to seed.
// Mounted globally; opened by setting ui.activePanel.kind = "settings"… but
// for simplicity here it's controlled locally via an internal open flag and
// triggered from the Sidebar.

import React from "react";
import { useTranslation } from "react-i18next";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useStore } from "@/store/useStore";
import { useGoalsQuery } from "@/lib/queries/useGoals";
import { toast } from "sonner";

const STORAGE_KEY = "actos-store";

function downloadJSON(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

interface SettingsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsPanel({ open, onOpenChange }: SettingsPanelProps) {
  const { t } = useTranslation();
  const settings = useStore((s) => s.settings);
  const goals = useGoalsQuery().data ?? [];
  const setDefaultGoal = useStore((s) => s.setDefaultGoal);

  const activeGoals = goals.filter((g) => g.status === "active");

  const handleReset = () => {
    if (confirm(t("settings.panel.confirm.reset"))) {
      try {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem("actos-query-cache");
      } catch {
        /* ignore */
      }
      toast.success(t("settings.panel.toast.reset"));
      onOpenChange(false);
      // Reload to re-hydrate caches from Supabase.
      setTimeout(() => window.location.reload(), 150);
    }
  };

  const handleExport = () => {
    const raw = localStorage.getItem(STORAGE_KEY);
    const payload = raw ? JSON.parse(raw) : { state: useStore.getState() };
    const stamp = new Date().toISOString().slice(0, 10);
    downloadJSON(`actos-backup-${stamp}.json`, payload);
    toast.success(t("settings.panel.toast.exported"));
  };

  const fileRef = React.useRef<HTMLInputElement>(null);
  const handleImportPick = () => fileRef.current?.click();
  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!confirm(t("settings.panel.confirm.import", { name: file.name }))) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const envelope = parsed?.state ? parsed : { state: parsed, version: 0 };
      if (!envelope.state || typeof envelope.state !== "object") {
        throw new Error("Missing state field");
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(envelope));
      toast.success(t("settings.panel.toast.imported"));
      setTimeout(() => window.location.reload(), 600);
    } catch (err) {
      console.error(err);
      toast.error(t("settings.panel.toast.importFailed"));
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[420px] sm:max-w-[420px] bg-surface-elevated border-l border-border-subtle">
        <SheetHeader>
          <SheetTitle className="text-text-primary text-[16px] font-medium">{t("settings.panel.title")}</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-8">

          {/* Default goal */}
          <section>
            <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-text-tertiary mb-3">
              {t("settings.panel.defaultGoal.label")}
            </div>
            <div className="text-[11px] text-text-tertiary mb-2">
              {t("settings.panel.defaultGoal.hint")}
            </div>
            <select
              value={settings.defaultGoalId ?? ""}
              onChange={(e) => setDefaultGoal(e.target.value)}
              className="w-full bg-surface-hover rounded-[4px] px-3 py-2 text-[13px] text-text-primary outline-none border border-transparent focus:border-border-default"
            >
              {activeGoals.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.title}
                </option>
              ))}
            </select>
          </section>

          {/* Backup */}
          <section>
            <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-text-tertiary mb-3">
              {t("settings.panel.backup.label")}
            </div>
            <div className="text-[11px] text-text-tertiary mb-3">
              {t("settings.panel.backup.hint")}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExport}
                className="h-9 px-4 text-[13px] font-medium rounded-[4px] border border-border-default text-text-primary hover:border-[hsl(var(--accent))] hover:bg-surface-hover transition-colors"
              >
                {t("settings.panel.backup.export")}
              </button>
              <button
                type="button"
                onClick={handleImportPick}
                className="h-9 px-4 text-[13px] font-medium rounded-[4px] border border-border-default text-text-primary hover:border-[hsl(var(--accent))] hover:bg-surface-hover transition-colors"
              >
                {t("settings.panel.backup.import")}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={handleImportFile}
              />
            </div>
          </section>

          {/* Danger */}
          <section>
            <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-text-tertiary mb-3">
              {t("settings.panel.danger.label")}
            </div>
            <button
              type="button"
              onClick={handleReset}
              className="h-9 px-4 text-[13px] font-medium rounded-[4px] border border-[hsl(var(--text-warning))] text-text-warning hover:bg-surface-hover transition-colors"
            >
              {t("settings.panel.danger.reset")}
            </button>
            <div
              className="text-[11px] text-text-tertiary mt-2 [&_code]:font-mono [&_code]:text-text-secondary"
              dangerouslySetInnerHTML={{ __html: t("settings.panel.danger.hintHtml") }}
            />
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
