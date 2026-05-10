// Public marketing landing page. Single-viewport, dark-only, distillery-minimal.
// All colors via CSS tokens. No animations, no scroll reveals, no nav.

import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Github, Linkedin, Twitter } from "lucide-react";

const Landing: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div
      data-theme="dark"
      className="relative flex min-h-screen flex-col"
      style={{ background: "hsl(var(--surface-base))" }}
    >
      {/* Top bar — logo */}
      <header className="absolute left-4 top-4 md:left-8 md:top-8">
        <span
          className="select-none"
          style={{
            fontFamily: "Inter, system-ui, sans-serif",
            fontSize: 18,
            fontWeight: 500,
            letterSpacing: "-0.01em",
          }}
        >
          <span style={{ color: "hsl(var(--text-primary))" }}>Act</span>
          <span style={{ color: "hsl(var(--goal-2))" }}>OS</span>
        </span>
      </header>

      {/* Hero */}
      <main className="flex flex-1 flex-col items-center justify-center px-6 text-center">
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
          Action moves you forward.
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
          onMouseDown={(e) => (e.currentTarget.style.filter = "brightness(0.95)")}
          onMouseUp={(e) => (e.currentTarget.style.filter = "brightness(1.1)")}
        >
          Open ActOS
          <ArrowRight size={16} />
        </button>
      </main>

      {/* Footer */}
      <footer
        className="w-full px-6 pb-6 md:pb-8"
        style={{
          fontFamily: "Inter, system-ui, sans-serif",
          color: "hsl(var(--text-tertiary))",
          fontSize: 13,
        }}
      >
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 md:flex-row md:justify-between">
          <div>© 2026 ActOS</div>

          {/* TODO: real social URLs at launch */}
          <div className="flex items-center" style={{ gap: 20 }}>
            <a
              href="https://twitter.com/actos"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="ActOS on Twitter"
              className="social-link"
              style={{ color: "hsl(var(--text-tertiary))", display: "inline-flex" }}
            >
              <Twitter size={18} />
            </a>
            <a
              href="https://github.com/actos"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="ActOS on GitHub"
              className="social-link"
              style={{ color: "hsl(var(--text-tertiary))", display: "inline-flex" }}
            >
              <Github size={18} />
            </a>
            <a
              href="https://linkedin.com/company/actos"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="ActOS on LinkedIn"
              className="social-link"
              style={{ color: "hsl(var(--text-tertiary))", display: "inline-flex" }}
            >
              <Linkedin size={18} />
            </a>
          </div>

          {/* TODO: badges when available */}
          <div className="hidden md:block" style={{ minWidth: 100 }} aria-hidden />
        </div>

        <div
          className="mx-auto mt-2 flex max-w-6xl items-center justify-center md:justify-start"
          style={{ gap: 0 }}
        >
          <FooterLink to="/legal/privacy">Privacy</FooterLink>
          <Sep />
          <FooterLink to="/legal/terms">Terms</FooterLink>
          <Sep />
          <FooterLink to="/pricing">Pricing</FooterLink>
        </div>
      </footer>

      <style>{`
        .cta-btn:focus-visible {
          outline: 2px solid hsl(var(--goal-2));
          outline-offset: 3px;
        }
        .social-link:hover { color: hsl(var(--text-secondary)) !important; }
        .footer-link:hover { color: hsl(var(--text-secondary)) !important; }
      `}</style>
    </div>
  );
};

const Sep: React.FC = () => (
  <span style={{ color: "hsl(var(--text-tertiary))", padding: "0 8px" }}>·</span>
);

const FooterLink: React.FC<{ to: string; children: React.ReactNode }> = ({ to, children }) => (
  <Link
    to={to}
    className="footer-link"
    style={{ color: "hsl(var(--text-tertiary))", textDecoration: "none" }}
  >
    {children}
  </Link>
);

export default Landing;
