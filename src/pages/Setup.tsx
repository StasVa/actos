// Setup Wizard — first-run ceremonial onboarding.
// Full-screen, no sidebar, no header chrome. 4 screens (Welcome + 3 steps).

import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Sparkles, Target } from "lucide-react";
import { useStore } from "@/store/useStore";
import { themeStore, useThemeChoice, type ThemeChoice } from "@/lib/theme";

const SETUP_COMPLETED_KEY = "actos.setup.completed";
const SETUP_SCREEN_KEY = "actos.setup.currentScreen";

type Screen = 0 | 1 | 2 | 3;
type Path = "sample" | "own";

function readScreen(): Screen {
  try {
    const v = parseInt(localStorage.getItem(SETUP_SCREEN_KEY) ?? "0", 10);
    if (v === 0 || v === 1 || v === 2 || v === 3) return v;
  } catch {}
  return 0;
}
function writeScreen(s: Screen) {
  try { localStorage.setItem(SETUP_SCREEN_KEY, String(s)); } catch {}
}

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
const StepIndicator: React.FC<{ n: Screen }> = ({ n }) =>
  n >= 1 ? (
    <div
      className="absolute"
      style={{
        right: 32, bottom: 28,
        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
        fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase",
        color: "hsl(var(--text-tertiary))",
      }}
    >
      Step {n} of 3
    </div>
  ) : null;

const BackLink: React.FC<{ onClick: () => void }> = ({ onClick }) => (
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
    ← Back
  </button>
);

