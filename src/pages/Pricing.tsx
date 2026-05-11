// Pricing page — Free vs All-In, refund note, FAQ.
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Check, ChevronDown } from "lucide-react";
import { LandingTopBar, LandingFooter } from "@/components/LandingChrome";

type Feature = { bold?: string; text?: string; note?: string };

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
  const { t } = useTranslation();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const FREE_FEATURES: Feature[] = [
    { text: t("pricing.free.feature1") },
    { bold: t("pricing.free.feature2"), note: t("pricing.free.feature2Note") },
    { text: t("pricing.free.feature3") },
    { text: t("pricing.free.feature4"), note: t("pricing.free.feature4Note") },
    { text: t("pricing.free.feature5"), note: t("pricing.free.feature5Note") },
    { text: t("pricing.free.feature6") },
  ];

  const ALLIN_FEATURES: Feature[] = [
    { text: t("pricing.allIn.feature1") },
    { bold: t("pricing.allIn.feature2"), note: t("pricing.allIn.feature2Note") },
    { bold: t("pricing.allIn.feature3"), note: t("pricing.allIn.feature3Note") },
    { text: t("pricing.allIn.feature4"), note: t("pricing.allIn.feature4Note") },
    { bold: t("pricing.allIn.feature5"), note: t("pricing.allIn.feature5Note") },
    { bold: t("pricing.allIn.feature6"), note: t("pricing.allIn.feature6Note") },
  ];

  const FAQS = [1, 2, 3, 4].map((i) => ({
    q: t(`pricing.faq.q${i}.question`),
    a: t(`pricing.faq.q${i}.answer`),
  }));

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
            {t("pricing.label")}
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
            {t("pricing.heading")}
          </h1>
          <p
            className="pricing-sub"
            style={{
              marginTop: 16,
              color: "hsl(var(--text-secondary))",
              lineHeight: 1.5,
            }}
          >
            {t("pricing.subline")}
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
              {t("pricing.free.badge")}
            </div>
            <div style={{ marginTop: 16, display: "flex", alignItems: "baseline", gap: 8 }}>
              <span style={{ fontSize: 56, fontWeight: 500, color: "hsl(var(--text-primary))", lineHeight: 1 }}>{t("pricing.free.price")}</span>
              <span style={{ fontSize: 16, color: "hsl(var(--text-secondary))" }}>{t("pricing.free.priceUnit")}</span>
            </div>
            <p style={{ marginTop: 24, fontSize: 15, color: "hsl(var(--text-secondary))", lineHeight: 1.5 }}>
              {t("pricing.free.tagline")}
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
              {t("pricing.free.cta")}
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
              {t("pricing.allIn.recommended")}
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
              {t("pricing.allIn.badge")}
            </div>
            <div style={{ marginTop: 16, display: "flex", alignItems: "baseline", gap: 8 }}>
              <span style={{ fontSize: 56, fontWeight: 500, color: "hsl(var(--text-primary))", lineHeight: 1 }}>{t("pricing.allIn.price")}</span>
              <span style={{ fontSize: 16, color: "hsl(var(--text-secondary))" }}>{t("pricing.allIn.priceUnit")}</span>
            </div>
            <div style={{ marginTop: 4, fontSize: 13, color: "hsl(var(--text-tertiary))" }}>
              {t("pricing.allIn.priceAnnual")}
            </div>
            <p style={{ marginTop: 24, fontSize: 15, color: "hsl(var(--text-secondary))", lineHeight: 1.5 }}>
              {t("pricing.allIn.tagline")}
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
              {t("pricing.allIn.cta")}
            </Link>
          </div>
        </div>

        {/* Refund */}
        <div
          className="mx-auto text-center"
          style={{ maxWidth: 640, marginTop: 64, fontSize: 14, lineHeight: 1.6, color: "hsl(var(--text-secondary))" }}
        >
          <span style={{ color: "hsl(var(--text-primary))", fontWeight: 500 }}>{t("pricing.refund.bold")}</span>{" "}
          <span>{t("pricing.refund.body")}</span>
        </div>

        {/* FAQ */}
        <section style={{ marginTop: 80, paddingBottom: 80 }}>
          <div className="text-center">
            <h2
              className="pricing-faq-h2"
              style={{ fontWeight: 500, color: "hsl(var(--text-primary))", letterSpacing: "-0.01em", margin: 0 }}
            >
              {t("pricing.faq.heading")}
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
