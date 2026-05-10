// Active Session view — timer + current action card + controls.
//
// Behavior:
//   • Timer state persisted in localStorage so reload resumes correctly.
//   • Phases: 'work' / 'break' / 'workEnd' / 'breakEnd' / 'sessionEnd'.
//   • Explicit Continue between phases — no auto-rollover.
//   • Audio cues opt-in (default ON), muted via "Sound off" toggle.

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Maximize, Minimize, Volume2, VolumeX } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/store/useStore";
import { AppSidebar } from "@/components/AppSidebar";
import { ConfirmModal } from "@/components/ConfirmModal";
import type { Action, Session } from "@/types";

/* ───────── Persistent timer state ───────── */

type Phase = "work" | "break" | "workEnd" | "breakEnd" | "sessionEnd";

interface TimerState {
  sessionId: string;
  phase: Phase;
  cycleIndex: number; // 0-based, current cycle in progress (work or upcoming break)
  // For active phases (work/break): epoch ms when current phase ends.
  // For paused: remaining ms until phase ends.
  endsAt: number | null;
  remainingMs: number | null;
  paused: boolean;
}

const TIMER_KEY = "actos-session-timer";
const SOUND_KEY = "actos-session-sound";

function loadTimer(): TimerState | null {
  try {
    const raw = localStorage.getItem(TIMER_KEY);
    return raw ? (JSON.parse(raw) as TimerState) : null;
  } catch {
    return null;
  }
}
function saveTimer(t: TimerState | null) {
  if (!t) localStorage.removeItem(TIMER_KEY);
  else localStorage.setItem(TIMER_KEY, JSON.stringify(t));
}

function loadSound(): boolean {
  const raw = localStorage.getItem(SOUND_KEY);
  return raw == null ? true : raw === "1";
}

/* ───────── Audio cues (Web Audio API) ───────── */

let audioCtx: AudioContext | null = null;
function ensureAudio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    if (!audioCtx) {
      const Ctor = (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext) as typeof AudioContext;
      audioCtx = new Ctor();
    }
    return audioCtx;
  } catch {
    return null;
  }
}
function playTone(freq: number, durationMs: number, type: OscillatorType = "sine", gain = 0.15) {
  const ctx = ensureAudio();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.value = 0;
  g.gain.linearRampToValueAtTime(gain, ctx.currentTime + 0.02);
  g.gain.linearRampToValueAtTime(0, ctx.currentTime + durationMs / 1000);
  osc.connect(g).connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + durationMs / 1000 + 0.05);
}
function playWorkEnd() {
  playTone(660, 700, "sine", 0.2);
  setTimeout(() => playTone(880, 600, "sine", 0.18), 180);
}
function playBreakEnd() {
  playTone(520, 400, "sine", 0.15);
}
function playSessionComplete() {
  playTone(523, 280, "sine", 0.18);
  setTimeout(() => playTone(659, 280, "sine", 0.18), 280);
  setTimeout(() => playTone(784, 700, "sine", 0.2), 560);
}

/* ───────── Helpers ───────── */

