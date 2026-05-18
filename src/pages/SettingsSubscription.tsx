import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AppSidebar } from "@/components/AppSidebar";
import { useAuth } from "@/lib/useAuth";
import { useCurrentUserQuery } from "@/lib/queries/useCurrentUser";
import { TierBadge } from "@/components/UserMenu";
import { ConfirmModal } from "@/components/ConfirmModal";
import { toast } from "sonner";

const FREE_FEATURE_KEYS = [
  "subscription.page.free.feature.activeGoal",
  "subscription.page.free.feature.allCurrent",
  "subscription.page.free.feature.history",
  "subscription.page.free.feature.support",
];

const ALL_IN_FEATURE_KEYS = [
  "subscription.page.allIn.feature.activeGoals",
  "subscription.page.allIn.feature.allCurrent",
  "subscription.page.allIn.feature.fullHistory",
  "subscription.page.allIn.feature.support",
  "subscription.page.allIn.feature.future",
];

const Check: React.FC = () => (
  <span style={{ color: "hsl(var(--state-active))", fontWeight: 600 }}>✓</span>
);

const FeatureList: React.FC<{ itemKeys: string[] }> = ({ itemKeys }) => {
  const { t } = useTranslation();
  return (
    <ul className="mt-4 space-y-2 text-[13px] text-text-secondary">
      {itemKeys.map((k) => (
        <li key={k} className="flex items-start gap-2">
          <Check />
          <span>{t(k)}</span>
        </li>
      ))}
    </ul>
  );
};

