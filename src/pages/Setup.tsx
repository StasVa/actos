// Setup Wizard — first-run ceremonial onboarding.
// Full-screen, no sidebar, no header chrome. 2 screens: Welcome (with sample/
// fresh choice) → Theme → /today.
//
// ChoiceScreen and PauseScreen below are retained as inert dead code for a
// potential future redesign per the product owner; they are not wired into
// the active screen switch.

import React from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { ArrowRight, Loader2, Sparkles, Target } from "lucide-react";
import { useStore } from "@/store/useStore";
import { useSeedSampleData } from "@/lib/sampleDataActions";
import { themeStore, useThemeChoice, type ThemeChoice } from "@/lib/theme";
import {
  useUserSetupFlagQuery,
  useMarkSetupCompletedMutation,
} from "@/lib/queries/useUserSetup";

// Active screens. The numeric type values for ChoiceScreen/PauseScreen are
// kept stable (2/3) so the dead-code components below still type-check.
type Screen = 0 | 1 | 2 | 3;
type Path = "sample" | "own";

const reducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/* ───────── Mini-mockup SVG ─────────
   Wrapped in a div with a scoped data-theme so all CSS variables resolve to
   the correct theme regardless of the wizard's current theme. */
const ThemeMockup: React.FC<{ theme: "light" | "dark" }> = ({ theme }) => {
  return (
    <div data-theme={theme} style={{ width: "100%", height: "100%" }}>
      <svg viewBox="0 0 200 140" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" aria-hidden>
        <rect width="200" height="140" fill="hsl(var(--surface-base))" />
        {/* sidebar */}
        <rect x="0" y="0" width="24" height="140" fill="hsl(var(--surface-raised))" />
        {/* title bar placeholder */}
        <rect x="36" y="14" width="80" height="6" rx="2" fill="hsl(var(--text-primary))" opacity="0.3" />
        {/* three goal dots */}
        <circle cx="148" cy="17" r="3" fill="hsl(var(--goal-1))" />
        <circle cx="160" cy="17" r="3" fill="hsl(var(--goal-2))" />
        <circle cx="172" cy="17" r="3" fill="hsl(var(--goal-3))" />
        {/* hero card */}
        <rect x="36" y="32" width="148" height="92" rx="4"
              fill="hsl(var(--surface-raised))"
              stroke="hsl(var(--text-tertiary))" strokeOpacity="0.25" strokeWidth="0.5" />
        <rect x="46" y="46" width="60" height="5" rx="2" fill="hsl(var(--text-tertiary))" opacity="0.5" />
        {/* top bar — accent (60%) */}
        <rect x="46" y="64" width="120" height="6" rx="3" fill="hsl(var(--text-primary))" opacity="0.12" />
        <rect x="46" y="64" width="72" height="6" rx="3" fill="hsl(var(--accent))" />
        {/* bottom bar — goal-1 teal (40%) */}
        <rect x="46" y="84" width="120" height="6" rx="3" fill="hsl(var(--text-primary))" opacity="0.12" />
        <rect x="46" y="84" width="48" height="6" rx="3" fill="hsl(var(--goal-1))" />
      </svg>
    </div>
  );
};

/* ───────── Shared bits ───────── */
const StepIndicator: React.FC<{ n: Screen }> = ({ n }) => {
  const { t } = useTranslation();
  return n >= 1 ? (
    <div
      className="absolute"
      style={{
        right: 32, bottom: 28,
        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
        fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase",
        color: "hsl(var(--text-tertiary))",
      }}
    >
      {t("setup.step", { n, total: 3 })}
    </div>
  ) : null;
};

const BackLink: React.FC<{ onClick: () => void }> = ({ onClick }) => {
  const { t } = useTranslation();
  return (
    <button
      type="button"
      onClick={onClick}
      className="absolute transition-colors"
      style={{
        left: 32, bottom: 28,
        fontFamily: "Inter, ui-sans-serif, system-ui",
        fontSize: 14,
        color: "hsl(var(--text-tertiary))",
        background: "transparent", border: "none", cursor: "pointer",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.color = "hsl(var(--text-secondary))")}
      onMouseLeave={(e) => (e.currentTarget.style.color = "hsl(var(--text-tertiary))")}
    >
      ← {t("setup.back")}
    </button>
  );
};

