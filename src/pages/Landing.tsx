// Public marketing landing page. Dark-only.
// Hero (85vh) + Product demo + How it works + FAQ + Pricing + Final CTA + Footer.

import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  LayoutGrid,
  Target,
  Zap,
} from "lucide-react";
import { LandingTopBar, LandingFooter } from "@/components/LandingChrome";

const STEPS = [
  {
    Icon: Target,
    label: "GOALS",
    desc: "Pick 2 or 3 that genuinely matter. ActOS won't let you add more.",
  },
  {
    Icon: LayoutGrid,
    label: "PROJECTS",
    desc: "Break each goal into 2-5 shippable pieces. Concrete enough to start.",
  },
  {
    Icon: Zap,
    label: "DAILY ACTIONS",
    desc: "Plan one Main Task per day. The floor, not the ceiling.",
  },
];

type FaqItem =
  | { kind: "item"; q: string; a: string }
  | { kind: "link"; q: string; to: string };

const FAQS: FaqItem[] = [
  {
    kind: "item",
    q: "Why only 3 goals?",
    a: "Because almost no one actually moves more than 2 at a time. The cap isn't restrictive — it's protective. If you can't pick 3, you'll fail at all of them.",
  },
  {
    kind: "link",
    q: "Why tasks and issues stop you moving toward goals.",
    to: "/manifesto",
  },
  {
    kind: "item",
    q: "What if I have 200 things to do?",
    a: "ActOS isn't built for that load. Tasks unrelated to your 2-3 goals don't belong here. If you're juggling 200 items, the real question is why you took them all on.",
  },
  {
    kind: "item",
    q: "Is this just another todo app?",
    a: "No. Todo apps optimize for capturing things to do. ActOS optimizes for moving toward things you decided matter. Different problem, different design.",
  },
  {
    kind: "item",
    q: "Does it work on mobile?",
    a: "Yes. The web app works on phones today. Native iOS and Android apps come post-launch.",
  },
  {
    kind: "item",
    q: "Why isn't it free forever?",
    a: "It is — to start. The Free tier is genuinely useful, not a limited demo. All-In is $12/mo for people ready to commit. We charge because focus is worth paying for, and we want to build sustainably without ads or VC pressure.",
  },
];

const SectionHeading: React.FC<{ label: string }> = ({ label }) => (
  <div className="flex flex-col items-center">
    <div
      style={{
        fontFamily: '"JetBrains Mono", ui-monospace, monospace',
        fontSize: 14,
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        color: "hsl(var(--text-tertiary))",
      }}
    >
      {label}
    </div>
    <div
      style={{
        marginTop: 8,
        width: 40,
        height: 1,
        background: "hsl(var(--border-subtle))",
      }}
    />
  </div>
);

const FreeFeatures = [
  { primary: "All current features", note: "" },
  { primary: "Up to 2 active goals", note: "(philosophy partial)" },
  { primary: "90 days of history", note: "" },
  { primary: "Standard support", note: "(help docs)" },
];

const AllInFeatures = [
  { primary: "Everything in Free", note: "" },
  { primary: "Up to 3 active goals", note: "(full philosophy)" },
  { primary: "Unlimited history", note: "(back to day one)" },
  { primary: "Priority support", note: "(48h email reply)" },
  { primary: "Every future feature included", note: "— automatically" },
  { primary: "Price locked at signup", note: "never raised" },
];

const FeatureRow: React.FC<{ primary: string; note: string }> = ({
  primary,
  note,
}) => (
  <li
    style={{
      display: "flex",
      alignItems: "flex-start",
      gap: 16,
      fontFamily: "Inter, system-ui, sans-serif",
      fontSize: 15,
      lineHeight: 1.5,
    }}
  >
    <Check
      size={16}
      strokeWidth={2}
      color="hsl(var(--goal-2))"
      style={{ flexShrink: 0, marginTop: 4 }}
    />
    <span style={{ color: "hsl(var(--text-primary))" }}>
      {primary}
      {note ? (
        <span style={{ color: "hsl(var(--text-secondary))" }}> {note}</span>
      ) : null}
    </span>
  </li>
);

