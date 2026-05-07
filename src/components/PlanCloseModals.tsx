// Plan today / Close day / Combined Close-yesterday-and-Plan-today modals.
//
// All three render through a shared <ModalShell> (centered desktop dialog,
// bottom sheet on mobile). Forms are uncontrolled-ish: local state, submit
// commits to the store via startDayPlan / closeDay.

import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X, Zap, Leaf, Sun, Thermometer, GripVertical, Star, type LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { useStore, ritualMultiplier } from "@/store/useStore";
import type { Action, DayType, ID, Ritual } from "@/types";
import { formatTime as formatTimeMin } from "@/lib/format";

/* ───────── helpers ───────── */
const todayISO = () => new Date().toISOString().slice(0, 10);
const yesterdayISO = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
};

const formatLong = (iso: string) =>
  new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
const formatShort = (iso: string) =>
  new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

const DAY_TYPE_OPTIONS: { value: DayType; label: string; Icon: LucideIcon }[] = [
  { value: "execution", label: "Execution", Icon: Zap },
  { value: "recovery", label: "Recovery", Icon: Leaf },
  { value: "day-off", label: "Day Off", Icon: Sun },
  { value: "sick", label: "Sick", Icon: Thermometer },
];

/* ───────── primitives ───────── */
const SectionHead: React.FC<{ children: React.ReactNode; sub?: string; meta?: React.ReactNode }> = ({
  children,
  sub,
  meta,
}) => (
  <div className="mb-2 flex items-baseline justify-between gap-3">
    <div>
      <div className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-tertiary">
        {children}
      </div>
      {sub && <div className="text-[13px] text-text-secondary mt-1">{sub}</div>}
    </div>
    {meta && (
      <div className="font-mono text-[11px] text-text-tertiary tabular-nums">{meta}</div>
    )}
  </div>
);

const PrimaryButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({
  className = "",
  ...rest
}) => (
  <button
    type="button"
    {...rest}
    className={`px-5 py-2 rounded-[4px] bg-[hsl(var(--accent))] text-white text-[13px] font-medium hover:brightness-110 transition disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
  />
);

const LinkButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({
  className = "",
  ...rest
}) => (
  <button
    type="button"
    {...rest}
    className={`text-[13px] text-text-secondary hover:text-text-primary transition ${className}`}
  />
);

/* ───────── shell ───────── */
const ModalShell: React.FC<{
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  width?: number;
  footer: React.ReactNode;
  children: React.ReactNode;
}> = ({ open, onClose, title, subtitle, footer, children, width = 560 }) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-end md:items-center justify-center">
      <div
        className="absolute inset-0"
        style={{ background: "rgba(0,0,0,0.5)" }}
        onClick={onClose}
      />
      <div
        className="relative w-full max-h-[90vh] md:max-h-[85vh] bg-surface-elevated border border-border-subtle md:rounded-[8px] rounded-t-[12px] flex flex-col shadow-2xl animate-in slide-in-from-bottom-4 md:slide-in-from-bottom-0 md:fade-in"
        style={{ maxWidth: width }}
      >
        <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-border-subtle shrink-0">
          <div>
            <h2 className="text-[20px] font-medium text-text-primary leading-tight">{title}</h2>
            {subtitle && (
              <div className="text-[14px] text-text-secondary mt-0.5">{subtitle}</div>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-text-tertiary hover:text-text-primary transition p-1 -m-1"
          >
            <X size={18} />
          </button>
        </div>
        <div className="px-6 py-5 overflow-y-auto overflow-x-hidden flex-1 min-w-0">{children}</div>
        <div className="px-6 py-4 border-t border-border-subtle flex items-center justify-between gap-3 shrink-0">
          {footer}
        </div>
      </div>
    </div>,
    document.body,
  );
};

/* ───────── ritual schedule helpers ───────── */
function ritualDueOn(r: Ritual, iso: string): boolean {
  const d = new Date(iso + "T00:00:00");
  const dow = d.getDay();
  const dom = d.getDate();
  switch (r.schedule) {
    case "daily":
      return true;
    case "weekdays":
      return dow >= 1 && dow <= 5;
    case "weekly":
      return r.scheduleConfig?.weekday === dow;
    case "monthly":
      return r.scheduleConfig?.monthDay === dom;
    case "custom":
      return !!r.scheduleConfig?.customDays?.includes(dow);
    default:
      return false;
  }
}

/* ───────── suggestion logic (Heavy Lift / Quick Moves) ───────── */
function quantile(vals: number[], q: number): number {
  if (vals.length === 0) return 0;
  const sorted = [...vals].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.floor(q * sorted.length));
  return sorted[idx];
}

function effortFor(a: Action): number {
  if (a.timeEstimateMinutes != null) return Math.min(10, Math.ceil(a.timeEstimateMinutes / 30));
  return 5;
}

function pickHeavyLift(pool: Action[]): Action[] {
  if (pool.length === 0) return [];
  const impactP75 = quantile(pool.map((a) => a.impact ?? 0), 0.75);
  const effortP75 = quantile(pool.map(effortFor), 0.75);
  return pool
    .filter((a) => (a.impact ?? 0) >= impactP75 && effortFor(a) >= effortP75)
    .sort((a, b) => (b.impact ?? 0) - (a.impact ?? 0))
    .slice(0, 1);
}

function pickQuickMoves(pool: Action[]): Action[] {
  if (pool.length === 0) return [];
  const impactMedian = quantile(pool.map((a) => a.impact ?? 0), 0.5);
  return pool
    .filter((a) => {
      const imp = a.impact ?? 0;
      const tOk = (a.timeEstimateMinutes ?? 9999) <= 60;
      return imp >= impactMedian && tOk;
    })
    .sort((a, b) => (b.impact ?? 0) - (a.impact ?? 0) || (a.timeEstimateMinutes ?? 0) - (b.timeEstimateMinutes ?? 0))
    .slice(0, 3);
}

/* ═════════════ Plan Today form ═════════════ */

interface PlanFormState {
  dayType?: DayType;
  selectedActionIds: ID[]; // ordered
  keptRitualIds: Set<ID>;
  skippedRitualIds: Set<ID>;
  mainTaskId?: ID;
  intent: string;
}

const PlanForm: React.FC<{
  date: string;
  state: PlanFormState;
  setState: React.Dispatch<React.SetStateAction<PlanFormState>>;
}> = ({ date, state, setState }) => {
  const actions = useStore((s) => s.actions);
  const rituals = useStore((s) => s.rituals);
  const goals = useStore((s) => s.goals);
  const projects = useStore((s) => s.projects);
  const createAction = useStore((s) => s.createAction);

  // Inline-add state
  const firstActiveGoal = goals.find((g) => g.status === "active");
  const firstProjectForGoal = (gid?: ID) =>
    gid ? projects.find((p) => p.status === "active" && p.goalId === gid) : undefined;
  const initialGoal = firstActiveGoal?.id;
  const initialProject = firstProjectForGoal(initialGoal)?.id;
  const [quickTitle, setQuickTitle] = useState("");
  const [quickGoalId, setQuickGoalId] = useState<ID | undefined>(initialGoal);
  const [quickProjectId, setQuickProjectId] = useState<ID | undefined>(initialProject);

  const dueRituals = useMemo(
    () => rituals.filter((r) => r.status === "active" && ritualDueOn(r, date)),
    [rituals, date],
  );

  const goalById = (id: ID) => goals.find((g) => g.id === id);
  const projectById = (id: ID | null) => (id ? projects.find((p) => p.id === id) : undefined);

  // Filters for left pane
  const [filterGoal, setFilterGoal] = useState<string>("all");
  const [filterProject, setFilterProject] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "backlog" | "planned">("all");

  const selectedSet = useMemo(() => new Set(state.selectedActionIds), [state.selectedActionIds]);

  const eligible = useMemo(
    () =>
      actions.filter(
        (a) => a.status === "backlog" || a.status === "planned",
      ),
    [actions],
  );

  const preScheduled = useMemo(
    () => eligible.filter((a) => a.scheduledDate === date),
    [eligible, date],
  );

  const filteredAvailable = useMemo(() => {
    return eligible
      .filter((a) => a.scheduledDate !== date) // pre-scheduled shown separately
      .filter((a) => (filterGoal === "all" ? true : a.goalId === filterGoal))
      .filter((a) => (filterProject === "all" ? true : a.projectId === filterProject))
      .filter((a) => (filterStatus === "all" ? true : a.status === filterStatus))
      .sort((a, b) => (b.impact ?? 0) - (a.impact ?? 0));
  }, [eligible, date, filterGoal, filterProject, filterStatus]);

  const suggestionPool = useMemo(
    () =>
      eligible.filter((a) => {
        if (selectedSet.has(a.id)) return false;
        const g = goals.find((x) => x.id === a.goalId);
        return g?.status === "active";
      }),
    [eligible, selectedSet, goals],
  );
  const heavySuggestions = useMemo(() => pickHeavyLift(suggestionPool), [suggestionPool]);
  const quickSuggestions = useMemo(() => pickQuickMoves(suggestionPool), [suggestionPool]);

  const toggleAction = (id: ID) =>
    setState((s) => {
      const has = s.selectedActionIds.includes(id);
      const next = has
        ? s.selectedActionIds.filter((x) => x !== id)
        : [...s.selectedActionIds, id];
      const mainTaskId = next.includes(s.mainTaskId ?? "") ? s.mainTaskId : undefined;
      return { ...s, selectedActionIds: next, mainTaskId };
    });

  const addMany = (ids: ID[]) =>
    setState((s) => {
      const next = [...s.selectedActionIds];
      for (const id of ids) if (!next.includes(id)) next.push(id);
      return { ...s, selectedActionIds: next };
    });

  const removeAction = (id: ID) =>
    setState((s) => ({
      ...s,
      selectedActionIds: s.selectedActionIds.filter((x) => x !== id),
      mainTaskId: s.mainTaskId === id ? undefined : s.mainTaskId,
    }));

  const moveSelected = (from: number, to: number) =>
    setState((s) => {
      if (from === to || from < 0 || to < 0 || from >= s.selectedActionIds.length || to >= s.selectedActionIds.length)
        return s;
      const next = [...s.selectedActionIds];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return { ...s, selectedActionIds: next };
    });

  const toggleRitualSkip = (id: ID, skip: boolean) =>
    setState((s) => {
      const kept = new Set(s.keptRitualIds);
      const skipped = new Set(s.skippedRitualIds);
      if (skip) {
        kept.delete(id);
        skipped.add(id);
      } else {
        skipped.delete(id);
        kept.add(id);
      }
      return { ...s, keptRitualIds: kept, skippedRitualIds: skipped };
    });

  const goalColor = (goalId: ID) => {
    const g = goalById(goalId);
    return g ? `hsl(var(--${g.color}))` : "hsl(var(--text-tertiary))";
  };

  const renderAvailableRow = (a: Action) => {
    const g = goalById(a.goalId);
    const p = projectById(a.projectId);
    const checked = selectedSet.has(a.id);
    return (
      <button
        key={a.id}
        type="button"
        onClick={() => toggleAction(a.id)}
        className={`relative w-full flex items-center gap-2 pr-2 hover:bg-surface-hover transition-colors text-left ${checked ? "opacity-50" : ""}`}
        style={{ minHeight: 40 }}
      >
        <span
          className="absolute left-0 top-0 bottom-0"
          style={{ background: goalColor(a.goalId), width: 3 }}
        />
        <span style={{ paddingLeft: 11 }} />
        <span
          className="inline-flex items-center justify-center rounded-[2px] border shrink-0"
          style={{
            width: 14,
            height: 14,
            background: checked ? goalColor(a.goalId) : "transparent",
            borderColor: checked ? goalColor(a.goalId) : "hsl(var(--text-tertiary))",
            color: "hsl(var(--surface-base))",
            fontSize: 10,
            lineHeight: 1,
          }}
        >
          {checked ? "✓" : ""}
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[13px] text-text-primary truncate">{a.title}</div>
          <div className="font-mono text-[11px] text-text-tertiary truncate">
            {g?.title ?? ""}
            {p ? ` · ${p.title}` : ""}
          </div>
        </div>
        <div className="font-mono text-[11px] text-text-tertiary tabular-nums shrink-0">
          {a.impact ? `I${a.impact}` : ""}
          {a.timeEstimateMinutes ? ` · ${formatTimeMin(a.timeEstimateMinutes)}` : ""}
        </div>
      </button>
    );
  };

  const dragIdx = useRef<number | null>(null);
  const handleDragStart = (i: number) => () => {
    dragIdx.current = i;
  };
  const handleDragOver = (i: number) => (e: React.DragEvent) => {
    e.preventDefault();
    if (dragIdx.current !== null && dragIdx.current !== i) {
      moveSelected(dragIdx.current, i);
      dragIdx.current = i;
    }
  };
  const handleDragEnd = () => {
    dragIdx.current = null;
  };

  const renderSelectedRow = (id: ID, i: number) => {
    const a = actions.find((x) => x.id === id);
    if (!a) return null;
    const g = goalById(a.goalId);
    return (
      <div
        key={id}
        draggable
        onDragStart={handleDragStart(i)}
        onDragOver={handleDragOver(i)}
        onDragEnd={handleDragEnd}
        className="group relative flex items-center gap-2 pr-2 bg-surface-raised border border-border-subtle rounded-[3px] hover:bg-surface-hover transition-colors"
        style={{ minHeight: 38 }}
      >
        <span
          className="absolute left-0 top-0 bottom-0"
          style={{ background: goalColor(a.goalId), width: 3 }}
        />
        <span style={{ paddingLeft: 8 }} />
        <GripVertical size={12} className="text-text-tertiary cursor-grab shrink-0" />
        <span className="font-mono text-[11px] text-text-tertiary tabular-nums w-4 shrink-0">
          {i + 1}.
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[13px] text-text-primary truncate">{a.title}</div>
          <div className="font-mono text-[11px] text-text-tertiary truncate">
            {g?.title ?? ""}
            {a.timeEstimateMinutes ? ` · ${formatTimeMin(a.timeEstimateMinutes)}` : ""}
          </div>
        </div>
        <button
          type="button"
          onClick={() => removeAction(id)}
          aria-label="Remove"
          className="text-text-tertiary hover:text-text-primary text-[14px] px-1 shrink-0"
        >
          ×
        </button>
      </div>
    );
  };

  const selectedActions = state.selectedActionIds
    .map((id) => actions.find((a) => a.id === id))
    .filter(Boolean) as Action[];

  const totalEstMin = selectedActions.reduce(
    (s, a) => s + (a.timeEstimateMinutes ?? 0),
    0,
  );

  const heavyDescription =
    heavySuggestions.length === 0
      ? "No heavy-lift candidates available."
      : `${heavySuggestions.length} high-impact action${heavySuggestions.length > 1 ? "s" : ""}` +
        (heavySuggestions[0]?.timeEstimateMinutes
          ? ` (${formatTimeMin(heavySuggestions.reduce((s, a) => s + (a.timeEstimateMinutes ?? 0), 0))})`
          : "");
  const quickDescription =
    quickSuggestions.length === 0
      ? "No quick wins available."
      : `${quickSuggestions.length} quick win${quickSuggestions.length > 1 ? "s" : ""}` +
        (quickSuggestions.some((a) => a.timeEstimateMinutes)
          ? ` (~${formatTimeMin(quickSuggestions.reduce((s, a) => s + (a.timeEstimateMinutes ?? 0), 0))} total)`
          : "");

  const dayTypeChosen = !!state.dayType;

  return (
    <div className="space-y-7">
      {/* DAY TYPE */}
      <section>
        <SectionHead>DAY TYPE</SectionHead>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {DAY_TYPE_OPTIONS.map(({ value, label, Icon }) => {
            const active = state.dayType === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setState((s) => ({ ...s, dayType: value }))}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-[6px] transition-colors ${
                  active
                    ? "bg-surface-hover border-2 border-[hsl(var(--accent))]"
                    : "bg-surface-raised border border-border-subtle hover:border-border-default"
                }`}
                style={active ? { padding: "calc(0.625rem - 1px) calc(0.75rem - 1px)" } : undefined}
              >
                <Icon size={14} className={active ? "text-[hsl(var(--accent))]" : "text-text-secondary"} />
                <span className="text-[13px] text-text-primary">{label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {dayTypeChosen && (
        <>
          {/* ACTIONS */}
          <section>
            <SectionHead
              sub="Pick what you'll work on today."
              meta={`${state.selectedActionIds.length} selected`}
            >
              ACTIONS
            </SectionHead>

            <div className="flex flex-col md:flex-row gap-3 min-w-0">
              {/* LEFT: available */}
              <div className="border border-border-subtle rounded-[6px] bg-surface-base flex flex-col min-h-[280px] flex-1 min-w-0 md:basis-[60%]">
                {/* Quick Start cards */}
                <div className="px-3 pt-3 pb-2 border-b border-border-subtle bg-surface-elevated rounded-t-[6px] min-w-0">
                  <div className="font-mono text-[10px] uppercase tracking-[0.06em] text-text-tertiary mb-2">
                    QUICK START
                  </div>
                  <div className="flex items-stretch gap-3 min-w-0">
                    {(() => {
                      const heavy = heavySuggestions[0];
                      const disabled = !heavy;
                      const totalQuickMin = quickSuggestions.reduce(
                        (s, a) => s + (a.timeEstimateMinutes ?? 0),
                        0,
                      );
                      const qDisabled = quickSuggestions.length === 0;
                      return (
                        <>
                          <button
                            type="button"
                            disabled={disabled}
                            onClick={() => {
                              if (!heavy) return;
                              addMany([heavy.id]);
                              toast.success(`Heavy Lift added: ${heavy.title}`);
                            }}
                            className={`flex-1 min-w-0 text-left rounded-[6px] border px-4 py-3 transition-colors ${
                              disabled
                                ? "bg-surface-elevated border-border-subtle opacity-60 cursor-not-allowed"
                                : "bg-surface-elevated border-border-subtle hover:bg-surface-hover hover:border-[hsl(var(--accent))]"
                            }`}
                            style={{ minHeight: 68 }}
                          >
                            <div className="font-mono text-[11px] uppercase tracking-[0.06em] font-medium text-[hsl(var(--accent))]">
                              + HEAVY LIFT
                            </div>
                            {heavy ? (
                              <>
                                <div className="text-[13px] text-text-primary truncate mt-1">
                                  {heavy.title}
                                </div>
                                <div className="font-mono text-[11px] text-text-secondary tabular-nums mt-0.5">
                                  {heavy.impact ? `I${heavy.impact}` : "—"}
                                  {heavy.timeEstimateMinutes
                                    ? ` · ${formatTimeMin(heavy.timeEstimateMinutes)}`
                                    : ""}
                                </div>
                              </>
                            ) : (
                              <div className="text-[12px] italic text-text-tertiary mt-1">
                                No candidates available
                              </div>
                            )}
                          </button>
                          <button
                            type="button"
                            disabled={qDisabled}
                            onClick={() => {
                              const ids = quickSuggestions.map((a) => a.id);
                              if (ids.length === 0) return;
                              addMany(ids);
                              toast.success(`${ids.length} Quick Move${ids.length > 1 ? "s" : ""} added`);
                            }}
                            className={`flex-1 min-w-0 text-left rounded-[6px] border px-4 py-3 transition-colors ${
                              qDisabled
                                ? "bg-surface-elevated border-border-subtle opacity-60 cursor-not-allowed"
                                : "bg-surface-elevated border-border-subtle hover:bg-surface-hover hover:border-[hsl(var(--accent))]"
                            }`}
                            style={{ minHeight: 68 }}
                          >
                            <div className="font-mono text-[11px] uppercase tracking-[0.06em] font-medium text-[hsl(var(--accent))]">
                              + QUICK MOVES
                            </div>
                            {quickSuggestions.length > 0 ? (
                              <>
                                <div className="text-[13px] text-text-primary truncate mt-1">
                                  {quickSuggestions.length} action{quickSuggestions.length > 1 ? "s" : ""}
                                  {totalQuickMin > 0 ? ` · ~${formatTimeMin(totalQuickMin)}` : ""}
                                </div>
                                <div className="font-mono text-[11px] text-text-secondary mt-0.5">
                                  Top {quickSuggestions.length} easy win{quickSuggestions.length > 1 ? "s" : ""}
                                </div>
                              </>
                            ) : (
                              <div className="text-[12px] italic text-text-tertiary mt-1">
                                No candidates available
                              </div>
                            )}
                          </button>
                        </>
                      );
                    })()}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 p-2 border-b border-border-subtle flex-wrap">
                  <select
                    value={filterGoal}
                    onChange={(e) => setFilterGoal(e.target.value)}
                    className="bg-surface-hover text-[11px] text-text-secondary rounded-[3px] px-1.5 py-1 outline-none border border-transparent focus:border-border-default"
                  >
                    <option value="all">All goals</option>
                    {goals
                      .filter((g) => g.status === "active")
                      .map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.title}
                        </option>
                      ))}
                  </select>
                  <select
                    value={filterProject}
                    onChange={(e) => setFilterProject(e.target.value)}
                    className="bg-surface-hover text-[11px] text-text-secondary rounded-[3px] px-1.5 py-1 outline-none border border-transparent focus:border-border-default"
                  >
                    <option value="all">All projects</option>
                    {projects
                      .filter((p) => p.status === "active")
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.title}
                        </option>
                      ))}
                  </select>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as any)}
                    className="bg-surface-hover text-[11px] text-text-secondary rounded-[3px] px-1.5 py-1 outline-none border border-transparent focus:border-border-default"
                  >
                    <option value="all">All</option>
                    <option value="backlog">Backlog</option>
                    <option value="planned">Planned</option>
                  </select>
                </div>

                <div className="flex-1 overflow-y-auto max-h-[360px]">
                  {preScheduled.length > 0 && (
                    <>
                      <div className="px-2 py-1.5 font-mono text-[10px] uppercase tracking-[0.06em] text-text-tertiary border-b border-border-subtle bg-surface-elevated">
                        Already scheduled · {preScheduled.length}
                      </div>
                      <div>{preScheduled.map(renderAvailableRow)}</div>
                    </>
                  )}
                  {filteredAvailable.length > 0 ? (
                    <>
                      {preScheduled.length > 0 && (
                        <div className="px-2 py-1.5 font-mono text-[10px] uppercase tracking-[0.06em] text-text-tertiary border-y border-border-subtle bg-surface-elevated">
                          Available · {filteredAvailable.length}
                        </div>
                      )}
                      <div>{filteredAvailable.map(renderAvailableRow)}</div>
                    </>
                  ) : (
                    preScheduled.length === 0 && (
                      <div className="px-3 py-8 text-center text-[12px] text-text-tertiary">
                        No actions match.
                      </div>
                    )
                  )}
                </div>

                {/* Inline-add input */}
                <div className="p-2 border-t border-border-subtle bg-surface-base rounded-b-[6px]">
                  <div
                    className="flex items-center gap-2 px-3 rounded-[4px] border border-dashed border-border-default"
                    style={{ height: 40 }}
                  >
                    <span className="font-mono text-[14px] text-text-tertiary leading-none">+</span>
                    <input
                      value={quickTitle}
                      onChange={(e) => setQuickTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key !== "Enter") return;
                        e.preventDefault();
                        const title = quickTitle.trim();
                        if (!title || !quickGoalId) return;
                        const newId = createAction({
                          title,
                          goalId: quickGoalId,
                          projectId: quickProjectId ?? null,
                        });
                        addMany([newId]);
                        setQuickTitle("");
                        toast.success("Action created and added to today");
                      }}
                      placeholder="Quick add new action..."
                      className="flex-1 bg-transparent text-[13px] text-text-primary outline-none placeholder:text-text-tertiary"
                    />
                    <select
                      value={quickGoalId ?? ""}
                      onChange={(e) => {
                        const gid = e.target.value || undefined;
                        setQuickGoalId(gid);
                        const proj = firstProjectForGoal(gid);
                        setQuickProjectId(proj?.id);
                      }}
                      className="bg-surface-hover text-[11px] text-text-secondary rounded-[3px] px-1.5 py-1 outline-none border border-transparent focus:border-border-default max-w-[110px]"
                      title="Goal"
                    >
                      {goals
                        .filter((g) => g.status === "active")
                        .map((g) => (
                          <option key={g.id} value={g.id}>
                            {g.title}
                          </option>
                        ))}
                    </select>
                    <select
                      value={quickProjectId ?? ""}
                      onChange={(e) => setQuickProjectId(e.target.value || undefined)}
                      className="bg-surface-hover text-[11px] text-text-secondary rounded-[3px] px-1.5 py-1 outline-none border border-transparent focus:border-border-default max-w-[110px]"
                      title="Project"
                    >
                      <option value="">No project</option>
                      {projects
                        .filter(
                          (p) => p.status === "active" && (!quickGoalId || p.goalId === quickGoalId),
                        )
                        .map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.title}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* RIGHT: selected */}
              <div className="border border-border-subtle rounded-[6px] bg-surface-base flex flex-col min-h-[280px]">
                <div className="px-3 py-2 border-b border-border-subtle font-mono text-[10px] uppercase tracking-[0.06em] text-text-tertiary">
                  Selected · {state.selectedActionIds.length}
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1.5 max-h-[360px]">
                  {state.selectedActionIds.length === 0 ? (
                    <div className="h-full min-h-[200px] flex items-center justify-center text-center px-4 border border-dashed border-border-subtle rounded-[4px]">
                      <span className="text-[12px] text-text-tertiary">
                        No actions selected. Pick from the list or use Quick-start presets.
                      </span>
                    </div>
                  ) : (
                    state.selectedActionIds.map((id, i) => renderSelectedRow(id, i))
                  )}
                </div>
                {state.selectedActionIds.length > 0 && totalEstMin > 0 && (
                  <div className="px-3 py-2 border-t border-border-subtle font-mono text-[11px] text-text-secondary tabular-nums">
                    Estimated time: {formatTimeMin(totalEstMin)}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* MAIN TASK */}
          <section>
            <div className="mb-2">
              <div className="flex items-center gap-2">
                <Star size={16} className="text-text-tertiary" />
                <div className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-tertiary">
                  MAIN TASK
                </div>
              </div>
              <div className="text-[13px] text-text-secondary mt-1">
                What single thing makes today a win?
              </div>
            </div>
            {(() => {
              const mt = state.mainTaskId
                ? selectedActions.find((a) => a.id === state.mainTaskId)
                : undefined;
              if (mt) {
                const g = goalById(mt.goalId);
                const p = projectById(mt.projectId);
                return (
                  <div
                    className="relative rounded-[6px] bg-surface-raised overflow-hidden"
                    style={{ border: "1px solid hsl(var(--accent))", padding: "16px 20px" }}
                  >
                    <span
                      className="absolute left-0 top-0 bottom-0"
                      style={{ background: goalColor(mt.goalId), width: 3 }}
                    />
                    <button
                      type="button"
                      onClick={() => setState((s) => ({ ...s, mainTaskId: undefined }))}
                      aria-label="Clear main task"
                      className="absolute top-2 right-2 text-text-tertiary hover:text-text-primary text-[14px] px-1"
                    >
                      ×
                    </button>
                    <div className="flex items-center gap-2 pr-6">
                      <Star
                        size={14}
                        className="text-[hsl(var(--accent))] shrink-0"
                        fill="hsl(var(--accent))"
                      />
                      <span className="text-[15px] font-medium text-text-primary truncate">
                        {mt.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5 font-mono text-[12px] text-text-secondary">
                      <span className="truncate">
                        {g?.title ?? ""}
                        {p ? ` · ${p.title}` : ""}
                      </span>
                      {mt.impact ? <span className="tabular-nums">· I{mt.impact}</span> : null}
                      {mt.timeEstimateMinutes ? (
                        <span className="tabular-nums">· {formatTimeMin(mt.timeEstimateMinutes)}</span>
                      ) : null}
                    </div>
                  </div>
                );
              }
              const disabled = selectedActions.length === 0;
              return (
                <select
                  value=""
                  disabled={disabled}
                  onChange={(e) =>
                    setState((s) => ({ ...s, mainTaskId: e.target.value || undefined }))
                  }
                  className="w-full appearance-none bg-transparent rounded-[4px] px-4 py-3 text-[14px] text-text-tertiary outline-none border border-dashed border-border-default cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <option value="">
                    {disabled ? "Add actions first" : "Pick from selected actions ▾"}
                  </option>
                  {selectedActions.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.title}
                    </option>
                  ))}
                </select>
              );
            })()}
          </section>

          {/* RITUALS */}
          <section>
            <SectionHead meta={`${dueRituals.length}`}>RITUALS TODAY</SectionHead>
            <div className="space-y-1">
              {dueRituals.length === 0 && (
                <div className="font-mono text-[11px] text-text-tertiary py-2">
                  No rituals scheduled for today.
                </div>
              )}
              {dueRituals.map((r) => {
                const skipped = state.skippedRitualIds.has(r.id);
                return (
                  <div
                    key={r.id}
                    className={`relative flex items-center gap-2 pr-2 rounded-[3px] hover:bg-surface-hover transition-colors ${
                      skipped ? "opacity-50" : ""
                    }`}
                    style={{ minHeight: 40 }}
                  >
                    <span
                      className="absolute left-0 top-0 bottom-0"
                      style={{ background: goalColor(r.goalId), width: 3 }}
                    />
                    <span style={{ paddingLeft: 11 }} />
                    <span className={`text-[13px] truncate ${skipped ? "line-through text-text-tertiary" : "text-text-primary"}`}>
                      {r.title}
                    </span>
                    <span className="font-mono text-[11px] text-text-tertiary truncate">
                      · {r.schedule}
                    </span>
                    <div className="flex-1" />
                    <button
                      type="button"
                      onClick={() => toggleRitualSkip(r.id, !skipped)}
                      className="text-[12px] text-text-tertiary hover:text-text-primary transition shrink-0 px-2"
                    >
                      {skipped ? "Restore" : "Skip"}
                    </button>
                  </div>
                );
              })}
            </div>
          </section>

        </>
      )}
    </div>
  );
};

