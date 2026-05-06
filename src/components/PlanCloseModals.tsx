// Plan today / Close day / Combined Close-yesterday-and-Plan-today modals.
//
// All three render through a shared <ModalShell> (centered desktop dialog,
// bottom sheet on mobile). Forms are uncontrolled-ish: local state, submit
// commits to the store via startDayPlan / closeDay.

import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/store/useStore";
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

const DAY_TYPE_OPTIONS: { value: DayType; label: string }[] = [
  { value: "execution", label: "Execution" },
  { value: "recovery", label: "Recovery" },
  { value: "day-off", label: "Day Off" },
  { value: "sick", label: "Sick" },
];

/* ───────── primitives ───────── */
const SectionHead: React.FC<{ children: React.ReactNode; sub?: string }> = ({ children, sub }) => (
  <div className="mb-2">
    <div className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-tertiary">
      {children}
    </div>
    {sub && <div className="font-mono text-[11px] text-text-tertiary mt-0.5">{sub}</div>}
  </div>
);

const Pill: React.FC<{
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  variant?: "default" | "muted";
}> = ({ active, onClick, children, variant = "default" }) => (
  <button
    type="button"
    onClick={onClick}
    className={`px-2.5 py-1 rounded-[4px] text-[12px] border transition-colors ${
      active
        ? variant === "muted"
          ? "bg-surface-hover text-text-secondary border-border-default"
          : "bg-[hsl(var(--accent))] text-white border-[hsl(var(--accent))]"
        : "bg-transparent text-text-secondary border-border-default hover:text-text-primary hover:border-border-default"
    }`}
  >
    {children}
  </button>
);

