// Public marketing landing page. Dark-only.
// Hero (single viewport) + How it works + FAQ + Footer.

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, ChevronDown, Target, LayoutGrid, Zap } from "lucide-react";
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

const FAQS = [
  {
    q: "Why only 3 goals?",
    a: "Because almost no one actually moves more than 2 at a time. The cap isn't restrictive — it's protective. If you can't pick 3, you'll fail at all of them.",
  },
  {
    q: "What if I have 200 things to do?",
    a: "ActOS isn't built for that load. Tasks unrelated to your 2-3 goals don't belong here. If you're juggling 200 items, the real question is why you took them all on.",
  },
  {
    q: "Is this just another todo app?",
    a: "No. Todo apps optimize for capturing things to do. ActOS optimizes for moving toward things you decided matter. Different problem, different design.",
  },
  {
    q: "Does it work on mobile?",
    a: "Yes. The web app works on phones today. Native iOS and Android apps come post-launch.",
  },
  {
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
      <section className="relative flex flex-col" style={{ minHeight: "100vh" }}>
        {/* Radial glow */}
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
            className="mx-auto"
            style={{
              fontFamily: "Inter, system-ui, sans-serif",
              fontWeight: 500,
              color: "hsl(var(--text-primary))",
              maxWidth: 880,
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
              fontSize: "clamp(40px, 7vw, 72px)",
              margin: 0,
            }}
          >
            The OS for getting things done.
          </h1>
          <p
            style={{
              fontFamily: "Inter, system-ui, sans-serif",
              fontWeight: 400,
              color: "hsl(var(--text-secondary))",
              marginTop: 16,
              fontSize: "clamp(16px, 1.6vw, 20px)",
            }}
          >
            Action moves you forward.
          </p>

          <a
            href="/manifesto"
            onClick={(e) => {
              e.preventDefault();
              navigate("/manifesto");
            }}
            className="manifesto-link"
            style={{
              marginTop: 24,
              fontFamily: "Inter, system-ui, sans-serif",
              fontSize: 14,
              fontWeight: 400,
              color: "hsl(var(--text-secondary))",
              textDecoration: "none",
            }}
          >
            Stop scheduling. Start moving.{" "}
            <span style={{ color: "hsl(var(--goal-2))" }}>→</span>
          </a>

          <button
            type="button"
            onClick={() => navigate("/today")}
            className="cta-btn"
            style={{
              marginTop: 32,
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

        {/* Scroll hint */}
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
            const open = openFaq === i;
            return (
              <div
                key={i}
                className="faq-item"
                style={{
                  borderTop: i === 0 ? "1px solid hsl(var(--border-subtle))" : "none",
                  borderBottom: "1px solid hsl(var(--border-subtle))",
                }}
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
                      paddingTop: 16,
                      paddingBottom: 16,
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

        <div
          className="flex flex-col items-center text-center"
          style={{ marginTop: 48 }}
        >
          <p
            style={{
              fontFamily: "Inter, system-ui, sans-serif",
              fontSize: 16,
              color: "hsl(var(--text-secondary))",
              maxWidth: 540,
              margin: 0,
            }}
          >
            Still have questions? Open ActOS — it answers most of them faster.
          </p>
          <button
            type="button"
            onClick={() => navigate("/today")}
            className="cta-btn"
            style={{
              marginTop: 32,
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "hsl(var(--goal-2))",
              color: "#0F0F12",
              fontFamily: "Inter, system-ui, sans-serif",
              fontWeight: 500,
              fontSize: 14,
              height: 40,
              padding: "0 24px",
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
        .scroll-hint { bottom: 48px; }
        @media (max-width: 768px) {
          .scroll-hint { bottom: 32px; }
          .landing-glow {
            background: radial-gradient(
              ellipse 400px 300px at center 55%,
              rgba(212, 136, 74, 0.08) 0%,
              rgba(212, 136, 74, 0.03) 40%,
              transparent 70%
            );
          }
        }
        @keyframes hint-bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(8px); }
        }
        .bounce { animation: hint-bounce 1.8s ease-in-out infinite; }
        .cta-btn:focus-visible {
          outline: 2px solid hsl(var(--goal-2));
          outline-offset: 3px;
        }
        .manifesto-link:hover { color: hsl(var(--text-primary)) !important; }
        .manifesto-link:hover span { filter: brightness(1.1); }

        .how-section { padding: 160px 24px 120px; }
        .how-grid {
          margin: 80px auto 0;
          max-width: 960px;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 64px;
          justify-items: center;
        }
        @media (max-width: 768px) {
          .how-section { padding: 100px 24px 80px; }
          .how-grid { grid-template-columns: 1fr; gap: 48px; margin-top: 64px; }
        }

        .faq-section { padding: 120px 24px 160px; }
        .faq-list { max-width: 720px; margin: 80px auto 0; }
        @media (max-width: 768px) {
          .faq-section { padding: 80px 24px 100px; }
          .faq-list { margin-top: 64px; }
        }
      `}</style>
    </div>
  );
};

export default Landing;
