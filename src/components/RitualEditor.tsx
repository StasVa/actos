// Ritual editor — slide-in panel from the right. Controlled by the store's
// ui.activePanel slot (`{ kind: "ritual", mode, id?, prefill? }`).
//
// Edit mode autosaves on blur; new mode requires explicit Save. Today's
// completion is logged via markRitualInstanceDone (idempotent per day).
// Archive/restore route through dedicated store mutations.

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Check } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useStore } from "@/store/useStore";
import type { ID, Ritual, RitualSchedule } from "@/types";
import { ConfirmModal } from "./ConfirmModal";
import { ritualMultiplier } from "@/store/useStore";
import { EditorShell, EditorCloseX, EditorCancelButton } from "./EditorShell";
import {
  DeleteTypeConfirm,
  EditorOverflowMenu,
  MarkDoneButton,
  SaveIndicator,
  overflowDelete,
  overflowDrop,
  overflowDuplicate,
  useSaveIndicator,
} from "./EditorFooterControls";
import { MetricInfoPopover } from "./MetricInfoPopover";
import { ClampedNumberInput } from "./ClampedNumberInput";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";

const SCHEDULE_OPTIONS: { value: RitualSchedule; labelKey: string }[] = [
  { value: "daily", labelKey: "ritualEditor.schedule.daily" },
  { value: "weekdays", labelKey: "ritualEditor.schedule.weekdays" },
  { value: "weekly", labelKey: "ritualEditor.schedule.weekly" },
  { value: "monthly", labelKey: "ritualEditor.schedule.monthly" },
  { value: "custom", labelKey: "ritualEditor.schedule.custom" },
];

const WEEKDAY_LABEL_KEYS = [
  "ritualEditor.weekday.sun",
  "ritualEditor.weekday.mon",
  "ritualEditor.weekday.tue",
  "ritualEditor.weekday.wed",
  "ritualEditor.weekday.thu",
  "ritualEditor.weekday.fri",
  "ritualEditor.weekday.sat",
];

const todayISO = () => new Date().toISOString().slice(0, 10);

export function RitualEditor() {
  const panel = useStore((s) => s.ui.activePanel);
  const closePanel = useStore((s) => s.closePanel);
  const open = panel?.kind === "ritual";

  if (!open || panel?.kind !== "ritual") return null;

  return (
    <RitualEditorPanel
      key={(panel.mode === "edit" ? panel.id : "new") ?? "new"}
      mode={panel.mode}
      ritualId={panel.id}
      prefill={panel.prefill}
      onClose={closePanel}
    />
  );
}