function fmtMMSS(ms: number): string {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m.toString().padStart(2, "0")}:${r.toString().padStart(2, "0")}`;
}

/* ───────── Page ───────── */

const SessionActive: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const sessions = useStore((s) => s.sessions);
  const actions = useStore((s) => s.actions);
  const goals = useStore((s) => s.goals);
  const projects = useStore((s) => s.projects);
  const changeActionStatus = useStore((s) => s.changeActionStatus);
  const addCompletedActionToSession = useStore((s) => s.addCompletedActionToSession);
  const addDroppedActionToSession = useStore((s) => s.addDroppedActionToSession);
  const addPlannedActionsToSession = useStore((s) => s.addPlannedActionsToSession);
  const incrementSessionCycles = useStore((s) => s.incrementSessionCycles);
  const completeSession = useStore((s) => s.completeSession);
  const abortSession = useStore((s) => s.abortSession);
  const openPanel = useStore((s) => s.openPanel);

  const session: Session | null = useMemo(
    () => sessions.find((s) => s.status === "in_progress") ?? null,
    [sessions],
  );

  // Redirect if no active session.
  useEffect(() => {
    if (!session) {
      saveTimer(null);
      navigate("/sessions", { replace: true });
    }
  }, [session, navigate]);

  /* ─── Timer state ─── */
  const [timer, setTimer] = useState<TimerState | null>(() => {
    if (!session) return null;
    const persisted = loadTimer();
    if (persisted && persisted.sessionId === session.id) return persisted;
    // Initialize fresh: start work phase for cycle 0.
    const fresh: TimerState = {
      sessionId: session.id,
      phase: "work",
      cycleIndex: 0,
      endsAt: Date.now() + session.workDuration * 60_000,
      remainingMs: null,
      paused: false,
    };
    saveTimer(fresh);
    return fresh;
  });

  // Re-init when session id changes.
  useEffect(() => {
    if (!session) return;
    if (!timer || timer.sessionId !== session.id) {
      const fresh: TimerState = {
        sessionId: session.id,
        phase: "work",
        cycleIndex: 0,
        endsAt: Date.now() + session.workDuration * 60_000,
        remainingMs: null,
        paused: false,
      };
      saveTimer(fresh);
      setTimer(fresh);
    }
  }, [session, timer]);

  // Persist timer on change.
  useEffect(() => {
    if (timer) saveTimer(timer);
  }, [timer]);

  /* ─── Tick ─── */
  const [now, setNow] = useState<number>(() => Date.now());
  useEffect(() => {
    const i = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(i);
  }, []);

  /* ─── Sound ─── */
  const [sound, setSound] = useState<boolean>(() => loadSound());
  useEffect(() => {
    localStorage.setItem(SOUND_KEY, sound ? "1" : "0");
  }, [sound]);

  /* ─── Visual flash ─── */
  const [flashing, setFlashing] = useState(false);
  const flash = useCallback(() => {
    setFlashing(true);
    window.setTimeout(() => setFlashing(false), 320);
  }, []);

  /* ─── Phase transitions on tick ─── */
  const lastFiredKey = useRef<string>("");
  useEffect(() => {
    if (!timer || !session) return;
    if (timer.paused) return;
    if (timer.phase !== "work" && timer.phase !== "break") return;
    if (timer.endsAt == null) return;
    if (now < timer.endsAt) return;

    const fireKey = `${timer.phase}:${timer.cycleIndex}:${timer.endsAt}`;
    if (lastFiredKey.current === fireKey) return;
    lastFiredKey.current = fireKey;

    flash();

    if (timer.phase === "work") {
      // Work block ended. Increment cycles completed.
      incrementSessionCycles(session.id);
      const isLast = timer.cycleIndex + 1 >= session.cyclesPlanned;
      if (sound) {
        if (isLast) playSessionComplete();
        else playWorkEnd();
      }
      setTimer({
        ...timer,
        phase: isLast ? "sessionEnd" : "workEnd",
        endsAt: null,
        remainingMs: null,
      });
    } else if (timer.phase === "break") {
      if (sound) playBreakEnd();
      setTimer({
        ...timer,
        phase: "breakEnd",
        endsAt: null,
        remainingMs: null,
      });
    }
  }, [now, timer, session, sound, incrementSessionCycles, flash]);

  /* ─── Focus mode ─── */
  const [focusMode, setFocusMode] = useState(false);
  const toggleFocus = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen?.();
        setFocusMode(true);
      } else {
        await document.exitFullscreen?.();
        setFocusMode(false);
      }
    } catch {
      setFocusMode((v) => !v);
    }
  }, []);
  useEffect(() => {
    const onFs = () => setFocusMode(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  /* ─── Confirm modals ─── */
  const [confirmDrop, setConfirmDrop] = useState<string | null>(null);
  const [confirmAbort, setConfirmAbort] = useState(false);
  const [confirmRestart, setConfirmRestart] = useState(false);
  const [confirmEndEarly, setConfirmEndEarly] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerSelected, setPickerSelected] = useState<string[]>([]);

  if (!session || !timer) return null;

  /* ─── Derived ─── */
  const isWorking = timer.phase === "work";
  const isBreak = timer.phase === "break";
  const isPaused = timer.paused;

  const phaseDurationMs =
    timer.phase === "work" || timer.phase === "workEnd"
      ? session.workDuration * 60_000
      : session.breakDuration * 60_000;

  const remainingMs = (() => {
    if (timer.paused) return timer.remainingMs ?? 0;
    if (timer.endsAt == null) return 0;
    return Math.max(0, timer.endsAt - now);
  })();

  const elapsedMs = phaseDurationMs - remainingMs;
  const progressPct = phaseDurationMs > 0 ? Math.min(100, (elapsedMs / phaseDurationMs) * 100) : 0;

  const currentActionId = session.plannedActionIds.find(
    (id) => !session.completedActionIds.includes(id) && !session.droppedActionIds.includes(id),
  );
  const currentAction: Action | undefined = currentActionId
    ? actions.find((a) => a.id === currentActionId)
    : undefined;
  const currentIndex = currentActionId
    ? session.plannedActionIds.indexOf(currentActionId)
    : -1;

  const goal = currentAction ? goals.find((g) => g.id === currentAction.goalId) : undefined;
  const project = currentAction?.projectId ? projects.find((p) => p.id === currentAction.projectId) : undefined;

  /* ─── Controls ─── */
  const handlePauseToggle = () => {
    if (!isWorking && !isBreak) return;
    if (timer.paused) {
      // Resume: shift endsAt forward by remaining.
      const rem = timer.remainingMs ?? 0;
      setTimer({ ...timer, paused: false, endsAt: Date.now() + rem, remainingMs: null });
    } else {
      const rem = timer.endsAt != null ? Math.max(0, timer.endsAt - Date.now()) : 0;
      setTimer({ ...timer, paused: true, endsAt: null, remainingMs: rem });
    }
  };

  const handleContinueToBreak = () => {
    if (timer.phase !== "workEnd") return;
    if (session.breakDuration <= 0) {
      // Skip directly to next work cycle.
      handleStartNextWork();
      return;
    }
    setTimer({
      ...timer,
      phase: "break",
      endsAt: Date.now() + session.breakDuration * 60_000,
      remainingMs: null,
      paused: false,
    });
  };

  const handleStartNextWork = () => {
    const nextCycle = timer.cycleIndex + 1;
    if (nextCycle >= session.cyclesPlanned) return;
    setTimer({
      ...timer,
      phase: "work",
      cycleIndex: nextCycle,
      endsAt: Date.now() + session.workDuration * 60_000,
      remainingMs: null,
      paused: false,
    });
  };

  const handleSkipBreak = () => {
    if (timer.phase !== "break") return;
    if (sound) playBreakEnd();
    handleStartNextWork();
  };

  const handleRestartCycle = () => {
    setTimer({
      ...timer,
      endsAt: Date.now() + (timer.phase === "break" ? session.breakDuration : session.workDuration) * 60_000,
      remainingMs: null,
      paused: false,
    });
  };

  const handleMarkDone = () => {
    if (!currentAction) return;
    // Validate Impact (and Time if logTime layer is on) — open editor if invalid.
    const layers = useStore.getState().settings.layers;
    const needsImpact = !(currentAction.impact && currentAction.impact > 0);
    const needsTime = layers.logTime && !(currentAction.timeEstimateMinutes && currentAction.timeEstimateMinutes > 0);
    if (needsImpact || needsTime) {
      openPanel({ kind: "action", mode: "edit", id: currentAction.id });
      toast.info(t("sessionActive.action.fillFields"));
      return;
    }
    changeActionStatus(currentAction.id, "done");
    addCompletedActionToSession(session.id, currentAction.id);
    // Find next action to surface in toast.
    const remaining = session.plannedActionIds.filter(
      (id) =>
        id !== currentAction.id &&
        !session.completedActionIds.includes(id) &&
        !session.droppedActionIds.includes(id),
    );
    const nextId = remaining[0];
    const next = nextId ? actions.find((a) => a.id === nextId) : null;
    toast.success(next ? t("sessionActive.action.markedDoneNext", { title: next.title }) : t("sessionActive.action.markedDone"));
  };

  const handleConfirmDrop = () => {
    if (!confirmDrop) return;
    const a = actions.find((x) => x.id === confirmDrop);
    if (!a) {
      setConfirmDrop(null);
      return;
    }
    changeActionStatus(a.id, "dropped");
    addDroppedActionToSession(session.id, a.id);
    toast(t("sessionActive.action.dropped"));
    setConfirmDrop(null);
  };

  const handleConfirmAbort = () => {
    abortSession(session.id);
    saveTimer(null);
    navigate(`/sessions/${session.id}/summary`);
  };

  const handleSessionComplete = () => {
    completeSession(session.id);
    saveTimer(null);
    navigate(`/sessions/${session.id}/summary`);
  };

  /* ─── Labels ─── */
  const topLabel = (() => {
    if (timer.phase === "work" || timer.phase === "workEnd")
      return t("sessionActive.label.workCycle", { current: timer.cycleIndex + 1, total: session.cyclesPlanned });
    if (timer.phase === "break" || timer.phase === "breakEnd")
      return t("sessionActive.label.breakMin", { count: session.breakDuration });
    return t("sessionActive.label.sessionComplete");
  })();

  const timerColor =
    isBreak || timer.phase === "breakEnd" ? "hsl(var(--text-secondary))" : "hsl(var(--text-primary))";
  const progressColor =
    isBreak || timer.phase === "breakEnd" ? "hsl(var(--text-secondary))" : "hsl(var(--accent))";

  const sessionOutcome = session.completedActionIds
    .map((id) => actions.find((a) => a.id === id)?.impact ?? 0)
    .reduce((s, n) => s + n, 0);

  // Total session remaining minutes (rough, friendly format) for empty-state copy.
  const remainingCyclesAfterCurrent = Math.max(0, session.cyclesPlanned - timer.cycleIndex - 1);
  const remainingMinutesTotal = (() => {
    const cur = isWorking || isBreak ? Math.ceil(remainingMs / 60_000) : 0;
    const future = remainingCyclesAfterCurrent * (session.workDuration + session.breakDuration);
    return Math.max(0, cur + future);
  })();
  const minutesLabel = t("sessionActive.empty.minutes", { count: remainingMinutesTotal });

  // Actions available for in-session add (exclude already in this session).
  const sessionActionIdSet = new Set(session.plannedActionIds);
  const activeGoalIds = new Set(goals.filter((g) => g.status === "active").map((g) => g.id));
  const pickerAvailable = actions.filter((a) => {
    if (sessionActionIdSet.has(a.id)) return false;
    if (a.status !== "backlog" && a.status !== "planned") return false;
    if (!activeGoalIds.has(a.goalId)) return false;
    if (a.projectId) {
      const p = projects.find((x) => x.id === a.projectId);
      if (!p || p.status !== "active") return false;
    }
    return true;
  });

  const handleConfirmAddActions = () => {
    if (pickerSelected.length === 0) {
      setPickerOpen(false);
      return;
    }
    addPlannedActionsToSession(session.id, pickerSelected);
    toast.success(t("sessionActive.toast.added", { count: pickerSelected.length }));
    setPickerSelected([]);
    setPickerOpen(false);
  };

  const handleEndSessionEarly = () => {
    setConfirmEndEarly(false);
    handleSessionComplete();
  };

  const actualFocusedMinutes = (() => {
    const start = new Date(session.startedAt).getTime();
    return Math.max(0, Math.round((Date.now() - start) / 60_000));
  })();
  const plannedFocusMinutes = session.workDuration * session.cyclesPlanned;

  /* ─── Render ─── */
  return (
    <div className="min-h-screen bg-background text-text-primary">
      {!focusMode && (
        <>
          <AppSidebar />
        </>
      )}
      <main className={focusMode ? "" : "app-main page-medium"}>
        <div className="relative max-w-[760px] mx-auto px-6 md:px-8 py-10 pb-32">
          {/* Top-right controls */}
          <div className="absolute right-6 top-6 flex items-center gap-2">
            <button
              onClick={() => setSound((v) => !v)}
              className="w-8 h-8 inline-flex items-center justify-center rounded-[3px] text-text-tertiary hover:bg-surface-hover hover:text-text-primary transition-colors"
              aria-label={sound ? t("sessionActive.controls.soundOn") : t("sessionActive.controls.soundOff")}
              title={sound ? t("sessionActive.controls.soundOn") : t("sessionActive.controls.soundOff")}
            >
              {sound ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>
            <button
              onClick={toggleFocus}
              className="w-8 h-8 inline-flex items-center justify-center rounded-[3px] text-text-tertiary hover:bg-surface-hover hover:text-text-primary transition-colors"
              aria-label={focusMode ? t("sessionActive.controls.exitFocus") : t("sessionActive.controls.focusMode")}
              title={focusMode ? t("sessionActive.controls.exitFocus") : t("sessionActive.controls.focusMode")}
            >
              {focusMode ? <Minimize size={16} /> : <Maximize size={16} />}
            </button>
          </div>

          {/* Timer area */}
          <section
            className="relative flex flex-col items-center justify-center mt-6 rounded-[8px] transition-colors"
            style={{
              padding: "32px 16px",
              background: flashing ? "hsl(var(--accent) / 0.2)" : "transparent",
            }}
          >
            <div
              className="font-mono uppercase tracking-[0.06em] text-text-tertiary"
              style={{ fontSize: 11 }}
            >
              {isPaused ? t("sessionActive.label.paused") : topLabel}
            </div>
            <div
              className="mt-3 font-mono tabular-nums"
              style={{
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: "clamp(72px, 12vw, 96px)",
                lineHeight: 1,
                color: isPaused ? "hsl(var(--text-tertiary))" : timerColor,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {fmtMMSS(remainingMs)}
            </div>
            {/* Progress bar */}
            <div
              className="mt-6 rounded-full overflow-hidden"
              style={{
                width: "min(420px, 80%)",
                height: 4,
                background: "hsl(var(--surface-hover))",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${progressPct}%`,
                  background: progressColor,
                  transition: "width 250ms linear",
                }}
              />
            </div>
          </section>

          {/* Current Action card */}
          <section className="mt-8 flex flex-col items-center">
            {currentAction && goal ? (
              <div
                className="relative w-full max-w-[640px] rounded-[8px] border border-border-subtle overflow-hidden"
                style={{ background: "hsl(var(--surface-raised))" }}
              >
                <span
                  className="absolute left-0 top-0 bottom-0 w-1"
                  style={{ background: `hsl(var(--${goal.color}))` }}
                />
                <div style={{ padding: "24px 32px" }}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-mono text-[10px] uppercase tracking-[0.06em] text-text-tertiary">
                        {goal.title}
                        {project ? (
                          <span className="text-text-secondary normal-case font-sans text-[13px] ml-2">
                            · {project.title}
                          </span>
                        ) : null}
                      </div>
                      <h2
                        className="mt-2 font-medium text-text-primary"
                        style={{ fontSize: 24, lineHeight: 1.3 }}
                      >
                        {currentAction.title}
                      </h2>
                      <div className="mt-2 font-mono text-[12px] text-text-secondary tabular-nums">
                        {currentAction.timeEstimateMinutes
                          ? t("sessionActive.action.impactWithTime", { count: currentAction.impact ?? 0, minutes: currentAction.timeEstimateMinutes })
                          : t("sessionActive.action.impact", { count: currentAction.impact ?? 0 })}
                      </div>
                    </div>
                    <div className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-tertiary shrink-0">
                      {t("sessionActive.action.title", { current: currentIndex + 1, total: session.plannedActionIds.length })}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div
                className="w-full max-w-[640px] rounded-[8px] border border-border-subtle p-8 text-center"
                style={{ background: "hsl(var(--surface-raised))" }}
              >
                <div className="text-[18px] text-text-primary font-medium">
                  {t("sessionActive.empty.allDone")}
                </div>
                <div className="mt-2 text-[14px] text-text-secondary">
                  {t("sessionActive.empty.remainingFocus", { label: minutesLabel })}
                </div>
                <div className="mt-4 flex flex-col items-center gap-3">
                  <button
                    onClick={() => {
                      setPickerSelected([]);
                      setPickerOpen(true);
                    }}
                    className="text-[14px] font-medium rounded-[4px] transition-colors"
                    style={{
                      padding: "10px 20px",
                      background: "hsl(var(--accent))",
                      color: "hsl(var(--accent-foreground))",
                    }}
                  >
                    {t("sessionActive.empty.addAction")}
                  </button>
                  <button
                    onClick={() => setConfirmEndEarly(true)}
                    className="text-[13px] hover:underline"
                    style={{ color: "hsl(var(--text-warning))" }}
                  >
                    {t("sessionActive.empty.endSession")}
                  </button>
                </div>
              </div>
            )}

            {/* Action buttons */}
            {currentAction && (
              <div className="mt-4 flex items-center gap-3">
                <button
                  onClick={handleMarkDone}
                  className="text-[14px] font-medium rounded-[4px] transition-colors"
                  style={{
                    padding: "10px 20px",
                    background: "hsl(var(--accent))",
                    color: "hsl(var(--accent-foreground))",
                  }}
                >
                  {t("sessionActive.action.markDone")}
                </button>
                <button
                  onClick={() => setConfirmDrop(currentAction.id)}
                  className="text-[14px] font-medium rounded-[4px] transition-colors"
                  style={{
                    padding: "10px 20px",
                    background: "hsl(var(--surface-hover))",
                    color: "hsl(var(--text-primary))",
                  }}
                >
                  {t("sessionActive.action.drop")}
                </button>
              </div>
            )}
          </section>

          {/* Phase transition modals */}
          {timer.phase === "workEnd" && (
            <div
              className="fixed inset-0 z-[80] flex items-center justify-center"
              style={{ background: "var(--backdrop)" }}
            >
              <div
                className="w-[440px] max-w-[90vw] bg-surface-elevated border border-border-subtle rounded-[6px] p-6"
                style={{ boxShadow: "0 20px 50px rgba(0,0,0,0.4)" }}
              >
                <h2 className="text-[16px] font-medium text-text-primary">
                  {t("sessionActive.workEnd.title")}
                </h2>
                <p className="mt-2 text-[13px] text-text-secondary">
                  {t("sessionActive.workEnd.body", { current: timer.cycleIndex + 1, total: session.cyclesPlanned })}
                </p>
                <div className="mt-6 flex items-center justify-end gap-3">
                  <button
                    onClick={() => setConfirmAbort(true)}
                    className="text-[13px] font-medium px-3 py-1.5"
                    style={{ color: "hsl(var(--text-warning))" }}
                  >
                    {t("sessionActive.controls.endSession")}
                  </button>
                  <button
                    onClick={handleContinueToBreak}
                    className="text-[13px] font-medium px-4 py-2 rounded-[4px]"
                    style={{
                      background: "hsl(var(--accent))",
                      color: "hsl(var(--accent-foreground))",
                    }}
                  >
                    {session.breakDuration > 0 ? t("sessionActive.workEnd.continueBreak") : t("sessionActive.workEnd.continueNext")}
                  </button>
                </div>
              </div>
            </div>
          )}

          {timer.phase === "breakEnd" && (
            <div
              className="fixed inset-0 z-[80] flex items-center justify-center"
              style={{ background: "var(--backdrop)" }}
            >
              <div
                className="w-[440px] max-w-[90vw] bg-surface-elevated border border-border-subtle rounded-[6px] p-6"
                style={{ boxShadow: "0 20px 50px rgba(0,0,0,0.4)" }}
              >
                <h2 className="text-[16px] font-medium text-text-primary">
                  {t("sessionActive.breakEnd.title")}
                </h2>
                <div className="mt-6 flex items-center justify-end gap-3">
                  <button
                    onClick={() => setConfirmAbort(true)}
                    className="text-[13px] font-medium px-3 py-1.5"
                    style={{ color: "hsl(var(--text-warning))" }}
                  >
                    {t("sessionActive.controls.endSession")}
                  </button>
                  <button
                    onClick={handleStartNextWork}
                    className="text-[13px] font-medium px-4 py-2 rounded-[4px]"
                    style={{
                      background: "hsl(var(--accent))",
                      color: "hsl(var(--accent-foreground))",
                    }}
                  >
                    {t("sessionActive.breakEnd.continueWork")}
                  </button>
                </div>
              </div>
            </div>
          )}

          {timer.phase === "sessionEnd" && (
            <div
              className="fixed inset-0 z-[80] flex items-center justify-center"
              style={{ background: "var(--backdrop)" }}
            >
              <div
                className="w-[480px] max-w-[90vw] bg-surface-elevated border border-border-subtle rounded-[6px] p-6"
                style={{ boxShadow: "0 20px 50px rgba(0,0,0,0.4)" }}
              >
                <h2 className="text-[18px] font-medium text-text-primary">
                  {t("sessionActive.sessionEnd.title", { count: session.workDuration * session.cyclesPlanned })}
                </h2>
                <div className="mt-3 font-mono text-[13px] text-text-secondary">
                  {t("sessionActive.sessionEnd.summary", { done: session.completedActionIds.length, dropped: session.droppedActionIds.length, value: sessionOutcome })}
                </div>
                <div className="mt-6 flex items-center justify-end gap-3">
                  <button
                    onClick={handleSessionComplete}
                    className="text-[14px] font-medium px-4 py-2 rounded-[4px]"
                    style={{
                      background: "hsl(var(--accent))",
                      color: "hsl(var(--accent-foreground))",
                    }}
                  >
                    {t("sessionActive.sessionEnd.review")}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Session controls */}
          <section className="mt-12 flex flex-col items-center gap-4">
            <div className="flex items-center gap-3">
              {(isWorking || isBreak) && (
                <button
                  onClick={handlePauseToggle}
                  className="text-[13px] font-medium rounded-[4px] transition-colors"
                  style={{
                    padding: "8px 16px",
                    background: "hsl(var(--surface-hover))",
                    color: "hsl(var(--text-primary))",
                  }}
                >
                  {isPaused ? t("sessionActive.controls.resume") : t("sessionActive.controls.pause")}
                </button>
              )}
              {isBreak && (
                <button
                  onClick={handleSkipBreak}
                  className="text-[13px] font-medium rounded-[4px] transition-colors"
                  style={{
                    padding: "8px 16px",
                    background: "hsl(var(--surface-hover))",
                    color: "hsl(var(--text-primary))",
                  }}
                >
                  {t("sessionActive.controls.skipBreak")}
                </button>
              )}
              {isPaused && (
                <button
                  onClick={() => setConfirmRestart(true)}
                  className="text-[13px] font-medium rounded-[4px] transition-colors"
                  style={{
                    padding: "8px 16px",
                    background: "transparent",
                    color: "hsl(var(--text-secondary))",
                  }}
                >
                  {t("sessionActive.controls.restartCycle")}
                </button>
              )}
            </div>
            <button
              onClick={() => setConfirmAbort(true)}
              className="text-[12px] hover:underline"
              style={{ color: "hsl(var(--text-warning))" }}
            >
              {t("sessionActive.controls.endSession")}
            </button>
          </section>
        </div>
      </main>

      <ConfirmModal
        open={confirmDrop != null}
        title={t("sessionActive.confirm.dropTitle")}
        body={t("sessionActive.confirm.dropBody")}
        confirmLabel={t("sessionActive.confirm.dropConfirm")}
        destructive
        onCancel={() => setConfirmDrop(null)}
        onConfirm={handleConfirmDrop}
      />
      <ConfirmModal
        open={confirmAbort}
        title={t("sessionActive.confirm.abortTitle")}
        body={t("sessionActive.confirm.abortBody")}
        confirmLabel={t("sessionActive.confirm.abortConfirm")}
        destructive
        onCancel={() => setConfirmAbort(false)}
        onConfirm={() => {
          setConfirmAbort(false);
          handleConfirmAbort();
        }}
      />
      <ConfirmModal
        open={confirmRestart}
        title={t("sessionActive.confirm.restartTitle")}
        body={t("sessionActive.confirm.restartBody")}
        confirmLabel={t("sessionActive.confirm.restartConfirm")}
        onCancel={() => setConfirmRestart(false)}
        onConfirm={() => {
          setConfirmRestart(false);
          handleRestartCycle();
        }}
      />
      <ConfirmModal
        open={confirmEndEarly}
        title={t("sessionActive.confirm.abortTitle")}
        body={t("sessionActive.confirm.endEarlyBody", { actual: actualFocusedMinutes, planned: plannedFocusMinutes })}
        confirmLabel={t("sessionActive.confirm.abortConfirm")}
        destructive
        onCancel={() => setConfirmEndEarly(false)}
        onConfirm={handleEndSessionEarly}
      />

      {/* Add-action picker overlay */}
      {pickerOpen && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center"
          style={{ background: "var(--backdrop)" }}
          onClick={() => setPickerOpen(false)}
        >
          <div
            className="w-[560px] max-w-[92vw] max-h-[80vh] flex flex-col bg-surface-elevated border border-border-subtle rounded-[6px] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-border-subtle">
              <h2 className="text-[16px] font-medium text-text-primary">{t("sessionActive.picker.title")}</h2>
              <p className="mt-1 text-[12px] text-text-secondary">
                {t("sessionActive.picker.body")}
              </p>
            </div>
            <div className="flex-1 overflow-y-auto">
              {pickerAvailable.length === 0 ? (
                <div className="p-6 text-[13px] text-text-tertiary text-center">
                  {t("sessionActive.picker.empty")}
                </div>
              ) : (
                pickerAvailable.map((a) => {
                  const goal = goals.find((g) => g.id === a.goalId);
                  const project = a.projectId ? projects.find((p) => p.id === a.projectId) : undefined;
                  const checked = pickerSelected.includes(a.id);
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() =>
                        setPickerSelected((prev) =>
                          prev.includes(a.id) ? prev.filter((x) => x !== a.id) : [...prev, a.id],
                        )
                      }
                      className="w-full text-left flex items-start gap-3 px-5 py-3 border-b border-border-subtle hover:bg-surface-hover transition-colors"
                    >
                      <span
                        className="mt-1 inline-block w-3 h-3 rounded-[2px] border"
                        style={{
                          borderColor: "hsl(var(--border-default))",
                          background: checked ? "hsl(var(--accent))" : "transparent",
                        }}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block text-[14px] text-text-primary">{a.title}</span>
                        <span className="block mt-0.5 font-mono text-[10px] uppercase tracking-[0.06em] text-text-tertiary">
                          {goal?.title ?? "—"}
                          {project ? ` · ${project.title}` : ""}
                          {a.timeEstimateMinutes ? ` · ${a.timeEstimateMinutes}min` : ""}
                        </span>
                      </span>
                    </button>
                  );
                })
              )}
            </div>
            <div className="px-5 py-3 border-t border-border-subtle flex items-center justify-end gap-3">
              <button
                onClick={() => setPickerOpen(false)}
                className="text-[13px] text-text-secondary hover:text-text-primary px-3 py-1.5"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAddActions}
                disabled={pickerSelected.length === 0}
                className="text-[13px] font-medium px-3 py-1.5 rounded-[4px] transition-colors disabled:opacity-40"
                style={{
                  background: "hsl(var(--accent))",
                  color: "hsl(var(--accent-foreground))",
                }}
              >
                Add {pickerSelected.length > 0 ? `(${pickerSelected.length})` : ""}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SessionActive;
