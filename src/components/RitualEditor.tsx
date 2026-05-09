// Ritual editor — slide-in panel from the right. Controlled by the store's
// ui.activePanel slot (`{ kind: "ritual", mode, id?, prefill? }`).
//
// Edit mode autosaves on blur; new mode requires explicit Save. Today's
// completion is logged via markRitualInstanceDone (idempotent per day).
// Archive/restore route through dedicated store mutations.

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Check } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/store/useStore";
import type { ID, Ritual, RitualSchedule } from "@/types";
import { ConfirmModal } from "./ConfirmModal";
import { ritualMultiplier } from "@/store/useStore";
import { EditorShell, EditorCloseX, EditorCancelButton } from "./EditorShell";
import { ClampedNumberInput } from "./ClampedNumberInput";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";

const SCHEDULE_OPTIONS: { value: RitualSchedule; label: string }[] = [
  { value: "daily", label: "Daily" },
  { value: "weekdays", label: "Weekdays (Mon–Fri)" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "custom", label: "Custom days" },
];

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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
    if (!title.trim()) missing.push("Title");
    if (!(baseImpactNum >= 1 && baseImpactNum <= 10)) missing.push("Base Impact");
    if (!(timeNum > 0)) missing.push("Time");
    if (!goalId) missing.push("Goal");
    if (!schedule) missing.push("Schedule");
    return missing;
  }, [title, baseImpactNum, timeNum, goalId, schedule]);
  const canCreate = missingForCreate.length === 0;

  const handleSaveNew = () => {
    if (!canCreate) {
      let firstFocus: "title" | "impact" | "time" | "goal" | "schedule" | null = null;
      if (!title.trim()) {
        setTitleError("Add a title.");
        firstFocus = firstFocus ?? "title";
      }
      if (!(baseImpactNum >= 1 && baseImpactNum <= 10)) {
        setImpactError("Base Impact is required (1-10).");
        firstFocus = firstFocus ?? "impact";
      }
      if (!(timeNum > 0)) {
        setTimeError("Time is required.");
        firstFocus = firstFocus ?? "time";
      }
      if (!goalId) {
        setGoalError("Pick a goal.");
        firstFocus = firstFocus ?? "goal";
      }
      if (!schedule) {
        setScheduleError("Pick a schedule.");
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
    toast(`Ritual "${title.trim()}" created`);
    onClose();
  };

  const handleMarkDone = () => {
    if (!ritualId) return;
    if (doneToday) {
      toast("Already logged today");
      return;
    }
    markDone(ritualId);
    toast(`Logged · ${completions + 1} completion${completions + 1 === 1 ? "" : "s"}`);
  };

  const handleArchive = () => {
    if (!ritualId) return;
    archiveRitual(ritualId);
    toast("Ritual archived");
    setConfirmArchive(false);
    onClose();
  };

  const handleRestore = () => {
    if (!ritualId) return;
    restoreRitual(ritualId);
    toast("Ritual restored");
  };

  const handleDelete = () => {
    if (!ritualId) return;
    deleteRitual(ritualId);
    toast("Ritual deleted");
    setConfirmDelete(false);
    onClose();
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
            <div className="text-[18px] font-medium text-text-primary">New ritual</div>
          ) : (
            <div className="font-mono text-[11px] uppercase tracking-[0.08em] text-text-tertiary">
              {status === "archived" ? "Archived ritual" : "Edit ritual"}
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
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
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

        {/* Stats strip (edit only) */}
        {mode === "edit" && (
          <div className="grid grid-cols-3 gap-3 pb-2 border-b border-border-subtle">
            <Stat label="Completions" value={String(completions)} />
            <Stat label="Multiplier" value={`×${mult.toFixed(2)}`} />
            <Stat label="Effective" value={effective.toFixed(1)} />
          </div>
        )}

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
                if (mode === "edit") {
                  persistField("goalId", e.target.value);
                  persistField("projectId", null);
                }
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
                if (mode === "edit") persistField("projectId", v);
              }}
              className="bg-surface-raised border border-border-subtle rounded-[4px] px-2 py-1.5 text-[13px] text-text-primary outline-none"
            >
              <option value="">— Goal-level ritual —</option>
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
              if (mode === "edit") persistField("schedule", v);
            }}
            className="w-full bg-surface-raised border border-border-subtle rounded-[4px] px-2 py-1.5 text-[13px] text-text-primary outline-none"
          >
            {SCHEDULE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>

          {schedule === "weekly" && (
            <div className="mt-2">
              <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-text-tertiary mb-1">
                Day of week
              </div>
              <div className="flex gap-1">
                {WEEKDAY_LABELS.map((label, idx) => (
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
                    {label.slice(0, 1)}
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
                  if (mode === "edit") persistScheduleConfig({ monthDay: v });
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
                {WEEKDAY_LABELS.map((label, idx) => (
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
                    {label.slice(0, 1)}
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
                if (mode === "edit") persistScheduleConfig({ timeOfDay: e.target.value || undefined });
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
              onChange={(e) => setBaseImpact(Number(e.target.value))}
              onBlur={() => persistField("baseImpact", Number(baseImpact) || 0)}
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
          {/* Energy and Focus fields removed */}
        </div>

        {/* Status indicator (archived) */}
        {mode === "edit" && status === "archived" && (
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
      </div>

      {/* Footer */}
      <div className="border-t border-border-subtle px-6 py-3 flex items-center justify-between shrink-0">
        {mode === "new" ? (
          <>
            <EditorCancelButton />
            <button
              onClick={handleSaveNew}
              className="text-[13px] font-medium px-3 py-1.5 rounded-[4px]"
              style={{
                background: "hsl(var(--accent))",
                color: "hsl(var(--surface-base))",
              }}
            >
              Create ritual
            </button>
          </>
        ) : status === "archived" ? (
          <>
            <button
              onClick={() => setConfirmDelete(true)}
              className="text-[13px] text-text-tertiary hover:text-text-warning px-3 py-1.5"
            >
              Delete
            </button>
            <button
              onClick={handleRestore}
              className="text-[13px] font-medium px-3 py-1.5 rounded-[4px] border border-border-subtle text-text-primary hover:bg-surface-hover"
            >
              Restore
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setConfirmArchive(true)}
              className="text-[13px] text-text-tertiary hover:text-text-primary px-3 py-1.5"
            >
              Archive
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setConfirmDelete(true)}
                className="text-[13px] text-text-tertiary hover:text-text-warning px-3 py-1.5"
              >
                Delete
              </button>
              <button
                onClick={handleMarkDone}
                disabled={doneToday}
                className="text-[13px] font-medium px-3 py-1.5 rounded-[4px] disabled:opacity-50"
                style={{
                  background: "hsl(var(--accent))",
                  color: "hsl(var(--surface-base))",
                }}
              >
                {doneToday ? "Done today ✓" : "Mark today done"}
              </button>
            </div>
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
      <ConfirmModal
        open={confirmDelete}
        title="Delete this ritual?"
        body="This permanently removes the ritual and its completion history. This cannot be undone."
        confirmLabel="Delete"
        destructive
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

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-text-tertiary mb-1">
        {label}
      </div>
      {children}
    </div>
  );
}
