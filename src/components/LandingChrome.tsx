// Shared top bar + footer for public pages (landing, manifesto, etc.).
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Github, Linkedin, Twitter } from "lucide-react";

const LANGS = ["en", "ru", "de", "es"] as const;

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

const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();

  const changeLang = (lang: string) => {
    i18n.changeLanguage(lang);
    localStorage.setItem("actos.i18n.language", lang);
  };

  return (
    <div className="language-switcher" style={{ display: "flex", alignItems: "center", gap: 0 }}>
      {LANGS.map((lang, i) => (
        <React.Fragment key={lang}>
          {i > 0 && <span className="lang-sep" style={{ color: "hsl(var(--text-tertiary))", padding: "0 6px" }}>·</span>}
          <button
            type="button"
            onClick={() => {
              if (i18n.language !== lang) changeLang(lang);
            }}
            className={`lang-btn${i18n.language === lang ? " lang-active" : ""}`}
            style={{
              fontFamily: "Inter, system-ui, sans-serif",
              fontSize: 13,
              fontWeight: i18n.language === lang ? 500 : 400,
              color: i18n.language === lang ? "hsl(var(--text-primary))" : "hsl(var(--text-tertiary))",
              background: "none",
              border: "none",
              padding: "8px 6px",
              cursor: i18n.language === lang ? "default" : "pointer",
              lineHeight: 1,
            }}
            aria-pressed={i18n.language === lang}
          >
            {lang.toUpperCase()}
          </button>
        </React.Fragment>
      ))}
    </div>
  );
};

const FooterSubRow: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div
      className="footer-subrow"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexWrap: "wrap",
        gap: 0,
        marginTop: 8,
      }}
    >
      <div className="footer-links-cluster" style={{ display: "flex", alignItems: "center" }}>
        <FooterLink to="/manifesto">{t("publicFooter.manifesto")}</FooterLink>
        <Sep />
        <FooterLink to="/pricing">{t("publicFooter.pricing")}</FooterLink>
        <Sep />
        <FooterLink to="/legal/privacy">{t("publicFooter.privacy")}</FooterLink>
        <Sep />
        <FooterLink to="/legal/terms">{t("publicFooter.terms")}</FooterLink>
      </div>
      <span className="footer-cluster-divider" aria-hidden="true" style={{ display: "inline-block" }} />
      <LanguageSwitcher />
    </div>
  );
};

export const LandingTopBar: React.FC<{ logoIsHome?: boolean }> = ({ logoIsHome }) => {
  const { pathname } = useLocation();
  const { t } = useTranslation();
  const onLanding = pathname === "/";
  const logoStyle: React.CSSProperties = {
    fontFamily: "Inter, system-ui, sans-serif",
    fontSize: 32,
    fontWeight: 500,
    letterSpacing: "-0.02em",
    textDecoration: "none",
    cursor: onLanding && logoIsHome ? "default" : "pointer",
    display: "inline-block",
    lineHeight: 1,
  };
  const Logo = (
    <span style={logoStyle}>
      <span style={{ color: "hsl(var(--text-primary))" }}>Act</span>
      <span style={{ color: "hsl(var(--goal-2))" }}>OS</span>
    </span>
  );

  const navLinkStyle = (href: string): React.CSSProperties => ({
    fontFamily: "Inter, system-ui, sans-serif",
    fontSize: 14,
    color: pathname === href ? "hsl(var(--text-primary))" : "hsl(var(--text-secondary))",
    textDecoration: "none",
  });

  return (
    <>
      <div className="landing-topbar-logo">
        {onLanding ? Logo : <Link to="/" aria-label="ActOS home">{Logo}</Link>}
      </div>
      <nav className="landing-topbar-nav">
        <Link to="/manifesto" className="topbar-link topbar-desktop-only" style={navLinkStyle("/manifesto")}>{t("publicNav.manifesto")}</Link>
        <Link to="/pricing" className="topbar-link topbar-desktop-only" style={navLinkStyle("/pricing")}>{t("publicNav.pricing")}</Link>
        <Link to="/auth" className="topbar-link" style={navLinkStyle("/auth")}>{t("publicNav.signIn")}</Link>
      </nav>
      <style>{`
        .landing-topbar-logo { position: absolute; top: 32px; left: 32px; z-index: 2; }
        .landing-topbar-nav { position: absolute; top: 32px; right: 32px; z-index: 2; display: flex; align-items: center; gap: 32px; }
        @media (max-width: 768px) {
          .landing-topbar-logo { top: 16px; left: 16px; }
          .landing-topbar-nav { top: 16px; right: 16px; gap: 16px; }
          .topbar-desktop-only { display: none; }
        }
        .topbar-link:hover { color: hsl(var(--text-primary)) !important; }
      `}</style>
    </>
  );
};

