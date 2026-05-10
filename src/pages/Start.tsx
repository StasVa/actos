// Performance landing page at /start — for paid traffic.
// Same dark theme + tokens as / landing, but with content depth.
// All colors via CSS tokens. Sticky top bar with CTA appears after hero.

import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  Check,
  ChevronDown,
  Github,
  Linkedin,
  Minimize2,
  Star,
  Target,
  Twitter,
  X,
} from "lucide-react";
import { LandingFooter } from "@/components/LandingChrome";

// ============================================================================
// Sticky top bar — appears after hero scrolls 80% past
// ============================================================================
const StickyTopBar: React.FC = () => {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const trigger = window.innerHeight * 0.8;
      setVisible(window.scrollY > trigger);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className="start-sticky-bar"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? "auto" : "none",
        transition: "opacity 200ms ease",
        background: "hsl(var(--surface-base) / 0.75)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderBottom: "1px solid hsl(var(--border-subtle))",
      }}
    >
      <div
        className="mx-auto flex items-center justify-between"
        style={{ height: 64, maxWidth: 1200, padding: "0 24px" }}
      >
        <Link
          to="/"
          aria-label="ActOS home"
          style={{
            fontFamily: "Inter, system-ui, sans-serif",
            fontSize: 22,
            fontWeight: 500,
            letterSpacing: "-0.02em",
            textDecoration: "none",
            lineHeight: 1,
          }}
        >
          <span style={{ color: "hsl(var(--text-primary))" }}>Act</span>
          <span style={{ color: "hsl(var(--goal-2))" }}>OS</span>
        </Link>
        <div className="flex items-center" style={{ gap: 16 }}>
          <Link
            to="/login"
            className="signin-link-sticky"
            style={{
              fontFamily: "Inter, system-ui, sans-serif",
              fontSize: 14,
              color: "hsl(var(--text-secondary))",
              textDecoration: "none",
            }}
          >
            Sign in
          </Link>
          <button
            type="button"
            onClick={() => navigate("/today")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "hsl(var(--goal-2))",
              color: "#0F0F12",
              fontFamily: "Inter, system-ui, sans-serif",
              fontWeight: 500,
              fontSize: 13,
              padding: "0 16px",
              height: 36,
              borderRadius: 6,
              border: "none",
              cursor: "pointer",
              transition: "filter 120ms ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.filter = "brightness(1.1)")}
            onMouseLeave={(e) => (e.currentTarget.style.filter = "")}
          >
            Open ActOS
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
      <style>{`.signin-link-sticky:hover { color: hsl(var(--text-primary)) !important; }`}</style>
    </div>
  );
};

