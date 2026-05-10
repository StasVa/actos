import React from "react";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n";

const SUPPORTED_LANGS = ["en", "de", "es", "ru"] as const;
type SupportedLang = (typeof SUPPORTED_LANGS)[number];
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
  const { t } = useTranslation();
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
    if (!confirm(t("settings.clearSampleData.confirm"))) return;
    clearSampleData();
    toast.success(t("settings.toast.sampleCleared"));
  };

  const handleReset = () => {
    if (confirm(t("settings.confirm.reset"))) {
      localStorage.removeItem(STORAGE_KEY);
      resetToSeed();
      toast.success(t("settings.toast.resetSeed"));
    }
  };
  const handleExport = () => {
    const raw = localStorage.getItem(STORAGE_KEY);
    const payload = raw ? JSON.parse(raw) : { state: useStore.getState() };
    const stamp = new Date().toISOString().slice(0, 10);
    downloadJSON(`actos-backup-${stamp}.json`, payload);
    toast.success(t("settings.toast.backupDownloaded"));
  };
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
      if (!envelope.state || typeof envelope.state !== "object") throw new Error("Missing state");
      localStorage.setItem(STORAGE_KEY, JSON.stringify(envelope));
      toast.success(t("settings.panel.toast.imported"));
      setTimeout(() => window.location.reload(), 600);
    } catch (err) {
      console.error(err);
      toast.error(t("settings.panel.toast.importFailed"));
    }
  };

  return (
    <div className="min-h-screen bg-surface-base text-text-primary">
      <AppSidebar />
      <main className="app-main page-medium">
        <PageHeader title={t("settings.page.title")} />

        <div className="mt-8 space-y-10 max-w-[720px]">
          {/* Account */}
          <section>
            <div className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-tertiary mb-3">
              {t("settings.account.heading").toUpperCase()}
            </div>
            <div className="text-[13px] text-text-secondary mb-4">
              {t("settings.account.signedInAs")} <span className="text-text-primary">{settings.userEmail ?? "ak@email"}</span>
            </div>

            {/* Demo controls */}
            <div
              className="rounded-[6px] bg-surface-raised"
              style={{ padding: 16, border: "1px solid hsl(var(--border-subtle))" }}
            >
              <div className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-tertiary mb-3">
                {t("settings.demo.heading").toUpperCase()}
              </div>

              <ToggleRow
                label={t("settings.account.allInTier")}
                checked={settings.subscriptionTier === "all-in"}
                onChange={(v) => setSubscriptionTier(v ? "all-in" : "free")}
              />
              <div className="my-3 border-t border-border-subtle" />
              <ToggleRow
                label={t("settings.adminToggle.label")}
                description={t("settings.adminToggle.description")}
                checked={!!settings.showAdminTools}
                onChange={(v) => setShowAdminTools(v)}
              />
            </div>

            {/* Theme */}
            <div className="mt-6">
              <div className="text-[13px] text-text-primary mb-1">{t("settings.theme.label")}</div>
              <div className="text-[12px] text-text-tertiary mb-2">
                {t("settings.theme.systemHint")}
              </div>
              <div
                role="radiogroup"
                aria-label={t("settings.theme.ariaLabel")}
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
                      className="px-4 text-[13px] transition-colors"
                      style={{
                        background: active ? "hsl(var(--surface-hover))" : "transparent",
                        color: active ? "hsl(var(--text-primary))" : "hsl(var(--text-secondary))",
                        borderLeft: i === 0 ? "none" : "1px solid hsl(var(--border-default))",
                        minWidth: 80,
                      }}
                    >
                      {t(`settings.theme.${opt}`)}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Language */}
          <section>
            <div className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-tertiary mb-3">
              {t("settings.language.heading").toUpperCase()}
            </div>
            <div className="text-[13px] text-text-tertiary mb-2">
              {t("settings.language.description")}
            </div>
            <select
              value={(SUPPORTED_LANGS as readonly string[]).includes(i18n.language) ? i18n.language : "en"}
              onChange={(e) => i18n.changeLanguage(e.target.value as SupportedLang)}
              className="w-full max-w-[400px] bg-surface-hover rounded-[4px] px-3 py-2 text-[13px] text-text-primary outline-none border border-transparent focus:border-border-default"
            >
              {SUPPORTED_LANGS.map((lng) => (
                <option key={lng} value={lng}>
                  {t(`settings.language.option.${lng}`)}
                </option>
              ))}
            </select>
          </section>

          {/* Default goal */}
          <section>
            <div className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-tertiary mb-3">
              {t("settings.panel.defaultGoal.label")}
            </div>
            <div className="text-[13px] text-text-tertiary mb-2">
              {t("settings.panel.defaultGoal.hint")}
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
              {t("settings.data.heading").toUpperCase()}
            </div>
            <div className="text-[13px] text-text-tertiary mb-3">
              {t("settings.panel.backup.hint")}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
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

            {hasSample && (
              <div className="mt-6 pt-5 border-t border-border-subtle">
                <div className="text-[13px] text-text-primary mb-1">{t("settings.clearSampleData.heading")}</div>
                <div className="text-[12px] text-text-tertiary mb-3">
                  {t("settings.clearSampleData.description")}
                </div>
                <button
                  type="button"
                  onClick={handleClearSample}
                  className="h-9 px-4 text-[13px] font-medium rounded-[4px] border border-border-default text-text-primary hover:border-[hsl(var(--accent))] hover:bg-surface-hover transition-colors"
                >
                  {t("settings.clearSampleData.heading")}
                </button>
              </div>
            )}
          </section>

          {/* Danger */}
          <section>
            <div className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-tertiary mb-3">
              {t("settings.panel.danger.label")}
            </div>
            <button
              type="button"
              onClick={handleReset}
              className="h-9 px-4 text-[13px] font-medium rounded-[4px] border border-[hsl(var(--text-warning))] text-text-warning hover:bg-surface-hover transition-colors"
            >
              {t("settings.panel.danger.reset")}
            </button>
            <div className="text-[13px] text-text-tertiary mt-2">
              {t("settings.danger.hint")}
            </div>
          </section>

          {/* Help · Concepts */}
          <section>
            <div className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-tertiary mb-3">
              {t("settings.help.heading")}
            </div>
            <div className="space-y-4 text-[13px] text-text-secondary leading-[1.6] max-w-[640px]">
              <div>
                <div className="text-text-primary font-medium">{t("settings.help.goal.title")}</div>
                <div>{t("settings.help.goal.examples")}</div>
                <div>{t("settings.help.goal.cap")}</div>
              </div>
              <div>
                <div className="text-text-primary font-medium">{t("settings.help.project.title")}</div>
                <div>{t("settings.help.project.body")}</div>
                <div>{t("settings.help.project.example")}</div>
              </div>
              <div>
                <div className="text-text-primary font-medium">{t("settings.help.action.title")}</div>
                <div>{t("settings.help.action.body")}</div>
                <div>{t("settings.help.action.example")}</div>
              </div>
              <div className="text-text-tertiary italic">
                {t("settings.help.summary")}
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
