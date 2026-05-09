import React from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { PageHeader } from "@/components/PageHeader";
import { useStore } from "@/store/useStore";
import { useThemeChoice, type ThemeChoice } from "@/lib/theme";
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

const ToggleRow: React.FC<{
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}> = ({ label, description, checked, onChange }) => (
  <label className="flex items-start gap-3 cursor-pointer">
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="mt-0.5 shrink-0 rounded-full transition-colors"
      style={{
        width: 32,
        height: 18,
        background: checked ? "hsl(var(--accent))" : "hsl(var(--surface-hover))",
        border: "1px solid hsl(var(--border-subtle))",
        position: "relative",
      }}
    >
      <span
        className="block rounded-full bg-white transition-transform"
        style={{
          width: 12,
          height: 12,
          position: "absolute",
          top: 2,
          left: 2,
          transform: checked ? "translateX(14px)" : "translateX(0)",
        }}
      />
    </button>
    <div className="flex-1">
      <div className="text-[13px] text-text-primary">{label}</div>
      {description && (
        <div className="text-[12px] text-text-tertiary mt-0.5">{description}</div>
      )}
    </div>
  </label>
);

export default function Settings() {
  const settings = useStore((s) => s.settings);
  const goals = useStore((s) => s.goals);
  const setDefaultGoal = useStore((s) => s.setDefaultGoal);
  const setShowAdminTools = useStore((s) => s.setShowAdminTools);
  const setSubscriptionTier = useStore((s) => s.setSubscriptionTier);
  const resetToSeed = useStore((s) => s.resetToSeed);
  const clearSampleData = useStore((s) => s.clearSampleData);
  const hasSample = useStore((s) =>
    s.goals.some((g) => g.isSample) ||
    s.projects.some((p) => p.isSample) ||
    s.actions.some((a) => a.isSample) ||
    s.rituals.some((r) => r.isSample) ||
    s.ideas.some((i) => i.isSample),
  );
  const activeGoals = goals.filter((g) => g.status === "active");
  const [themeChoice, , setThemeChoice] = useThemeChoice();
  const fileRef = React.useRef<HTMLInputElement>(null);

  const handleClearSample = () => {
    if (!confirm("Clear all sample goals, projects, actions, rituals, and ideas? This can't be undone.")) return;
    clearSampleData();
    toast.success("Sample data cleared.");
  };

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
      <main className="app-main page-medium">
        <PageHeader title="Settings" />

        <div className="mt-8 space-y-10 max-w-[720px]">
          {/* Account */}
          <section>
            <div className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-tertiary mb-3">
              ACCOUNT
            </div>
            <div className="text-[13px] text-text-secondary mb-4">
              Signed in as <span className="text-text-primary">{settings.userEmail ?? "ak@email"}</span>
            </div>

            {/* Demo controls */}
            <div
              className="rounded-[6px] bg-surface-raised"
              style={{ padding: 16, border: "1px solid hsl(var(--border-subtle))" }}
            >
              <div className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-tertiary mb-3">
                DEMO CONTROLS (WILL BE REMOVED)
              </div>

              <ToggleRow
                label="Pro tier (preview Pro UI)"
                checked={settings.subscriptionTier === "pro"}
                onChange={(v) => setSubscriptionTier(v ? "pro" : "free")}
              />
              <div className="my-3 border-t border-border-subtle" />
              <ToggleRow
                label="Show admin tools"
                description="Adds /admin/components link to the user menu."
                checked={!!settings.showAdminTools}
                onChange={(v) => setShowAdminTools(v)}
              />
            </div>

            {/* Theme */}
            <div className="mt-6">
              <div className="text-[13px] text-text-primary mb-1">Theme</div>
              <div className="text-[12px] text-text-tertiary mb-2">
                Defaults to your system setting.
              </div>
              <div
                role="radiogroup"
                aria-label="Theme"
                className="inline-flex items-stretch rounded-[4px] overflow-hidden"
                style={{ border: "1px solid hsl(var(--border-default))", height: 32 }}
              >
                {(["system", "light", "dark"] as ThemeChoice[]).map((opt, i) => {
                  const active = themeChoice === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => setThemeChoice(opt)}
                      className="px-4 text-[13px] capitalize transition-colors"
                      style={{
                        background: active ? "hsl(var(--surface-hover))" : "transparent",
                        color: active ? "hsl(var(--text-primary))" : "hsl(var(--text-secondary))",
                        borderLeft: i === 0 ? "none" : "1px solid hsl(var(--border-default))",
                        minWidth: 80,
                      }}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
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

            {hasSample && (
              <div className="mt-6 pt-5 border-t border-border-subtle">
                <div className="text-[13px] text-text-primary mb-1">Clear sample data</div>
                <div className="text-[12px] text-text-tertiary mb-3">
                  Removes the sample goals, projects, actions, rituals, and ideas seeded by Setup Wizard. Your own entries stay.
                </div>
                <button
                  type="button"
                  onClick={handleClearSample}
                  className="h-9 px-4 text-[13px] font-medium rounded-[4px] border border-border-default text-text-primary hover:border-[hsl(var(--accent))] hover:bg-surface-hover transition-colors"
                >
                  Clear sample data
                </button>
              </div>
            )}
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