const ContinueCTA: React.FC<{ onClick: () => void; disabled?: boolean; label?: string }> = ({
  onClick, disabled, label = "Continue",
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className="group inline-flex items-center gap-2 transition-all"
    style={{
      fontFamily: "Inter, ui-sans-serif, system-ui",
      fontSize: 16, fontWeight: 500,
      color: "hsl(var(--accent))",
      background: "transparent", border: "none",
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.4 : 1,
      padding: "8px 4px",
    }}
  >
    <span>{label}</span>
    <ArrowRight
      size={18}
      className="transition-transform"
      style={{ transitionDuration: "150ms" }}
    />
    <style>{`
      .group:not(:disabled):hover svg { transform: translateX(2px); }
      .group:not(:disabled):hover { color: hsl(var(--accent-hover)); }
    `}</style>
  </button>
);

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

const WelcomeScreen: React.FC<{ name: string; onContinue: () => void }> = ({ name, onContinue }) => (
  <ScreenWrap keyId="s0">
    <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
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
      <div style={{ height: 80 }} />
      <h1
        style={{
          fontFamily: "Inter, ui-sans-serif, system-ui",
          fontWeight: 400,
          fontSize: "clamp(36px, 6vw, 56px)",
          lineHeight: 1.1,
          color: "hsl(var(--text-primary))",
          margin: 0,
        }}
      >
        Welcome, {name}.
      </h1>
      <div style={{ height: 16 }} />
      <p
        style={{
          fontFamily: "Inter", fontWeight: 400,
          fontSize: 18, color: "hsl(var(--text-secondary))", margin: 0,
        }}
      >
        Let's set this up.
      </p>
      <div style={{ height: 96 }} />
      <ContinueCTA onClick={onContinue} />
    </div>
  </ScreenWrap>
);

const ThemeScreen: React.FC<{ onContinue: () => void; onBack: () => void }> = ({ onContinue, onBack }) => {
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
    { value: "system", label: "System", mockup: window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light" },
    { value: "light", label: "Light", mockup: "light" },
    { value: "dark", label: "Dark", mockup: "dark" },
  ];

  return (
    <ScreenWrap keyId="s1">
      <div className="flex flex-col items-center min-h-screen px-6" style={{ paddingTop: 80, paddingBottom: 96 }}>
        <h1 style={{
          fontFamily: "Inter", fontWeight: 400,
          fontSize: "clamp(32px, 5vw, 48px)", margin: 0,
          color: "hsl(var(--text-primary))", textAlign: "center",
        }}>Pick your look.</h1>
        <div style={{ height: 12 }} />
        <p style={{
          fontFamily: "Inter", fontSize: 15,
          color: "hsl(var(--text-tertiary))", margin: 0, textAlign: "center",
        }}>You can change this anytime in Settings.</p>
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
        <ContinueCTA onClick={onContinue} disabled={!touched} />
      </div>
      <BackLink onClick={onBack} />
      <StepIndicator n={1} />
    </ScreenWrap>
  );
};

const ChoiceScreen: React.FC<{
  selected: Path | null;
  setSelected: (p: Path) => void;
  onContinue: () => void;
  onBack: () => void;
}> = ({ selected, setSelected, onContinue, onBack }) => {
  const cards: { id: Path; icon: typeof Sparkles; title: string; desc: string }[] = [
    {
      id: "sample",
      icon: Sparkles,
      title: "Show me how it works",
      desc: "Start with sample goals and tasks. See the product in motion. Clear it whenever you're ready.",
    },
    {
      id: "own",
      icon: Target,
      title: "Set up my own goal",
      desc: "Walk through creating your first goal, project, and a few actions. Start working immediately on what matters.",
    },
  ];
  return (
    <ScreenWrap keyId="s2">
      <div className="flex flex-col items-center min-h-screen px-6" style={{ paddingTop: 80, paddingBottom: 96 }}>
        <h1 style={{
          fontFamily: "Inter", fontWeight: 400,
          fontSize: "clamp(32px, 5vw, 48px)", margin: 0, textAlign: "center",
          color: "hsl(var(--text-primary))",
        }}>How would you like to start?</h1>
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

const PauseScreen: React.FC<{ fade: boolean }> = ({ fade }) => (
  <ScreenWrap keyId="s3">
    <div
      className="flex flex-col items-center justify-center min-h-screen px-6 text-center"
      style={{
        animation: fade && !reducedMotion() ? "setupFadeOut 250ms forwards" : undefined,
      }}
    >
      <div style={{
        fontFamily: "Inter", fontSize: 18, color: "hsl(var(--text-secondary))",
      }}>Setting up your workspace…</div>
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

/* ───────── Wizard root ───────── */
export default function Setup() {
  const navigate = useNavigate();
  const userName = useStore((s) => s.settings.userName);
  const seedSampleData = useStore((s) => s.seedSampleData);
  const resetToEmpty = useStore((s) => s.resetToEmpty);

  const [screen, setScreen] = React.useState<Screen>(() => readScreen());
  const [path, setPath] = React.useState<Path | null>(null);
  const [fading, setFading] = React.useState(false);

  // Setup Wizard always starts in Dark, regardless of system preference.
  // User's later selection on Screen 1 overrides this via themeStore.set().
  React.useEffect(() => { themeStore.set("dark"); }, []);

  React.useEffect(() => { writeScreen(screen); }, [screen]);

  // Browser back button → step back. Push history entry per screen.
  React.useEffect(() => {
    const onPop = () => {
      const s = readScreen();
      if (s > 0) setScreen((s - 1) as Screen);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const goNext = () => {
    const next = Math.min(3, screen + 1) as Screen;
    setScreen(next);
    try { window.history.pushState({ setupScreen: next }, ""); } catch {}
  };
  const goBack = () => {
    if (screen === 0) return;
    setScreen((screen - 1) as Screen);
  };

  // Pause screen — run side-effect after mount, then redirect.
  React.useEffect(() => {
    if (screen !== 3) return;
    const delay = reducedMotion() ? 100 : 1200;
    const seedTimer = setTimeout(() => {
      if (path === "sample") {
        resetToEmpty();
        seedSampleData();
      } else {
        resetToEmpty();
      }
    }, Math.max(50, delay - 200));
    const fadeTimer = setTimeout(() => setFading(true), delay);
    const navTimer = setTimeout(() => {
      try {
        localStorage.setItem(SETUP_COMPLETED_KEY, "true");
        localStorage.removeItem(SETUP_SCREEN_KEY);
        // Mark which path the user took — drives the inline onboarding guide on /today.
        if (path === "own") {
          localStorage.setItem("actos.onboarding.guide", "step:goal");
        } else {
          localStorage.removeItem("actos.onboarding.guide");
        }
      } catch {}
      navigate("/today", { replace: true });
    }, delay + 250);
    return () => {
      clearTimeout(seedTimer);
      clearTimeout(fadeTimer);
      clearTimeout(navTimer);
    };
  }, [screen, path, navigate, resetToEmpty, seedSampleData]);

  const firstName = (userName ?? "there").split(/\s+/)[0];

  switch (screen) {
    case 0: return <WelcomeScreen name={firstName} onContinue={goNext} />;
    case 1: return <ThemeScreen onContinue={goNext} onBack={goBack} />;
    case 2: return (
      <ChoiceScreen
        selected={path}
        setSelected={setPath}
        onContinue={() => { if (path) goNext(); }}
        onBack={goBack}
      />
    );
    case 3: return <PauseScreen fade={fading} />;
  }
}

/** Helper for App-level guard. */
export function isSetupCompleted(): boolean {
  try { return localStorage.getItem(SETUP_COMPLETED_KEY) === "true"; }
  catch { return false; }
}