// ============================================================================
// Hero
// ============================================================================
const Hero: React.FC = () => {
  const navigate = useNavigate();
  return (
    <section
      className="relative flex flex-col"
      style={{ minHeight: "100vh", background: "hsl(var(--surface-base))" }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 start-hero-glow"
        style={{ zIndex: 0 }}
      />

      {/* Top bar (in-flow on hero, not sticky) */}
      <div className="relative" style={{ zIndex: 2 }}>
        <div className="start-hero-topbar">
          <Link
            to="/"
            aria-label="ActOS home"
            style={{
              fontFamily: "Inter, system-ui, sans-serif",
              fontSize: 32,
              fontWeight: 500,
              letterSpacing: "-0.02em",
              textDecoration: "none",
              lineHeight: 1,
            }}
          >
            <span style={{ color: "hsl(var(--text-primary))" }}>Act</span>
            <span style={{ color: "hsl(var(--goal-2))" }}>OS</span>
          </Link>
          <Link
            to="/login"
            className="signin-link-hero"
            style={{
              fontFamily: "Inter, system-ui, sans-serif",
              fontSize: 14,
              color: "hsl(var(--text-secondary))",
              textDecoration: "none",
            }}
          >
            Sign in
          </Link>
        </div>
      </div>

      <div
        className="relative flex flex-1 flex-col items-center justify-center px-6 text-center"
        style={{ zIndex: 1 }}
      >
        <h1
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

        <Link
          to="/manifesto"
          className="manifesto-link-start"
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
        </Link>

        <button
          type="button"
          onClick={() => navigate("/today")}
          className="cta-btn-start"
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
        className="start-scroll-hint"
        style={{
          position: "absolute",
          bottom: 32,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          zIndex: 1,
        }}
      >
        <ChevronDown size={24} style={{ color: "hsl(var(--text-tertiary))" }} />
      </div>

      <style>{`
        .start-hero-topbar {
          position: absolute;
          top: 32px; left: 32px; right: 32px;
          display: flex; align-items: center; justify-content: space-between;
        }
        @media (max-width: 768px) {
          .start-hero-topbar { top: 16px; left: 16px; right: 16px; }
        }
        .signin-link-hero:hover { color: hsl(var(--text-primary)) !important; }
        .manifesto-link-start:hover { color: hsl(var(--text-primary)) !important; }
        .manifesto-link-start:hover span { filter: brightness(1.1); }
        .cta-btn-start:focus-visible {
          outline: 2px solid hsl(var(--goal-2));
          outline-offset: 3px;
        }
        .start-hero-glow {
          background: radial-gradient(
            ellipse 800px 500px at center 55%,
            rgba(212, 136, 74, 0.08) 0%,
            rgba(212, 136, 74, 0.03) 40%,
            transparent 70%
          );
        }
        @media (max-width: 768px) {
          .start-hero-glow {
            background: radial-gradient(
              ellipse 400px 300px at center 55%,
              rgba(212, 136, 74, 0.08) 0%,
              rgba(212, 136, 74, 0.03) 40%,
              transparent 70%
            );
          }
        }
        @keyframes start-bounce {
          0%, 100% { transform: translateY(0); opacity: 0.6; }
          50% { transform: translateY(12px); opacity: 1; }
        }
        .start-scroll-hint { animation: start-bounce 1.5s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .start-scroll-hint { animation: none; }
        }
      `}</style>
    </section>
  );
};

// ============================================================================
// Reusable section heading
// ============================================================================
const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    style={{
      fontFamily: '"JetBrains Mono", ui-monospace, monospace',
      fontSize: 14,
      textTransform: "uppercase",
      letterSpacing: "0.06em",
      color: "hsl(var(--text-tertiary))",
    }}
  >
    {children}
  </div>
);

const SectionTitle: React.FC<{ children: React.ReactNode; size?: "lg" | "xl" }> = ({
  children,
  size = "lg",
}) => (
  <h2
    style={{
      fontFamily: "Inter, system-ui, sans-serif",
      fontWeight: 500,
      color: "hsl(var(--text-primary))",
      lineHeight: 1.15,
      letterSpacing: "-0.02em",
      margin: 0,
      marginTop: 8,
      fontSize: size === "xl" ? "clamp(24px, 4vw, 36px)" : "clamp(24px, 3.5vw, 32px)",
    }}
  >
    {children}
  </h2>
);

const sectionPadding: React.CSSProperties = {
  paddingTop: "clamp(80px, 10vw, 120px)",
  paddingBottom: "clamp(80px, 10vw, 120px)",
  paddingLeft: 24,
  paddingRight: 24,
};

// ============================================================================
// Section 2 — The task trap
// ============================================================================
const TaskTrap: React.FC = () => (
  <section style={{ ...sectionPadding, background: "hsl(var(--surface-base))" }}>
    <div className="mx-auto" style={{ maxWidth: 1200 }}>
      <blockquote
        style={{
          maxWidth: 880,
          margin: "0 auto",
          paddingLeft: 24,
          borderLeft: "2px solid hsl(var(--goal-2))",
          fontFamily: "Inter, system-ui, sans-serif",
          fontWeight: 400,
          color: "hsl(var(--text-primary))",
          lineHeight: 1.3,
          fontSize: "clamp(24px, 3.5vw, 36px)",
          textAlign: "left",
        }}
      >
        Tasks promise control. They deliver busywork.
      </blockquote>

      <div
        className="start-trap-grid"
        style={{
          marginTop: 64,
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 24,
        }}
      >
        {[
          { h: "47 checkmarks.", s: "0 progress." },
          { h: "Friday again.", s: "Where did the week go?" },
          { h: "Goals slipping.", s: "Another week, no real movement." },
        ].map((c, i) => (
          <div
            key={i}
            style={{
              background: "hsl(var(--surface-raised))",
              border: "1px solid hsl(var(--border-subtle))",
              borderRadius: 8,
              padding: 32,
            }}
          >
            <div
              style={{
                fontFamily: "Inter, system-ui, sans-serif",
                fontSize: 20,
                fontWeight: 500,
                color: "hsl(var(--text-primary))",
              }}
            >
              {c.h}
            </div>
            <div
              style={{
                marginTop: 8,
                fontFamily: "Inter, system-ui, sans-serif",
                fontSize: 14,
                lineHeight: 1.5,
                color: "hsl(var(--text-secondary))",
              }}
            >
              {c.s}
            </div>
          </div>
        ))}
      </div>
    </div>
    <style>{`
      @media (max-width: 768px) {
        .start-trap-grid { grid-template-columns: 1fr !important; gap: 16px !important; }
      }
    `}</style>
  </section>
);

