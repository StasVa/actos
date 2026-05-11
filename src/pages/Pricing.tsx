// Pricing page — Free vs All-In, refund note, FAQ.
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Check, ChevronDown } from "lucide-react";
import { LandingTopBar, LandingFooter } from "@/components/LandingChrome";

type Feature = { bold?: string; text?: string; note?: string };

const FREE_FEATURES: Feature[] = [
  { text: "All current features" },
  { bold: "Up to 2 active goals", note: "philosophy partial" },
  { text: "90 days of history" },
  { text: "Standard support", note: "help docs" },
  { text: "Web app (mobile + desktop)" },
  { text: "JSON data export" },
];

const ALLIN_FEATURES: Feature[] = [
  { text: "Everything in Free" },
  { bold: "Up to 3 active goals", note: "full philosophy" },
  { bold: "Unlimited history", note: "back to day one" },
  { text: "Priority support", note: "48h email reply" },
  { bold: "Every future feature included", text: " — automatically" },
  { bold: "Price locked", text: " at signup — never raised" },
];

const FAQS = [
  {
    q: "Can I change plans later?",
    a: "Yes. Upgrade or downgrade any time from Settings → Subscription. Annual subscribers can switch to monthly at renewal; lifetime is a one-time purchase, no switching needed.",
  },
  {
    q: "What happens when I cancel?",
    a: "You stay on All-In until the end of the billing period you already paid for. After that, the account drops to Free — your data stays intact. Active entities (goals, projects, actions) are never locked; only history older than 90 days becomes view-only.",
  },
  {
    q: "Will the price go up?",
    a: "For new subscribers, possibly — we may raise prices as we add features. But once you subscribe, your price is locked. Existing subscribers never see a hike as long as the subscription stays active.",
  },
  {
    q: "Why isn't there a free trial of All-In?",
    a: "Free is the trial. It's a full version of the product with no time limit — not a teaser. If 90 days of history and 2 goals isn't enough, that's the signal you're ready for All-In.",
  },
];

const FeatureRow: React.FC<{ f: Feature }> = ({ f }) => (
  <li style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
    <Check size={16} strokeWidth={1.75} color="hsl(var(--goal-2))" style={{ marginTop: 4, flexShrink: 0 }} />
    <span style={{ fontFamily: "Inter, system-ui, sans-serif", fontSize: 15, lineHeight: 1.5 }}>
      {f.bold && <span style={{ color: "hsl(var(--text-primary))", fontWeight: 500 }}>{f.bold}</span>}
      {f.text && <span style={{ color: f.bold ? "hsl(var(--text-secondary))" : "hsl(var(--text-primary))" }}>{f.text}</span>}
      {f.note && <span style={{ color: "hsl(var(--text-secondary))" }}> ({f.note})</span>}
    </span>
  </li>
);