const EnergyPicker: React.FC<{ value?: number; onChange: (v: number) => void }> = ({
  value,
  onChange,
}) => (
  <div className="flex items-center gap-1 flex-wrap">
    {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
      <button
        key={n}
        type="button"
        onClick={() => onChange(n)}
        className={`w-7 h-7 rounded-[3px] font-mono text-[11px] transition-colors ${
          value === n
            ? "bg-[hsl(var(--accent))] text-white"
            : "bg-surface-hover text-text-tertiary hover:text-text-primary"
        }`}
      >
        {n}
      </button>
    ))}
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
  footer: React.ReactNode;
  children: React.ReactNode;
}> = ({ open, onClose, title, subtitle, footer, children }) => {
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
    <div className="fixed inset-0 z-[90] flex items-end md:items-center justify-center">
      <div
        className="absolute inset-0"
        style={{ background: "rgba(0,0,0,0.5)" }}
        onClick={onClose}
      />
      <div className="relative w-full md:w-[560px] max-h-[90vh] md:max-h-[80vh] bg-surface-elevated border border-border-subtle md:rounded-[8px] rounded-t-[12px] flex flex-col shadow-2xl animate-in slide-in-from-bottom-4 md:slide-in-from-bottom-0 md:fade-in">
        <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-border-subtle shrink-0">
          <div>
            <h2 className="text-[18px] font-medium text-text-primary leading-tight">{title}</h2>
            {subtitle && (
              <div className="font-mono text-[12px] text-text-tertiary mt-0.5">{subtitle}</div>
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
        <div className="px-6 py-5 overflow-y-auto flex-1">{children}</div>
        <div className="px-6 py-4 border-t border-border-subtle flex items-center justify-end gap-3 shrink-0">
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

/* ───────── suggestion logic ───────── */
function quantile(vals: number[], q: number): number {
  if (vals.length === 0) return 0;
  const sorted = [...vals].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.floor(q * sorted.length));
  return sorted[idx];
}

interface ActionSuggestions {
  scheduled: Action[];
  heavyLift: Action[];
  quickMoves: Action[];
}

function effortFor(a: Action): number {
  // Effort signal — time bucket (Energy/Focus removed).
  if (a.timeEstimateMinutes != null) return Math.min(10, Math.ceil(a.timeEstimateMinutes / 30));
  return 5;
}

function buildActionSuggestions(actions: Action[], date: string): ActionSuggestions {
  const scheduled = actions.filter(
    (a) => a.scheduledDate === date && (a.status === "planned" || a.status === "backlog"),
  );
  const scheduledIds = new Set(scheduled.map((a) => a.id));
  const backlog = actions.filter(
    (a) => a.status === "backlog" && !scheduledIds.has(a.id),
  );

  if (backlog.length === 0) return { scheduled, heavyLift: [], quickMoves: [] };

  const impacts = backlog.map((a) => a.impact ?? 0);
  const efforts = backlog.map((a) => effortFor(a));
  const impactP75 = quantile(impacts, 0.75);
  const effortP75 = quantile(efforts, 0.75);
  const impactMedian = quantile(impacts, 0.5);
  const effortP30 = quantile(efforts, 0.3);

  const heavyLift = backlog
    .filter((a) => (a.impact ?? 0) >= impactP75 && effortFor(a) >= effortP75)
    .sort((a, b) => (b.impact ?? 0) - (a.impact ?? 0))
    .slice(0, 3);
  const heavyIds = new Set(heavyLift.map((a) => a.id));

  const quickMoves = backlog
    .filter((a) => !heavyIds.has(a.id))
    .filter((a) => {
      const imp = a.impact ?? 0;
      const eff = effortFor(a);
      const timeOk =
        (a.timeEstimateMinutes != null && a.timeEstimateMinutes <= 60) || eff <= effortP30;
      return imp >= impactMedian && timeOk;
    })
    .sort((a, b) => {
      const di = (b.impact ?? 0) - (a.impact ?? 0);
      if (di !== 0) return di;
      return effortFor(a) - effortFor(b);
    })
    .slice(0, 5);

  return { scheduled, heavyLift, quickMoves };
}

/* ═════════════ Plan Today form (re-usable inside Plan and Combined modals) ═════════════ */

interface PlanFormState {
  dayType?: DayType;
  morningEnergy?: number;
  selectedActionIds: Set<ID>;
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
  const settings = useStore((s) => s.settings);
  const createAction = useStore((s) => s.createAction);

  const suggestions = useMemo(() => buildActionSuggestions(actions, date), [actions, date]);
  const dueRituals = useMemo(
    () => rituals.filter((r) => r.status === "active" && ritualDueOn(r, date)),
    [rituals, date],
  );

  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newProjectId, setNewProjectId] = useState<string>("");

  const goalById = (id: ID) => goals.find((g) => g.id === id);
  const projectById = (id: ID | null) => (id ? projects.find((p) => p.id === id) : undefined);
  const breadcrumb = (a: Action) => {
    const g = goalById(a.goalId);
    const p = projectById(a.projectId);
    if (g && p) return `${g.title} · ${p.title}`;
    return g?.title ?? "";
  };

  const toggleAction = (id: ID) =>
    setState((s) => {
      const next = new Set(s.selectedActionIds);
      next.has(id) ? next.delete(id) : next.add(id);
      // If main task gets deselected, clear it.
      const mainTaskId = next.has(s.mainTaskId ?? "") ? s.mainTaskId : undefined;
      return { ...s, selectedActionIds: next, mainTaskId };
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

  const handleAddNew = () => {
    const t = newTitle.trim();
    if (!t) return;
    const id = createAction({
      title: t,
      projectId: newProjectId || null,
      scheduledDate: date,
    });
    setState((s) => ({
      ...s,
      selectedActionIds: new Set([...s.selectedActionIds, id]),
    }));
    setNewTitle("");
    setNewProjectId("");
    setShowAdd(false);
  };

  const allSuggestionIds = new Set<string>([
    ...suggestions.scheduled.map((a) => a.id),
    ...suggestions.heavyLift.map((a) => a.id),
    ...suggestions.quickMoves.map((a) => a.id),
  ]);
  // Selected actions includes anything ticked in the form, even if it's no
  // longer in suggestions (e.g. just-added action).
  const selectedActions = actions.filter((a) => state.selectedActionIds.has(a.id));

  const renderRow = (a: Action, opts: { showImpactBadge?: boolean } = {}) => {
    const checked = state.selectedActionIds.has(a.id);
    const g = goals.find((gg) => gg.id === a.goalId);
    const p = a.projectId ? projects.find((pp) => pp.id === a.projectId) : undefined;
    const color = g ? `hsl(var(--${g.color}))` : "hsl(var(--text-tertiary))";
    return (
      <label
        key={a.id}
        className="relative flex items-stretch hover:bg-surface-hover cursor-pointer transition-colors"
        style={{ minHeight: 56 }}
      >
        <span
          className="absolute left-0 top-0 bottom-0"
          style={{ background: color, width: 3 }}
        />
        <div className="flex items-center gap-3 py-3 pr-3 w-full min-w-0" style={{ paddingLeft: 19 }}>
          <input
            type="checkbox"
            checked={checked}
            onChange={() => toggleAction(a.id)}
            className="accent-[hsl(var(--accent))] shrink-0"
            style={{ width: 16, height: 16 }}
          />
          {opts.showImpactBadge && (
            <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-tertiary w-[26px] shrink-0 tabular-nums">
              I{a.impact ?? 0}
            </span>
          )}
          <div className="flex flex-col gap-1 min-w-0 flex-1">
            <span className="text-[15px] font-medium text-text-primary truncate">{a.title}</span>
            <span className="font-mono text-[12px] text-text-secondary tabular-nums truncate">
              {g?.title ?? ""}
              {p ? ` · ${p.title}` : ""}
              {a.impact ? ` · I${a.impact}` : ""}
              {a.timeEstimateMinutes ? ` · ${formatTimeMin(a.timeEstimateMinutes)}` : ""}
            </span>
          </div>
        </div>
      </label>
    );
  };

  const SubHeading: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-text-tertiary mt-3 mb-1">
      {children}
    </div>
  );

  const noneAtAll =
    suggestions.scheduled.length === 0 &&
    suggestions.heavyLift.length === 0 &&
    suggestions.quickMoves.length === 0;

  return (
    <div className="space-y-6">
      {/* DAY TYPE */}
      <section>
        <SectionHead>DAY TYPE</SectionHead>
        <div className="flex flex-wrap gap-1.5">
          {DAY_TYPE_OPTIONS.map((opt) => (
            <Pill
              key={opt.value}
              active={state.dayType === opt.value}
              onClick={() => setState((s) => ({ ...s, dayType: opt.value }))}
            >
              {opt.label}
            </Pill>
          ))}
        </div>
      </section>

      {/* Morning Energy section removed */}

      {/* ACTIONS */}
      <section>
        <SectionHead sub="Pick what you'll work on today. Suggestions help you find what's worth doing.">
          ACTIONS FOR TODAY
        </SectionHead>

        {noneAtAll ? (
          <div className="font-mono text-[11px] text-text-tertiary py-2">
            No suggestions yet. Add an action to start your day.
          </div>
        ) : (
          <>
            {suggestions.scheduled.length > 0 && (
              <>
                <SubHeading>SCHEDULED FOR TODAY · {suggestions.scheduled.length}</SubHeading>
                <div className="space-y-1">
                  {suggestions.scheduled.map((a) => renderRow(a))}
                </div>
              </>
            )}
            {suggestions.heavyLift.length > 0 && (
              <>
                <SubHeading>
                  HEAVY LIFT TODAY · <span className="text-text-tertiary/70">HIGH IMPACT · HIGH EFFORT</span>
                </SubHeading>
                <div className="space-y-1">
                  {suggestions.heavyLift.map((a) => renderRow(a, { showImpactBadge: true }))}
                </div>
              </>
            )}
            {suggestions.quickMoves.length > 0 && (
              <>
                <SubHeading>
                  QUICK MOVES · <span className="text-text-tertiary/70">HIGH IMPACT · LOW EFFORT</span>
                </SubHeading>
                <div className="space-y-1">
                  {suggestions.quickMoves.map((a) => renderRow(a, { showImpactBadge: true }))}
                </div>
              </>
            )}
          </>
        )}

        {showAdd ? (
          <div className="mt-2 flex items-center gap-2 p-2 bg-surface-raised rounded-[4px] border border-border-subtle">
            <input
              autoFocus
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddNew()}
              placeholder="Action title…"
              className="flex-1 bg-transparent text-[13px] text-text-primary placeholder:text-text-tertiary focus:outline-none"
            />
            <select
              value={newProjectId}
              onChange={(e) => setNewProjectId(e.target.value)}
              className="bg-surface-hover text-[12px] text-text-secondary rounded-[3px] px-2 py-1 outline-none border border-transparent focus:border-border-default"
            >
              <option value="">No project</option>
              {projects
                .filter((p) => p.status === "active")
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
            </select>
            <button
              type="button"
              onClick={handleAddNew}
              className="text-[12px] text-[hsl(var(--accent))] font-medium"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => { setShowAdd(false); setNewTitle(""); }}
              className="text-[12px] text-text-tertiary hover:text-text-primary"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className="mt-2 text-[12px] text-[hsl(var(--accent))] hover:brightness-110"
          >
            + Add another action
          </button>
        )}
      </section>

      {/* RITUALS */}
      <section>
        <SectionHead>RITUALS TODAY</SectionHead>
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
                className="flex items-center gap-2 px-2 py-1.5 rounded-[3px] hover:bg-surface-hover"
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ background: `hsl(var(--${goalById(r.goalId)?.color ?? "goal-1"}))` }}
                />
                <span className={`text-[13px] truncate ${skipped ? "text-text-tertiary line-through" : "text-text-primary"}`}>
                  {r.title}
                </span>
                <span className="font-mono text-[11px] text-text-tertiary truncate">
                  · {r.schedule}
                </span>
                <div className="flex-1" />
                <div className="flex items-center gap-1">
                  <Pill active={!skipped} onClick={() => toggleRitualSkip(r.id, false)}>
                    Keep
                  </Pill>
                  <Pill
                    active={skipped}
                    variant="muted"
                    onClick={() => toggleRitualSkip(r.id, true)}
                  >
                    Skip
                  </Pill>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* MAIN TASK */}
      <section>
        <SectionHead sub="What single thing makes today a win?">MAIN TASK</SectionHead>
        <select
          value={state.mainTaskId ?? ""}
          onChange={(e) =>
            setState((s) => ({ ...s, mainTaskId: e.target.value || undefined }))
          }
          className="w-full bg-surface-hover rounded-[4px] px-3 py-2 text-[13px] text-text-primary outline-none border border-transparent focus:border-border-default"
        >
          <option value="">— None —</option>
          {selectedActions.map((a) => (
            <option key={a.id} value={a.id}>
              {a.title}
            </option>
          ))}
        </select>
      </section>

      {/* INTENT */}
      <section>
        <SectionHead>INTENT</SectionHead>
        <input
          value={state.intent}
          onChange={(e) => setState((s) => ({ ...s, intent: e.target.value }))}
          placeholder="Today I will…"
          className="w-full bg-surface-hover rounded-[4px] px-3 py-2 text-[13px] text-text-primary outline-none border border-transparent focus:border-border-default placeholder:text-text-tertiary"
        />
      </section>
    </div>
  );
};