// ============================================================================
// Section 3 — How it works (3 steps with screenshot placeholders)
// ============================================================================
const ScreenshotFrame: React.FC<{ alt: string; caption?: string }> = ({ alt, caption }) => (
  <div>
    {/* TODO: Replace this placeholder with the real screenshot. */}
    <div
      style={{
        background: "hsl(var(--surface-raised))",
        border: "1px solid hsl(var(--border-subtle))",
        borderRadius: 8,
        padding: 4,
      }}
    >
      <div
        role="img"
        aria-label={alt}
        style={{
          width: "100%",
          aspectRatio: "16 / 10",
          borderRadius: 6,
          background:
            "linear-gradient(135deg, hsl(var(--surface-hover)) 0%, hsl(var(--surface-base)) 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "hsl(var(--text-tertiary))",
          fontFamily: '"JetBrains Mono", ui-monospace, monospace',
          fontSize: 12,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
        }}
      >
        screenshot placeholder
      </div>
    </div>
    {caption && (
      <div
        style={{
          marginTop: 12,
          fontFamily: "Inter, system-ui, sans-serif",
          fontSize: 12,
          fontStyle: "italic",
          color: "hsl(var(--text-tertiary))",
          textAlign: "center",
        }}
      >
        {caption}
      </div>
    )}
  </div>
);

const Step: React.FC<{
  num: string;
  title: string;
  body: string;
  imageAlt: string;
  imageLeft: boolean;
}> = ({ num, title, body, imageAlt, imageLeft }) => (
  <div
    className="start-step"
    style={{
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 64,
      alignItems: "center",
    }}
  >
    {imageLeft ? (
      <>
        <div className="start-step-image"><ScreenshotFrame alt={imageAlt} /></div>
        <div className="start-step-text">
          <StepText num={num} title={title} body={body} />
        </div>
      </>
    ) : (
      <>
        <div className="start-step-text">
          <StepText num={num} title={title} body={body} />
        </div>
        <div className="start-step-image"><ScreenshotFrame alt={imageAlt} /></div>
      </>
    )}
  </div>
);

const StepText: React.FC<{ num: string; title: string; body: string }> = ({
  num,
  title,
  body,
}) => (
  <div>
    <div
      style={{
        fontFamily: "Inter, system-ui, sans-serif",
        fontSize: "clamp(56px, 7vw, 80px)",
        fontWeight: 200,
        color: "hsl(var(--goal-2))",
        lineHeight: 1,
        letterSpacing: "-0.02em",
      }}
    >
      {num}
    </div>
    <div
      style={{
        marginTop: 16,
        fontFamily: "Inter, system-ui, sans-serif",
        fontSize: "clamp(24px, 3vw, 32px)",
        fontWeight: 500,
        color: "hsl(var(--text-primary))",
        letterSpacing: "-0.02em",
        lineHeight: 1.2,
      }}
    >
      {title}
    </div>
    <p
      style={{
        marginTop: 16,
        marginBottom: 0,
        fontFamily: "Inter, system-ui, sans-serif",
        fontSize: 16,
        lineHeight: 1.6,
        color: "hsl(var(--text-secondary))",
        maxWidth: 480,
      }}
    >
      {body}
    </p>
  </div>
);

const HowItWorks: React.FC = () => (
  <section style={{ ...sectionPadding, background: "hsl(var(--surface-base))" }}>
    <div className="mx-auto text-center" style={{ maxWidth: 1200 }}>
      <SectionLabel>How it works</SectionLabel>
      <SectionTitle size="xl">Action, not action items.</SectionTitle>
    </div>

    <div
      className="mx-auto"
      style={{ maxWidth: 1200, marginTop: 80, display: "flex", flexDirection: "column", gap: 80 }}
    >
      <Step
        num="01"
        title="Pick 2-3 goals."
        body="ActOS caps you at 3 active goals. Not as a guideline — as a hard limit. The system literally won't let you add a fourth. Focus is the entire game."
        imageAlt="ActOS goals page showing the 3-goal cap"
        imageLeft={false}
      />
      <Step
        num="02"
        title="Plan one Main Task daily."
        body="Every morning, ActOS asks one question: what single thing makes today a win? Not five priorities. One. The other actions you complete are bonus."
        imageAlt="ActOS plan-today flow showing Main Task selection"
        imageLeft={true}
      />
      <Step
        num="03"
        title="Move forward, every day."
        body="See progress accumulate across goals, projects, and rituals. Every action carries Impact and Time — so the work compounds toward what matters."
        imageAlt="ActOS progress page showing goal progression"
        imageLeft={false}
      />
    </div>

    <style>{`
      @media (max-width: 768px) {
        .start-step {
          grid-template-columns: 1fr !important;
          gap: 32px !important;
        }
        .start-step-text { order: 1; }
        .start-step-image { order: 2; }
      }
    `}</style>
  </section>
);

