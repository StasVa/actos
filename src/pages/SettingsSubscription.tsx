import React from "react";
import { Link } from "react-router-dom";
import { AppSidebar } from "@/components/AppSidebar";
import { MobileHeader } from "@/components/MobileHeader";
import { useStore } from "@/store/useStore";
import { TierBadge } from "@/components/UserMenu";
import { ConfirmModal } from "@/components/ConfirmModal";

const FEATURES_FREE = [
  "Up to 3 active goals",
  "Unlimited actions, projects, ideas",
  "Local data storage",
  "Daily planning and reviews",
  "Focus sessions",
];

const FEATURES_PRO_EXTRA = [
  "Cloud sync across devices",
  "Unlimited goals",
  "Priority support",
  "Early access to new features",
];

const Check: React.FC = () => (
  <span style={{ color: "hsl(var(--state-active))", fontWeight: 600 }}>✓</span>
);

const PlanCard: React.FC<{
  name: "Free" | "Pro";
  price: string;
  features: string[];
  current: boolean;
  footer: React.ReactNode;
}> = ({ name, price, features, current, footer }) => (
  <div
    className="flex-1 rounded-[6px] bg-surface-raised flex flex-col"
    style={{
      padding: 24,
      border: current ? "1px solid hsl(var(--accent))" : "1px solid hsl(var(--border-subtle))",
    }}
  >
    <div className="flex items-center justify-between">
      <div className="text-[18px] font-medium text-text-primary">{name}</div>
      <TierBadge tier={name === "Pro" ? "pro" : "free"} />
    </div>
    <div className="mt-3 flex items-baseline gap-1">
      <span
        className="text-[32px] font-medium text-text-primary tabular-nums"
        style={{ lineHeight: 1 }}
      >
        {price}
      </span>
      <span className="text-[14px] text-text-tertiary">/month</span>
    </div>
    <ul className="mt-4 space-y-2 text-[13px] text-text-secondary">
      {features.map((f) => (
        <li key={f} className="flex items-start gap-2">
          <Check />
          <span>{f}</span>
        </li>
      ))}
    </ul>
    <div className="mt-4">{footer}</div>
  </div>
);

export default function SettingsSubscription() {
  const settings = useStore((s) => s.settings);
  const tier: "free" | "pro" = settings.subscriptionTier === "pro" ? "pro" : "free";
  const [demoModal, setDemoModal] = React.useState<null | { title: string; body: string }>(null);

  const isPro = tier === "pro";

  return (
    <div className="min-h-screen bg-surface-base text-text-primary">
      <AppSidebar />
      <MobileHeader />
      <main className="app-main page-medium">
        <div className="max-w-[720px]">
          {/* Breadcrumb */}
          <Link
            to="/settings"
            className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-tertiary hover:text-text-primary transition-colors"
          >
            ← SETTINGS
          </Link>
          <h1 className="mt-2 text-[24px] sm:text-[28px] md:text-[32px] font-medium text-text-primary leading-tight">
            Subscription
          </h1>
          <div className="mt-2 text-[14px] text-text-secondary">Manage your plan.</div>
          <div className="mt-4 border-t border-border-subtle" />

          {/* Current plan card */}
          <div
            className="mt-6 rounded-[6px] bg-surface-raised"
            style={{ padding: 24, border: "1px solid hsl(var(--border-subtle))" }}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="text-[20px] font-medium text-text-primary">
                {isPro ? "Pro plan" : "Free plan"}
              </div>
              <TierBadge tier={tier} />
            </div>
            <div className="mt-2 text-[13px] text-text-secondary">
              {isPro
                ? "Everything in Free, plus cloud sync, larger limits, and priority support."
                : "Core features. Local data only."}
            </div>
            <div
              className="mt-3 font-mono text-[11px] uppercase tracking-[0.06em] text-text-tertiary"
            >
              {isPro ? "ACTIVE · NEXT BILLING 2026-06-08" : "ACTIVE · NO PAYMENT REQUIRED"}
            </div>
          </div>

          {/* Plans comparison */}
          <div className="mt-6">
            <div className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-tertiary">
              PLANS
            </div>
            <div className="mt-1 text-[14px] text-text-secondary">Compare what's included.</div>

            <div className="mt-4 flex flex-col md:flex-row gap-4 items-stretch">
              <PlanCard
                name="Free"
                price="$0"
                features={FEATURES_FREE}
                current={!isPro}
                footer={
                  !isPro ? (
                    <button
                      type="button"
                      disabled
                      className="w-full h-9 text-[13px] font-medium rounded-[4px] text-text-secondary"
                      style={{ cursor: "default" }}
                    >
                      Current plan
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        setDemoModal({
                          title: "Downgrade unavailable",
                          body: "Downgrades will be available soon.",
                        })
                      }
                      className="w-full h-9 text-[13px] rounded-[4px] text-text-tertiary hover:text-text-primary hover:bg-surface-hover transition-colors"
                    >
                      Downgrade to Free
                    </button>
                  )
                }
              />
              <PlanCard
                name="Pro"
                price="$8"
                features={[...FEATURES_FREE, ...FEATURES_PRO_EXTRA]}
                current={isPro}
                footer={
                  !isPro ? (
                    <button
                      type="button"
                      onClick={() =>
                        setDemoModal({
                          title: "Pro is coming soon",
                          body: "We'll email you when it's ready.",
                        })
                      }
                      className="w-full h-9 text-[13px] font-medium rounded-[4px] text-white transition-colors"
                      style={{ background: "hsl(var(--accent))" }}
                    >
                      Upgrade to Pro
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        setDemoModal({
                          title: "Manage subscription",
                          body: "Subscription management is coming soon.",
                        })
                      }
                      className="w-full h-9 text-[13px] font-medium rounded-[4px] text-text-primary hover:bg-surface-hover transition-colors"
                      style={{ border: "1px solid hsl(var(--border-default))" }}
                    >
                      Manage subscription
                    </button>
                  )
                }
              />
            </div>
          </div>
        </div>
      </main>

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
