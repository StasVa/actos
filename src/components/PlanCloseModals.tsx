// Plan today — full-page in-place takeover (no longer a modal).
//
// Renders inside /today's content area when the user clicks "Start your day".
// Sidebar stays visible. Submit commits to the store via startDayPlan().

import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Zap, Leaf, Sun, Thermometer, GripVertical, Star, type LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n";
import { useStore, ritualMultiplier } from "@/store/useStore";
import type { Action, DayType, ID, Ritual } from "@/types";
import { formatTime as formatTimeMin } from "@/lib/format";
import { ImpactPill, TimePill } from "@/components/MetaPills";

/* ───────── inline custom dropdown for composer parent picker ───────── */
type MiniOption = { value: string; label: string; dot?: string };
const MiniDropdown: React.FC<{
  value: string;
  options: MiniOption[];
  onChange: (v: string) => void;
  placeholder?: string;
  showDot?: boolean;
}> = ({ value, options, onChange, placeholder, showDot }) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = options.find((o) => o.value === value);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 rounded-[4px] border border-border-subtle bg-transparent hover:bg-surface-hover transition-colors"
        style={{ padding: "4px 10px", maxWidth: 160 }}
        title={current?.label ?? placeholder}
      >
        {showDot && current?.dot && (
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: current.dot }} />
        )}
        <span
          className="text-[13px] text-text-primary truncate"
          style={{ maxWidth: 110 }}
        >
          {current?.label ?? placeholder ?? ""}
        </span>
        <span className="font-mono text-text-tertiary shrink-0" style={{ fontSize: 10 }}>▾</span>
      </button>
      {open && (
        <div
          className="absolute left-0 z-50 bg-surface-elevated border border-border-subtle rounded-[6px]"
          style={{ top: "calc(100% + 4px)", minWidth: Math.max(160, ref.current?.offsetWidth ?? 0), padding: "4px 0" }}
        >
          {options.length === 0 && (
            <div className="px-3 py-1.5 text-[12px] text-text-tertiary">{t("planToday.miniDropdown.noOptions")}</div>
          )}
          {options.map((o) => {
            const selected = o.value === value;
            return (
              <button
                key={o.value || "__none"}
                type="button"
                onClick={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
                className={`w-full flex items-center gap-2 text-left text-[13px] transition-colors ${
                  selected ? "bg-surface-hover" : "hover:bg-surface-hover"
                }`}
                style={{ padding: "6px 12px" }}
              >
                {showDot && o.dot && (
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: o.dot }} />
                )}
                <span
                  className="flex-1 text-text-primary truncate"
                  style={selected ? { color: "hsl(var(--accent))" } : undefined}
                >
                  {o.label}
                </span>
                {selected && (
                  <span style={{ color: "hsl(var(--accent))", fontSize: 12 }}>✓</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

/* ───────── inline text picker (no chrome — reads as inline link) ───────── */
const InlineTextPicker: React.FC<{
  value: string;
  options: MiniOption[];
  onChange: (v: string) => void;
  placeholder: string;
  showDot?: boolean;
}> = ({ value, options, onChange, placeholder, showDot }) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const current = options.find((o) => o.value === value);
  const label = current?.label ?? placeholder;

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;
    const r = triggerRef.current.getBoundingClientRect();
    setPos({ top: r.bottom + 8, left: r.left, width: Math.max(r.width, 240) });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t) || menuRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onScroll = () => setOpen(false);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
    };
  }, [open]);

  return (
    <span className="inline-flex items-center gap-1.5 min-w-0">
      {showDot && current?.dot && (
        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: current.dot }} />
      )}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        title={label}
        className="text-[13px] text-text-primary truncate bg-transparent p-0 border-0 cursor-pointer focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 rounded-[2px] hover:[text-decoration-color:hsl(var(--accent))] focus-visible:[text-decoration-color:hsl(var(--accent))]"
        style={{
          maxWidth: 200,
          textDecoration: "underline",
          textDecorationStyle: "dotted",
          textDecorationColor: "hsl(var(--text-tertiary))",
          textUnderlineOffset: 3,
          outlineColor: "hsl(var(--accent))",
        }}
      >
        {label}
      </button>
      {open && pos && createPortal(
        <div
          ref={menuRef}
          className="fixed z-[100] bg-surface-elevated border border-border-subtle rounded-[4px] shadow-md max-h-[280px] overflow-y-auto"
          style={{ top: pos.top, left: pos.left, minWidth: pos.width, padding: "4px 0" }}
        >
          {options.length === 0 && (
            <div className="px-3 py-1.5 text-[12px] text-text-tertiary">{t("planToday.miniDropdown.noOptions")}</div>
          )}
          {options.map((o) => {
            const selected = o.value === value;
            return (
              <button
                key={o.value || "__none"}
                type="button"
                onClick={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
                className={`w-full flex items-center gap-2 text-left text-[13px] transition-colors ${
                  selected ? "bg-surface-hover" : "hover:bg-surface-hover"
                }`}
                style={{ padding: "6px 12px" }}
              >
                {showDot && o.dot && (
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: o.dot }} />
                )}
                <span
                  className="flex-1 text-text-primary truncate"
                  style={selected ? { color: "hsl(var(--accent))" } : undefined}
                >
                  {o.label}
                </span>
                {selected && <span style={{ color: "hsl(var(--accent))", fontSize: 12 }}>✓</span>}
              </button>
            );
          })}
        </div>,
        document.body,
      )}
    </span>
  );
};