// ============================================================================
// Section 4 — Differentiators
// ============================================================================
const Differentiators: React.FC = () => {
  const items = [
    {
      Icon: Target,
      title: "Hard goal cap",
      body:
        "Maximum 3 active goals. Not a recommendation — a hard limit. Forces the focus most people won't enforce themselves.",
    },
    {
      Icon: Star,
      title: "Main Task ritual",
      body:
        "Every day starts with one question: what single thing makes today a win? The floor, not the ceiling.",
    },
    {
      Icon: BarChart3,
      title: "Impact > Time",
      body:
        "Every action carries an Impact score (1-10) and time estimate. The product surfaces high-impact work — so you don't spend Tuesday on busywork.",
    },
    {
      Icon: Minimize2,
      title: "No project clutter",
      body:
        "No tags. No labels. No subtasks-of-subtasks. Just goals → projects → actions. Three levels, no exceptions.",
    },
  ];

  return (
    <section style={{ ...sectionPadding, background: "hsl(var(--surface-base))" }}>
      <div className="mx-auto text-center" style={{ maxWidth: 1200 }}>
        <SectionLabel>Why it's different</SectionLabel>
        <SectionTitle>Built around three principles, not 30 features.</SectionTitle>
      </div>
      <div
        className="mx-auto start-diff-grid"
        style={{
          maxWidth: 1080,
          marginTop: 80,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 24,
        }}
      >
        {items.map(({ Icon, title, body }) => (
          <div
            key={title}
            style={{
              background: "hsl(var(--surface-raised))",
              border: "1px solid hsl(var(--border-subtle))",
              borderRadius: 8,
              padding: 32,
            }}
          >
            <Icon size={16} style={{ color: "hsl(var(--goal-2))" }} />
            <div
              style={{
                marginTop: 16,
                fontFamily: "Inter, system-ui, sans-serif",
                fontSize: 18,
                fontWeight: 500,
                color: "hsl(var(--text-primary))",
              }}
            >
              {title}
            </div>
            <p
              style={{
                marginTop: 8,
                marginBottom: 0,
                fontFamily: "Inter, system-ui, sans-serif",
                fontSize: 14,
                lineHeight: 1.6,
                color: "hsl(var(--text-secondary))",
              }}
            >
              {body}
            </p>
          </div>
        ))}
      </div>
      <style>{`
        @media (max-width: 768px) {
          .start-diff-grid { grid-template-columns: 1fr !important; gap: 16px !important; }
        }
      `}</style>
    </section>
  );
};

// ============================================================================
// Section 5 — Founder manifesto excerpt
// ============================================================================
const FounderExcerpt: React.FC = () => (
  <section style={{ ...sectionPadding, background: "hsl(var(--surface-raised))" }}>
    <div
      className="mx-auto text-center"
      style={{ maxWidth: 720, paddingLeft: 0, paddingRight: 0 }}
    >
      <SectionLabel>From the founder</SectionLabel>
      <p
        style={{
          marginTop: 32,
          fontFamily: "Inter, system-ui, sans-serif",
          fontSize: "clamp(22px, 2.6vw, 28px)",
          fontWeight: 400,
          lineHeight: 1.4,
          color: "hsl(var(--text-primary))",
        }}
      >
        It's not the tool's job to give you permission to be unfocused.
      </p>
      <div
        style={{
          marginTop: 32,
          display: "flex",
          flexDirection: "column",
          gap: 20,
          fontFamily: "Inter, system-ui, sans-serif",
          fontSize: 16,
          lineHeight: 1.7,
          color: "hsl(var(--text-secondary))",
          textAlign: "left",
        }}
      >
        <p style={{ margin: 0 }}>
          Most productivity tools are built around a comforting lie: that if you can just
          capture every task, label it, sort it, and surface it at the right time — you'll
          finally make progress on what matters.
        </p>
        <p style={{ margin: 0 }}>
          The truth is simpler and harder. Lists don't move you. Decisions do. The act of
          writing something down is not the same as the act of doing it — and most of what
          ends up on a list shouldn't have been there in the first place.
        </p>
        <p style={{ margin: 0 }}>
          ActOS is the opposite bet. Fewer goals. One Main Task. A small, daily move toward
          something you decided actually matters. That's it.
        </p>
      </div>
      <div style={{ marginTop: 32 }}>
        <Link
          to="/manifesto"
          className="manifesto-readmore"
          style={{
            fontFamily: "Inter, system-ui, sans-serif",
            fontSize: 14,
            color: "hsl(var(--text-secondary))",
            textDecoration: "none",
          }}
        >
          Read the full manifesto{" "}
          <span style={{ color: "hsl(var(--goal-2))" }}>→</span>
        </Link>
      </div>
    </div>
    <style>{`
      .manifesto-readmore:hover { color: hsl(var(--text-primary)) !important; }
      .manifesto-readmore:hover span { filter: brightness(1.1); }
    `}</style>
  </section>
);