const Pricing: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div
      data-theme="dark"
      className="relative flex min-h-screen flex-col"
      style={{ background: "hsl(var(--surface-base))", fontFamily: "Inter, system-ui, sans-serif" }}
    >
      <LandingTopBar />

      <main className="pricing-main flex-1 px-6">
        {/* Heading */}
        <div className="text-center" style={{ paddingTop: 120 }}>
          <div
            style={{
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: 14,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "hsl(var(--text-tertiary))",
            }}
          >
            Pricing
          </div>
          <hr style={{ width: 40, height: 1, border: "none", background: "hsl(var(--border-subtle))", margin: "24px auto 0" }} />
          <h1
            className="pricing-h1"
            style={{
              marginTop: 32,
              fontWeight: 500,
              color: "hsl(var(--text-primary))",
              letterSpacing: "-0.02em",
              lineHeight: 1.1,
            }}
          >
            Free to start. $12 to commit.
          </h1>
          <p
            className="pricing-sub"
            style={{
              marginTop: 16,
              color: "hsl(var(--text-secondary))",
              lineHeight: 1.5,
            }}
          >
            Pick what fits today. Switch any time.
          </p>
        </div>

        {/* Cards */}
        <div
          className="mx-auto pricing-cards"
          style={{ maxWidth: 960, marginTop: 80, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}
        >
          {/* Free */}
          <div
            className="pricing-card"
            style={{
              background: "hsl(var(--surface-raised))",
              border: "1px solid hsl(var(--border-subtle))",
              borderRadius: 12,
              padding: 48,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: 11,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "hsl(var(--text-tertiary))",
              }}
            >
              FREE
            </div>
            <div style={{ marginTop: 16, display: "flex", alignItems: "baseline", gap: 8 }}>
              <span style={{ fontSize: 56, fontWeight: 500, color: "hsl(var(--text-primary))", lineHeight: 1 }}>$0</span>
              <span style={{ fontSize: 16, color: "hsl(var(--text-secondary))" }}>forever</span>
            </div>
            <p style={{ marginTop: 24, fontSize: 15, color: "hsl(var(--text-secondary))", lineHeight: 1.5 }}>
              For people exploring the philosophy.
            </p>
            <ul style={{ marginTop: 32, display: "flex", flexDirection: "column", gap: 12, listStyle: "none", padding: 0, flex: 1 }}>
              {FREE_FEATURES.map((f, i) => <FeatureRow key={i} f={f} />)}
            </ul>
            <Link
              to="/auth#signup"
              className="pricing-btn-outline"
              style={{
                marginTop: 40,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: 44,
                width: "100%",
                border: "1px solid hsl(var(--border-strong))",
                borderRadius: 6,
                color: "hsl(var(--text-primary))",
                textDecoration: "none",
                fontSize: 15,
                fontWeight: 500,
                transition: "border-color 120ms ease, background 120ms ease",
              }}
            >
              Start free
            </Link>
          </div>

          {/* All-In */}
          <div
            className="pricing-card"
            style={{
              position: "relative",
              background: "hsl(var(--surface-raised))",
              border: "1px solid hsl(var(--goal-2))",
              borderRadius: 12,
              padding: 48,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: -12,
                right: 32,
                height: 24,
                padding: "0 8px",
                background: "hsl(var(--goal-2))",
                color: "hsl(var(--surface-base))",
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: 11,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                borderRadius: 4,
                display: "inline-flex",
                alignItems: "center",
              }}
            >
              RECOMMENDED
            </div>
            <div
              style={{
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: 11,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "hsl(var(--goal-2))",
              }}
            >
              ALL-IN
            </div>
            <div style={{ marginTop: 16, display: "flex", alignItems: "baseline", gap: 8 }}>
              <span style={{ fontSize: 56, fontWeight: 500, color: "hsl(var(--text-primary))", lineHeight: 1 }}>$12</span>
              <span style={{ fontSize: 16, color: "hsl(var(--text-secondary))" }}>/mo</span>
            </div>
            <div style={{ marginTop: 4, fontSize: 13, color: "hsl(var(--text-tertiary))" }}>
              or $120/yr — save 17%
            </div>
            <p style={{ marginTop: 24, fontSize: 15, color: "hsl(var(--text-secondary))", lineHeight: 1.5 }}>
              For people ready to commit.
            </p>
            <ul style={{ marginTop: 32, display: "flex", flexDirection: "column", gap: 12, listStyle: "none", padding: 0, flex: 1 }}>
              {ALLIN_FEATURES.map((f, i) => <FeatureRow key={i} f={f} />)}
            </ul>
            <Link
              to="/auth#signup"
              className="pricing-btn-primary"
              style={{
                marginTop: 40,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: 44,
                width: "100%",
                background: "hsl(var(--goal-2))",
                color: "hsl(var(--surface-base))",
                borderRadius: 6,
                textDecoration: "none",
                fontSize: 15,
                fontWeight: 500,
                transition: "filter 120ms ease",
              }}
            >
              Go All-In
            </Link>
          </div>
        </div>

        {/* Refund */}
        <div
          className="mx-auto text-center"
          style={{ maxWidth: 640, marginTop: 64, fontSize: 14, lineHeight: 1.6, color: "hsl(var(--text-secondary))" }}
        >
          <span style={{ color: "hsl(var(--text-primary))", fontWeight: 500 }}>30-day refund.</span>{" "}
          If ActOS doesn't fit how you work, email us within 30 days of signup and we'll refund in full — no questions, no forms.
        </div>

        {/* FAQ */}
        <section style={{ marginTop: 80, paddingBottom: 80 }}>
          <div className="text-center">
            <h2
              className="pricing-faq-h2"
              style={{ fontWeight: 500, color: "hsl(var(--text-primary))", letterSpacing: "-0.01em", margin: 0 }}
            >
              Common questions.
            </h2>
            <hr style={{ width: 40, height: 1, border: "none", background: "hsl(var(--border-subtle))", margin: "24px auto 0" }} />
          </div>
          <div className="mx-auto" style={{ maxWidth: 720, marginTop: 64 }}>
            {FAQS.map((item, i) => {
              const open = openFaq === i;
              return (
                <div key={i} style={{ borderBottom: "1px solid hsl(var(--border-subtle))" }}>
                  <button
                    type="button"
                    onClick={() => setOpenFaq(open ? null : i)}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "20px 0",
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      color: "hsl(var(--text-primary))",
                      fontFamily: "Inter, system-ui, sans-serif",
                      fontSize: 17,
                      fontWeight: 500,
                      textAlign: "left",
                    }}
                  >
                    <span>{item.q}</span>
                    <ChevronDown
                      size={18}
                      strokeWidth={1.5}
                      style={{ transform: open ? "rotate(180deg)" : "rotate(0)", transition: "transform 200ms ease", color: "hsl(var(--text-tertiary))" }}
                    />
                  </button>
                  <div
                    style={{
                      maxHeight: open ? 400 : 0,
                      overflow: "hidden",
                      transition: "max-height 250ms ease",
                    }}
                  >
                    <p style={{ paddingBottom: 20, margin: 0, color: "hsl(var(--text-secondary))", fontSize: 15, lineHeight: 1.65 }}>
                      {item.a}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      <LandingFooter />

      <style>{`
        .pricing-h1 { font-size: 48px; }
        .pricing-sub { font-size: 18px; }
        .pricing-faq-h2 { font-size: 36px; }
        .pricing-btn-outline:hover { border-color: hsl(var(--text-secondary)) !important; background: hsl(var(--surface-base) / 0.4); }
        .pricing-btn-primary:hover { filter: brightness(1.1); }
        @media (max-width: 768px) {
          .pricing-h1 { font-size: 32px; }
          .pricing-sub { font-size: 16px; }
          .pricing-faq-h2 { font-size: 28px; }
          .pricing-cards { grid-template-columns: 1fr !important; }
          .pricing-card { padding: 32px !important; }
        }
      `}</style>
    </div>
  );
};

export default Pricing;