export default function SettingsSubscription() {
  const { t } = useTranslation();
  const { user, setSubscriptionTier } = useAuth();
  const { data: currentUser } = useCurrentUserQuery();
  const effectiveTier = currentUser?.subscriptionTier ?? user?.subscriptionTier ?? "free";
  const navigate = useNavigate();
  const tier: "free" | "all-in" = effectiveTier === "all-in" ? "all-in" : "free";
  const isAllIn = tier === "all-in";

  const [confirmUpgrade, setConfirmUpgrade] = React.useState(false);
  const [downgradeOpen, setDowngradeOpen] = React.useState(false);
  const [downgradeText, setDowngradeText] = React.useState("");
  const [demoModal, setDemoModal] = React.useState<null | { title: string; body: string }>(null);

  const handleUpgrade = async () => {
    setConfirmUpgrade(false);
    try {
      await setSubscriptionTier("all-in");
      toast.success(t("subscription.page.toast.upgraded"));
      setTimeout(() => navigate("/today"), 400);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to upgrade");
    }
  };

  const handleDowngrade = async () => {
    if (downgradeText.trim().toUpperCase() !== "DOWNGRADE") return;
    try {
      await setSubscriptionTier("free");
      setDowngradeOpen(false);
      setDowngradeText("");
      toast(t("subscription.page.toast.downgraded"));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to downgrade");
    }
  };

  return (
    <div className="min-h-screen bg-surface-base text-text-primary">
      <AppSidebar />
      <main className="app-main page-medium">
        <div className="max-w-[720px]">
          <Link
            to="/settings"
            className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-tertiary hover:text-text-primary transition-colors"
          >
            {t("subscription.page.backToSettings")}
          </Link>
          <h1 className="mt-2 text-[24px] sm:text-[28px] md:text-[32px] font-medium text-text-primary leading-tight">
            {t("subscription.page.title")}
          </h1>
          <div className="mt-2 text-[14px] text-text-secondary">
            {isAllIn ? t("subscription.page.statusAllIn") : t("subscription.page.statusFree")}
          </div>
          <div className="mt-4 border-t border-border-subtle" />

          {/* Free card */}
          <div
            className="mt-6 rounded-[6px] bg-surface-raised"
            style={{
              padding: 24,
              border: "1px solid hsl(var(--border-subtle))",
              opacity: isAllIn ? 0.7 : 1,
            }}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="text-[20px] font-medium text-text-primary">
                {t("subscription.page.free.title")}
              </div>
              <TierBadge tier="free" />
            </div>
            <div
              className="mt-1 font-mono text-[11px] uppercase tracking-[0.06em] text-text-tertiary"
            >
              {isAllIn
                ? t("subscription.page.availableDowngrade")
                : t("subscription.page.activeNoPayment")}
            </div>
            <FeatureList itemKeys={FREE_FEATURE_KEYS} />
            {isAllIn && (
              <button
                type="button"
                onClick={() => setDowngradeOpen(true)}
                className="mt-4 h-9 px-3 text-[13px] rounded-[4px] text-text-tertiary hover:text-text-primary hover:bg-surface-hover transition-colors"
              >
                {t("subscription.page.switchToFree")}
              </button>
            )}
          </div>

          {/* All-In card */}
          <div
            className="mt-4 rounded-[6px] bg-surface-raised"
            style={{
              padding: 24,
              border: "1px solid hsl(var(--accent))",
              boxShadow: "0 0 0 1px hsl(var(--accent) / 0.08)",
            }}
          >
            <div className="flex items-center justify-between gap-3">
              <div
                className="text-[20px] font-medium"
                style={{ color: "hsl(var(--accent))", fontWeight: 600 }}
              >
                {isAllIn
                  ? t("subscription.page.allInPlanTitle")
                  : t("subscription.page.upgradeCta")}
              </div>
              <TierBadge tier="all-in" />
            </div>
            <div className="mt-2 text-[13px] text-text-secondary">
              {isAllIn
                ? t("subscription.page.allInActive", { date: "2026-06-08" })
                : t("subscription.page.everythingWeBuild")}
            </div>
            <FeatureList itemKeys={ALL_IN_FEATURE_KEYS} />

            {!isAllIn ? (
              <>
                <button
                  type="button"
                  onClick={() => setConfirmUpgrade(true)}
                  className="mt-5 w-full h-10 text-[14px] font-medium rounded-[4px] text-white transition-colors"
                  style={{ background: "hsl(var(--accent))" }}
                >
                  {t("subscription.page.upgradeCta")}
                </button>
                <div className="mt-3 flex items-center justify-between text-[12px] text-text-tertiary">
                  <span>{t("subscription.page.annual.save")}</span>
                  <button
                    type="button"
                    onClick={() =>
                      setDemoModal({
                        title: t("subscription.page.annual.title"),
                        body: t("subscription.page.annual.body"),
                      })
                    }
                    className="text-text-secondary hover:text-text-primary transition-colors"
                  >
                    {t("subscription.page.annual.cta")}
                  </button>
                </div>
              </>
            ) : (
              <div className="mt-5 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setDemoModal({
                      title: t("subscription.page.manage.title"),
                      body: t("subscription.page.manage.body"),
                    })
                  }
                  className="h-9 px-3 text-[13px] font-medium rounded-[4px] text-text-primary hover:bg-surface-hover transition-colors"
                  style={{ border: "1px solid hsl(var(--border-default))" }}
                >
                  {t("subscription.page.manage.cta")}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setDemoModal({
                      title: t("subscription.page.annual.title"),
                      body: t("subscription.page.annual.body"),
                    })
                  }
                  className="h-9 px-3 text-[13px] rounded-[4px] text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors"
                >
                  {t("subscription.page.annual.ctaShort")}
                </button>
              </div>
            )}
          </div>

          {/* Lifetime card — secondary */}
          <div
            className="mt-4 rounded-[6px] bg-surface-raised"
            style={{
              padding: 20,
              border: "1px solid hsl(var(--border-subtle))",
            }}
          >
            <div className="flex items-baseline justify-between gap-3">
              <div className="text-[15px] font-medium text-text-primary">
                {t("subscription.page.lifetime.title")}
              </div>
              <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-text-tertiary">
                {t("subscription.page.lifetime.limited")}
              </span>
            </div>
            <div className="mt-1 text-[13px] text-text-secondary">
              {t("subscription.page.lifetime.body")}
            </div>
            <button
              type="button"
              onClick={() =>
                setDemoModal({
                  title: t("subscription.page.lifetime.soonTitle"),
                  body: t("subscription.page.lifetime.soonBody"),
                })
              }
              className="mt-3 h-9 px-3 text-[13px] rounded-[4px] text-text-primary hover:bg-surface-hover transition-colors"
              style={{ border: "1px solid hsl(var(--border-default))" }}
            >
              {t("subscription.page.lifetime.cta")}
            </button>
          </div>

          {/* Footer */}
          <div className="mt-8 text-[12px] text-text-tertiary">
            {t("subscription.page.contact")}
          </div>
        </div>
      </main>

      <ConfirmModal
        open={confirmUpgrade}
        title={t("subscription.page.confirmUpgrade.title")}
        body={t("subscription.page.confirmUpgrade.body")}
        confirmLabel={t("subscription.page.confirmUpgrade.cta")}
        cancelLabel={t("common.cancel")}
        onCancel={() => setConfirmUpgrade(false)}
        onConfirm={handleUpgrade}
      />

      {/* Downgrade — Tier 2 (type DOWNGRADE) */}
      {downgradeOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center"
          style={{ background: "var(--backdrop)" }}
          onClick={() => setDowngradeOpen(false)}
        >
          <div
            className="w-[460px] max-w-[90vw] bg-surface-elevated border border-border-subtle rounded-[6px] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-[16px] font-medium text-text-primary">
              {t("subscription.page.downgrade.title")}
            </h2>
            <div className="mt-3 text-[13px] text-text-secondary leading-[1.5]">
              {t("subscription.page.downgrade.body")}
            </div>
            <div className="mt-4 text-[12px] text-text-tertiary">
              {t("subscription.page.downgrade.typePromptPre")}
              <span className="font-mono text-text-secondary">DOWNGRADE</span>
              {t("subscription.page.downgrade.typePromptPost")}
            </div>
            <input
              autoFocus
              value={downgradeText}
              onChange={(e) => setDowngradeText(e.target.value)}
              className="mt-2 w-full h-9 px-3 rounded-[4px] bg-surface-base border border-border-default text-[13px] text-text-primary focus:outline-none focus:border-accent"
            />
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setDowngradeOpen(false);
                  setDowngradeText("");
                }}
                className="text-[13px] text-text-secondary hover:text-text-primary transition-colors px-3 py-1.5"
              >
                {t("common.cancel")}
              </button>
              <button
                type="button"
                disabled={downgradeText.trim().toUpperCase() !== "DOWNGRADE"}
                onClick={handleDowngrade}
                className="text-[13px] font-medium px-3 py-1.5 rounded-[4px] transition-colors disabled:opacity-40"
                style={{
                  color: "hsl(var(--text-warning))",
                  background: "hsl(var(--surface-hover))",
                }}
              >
                {t("subscription.page.downgrade.cta")}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={!!demoModal}
        title={demoModal?.title ?? ""}
        body={demoModal?.body}
        cancelLabel=""
        confirmLabel={t("subscription.page.gotIt")}
        onCancel={() => setDemoModal(null)}
        onConfirm={() => setDemoModal(null)}
      />
    </div>
  );
}
