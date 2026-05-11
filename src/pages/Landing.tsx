// Public marketing landing page (v5). Dark-only.
// Two screens: [Hero + Demo in 100vh] then [FAQ + Footer].

import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, ArrowUpRight, ChevronDown } from "lucide-react";
import { LandingFooter } from "@/components/LandingChrome";

type FaqItem = { q: string; a: string };

const FAQS: FaqItem[] = [
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


const TopBar: React.FC<{ scrolled: boolean }> = ({ scrolled }) => (
  <header
    className="landing-topbar"
    style={{
      background: scrolled ? "hsl(var(--surface-base) / 0.7)" : "transparent",
      backdropFilter: scrolled ? "blur(12px)" : "none",
      WebkitBackdropFilter: scrolled ? "blur(12px)" : "none",
      borderBottom: scrolled
        ? "1px solid hsl(var(--border-subtle))"
        : "1px solid transparent",
      transition: "background 200ms ease, border-color 200ms ease",
    }}
  >
    <Link to="/" aria-label="ActOS home" className="landing-logo-link">
      <span className="landing-logo">
        <span style={{ color: "hsl(var(--text-primary))" }}>Act</span>
        <span style={{ color: "hsl(var(--goal-2))" }}>OS</span>
      </span>
    </Link>
    <nav className="landing-nav">
      <Link to="/manifesto" className="nav-link nav-desktop-only">
        Manifesto
      </Link>
      <Link to="/pricing" className="nav-link nav-desktop-only">
        Pricing
      </Link>
      <Link to="/login" className="nav-link">
        Sign in
      </Link>
    </nav>
  </header>
);

const Landing: React.FC = () => {
  const navigate = useNavigate();
  const [scrolledHint, setScrolledHint] = useState(false);
  const [scrolledBar, setScrolledBar] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolledHint(y > 50);
      setScrolledBar(y > 80);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      data-theme="dark"
      className="relative flex min-h-screen flex-col"
      style={{ background: "hsl(var(--surface-base))" }}
    >
      <TopBar scrolled={scrolledBar} />

      {/* SCREEN 1: Hero + Demo in single 100vh */}
      <section
        className="relative flex flex-col items-center"
        style={{ minHeight: "100vh", paddingTop: 80, paddingBottom: 60 }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute landing-glow"
          style={{ zIndex: 0 }}
        />

        {/* Hero */}
        <div
          className="relative w-full px-6 text-center"
          style={{ zIndex: 1, marginTop: 40, maxWidth: 880 }}
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
              margin: "16px 0 0",
            }}
          >
            The OS for getting things done.
          </p>
          <button
            type="button"
            onClick={() => navigate("/today")}
            className="cta-btn"
            style={{
              marginTop: 24,
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "hsl(var(--goal-2))",
              color: "hsl(var(--surface-base))",
              fontFamily: "Inter, system-ui, sans-serif",
              fontWeight: 500,
              fontSize: 15,
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

        {/* Demo frame */}
        <div
          className="relative demo-frame-wrap"
          style={{ zIndex: 1, marginTop: 48, width: "100%", padding: "0 24px" }}
        >
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
                  <div className="demo-main-title">Ship landing page v5</div>
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
        </div>

        <div
          aria-hidden
          className="scroll-hint"
          style={{
            position: "absolute",
            bottom: 32,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 1,
            opacity: scrolledHint ? 0 : 1,
            transition: "opacity 200ms ease",
            color: "hsl(var(--text-tertiary))",
            pointerEvents: "none",
          }}
        >
          <ChevronDown size={20} strokeWidth={1.5} className="bounce" />
        </div>
      </section>

      {/* SCREEN 2: FAQ */}
      <section
        className="faq-section"
        style={{ background: "hsl(var(--surface-base))" }}
      >
        <div className="text-center">
          <h2
            className="faq-heading-h2"
            style={{
              fontFamily: "Inter, system-ui, sans-serif",
              fontSize: 36,
              fontWeight: 500,
              color: "hsl(var(--text-primary))",
              lineHeight: 1.2,
              margin: 0,
            }}
          >
            Questions, answered.
          </h2>
          <div
            style={{
              width: 40,
              height: 1,
              background: "hsl(var(--border-subtle))",
              margin: "24px auto 0",
            }}
          />
        </div>

        <Link
          to="/manifesto"
          className="manifesto-link"
          style={{
            display: "block",
            textAlign: "center",
            margin: "64px auto 0",
            maxWidth: 480,
            textDecoration: "none",
          }}
        >
          <span
            className="manifesto-link-text"
            style={{
              fontFamily: "Inter, system-ui, sans-serif",
              fontSize: 18,
              fontWeight: 500,
              color: "hsl(var(--text-primary))",
              transition: "color 200ms ease",
            }}
          >
            Why tasks and issues stop you moving toward goals.
          </span>
          <ArrowUpRight
            size={16}
            strokeWidth={1.5}
            className="manifesto-arrow"
            style={{
              display: "inline-block",
              marginLeft: 8,
              verticalAlign: "middle",
              color: "hsl(var(--goal-2))",
              transition: "filter 200ms ease",
            }}
          />
        </Link>

        <div className="faq-list" style={{ marginTop: 48 }}>
          {FAQS.map((item, i) => {
            const borderTop =
              i === 0 ? "1px solid hsl(var(--border-subtle))" : "none";
            const borderBottom = "1px solid hsl(var(--border-subtle))";

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

      <LandingFooter />

      <style>{`
        /* TOP BAR */
        .landing-topbar {
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 50;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 24px 32px;
        }
        .landing-logo-link { text-decoration: none; line-height: 1; display: inline-block; }
        .landing-logo {
          font-family: Inter, system-ui, sans-serif;
          font-size: 32px;
          font-weight: 500;
          letter-spacing: -0.02em;
          line-height: 1;
        }
        .landing-nav { display: flex; align-items: center; gap: 32px; }
        .nav-link {
          font-family: Inter, system-ui, sans-serif;
          font-size: 14px;
          color: hsl(var(--text-secondary));
          text-decoration: none;
          transition: color 120ms ease;
        }
        .nav-link:hover { color: hsl(var(--text-primary)); }
        @media (max-width: 768px) {
          .landing-topbar { padding: 16px; }
          .landing-logo { font-size: 24px; }
          .nav-desktop-only { display: none; }
        }

        /* GLOW */
        .landing-glow {
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 800px;
          height: 500px;
          background: radial-gradient(
            ellipse 800px 500px at center,
            rgba(212, 136, 74, 0.10) 0%,
            rgba(212, 136, 74, 0.04) 40%,
            transparent 70%
          );
          margin-top: 15vh;
        }

        /* SCROLL HINT */
        @keyframes hint-bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(8px); }
        }
        .bounce { animation: hint-bounce 1.8s ease-in-out infinite; }
        .cta-btn:focus-visible {
          outline: 2px solid hsl(var(--goal-2));
          outline-offset: 3px;
        }

        /* HERO TYPOGRAPHY */
        .hero-h1 { font-size: 56px; }
        .hero-sub { font-size: 18px; }
        @media (max-width: 1024px) { .hero-h1 { font-size: 40px; } }
        @media (max-width: 640px) {
          .hero-h1 { font-size: 32px; }
          .hero-sub { font-size: 16px; }
        }

        /* DEMO */
        .demo-frame-wrap { max-width: 984px; margin-left: auto; margin-right: auto; }
        .demo-frame {
          width: 100%;
          aspect-ratio: 16 / 10;
          background: hsl(var(--surface-raised));
          border: 1px solid hsl(var(--border-subtle));
          border-radius: 12px;
          padding: 12px;
          box-shadow: 0 32px 80px -16px rgba(212, 136, 74, 0.10);
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
        .demo-content { flex: 1; padding: 28px 36px; overflow: hidden; }
        .demo-page-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 24px; }
        .demo-page-title { font-size: 26px; font-weight: 500; color: hsl(var(--text-primary)); letter-spacing: -0.01em; }
        .demo-page-date { font-size: 13px; color: hsl(var(--text-tertiary)); }
        .demo-main-card {
          background: hsl(var(--surface-raised));
          border: 1px solid hsl(var(--border-subtle));
          border-radius: 8px;
          padding: 18px 22px;
          margin-bottom: 20px;
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
        .demo-main-title { font-size: 17px; font-weight: 500; color: hsl(var(--text-primary)); margin-bottom: 10px; }
        .demo-pill {
          display: inline-block;
          font-size: 11px;
          padding: 4px 10px;
          border-radius: 999px;
          background: hsl(var(--surface-base));
          color: hsl(var(--text-secondary));
          border: 1px solid hsl(var(--border-subtle));
        }
        .demo-actions { display: flex; flex-direction: column; gap: 4px; }
        .demo-action {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 12px;
          border-radius: 6px;
          background: transparent;
        }
        .demo-check {
          width: 16px;
          height: 16px;
          border: 1.5px solid hsl(var(--border-subtle));
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
          .bounce { animation: none !important; }
        }
        @media (max-width: 768px) {
          .demo-frame-wrap { padding: 0 16px !important; width: 100% !important; }
          .demo-sidebar { display: none; }
          .demo-content { padding: 18px 18px; }
          .demo-page-title { font-size: 20px; }
          .demo-main-title { font-size: 15px; }
        }

        /* FAQ */
        .faq-section { padding: 60px 24px 120px; }
        .faq-list { max-width: 720px; margin: 0 auto; }
        .faq-heading-h2 { font-size: 36px; }
        .manifesto-link:hover .manifesto-link-text { color: hsl(var(--goal-2)) !important; }
        .manifesto-link:hover .manifesto-arrow { filter: brightness(1.1); }
        @media (max-width: 768px) {
          .faq-section { padding: 48px 24px 80px; }
          .faq-heading-h2 { font-size: 28px; }
        }
      `}</style>
    </div>
  );
};

export default Landing;
