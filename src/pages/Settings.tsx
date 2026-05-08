import React from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { MobileHeader } from "@/components/MobileHeader";
import { PageHeader } from "@/components/PageHeader";
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

export default function Settings() {
  const settings = useStore((s) => s.settings);
  const goals = useStore((s) => s.goals);
  const setDefaultGoal = useStore((s) => s.setDefaultGoal);
  const resetToSeed = useStore((s) => s.resetToSeed);
  const activeGoals = goals.filter((g) => g.status === "active");
  const fileRef = React.useRef<HTMLInputElement>(null);

  const handleReset = () => {
    if (confirm("Reset everything to seed data? This wipes all your changes.")) {
      localStorage.removeItem(STORAGE_KEY);
      resetToSeed();
      toast.success("Reset to seed data");
    }
  };
  const handleExport = () => {
    const raw = localStorage.getItem(STORAGE_KEY);
    const payload = raw ? JSON.parse(raw) : { state: useStore.getState() };
    const stamp = new Date().toISOString().slice(0, 10);
    downloadJSON(`actos-backup-${stamp}.json`, payload);
    toast.success("Backup downloaded");
  };
  const handleImportPick = () => fileRef.current?.click();
  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!confirm(`Import "${file.name}"? This replaces all current data.`)) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const envelope = parsed?.state ? parsed : { state: parsed, version: 0 };
      if (!envelope.state || typeof envelope.state !== "object") throw new Error("Missing state");
      localStorage.setItem(STORAGE_KEY, JSON.stringify(envelope));
      toast.success("Import complete — reloading…");
      setTimeout(() => window.location.reload(), 600);
    } catch (err) {
      console.error(err);
      toast.error("Import failed — invalid JSON");
    }
  };

  return (
    <div className="min-h-screen bg-surface-base text-text-primary">
      <AppSidebar />
      <MobileHeader />
      <main className="app-main page-medium">
        <PageHeader title="Settings" />

        <div className="mt-8 space-y-10 max-w-[720px]">
          {/* Account */}
          <section>
            <div className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-tertiary mb-3">
              ACCOUNT
            </div>
            <div className="text-[13px] text-text-secondary mb-2">
              Signed in as <span className="text-text-primary">{settings.userEmail ?? "ak@email"}</span>
            </div>
          </section>

          {/* Default goal */}
          <section>
            <div className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-tertiary mb-3">
              DEFAULT GOAL
            </div>
            <div className="text-[13px] text-text-tertiary mb-2">
              New ideas and unattached actions land here.
            </div>
            <select
              value={settings.defaultGoalId ?? ""}
              onChange={(e) => setDefaultGoal(e.target.value)}
              className="w-full max-w-[400px] bg-surface-hover rounded-[4px] px-3 py-2 text-[13px] text-text-primary outline-none border border-transparent focus:border-border-default"
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
            <div className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-tertiary mb-3">
              DATA
            </div>
            <div className="text-[13px] text-text-tertiary mb-3">
              Export a JSON snapshot of every goal, project, action, ritual, idea, and day entry.
              Import replaces all current data — make a backup first.
            </div>
            <div className="flex items-center gap-2 flex-wrap">
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
            <div className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-tertiary mb-3">
              DANGER ZONE
            </div>
            <button
              type="button"
              onClick={handleReset}
              className="h-9 px-4 text-[13px] font-medium rounded-[4px] border border-[hsl(var(--text-warning))] text-text-warning hover:bg-surface-hover transition-colors"
            >
              Reset to seed data
            </button>
            <div className="text-[13px] text-text-tertiary mt-2">
              Wipes localStorage and restores the demo dataset.
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
