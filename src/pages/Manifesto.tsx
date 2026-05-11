// Founder essay — Medium-style article with byline, drop cap, pull quote.
// If a CMS override exists in LocalStorage for the current locale, it
// supersedes the i18n-keyed content (see /admin/manifesto editor).
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowRight } from "lucide-react";
import { LandingTopBar, LandingFooter } from "@/components/LandingChrome";
import { readManifesto, type ManifestoContent } from "@/lib/manifestoStorage";

// Render a string with **bold** markdown -> <strong>, *italic* -> <em>.
function renderMd(s: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  // Combined regex; bold first, then italic
  const re = /(\*\*([^*]+)\*\*|\*([^*]+)\*)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = re.exec(s)) !== null) {
    if (m.index > last) out.push(s.slice(last, m.index));
    if (m[2] !== undefined) out.push(<strong key={key++}>{m[2]}</strong>);
    else if (m[3] !== undefined) out.push(<em key={key++}>{m[3]}</em>);
    last = m.index + m[0].length;
  }
  if (last < s.length) out.push(s.slice(last));
  return out;
}

const P: React.FC<{ k: string; className?: string }> = ({ k, className }) => {
  const { t } = useTranslation();
  return <p className={className}>{renderMd(t(k))}</p>;
};

const Manifesto: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [override, setOverride] = useState<ManifestoContent | null>(() => readManifesto(i18n.language));
  useEffect(() => {
    const sync = () => setOverride(readManifesto(i18n.language));
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("actos-manifesto-change", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("actos-manifesto-change", sync);
    };
  }, [i18n.language]);
  return (
    <div
      data-theme="dark"
      className="relative flex min-h-screen flex-col"
      style={{ background: "hsl(var(--surface-base))", fontFamily: "Inter, system-ui, sans-serif" }}
    >
      <LandingTopBar />

      <main className="manifesto-main flex-1 px-6">
        <article className="mx-auto" style={{ maxWidth: 720 }}>
          {/* Byline */}
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div
              aria-hidden
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                background: "hsl(var(--surface-raised))",
                border: "1px solid hsl(var(--border-subtle))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "hsl(var(--text-primary))",
                fontSize: 18,
                fontWeight: 500,
                flexShrink: 0,
              }}
            >
              SV
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: 16, fontWeight: 500, color: "hsl(var(--text-primary))" }}>
                Stanislav Vasilevschii
              </span>
              <span style={{ fontSize: 14, color: "hsl(var(--text-tertiary))" }}>
                {t("manifesto.byline.role")}
              </span>
            </div>
          </div>

          {/* Title */}
          <h1
            className="manifesto-h1"
            style={{
              marginTop: 48,
              fontWeight: 500,
              color: "hsl(var(--text-primary))",
              letterSpacing: "-0.02em",
              lineHeight: 1.1,
            }}
          >
            {override?.title ?? t("manifesto.title")}
          </h1>

          <p
            className="manifesto-deck"
            style={{
              marginTop: 24,
              color: "hsl(var(--text-secondary))",
              fontWeight: 400,
              lineHeight: 1.4,
            }}
          >
            {override?.deck ?? t("manifesto.deck")}
          </p>

          {override ? (
            <div
              className="manifesto-body manifesto-body-override"
              style={{ marginTop: 64 }}
              dangerouslySetInnerHTML={{ __html: override.body }}
            />
          ) : (
          <div className="manifesto-body" style={{ marginTop: 64 }}>
            <P k="manifesto.p1" className="has-dropcap" />
            <P k="manifesto.p2" />
            <P k="manifesto.p3" />

            <h2>{t("manifesto.h2_1")}</h2>
            <P k="manifesto.p4" />
            <P k="manifesto.p5" />
            <P k="manifesto.p6" />
            <P k="manifesto.p7" />

            <blockquote>{t("manifesto.pullquote")}</blockquote>

            <h2>{t("manifesto.h2_2")}</h2>
            <P k="manifesto.p8" />
            <P k="manifesto.p9" />
            <P k="manifesto.p10" />
            <P k="manifesto.p11" />

            <h2>{t("manifesto.h2_3")}</h2>
            <P k="manifesto.p12" />
            <P k="manifesto.p13" />
            <ul>
              <li>{renderMd(t("manifesto.li1"))}</li>
              <li>{renderMd(t("manifesto.li2"))}</li>
              <li>{renderMd(t("manifesto.li3"))}</li>
              <li>{renderMd(t("manifesto.li4"))}</li>
            </ul>
            <P k="manifesto.p14" />
            <P k="manifesto.p15" />

            <h2>{t("manifesto.h2_4")}</h2>
            <P k="manifesto.p16" />
            <P k="manifesto.p17" />
            <P k="manifesto.p18" />
            <P k="manifesto.p19" />

            <h2>{t("manifesto.h2_5")}</h2>
            <P k="manifesto.p20" />
            <P k="manifesto.p21" />
            <P k="manifesto.p22" />
          </div>
          )}

          {/* Closing chrome — always from i18n, not editable in CMS. */}
          <div className="manifesto-body" style={{ marginTop: override ? 0 : undefined }}>
            <hr />
            <p>
              {t("manifesto.closing.line1")}{" "}
              <Link to="/auth#signup" style={{ color: "hsl(var(--goal-2))", textDecoration: "underline" }}>
                {t("manifesto.closing.link")}
              </Link>
              {t("manifesto.closing.line2")}
            </p>
            <P k="manifesto.closing.line3" />
            <P k="manifesto.closing.line4" />
          </div>

          {/* Closing CTA */}
          <div style={{ marginTop: 80, textAlign: "center" }}>
            <p
              className="manifesto-cta-line"
              style={{ fontWeight: 500, color: "hsl(var(--text-primary))", margin: 0 }}
            >
              {t("manifesto.closing.cta.line")}
            </p>
            <Link
              to="/auth#signup"
              className="manifesto-cta-btn"
              style={{
                marginTop: 32,
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: "hsl(var(--goal-2))",
                color: "hsl(var(--surface-base))",
                fontWeight: 500,
                fontSize: 16,
                padding: "14px 32px",
                borderRadius: 6,
                textDecoration: "none",
                transition: "filter 120ms ease",
              }}
            >
              {t("manifesto.closing.cta.button")}
              <ArrowRight size={16} strokeWidth={1.75} />
            </Link>
            <p style={{ marginTop: 16, fontSize: 13, color: "hsl(var(--text-tertiary))" }}>
              {t("manifesto.closing.cta.subline")}
            </p>
          </div>
        </article>
      </main>

      <LandingFooter />

      <style>{`
        .manifesto-main { padding-top: 120px; padding-bottom: 120px; }
        .manifesto-h1 { font-size: 56px; }
        .manifesto-deck { font-size: 24px; }
        .manifesto-cta-line { font-size: 24px; }
        .manifesto-cta-btn:hover { filter: brightness(1.1); }

        .manifesto-body p {
          font-size: 19px;
          line-height: 1.7;
          letter-spacing: 0.005em;
          color: hsl(var(--text-primary));
          margin: 0 0 28px;
          font-weight: 400;
        }
        .manifesto-body ul {
          margin: 0 0 28px;
          padding-left: 24px;
          color: hsl(var(--text-primary));
        }
        .manifesto-body ul li {
          font-size: 19px;
          line-height: 1.7;
          letter-spacing: 0.005em;
          margin-bottom: 12px;
        }
        .manifesto-body h2 {
          font-size: 28px;
          font-weight: 500;
          color: hsl(var(--text-primary));
          margin: 64px 0 24px;
          letter-spacing: -0.01em;
          line-height: 1.2;
        }
        .manifesto-body strong { font-weight: 600; color: hsl(var(--text-primary)); }
        .manifesto-body em { font-style: italic; color: hsl(var(--text-primary)); }
        .manifesto-body blockquote {
          font-size: 26px;
          font-weight: 400;
          color: hsl(var(--text-primary));
          line-height: 1.4;
          border-left: 3px solid hsl(var(--goal-2));
          padding-left: 24px;
          margin: 48px 0;
        }
        .manifesto-body hr {
          width: 80px;
          height: 1px;
          border: none;
          background: hsl(var(--border-subtle));
          margin: 64px auto;
        }
        .manifesto-body p.has-dropcap::first-letter {
          font-size: 64px;
          font-weight: 500;
          float: left;
          line-height: 0.9;
          margin: 4px 6px 0 0;
          color: hsl(var(--text-primary));
        }
        .manifesto-body-override > p:first-of-type::first-letter {
          font-size: 64px;
          font-weight: 500;
          float: left;
          line-height: 0.9;
          margin: 4px 6px 0 0;
          color: hsl(var(--text-primary));
        }
        .manifesto-body a { color: hsl(var(--goal-2)); text-decoration: underline; }

        @media (max-width: 768px) {
          .manifesto-main { padding-top: 88px; padding-bottom: 80px; }
          .manifesto-h1 { font-size: 36px; }
          .manifesto-deck { font-size: 18px; }
          .manifesto-cta-line { font-size: 20px; }
          .manifesto-body p, .manifesto-body ul li { font-size: 17px; }
          .manifesto-body h2 { font-size: 22px; margin: 48px 0 20px; }
          .manifesto-body blockquote { font-size: 20px; margin: 36px 0; }
        }
      `}</style>
    </div>
  );
};

export default Manifesto;