// ============================================================================
// Section 6 — For / NOT for
// ============================================================================
const ForNotFor: React.FC = () => {
  const warningColor = "#C57F4A";
  const forItems = [
    { b: "You have 2-3 things that genuinely matter", s: "career direction, fitness, language, side project, finance overhaul." },
    { b: "You're tired of busywork wins", s: "checkbox dopamine without real progress." },
    { b: "You're willing to drop 80% of your \"to-do\" list", s: "to actually move on what's left." },
    { b: "You believe focus beats coverage", s: "would rather do less, well, than more, badly." },
  ];
  const notForItems = [
    { b: "You have 200+ tasks to manage", s: "ActOS won't help you carry that load. We'll ask why you took it on." },
    { b: "You want a kanban board", s: "Trello does that. Linear does that. We don't." },
    { b: "You want AI to write your todos", s: "that's optimizing the wrong layer. We optimize what gets done, not what gets listed." },
    { b: "You're looking for a free productivity app forever", s: "ActOS is $12/mo after Free tier. We charge because focus is worth paying for." },
  ];

  const renderList = (
    items: { b: string; s: string }[],
    Icon: typeof Check,
    color: string,
  ) => (
    <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 16 }}>
      {items.map((it) => (
        <li key={it.b} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          <Icon size={18} style={{ color, flexShrink: 0, marginTop: 4 }} />
          <span
            style={{
              fontFamily: "Inter, system-ui, sans-serif",
              fontSize: 16,
              lineHeight: 1.6,
              color: "hsl(var(--text-secondary))",
            }}
          >
            <span style={{ color: "hsl(var(--text-primary))", fontWeight: 500 }}>
              {it.b}
            </span>{" "}
            — {it.s}
          </span>
        </li>
      ))}
    </ul>
  );

  return (
    <section style={{ ...sectionPadding, background: "hsl(var(--surface-base))" }}>
      <div className="mx-auto text-center" style={{ maxWidth: 1200 }}>
        <SectionLabel>Honest disclaimer</SectionLabel>
        <SectionTitle size="xl">ActOS isn't for everyone.</SectionTitle>
      </div>
      <div
        className="mx-auto start-fornot-grid"
        style={{
          maxWidth: 1080,
          marginTop: 80,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 64,
        }}
      >
        <div>
          <div
            style={{
              fontFamily: "Inter, system-ui, sans-serif",
              fontSize: 18,
              fontWeight: 500,
              color: "hsl(var(--goal-2))",
              marginBottom: 24,
            }}
          >
            For
          </div>
          {renderList(forItems, Check, "hsl(var(--goal-2))")}
        </div>
        <div>
          <div
            style={{
              fontFamily: "Inter, system-ui, sans-serif",
              fontSize: 18,
              fontWeight: 500,
              color: warningColor,
              marginBottom: 24,
            }}
          >
            NOT for
          </div>
          {renderList(notForItems, X, warningColor)}
        </div>
      </div>
      <style>{`
        @media (max-width: 768px) {
          .start-fornot-grid { grid-template-columns: 1fr !important; gap: 48px !important; }
        }
      `}</style>
    </section>
  );
};

