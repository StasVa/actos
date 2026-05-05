// Settings sheet — layer toggles, default goal, reset to seed.
// Mounted globally; opened by setting ui.activePanel.kind = "settings"… but
// for simplicity here it's controlled locally via an internal open flag and
// triggered from the Sidebar.

import React from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { useStore } from "@/store/useStore";
import { toast } from "sonner";
import type { UserSettings } from "@/types";

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
  { key: "planAndReview", label: "Plan & Review", hint: "Show daily intent / reflection panel." },
  { key: "logEnergy", label: "Log energy", hint: "Capture morning + evening energy scores (1–10)." },
  { key: "logFocus", label: "Log focus", hint: "Capture per-action focus cost." },
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
      localStorage.removeItem("actos-store");
      resetToSeed();
      toast.success("Reset to seed data");
      onOpenChange(false);
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
