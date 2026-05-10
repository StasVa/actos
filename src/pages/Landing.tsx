// Public marketing landing page. Single-viewport, dark-only.
// All colors via CSS tokens. Static radial glow behind hero.

import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { LandingTopBar, LandingFooter } from "@/components/LandingChrome";

const Landing: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div
      data-theme="dark"
      className="relative flex min-h-screen flex-col"
      style={{ background: "hsl(var(--surface-base))" }}
    >
      {/* Radial glow — static, behind everything */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 landing-glow"
        style={{ zIndex: 0 }}
      />

      <div className="relative" style={{ zIndex: 1 }}>
        <LandingTopBar logoIsHome />
      </div>

      <main className="relative flex flex-1 flex-col items-center justify-center px-6 text-center" style={{ zIndex: 1 }}>
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
        Stop scheduling. Start moving. <span style={{ color: "hsl(var(--goal-2))" }}>→</span>
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

      </main>

      <div className="relative" style={{ zIndex: 1 }}>
        <LandingFooter />
      </div>

      <style>{`
        .landing-glow {
          background: radial-gradient(
            ellipse 800px 500px at center 55%,
            rgba(212, 136, 74, 0.08) 0%,
            rgba(212, 136, 74, 0.03) 40%,
            transparent 70%
          );
        }
        @media (max-width: 768px) {
          .landing-glow {
            background: radial-gradient(
              ellipse 400px 300px at center 55%,
              rgba(212, 136, 74, 0.08) 0%,
              rgba(212, 136, 74, 0.03) 40%,
              transparent 70%
            );
          }
        }
        .cta-btn:focus-visible {
          outline: 2px solid hsl(var(--goal-2));
          outline-offset: 3px;
        }
        .manifesto-link:hover { color: hsl(var(--text-primary)) !important; }
        .manifesto-link:hover span { filter: brightness(1.1); }
      `}</style>
    </div>
  );
};

export default Landing;