// ============================================================================
// Section 7 — Testimonials (placeholder)
// ============================================================================
const Testimonials: React.FC = () => {
  /* TODO: Replace with real customer quotes before launch. Three placeholders here for visual layout. */
  const placeholder = {
    quote:
      "This is where a real testimonial will go once we have one. The quote demonstrates how ActOS changed someone's relationship with their goals — concrete, specific, and probably mentions one feature by name.",
    name: "Real Person",
    role: "Founder, Some Company",
  };
  const items = [placeholder, placeholder, placeholder];

  return (
    <section style={{ ...sectionPadding, background: "hsl(var(--surface-base))" }}>
      <div className="mx-auto text-center" style={{ maxWidth: 1200 }}>
        <SectionLabel>From people using it</SectionLabel>
        <SectionTitle>Built for people who decided to focus.</SectionTitle>
      </div>
      <div
        className="mx-auto start-testi-grid"
        style={{
          maxWidth: 1200,
          marginTop: 64,
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 24,
        }}
      >
        {items.map((it, i) => (
          <div
            key={i}
            style={{
              background: "hsl(var(--surface-raised))",
              border: "1px solid hsl(var(--border-subtle))",
              borderRadius: 8,
              padding: 32,
            }}
          >
            <div style={{ display: "flex", gap: 4 }}>
              {[0, 1, 2, 3, 4].map((s) => (
                <Star
                  key={s}
                  size={14}
                  fill="hsl(var(--goal-2))"
                  style={{ color: "hsl(var(--goal-2))" }}
                />
              ))}
            </div>
            <p
              style={{
                marginTop: 16,
                marginBottom: 0,
                fontFamily: "Inter, system-ui, sans-serif",
                fontSize: 16,
                lineHeight: 1.6,
                color: "hsl(var(--text-primary))",
              }}
            >
              {it.quote}
            </p>
            <div style={{ marginTop: 24 }}>
              <div
                style={{
                  fontFamily: "Inter, system-ui, sans-serif",
                  fontSize: 14,
                  fontWeight: 500,
                  color: "hsl(var(--text-primary))",
                }}
              >
                {it.name}
              </div>
              <div
                style={{
                  fontFamily: "Inter, system-ui, sans-serif",
                  fontSize: 13,
                  color: "hsl(var(--text-secondary))",
                }}
              >
                {it.role}
              </div>
            </div>
          </div>
        ))}
      </div>
      <style>{`
        @media (max-width: 768px) {
          .start-testi-grid { grid-template-columns: 1fr !important; gap: 16px !important; }
        }
      `}</style>
    </section>
  );
};

