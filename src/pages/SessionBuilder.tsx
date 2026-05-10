import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, GripVertical, X as XIcon } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/store/useStore";
import { AppSidebar } from "@/components/AppSidebar";
import { Switch } from "@/components/ui/switch";
import { FilterDropdown, FilterOption } from "@/components/FilterDropdown";
import { useIsMobile } from "@/hooks/use-mobile";
import type { Action, ID, SessionMode } from "@/types";
import { TimePill } from "@/components/MetaPills";

/* ───────── Mode presets ───────── */

type ModePreset = {
  key: SessionMode;
  title: string;
  desc: string;
  sub: string;
  total: number;
  work: number;
  brk: number;
  breaksOn: boolean;
};

const PRESETS: ModePreset[] = [
  { key: "pomodoro", title: "Pomodoro", desc: "25min focus, 5min break", sub: "100min total", total: 100, work: 25, brk: 5, breaksOn: true },
  { key: "continuous", title: "Continuous", desc: "60min uninterrupted", sub: "No breaks · single block", total: 60, work: 60, brk: 0, breaksOn: false },
  { key: "custom", title: "Custom", desc: "Pick your own durations", sub: "Tune everything", total: 60, work: 25, brk: 5, breaksOn: true },
];

const ModeCard: React.FC<{
  preset: ModePreset;
  selected: boolean;
  onClick: () => void;
}> = ({ preset, selected, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="flex-1 text-left rounded-[6px] transition-colors flex flex-col justify-between"
    style={{
      padding: "20px 24px",
      minHeight: 120,
      background: selected ? "hsl(var(--surface-hover))" : "hsl(var(--surface-raised))",
      border: selected
        ? "2px solid hsl(var(--accent))"
        : "1px solid hsl(var(--border-subtle))",
    }}
  >
    <div>
      <div className="text-[16px] font-medium text-text-primary">{preset.title}</div>
      <div className="mt-1 font-mono text-[12px] text-text-secondary">{preset.desc}</div>
    </div>
    <div className="mt-3 font-mono text-[11px] text-text-tertiary">{preset.sub}</div>
  </button>
);

/* ───────── Stepper number control (Duration centerpiece) ───────── */


type StepperSize = "xl" | "md" | "sm";

const SIZE_SPEC: Record<StepperSize, { font: number; suffixSize: number; btnPad: string; iconSize: number }> = {
  xl: { font: 48, suffixSize: 14, btnPad: "10px 14px", iconSize: 18 },
  md: { font: 20, suffixSize: 13, btnPad: "6px 8px", iconSize: 14 },
  sm: { font: 16, suffixSize: 12, btnPad: "4px 6px", iconSize: 12 },
};

const StepperField: React.FC<{
  label?: string;
  value: number | "";
  onChange: (v: number | "") => void;
  min: number;
  max: number;
  step: number;
  suffix: string;
  size?: StepperSize;
  isMobile?: boolean;
  ariaLabel?: string;
}> = ({ label, value, onChange, min, max, step, suffix, size = "xl", isMobile, ariaLabel }) => {
  const [focused, setFocused] = useState(false);
  const [flash, setFlash] = useState(false);
  const flashTimer = React.useRef<number | null>(null);

  React.useEffect(
    () => () => {
      if (flashTimer.current) window.clearTimeout(flashTimer.current);
    },
    [],
  );

  const numeric = typeof value === "number" ? value : NaN;
  const atMin = Number.isFinite(numeric) && numeric <= min;
  const atMax = Number.isFinite(numeric) && numeric >= max;

  const inc = () => {
    const base = Number.isFinite(numeric) ? numeric : min;
    onChange(Math.min(max, base + step));
  };
  const dec = () => {
    const base = Number.isFinite(numeric) ? numeric : min;
    onChange(Math.max(min, base - step));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const allowed = ["Backspace", "Delete", "Tab", "Enter", "Escape", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"];
    if (allowed.includes(e.key)) return;
    if (e.metaKey || e.ctrlKey) return;
    if (/^[0-9]$/.test(e.key)) return;
    e.preventDefault();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw === "") { onChange(""); return; }
    const n = Number(raw);
    if (Number.isNaN(n)) return;
    onChange(n);
  };

  const handleBlur = () => {
    setFocused(false);
    if (value === "") return;
    let n = Math.round(Number(value));
    if (!Number.isFinite(n)) { onChange(""); return; }
    let clamped = false;
    if (n > max) { n = max; clamped = true; }
    else if (n < min) { n = min; clamped = true; }
    if (clamped) {
      setFlash(true);
      if (flashTimer.current) window.clearTimeout(flashTimer.current);
      flashTimer.current = window.setTimeout(() => setFlash(false), 600);
    }
    onChange(n);
  };

  const display = value === "" ? "" : String(value);
  const spec = SIZE_SPEC[size];
  const fontSize = size === "xl" && isMobile ? 36 : spec.font;
  const charCount = Math.max(display.length, 1);
  const inputWidth = `${charCount * (fontSize * 0.62)}px`;

  const underlineColor = flash
    ? "hsl(var(--text-warning))"
    : focused
    ? "hsl(var(--accent))"
    : "transparent";

  return (
    <div className="flex flex-col items-center">
      {label && (
        <div className="font-mono text-[10px] uppercase text-text-tertiary mb-3" style={{ letterSpacing: "0.08em" }}>
          {label}
        </div>
      )}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={dec}
          disabled={atMin}
          aria-label={`Decrease ${ariaLabel ?? label ?? ""}`}
          className="inline-flex items-center justify-center rounded-[4px] transition-colors text-text-secondary hover:text-text-primary hover:bg-surface-hover disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed"
          style={{ padding: spec.btnPad }}
        >
          <ChevronLeft size={spec.iconSize} />
        </button>
        <div className="flex items-baseline gap-2">
          <input
            type="number"
            inputMode="numeric"
            value={display}
            min={min}
            max={max}
            onKeyDown={handleKeyDown}
            onChange={handleChange}
            onFocus={(e) => { setFocused(true); e.currentTarget.select(); }}
            onBlur={handleBlur}
            aria-label={ariaLabel ?? label}
            className="bg-transparent outline-none text-text-primary font-medium tabular-nums text-center transition-colors"
            style={{
              fontSize,
              lineHeight: 1.1,
              width: inputWidth,
              minWidth: fontSize * 0.7,
              borderBottom: `2px solid ${underlineColor}`,
              paddingBottom: 2,
            }}
          />
          <span className="font-mono text-text-secondary" style={{ fontSize: spec.suffixSize }}>{suffix}</span>
        </div>
        <button
          type="button"
          onClick={inc}
          disabled={atMax}
          aria-label={`Increase ${ariaLabel ?? label ?? ""}`}
          className="inline-flex items-center justify-center rounded-[4px] transition-colors text-text-secondary hover:text-text-primary hover:bg-surface-hover disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed"
          style={{ padding: spec.btnPad }}
        >
          <ChevronRight size={spec.iconSize} />
        </button>
      </div>
    </div>
  );
};

/* ───────── Session timeline visualization bar (wall-clock) ───────── */

function fmtClock(d: Date): string {
  const h = d.getHours();
  const m = d.getMinutes();
  const hh = ((h + 11) % 12) + 1;
  const mm = m < 10 ? `0${m}` : `${m}`;
  const ap = h < 12 ? "AM" : "PM";
  return `${hh}:${mm} ${ap}`;
}

const SessionTimelineBar: React.FC<{ work: number; brk: number; cycles: number; breaksOn: boolean }> = ({
  work,
  brk,
  cycles,
  breaksOn,
}) => {
  const c = Math.max(1, cycles);
  const effectiveBrk = breaksOn ? brk : 0;
  const total = c * work + Math.max(0, c - 1) * effectiveBrk || 1;

  const start = React.useMemo(() => new Date(), []);
  const end = new Date(start.getTime() + total * 60_000);

  // Build sequence: work blocks rendered as filled bars, gaps = breaks (transparent).
  const items: { kind: "work" | "gap"; mins: number }[] = [];
  for (let i = 0; i < c; i++) {
    items.push({ kind: "work", mins: work });
    if (i < c - 1 && effectiveBrk > 0) items.push({ kind: "gap", mins: effectiveBrk });
  }

  return (
    <div className="mt-6">
      <div
        className="flex w-full items-center"
        style={{
          height: 32,
          borderRadius: 4,
          background: "hsl(var(--surface-base))",
          padding: 0,
        }}
      >
        {items.map((b, i) => (
          <div
            key={i}
            className="transition-all duration-200 ease-out"
            style={{
              width: `${(b.mins / total) * 100}%`,
              height: "100%",
              background: b.kind === "work" ? "hsl(var(--accent))" : "transparent",
              borderRadius: b.kind === "work" ? 4 : 0,
            }}
          />
        ))}
      </div>
      <div className="mt-2 flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.06em] text-text-tertiary tabular-nums">
        <span>{fmtClock(start)} · NOW</span>
        <span>ENDS {fmtClock(end)}</span>
      </div>
    </div>
  );
};

/* ───────── Action rows ───────── */

const ImpactPill: React.FC<{ impact: number; goalColor: string }> = ({ impact, goalColor }) => (
  <span
    className="inline-flex items-center justify-center font-mono text-[12px] font-medium tabular-nums"
    style={{
      padding: "3px 10px",
      borderRadius: 4,
      width: 40,
      textAlign: "center",
      boxSizing: "border-box",
      // Tinted background derived from goal color (low alpha against surface)
      background: `color-mix(in srgb, ${goalColor} 15%, transparent)`,
      color: goalColor,
    }}
  >
    +{impact}
  </span>
);

const AvailableActionRow: React.FC<{
  action: Action;
  goalColor: string;
  goalTitle?: string;
  projectTitle?: string;
  selected: boolean;
  onToggle: () => void;
}> = ({ action, goalColor, goalTitle, projectTitle, selected, onToggle }) => {
  const impact = action.impact ?? 0;
  return (
    <div
      onClick={onToggle}
      className="relative flex items-stretch cursor-pointer transition-colors hover:bg-surface-hover border-b border-border-subtle"
      style={{ minHeight: 56, opacity: selected ? 0.5 : 1 }}
    >
      <span
        className="absolute left-0 top-0 bottom-0"
        style={{ background: goalColor, width: 3 }}
      />
      <div className="flex flex-col gap-1 py-3 pr-4 w-full min-w-0" style={{ paddingLeft: 19 }}>
        {/* Top line */}
        <div className="flex items-center justify-between gap-3 min-w-0">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <span
              className="inline-flex items-center justify-center shrink-0 rounded-[2px] border"
              style={{
                width: 16,
                height: 16,
                borderColor: selected ? "hsl(var(--accent))" : "hsl(var(--text-tertiary))",
                background: selected ? "hsl(var(--accent))" : "transparent",
                color: "hsl(var(--surface-base))",
                fontSize: 11,
                lineHeight: 1,
              }}
            >
              {selected ? "✓" : ""}
            </span>
            <span className="text-[15px] font-medium text-text-primary truncate">
              {action.title}
            </span>
          </div>
          <div className="shrink-0 flex items-center gap-2">
            {selected ? (
              <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-text-tertiary">
                Already added
              </span>
            ) : impact > 0 ? (
              <ImpactPill impact={impact} goalColor={goalColor} />
            ) : null}
            <TimePill minutes={action.timeEstimateMinutes} />
          </div>
        </div>
        {/* Bottom line */}
        {(goalTitle || projectTitle) && (
          <div className="flex items-center font-mono text-[12px] tabular-nums text-text-secondary truncate">
            <span
              className="inline-block w-1.5 h-1.5 rounded-full mr-1.5 shrink-0"
              style={{ background: goalColor }}
            />
            <span className="truncate">
              {goalTitle && <span>{goalTitle}</span>}
              {goalTitle && projectTitle && (
                <span className="mx-1.5 text-text-tertiary">·</span>
              )}
              {projectTitle && <span>{projectTitle}</span>}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

const SelectedRow: React.FC<{
  index: number;
  action: Action;
  goalColor: string;
  goalTitle?: string;
  projectTitle?: string;
  onRemove: () => void;
  draggable: boolean;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: () => void;
  isDragging: boolean;
}> = ({
  index,
  action,
  goalColor,
  goalTitle,
  projectTitle,
  onRemove,
  draggable,
  onDragStart,
  onDragOver,
  onDrop,
  isDragging,
}) => {
  const impact = action.impact ?? 0;
  return (
    <div
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className="group relative flex items-stretch transition-colors hover:bg-surface-hover border-b border-border-subtle"
      style={{ minHeight: 56, opacity: isDragging ? 0.4 : 1 }}
    >
      <span
        className="absolute left-0 top-0 bottom-0"
        style={{ background: goalColor, width: 3 }}
      />
      <div className="flex flex-col gap-1 py-3 pr-3 w-full min-w-0" style={{ paddingLeft: 15 }}>
        {/* Top line */}
        <div className="flex items-center justify-between gap-3 min-w-0">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-tertiary shrink-0 w-5">
              {index + 1}.
            </span>
            <span className="text-[15px] font-medium text-text-primary truncate">
              {action.title}
            </span>
          </div>
          <div className="shrink-0 flex items-center gap-2">
            {impact > 0 && <ImpactPill impact={impact} goalColor={goalColor} />}
            <TimePill minutes={action.timeEstimateMinutes} />
            <span className="text-text-tertiary cursor-grab active:cursor-grabbing">
              <GripVertical size={14} />
            </span>
            <button
              onClick={onRemove}
              className="w-6 h-6 inline-flex items-center justify-center rounded-[3px] text-text-tertiary opacity-0 group-hover:opacity-100 hover:text-text-primary hover:bg-surface-elevated transition-all"
              aria-label="Remove"
            >
              <XIcon size={14} />
            </button>
          </div>
        </div>
        {/* Bottom line */}
        {(goalTitle || projectTitle) && (
          <div className="flex items-center font-mono text-[12px] tabular-nums text-text-secondary truncate" style={{ paddingLeft: 28 }}>
            <span
              className="inline-block w-1.5 h-1.5 rounded-full mr-1.5 shrink-0"
              style={{ background: goalColor }}
            />
            <span className="truncate">
              {goalTitle && <span>{goalTitle}</span>}
              {goalTitle && projectTitle && (
                <span className="mx-1.5 text-text-tertiary">·</span>
              )}
              {projectTitle && <span>{projectTitle}</span>}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

/* ───────── Page ───────── */

const SessionBuilder: React.FC = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const goals = useStore((s) => s.goals);
  const projects = useStore((s) => s.projects);
  const actions = useStore((s) => s.actions);
  const dayEntries = useStore((s) => s.dayEntries);
  const settings = useStore((s) => s.settings);
  const createDraftSession = useStore((s) => s.createDraftSession);
  const sessions = useStore((s) => s.sessions);

  const [mode, setMode] = useState<SessionMode | null>(null);
  const [totalSession, setTotalSession] = useState<number | "">(60);
  const [breaksOn, setBreaksOn] = useState<boolean>(true);
  const [work, setWork] = useState<number | "">(25);
  const [brk, setBrk] = useState<number | "">(5);

  const [goalFilter, setGoalFilter] = useState<string>("all");
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [todayOnly, setTodayOnly] = useState(false);

  const [selectedIds, setSelectedIds] = useState<ID[]>([]);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const activeGoals = useMemo(() => goals.filter((g) => g.status === "active"), [goals]);
  const activeGoalIds = useMemo(() => new Set(activeGoals.map((g) => g.id)), [activeGoals]);

  const today = new Date().toISOString().slice(0, 10);
  const todayEntry = dayEntries.find((d) => d.date === today);
  const planActive = settings.layers.planAndReview && todayEntry?.isPlanned;
  const todayPlannedIds = new Set(todayEntry?.plannedActionIds ?? []);

  const pickPreset = (p: ModePreset) => {
    setMode(p.key);
    setTotalSession(p.total);
    setBreaksOn(p.breaksOn);
    if (p.breaksOn) {
      setWork(p.work);
      setBrk(p.brk);
    }
  };

  /* Available actions */
  const available = useMemo(() => {
    return actions
      .filter((a) => (a.status === "backlog" || a.status === "planned") && activeGoalIds.has(a.goalId))
      .filter((a) => {
        if (a.projectId) {
          const p = projects.find((x) => x.id === a.projectId);
          if (!p || p.status !== "active") return false;
        }
        return true;
      })
      .filter((a) => (goalFilter === "all" ? true : a.goalId === goalFilter))
      .filter((a) => {
        if (projectFilter === "all") return true;
        if (projectFilter === "__none") return a.projectId == null;
        return a.projectId === projectFilter;
      })
      .filter((a) => (todayOnly ? todayPlannedIds.has(a.id) : true));
  }, [actions, activeGoalIds, goalFilter, projectFilter, todayOnly, projects, todayPlannedIds]);

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const toggle = (id: ID) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const remove = (id: ID) => setSelectedIds((prev) => prev.filter((x) => x !== id));

  const handleDrop = (toIdx: number) => {
    if (dragIndex == null || dragIndex === toIdx) {
      setDragIndex(null);
      return;
    }
    setSelectedIds((prev) => {
      const next = prev.slice();
      const [moved] = next.splice(dragIndex, 1);
      next.splice(toIdx, 0, moved);
      return next;
    });
    setDragIndex(null);
  };

  /* Totals — derived from totalSession + breaks model */
  const totalN = typeof totalSession === "number" ? totalSession : 0;
  const workN = breaksOn ? (typeof work === "number" ? work : 0) : totalN;
  const brkN = breaksOn ? (typeof brk === "number" ? brk : 0) : 0;
  // cyclesPlanned = number of work blocks needed to cover totalSession.
  const cyclesN = breaksOn && workN + brkN > 0
    ? Math.max(1, Math.ceil(totalN / (workN + brkN)))
    : 1;
  const focusTotal = workN * cyclesN;
  const breakTotal = brkN * Math.max(0, cyclesN - 1);
  const grandTotal = focusTotal + breakTotal;

  /* Selected stats */
  const selectedActions = selectedIds
    .map((id) => actions.find((a) => a.id === id))
    .filter((a): a is Action => !!a);
  const estimateSum = selectedActions.reduce((s, a) => s + (a.timeEstimateMinutes ?? 0), 0);
  const diff = estimateSum - focusTotal;
  let matchHint: { text: string; color: string } | null = null;
  if (estimateSum > 0 && focusTotal > 0) {
    if (Math.abs(diff) <= 5) matchHint = { text: "Well-matched", color: "hsl(var(--text-secondary))" };
    else if (diff < 0) matchHint = { text: `+${-diff}min buffer`, color: "hsl(var(--state-active))" };
    else matchHint = { text: `+${diff}min over`, color: "hsl(var(--text-warning))" };
  }

  /* Filters */
  const goalOpts: FilterOption<string>[] = [
    { value: "all", label: "All" },
    ...activeGoals.map((g) => ({ value: g.id, label: g.title, dot: `hsl(var(--${g.color}))` })),
  ];
  const projectOpts: FilterOption<string>[] = useMemo(() => {
    const scope =
      goalFilter === "all"
        ? projects.filter((p) => p.status === "active" && activeGoalIds.has(p.goalId))
        : projects.filter((p) => p.status === "active" && p.goalId === goalFilter);
    return [
      { value: "all", label: "All" },
      { value: "__none", label: "Goal-level (no project)" },
      ...scope.map((p) => ({ value: p.id, label: p.title })),
    ];
  }, [projects, goalFilter, activeGoalIds]);

  /* Validation */
  const validNums =
    typeof totalSession === "number" && totalSession >= 15 &&
    (!breaksOn || (typeof work === "number" && work >= 5 && typeof brk === "number" && brk >= 1));
  const hasActiveSession = sessions.some((s) => s.status === "in_progress");
  const canStart = selectedIds.length > 0 && validNums && !hasActiveSession;

  const handleStart = () => {
    if (!canStart || typeof totalSession !== "number") return;
    const inferredMode: SessionMode = mode ?? (!breaksOn ? "continuous" : "custom");
    const wd = breaksOn ? (typeof work === "number" ? work : 25) : totalSession;
    const bd = breaksOn ? (typeof brk === "number" ? brk : 5) : 0;
    const result = createDraftSession({
      mode: inferredMode,
      workDuration: wd,
      breakDuration: bd,
      cyclesPlanned: cyclesN,
      plannedActionIds: selectedIds,
    });
    if (!result.ok) {
      toast.error("A session is already in progress");
      return;
    }
    toast.success("Session started");
    navigate("/sessions/active");
  };

  /* ─── Picker panes ─── */
  const LeftPane = (
    <div className="rounded-[6px] border border-border-subtle bg-surface-raised">
      <div className="flex items-center gap-2 flex-wrap px-3 pt-3 pb-4 border-b border-border-subtle">
        <FilterDropdown
          label="GOAL"
          value={goalFilter}
          defaultValue="all"
          options={goalOpts}
          onChange={(v) => {
            setGoalFilter(v);
            setProjectFilter("all");
          }}
        />
        <FilterDropdown
          label="PROJECT"
          value={projectFilter}
          defaultValue="all"
          options={projectOpts}
          onChange={setProjectFilter}
        />
        {planActive && (
          <button
            type="button"
            onClick={() => setTodayOnly((v) => !v)}
            className="font-mono text-[10px] uppercase tracking-[0.06em] rounded-[4px] border transition-colors"
            style={{
              padding: "6px 10px",
              borderColor: todayOnly ? "hsl(var(--accent))" : "hsl(var(--border-subtle))",
              color: todayOnly ? "hsl(var(--accent))" : "hsl(var(--text-tertiary))",
              background: todayOnly ? "hsl(var(--surface-hover))" : "transparent",
            }}
          >
            TODAY'S PLANNED · {(todayEntry?.plannedActionIds ?? []).length}
          </button>
        )}
      </div>
      <div className={`${isMobile ? "" : "max-h-[480px] overflow-y-auto"}`}>
        {available.length === 0 ? (
          <div className="p-6 text-[13px] text-text-tertiary text-center">
            No actions available. Create some first or pick a different goal/project filter.
          </div>
        ) : (
          available.map((a) => {
            const goal = goals.find((g) => g.id === a.goalId);
            const project = a.projectId ? projects.find((p) => p.id === a.projectId) : undefined;
            return (
              <AvailableActionRow
                key={a.id}
                action={a}
                goalColor={goal ? `hsl(var(--${goal.color}))` : "hsl(var(--border-default))"}
                goalTitle={goal?.title}
                projectTitle={project?.title}
                selected={selectedSet.has(a.id)}
                onToggle={() => toggle(a.id)}
              />
            );
          })
        )}
      </div>
    </div>
  );

  const RightPane = (
    <div className="rounded-[6px] border border-border-subtle bg-surface-raised flex flex-col">
      <div className="p-3 border-b border-border-subtle font-mono text-[11px] uppercase tracking-[0.06em] text-text-secondary">
        SELECTED · {selectedIds.length}
      </div>
      <div className={`flex-1 ${isMobile ? "" : "max-h-[480px] overflow-y-auto"}`}>
        {selectedIds.length === 0 ? (
          <div
            className="m-3 rounded-[4px] p-6 text-center text-[13px] text-text-tertiary"
            style={{ border: "1px dashed hsl(var(--border-default))" }}
          >
            No actions selected yet. Pick from the list.
          </div>
        ) : (
          selectedIds.map((id, idx) => {
            const a = actions.find((x) => x.id === id);
            if (!a) return null;
            const goal = goals.find((g) => g.id === a.goalId);
            const project = a.projectId ? projects.find((p) => p.id === a.projectId) : undefined;
            return (
              <SelectedRow
                key={id}
                index={idx}
                action={a}
                goalColor={goal ? `hsl(var(--${goal.color}))` : "hsl(var(--border-default))"}
                goalTitle={goal?.title}
                projectTitle={project?.title}
                onRemove={() => remove(id)}
                draggable
                onDragStart={() => setDragIndex(idx)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop(idx)}
                isDragging={dragIndex === idx}
              />
            );
          })
        )}
      </div>
      {selectedIds.length > 0 && (
        <div className="p-3 border-t border-border-subtle font-mono text-[12px] text-text-secondary flex flex-wrap items-center gap-x-3 gap-y-1">
          <span>Estimated time: {estimateSum}min</span>
          <span>·</span>
          <span>Session work: {focusTotal}min</span>
          {matchHint && (
            <>
              <span>·</span>
              <span style={{ color: matchHint.color }}>{matchHint.text}</span>
            </>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-text-primary">
      <AppSidebar />
      <main className="app-main page-medium">
        <div className="max-w-[1024px] mx-auto px-8 py-8 pb-32">
          {/* Header */}
          <div className="pb-4 border-b border-border-subtle">
            <Link
              to="/sessions"
              className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-tertiary hover:text-text-secondary transition-colors"
            >
              ← Sessions
            </Link>
            <h1 className="mt-2 text-[28px] font-medium tracking-tight">New Session</h1>
          </div>

          {/* MODE */}
          <section className="mt-8">
            <div className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-tertiary mb-3">
              MODE
            </div>
            <div className={`flex ${isMobile ? "flex-col" : "flex-row"} gap-3`}>
              {PRESETS.map((p) => (
                <ModeCard
                  key={p.key}
                  preset={p}
                  selected={mode === p.key}
                  onClick={() => pickPreset(p)}
                />
              ))}
            </div>
          </section>

          {/* DURATION */}
          <section className="mt-8">
            <div className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-tertiary mb-3">
              DURATION
            </div>
            <div
              className="rounded-[8px] border border-border-subtle bg-surface-raised"
              style={{ padding: isMobile ? 24 : 32 }}
            >
              {/* Total session — primary stepper */}
              <div className="flex flex-col items-center">
                <div className="font-mono text-[10px] uppercase text-text-tertiary mb-3" style={{ letterSpacing: "0.08em" }}>
                  TOTAL SESSION
                </div>
                <StepperField
                  value={totalSession}
                  onChange={setTotalSession}
                  min={15}
                  max={240}
                  step={5}
                  suffix="min"
                  size="xl"
                  isMobile={isMobile}
                  ariaLabel="Total session"
                />
              </div>

              {/* Breaks toggle + frequency + length */}
              <div className={`mt-8 flex ${isMobile ? "flex-col items-start gap-4" : "flex-row items-center flex-wrap gap-x-6 gap-y-3"}`}>
                <label className="flex items-center gap-3 cursor-pointer">
                  <Switch checked={breaksOn} onCheckedChange={setBreaksOn} aria-label="Toggle breaks" />
                  <span className="text-[14px] text-text-primary">Breaks</span>
                </label>

                {breaksOn && (
                  <>
                    <div className="flex items-center gap-3">
                      <span className="text-[14px] text-text-secondary">every</span>
                      <StepperField
                        value={work}
                        onChange={setWork}
                        min={5}
                        max={60}
                        step={5}
                        suffix="min"
                        size="md"
                        ariaLabel="Frequency between breaks"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[14px] text-text-secondary">break length</span>
                      <StepperField
                        value={brk}
                        onChange={setBrk}
                        min={1}
                        max={15}
                        step={1}
                        suffix="min"
                        size="sm"
                        ariaLabel="Break length"
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Wall-clock visualization bar */}
              <SessionTimelineBar work={workN} brk={brkN} cycles={cyclesN} breaksOn={breaksOn} />

              {/* Derived stats — three pills */}
              <div className="mt-5 flex flex-wrap items-baseline gap-x-6 gap-y-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-[14px] tabular-nums text-text-primary">
                    {cyclesN} {cyclesN === 1 ? "session" : "sessions"}
                  </span>
                  <span className="font-mono text-[12px] text-text-secondary">of focus</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-[14px] tabular-nums text-text-primary">{focusTotal} min</span>
                  <span className="font-mono text-[12px] text-text-secondary">focused</span>
                </div>
                {breaksOn && breakTotal > 0 && (
                  <div className="flex items-baseline gap-2">
                    <span className="text-[14px] tabular-nums text-text-primary">{breakTotal} min</span>
                    <span className="font-mono text-[12px] text-text-secondary">breaks</span>
                  </div>
                )}
              </div>
            </div>
          </section>


          {/* ACTIONS */}
          <section className="mt-8">
            <div className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-tertiary mb-1">
              ACTIONS · {selectedIds.length} SELECTED
            </div>
            <div className="text-[13px] text-text-secondary mb-3">
              Pick what you'll work on. The session will guide you through them in order.
            </div>
            {isMobile ? (
              <div className="flex flex-col gap-4">
                {LeftPane}
                {RightPane}
              </div>
            ) : (
              <div className="grid gap-4" style={{ gridTemplateColumns: "60% 40%" }}>
                {LeftPane}
                {RightPane}
              </div>
            )}
          </section>
        </div>

        {/* Sticky action bar */}
        <div
          className="fixed bottom-0 left-[220px] right-0 border-t border-border-subtle"
          style={{ background: "hsl(var(--surface-raised))" }}
        >
          <div className="max-w-[1024px] mx-auto px-8 py-4 flex items-center justify-between">
            <Link
              to="/sessions"
              className="text-[13px] text-text-tertiary hover:text-text-secondary transition-colors"
            >
              Cancel
            </Link>
            <button
              type="button"
              onClick={handleStart}
              disabled={!canStart}
              title={
                hasActiveSession
                  ? "A session is already in progress"
                  : selectedIds.length === 0
                  ? "Select at least one action"
                  : ""
              }
              className="text-[15px] font-medium rounded-[4px] transition-colors disabled:cursor-not-allowed"
              style={{
                padding: "12px 32px",
                background: canStart ? "hsl(var(--accent))" : "hsl(var(--surface-hover))",
                color: canStart ? "hsl(var(--accent-foreground))" : "hsl(var(--text-tertiary))",
              }}
            >
              Start session
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SessionBuilder;