export const LandingFooter: React.FC = () => {
  const { t } = useTranslation();
  return (
  <footer
    className="w-full px-6 pb-6 md:pb-8"
    style={{
      fontFamily: "Inter, system-ui, sans-serif",
      color: "hsl(var(--text-tertiary))",
      fontSize: 13,
    }}
  >
    <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 md:flex-row md:justify-between">
      <div>{t("publicFooter.copyright")}</div>
      <div className="flex items-center" style={{ gap: 20 }}>
        <a href="https://twitter.com/actos" target="_blank" rel="noopener noreferrer" aria-label="ActOS on Twitter" className="social-link" style={{ color: "hsl(var(--text-tertiary))", display: "inline-flex" }}>
          <Twitter size={18} />
        </a>
        <a href="https://github.com/actos" target="_blank" rel="noopener noreferrer" aria-label="ActOS on GitHub" className="social-link" style={{ color: "hsl(var(--text-tertiary))", display: "inline-flex" }}>
          <Github size={18} />
        </a>
        <a href="https://linkedin.com/company/actos" target="_blank" rel="noopener noreferrer" aria-label="ActOS on LinkedIn" className="social-link" style={{ color: "hsl(var(--text-tertiary))", display: "inline-flex" }}>
          <Linkedin size={18} />
        </a>
      </div>
      <div className="hidden md:block" style={{ minWidth: 100 }} aria-hidden />
    </div>

    <FooterSubRow />

    <style>{`
      .social-link:hover { color: hsl(var(--text-secondary)) !important; }
      .footer-link:hover { color: hsl(var(--text-secondary)) !important; }
      .footer-cluster-divider {
        width: 1px;
        height: 12px;
        background: hsl(var(--border-subtle));
        margin: 0 16px;
        flex-shrink: 0;
      }
      .lang-btn:not(.lang-active):hover { color: hsl(var(--text-secondary)) !important; }
      .lang-active { position: relative; }
      .lang-active::after {
        content: "";
        position: absolute;
        bottom: 4px;
        left: 6px;
        right: 6px;
        height: 1px;
        background: hsl(var(--goal-2));
      }
      @media (max-width: 768px) {
        .footer-subrow { flex-direction: column !important; gap: 8px !important; margin-top: 12px !important; }
        .footer-cluster-divider { display: none !important; }
        .footer-links-cluster { order: 1; }
        .language-switcher { order: 2; }
      }
    `}</style>
  </footer>
  );
};

export const AuthFooter: React.FC = () => {
  return (
    <footer
      className="w-full px-6 pb-6 md:pb-8"
      style={{
        fontFamily: "Inter, system-ui, sans-serif",
        color: "hsl(var(--text-tertiary))",
        fontSize: 13,
      }}
    >
      <FooterSubRow />
      <style>{`
        .footer-link:hover { color: hsl(var(--text-secondary)) !important; }
        .footer-cluster-divider {
          width: 1px;
          height: 12px;
          background: hsl(var(--border-subtle));
          margin: 0 16px;
          flex-shrink: 0;
        }
        .lang-btn:not(.lang-active):hover { color: hsl(var(--text-secondary)) !important; }
        .lang-active { position: relative; }
        .lang-active::after {
          content: "";
          position: absolute;
          bottom: 4px;
          left: 6px;
          right: 6px;
          height: 1px;
          background: hsl(var(--goal-2));
        }
        @media (max-width: 768px) {
          .footer-subrow { flex-direction: column !important; gap: 8px !important; margin-top: 0 !important; }
          .footer-cluster-divider { display: none !important; }
          .footer-links-cluster { order: 1; }
          .language-switcher { order: 2; }
        }
      `}</style>
    </footer>
  );
};