// ============================================================================
// Section 8 — Pricing
// ============================================================================
const Pricing: React.FC = () => {
  const navigate = useNavigate();
  const Feature: React.FC<{ children: React.ReactNode; bold?: boolean }> = ({
    children,
    bold,
  }) => (
    <li style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
      <Check
        size={14}
        style={{ color: "hsl(var(--goal-2))", flexShrink: 0, marginTop: 6 }}
      />
      <span
        style={{
          fontFamily: "Inter, system-ui, sans-serif",
          fontSize: 16,
          color: "hsl(var(--text-primary))",
          fontWeight: bold ? 500 : 400,
        }}
      >
        {children}
      </span>
    </li>
  );

  return (
    <section style={{ ...sectionPadding, background: "hsl(var(--surface-base))" }}>
      <div className="mx-auto text-center" style={{ maxWidth: 1200 }}>
        <SectionLabel>Pricing</SectionLabel>
        <SectionTitle size="xl">Free to start. $12 to commit.</SectionTitle>
      </div>
      <div
        className="mx-auto start-pricing-grid"
        style={{
          maxWidth: 880,
          marginTop: 64,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 24,
        }}
      >
        {/* Free */}
        <div
          style={{
            background: "hsl(var(--surface-raised))",
            border: "1px solid hsl(var(--border-subtle))",
            borderRadius: 8,
            padding: 40,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              fontFamily: '"JetBrains Mono", ui-monospace, monospace',
              fontSize: 12,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: "hsl(var(--text-tertiary))",
            }}
          >
            Free
          </div>
          <div style={{ marginTop: 16, display: "flex", alignItems: "baseline", gap: 8 }}>
            <span
              style={{
                fontFamily: "Inter, system-ui, sans-serif",
                fontSize: 48,
                fontWeight: 500,
                color: "hsl(var(--text-primary))",
                letterSpacing: "-0.02em",
              }}
            >
              $0
            </span>
            <span
              style={{
                fontFamily: "Inter, system-ui, sans-serif",
                fontSize: 14,
                color: "hsl(var(--text-secondary))",
              }}
            >
              forever
            </span>
          </div>
          <ul
            style={{
              listStyle: "none",
              padding: 0,
              marginTop: 32,
              marginBottom: 32,
              display: "flex",
              flexDirection: "column",
              gap: 12,
              flex: 1,
            }}
          >
            <Feature>All current features</Feature>
            <Feature>Up to 2 active goals</Feature>
            <Feature>90 days of history</Feature>
            <Feature>Standard support</Feature>
          </ul>
          <button
            type="button"
            onClick={() => navigate("/today")}
            style={{
              width: "100%",
              background: "transparent",
              color: "hsl(var(--text-primary))",
              fontFamily: "Inter, system-ui, sans-serif",
              fontWeight: 500,
              fontSize: 15,
              padding: "12px 24px",
              borderRadius: 6,
              border: "1px solid hsl(var(--border-default))",
              cursor: "pointer",
              transition: "background 120ms ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "hsl(var(--surface-hover))")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            Start free
          </button>
        </div>

        {/* All-In */}
        <div
          style={{
            background: "hsl(var(--surface-raised))",
            border: "1px solid hsl(var(--goal-2))",
            borderRadius: 8,
            padding: 40,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              fontFamily: '"JetBrains Mono", ui-monospace, monospace',
              fontSize: 12,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: "hsl(var(--goal-2))",
            }}
          >
            All-In
          </div>
          <div style={{ marginTop: 16, display: "flex", alignItems: "baseline", gap: 8 }}>
            <span
              style={{
                fontFamily: "Inter, system-ui, sans-serif",
                fontSize: 48,
                fontWeight: 500,
                color: "hsl(var(--text-primary))",
                letterSpacing: "-0.02em",
              }}
            >
              $12
            </span>
            <span
              style={{
                fontFamily: "Inter, system-ui, sans-serif",
                fontSize: 14,
                color: "hsl(var(--text-secondary))",
              }}
            >
              /mo
            </span>
          </div>
          <div
            style={{
              marginTop: 8,
              fontFamily: "Inter, system-ui, sans-serif",
              fontSize: 13,
              color: "hsl(var(--text-tertiary))",
            }}
          >
            or $120/yr · save 17%
          </div>
          <ul
            style={{
              listStyle: "none",
              padding: 0,
              marginTop: 32,
              marginBottom: 32,
              display: "flex",
              flexDirection: "column",
              gap: 12,
              flex: 1,
            }}
          >
            <Feature>Everything in Free</Feature>
            <Feature bold>Up to 3 active goals (full philosophy)</Feature>
            <Feature bold>Unlimited history</Feature>
            <Feature bold>Priority support (48h email)</Feature>
            <Feature bold>Every future feature included</Feature>
            <Feature bold>Price locked at signup</Feature>
          </ul>
          <button
            type="button"
            onClick={() => navigate("/today")}
            style={{
              width: "100%",
              background: "hsl(var(--goal-2))",
              color: "#0F0F12",
              fontFamily: "Inter, system-ui, sans-serif",
              fontWeight: 500,
              fontSize: 15,
              padding: "12px 24px",
              borderRadius: 6,
              border: "none",
              cursor: "pointer",
              transition: "filter 120ms ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.filter = "brightness(1.1)")}
            onMouseLeave={(e) => (e.currentTarget.style.filter = "")}
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
          See full plan comparison{" "}
          <span style={{ color: "hsl(var(--goal-2))" }}>→</span>
        </Link>
      </div>
      <style>{`
        @media (max-width: 768px) {
          .start-pricing-grid { grid-template-columns: 1fr !important; gap: 16px !important; }
        }
        .pricing-compare-link:hover { color: hsl(var(--text-primary)) !important; }
      `}</style>
    </section>
  );
};

// ============================================================================
// Section 9 — FAQ
// ============================================================================
const FAQItem: React.FC<{ q: string; a: string }> = ({ q, a }) => {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: "1px solid hsl(var(--border-subtle))" }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        style={{
          width: "100%",
          background: "transparent",
          border: "none",
          padding: "24px 0",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 24,
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
          {q}
        </span>
        <ChevronDown
          size={18}
          style={{
            color: "hsl(var(--text-tertiary))",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 200ms ease",
            flexShrink: 0,
          }}
        />
      </button>
      {open && (
        <div
          style={{
            paddingTop: 0,
            paddingBottom: 24,
            fontFamily: "Inter, system-ui, sans-serif",
            fontSize: 15,
            lineHeight: 1.6,
            color: "hsl(var(--text-secondary))",
          }}
        >
          {a}
        </div>
      )}
    </div>
  );
};

const FAQ: React.FC = () => {
  const items = [
    {
      q: "Why only 3 goals?",
      a: "Because almost no one is making meaningful progress on more than 2. The cap isn't restrictive — it's protective. If you can't pick 3, you'll fail at all of them.",
    },
    {
      q: "What if I have hundreds of tasks I need to track?",
      a: "ActOS isn't built for that load. Tasks unrelated to your 2-3 goals don't belong in ActOS. If you're managing 200+ tasks, the question isn't where to put them — it's why you took them all on.",
    },
    {
      q: "Is this just another todo app?",
      a: "No. Todo apps optimize for capturing things to do. ActOS optimizes for moving toward things you decided matter. Different problem.",
    },
    {
      q: "Does it work on mobile?",
      a: "Yes. Web app works on phones. Native iOS/Android apps coming post-launch (v1.x).",
    },
    {
      q: "Can I export my data?",
      a: "Yes. JSON export available in Settings → Data. Your data is yours.",
    },
    {
      q: "Why isn't it free?",
      a: "It is — to start. The Free tier is genuinely useful, not a limited demo. All-In ($12/mo) is for people ready to commit. We charge because focus is worth paying for, and because we want to build a sustainable product without ads or VC pressure.",
    },
  ];

  return (
    <section style={{ ...sectionPadding, background: "hsl(var(--surface-base))" }}>
      <div className="mx-auto text-center" style={{ maxWidth: 1200 }}>
        <SectionLabel>FAQ</SectionLabel>
        <SectionTitle>Anything else?</SectionTitle>
      </div>
      <div className="mx-auto" style={{ maxWidth: 720, marginTop: 64 }}>
        {items.map((it) => (
          <FAQItem key={it.q} q={it.q} a={it.a} />
        ))}
      </div>
    </section>
  );
};

// ============================================================================
// Section 10 — Final CTA
// ============================================================================
const FinalCTA: React.FC = () => {
  const navigate = useNavigate();
  return (
    <section
      style={{
        position: "relative",
        background: "hsl(var(--surface-base))",
        paddingTop: "clamp(100px, 14vw, 160px)",
        paddingBottom: "clamp(80px, 10vw, 120px)",
        paddingLeft: 24,
        paddingRight: 24,
        overflow: "hidden",
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 600px 400px at center, rgba(212, 136, 74, 0.06) 0%, transparent 70%)",
          zIndex: 0,
        }}
      />
      <div className="relative mx-auto text-center" style={{ maxWidth: 720, zIndex: 1 }}>
        <h2
          style={{
            fontFamily: "Inter, system-ui, sans-serif",
            fontSize: "clamp(36px, 5.5vw, 56px)",
            fontWeight: 500,
            color: "hsl(var(--text-primary))",
            letterSpacing: "-0.02em",
            lineHeight: 1.1,
            margin: 0,
          }}
        >
          Stop scheduling. Start moving.
        </h2>
        <p
          style={{
            marginTop: 24,
            marginBottom: 0,
            fontFamily: "Inter, system-ui, sans-serif",
            fontSize: "clamp(16px, 1.6vw, 18px)",
            color: "hsl(var(--text-secondary))",
          }}
        >
          Your goals don't need a manager. They need a daily move.
        </p>
        <div style={{ marginTop: 48, display: "flex", justifyContent: "center" }}>
          <button
            type="button"
            onClick={() => navigate("/today")}
            className="cta-btn-start"
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
        <div
          style={{
            marginTop: 24,
            fontFamily: "Inter, system-ui, sans-serif",
            fontSize: 13,
            color: "hsl(var(--text-tertiary))",
          }}
        >
          No credit card required. Free forever.
        </div>
      </div>
    </section>
  );
};

// ============================================================================
// Page
// ============================================================================
const Start: React.FC = () => {
  return (
    <div
      data-theme="dark"
      className="relative flex min-h-screen flex-col"
      style={{ background: "hsl(var(--surface-base))" }}
    >
      <StickyTopBar />
      <Hero />
      <TaskTrap />
      <HowItWorks />
      <Differentiators />
      <FounderExcerpt />
      <ForNotFor />
      <Testimonials />
      <Pricing />
      <FAQ />
      <FinalCTA />
      <LandingFooter />
    </div>
  );
};

export default Start;