/* ───────── helpers ───────── */
const todayISO = () => new Date().toISOString().slice(0, 10);

const formatLong = (iso: string) =>
  new Date(iso + "T00:00:00").toLocaleDateString(i18n.language || "en", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });


/* ───────── primitives ───────── */
const SectionHead: React.FC<{ children: React.ReactNode; sub?: string; meta?: React.ReactNode }> = ({
  children,
  sub,
  meta,
}) => (
  <div className="mb-4 flex items-baseline justify-between gap-3">
    <div>
      <div className="flex items-baseline gap-2 flex-wrap">
        <div className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-tertiary">
          {children}
        </div>
        {meta && (
          <div className="font-mono text-[11px] text-text-tertiary tabular-nums">
            · {meta}
          </div>
        )}
      </div>
      {sub && (
        <div className="text-[16px] md:text-[19px] font-medium text-text-primary mt-1 leading-snug">
          {sub}
        </div>
      )}
    </div>
  </div>
);

/* (modal shell removed — Plan today is now a full-page in-place takeover.) */

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
  const { t } = useTranslation();
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

  const activeGoals = goals.filter((g) => g.status === "active");
  const projectsForQuickGoal = projects.filter(
    (p) => p.status === "active" && (!quickGoalId || p.goalId === quickGoalId),
  );

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
        style={{ minHeight: 48 }}
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
          <div className="text-[14px] font-medium text-text-primary truncate">{a.title}</div>
          <div className="font-mono text-[11px] text-text-secondary truncate">
            {g?.title ?? ""}
            {p ? ` · ${p.title}` : ""}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0" style={{ marginLeft: 4 }}>
          <ImpactPill impact={a.impact} goalColor={goalColor(a.goalId)} />
          <TimePill minutes={a.timeEstimateMinutes} />
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
          </div>
        </div>
        <TimePill minutes={a.timeEstimateMinutes} />
        <button
          type="button"
          onClick={() => removeAction(id)}
          aria-label={t("planToday.actions.removeAria")}
          className="text-text-tertiary hover:text-text-primary text-[14px] px-1 shrink-0"
          style={{ marginLeft: 8 }}
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

  return (
    <div className="space-y-7">
      {/* ACTIONS */}
          <section>
            <SectionHead
              sub={t("planToday.actions.sub")}
              meta={t("planToday.actions.selectedCount", { count: state.selectedActionIds.length })}
            >
              {t("planToday.actions.heading")}
            </SectionHead>

            <div className="flex flex-col md:flex-row gap-3 min-w-0">
              {/* LEFT: available */}
              <div className="border border-border-subtle rounded-[6px] bg-surface-base flex flex-col min-h-[280px] flex-1 min-w-0 md:basis-[60%]">
                {/* Quick Start removed — pane is browse-only. */}

                <div className="flex items-center gap-1.5 p-2 border-b border-border-subtle flex-wrap">
                  <select
                    value={filterGoal}
                    onChange={(e) => setFilterGoal(e.target.value)}
                    className="bg-surface-hover text-[11px] text-text-secondary rounded-[3px] px-1.5 py-1 outline-none border border-transparent focus:border-border-default"
                  >
                    <option value="all">{t("planToday.actions.filter.allGoals")}</option>
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
                    <option value="all">{t("planToday.actions.filter.allProjects")}</option>
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
                    <option value="all">{t("planToday.actions.filter.all")}</option>
                    <option value="backlog">{t("planToday.actions.filter.backlog")}</option>
                    <option value="planned">{t("planToday.actions.filter.planned")}</option>
                  </select>
                </div>

                <div className="flex-1 overflow-y-auto max-h-[360px]">
                  {preScheduled.length > 0 && (
                    <>
                      <div className="px-2 py-1.5 font-mono text-[10px] uppercase tracking-[0.06em] text-text-tertiary border-b border-border-subtle bg-surface-elevated">
                        {t("planToday.actions.alreadyScheduled", { count: preScheduled.length })}
                      </div>
                      <div>{preScheduled.map(renderAvailableRow)}</div>
                    </>
                  )}
                  {filteredAvailable.length > 0 ? (
                    <>
                      {preScheduled.length > 0 && (
                        <div className="px-2 py-1.5 font-mono text-[10px] uppercase tracking-[0.06em] text-text-tertiary border-y border-border-subtle bg-surface-elevated">
                          {t("planToday.actions.available", { count: filteredAvailable.length })}
                        </div>
                      )}
                      <div>{filteredAvailable.map(renderAvailableRow)}</div>
                    </>
                  ) : (
                    preScheduled.length === 0 && (
                      <div className="px-3 py-8 text-center text-[12px] text-text-tertiary">
                        {t("planToday.actions.noMatch")}
                      </div>
                    )
                  )}
                </div>

                {/* Inline-add input */}
                <div className="p-2 border-t border-border-subtle bg-surface-base rounded-b-[6px]">
                  <div className="flex flex-col gap-1.5 px-3 py-2.5 rounded-[6px] border border-dashed border-border-default hover:border-[hsl(var(--accent))] transition-colors">
                    {/* Line 1: title */}
                    <div className="flex items-center gap-2">
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
                          toast.success(t("planToday.actions.toast.created"));
                        }}
                        placeholder={t("planToday.actions.quickAddPlaceholder")}
                        className="flex-1 min-w-0 bg-transparent text-[14px] text-text-primary outline-none placeholder:text-text-tertiary"
                      />
                    </div>
                    {/* Line 2: parent picker — inline text triggers */}
                    <div className="flex items-center gap-1.5 pl-[22px] flex-wrap">
                      <span className="text-[13px] text-text-secondary">{t("planToday.actions.in")}</span>
                      {quickGoalId && (
                        <span
                          className="inline-block rounded-full shrink-0"
                          style={{ width: 8, height: 8, background: goalColor(quickGoalId) }}
                        />
                      )}
                      <InlineTextPicker
                        value={quickGoalId ?? ""}
                        showDot={false}
                        placeholder={t("planToday.actions.pickGoal")}
                        options={activeGoals.map((g) => ({
                          value: g.id,
                          label: g.title,
                          dot: goalColor(g.id),
                        }))}
                        onChange={(v) => {
                          const gid = v || undefined;
                          setQuickGoalId(gid);
                          const proj = firstProjectForGoal(gid);
                          setQuickProjectId(proj?.id);
                        }}
                      />
                      <span className="text-[13px] text-text-secondary">·</span>
                      <InlineTextPicker
                        value={quickProjectId ?? ""}
                        placeholder={t("planToday.actions.pickProject")}
                        options={[
                          { value: "", label: t("planToday.actions.noProject") },
                          ...projectsForQuickGoal.map((p) => ({
                            value: p.id,
                            label: p.title,
                          })),
                        ]}
                        onChange={(v) => setQuickProjectId(v || undefined)}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT: selected */}
              <div className="border border-border-subtle rounded-[6px] bg-surface-base flex flex-col min-h-[280px] flex-1 min-w-0 md:basis-[40%]">
                <div className="px-3 py-2 border-b border-border-subtle font-mono text-[10px] uppercase tracking-[0.06em] text-text-tertiary">
                  {t("planToday.actions.selected", { count: state.selectedActionIds.length })}
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1.5 max-h-[360px]">
                  {state.selectedActionIds.length === 0 ? (
                    <div className="h-full min-h-[200px] flex items-center justify-center text-center px-4 border border-dashed border-border-subtle rounded-[4px]">
                      <span className="text-[12px] text-text-tertiary">
                        {t("planToday.actions.noneSelected")}
                      </span>
                    </div>
                  ) : (
                    state.selectedActionIds.map((id, i) => renderSelectedRow(id, i))
                  )}
                </div>
                {state.selectedActionIds.length > 0 && totalEstMin > 0 && (
                  <div className="px-3 py-2 border-t border-border-subtle font-mono text-[11px] text-text-secondary tabular-nums">
                    {t("planToday.actions.estimatedTime", { time: formatTimeMin(totalEstMin) })}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* MAIN TASK */}
          <section>
            <div className="mb-4">
              <div className="flex items-center gap-2">
                <Star size={14} className="text-text-tertiary" />
                <div className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-tertiary">
                  {t("planToday.mainTask.heading")}
                </div>
              </div>
              <div className="text-[16px] md:text-[19px] font-medium text-text-primary mt-1 leading-snug">
                {t("planToday.mainTask.prompt")}
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
                      aria-label={t("planToday.mainTask.clearAria")}
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
                    {disabled ? t("planToday.mainTask.addActionsFirst") : t("planToday.mainTask.pickFromSelected")}
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
            <SectionHead meta={`${dueRituals.length}`} sub={t("planToday.rituals.sub")}>
              {t("planToday.rituals.heading")}
            </SectionHead>
            <div className="space-y-1">
              {dueRituals.length === 0 && (
                <div className="font-mono text-[11px] text-text-tertiary py-2">
                  {t("planToday.rituals.none")}
                </div>
              )}
              {dueRituals.map((r) => {
                const skipped = state.skippedRitualIds.has(r.id);
                const mult = ritualMultiplier(r.totalCompletions);
                const gColor = goalColor(r.goalId);
                return (
                  <div
                    key={r.id}
                    className={`relative flex items-center gap-2 pr-2 rounded-[3px] hover:bg-surface-hover transition-colors ${
                      skipped ? "opacity-50" : ""
                    }`}
                    style={{ minHeight: 54 }}
                  >
                    <span
                      className="absolute left-0 top-0 bottom-0"
                      style={{ background: gColor, width: 3 }}
                    />
                    <div className="min-w-0 flex-1" style={{ paddingLeft: 14 }}>
                      <div
                        className={`text-[14px] font-medium truncate ${
                          skipped ? "line-through text-text-tertiary" : "text-text-primary"
                        }`}
                      >
                        {r.title}
                      </div>
                      <div className="font-mono text-[12px] text-text-secondary truncate">
                        {r.schedule}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0" style={{ marginLeft: 4 }}>
                      <span
                        className="inline-flex items-center justify-center font-medium tabular-nums shrink-0"
                        style={{
                          padding: "4px 10px",
                          borderRadius: 4,
                          fontSize: 13,
                          width: 56,
                          textAlign: "center",
                          boxSizing: "border-box",
                          background: `color-mix(in srgb, ${gColor} 15%, transparent)`,
                          color: gColor,
                        }}
                      >
                        ×{mult.toFixed(2)}
                      </span>
                      <TimePill minutes={r.timeEstimateMinutes} />
                      <button
                        type="button"
                        onClick={() => toggleRitualSkip(r.id, !skipped)}
                        className="text-[12px] text-text-tertiary hover:text-text-primary transition shrink-0 px-2"
                      >
                        {skipped ? t("planToday.rituals.restore") : t("planToday.rituals.skip")}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
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

/* ═════════════ Plan Today — two-step wizard ═════════════ */

type DayTypeMeta = {
  value: DayType;
  labelKey: string;
  descriptionKey: string;
  Icon: LucideIcon;
  color: string; // hsl(var(--…))
  active: boolean; // execution / recovery → step 2; otherwise commit immediately
};

const DAY_TYPE_META: DayTypeMeta[] = [
  {
    value: "execution",
    labelKey: "planToday.dayType.execution.label",
    descriptionKey: "planToday.dayType.execution.description",
    Icon: Zap,
    color: "hsl(var(--state-active))",
    active: true,
  },
  {
    value: "recovery",
    labelKey: "planToday.dayType.recovery.label",
    descriptionKey: "planToday.dayType.recovery.description",
    Icon: Leaf,
    color: "hsl(var(--goal-3))",
    active: true,
  },
  {
    value: "day-off",
    labelKey: "planToday.dayType.dayOff.label",
    descriptionKey: "planToday.dayType.dayOff.description",
    Icon: Sun,
    color: "hsl(var(--state-stalled))",
    active: false,
  },
  {
    value: "sick",
    labelKey: "planToday.dayType.sick.label",
    descriptionKey: "planToday.dayType.sick.description",
    Icon: Thermometer,
    color: "hsl(var(--status-dropped))",
    active: false,
  },
];

/* Step 1 — centered hero with four colored Day Type cards. */
const DayTypeStep: React.FC<{ onPick: (m: DayTypeMeta) => void }> = ({ onPick }) => {
  const { t } = useTranslation();
  const [hover, setHover] = useState<DayType | null>(null);
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-10">
      <div className="flex flex-col items-center text-center">
        <h2 className="text-[22px] md:text-[26px] font-medium text-text-primary leading-tight">
          {t("planToday.dayTypeStep.heading")}
        </h2>
        <div className="text-[14px] text-text-secondary mt-2">
          {t("planToday.dayTypeStep.sub")}
        </div>
      </div>
      <div className="h-8 md:h-11" />
      <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {DAY_TYPE_META.map((m) => {
          const isHover = hover === m.value;
          return (
            <button
              key={m.value}
              type="button"
              onClick={() => onPick(m)}
              onMouseEnter={() => setHover(m.value)}
              onMouseLeave={() => setHover((h) => (h === m.value ? null : h))}
              className="text-left rounded-[6px] bg-surface-raised transition-colors flex flex-col items-start gap-3"
              style={{
                padding: 24,
                minHeight: 140,
                border: `1px solid ${isHover ? m.color : "hsl(var(--border-subtle))"}`,
                background: isHover ? "hsl(var(--surface-hover))" : "hsl(var(--surface-raised))",
                transitionDuration: "150ms",
                transitionTimingFunction: "ease-out",
              }}
            >
              <span
                className="inline-flex items-center justify-center rounded-full shrink-0"
                style={{
                  width: 40,
                  height: 40,
                  background: `color-mix(in srgb, ${m.color} 12%, transparent)`,
                  color: m.color,
                }}
              >
                <m.Icon size={20} />
              </span>
              <div className="text-[18px] font-medium text-text-primary">{t(m.labelKey)}</div>
              <div className="text-[13px] text-text-secondary leading-snug">
                {t(m.descriptionKey)}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

/* Compact day-type dropdown shown at top of step 2. */
const DayTypeChip: React.FC<{
  value: DayType;
  onChange: (next: DayTypeMeta) => void;
}> = ({ value, onChange }) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = DAY_TYPE_META.find((m) => m.value === value)!;

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-[4px] border border-border-subtle bg-transparent hover:bg-surface-hover transition-colors"
        style={{ padding: "6px 10px" }}
      >
        <span
          className="inline-block rounded-full shrink-0"
          style={{ width: 8, height: 8, background: current.color }}
        />
        <span className="text-[13px] text-text-primary">{t(current.labelKey)}</span>
        <span className="font-mono text-[10px] text-text-tertiary">▾</span>
      </button>
      {open && (
        <div
          className="absolute left-0 z-50 bg-surface-elevated border border-border-subtle rounded-[4px]"
          style={{ top: "calc(100% + 4px)", minWidth: 200, padding: "4px 0" }}
        >
          {DAY_TYPE_META.map((m) => {
            const selected = m.value === value;
            return (
              <button
                key={m.value}
                type="button"
                onClick={() => {
                  setOpen(false);
                  if (m.value !== value) onChange(m);
                }}
                className={`w-full flex items-center gap-2 text-left text-[13px] transition-colors ${
                  selected ? "bg-surface-hover" : "hover:bg-surface-hover"
                }`}
                style={{ padding: "6px 12px" }}
              >
                <span
                  className="inline-block rounded-full shrink-0"
                  style={{ width: 8, height: 8, background: m.color }}
                />
                <span className="flex-1 text-text-primary">{t(m.labelKey)}</span>
                {selected && (
                  <span style={{ color: "hsl(var(--accent))", fontSize: 12 }}>✓</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export const PlanTodayPage: React.FC<{ onCancel: () => void; onComplete: () => void }> = ({
  onCancel,
  onComplete,
}) => {
  const { t } = useTranslation();
  const date = todayISO();
  const startDayPlan = useStore((s) => s.startDayPlan);
  const updateAction = useStore((s) => s.updateAction);
  const actions = useStore((s) => s.actions);
  const [state, setState] = usePrefilledPlanState(date);
  const [step, setStep] = useState<1 | 2>(1);
  

  const commitAndComplete = (overrides?: {
    dayType?: DayType;
    selectedActionIds?: ID[];
    keptRitualIds?: Set<ID>;
    skippedRitualIds?: Set<ID>;
    mainTaskId?: ID;
  }) => {
    const merged = { ...state, ...overrides };
    const selectedSet = new Set(merged.selectedActionIds);
    actions
      .filter((a) => a.scheduledDate === date && !selectedSet.has(a.id))
      .forEach((a) => updateAction(a.id, { scheduledDate: undefined }));
    startDayPlan({
      date,
      dayType: merged.dayType,
      mainTaskActionId: merged.mainTaskId,
      morningEnergyScore: undefined,
      morningIntentNote: undefined,
      plannedActionIds: merged.selectedActionIds,
      plannedRitualIds: Array.from(merged.keptRitualIds),
      skippedRitualIds: Array.from(merged.skippedRitualIds),
    });
    const meta = DAY_TYPE_META.find((m) => m.value === merged.dayType);
    const aLabel = meta ? t(meta.labelKey) : t("planToday.dayType.fallback");
    if (merged.selectedActionIds.length === 0 && merged.keptRitualIds.size === 0) {
      toast.success(t("planToday.toast.dayStarted_simple", { label: aLabel }));
    } else {
      const actionsPart = t("planToday.toast.actions", { count: merged.selectedActionIds.length });
      const ritualsPart = t("planToday.toast.rituals", { count: merged.keptRitualIds.size });
      toast.success(t("planToday.toast.dayStarted_full", { actions: actionsPart, rituals: ritualsPart }));
    }
    onComplete();
  };

  const handlePickStep1 = (m: DayTypeMeta) => {
    if (m.active) {
      setState((s) => ({ ...s, dayType: m.value }));
      setStep(2);
    } else {
      // Day Off / Sick — skip step 2 entirely and commit empty plan.
      commitAndComplete({
        dayType: m.value,
        selectedActionIds: [],
        keptRitualIds: new Set(),
        skippedRitualIds: new Set(),
        mainTaskId: undefined,
      });
    }
  };

  const isDirty =
    state.selectedActionIds.length > 0 ||
    state.skippedRitualIds.size > 0 ||
    !!state.mainTaskId;

  const handleCancel = () => {
    if (step === 2 && isDirty && !confirm(t("planToday.confirm.discardProgress"))) return;
    onCancel();
  };

  const handleChipChange = (next: DayTypeMeta) => {
    if (!next.active) {
      // Switching to Day Off / Sick — confirm + discard selections.
      if (
        isDirty &&
        !confirm(t("planToday.confirm.switchDayType", { label: t(next.labelKey) }))
      ) {
        return;
      }
      commitAndComplete({
        dayType: next.value,
        selectedActionIds: [],
        keptRitualIds: new Set(),
        skippedRitualIds: new Set(),
        mainTaskId: undefined,
      });
      return;
    }
    // Execution ↔ Recovery — silent update.
    setState((s) => ({ ...s, dayType: next.value }));
  };

  const submitDisabled = !state.dayType;

  return (
    <div className="flex flex-col" style={{ minHeight: "calc(100vh - 96px)" }}>
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[28px] md:text-[32px] font-medium text-text-primary leading-tight">
            {t("planToday.title")}
          </h1>
          <div className="text-[14px] text-text-secondary mt-1">{formatLong(date)}</div>
        </div>
        <button
          type="button"
          onClick={handleCancel}
          className="text-[13px] text-text-secondary hover:text-text-primary transition shrink-0"
        >
          {t("planToday.cancel")}
        </button>
      </header>

      {step === 1 ? (
        <DayTypeStep onPick={handlePickStep1} />
      ) : (
        <div className="mt-8 space-y-8">
          {/* Compact day-type row */}
          <div className="flex items-center gap-2 pb-4 border-b border-border-subtle">
            <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-tertiary">
              {t("planToday.dayType.heading")}
            </span>
            {state.dayType && (
              <DayTypeChip value={state.dayType} onChange={handleChipChange} />
            )}
            <button
              type="button"
              onClick={() => setStep(1)}
              className="ml-2 text-[12px] text-text-tertiary hover:text-text-primary transition"
            >
              ← Back
            </button>
          </div>

          <PlanForm date={date} state={state} setState={setState} />

          {/* Footer */}
          <div className="flex items-center justify-between gap-3 pt-4 border-t border-border-subtle md:static max-md:fixed max-md:left-0 max-md:right-0 max-md:bottom-0 max-md:z-40 max-md:bg-surface-base max-md:border-t max-md:border-border-subtle max-md:px-4 max-md:py-3 max-md:[padding-bottom:calc(env(safe-area-inset-bottom)+12px)]">
            <button
              type="button"
              onClick={handleCancel}
              className="hidden md:inline text-[13px] text-text-secondary hover:text-text-primary transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => commitAndComplete()}
              disabled={submitDisabled}
              className="ml-auto w-full md:w-auto px-5 py-2.5 rounded-[4px] bg-[hsl(var(--accent))] text-white text-[14px] font-medium hover:brightness-110 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Start day
            </button>
          </div>
          <div className="h-16 md:hidden" />
        </div>
      )}
    </div>
  );
};

