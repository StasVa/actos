import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { AppSidebar } from "@/components/AppSidebar";
import { useStore } from "@/store/useStore";
import { TierBadge } from "@/components/UserMenu";
import { ConfirmModal } from "@/components/ConfirmModal";
import { toast } from "sonner";

const FREE_FEATURES = [
  "1 active goal",
  "All current features",
  "Last 90 days of history",
  "Standard support",
];

const ALL_IN_FEATURES = [
  "Up to 3 active goals",
  "All current features",
  "Full history forever",
  "Priority support",
  "Every future feature, included",
];

const Check: React.FC = () => (
  <span style={{ color: "hsl(var(--state-active))", fontWeight: 600 }}>✓</span>
);

const FeatureList: React.FC<{ items: string[] }> = ({ items }) => (
  <ul className="mt-4 space-y-2 text-[13px] text-text-secondary">
    {items.map((f) => (
      <li key={f} className="flex items-start gap-2">
        <Check />
        <span>{f}</span>
      </li>
    ))}
  </ul>
);

export default function SettingsSubscription() {
  const settings = useStore((s) => s.settings);
  const setSubscriptionTier = useStore((s) => s.setSubscriptionTier);
  const navigate = useNavigate();
  const tier: "free" | "all-in" = settings.subscriptionTier === "all-in" ? "all-in" : "free";
  const isAllIn = tier === "all-in";

  const [confirmUpgrade, setConfirmUpgrade] = React.useState(false);
  const [downgradeOpen, setDowngradeOpen] = React.useState(false);
  const [downgradeText, setDowngradeText] = React.useState("");
  const [demoModal, setDemoModal] = React.useState<null | { title: string; body: string }>(null);

  const handleUpgrade = () => {
    setConfirmUpgrade(false);
    // Demo: flip tier locally and show welcome toast.
    setSubscriptionTier("all-in");
    toast.success("Welcome to All-In. Full history is back.");
    setTimeout(() => navigate("/today"), 400);
  };

  const handleDowngrade = () => {
    if (downgradeText.trim().toUpperCase() !== "DOWNGRADE") return;
    setSubscriptionTier("free");
    setDowngradeOpen(false);
    setDowngradeText("");
    toast("Switched to Free. Your data is safe.");
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
            ← SETTINGS
          </Link>
          <h1 className="mt-2 text-[24px] sm:text-[28px] md:text-[32px] font-medium text-text-primary leading-tight">
            Subscription
          </h1>
          <div className="mt-2 text-[14px] text-text-secondary">
            {isAllIn ? "You're All-In." : "You're on Free."}
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
              <div className="text-[20px] font-medium text-text-primary">Free plan</div>
              <TierBadge tier="free" />
            </div>
            <div
              className="mt-1 font-mono text-[11px] uppercase tracking-[0.06em] text-text-tertiary"
            >
              {isAllIn ? "AVAILABLE — DOWNGRADE" : "ACTIVE · NO PAYMENT"}
            </div>
            <FeatureList items={FREE_FEATURES} />
            {isAllIn && (
              <button
                type="button"
                onClick={() => setDowngradeOpen(true)}
                className="mt-4 h-9 px-3 text-[13px] rounded-[4px] text-text-tertiary hover:text-text-primary hover:bg-surface-hover transition-colors"
              >
                Switch to Free
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
                {isAllIn ? "Your plan: All-In" : "Go All-In — $12/mo"}
              </div>
              <TierBadge tier="all-in" />
            </div>
            <div className="mt-2 text-[13px] text-text-secondary">
              {isAllIn
                ? "Active · Next billing 2026-06-08 · $12/mo"
                : "Everything we ever build."}
            </div>
            <FeatureList items={ALL_IN_FEATURES} />

            {!isAllIn ? (
              <>
                <button
                  type="button"
                  onClick={() => setConfirmUpgrade(true)}
                  className="mt-5 w-full h-10 text-[14px] font-medium rounded-[4px] text-white transition-colors"
                  style={{ background: "hsl(var(--accent))" }}
                >
                  Go All-In — $12/mo
                </button>
                <div className="mt-3 flex items-center justify-between text-[12px] text-text-tertiary">
                  <span>Save 17% with annual — $120/yr (vs. $144 monthly)</span>
                  <button
                    type="button"
                    onClick={() =>
                      setDemoModal({
                        title: "Annual billing coming soon",
                        body: "We'll email you when annual is live.",
                      })
                    }
                    className="text-text-secondary hover:text-text-primary transition-colors"
                  >
                    Switch to annual →
                  </button>
                </div>
              </>
            ) : (
              <div className="mt-5 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setDemoModal({
                      title: "Manage subscription",
                      body: "Subscription management is coming soon.",
                    })
                  }
                  className="h-9 px-3 text-[13px] font-medium rounded-[4px] text-text-primary hover:bg-surface-hover transition-colors"
                  style={{ border: "1px solid hsl(var(--border-default))" }}
                >
                  Manage subscription
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setDemoModal({
                      title: "Annual billing coming soon",
                      body: "We'll email you when annual is live.",
                    })
                  }
                  className="h-9 px-3 text-[13px] rounded-[4px] text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors"
                >
                  Switch to annual
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
                All-In Lifetime — $200 once
              </div>
              <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-text-tertiary">
                LIMITED
              </span>
            </div>
            <div className="mt-1 text-[13px] text-text-secondary">
              For believers. Pay once, never billed again, every feature ever.
            </div>
            <button
              type="button"
              onClick={() =>
                setDemoModal({
                  title: "Lifetime is coming soon",
                  body: "We'll email you when Lifetime opens.",
                })
              }
              className="mt-3 h-9 px-3 text-[13px] rounded-[4px] text-text-primary hover:bg-surface-hover transition-colors"
              style={{ border: "1px solid hsl(var(--border-default))" }}
            >
              Go Lifetime
            </button>
          </div>

          {/* Footer */}
          <div className="mt-8 text-[12px] text-text-tertiary">
            Questions about subscription? hello@actos.app
          </div>
        </div>
      </main>

      <ConfirmModal
        open={confirmUpgrade}
        title="Subscribe to All-In?"
        body="$12/mo, billed monthly. Cancel anytime."
        confirmLabel="Subscribe"
        cancelLabel="Cancel"
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
            <h2 className="text-[16px] font-medium text-text-primary">Downgrade to Free?</h2>
            <div className="mt-3 text-[13px] text-text-secondary leading-[1.5]">
              You'll keep all your data, but: history older than 90 days will be locked, and you
              won't be able to add new goals until you're back to 1 active. You can return to
              All-In anytime.
            </div>
            <div className="mt-4 text-[12px] text-text-tertiary">
              Type <span className="font-mono text-text-secondary">DOWNGRADE</span> to confirm.
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
                Cancel
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
                Downgrade
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
        confirmLabel="Got it"
        onCancel={() => setDemoModal(null)}
        onConfirm={() => setDemoModal(null)}
      />
    </div>
  );
}
