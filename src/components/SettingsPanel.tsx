// Settings sheet — layer toggles, default goal, reset to seed.
// Mounted globally; opened by setting ui.activePanel.kind = "settings"… but
// for simplicity here it's controlled locally via an internal open flag and
// triggered from the Sidebar.

import React from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useStore } from "@/store/useStore";
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

const LAYERS: { key: keyof UserSettings["layers"]; label: string; hint: string }[] = [
  { key: "planAndReview", label: "Plan and review your days", hint: "Show daily intent / reflection panel." },
  { key: "logTime", label: "Log time", hint: "Capture per-action time estimates." },
];

export function SettingsPanel({ open, onOpenChange }: SettingsPanelProps) {
  const settings = useStore((s) => s.settings);
  const goals = useStore((s) => s.goals);
  const toggleLayer = useStore((s) => s.toggleLayer);
  const setDefaultGoal = useStore((s) => s.setDefaultGoal);
  const resetToSeed = useStore((s) => s.resetToSeed);

  const activeGoals = goals.filter((g) => g.status === "active");

  const handleReset = () => {
    if (
      confirm("Reset everything to seed data? This wipes all your changes.")
    ) {
      localStorage.removeItem(STORAGE_KEY);
      resetToSeed();
      toast.success("Reset to seed data");
      onOpenChange(false);
    }
  };

  const handleExport = () => {
    const raw = localStorage.getItem(STORAGE_KEY);
    const payload = raw ? JSON.parse(raw) : { state: useStore.getState() };
    const stamp = new Date().toISOString().slice(0, 10);
    downloadJSON(`actos-backup-${stamp}.json`, payload);
    toast.success("Backup downloaded");
  };

  const fileRef = React.useRef<HTMLInputElement>(null);
  const handleImportPick = () => fileRef.current?.click();
  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!confirm(`Import "${file.name}"? This replaces all current data.`)) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      // Accept either a raw zustand-persist envelope { state, version } or a bare state object.
      const envelope = parsed?.state ? parsed : { state: parsed, version: 0 };
      if (!envelope.state || typeof envelope.state !== "object") {
        throw new Error("Missing state field");
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(envelope));
      toast.success("Import complete — reloading…");
      setTimeout(() => window.location.reload(), 600);
    } catch (err) {
      console.error(err);
      toast.error("Import failed — invalid JSON");
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[420px] sm:max-w-[420px] bg-surface-elevated border-l border-border-subtle">
        <SheetHeader>
          <SheetTitle className="text-text-primary text-[16px] font-medium">Settings</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-8">
          {/* Layers */}
          <section>
            <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-text-tertiary mb-3">
              LAYERS
            </div>
            <div className="space-y-3">
              {LAYERS.map((l) => (
                <div
                  key={l.key}
                  className="flex items-start justify-between gap-3 py-2"
                >
                  <div className="min-w-0">
                    <div className="text-[13px] text-text-primary">{l.label}</div>
                    <div className="text-[11px] text-text-tertiary mt-0.5">{l.hint}</div>
                  </div>
                  <Switch
                    checked={settings.layers[l.key]}
                    onCheckedChange={(v) => toggleLayer(l.key, v)}
                  />
                </div>
              ))}
            </div>
          </section>

          {/* Default goal */}
          <section>
            <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-text-tertiary mb-3">
              DEFAULT GOAL
            </div>
            <div className="text-[11px] text-text-tertiary mb-2">
              New ideas and unattached actions land here.
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
              BACKUP
            </div>
            <div className="text-[11px] text-text-tertiary mb-3">
              Export a JSON snapshot of every goal, project, action, ritual, idea, and day entry.
              Import replaces all current data — make a backup first.
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExport}
                className="h-9 px-4 text-[13px] font-medium rounded-[4px] border border-border-default text-text-primary hover:border-[hsl(var(--accent))] hover:bg-surface-hover transition-colors"
              >
                Export JSON
              </button>
              <button
                type="button"
                onClick={handleImportPick}
                className="h-9 px-4 text-[13px] font-medium rounded-[4px] border border-border-default text-text-primary hover:border-[hsl(var(--accent))] hover:bg-surface-hover transition-colors"
              >
                Import JSON
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
              DANGER ZONE
            </div>
            <button
              type="button"
              onClick={handleReset}
              className="h-9 px-4 text-[13px] font-medium rounded-[4px] border border-[hsl(var(--text-warning))] text-text-warning hover:bg-surface-hover transition-colors"
            >
              Reset to seed data
            </button>
            <div className="text-[11px] text-text-tertiary mt-2">
              Wipes localStorage and restores the demo dataset. You can also run{" "}
              <code className="font-mono text-text-secondary">__resetStore()</code> in the console.
            </div>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