function RitualEditorPanel({
  mode,
  ritualId,
  prefill,
  onClose,
}: {
  mode: "edit" | "new";
  ritualId?: ID;
  prefill?: Partial<Ritual>;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const ritual = useStore((s) => (ritualId ? s.rituals.find((r) => r.id === ritualId) : undefined));
  const goals = useStore((s) => s.goals);
  const projects = useStore((s) => s.projects);
  const layers = useStore((s) => s.settings.layers);

  const createRitual = useStore((s) => s.createRitual);
  const updateRitual = useStore((s) => s.updateRitual);
  const markDone = useStore((s) => s.markRitualInstanceDone);
  const archiveRitual = useStore((s) => s.archiveRitual);
  const restoreRitual = useStore((s) => s.restoreRitual);
  const deleteRitual = useStore((s) => s.deleteRitual);

  const seed: Partial<Ritual> = mode === "edit" && ritual ? ritual : prefill ?? {};
  const [title, setTitle] = useState(seed.title ?? "");
  const [goalId, setGoalId] = useState<ID>(
    seed.goalId ?? goals.find((g) => g.status === "active")?.id ?? goals[0]?.id ?? "",
  );
  const [projectId, setProjectId] = useState<ID | null>(seed.projectId ?? null);
  const [schedule, setSchedule] = useState<RitualSchedule>(seed.schedule ?? "daily");
  const [weekday, setWeekday] = useState<number>(seed.scheduleConfig?.weekday ?? 1);
  const [monthDay, setMonthDay] = useState<number>(seed.scheduleConfig?.monthDay ?? 1);
  const [customDays, setCustomDays] = useState<number[]>(
    seed.scheduleConfig?.customDays ?? [1, 3, 5],
  );
  const [timeOfDay, setTimeOfDay] = useState<string>(seed.scheduleConfig?.timeOfDay ?? "");
  const [baseImpact, setBaseImpact] = useState<number | "">(
    seed.baseImpact === undefined || seed.baseImpact === null ? (mode === "new" ? "" : 5) : (seed.baseImpact as number),
  );
  const [notes, setNotes] = useState<string>(seed.notes ?? "");
  const [timeMin, setTimeMin] = useState<number | "">(seed.timeEstimateMinutes ?? "");

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmArchive, setConfirmArchive] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  // Auto-save indicator (edit mode only).
  const { state: saveState, markEditing } = useSaveIndicator();
  useEffect(() => {
    if (mode !== "edit") return;
    const el = bodyRef.current;
    if (!el) return;
    const handler = () => markEditing();
    el.addEventListener("input", handler);
    el.addEventListener("change", handler);
    return () => {
      el.removeEventListener("input", handler);
      el.removeEventListener("change", handler);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  // New-mode UI state.
  const [titleError, setTitleError] = useState<string | null>(null);
  const [impactError, setImpactError] = useState<string | null>(null);
  const [timeError, setTimeError] = useState<string | null>(null);
  const [goalError, setGoalError] = useState<string | null>(null);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [notesExpanded, setNotesExpanded] = useState<boolean>(!!seed.notes);
  const [goalPopoverOpen, setGoalPopoverOpen] = useState(false);
  const [projectPopoverOpen, setProjectPopoverOpen] = useState(false);
  const goalPillRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    titleRef.current?.focus();
    if (mode === "new") titleRef.current?.select();
  }, [mode]);

  const status = ritual?.status ?? "active";
  const today = todayISO();
  const doneToday =
    ritual?.completionHistory.some((c) => c.date === today) ?? false;

  // Filter projects by selected goal.
  const projectsForGoal = useMemo(
    () => projects.filter((p) => p.status === "active" && p.goalId === goalId),
    [projects, goalId],
  );

  // Live multiplier preview from current totalCompletions.
  const completions = ritual?.totalCompletions ?? 0;
  const mult = ritualMultiplier(completions);
  const baseImpactNum = baseImpact === "" ? 0 : Number(baseImpact);
  const timeNum = timeMin === "" ? 0 : Number(timeMin);
  const effective = baseImpactNum * mult;

  const persistField = <K extends keyof Ritual>(field: K, value: Ritual[K]) => {
    if (mode !== "edit" || !ritualId) return;
    updateRitual(ritualId, { [field]: value } as Partial<Ritual>);
  };

  const persistScheduleConfig = (next: Partial<Ritual["scheduleConfig"]>) => {
    if (mode !== "edit" || !ritualId || !ritual) return;
    updateRitual(ritualId, {
      scheduleConfig: { ...(ritual.scheduleConfig ?? {}), ...next },
    });
  };

  const missingForCreate = useMemo(() => {
    const missing: string[] = [];
    if (!title.trim()) missing.push(t("ritualEditor.required.title"));
    if (!(baseImpactNum >= 1 && baseImpactNum <= 10)) missing.push(t("ritualEditor.required.baseImpact"));
    if (!(timeNum > 0)) missing.push(t("ritualEditor.required.time"));
    if (!goalId) missing.push(t("ritualEditor.required.goal"));
    if (!schedule) missing.push(t("ritualEditor.required.schedule"));
    return missing;
  }, [title, baseImpactNum, timeNum, goalId, schedule, t]);
  const canCreate = missingForCreate.length === 0;

  const handleSaveNew = () => {
    if (!canCreate) {
      let firstFocus: "title" | "impact" | "time" | "goal" | "schedule" | null = null;
      if (!title.trim()) {
        setTitleError(t("ritualEditor.error.titleRequired"));
        firstFocus = firstFocus ?? "title";
      }
      if (!(baseImpactNum >= 1 && baseImpactNum <= 10)) {
        setImpactError(t("ritualEditor.error.baseImpactRequired"));
        firstFocus = firstFocus ?? "impact";
      }
      if (!(timeNum > 0)) {
        setTimeError(t("ritualEditor.error.timeRequired"));
        firstFocus = firstFocus ?? "time";
      }
      if (!goalId) {
        setGoalError(t("ritualEditor.error.goalRequired"));
        firstFocus = firstFocus ?? "goal";
      }
      if (!schedule) {
        setScheduleError(t("ritualEditor.error.scheduleRequired"));
        firstFocus = firstFocus ?? "schedule";
      }
      if (firstFocus === "title") titleRef.current?.focus();
      else if (firstFocus === "impact") {
        document.querySelector<HTMLInputElement>('input[aria-label="Base Impact"]')?.focus();
      } else if (firstFocus === "time") {
        document.querySelector<HTMLInputElement>('input[aria-label="Time in minutes"]')?.focus();
      } else if (firstFocus === "goal") {
        goalPillRef.current?.focus();
        setGoalPopoverOpen(true);
      }
      return;
    }
    createRitual({
      title: title.trim(),
      goalId,
      projectId,
      schedule,
      scheduleConfig: {
        weekday: schedule === "weekly" ? weekday : undefined,
        monthDay: schedule === "monthly" ? monthDay : undefined,
        customDays: schedule === "custom" ? customDays : undefined,
      },
      baseImpact: baseImpactNum,
      notes: notes || undefined,
      timeEstimateMinutes: Number(timeMin),
    });
    toast(t("ritualEditor.toast.created", { title: title.trim() }));
    onClose();
  };

  const handleMarkDone = () => {
    if (!ritualId) return;
    if (doneToday) {
      toast(t("ritualEditor.toast.alreadyLogged"));
      return;
    }
    markDone(ritualId);
    toast(t("ritualEditor.toast.logged", { count: completions + 1 }));
  };

  const handleArchive = () => {
    if (!ritualId) return;
    archiveRitual(ritualId);
    toast(t("ritualEditor.toast.archived"));
    setConfirmArchive(false);
    onClose();
  };

  const handleRestore = () => {
    if (!ritualId) return;
    restoreRitual(ritualId);
    toast(t("ritualEditor.toast.restored"));
  };

  const handleDelete = () => {
    if (!ritualId) return;
    deleteRitual(ritualId);
    toast(t("ritualEditor.toast.deleted"));
    setConfirmDelete(false);
    onClose();
  };

  const handleDuplicate = () => {
    if (!ritual) return;
    const newId = createRitual({
      title: t("actionEditor.copyOf", { title: ritual.title }),
      goalId: ritual.goalId,
      projectId: ritual.projectId,
      schedule: ritual.schedule,
      scheduleConfig: ritual.scheduleConfig,
      baseImpact: ritual.baseImpact,
      notes: ritual.notes,
      timeEstimateMinutes: ritual.timeEstimateMinutes,
    });
    toast(t("ritualEditor.toast.duplicated"));
    useStore.getState().openPanel({ kind: "ritual", mode: "edit", id: newId });
  };

  const toggleCustomDay = (d: number) => {
    const next = customDays.includes(d)
      ? customDays.filter((x) => x !== d)
      : [...customDays, d].sort();
    setCustomDays(next);
    if (mode === "edit") persistScheduleConfig({ customDays: next });
  };

  const goalColor = useMemo(() => {
    const g = goals.find((x) => x.id === goalId);
    return g ? `hsl(var(--${g.color}))` : "hsl(var(--text-tertiary))";
  }, [goalId, goals]);

  const dirty =
    mode === "new" &&
    (!!title.trim() ||
      !!notes.trim() ||
      timeMin !== "");

  return (
    <EditorShell mode={mode} dirty={dirty} onClose={onClose}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: goalColor }} />
          {mode === "new" ? (
            <div className="text-[18px] font-medium text-text-primary">{t("ritualEditor.header.new")}</div>
          ) : (
            <div className="font-mono text-[11px] uppercase tracking-[0.08em] text-text-tertiary">
              {status === "archived" ? t("ritualEditor.header.archived") : t("ritualEditor.header.edit")}
            </div>
          )}
        </div>
        {mode === "new" ? (
          <EditorCloseX />
        ) : (
          <button
            onClick={onClose}
            className="w-7 h-7 inline-flex items-center justify-center rounded-[4px] text-text-tertiary hover:bg-surface-hover hover:text-text-primary transition-colors"
          >
            ✕
          </button>
        )}
      </div>

      {/* Body */}
      <div ref={bodyRef} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
        {mode === "new" ? (
          <>
            {/* Title */}
            <div>
              <input
                ref={titleRef}
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (e.target.value.trim()) setTitleError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSaveNew();
                  }
                }}
                placeholder={t("ritualEditor.titlePlaceholder")}
                className="w-full bg-transparent outline-none text-[18px] font-medium text-text-primary placeholder:text-text-tertiary"
              />
              {titleError && <InlineError text={titleError} />}
            </div>

            {/* ESTIMATES */}
            <div>
              <SectionHeadRequired label={t("ritualEditor.section.estimates")} required />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FieldRow label={t("ritualEditor.field.baseImpact")} info={<MetricInfoPopover variant="ritualImpact" ariaLabel={t("ritualEditor.field.baseImpactInfoAria")} />}>
                  <ClampedNumberInput
                    value={baseImpact}
                    min={1}
                    max={10}
                    step={1}
                    placeholder={t("ritualEditor.field.baseImpactPlaceholder")}
                    required
                    requiredMessage={t("ritualEditor.error.baseImpactRequired")}
                    ariaLabel="Base Impact"
                    onChange={(v) => {
                      setBaseImpact(v);
                      if (v !== "" && typeof v === "number" && v >= 1 && v <= 10) {
                        setImpactError(null);
                      }
                    }}
                    onCommit={() => {}}
                  />
                  {impactError && <InlineError text={impactError} />}
                </FieldRow>
                <FieldRow label={t("ritualEditor.field.timeRequired")}>
                  <ClampedNumberInput
                    value={timeMin}
                    min={1}
                    max={600}
                    step={5}
                    placeholder={t("ritualEditor.field.timePlaceholder")}
                    required
                    requiredMessage={t("ritualEditor.error.timeRequired")}
                    ariaLabel="Time in minutes"
                    onChange={(v) => {
                      setTimeMin(v);
                      if (v !== "" && typeof v === "number" && v > 0) setTimeError(null);
                    }}
                    onCommit={() => {}}
                  />
                  {timeError && <InlineError text={timeError} />}
                </FieldRow>
              </div>
            </div>

            {/* PARENT — inline pill popovers */}
            <div>
              <SectionHeadRequired label={t("ritualEditor.section.parent")} required />
              <div className="flex items-center gap-2 flex-wrap text-[13px]">
                <Popover open={goalPopoverOpen} onOpenChange={setGoalPopoverOpen}>
                  <PopoverTrigger asChild>
                    <button
                      ref={goalPillRef}
                      type="button"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] border text-[13px] text-text-primary hover:bg-surface-hover transition-colors max-w-[200px]"
                      style={{
                        background: "hsl(var(--surface-raised))",
                        borderColor: goalError
                          ? "hsl(var(--text-warning))"
                          : "hsl(var(--border-default))",
                        height: 32,
                      }}
                      title={goals.find((g) => g.id === goalId)?.title ?? t("ritualEditor.field.pickGoal")}
                    >
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ background: goalColor }}
                      />
                      <span className="truncate">
                        {goals.find((g) => g.id === goalId)?.title ?? t("ritualEditor.field.pickGoal")}
                      </span>
                      <ChevronDown size={12} className="text-text-tertiary shrink-0" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    align="start"
                    className="z-[210] w-[260px] p-1 bg-surface-raised border border-border-default"
                  >
                    {goals
                      .filter((g) => g.status === "active")
                      .map((g) => (
                        <button
                          key={g.id}
                          type="button"
                          onClick={() => {
                            setGoalId(g.id);
                            setProjectId(null);
                            setGoalError(null);
                            setGoalPopoverOpen(false);
                          }}
                          className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-[13px] rounded-[3px] hover:bg-surface-hover ${
                            g.id === goalId ? "text-[hsl(var(--accent))]" : "text-text-primary"
                          }`}
                        >
                          <span className="flex items-center gap-2 truncate">
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ background: `hsl(var(--${g.color}))` }}
                            />
                            <span className="truncate">{g.title}</span>
                          </span>
                          {g.id === goalId && (
                            <Check size={14} className="text-[hsl(var(--accent))]" />
                          )}
                        </button>
                      ))}
                  </PopoverContent>
                </Popover>

                <Popover open={projectPopoverOpen} onOpenChange={setProjectPopoverOpen}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] border text-[13px] text-text-primary hover:bg-surface-hover transition-colors max-w-[200px]"
                      style={{
                        background: "hsl(var(--surface-raised))",
                        borderColor: "hsl(var(--border-default))",
                        height: 32,
                      }}
                      title={
                        projectId
                          ? projects.find((p) => p.id === projectId)?.title ?? ""
                          : t("ritualEditor.field.goalLevel")
                      }
                    >
                      <span className="truncate">
                        {projectId
                          ? projects.find((p) => p.id === projectId)?.title ?? t("ritualEditor.section.parent")
                          : t("ritualEditor.field.goalLevel")}
                      </span>
                      <ChevronDown size={12} className="text-text-tertiary shrink-0" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    align="start"
                    className="z-[210] w-[260px] p-1 bg-surface-raised border border-border-default"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setProjectId(null);
                        setProjectPopoverOpen(false);
                      }}
                      className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-[13px] rounded-[3px] hover:bg-surface-hover ${
                        !projectId ? "text-[hsl(var(--accent))]" : "text-text-primary"
                      }`}
                    >
                      <span className="truncate">{t("ritualEditor.field.goalLevelOption")}</span>
                      {!projectId && (
                        <Check size={14} className="text-[hsl(var(--accent))]" />
                      )}
                    </button>
                    {projectsForGoal.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setProjectId(p.id);
                          setProjectPopoverOpen(false);
                        }}
                        className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-[13px] rounded-[3px] hover:bg-surface-hover ${
                          p.id === projectId ? "text-[hsl(var(--accent))]" : "text-text-primary"
                        }`}
                      >
                        <span className="truncate">{p.title}</span>
                        {p.id === projectId && (
                          <Check size={14} className="text-[hsl(var(--accent))]" />
                        )}
                      </button>
                    ))}
                  </PopoverContent>
                </Popover>
              </div>
              {goalError && <InlineError text={goalError} />}
            </div>

            {/* SCHEDULE */}
            <div>
              <SectionHeadRequired label="Schedule" required />
              <select
                value={schedule}
                onChange={(e) => {
                  setSchedule(e.target.value as RitualSchedule);
                  setScheduleError(null);
                }}
                className="w-full bg-surface-raised border border-border-subtle rounded-[4px] px-2 py-1.5 text-[13px] text-text-primary outline-none"
              >
                {SCHEDULE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {t(o.labelKey)}
                  </option>
                ))}
              </select>

              {schedule === "weekly" && (
                <div className="mt-2">
                  <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-text-tertiary mb-1">
                    Day of week
                  </div>
                  <div className="flex gap-1">
                    {WEEKDAY_LABEL_KEYS.map((labelKey, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setWeekday(idx)}
                        className="flex-1 text-[11px] py-1.5 rounded-[4px] border transition-colors"
                        style={{
                          background: weekday === idx ? "hsl(var(--surface-elevated))" : "transparent",
                          borderColor: weekday === idx ? "hsl(var(--accent))" : "hsl(var(--border-subtle))",
                          color: weekday === idx ? "hsl(var(--text-primary))" : "hsl(var(--text-secondary))",
                        }}
                      >
                        {t(labelKey).slice(0, 1)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {schedule === "monthly" && (
                <div className="mt-2">
                  <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-text-tertiary mb-1">
                    Day of month
                  </div>
                  <input
                    type="number"
                    min={1}
                    max={31}
                    value={monthDay}
                    onChange={(e) => {
                      const v = Math.max(1, Math.min(31, Number(e.target.value)));
                      setMonthDay(v);
                    }}
                    className="w-24 bg-surface-raised border border-border-subtle rounded-[4px] px-2 py-1.5 text-[13px] text-text-primary outline-none"
                  />
                </div>
              )}

              {schedule === "custom" && (
                <div className="mt-2">
                  <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-text-tertiary mb-1">
                    Days of week
                  </div>
                  <div className="flex gap-1">
                    {WEEKDAY_LABEL_KEYS.map((labelKey, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => toggleCustomDay(idx)}
                        className="flex-1 text-[11px] py-1.5 rounded-[4px] border transition-colors"
                        style={{
                          background: customDays.includes(idx)
                            ? "hsl(var(--surface-elevated))"
                            : "transparent",
                          borderColor: customDays.includes(idx)
                            ? "hsl(var(--accent))"
                            : "hsl(var(--border-subtle))",
                          color: customDays.includes(idx)
                            ? "hsl(var(--text-primary))"
                            : "hsl(var(--text-secondary))",
                        }}
                      >
                        {t(labelKey).slice(0, 1)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {scheduleError && <InlineError text={scheduleError} />}
            </div>

            {/* NOTES (collapsed by default) */}
            <div>
              {notesExpanded ? (
                <>
                  <SectionHead>Notes</SectionHead>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add notes..."
                    rows={3}
                    autoFocus
                    className="w-full bg-surface-raised border border-border-subtle rounded-[4px] px-2 py-1.5 text-[13px] text-text-primary placeholder:text-text-tertiary outline-none resize-y"
                  />
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setNotesExpanded(true)}
                  className="text-[13px] text-text-tertiary hover:text-text-primary transition-colors"
                >
                  + Add notes
                </button>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Title */}
            <div>
              <input
                ref={titleRef}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={() => persistField("title", title.trim())}
                placeholder="Ritual title"
                className="w-full bg-transparent outline-none text-[18px] font-medium text-text-primary placeholder:text-text-tertiary"
              />
            </div>

            {/* Stats strip */}
            <div className="grid grid-cols-3 gap-3 pb-2 border-b border-border-subtle">
              <Stat label="Completions" value={String(completions)} />
              <Stat label="Multiplier" value={`×${mult.toFixed(2)}`} />
              <Stat label="Effective" value={effective.toFixed(1)} />
            </div>

            {/* Parent (goal + project) */}
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-text-tertiary mb-2">
                Parent
              </div>
              <div className="flex flex-col gap-2">
                <select
                  value={goalId}
                  onChange={(e) => {
                    setGoalId(e.target.value);
                    setProjectId(null);
                    persistField("goalId", e.target.value);
                    persistField("projectId", null);
                  }}
                  className="bg-surface-raised border border-border-subtle rounded-[4px] px-2 py-1.5 text-[13px] text-text-primary outline-none"
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
                  value={projectId ?? ""}
                  onChange={(e) => {
                    const v = e.target.value || null;
                    setProjectId(v);
                    persistField("projectId", v);
                  }}
                  className="bg-surface-raised border border-border-subtle rounded-[4px] px-2 py-1.5 text-[13px] text-text-primary outline-none"
                >
                  <option value="">{t("ritualEditor.field.goalLevelOption")}</option>
                  {projectsForGoal.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Schedule */}
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-text-tertiary mb-2">
                Schedule
              </div>
              <select
                value={schedule}
                onChange={(e) => {
                  const v = e.target.value as RitualSchedule;
                  setSchedule(v);
                  persistField("schedule", v);
                }}
                className="w-full bg-surface-raised border border-border-subtle rounded-[4px] px-2 py-1.5 text-[13px] text-text-primary outline-none"
              >
                {SCHEDULE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {t(o.labelKey)}
                  </option>
                ))}
              </select>

              {schedule === "weekly" && (
                <div className="mt-2">
                  <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-text-tertiary mb-1">
                    Day of week
                  </div>
                  <div className="flex gap-1">
                    {WEEKDAY_LABEL_KEYS.map((labelKey, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setWeekday(idx);
                          persistScheduleConfig({ weekday: idx });
                        }}
                        className="flex-1 text-[11px] py-1.5 rounded-[4px] border transition-colors"
                        style={{
                          background: weekday === idx ? "hsl(var(--surface-elevated))" : "transparent",
                          borderColor: weekday === idx ? "hsl(var(--accent))" : "hsl(var(--border-subtle))",
                          color: weekday === idx ? "hsl(var(--text-primary))" : "hsl(var(--text-secondary))",
                        }}
                      >
                        {t(labelKey).slice(0, 1)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {schedule === "monthly" && (
                <div className="mt-2">
                  <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-text-tertiary mb-1">
                    Day of month
                  </div>
                  <input
                    type="number"
                    min={1}
                    max={31}
                    value={monthDay}
                    onChange={(e) => {
                      const v = Math.max(1, Math.min(31, Number(e.target.value)));
                      setMonthDay(v);
                      persistScheduleConfig({ monthDay: v });
                    }}
                    className="w-24 bg-surface-raised border border-border-subtle rounded-[4px] px-2 py-1.5 text-[13px] text-text-primary outline-none"
                  />
                </div>
              )}

              {schedule === "custom" && (
                <div className="mt-2">
                  <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-text-tertiary mb-1">
                    Days of week
                  </div>
                  <div className="flex gap-1">
                    {WEEKDAY_LABEL_KEYS.map((labelKey, idx) => (
                      <button
                        key={idx}
                        onClick={() => toggleCustomDay(idx)}
                        className="flex-1 text-[11px] py-1.5 rounded-[4px] border transition-colors"
                        style={{
                          background: customDays.includes(idx)
                            ? "hsl(var(--surface-elevated))"
                            : "transparent",
                          borderColor: customDays.includes(idx)
                            ? "hsl(var(--accent))"
                            : "hsl(var(--border-subtle))",
                          color: customDays.includes(idx)
                            ? "hsl(var(--text-primary))"
                            : "hsl(var(--text-secondary))",
                        }}
                      >
                        {t(labelKey).slice(0, 1)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-2">
                <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-text-tertiary mb-1">
                  Time of day (optional)
                </div>
                <input
                  type="time"
                  value={timeOfDay}
                  onChange={(e) => {
                    setTimeOfDay(e.target.value);
                    persistScheduleConfig({ timeOfDay: e.target.value || undefined });
                  }}
                  className="w-32 bg-surface-raised border border-border-subtle rounded-[4px] px-2 py-1.5 text-[13px] text-text-primary outline-none"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-text-tertiary mb-2">
                Notes
              </div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                onBlur={() => persistField("notes", notes || undefined)}
                placeholder="Add notes..."
                rows={3}
                className="w-full bg-surface-raised border border-border-subtle rounded-[4px] px-2 py-1.5 text-[13px] text-text-primary placeholder:text-text-tertiary outline-none resize-y"
              />
            </div>

            {/* Impact + costs */}
            <div className="grid grid-cols-2 gap-3">
              <FieldRow label="Base impact (0-10)">
                <input
                  type="number"
                  min={0}
                  max={10}
                  value={baseImpact}
                  onChange={(e) =>
                    setBaseImpact(e.target.value === "" ? "" : Number(e.target.value))
                  }
                  onBlur={() => persistField("baseImpact", baseImpactNum || 0)}
                  className="w-full bg-surface-raised border border-border-subtle rounded-[4px] px-2 py-1.5 text-[13px] text-text-primary outline-none"
                />
              </FieldRow>
              <FieldRow label="Time (min)">
                <input
                  type="number"
                  min={0}
                  value={timeMin}
                  onChange={(e) => setTimeMin(e.target.value === "" ? "" : Number(e.target.value))}
                  onBlur={() =>
                    persistField(
                      "timeEstimateMinutes",
                      timeMin === "" ? undefined : Number(timeMin),
                    )
                  }
                  className="w-full bg-surface-raised border border-border-subtle rounded-[4px] px-2 py-1.5 text-[13px] text-text-primary outline-none"
                />
              </FieldRow>
            </div>

            {/* Status indicator (archived) */}
            {status === "archived" && (
              <div
                className="text-[12px] px-3 py-2 rounded-[4px] border"
                style={{
                  borderColor: "hsl(var(--border-subtle))",
                  background: "hsl(var(--surface-raised))",
                  color: "hsl(var(--text-secondary))",
                }}
              >
                Archived. Restore to resume tracking and multiplier growth.
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-border-subtle px-6 py-3 flex items-center justify-between shrink-0">
        {mode === "new" ? (
          <>
            <EditorCancelButton />
            <button
              onClick={handleSaveNew}
              className="text-[13px] font-medium px-3 py-1.5 rounded-[4px] transition-colors cursor-pointer"
              style={{
                background: canCreate ? "hsl(var(--accent))" : "hsl(var(--accent) / 0.4)",
                color: "hsl(var(--surface-base))",
              }}
            >
              Create ritual
            </button>
          </>
        ) : status === "archived" ? (
          <>
            <div className="flex items-center gap-3">
              <EditorOverflowMenu
                items={[
                  overflowDuplicate(handleDuplicate),
                  overflowDelete(() => setConfirmDelete(true)),
                ]}
              />
              <SaveIndicator state={saveState} />
            </div>
            <button
              onClick={handleRestore}
              className="text-[13px] font-medium px-3 py-1.5 rounded-[4px] border border-border-subtle text-text-primary hover:bg-surface-hover"
            >
              Restore
            </button>
          </>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <EditorOverflowMenu
                items={[
                  overflowDuplicate(handleDuplicate),
                  overflowDrop(() => setConfirmArchive(true), "Archive"),
                  overflowDelete(() => setConfirmDelete(true)),
                ]}
              />
              <SaveIndicator state={saveState} />
            </div>
            <MarkDoneButton
              onClick={handleMarkDone}
              disabled={doneToday}
              disabledTooltip={doneToday ? "Already logged today" : undefined}
              label={doneToday ? "Done today" : "Mark today done"}
            />
          </>
        )}
      </div>

      <ConfirmModal
        open={confirmArchive}
        title="Archive this ritual?"
        body="Completion history is preserved. You can restore it later."
        confirmLabel="Archive"
        onCancel={() => setConfirmArchive(false)}
        onConfirm={handleArchive}
      />
      <DeleteTypeConfirm
        open={confirmDelete}
        title="Delete this ritual?"
        body="This permanently removes the ritual and its completion history. This cannot be undone."
        onCancel={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
      />
    </EditorShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-mono text-[18px] tabular-nums text-text-primary">{value}</div>
      <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-text-tertiary mt-0.5">
        {label}
      </div>
    </div>
  );
}

function FieldRow({ label, info, children }: { label: React.ReactNode; info?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1">
        <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-text-tertiary">
          {label}
        </div>
        {info}
      </div>
      {children}
    </div>
  );
}

function SectionHead({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-tertiary mb-3">
      {children}
    </div>
  );
}

function SectionHeadRequired({ label, required }: { label: string; required?: boolean }) {
  return (
    <div className="mb-3 flex items-baseline gap-1.5">
      <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-tertiary">
        {label}
      </span>
      {required && (
        <span
          className="text-[12px]"
          style={{ color: "hsl(var(--text-tertiary))", fontFamily: "Inter, sans-serif" }}
        >
          *
        </span>
      )}
    </div>
  );
}

function InlineError({ text }: { text: string }) {
  return (
    <div
      className="mt-1 text-[12px]"
      style={{ color: "hsl(var(--text-warning))", fontFamily: "Inter, sans-serif" }}
    >
      {text}
    </div>
  );
}