const initialPlanState = (): PlanFormState => ({
  dayType: undefined,
  selectedActionIds: [],
  keptRitualIds: new Set(),
  skippedRitualIds: new Set(),
  mainTaskId: undefined,
  intent: "",
});

/* Pre-fill scheduled-today actions and all due rituals as 'kept'. */
function usePrefilledPlanState(
  date: string,
): [PlanFormState, React.Dispatch<React.SetStateAction<PlanFormState>>] {
  const actions = useStore((s) => s.actions);
  const rituals = useStore((s) => s.rituals);
  const [state, setState] = useState<PlanFormState>(initialPlanState);
  useEffect(() => {
    const scheduled = actions.filter(
      (a) =>
        a.scheduledDate === date && (a.status === "planned" || a.status === "backlog"),
    );
    const due = rituals.filter((r) => r.status === "active" && ritualDueOn(r, date));
    setState((s) => ({
      ...s,
      selectedActionIds: scheduled.map((a) => a.id),
      keptRitualIds: new Set(due.map((r) => r.id)),
      skippedRitualIds: new Set(),
    }));
    // Only on date change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);
  return [state, setState];
}

/* ═════════════ Plan Today modal ═════════════ */

export const PlanTodayModal: React.FC<{ open: boolean; onClose: () => void }> = ({
  open,
  onClose,
}) => {
  const date = todayISO();
  const startDayPlan = useStore((s) => s.startDayPlan);
  const updateAction = useStore((s) => s.updateAction);
  const actions = useStore((s) => s.actions);
  const [state, setState] = usePrefilledPlanState(date);

  const canSubmit = !!state.dayType && state.selectedActionIds.length > 0;

  const handleSubmit = () => {
    if (!canSubmit) return;
    // Clear scheduledDate on any pre-scheduled actions that the user un-selected.
    const selectedSet = new Set(state.selectedActionIds);
    actions
      .filter((a) => a.scheduledDate === date && !selectedSet.has(a.id))
      .forEach((a) => updateAction(a.id, { scheduledDate: undefined }));
    startDayPlan({
      date,
      dayType: state.dayType,
      mainTaskActionId: state.mainTaskId,
      morningEnergyScore: undefined,
      morningIntentNote: undefined,
      plannedActionIds: state.selectedActionIds,
      plannedRitualIds: Array.from(state.keptRitualIds),
      skippedRitualIds: Array.from(state.skippedRitualIds),
    });
    toast.success(
      `Day planned. ${state.selectedActionIds.length} action${state.selectedActionIds.length > 1 ? "s" : ""}, ${state.keptRitualIds.size} ritual${state.keptRitualIds.size === 1 ? "" : "s"}.`,
    );
    onClose();
  };

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title="Plan today"
      subtitle={formatLong(date)}
      width={720}
      footer={
        <>
          <LinkButton onClick={onClose}>Plan later</LinkButton>
          <PrimaryButton onClick={handleSubmit} disabled={!canSubmit}>
            Plan day
          </PrimaryButton>
        </>
      }
    >
      <PlanForm date={date} state={state} setState={setState} />
    </ModalShell>
  );
};

/* ═════════════ Close Day form ═════════════ */

const CloseSummary: React.FC<{ date: string }> = ({ date }) => {
  const dayEntry = useStore((s) => s.dayEntries.find((d) => d.date === date));
  const actions = useStore((s) => s.actions);
  const rituals = useStore((s) => s.rituals);

  if (!dayEntry) {
    return (
      <div className="font-mono text-[11px] text-text-tertiary">
        No plan was made for this day.
      </div>
    );
  }

  const planned = (dayEntry.plannedActionIds ?? [])
    .map((id) => actions.find((a) => a.id === id))
    .filter(Boolean) as Action[];
  const done = planned.filter((a) => a.status === "done").length;
  const skipped = planned.filter(
    (a) => a.status === "dropped" || a.status === "cancelled",
  ).length;
  const pending = planned.length - done - skipped;

  const main = dayEntry.mainTaskActionId
    ? actions.find((a) => a.id === dayEntry.mainTaskActionId)
    : undefined;

  const plannedRituals = (dayEntry.plannedRitualIds ?? [])
    .map((id) => rituals.find((r) => r.id === id))
    .filter(Boolean) as Ritual[];
  const ritualsDone = plannedRituals.filter((r) =>
    r.completionHistory.some(
      (c) => c.date === date && (c.status === "done" || !c.status),
    ),
  ).length;
  const ritualsSkipped = (dayEntry.skippedRitualIds ?? []).length;
  const ritualsMissed = plannedRituals.length - ritualsDone;

  const dayTypeLabel = dayEntry.dayType
    ? DAY_TYPE_OPTIONS.find((o) => o.value === dayEntry.dayType)?.label
    : "—";

  return (
    <div className="rounded-[4px] bg-surface-raised border border-border-subtle p-4 space-y-2 text-[13px]">
      <div className="flex justify-between">
        <span className="text-text-secondary">Day type</span>
        <span className="text-text-primary">{dayTypeLabel}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-text-secondary">Main task</span>
        <span className="text-text-primary">
          {main ? (main.status === "done" ? `✓ ${main.title}` : `· ${main.title}`) : "—"}
        </span>
      </div>
      <div className="flex justify-between">
        <span className="text-text-secondary">Actions</span>
        <span className="font-mono text-text-primary">
          {done} done · {skipped} skipped · {pending} pending
        </span>
      </div>
      <div className="flex justify-between">
        <span className="text-text-secondary">Rituals</span>
        <span className="font-mono text-text-primary">
          {ritualsDone} done · {ritualsSkipped} skipped · {ritualsMissed} missed
        </span>
      </div>
    </div>
  );
};

interface CloseFormState {
  eveningEnergy?: number;
  reflection: string;
}

const CloseForm: React.FC<{
  date: string;
  state: CloseFormState;
  setState: React.Dispatch<React.SetStateAction<CloseFormState>>;
  compact?: boolean;
}> = ({ date, state, setState, compact }) => {
  return (
    <div className="space-y-6">
      <CloseSummary date={date} />
      <section>
        <SectionHead>REFLECTION</SectionHead>
        <textarea
          value={state.reflection}
          onChange={(e) => setState((s) => ({ ...s, reflection: e.target.value }))}
          rows={compact ? 2 : 4}
          placeholder="What worked? What didn't? Carry into tomorrow…"
          className="w-full bg-surface-hover rounded-[4px] px-3 py-2 text-[13px] text-text-primary outline-none border border-transparent focus:border-border-default placeholder:text-text-tertiary resize-none"
        />
      </section>
    </div>
  );
};

/* ═════════════ Close Day modal ═════════════ */

export const CloseDayModal: React.FC<{ open: boolean; onClose: () => void }> = ({
  open,
  onClose,
}) => {
  const date = todayISO();
  const closeDay = useStore((s) => s.closeDay);
  const [state, setState] = useState<CloseFormState>({ reflection: "" });
  useEffect(() => {
    if (open) setState({ reflection: "" });
  }, [open]);

  const handleSubmit = () => {
    closeDay(date, state.eveningEnergy, state.reflection || undefined);
    toast.success("Day closed");
    onClose();
  };

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title="Close today"
      subtitle={formatLong(date)}
      footer={
        <>
          <LinkButton onClick={onClose}>Cancel</LinkButton>
          <PrimaryButton onClick={handleSubmit}>Close day</PrimaryButton>
        </>
      }
    >
      <CloseForm date={date} state={state} setState={setState} />
    </ModalShell>
  );
};