const initialPlanState = (): PlanFormState => ({
  dayType: undefined,
  morningEnergy: undefined,
  selectedActionIds: new Set(),
  keptRitualIds: new Set(),
  skippedRitualIds: new Set(),
  mainTaskId: undefined,
  intent: "",
});

/* Pre-fill scheduled-today actions and all due rituals as 'kept'. */
function usePrefilledPlanState(date: string): [PlanFormState, React.Dispatch<React.SetStateAction<PlanFormState>>] {
  const actions = useStore((s) => s.actions);
  const rituals = useStore((s) => s.rituals);
  const [state, setState] = useState<PlanFormState>(initialPlanState);
  useEffect(() => {
    const scheduled = actions.filter(
      (a) => a.scheduledDate === date && (a.status === "planned" || a.status === "backlog"),
    );
    const due = rituals.filter((r) => r.status === "active" && ritualDueOn(r, date));
    setState((s) => ({
      ...s,
      selectedActionIds: new Set(scheduled.map((a) => a.id)),
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
  const [state, setState] = usePrefilledPlanState(date);

  const canSubmit = !!state.dayType;

  const handleSubmit = () => {
    if (!canSubmit) return;
    startDayPlan({
      date,
      dayType: state.dayType,
      mainTaskActionId: state.mainTaskId,
      morningEnergyScore: state.morningEnergy,
      morningIntentNote: state.intent || undefined,
      plannedActionIds: Array.from(state.selectedActionIds),
      plannedRitualIds: Array.from(state.keptRitualIds),
      skippedRitualIds: Array.from(state.skippedRitualIds),
    });
    toast.success("Day planned");
    onClose();
  };

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title="Plan today"
      subtitle={formatLong(date)}
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

  const planned = (dayEntry.plannedActionIds ?? []).map((id) =>
    actions.find((a) => a.id === id),
  ).filter(Boolean) as Action[];
  const done = planned.filter((a) => a.status === "done").length;
  const skipped = planned.filter(
    (a) => a.status === "dropped" || a.status === "cancelled",
  ).length;
  const pending = planned.length - done - skipped;

  const main = dayEntry.mainTaskActionId
    ? actions.find((a) => a.id === dayEntry.mainTaskActionId)
    : undefined;

  const plannedRituals = (dayEntry.plannedRitualIds ?? []).map((id) =>
    rituals.find((r) => r.id === id),
  ).filter(Boolean) as Ritual[];
  const ritualsDone = plannedRituals.filter((r) =>
    r.completionHistory.some((c) => c.date === date && (c.status === "done" || !c.status)),
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
  const settings = useStore((s) => s.settings);
  return (
    <div className="space-y-6">
      <CloseSummary date={date} />
      {/* Evening Energy section removed */}
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

  const canSubmit = !!planState.dayType;

  const handleSubmit = () => {
    if (!canSubmit) return;
    closeDay(yesterday, closeState.eveningEnergy, closeState.reflection || undefined);
    startDayPlan({
      date: today,
      dayType: planState.dayType,
      mainTaskActionId: planState.mainTaskId,
      morningEnergyScore: planState.morningEnergy,
      morningIntentNote: planState.intent || undefined,
      plannedActionIds: Array.from(planState.selectedActionIds),
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