const Landing: React.FC = () => {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      data-theme="dark"
      className="relative flex min-h-screen flex-col"
      style={{ background: "hsl(var(--surface-base))" }}
    >
      {/* HERO */}
      <section
        className="relative flex flex-col"
        style={{ minHeight: "85vh" }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 landing-glow"
          style={{ zIndex: 0 }}
        />

        <div className="relative" style={{ zIndex: 1 }}>
          <LandingTopBar logoIsHome />
        </div>

        <div
          className="relative flex flex-1 flex-col items-center justify-center px-6 text-center"
          style={{ zIndex: 1 }}
        >
          <h1
            className="hero-h1"
            style={{
              fontFamily: "Inter, system-ui, sans-serif",
              fontWeight: 500,
              color: "hsl(var(--text-primary))",
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
              margin: 0,
            }}
          >
            Stop scheduling.
            <br />
            Start moving.
          </h1>
          <p
            className="hero-sub"
            style={{
              fontFamily: "Inter, system-ui, sans-serif",
              fontWeight: 400,
              color: "hsl(var(--text-secondary))",
              marginTop: 24,
              margin: "24px 0 0",
            }}
          >
            The OS for getting things done.
          </p>

          <button
            type="button"
            onClick={() => navigate("/today")}
            className="cta-btn"
            style={{
              marginTop: 40,
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "hsl(var(--goal-2))",
              color: "#0F0F12",
              fontFamily: "Inter, system-ui, sans-serif",
              fontWeight: 500,
              fontSize: 16,
              padding: "14px 32px",
              borderRadius: 6,
              border: "none",
              cursor: "pointer",
              transition: "filter 120ms ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.filter = "brightness(1.1)")}
            onMouseLeave={(e) => (e.currentTarget.style.filter = "")}
          >
            Open ActOS
            <ArrowRight size={16} />
          </button>
        </div>

        <div
          aria-hidden
          className="scroll-hint"
          style={{
            position: "absolute",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 1,
            opacity: scrolled ? 0 : 1,
            transition: "opacity 200ms ease",
            color: "hsl(var(--text-tertiary))",
            pointerEvents: "none",
          }}
        >
          <ChevronDown size={20} strokeWidth={1.5} className="bounce" />
        </div>
      </section>

      {/* PRODUCT DEMO */}
      <section className="demo-section">
        <SectionHeading label="See it in motion" />
        <div className="demo-frame-wrap">
          {/* Option B: CSS-animated mockup of the ActOS Today page. */}
          <div className="demo-frame" aria-hidden>
            <div className="demo-inner">
              <div className="demo-sidebar">
                <div className="demo-logo">
                  <span style={{ color: "hsl(var(--text-primary))" }}>Act</span>
                  <span style={{ color: "hsl(var(--goal-2))" }}>OS</span>
                </div>
                <div className="demo-nav-item active">Today</div>
                <div className="demo-nav-item">Goals</div>
                <div className="demo-nav-item">Projects</div>
                <div className="demo-nav-item">Reviews</div>
              </div>
              <div className="demo-content">
                <div className="demo-page-header">
                  <div className="demo-page-title">Today</div>
                  <div className="demo-page-date">Mon · May 11</div>
                </div>

                <div className="demo-main-card">
                  <div className="demo-main-label">MAIN TASK</div>
                  <div className="demo-main-title">
                    Ship landing page v4
                  </div>
                  <div className="demo-main-meta">
                    <span className="demo-pill">Goal · ActOS launch</span>
                  </div>
                </div>

                <div className="demo-actions">
                  <div className="demo-action a1">
                    <div className="demo-check" />
                    <div className="demo-label">Draft hero copy</div>
                  </div>
                  <div className="demo-action a2">
                    <div className="demo-check" />
                    <div className="demo-label">Wire pricing cards</div>
                  </div>
                  <div className="demo-action a3">
                    <div className="demo-check" />
                    <div className="demo-label">Animate demo mockup</div>
                  </div>
                  <div className="demo-action a4">
                    <div className="demo-check" />
                    <div className="demo-label">Review FAQ copy</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <p className="demo-caption">
            Daily execution, the way you wish it actually worked.
          </p>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section
        className="how-section"
        style={{ background: "hsl(var(--surface-base))" }}
      >
        <SectionHeading label="How it works" />
        <div className="how-grid">
          {STEPS.map(({ Icon, label, desc }) => (
            <div
              key={label}
              className="flex flex-col items-center text-center"
              style={{ maxWidth: 240 }}
            >
              <Icon size={64} strokeWidth={1.5} color="hsl(var(--goal-2))" />
              <div
                style={{
                  marginTop: 32,
                  fontFamily: "Inter, system-ui, sans-serif",
                  fontSize: 16,
                  fontWeight: 500,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  color: "hsl(var(--text-primary))",
                }}
              >
                {label}
              </div>
              <div
                style={{
                  marginTop: 12,
                  width: 24,
                  height: 1,
                  background: "hsl(var(--border-subtle))",
                }}
              />
              <p
                style={{
                  marginTop: 24,
                  fontFamily: "Inter, system-ui, sans-serif",
                  fontSize: 16,
                  fontWeight: 400,
                  color: "hsl(var(--text-secondary))",
                  lineHeight: 1.6,
                }}
              >
                {desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section
        className="faq-section"
        style={{ background: "hsl(var(--surface-base))" }}
      >
        <SectionHeading label="FAQ" />
        <div className="faq-list">
          {FAQS.map((item, i) => {
            const isFirst = i === 0;
            const borderTop = isFirst
              ? "1px solid hsl(var(--border-subtle))"
              : "none";
            const borderBottom = "1px solid hsl(var(--border-subtle))";

            if (item.kind === "link") {
              return (
                <Link
                  key={i}
                  to={item.to}
                  className="faq-item faq-link-row"
                  style={{
                    borderTop,
                    borderBottom,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "28px 16px",
                    margin: "0 -16px",
                    textDecoration: "none",
                    cursor: "pointer",
                    borderRadius: 4,
                  }}
                >
                  <span
                    style={{
                      fontFamily: "Inter, system-ui, sans-serif",
                      fontSize: 18,
                      fontWeight: 500,
                      color: "hsl(var(--text-secondary))",
                    }}
                    className="faq-link-text"
                  >
                    {item.q}
                  </span>
                  <ArrowUpRight
                    size={20}
                    strokeWidth={1.5}
                    color="hsl(var(--text-tertiary))"
                    style={{ flexShrink: 0, marginLeft: 16 }}
                  />
                </Link>
              );
            }

            const open = openFaq === i;
            return (
              <div
                key={i}
                className="faq-item"
                style={{ borderTop, borderBottom }}
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(open ? null : i)}
                  className="faq-trigger"
                  aria-expanded={open}
                  style={{
                    width: "100%",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "28px 0",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "Inter, system-ui, sans-serif",
                      fontSize: 18,
                      fontWeight: 500,
                      color: "hsl(var(--text-primary))",
                    }}
                  >
                    {item.q}
                  </span>
                  <ChevronDown
                    size={20}
                    strokeWidth={1.5}
                    color="hsl(var(--text-tertiary))"
                    style={{
                      transition: "transform 200ms ease",
                      transform: open ? "rotate(180deg)" : "rotate(0deg)",
                      flexShrink: 0,
                      marginLeft: 16,
                    }}
                  />
                </button>
                <div
                  className="faq-body"
                  style={{
                    overflow: "hidden",
                    maxHeight: open ? 400 : 0,
                    transition: "max-height 250ms ease-in-out",
                  }}
                >
                  <p
                    style={{
                      fontFamily: "Inter, system-ui, sans-serif",
                      fontSize: 15,
                      color: "hsl(var(--text-secondary))",
                      lineHeight: 1.6,
                      paddingTop: 0,
                      paddingBottom: 28,
                      margin: 0,
                    }}
                  >
                    {item.a}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* PRICING */}
      <section
        className="pricing-section"
        style={{ background: "hsl(var(--surface-base))" }}
      >
        <SectionHeading label="Pricing" />
        <h2 className="pricing-headline">
          Free to start. $12/mo when you're ready.
        </h2>

        <div className="pricing-grid">
          {/* FREE */}
          <div className="price-card">
            <div className="price-badge">FREE</div>
            <div className="price-block">
              <span className="price-amount">$0</span>
              <span className="price-suffix">forever</span>
            </div>
            <p className="price-tagline">For people exploring the philosophy.</p>
            <ul className="price-features">
              {FreeFeatures.map((f) => (
                <FeatureRow key={f.primary} {...f} />
              ))}
            </ul>
            <button
              type="button"
              onClick={() => navigate("/today")}
              className="price-btn-outline"
            >
              Start free
            </button>
          </div>

          {/* ALL-IN */}
          <div className="price-card price-card-featured">
            <div className="price-recommended">RECOMMENDED</div>
            <div
              className="price-badge"
              style={{ color: "hsl(var(--goal-2))" }}
            >
              ALL-IN
            </div>
            <div className="price-block">
              <span className="price-amount">$12</span>
              <span className="price-suffix">/mo</span>
            </div>
            <div className="price-subprice">or $120/yr — save 17%</div>
            <p className="price-tagline" style={{ marginTop: 28 }}>
              For people ready to commit.
            </p>
            <ul className="price-features">
              {AllInFeatures.map((f) => (
                <FeatureRow key={f.primary} {...f} />
              ))}
            </ul>
            <button
              type="button"
              onClick={() => navigate("/today")}
              className="price-btn-primary"
            >
              Go All-In
            </button>
          </div>
        </div>

        <div style={{ textAlign: "center", marginTop: 32 }}>
          <Link
            to="/pricing"
            className="pricing-compare-link"
            style={{
              fontFamily: "Inter, system-ui, sans-serif",
              fontSize: 14,
              color: "hsl(var(--text-secondary))",
              textDecoration: "none",
            }}
          >
            See full plan comparison →
          </Link>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="final-cta">
        <div aria-hidden className="final-cta-glow" />
        <div className="relative" style={{ zIndex: 1 }}>
          <h2 className="final-cta-h2">Stop scheduling. Start moving.</h2>
          <p className="final-cta-sub">
            Your goals don't need a manager.
            <br />
            They need a daily move.
          </p>
          <div style={{ display: "flex", justifyContent: "center", marginTop: 48 }}>
            <button
              type="button"
              onClick={() => navigate("/today")}
              className="cta-btn"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: "hsl(var(--goal-2))",
                color: "#0F0F12",
                fontFamily: "Inter, system-ui, sans-serif",
                fontWeight: 500,
                fontSize: 16,
                padding: "14px 32px",
                borderRadius: 6,
                border: "none",
                cursor: "pointer",
                transition: "filter 120ms ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.filter = "brightness(1.1)")}
              onMouseLeave={(e) => (e.currentTarget.style.filter = "")}
            >
              Open ActOS
              <ArrowRight size={16} />
            </button>
          </div>
          <p className="final-cta-micro">No credit card required.</p>
        </div>
      </section>

      <LandingFooter />

      <style>{`
        .landing-glow {
          background: radial-gradient(
            ellipse 800px 500px at center 55%,
            rgba(212, 136, 74, 0.08) 0%,
            rgba(212, 136, 74, 0.03) 40%,
            transparent 70%
          );
        }
        .scroll-hint { bottom: 32px; }
        @keyframes hint-bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(8px); }
        }
        .bounce { animation: hint-bounce 1.8s ease-in-out infinite; }
        .cta-btn:focus-visible {
          outline: 2px solid hsl(var(--goal-2));
          outline-offset: 3px;
        }

        .hero-h1 { font-size: 80px; }
        .hero-sub { font-size: 20px; }
        @media (max-width: 1024px) { .hero-h1 { font-size: 56px; } }
        @media (max-width: 640px) {
          .hero-h1 { font-size: 40px; }
          .hero-sub { font-size: 16px; }
          .landing-glow {
            background: radial-gradient(
              ellipse 400px 300px at center 55%,
              rgba(212, 136, 74, 0.08) 0%,
              rgba(212, 136, 74, 0.03) 40%,
              transparent 70%
            );
          }
        }

        /* DEMO */
        .demo-section { padding: 120px 24px 160px; }
        .demo-frame-wrap { max-width: 1100px; margin: 64px auto 0; }
        .demo-frame {
          width: 100%;
          aspect-ratio: 16 / 10;
          background: hsl(var(--surface-raised));
          border: 1px solid hsl(var(--border-subtle));
          border-radius: 12px;
          padding: 12px;
          box-shadow: 0 32px 80px -16px rgba(212, 136, 74, 0.08);
        }
        .demo-inner {
          width: 100%;
          height: 100%;
          background: hsl(var(--surface-base));
          border-radius: 6px;
          display: flex;
          overflow: hidden;
          font-family: Inter, system-ui, sans-serif;
        }
        .demo-sidebar {
          width: 200px;
          flex-shrink: 0;
          padding: 24px 16px;
          border-right: 1px solid hsl(var(--border-subtle));
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .demo-logo { font-size: 18px; font-weight: 500; margin-bottom: 24px; padding: 0 8px; letter-spacing: -0.02em; }
        .demo-nav-item {
          font-size: 13px;
          color: hsl(var(--text-tertiary));
          padding: 8px 12px;
          border-radius: 6px;
        }
        .demo-nav-item.active {
          color: hsl(var(--text-primary));
          background: hsl(var(--surface-raised));
        }
        .demo-content { flex: 1; padding: 32px 40px; overflow: hidden; }
        .demo-page-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 28px; }
        .demo-page-title { font-size: 28px; font-weight: 500; color: hsl(var(--text-primary)); letter-spacing: -0.01em; }
        .demo-page-date { font-size: 13px; color: hsl(var(--text-tertiary)); }
        .demo-main-card {
          background: hsl(var(--surface-raised));
          border: 1px solid hsl(var(--border-subtle));
          border-radius: 8px;
          padding: 20px 24px;
          margin-bottom: 24px;
          animation: main-pulse 12s ease-in-out infinite;
        }
        @keyframes main-pulse {
          0%, 60%, 100% { box-shadow: none; border-color: hsl(var(--border-subtle)); }
          66%, 78% { box-shadow: 0 0 24px rgba(212, 136, 74, 0.18); border-color: hsl(var(--goal-2)); }
        }
        .demo-main-label {
          font-family: "JetBrains Mono", ui-monospace, monospace;
          font-size: 11px;
          letter-spacing: 0.08em;
          color: hsl(var(--text-tertiary));
          margin-bottom: 8px;
        }
        .demo-main-title { font-size: 18px; font-weight: 500; color: hsl(var(--text-primary)); margin-bottom: 12px; }
        .demo-pill {
          display: inline-block;
          font-size: 11px;
          padding: 4px 10px;
          border-radius: 999px;
          background: hsl(var(--surface-base));
          color: hsl(var(--text-secondary));
          border: 1px solid hsl(var(--border-subtle));
        }
        .demo-actions { display: flex; flex-direction: column; gap: 6px; }
        .demo-action {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 14px;
          border-radius: 6px;
          background: transparent;
        }
        .demo-check {
          width: 16px;
          height: 16px;
          border: 1.5px solid hsl(var(--border-strong, var(--border-subtle)));
          border-radius: 4px;
          flex-shrink: 0;
          position: relative;
          transition: background 200ms ease, border-color 200ms ease;
        }
        .demo-label {
          font-size: 14px;
          color: hsl(var(--text-primary));
          position: relative;
        }
        .demo-label::after {
          content: "";
          position: absolute;
          left: 0; right: 100%;
          top: 50%;
          height: 1px;
          background: hsl(var(--text-tertiary));
          transition: right 240ms ease;
        }
        @keyframes check-fill {
          0%, 14% { background: transparent; border-color: hsl(var(--border-subtle)); }
          16%, 100% { background: hsl(var(--goal-2)); border-color: hsl(var(--goal-2)); }
        }
        @keyframes label-strike {
          0%, 14% { right: 100%; }
          22%, 100% { right: 0; }
        }
        @keyframes label-dim {
          0%, 14% { color: hsl(var(--text-primary)); }
          22%, 100% { color: hsl(var(--text-tertiary)); }
        }
        .a1 .demo-check { animation: check-fill 12s ease-in-out infinite; }
        .a1 .demo-label { animation: label-dim 12s ease-in-out infinite; }
        .a1 .demo-label::after { animation: label-strike 12s ease-in-out infinite; }
        .a2 .demo-check { animation: check-fill 12s ease-in-out infinite; animation-delay: 3s; }
        .a2 .demo-label { animation: label-dim 12s ease-in-out infinite; animation-delay: 3s; }
        .a2 .demo-label::after { animation: label-strike 12s ease-in-out infinite; animation-delay: 3s; }
        @media (prefers-reduced-motion: reduce) {
          .demo-main-card, .a1 *, .a2 *, .demo-label::after { animation: none !important; }
        }
        .demo-caption {
          margin: 48px auto 0;
          max-width: 540px;
          font-family: Inter, system-ui, sans-serif;
          font-size: 16px;
          color: hsl(var(--text-secondary));
          text-align: center;
        }
        @media (max-width: 768px) {
          .demo-section { padding: 80px 24px 100px; }
          .demo-frame-wrap { margin-top: 48px; }
          .demo-sidebar { display: none; }
          .demo-content { padding: 20px 20px; }
          .demo-page-title { font-size: 22px; }
        }

        /* HOW */
        .how-section { padding: 120px 24px 120px; }
        .how-grid {
          margin: 80px auto 0;
          max-width: 960px;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 64px;
          justify-items: center;
        }
        @media (max-width: 768px) {
          .how-section { padding: 80px 24px 80px; }
          .how-grid { grid-template-columns: 1fr; gap: 48px; margin-top: 64px; }
        }

        /* FAQ */
        .faq-section { padding: 120px 24px 120px; }
        .faq-list { max-width: 720px; margin: 80px auto 0; }
        .faq-link-row { transition: background 160ms ease; }
        .faq-link-row:hover { background: hsl(var(--surface-raised)); }
        .faq-link-row:hover .faq-link-text { color: hsl(var(--text-primary)) !important; }
        @media (max-width: 768px) {
          .faq-section { padding: 80px 24px 80px; }
          .faq-list { margin-top: 64px; }
        }

        /* PRICING */
        .pricing-section { padding: 120px 24px 120px; }
        .pricing-headline {
          margin: 32px auto 0;
          max-width: 720px;
          text-align: center;
          font-family: Inter, system-ui, sans-serif;
          font-weight: 500;
          font-size: 36px;
          line-height: 1.15;
          letter-spacing: -0.02em;
          color: hsl(var(--text-primary));
        }
        .pricing-grid {
          margin: 80px auto 0;
          max-width: 960px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }
        .price-card {
          position: relative;
          background: hsl(var(--surface-raised));
          border: 1px solid hsl(var(--border-subtle));
          border-radius: 12px;
          padding: 48px;
          display: flex;
          flex-direction: column;
        }
        .price-card-featured { border-color: hsl(var(--goal-2)); }
        .price-recommended {
          position: absolute;
          top: -12px;
          right: 32px;
          height: 24px;
          padding: 0 8px;
          background: hsl(var(--goal-2));
          color: hsl(var(--surface-base));
          font-family: "JetBrains Mono", ui-monospace, monospace;
          font-size: 11px;
          letter-spacing: 0.08em;
          border-radius: 4px;
          display: inline-flex;
          align-items: center;
        }
        .price-badge {
          font-family: "JetBrains Mono", ui-monospace, monospace;
          font-size: 11px;
          letter-spacing: 0.08em;
          color: hsl(var(--text-tertiary));
        }
        .price-block { margin-top: 16px; display: flex; align-items: baseline; gap: 8px; }
        .price-amount {
          font-family: Inter, system-ui, sans-serif;
          font-size: 56px;
          font-weight: 500;
          letter-spacing: -0.02em;
          color: hsl(var(--text-primary));
          line-height: 1;
        }
        .price-suffix { font-size: 16px; color: hsl(var(--text-secondary)); }
        .price-subprice { margin-top: 4px; font-size: 13px; color: hsl(var(--text-tertiary)); }
        .price-tagline {
          margin-top: 32px;
          font-family: Inter, system-ui, sans-serif;
          font-size: 15px;
          line-height: 1.5;
          color: hsl(var(--text-secondary));
        }
        .price-features {
          margin-top: 32px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding: 0;
          list-style: none;
        }
        .price-btn-outline, .price-btn-primary {
          margin-top: 40px;
          height: 44px;
          width: 100%;
          border-radius: 6px;
          font-family: Inter, system-ui, sans-serif;
          font-weight: 500;
          font-size: 14px;
          cursor: pointer;
          transition: filter 120ms ease, background 120ms ease;
        }
        .price-btn-outline {
          background: transparent;
          border: 1px solid hsl(var(--border-strong, var(--border-subtle)));
          color: hsl(var(--text-primary));
        }
        .price-btn-outline:hover { background: hsl(var(--surface-base)); }
        .price-btn-primary {
          background: hsl(var(--goal-2));
          color: hsl(var(--surface-base));
          border: none;
        }
        .price-btn-primary:hover { filter: brightness(1.1); }
        .pricing-compare-link:hover { color: hsl(var(--text-primary)) !important; }
        @media (max-width: 768px) {
          .pricing-section { padding: 80px 24px 80px; }
          .pricing-headline { font-size: 24px; }
          .pricing-grid { grid-template-columns: 1fr; gap: 16px; margin-top: 64px; }
          .price-card { padding: 32px 24px; }
        }

        /* FINAL CTA */
        .final-cta {
          position: relative;
          padding: 160px 24px 120px;
          text-align: center;
          overflow: hidden;
        }
        .final-cta-glow {
          position: absolute;
          inset: 0;
          background: radial-gradient(
            ellipse 600px 400px at center 50%,
            rgba(212, 136, 74, 0.06) 0%,
            transparent 70%
          );
          z-index: 0;
          pointer-events: none;
        }
        .final-cta-h2 {
          font-family: Inter, system-ui, sans-serif;
          font-weight: 500;
          font-size: 56px;
          letter-spacing: -0.02em;
          line-height: 1.1;
          color: hsl(var(--text-primary));
          max-width: 720px;
          margin: 0 auto;
        }
        .final-cta-sub {
          margin: 24px auto 0;
          font-family: Inter, system-ui, sans-serif;
          font-size: 18px;
          color: hsl(var(--text-secondary));
          line-height: 1.5;
        }
        .final-cta-micro {
          margin-top: 24px;
          font-family: Inter, system-ui, sans-serif;
          font-size: 13px;
          color: hsl(var(--text-tertiary));
        }
        @media (max-width: 768px) {
          .final-cta { padding: 100px 24px 80px; }
          .final-cta-h2 { font-size: 36px; }
          .final-cta-sub { font-size: 16px; }
        }
      `}</style>
    </div>
  );
};

export default Landing;