const ContinueCTA: React.FC<{
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  label?: string;
}> = ({ onClick, disabled, loading, label }) => {
  const { t } = useTranslation();
  const isDisabled = disabled || loading;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isDisabled}
      className="group inline-flex items-center gap-2 transition-all"
      style={{
        fontFamily: "Inter, ui-sans-serif, system-ui",
        fontSize: 16, fontWeight: 500,
        color: "hsl(var(--accent))",
        background: "transparent", border: "none",
        cursor: isDisabled ? "not-allowed" : "pointer",
        opacity: isDisabled ? 0.4 : 1,
        padding: "8px 4px",
      }}
    >
      <span>
        {loading
          ? t("setup.theme.continueLoading")
          : (label ?? t("setup.continue"))}
      </span>
      {loading ? (
        <Loader2 size={18} className="animate-spin" />
      ) : (
        <ArrowRight
          size={18}
          className="transition-transform"
          style={{ transitionDuration: "150ms" }}
        />
      )}
      <style>{`
        .group:not(:disabled):hover svg { transform: translateX(2px); }
        .group:not(:disabled):hover { color: hsl(var(--accent-hover)); }
      `}</style>
    </button>
  );
};

/* ───────── Screens ───────── */
const ScreenWrap: React.FC<{ children: React.ReactNode; keyId: string }> = ({ children, keyId }) => (
  <div
    key={keyId}
    className="relative min-h-screen w-full"
    style={{
      background: "hsl(var(--surface-base))",
      color: "hsl(var(--text-primary))",
      animation: reducedMotion() ? undefined : "setupFadeIn 250ms cubic-bezier(0.32,0.72,0,1)",
    }}
  >
    <style>{`
      @keyframes setupFadeIn { from { opacity:0; transform: translateY(8px) } to { opacity:1; transform: none } }
      @keyframes setupFadeOut { from { opacity:1 } to { opacity:0 } }
      @keyframes setupBarFill { from { width:0% } to { width:100% } }
    `}</style>
    {children}
  </div>
);