/* ═════════════ Combined Close-yesterday + Plan-today modal ═════════════ */

export const ClosePlanModal: React.FC<{ open: boolean; onClose: () => void }> = ({
  open,
  onClose,
}) => {
  const today = todayISO();
  const yesterday = yesterdayISO();
  const closeDay = useStore((s) => s.closeDay);
  const startDayPlan = useStore((s) => s.startDayPlan);

  const [planState, setPlanState] = usePrefilledPlanState(today);
  const [closeState, setCloseState] = useState<CloseFormState>({ reflection: "" });
  useEffect(() => {
    if (open) setCloseState({ reflection: "" });
  }, [open]);

  const canSubmit = !!planState.dayType && planState.selectedActionIds.length > 0;

  const updateAction = useStore((s) => s.updateAction);
  const allActions = useStore((s) => s.actions);

  const handleSubmit = () => {
    if (!canSubmit) return;
    closeDay(yesterday, closeState.eveningEnergy, closeState.reflection || undefined);
    const selectedSet = new Set(planState.selectedActionIds);
    allActions
      .filter((a) => a.scheduledDate === today && !selectedSet.has(a.id))
      .forEach((a) => updateAction(a.id, { scheduledDate: undefined }));
    startDayPlan({
      date: today,
      dayType: planState.dayType,
      mainTaskActionId: planState.mainTaskId,
      morningEnergyScore: undefined,
      morningIntentNote: undefined,
      plannedActionIds: planState.selectedActionIds,
      plannedRitualIds: Array.from(planState.keptRitualIds),
      skippedRitualIds: Array.from(planState.skippedRitualIds),
    });
    toast.success("Yesterday closed and today planned");
    onClose();
  };

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title="Close yesterday and plan today"
      subtitle={`Yesterday: ${formatShort(yesterday)} · Today: ${formatShort(today)}`}
      width={720}
      footer={
        <>
          <LinkButton onClick={onClose}>Skip for now</LinkButton>
          <PrimaryButton onClick={handleSubmit} disabled={!canSubmit}>
            Close yesterday and plan today
          </PrimaryButton>
        </>
      }
    >
      <div className="space-y-8">
        <div>
          <h3 className="text-[14px] font-medium text-text-primary mb-3">Close yesterday</h3>
          <CloseForm date={yesterday} state={closeState} setState={setCloseState} compact />
        </div>
        <div className="h-px bg-border-subtle" />
        <div>
          <h3 className="text-[14px] font-medium text-text-primary mb-3">Plan today</h3>
          <PlanForm date={today} state={planState} setState={setPlanState} />
        </div>
      </div>
    </ModalShell>
  );
};
