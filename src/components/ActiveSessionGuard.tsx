// ActiveSessionGuard — global host that:
//   1. Renders a persistent banner on every page EXCEPT /sessions/active and
//      /sessions/:id/summary while a session is in progress.
//   2. Intercepts navigation away from /sessions/active with a confirm modal
//      offering Cancel / Continue / End.
//
// Mounted once inside <App /> so it overlays all routes.

import React from "react";
import { Link, useLocation, useNavigate, useNavigationType } from "react-router-dom";
import { useStore } from "@/store/useStore";
import type { Session } from "@/types";

const TIMER_KEY = "actos-session-timer";

interface TimerState {
  sessionId: string;
  phase: "work" | "break" | "workEnd" | "breakEnd" | "sessionEnd";
  cycleIndex: number;
  endsAt: number | null;
  remainingMs: number | null;
  paused: boolean;
}

function loadTimer(): TimerState | null {
  try {
    const raw = localStorage.getItem(TIMER_KEY);
    return raw ? (JSON.parse(raw) as TimerState) : null;
  } catch {
    return null;
  }
}

function fmtMS(ms: number): string {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

function plannedTotalMin(s: Session): number {
  if (s.mode === "continuous") return s.workDuration;
  return s.workDuration * s.cyclesPlanned + s.breakDuration * Math.max(0, s.cyclesPlanned - 1);
}

/* ───────── Confirm modal (Cancel / Continue / End) ───────── */

const NavConfirmModal: React.FC<{
  open: boolean;
  remainingLabel: string;
  plannedTotal: number;
  onCancel: () => void;
  onContinue: () => void;
  onEnd: () => void;
}> = ({ open, remainingLabel, plannedTotal, onCancel, onContinue, onEnd }) => {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onCancel]);
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.5)" }}
      onClick={onCancel}
    >
      <div
        className="w-[460px] max-w-[90vw] bg-surface-elevated border border-border-subtle rounded-[6px] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-[16px] font-medium text-text-primary">Session in progress</h2>
        <p className="mt-3 text-[13px] text-text-secondary leading-[1.5]">
          You have an active session running. {remainingLabel} left of {plannedTotal}min total.
        </p>
        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="text-[13px] text-text-secondary hover:text-text-primary transition-colors px-3 py-1.5"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onContinue}
            className="text-[13px] font-medium px-3 py-1.5 rounded-[4px] transition-colors"
            style={{
              color: "hsl(var(--text-primary))",
              background: "hsl(var(--surface-hover))",
            }}
          >
            Continue session
          </button>
          <button
            type="button"
            onClick={onEnd}
            className="text-[13px] font-medium px-4 py-1.5 rounded-[4px] transition-colors"
            style={{
              color: "hsl(var(--accent-foreground))",
              background: "hsl(var(--accent))",
            }}
          >
            End session
          </button>
        </div>
      </div>
    </div>
  );
};

/* ───────── Banner ───────── */

const ActiveSessionBanner: React.FC<{ session: Session }> = ({ session }) => {
  const [now, setNow] = React.useState(Date.now());
  React.useEffect(() => {
    const i = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(i);
  }, []);

  const timer = loadTimer();
  const remainingMs = (() => {
    if (!timer) return 0;
    if (timer.paused) return timer.remainingMs ?? 0;
    if (timer.endsAt == null) return 0;
    return Math.max(0, timer.endsAt - now);
  })();
  const phaseLabel = (() => {
    if (!timer) return "session";
    if (timer.phase === "break" || timer.phase === "breakEnd") return "break";
    if (timer.phase === "sessionEnd") return "session";
    return `cycle ${timer.cycleIndex + 1}/${session.cyclesPlanned}`;
  })();

  return (
    <div
      className="sticky top-0 z-40 w-full flex items-center justify-between gap-3"
      style={{
        background: "hsl(var(--surface-elevated))",
        borderBottom: "1px solid hsl(var(--border-subtle))",
        padding: "8px 16px",
      }}
    >
      <div className="flex items-center gap-2 min-w-0">
        <span
          className="inline-block w-2 h-2 rounded-full shrink-0"
          style={{ background: "hsl(var(--state-active))" }}
        />
        <span className="text-[12px] font-medium text-text-primary">Session in progress</span>
        <span className="font-mono text-[12px] tabular-nums text-text-secondary truncate">
          · {fmtMS(remainingMs)} left of {phaseLabel}
        </span>
      </div>
      <Link
        to="/sessions/active"
        className="text-[13px] font-medium shrink-0 hover:underline"
        style={{ color: "hsl(var(--accent))" }}
      >
        Return →
      </Link>
    </div>
  );
};

/* ───────── Guard host ───────── */

const TIMER_KEY_REMOVE = TIMER_KEY;

export const ActiveSessionGuard: React.FC = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const navigationType = useNavigationType();
  const session = useStore((s) =>
    s.sessions.find((x) => x.status === "in_progress") ?? null,
  );
  const completeSession = useStore((s) => s.completeSession);

  const onActive = pathname === "/sessions/active";
  const onSummary = /^\/sessions\/[^/]+\/summary$/.test(pathname);

  const [pendingPath, setPendingPath] = React.useState<string | null>(null);

  // Intercept link clicks while on /sessions/active.
  React.useEffect(() => {
    if (!onActive || !session) return;
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const anchor = target.closest("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("http") || href.startsWith("#")) return;
      // Allow staying on active page or going to its own summary.
      if (href === "/sessions/active") return;
      // Intercept all other in-app navigation.
      e.preventDefault();
      e.stopPropagation();
      setPendingPath(href);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [onActive, session]);

  // beforeunload guard for tab close / refresh while active.
  React.useEffect(() => {
    if (!session) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [session]);

  // Browser back-button guard while on /sessions/active.
  React.useEffect(() => {
    if (!onActive || !session) return;
    // Push a sentinel state so back navigation triggers popstate and stays.
    window.history.pushState({ __sessionGuard: true }, "");
    const onPop = () => {
      // Re-push to stay; show modal asking for direction.
      window.history.pushState({ __sessionGuard: true }, "");
      setPendingPath("/today");
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [onActive, session, navigationType]);

  if (!session && pendingPath) setPendingPath(null);

  const planned = session ? plannedTotalMin(session) : 0;
  const timer = loadTimer();
  const remainingMs = (() => {
    if (!timer) return 0;
    if (timer.paused) return timer.remainingMs ?? 0;
    if (timer.endsAt == null) return 0;
    return Math.max(0, timer.endsAt - Date.now());
  })();

  const handleContinue = () => {
    const dest = pendingPath;
    setPendingPath(null);
    if (dest) navigate(dest);
  };

  const handleEnd = () => {
    if (!session) {
      setPendingPath(null);
      return;
    }
    completeSession(session.id);
    try {
      localStorage.removeItem(TIMER_KEY_REMOVE);
    } catch {
      /* ignore */
    }
    setPendingPath(null);
    navigate(`/sessions/${session.id}/summary`);
  };

  const showBanner = session && !onActive && !onSummary;

  return (
    <>
      {showBanner && (
        <div
          className="fixed top-0 z-40"
          style={{
            left: "var(--sidebar-w, 220px)",
            right: 0,
          }}
        >
          <ActiveSessionBanner session={session} />
        </div>
      )}
      <NavConfirmModal
        open={pendingPath != null && !!session}
        remainingLabel={fmtMS(remainingMs)}
        plannedTotal={planned}
        onCancel={() => setPendingPath(null)}
        onContinue={handleContinue}
        onEnd={handleEnd}
      />
    </>
  );
};

export default ActiveSessionGuard;