const WelcomeScreen: React.FC<{
  name: string;
  onPickSample: () => void;
  onPickFresh: () => void;
}> = ({ name, onPickSample, onPickFresh }) => {
  const { t } = useTranslation();
  return (
    <ScreenWrap keyId="s0">
      <div
        className="flex flex-col items-center min-h-screen px-6"
        style={{ paddingTop: 80, paddingBottom: 96 }}
      >
        <div
          style={{
            width: 40, height: 40, borderRadius: 8,
            background: "hsl(var(--text-primary))",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "hsl(var(--surface-base))",
            fontFamily: "Inter", fontWeight: 700, fontSize: 18,
          }}
          aria-label="ActOS"
        >A</div>
        <div style={{ height: 48 }} />
        <h1
          style={{
            fontFamily: "Inter, ui-sans-serif, system-ui",
            fontWeight: 400,
            fontSize: "clamp(36px, 6vw, 56px)",
            lineHeight: 1.1,
            color: "hsl(var(--text-primary))",
            margin: 0,
            textAlign: "center",
          }}
        >
          {t("setup.welcome.heading")}
        </h1>
        <div style={{ height: 16 }} />
        <p
          style={{
            fontFamily: "Inter", fontWeight: 400,
            fontSize: 18, color: "hsl(var(--text-secondary))", margin: 0,
            textAlign: "center",
          }}
        >
          {t("setup.welcome.sub")}
        </p>
        <div style={{ height: 64 }} />
        <div
          className="w-full grid gap-6"
          style={{ maxWidth: 880, gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}
        >
          {([
            {
              id: "sample" as const,
              icon: Sparkles,
              title: t("setup.choice.sample.title"),
              desc: t("setup.choice.sample.body"),
              onClick: onPickSample,
            },
            {
              id: "own" as const,
              icon: Target,
              title: t("setup.choice.own.title"),
              desc: t("setup.choice.own.body"),
              onClick: onPickFresh,
            },
          ]).map((c) => {
            const Icon = c.icon;
            return (
              <button
                key={c.id}
                type="button"
                onClick={c.onClick}
                className="text-left transition-all"
                style={{
                  background: "hsl(var(--surface-base))",
                  border: "1px solid hsl(var(--border-subtle))",
                  borderRadius: 8,
                  padding: 32,
                  minHeight: 260,
                  cursor: "pointer",
                  fontFamily: "Inter",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "hsl(var(--border-default))";
                  e.currentTarget.style.background = "hsl(var(--surface-hover))";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "hsl(var(--border-subtle))";
                  e.currentTarget.style.background = "hsl(var(--surface-base))";
                }}
              >
                <Icon size={32} strokeWidth={1.5} style={{ color: "hsl(var(--text-secondary))" }} />
                <div style={{ height: 16 }} />
                <div style={{
                  fontSize: 20, fontWeight: 500,
                  color: "hsl(var(--text-primary))",
                }}>{c.title}</div>
                <div style={{ height: 8 }} />
                <div style={{
                  fontSize: 14, lineHeight: 1.5,
                  color: "hsl(var(--text-secondary))",
                }}>{c.desc}</div>
              </button>
            );
          })}
        </div>
      </div>
    </ScreenWrap>
  );
};

const ThemeScreen: React.FC<{
  onContinue: () => void;
  onBack: () => void;
  loading?: boolean;
}> = ({ onContinue, onBack, loading }) => {
  const { t } = useTranslation();
  const [choice, , setChoice] = useThemeChoice();
  // Wizard pre-selects Dark on entry (set by Setup root). Treat as a valid
  // initial selection so Continue is enabled immediately.
  const [touched, setTouched] = React.useState(true);
  const [hover, setHover] = React.useState<ThemeChoice | null>(null);

  // Hover preview: temporarily swap theme without persisting choice change.
  React.useEffect(() => {
    if (!hover) {
      // restore current choice
      themeStore.set(choice);
      return;
    }
    const resolved = hover === "system"
      ? (window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light")
      : hover;
    document.documentElement.dataset.theme = resolved;
  }, [hover, choice]);

  const tiles: { value: ThemeChoice; label: string; mockup: "light" | "dark" }[] = [
    { value: "system", label: t("setup.theme.system"), mockup: window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light" },
    { value: "light", label: t("settings.theme.light"), mockup: "light" },
    { value: "dark", label: t("settings.theme.dark"), mockup: "dark" },
  ];

  return (
    <ScreenWrap keyId="s1">
      <div className="flex flex-col items-center min-h-screen px-6" style={{ paddingTop: 80, paddingBottom: 96 }}>
        <h1 style={{
          fontFamily: "Inter", fontWeight: 400,
          fontSize: "clamp(32px, 5vw, 48px)", margin: 0,
          color: "hsl(var(--text-primary))", textAlign: "center",
        }}>{t("setup.theme.heading")}</h1>
        <div style={{ height: 12 }} />
        <p style={{
          fontFamily: "Inter", fontSize: 15,
          color: "hsl(var(--text-tertiary))", margin: 0, textAlign: "center",
        }}>{t("setup.theme.sub")}</p>
        <div style={{ height: 80 }} />

        <div
          className="w-full flex gap-6 flex-wrap md:flex-nowrap justify-center"
          style={{ maxWidth: 720 }}
        >
          {tiles.map((t) => {
            const selected = touched && choice === t.value;
            return (
              <button
                key={t.value}
                type="button"
                onClick={() => { setTouched(true); setChoice(t.value); }}
                onMouseEnter={() => setHover(t.value)}
                onMouseLeave={() => setHover(null)}
                className="flex flex-col items-center gap-3 transition-all md:w-auto w-full"
                style={{
                  background: "transparent",
                  border: selected
                    ? "2px solid hsl(var(--accent))"
                    : "1px solid hsl(var(--border-subtle))",
                  borderRadius: 8,
                  padding: 0,
                  cursor: "pointer",
                  width: undefined,
                }}
              >
                <div style={{ width: 200, height: 140, maxWidth: "100%", overflow: "hidden", borderRadius: 7 }}>
                  <ThemeMockup theme={t.mockup} />
                </div>
                <div style={{
                  fontFamily: "Inter",
                  fontSize: 14,
                  fontWeight: selected ? 600 : 500,
                  color: selected ? "hsl(var(--accent))" : "hsl(var(--text-primary))",
                  paddingBottom: 10,
                }}>{t.label}</div>
              </button>
            );
          })}
        </div>

        <div style={{ height: 96 }} />
        <ContinueCTA onClick={onContinue} disabled={!touched} loading={loading} />
      </div>
      <BackLink onClick={onBack} />
    </ScreenWrap>
  );
};

// ─────────────────────────────────────────────────────────────────────
// Inert dead code below — ChoiceScreen and PauseScreen are no longer wired
// into the active flow but retained per product owner for a potential
// future redesign. noUnusedLocals is off in tsconfig.app.json, so these
// uncalled components do not trigger errors.
// ─────────────────────────────────────────────────────────────────────

const ChoiceScreen: React.FC<{
  selected: Path | null;
  setSelected: (p: Path) => void;
  onContinue: () => void;
  onBack: () => void;
}> = ({ selected, setSelected, onContinue, onBack }) => {
  const { t } = useTranslation();
  const cards: { id: Path; icon: typeof Sparkles; title: string; desc: string }[] = [
    {
      id: "sample",
      icon: Sparkles,
      title: t("setup.choice.sample.title"),
      desc: t("setup.choice.sample.body"),
    },
    {
      id: "own",
      icon: Target,
      title: t("setup.choice.own.title"),
      desc: t("setup.choice.own.body"),
    },
  ];
  return (
    <ScreenWrap keyId="s2">
      <div className="flex flex-col items-center min-h-screen px-6" style={{ paddingTop: 80, paddingBottom: 96 }}>
        <h1 style={{
          fontFamily: "Inter", fontWeight: 400,
          fontSize: "clamp(32px, 5vw, 48px)", margin: 0, textAlign: "center",
          color: "hsl(var(--text-primary))",
        }}>{t("setup.choice.heading")}</h1>
        <div style={{ height: 80 }} />

        <div
          className="w-full grid gap-6"
          style={{ maxWidth: 880, gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}
        >
          {cards.map((c) => {
            const Icon = c.icon;
            const isSel = selected === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelected(c.id)}
                className="text-left transition-all"
                style={{
                  background: isSel ? "hsl(var(--surface-hover))" : "hsl(var(--surface-base))",
                  border: isSel ? "2px solid hsl(var(--accent))" : "1px solid hsl(var(--border-subtle))",
                  borderRadius: 8,
                  padding: 32,
                  minHeight: 260,
                  cursor: "pointer",
                  fontFamily: "Inter",
                }}
                onMouseEnter={(e) => {
                  if (!isSel) {
                    e.currentTarget.style.borderColor = "hsl(var(--border-default))";
                    e.currentTarget.style.background = "hsl(var(--surface-hover))";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSel) {
                    e.currentTarget.style.borderColor = "hsl(var(--border-subtle))";
                    e.currentTarget.style.background = "hsl(var(--surface-base))";
                  }
                }}
              >
                <Icon size={32} strokeWidth={1.5} style={{ color: "hsl(var(--text-secondary))" }} />
                <div style={{ height: 16 }} />
                <div style={{
                  fontSize: 20, fontWeight: 500,
                  color: isSel ? "hsl(var(--accent))" : "hsl(var(--text-primary))",
                }}>{c.title}</div>
                <div style={{ height: 8 }} />
                <div style={{
                  fontSize: 14, lineHeight: 1.5,
                  color: "hsl(var(--text-secondary))",
                }}>{c.desc}</div>
              </button>
            );
          })}
        </div>

        <div style={{ height: 96 }} />
        <ContinueCTA onClick={onContinue} disabled={!selected} />
      </div>
      <BackLink onClick={onBack} />
      <StepIndicator n={2} />
    </ScreenWrap>
  );
};

const PauseScreen: React.FC<{ fade: boolean }> = ({ fade }) => {
  const { t } = useTranslation();
  return (
    <ScreenWrap keyId="s3">
      <div
        className="flex flex-col items-center justify-center min-h-screen px-6 text-center"
        style={{
          animation: fade && !reducedMotion() ? "setupFadeOut 250ms forwards" : undefined,
        }}
      >
        <div style={{
          fontFamily: "Inter", fontSize: 18, color: "hsl(var(--text-secondary))",
        }}>{t("setup.pause.text")}</div>
        <div style={{ height: 24 }} />
        <div style={{
          width: 200, height: 2, borderRadius: 2,
          background: "hsl(var(--surface-hover))", overflow: "hidden",
        }}>
          <div style={{
            height: "100%", background: "hsl(var(--accent))",
            width: reducedMotion() ? "100%" : 0,
            animation: reducedMotion() ? undefined : "setupBarFill 1200ms cubic-bezier(0.32,0.72,0,1) forwards",
          }} />
        </div>
      </div>
      <StepIndicator n={3} />
    </ScreenWrap>
  );
};

/* ───────── Wizard root ───────── */
export default function Setup() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const userName = useStore((s) => s.settings.userName);
  const seedSampleData = useSeedSampleData();
  const { data: alreadyCompleted, isLoading: flagLoading } = useUserSetupFlagQuery();
  const markCompleted = useMarkSetupCompletedMutation();

  const [screen, setScreen] = React.useState<0 | 1>(0);
  // True while finish() is awaiting the in-flight sample seed. Drives the
  // Theme Continue button's loading state so the user can't navigate to
  // /today before the seed is fully persisted (otherwise they'd see the
  // "Create your first goal" empty-state prompt for 2-3s).
  const [finishing, setFinishing] = React.useState(false);
  // Holds the seed promise launched from pickSample so finish() can await it
  // on the Theme screen. Null when the user picked "Start fresh".
  const seedPromiseRef = React.useRef<Promise<void> | null>(null);

  // Setup Wizard always starts in Dark, regardless of system preference.
  // User's later selection on the Theme screen overrides this via themeStore.set().
  React.useEffect(() => { themeStore.set("dark"); }, []);

  // Defensive: if the flag is already true (user navigated here manually
  // after completion, or has stale localStorage from the old wizard), bounce
  // to /today rather than rerunning the wizard.
  if (!flagLoading && alreadyCompleted) {
    return <Navigate to="/today" replace />;
  }

  const pickSample = () => {
    // Kick off the seed in the background and advance to Theme. finish() will
    // await this promise before navigating to /today so the empty-state prompt
    // never flashes.
    const p = seedSampleData();
    // Attach a no-op rejection handler so an abandoned wizard doesn't produce
    // an unhandled rejection. The actual error surfacing happens in finish()'s
    // own await.
    p.catch(() => {});
    seedPromiseRef.current = p;
    setScreen(1);
  };

  const pickFresh = () => {
    seedPromiseRef.current = null;
    setScreen(1);
  };

  const finish = async () => {
    if (seedPromiseRef.current) {
      setFinishing(true);
      try {
        await seedPromiseRef.current;
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("[setup] sample seed failed", err);
        toast.error(t("setup.sampleSeedError"));
        // Fall through and navigate anyway — don't trap the user on Theme.
      } finally {
        setFinishing(false);
      }
    }
    try {
      await markCompleted.mutateAsync();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("[setup] mark completed failed", err);
      // Continue anyway — SetupGuard will reroute if the flag didn't stick.
    }
    navigate("/today", { replace: true });
  };

  const goBack = () => {
    if (screen === 0) return;
    setScreen(0);
  };

  const firstName = (userName ?? "there").split(/\s+/)[0];

  if (screen === 0) {
    return (
      <WelcomeScreen name={firstName} onPickSample={pickSample} onPickFresh={pickFresh} />
    );
  }
  return <ThemeScreen onContinue={finish} onBack={goBack} loading={finishing} />;
}
