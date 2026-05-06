// Action editor — slide-in panel from the right. Controlled by the store's
// ui.activePanel slot (`{ kind: "action", mode, id?, prefill? }`).
//
// Edit mode: autosaves on blur. New mode: explicit Save button.
// Status changes route through changeActionStatus so timeline events,
// timestamps and cascades stay correct.
//
// Field order (top → bottom):
//   Title → Parent (Goal+Project) → ESTIMATES (Impact, Energy, Focus, Time)
//   → STATE (Status dropdown, Scheduled date when Planned, Delegation block
//   when Delegated, contextual timestamp line) → NOTES.

import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, Check, MoreHorizontal, Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "sonner";
import { useStore } from "@/store/useStore";
import type { Action, ActionStatus, ID } from "@/types";
import { ConfirmModal } from "./ConfirmModal";
import { ClampedNumberInput } from "./ClampedNumberInput";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// "planned" is intentionally excluded from the dropdown — it's a derived
// state from the presence of `scheduledDate`. Users transition into Planned
// by picking a date in the SCHEDULED DATE section, not by selecting an
// option here. The trigger still displays "Planned" via STATUS_LABEL when
// the action is in that state.
export const STATUS_ORDER: ActionStatus[] = [
  "backlog",
  "done",
  "delegated",
  "dropped",
  "cancelled",
];
export const STATUS_LABEL: Record<ActionStatus, string> = {
  backlog: "Backlog",
  planned: "Planned",
  done: "Done",
  delegated: "Delegated",
  dropped: "Dropped",
  cancelled: "Cancelled",
};
const STATUS_COLOR: Record<ActionStatus, string> = {
  backlog: "hsl(var(--text-tertiary))",
  planned: "hsl(var(--accent))",
  done: "hsl(var(--state-active))",
  delegated: "hsl(var(--text-secondary))",
  dropped: "hsl(var(--state-stalled))",
  cancelled: "hsl(var(--state-stalled))",
};

const TODAY_ISO = () => new Date().toISOString().slice(0, 10);
function addDaysISO(iso: string, n: number): string {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function fmtRelDate(iso: string): string {
  const today = TODAY_ISO();
  if (iso === today) return "today";
  if (iso === addDaysISO(today, 1)) return "tomorrow";
  if (iso === addDaysISO(today, -1)) return "yesterday";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
function fmtRelFromNow(isoTime: string): string {
  const dDate = isoTime.slice(0, 10);
  const today = TODAY_ISO();
  const days = Math.round(
    (new Date(today + "T00:00:00").getTime() -
      new Date(dDate + "T00:00:00").getTime()) /
      86400000,
  );
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  return new Date(dDate + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function ActionEditor() {
  const panel = useStore((s) => s.ui.activePanel);
  const closePanel = useStore((s) => s.closePanel);

  const open = panel?.kind === "action";

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closePanel();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, closePanel]);

  if (!open || panel?.kind !== "action") return null;

  return (
    <>
      <div
        className="fixed inset-0 z-[80]"
        style={{ background: "rgba(0,0,0,0.4)" }}
        onClick={closePanel}
      />
      <ActionEditorPanel
        key={(panel.mode === "edit" ? panel.id : "new") ?? "new"}
        mode={panel.mode}
        actionId={panel.id}
        prefill={panel.prefill}
        onClose={closePanel}
      />
    </>
  );
}

function ActionEditorPanel({
  mode,
  actionId,
  prefill,
  onClose,
}: {
  mode: "edit" | "new";
  actionId?: ID;
  prefill?: Partial<Action>;
  onClose: () => void;
}) {
  const action = useStore((s) =>
    actionId ? s.actions.find((a) => a.id === actionId) : undefined,
  );
  const projects = useStore((s) => s.projects);
  const goals = useStore((s) => s.goals);
  const allActions = useStore((s) => s.actions);
  const layers = useStore((s) => s.settings.layers);

  const updateAction = useStore((s) => s.updateAction);
  const createAction = useStore((s) => s.createAction);
  const changeActionStatus = useStore((s) => s.changeActionStatus);
  const deleteAction = useStore((s) => s.deleteAction);

  const seed: Partial<Action> = mode === "edit" && action ? action : prefill ?? {};
  const [title, setTitle] = useState(seed.title ?? "");
  const [projectId, setProjectId] = useState<ID | null>(seed.projectId ?? null);
  const [goalId, setGoalId] = useState<ID>(
    seed.goalId ?? goals.find((g) => g.status === "active")?.id ?? goals[0]?.id ?? "",
  );
  const [scheduledDate, setScheduledDate] = useState<string>(seed.scheduledDate ?? "");
  const [notes, setNotes] = useState<string>(seed.notes ?? "");
  const [impact, setImpact] = useState<number | "">(
    seed.impact === undefined || seed.impact === null ? "" : (seed.impact as number),
  );
  const [impactError, setImpactError] = useState<string | null>(null);
  const [timeError, setTimeError] = useState<string | null>(null);
  const [delegateError, setDelegateError] = useState<string | null>(null);
  const [timeMin, setTimeMin] = useState<number | "">(seed.timeEstimateMinutes ?? "");
  const [energy, setEnergy] = useState<number | "">(seed.energyCost ?? "");
  const [focus, setFocus] = useState<number | "">(seed.focusCost ?? "");
  const [delegateName, setDelegateName] = useState<string>(seed.delegateName ?? "");
  const [delegateNote, setDelegateNote] = useState<string>(seed.delegateNote ?? "");
  const [expectedReturn, setExpectedReturn] = useState<string>(seed.expectedReturnDate ?? "");

  // For new-mode local status selection.
  const [newStatus, setNewStatus] = useState<ActionStatus>(seed.status ?? "backlog");

  // (Planned is derived from scheduledDate — no separate "needs date" state.)

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmDrop, setConfirmDrop] = useState<ActionStatus | null>(null);
  const [confirmPastDate, setConfirmPastDate] = useState<string | null>(null);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    titleRef.current?.focus();
    if (mode === "new") titleRef.current?.select();
  }, [mode]);

  const persistField = <K extends keyof Action>(field: K, value: Action[K]) => {
    if (mode !== "edit" || !actionId) return;
    updateAction(actionId, { [field]: value } as Partial<Action>);
  };

  const projectsByGoal = useMemo(() => {
    const groups = new Map<ID, typeof projects>();
    for (const p of projects) {
      if (p.status !== "active") continue;
      if (!groups.has(p.goalId)) groups.set(p.goalId, []);
      groups.get(p.goalId)!.push(p);
    }
    return goals
      .filter((g) => g.status === "active")
      .map((g) => ({ goal: g, projects: groups.get(g.id) ?? [] }));
  }, [projects, goals]);

  // Autocomplete for delegate names from existing actions.
  const delegateSuggestions = useMemo(() => {
    const set = new Set<string>();
    for (const a of allActions) {
      if (a.delegateName) set.add(a.delegateName);
    }
    return Array.from(set).sort();
  }, [allActions]);

  const status: ActionStatus = mode === "edit" ? action?.status ?? "backlog" : newStatus;
  const isGoalLevel = !projectId;

  // ─── Required-field validation ───
  const impactNum = impact === "" ? 0 : Number(impact);
  const timeNum = timeMin === "" ? 0 : Number(timeMin);
  const requireTime = layers.logTime;

  const missingForCreate = useMemo(() => {
    const missing: string[] = [];
    if (!title.trim()) missing.push("Title");
    if (!goalId) missing.push("Goal");
    if (!(impactNum > 0)) missing.push("Impact");
    if (requireTime && !(timeNum > 0)) missing.push("Time estimate");
    if (newStatus === "delegated" && !delegateName.trim()) missing.push("Delegate name");
    return missing;
  }, [title, goalId, impactNum, requireTime, timeNum, newStatus, delegateName]);

  const canCreate = missingForCreate.length === 0;
  const createTooltip =
    missingForCreate.length === 0
      ? ""
      : `Set ${missingForCreate.join(" and ")} to create`;

  // Existing-action migration warning: action exists with no impact value.
  const hasMigrationWarning =
    mode === "edit" && !!action && (action.impact === undefined || action.impact === null || action.impact <= 0);

  // ─── Status transitions (edit mode) ───
  // Note: "planned" is never passed here from the dropdown (it's not an
  // option). Planned transitions are handled by handleScheduledDateChange.
  const handleStatusChange = (next: ActionStatus) => {
    if (isGoalLevel && next !== "backlog") {
      toast.error("Assign to a Project to plan or complete this action.");
      return;
    }
    if (mode === "new") {
      setNewStatus(next);
      return;
    }
    if (!actionId) return;
    if (next === status) return;
    // Block Done if Impact / Time missing
    if (next === "done") {
      if (!(impactNum > 0)) {
        setImpactError("Impact is required to mark this action Done.");
        toast.error("Set Impact to mark Done");
        return;
      }
      if (requireTime && !(timeNum > 0)) {
        setTimeError("Time estimate required when Log Time is on.");
        toast.error("Set Time estimate to mark Done");
        return;
      }
    }
    if (next === "delegated") {
      if (!delegateName.trim()) {
        setDelegateError("Enter delegate name.");
        // Switch UI into delegated state so the field appears
        changeActionStatus(actionId, "delegated", {
          delegateName: "",
        });
        toast.error("Enter delegate name");
        return;
      }
      changeActionStatus(actionId, "delegated", {
        delegateName: delegateName || "",
        delegateNote: delegateNote || undefined,
        expectedReturnDate: expectedReturn || undefined,
      });
      toast(`Delegated${delegateName ? ` to ${delegateName}` : ""}`);
      return;
    }
    if (next === "dropped" || next === "cancelled") {
      setConfirmDrop(next);
      return;
    }
    setImpactError(null);
    setTimeError(null);
    changeActionStatus(actionId, next);
    if (next === "done") toast("Action marked done");
    if (next === "backlog") toast("Action re-opened");
  };

  const confirmDropAction = () => {
    if (!actionId || !confirmDrop) return;
    changeActionStatus(actionId, confirmDrop);
    toast(confirmDrop === "dropped" ? "Action dropped" : "Action cancelled");
    setConfirmDrop(null);
  };

  // Setting a scheduled date auto-derives status to "Planned".
  // Clearing it returns to "Backlog". plannedAt history is preserved by
  // the store transition logic.
  // Past dates trigger a confirmation modal — "planned in the past" is
  // semantically wrong, so we offer to mark the action Done on that date.
  const handleScheduledDateChange = (iso: string) => {
    if (isGoalLevel && iso) {
      toast.error("Assign to a Project to schedule this action.");
      return;
    }
    if (iso && iso < TODAY_ISO()) {
      setConfirmPastDate(iso);
      return;
    }
    setScheduledDate(iso);
    if (mode === "new") {
      setNewStatus(iso ? "planned" : "backlog");
      return;
    }
    if (!actionId) return;
    if (iso) {
      changeActionStatus(actionId, "planned", { scheduledDate: iso });
      toast("Action scheduled");
    } else {
      changeActionStatus(actionId, "backlog");
      persistField("scheduledDate", undefined);
      toast("Action moved to Backlog");
    }
  };

  const confirmMarkDoneOnPast = () => {
    const iso = confirmPastDate;
    if (!iso) return;
    const shortLabel = new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    // Build a completedAt timestamp anchored at noon on the picked date so
    // it lands cleanly inside the local day for review drill-downs.
    const completedAt = new Date(iso + "T12:00:00").toISOString();
    setScheduledDate(iso);
    if (mode === "new") {
      setNewStatus("done");
      setConfirmPastDate(null);
      toast(`Marked done on ${shortLabel}`);
      return;
    }
    if (!actionId) {
      setConfirmPastDate(null);
      return;
    }
    changeActionStatus(actionId, "done");
    // Override timestamps: completedAt = picked date, scheduledDate kept
    // as historical record, plannedAt cleared (never genuinely planned).
    updateAction(actionId, {
      completedAt,
      scheduledDate: iso,
      plannedAt: undefined,
    });
    setConfirmPastDate(null);
    toast(`Marked done on ${shortLabel}`);
  };

  const handleSaveNew = () => {
    if (!canCreate) {
      toast.error(createTooltip || "Required fields missing");
      return;
    }
    const newId = createAction({
      title: title.trim(),
      projectId,
      goalId,
      scheduledDate: scheduledDate || undefined,
      notes: notes || undefined,
      impact: impactNum,
      timeEstimateMinutes: timeMin === "" ? undefined : Number(timeMin),
      energyCost: energy === "" ? undefined : Number(energy),
      focusCost: focus === "" ? undefined : Number(focus),
      delegateName: delegateName || undefined,
      delegateNote: delegateNote || undefined,
      expectedReturnDate: expectedReturn || undefined,
      status: prefill?.status ?? newStatus,
      completedAt: prefill?.completedAt,
      delegatedAt: prefill?.delegatedAt,
      droppedAt: prefill?.droppedAt,
      cancelledAt: prefill?.cancelledAt,
    });
    toast("Action created");
    useStore.getState().openPanel({ kind: "action", mode: "edit", id: newId });
  };

  const handleDuplicate = () => {
    if (!action) return;
    const newId = createAction({
      title: action.title + " (copy)",
      projectId: action.projectId,
      goalId: action.goalId,
      notes: action.notes,
      impact: action.impact,
      timeEstimateMinutes: action.timeEstimateMinutes,
      energyCost: action.energyCost,
      focusCost: action.focusCost,
      status: "backlog",
    });
    toast("Action duplicated");
    useStore.getState().openPanel({ kind: "action", mode: "edit", id: newId });
  };

  const handleDelete = () => {
    if (!actionId) return;
    deleteAction(actionId);
    toast("Action deleted");
    setConfirmDelete(false);
    onClose();
  };

  return (
    <aside
      className="fixed top-0 right-0 bottom-0 z-[90] w-[480px] max-w-[100vw] bg-surface-base border-l border-border-subtle flex flex-col"
      style={{ boxShadow: "-8px 0 24px rgba(0,0,0,0.3)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle">
        <div className="font-mono text-[11px] uppercase tracking-[0.08em] text-text-tertiary">
          {mode === "new" ? "New action" : "Edit action"}
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 inline-flex items-center justify-center rounded-[4px] text-text-tertiary hover:bg-surface-hover hover:text-text-primary transition-colors"
        >
          ✕
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        {hasMigrationWarning && (
          <div
            className="mb-4 p-3 rounded-[4px] text-[12px]"
            style={{
              background: "hsl(var(--surface-raised))",
              border: "1px solid hsl(var(--text-warning) / 0.4)",
              color: "hsl(var(--text-warning))",
              fontFamily: "Inter, sans-serif",
            }}
          >
            This action has no Impact set. Set a value to include it in progress calculations.
          </div>
        )}
        {/* Title */}
        <div className="mb-6">
          <input
            ref={titleRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => persistField("title", title.trim())}
            placeholder="Action title"
            className="w-full bg-transparent outline-none text-[18px] font-medium text-text-primary placeholder:text-text-tertiary"
          />
        </div>

        {/* STATE */}
        <div className="mb-6">
          <SectionHead>State</SectionHead>

          <StatusDropdown
            current={status}
            isGoalLevel={isGoalLevel}
            onPick={handleStatusChange}
          />

          {/* Contextual timestamp line — moved directly below dropdown */}
          {action && <TimestampLine action={action} onClose={onClose} />}

          {/* Scheduled date — always visible for non-terminal statuses.
              Picking a date auto-derives status to Planned; clearing
              returns to Backlog. */}
          {status !== "done" && status !== "dropped" && status !== "cancelled" && status !== "delegated" && (
            <div className="mt-3">
              <div className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-tertiary mb-2">
                Scheduled date
              </div>
              <DateChipPicker
                value={scheduledDate}
                optional
                onChange={handleScheduledDateChange}
              />
            </div>
          )}

          {/* Delegation block */}
          {status === "delegated" && (
            <div className="mt-2 p-3 rounded-[4px] bg-surface-raised border border-border-subtle space-y-3">
              <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-text-tertiary">
                Delegation
              </div>
              <FieldRow label="Delegate name">
                <input
                  value={delegateName}
                  onChange={(e) => {
                    setDelegateName(e.target.value);
                    if (e.target.value.trim()) setDelegateError(null);
                  }}
                  onBlur={() => persistField("delegateName", delegateName || undefined)}
                  placeholder="Maria, AI, etc."
                  list="delegate-names"
                  className="w-full bg-surface-base border rounded-[4px] px-2 py-1.5 text-[13px] text-text-primary outline-none"
                  style={{
                    borderColor: delegateError
                      ? "hsl(var(--text-warning))"
                      : "hsl(var(--border-subtle))",
                  }}
                />
                <datalist id="delegate-names">
                  {delegateSuggestions.map((n) => (
                    <option key={n} value={n} />
                  ))}
                </datalist>
                {delegateError && <InlineError text={delegateError} />}
              </FieldRow>
              <div>
                <div className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-tertiary mb-2">
                  Expected back
                </div>
                <DateChipPicker
                  value={expectedReturn}
                  optional
                  onChange={(iso) => {
                    setExpectedReturn(iso);
                    if (mode === "edit") {
                      persistField("expectedReturnDate", iso || undefined);
                    }
                  }}
                />
              </div>
              <FieldRow label="Delegate note">
                <textarea
                  value={delegateNote}
                  onChange={(e) => setDelegateNote(e.target.value)}
                  onBlur={() => persistField("delegateNote", delegateNote || undefined)}
                  rows={2}
                  className="w-full bg-surface-base border border-border-subtle rounded-[4px] px-2 py-1.5 text-[13px] text-text-primary outline-none resize-y"
                />
              </FieldRow>
            </div>
          )}

        </div>

        {/* PARENT */}
        <div className="mb-6">
          <SectionHead>Parent</SectionHead>
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
              <option value="">— Goal-level backlog —</option>
              {(projectsByGoal.find((g) => g.goal.id === goalId)?.projects ?? []).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* ESTIMATES */}
        <div className="mb-6">
          <SectionHead>Estimates</SectionHead>
          <div className="grid grid-cols-2 gap-3">
            <FieldRow label="Impact (1-10) · required">
              <ClampedNumberInput
                value={impact}
                min={1}
                max={10}
                step={1}
                placeholder="1–10"
                required
                requiredMessage="Impact is required."
                ariaLabel="Impact"
                onChange={(v) => {
                  setImpact(v);
                  if (v === "" || (typeof v === "number" && v > 0)) setImpactError(null);
                }}
                onCommit={(v) => {
                  if (v === "") {
                    persistField("impact", 0);
                  } else {
                    persistField("impact", v);
                    setImpactError(null);
                  }
                }}
              />
              {impactError && <InlineError text={impactError} />}
            </FieldRow>
            {layers.logEnergy && (
              <FieldRow label="Energy (1-10)">
                <ClampedNumberInput
                  value={energy}
                  min={1}
                  max={10}
                  step={1}
                  ariaLabel="Energy"
                  onChange={setEnergy}
                  onCommit={(v) =>
                    persistField("energyCost", v === "" ? undefined : v)
                  }
                />
              </FieldRow>
            )}
            {layers.logFocus && (
              <FieldRow label="Focus (1-10)">
                <ClampedNumberInput
                  value={focus}
                  min={1}
                  max={10}
                  step={1}
                  ariaLabel="Focus"
                  onChange={setFocus}
                  onCommit={(v) =>
                    persistField("focusCost", v === "" ? undefined : v)
                  }
                />
              </FieldRow>
            )}
            {layers.logTime && (
              <FieldRow label="Time (min) · required">
                <ClampedNumberInput
                  value={timeMin}
                  min={1}
                  max={600}
                  step={5}
                  placeholder="e.g. 30"
                  required
                  requiredMessage="Time estimate is required."
                  ariaLabel="Time in minutes"
                  onChange={(v) => {
                    setTimeMin(v);
                    if (v !== "" && typeof v === "number" && v > 0) setTimeError(null);
                  }}
                  onCommit={(v) =>
                    persistField("timeEstimateMinutes", v === "" ? undefined : v)
                  }
                />
                {timeError && <InlineError text={timeError} />}
              </FieldRow>
            )}
          </div>
        </div>

        {/* NOTES */}
        <div>
          <SectionHead>Notes</SectionHead>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={() => persistField("notes", notes || undefined)}
            placeholder="Add notes..."
            rows={4}
            className="w-full bg-surface-raised border border-border-subtle rounded-[4px] px-2 py-1.5 text-[13px] text-text-primary placeholder:text-text-tertiary outline-none resize-y"
          />
        </div>
      </div>

      {/* Footer */}
      <div
        className="px-6 flex items-center justify-between"
        style={{
          borderTop: "1px solid hsl(var(--border-subtle))",
          paddingTop: 16,
          paddingBottom: 16,
        }}
      >
        {mode === "new" ? (
          <>
            <button
              onClick={onClose}
              className="text-[13px] text-text-secondary hover:text-text-primary px-3 py-1.5"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveNew}
              disabled={!canCreate}
              title={canCreate ? "" : createTooltip}
              className="text-[13px] font-medium px-3 py-1.5 rounded-[4px] transition-colors"
              style={{
                background: canCreate ? "hsl(var(--accent))" : "hsl(var(--surface-hover))",
                color: canCreate ? "hsl(var(--surface-base))" : "hsl(var(--text-tertiary))",
                cursor: canCreate ? "pointer" : "not-allowed",
              }}
            >
              Create
            </button>
          </>
        ) : (
          <>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="w-8 h-8 inline-flex items-center justify-center rounded-[4px] text-text-tertiary hover:bg-surface-hover hover:text-text-primary transition-colors"
                  aria-label="More actions"
                >
                  <MoreHorizontal size={16} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="bg-surface-raised border border-border-default">
                <DropdownMenuItem onSelect={handleDuplicate}>Duplicate</DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => setConfirmDelete(true)}
                  className="text-[hsl(var(--text-warning))] focus:text-[hsl(var(--text-warning))]"
                >
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <div className="flex items-center gap-2">
              {(status === "backlog" || status === "planned") && !isGoalLevel && (
                <button
                  onClick={() => handleStatusChange("done")}
                  className="text-[13px] font-medium px-3 py-1.5 rounded-[4px]"
                  style={{
                    background: "hsl(var(--accent))",
                    color: "hsl(var(--surface-base))",
                  }}
                >
                  Mark done
                </button>
              )}
              {status === "delegated" && (
                <>
                  <button
                    onClick={() => handleStatusChange("backlog")}
                    className="text-[13px] px-3 py-1.5 rounded-[4px] border border-border-subtle text-text-secondary hover:text-text-primary"
                  >
                    Re-open
                  </button>
                  <button
                    onClick={() => handleStatusChange("done")}
                    className="text-[13px] font-medium px-3 py-1.5 rounded-[4px]"
                    style={{
                      background: "hsl(var(--accent))",
                      color: "hsl(var(--surface-base))",
                    }}
                  >
                    Mark done
                  </button>
                </>
              )}
              {(status === "done" || status === "dropped" || status === "cancelled") && (
                <button
                  onClick={() => handleStatusChange("backlog")}
                  className="text-[13px] px-3 py-1.5 rounded-[4px] border border-border-subtle text-text-secondary hover:text-text-primary"
                >
                  Re-open
                </button>
              )}
            </div>
          </>
        )}
      </div>

      <ConfirmModal
        open={confirmDelete}
        title="Delete this action?"
        body="This permanently removes the action and its timeline. This cannot be undone."
        confirmLabel="Delete"
        destructive
        onCancel={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
      />
      <ConfirmModal
        open={confirmDrop !== null}
        title={confirmDrop === "dropped" ? "Drop this action?" : "Cancel this action?"}
        body="Its impact contribution will be removed from the project. You can re-open it later."
        confirmLabel={confirmDrop === "dropped" ? "Drop" : "Cancel action"}
        destructive
        onCancel={() => setConfirmDrop(null)}
        onConfirm={confirmDropAction}
      />
    </aside>
  );
}

// ──────────── Sub-components ────────────

function SectionHead({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-tertiary mb-3">
      {children}
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

function DateChip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center px-3 py-1.5 rounded-[4px] text-[13px] transition-colors"
      style={{
        background: selected ? "hsl(var(--accent))" : "hsl(var(--surface-raised))",
        color: selected ? "white" : "hsl(var(--text-primary))",
        border: selected ? "1px solid transparent" : "1px solid hsl(var(--border-subtle))",
      }}
      onMouseEnter={(e) => {
        if (!selected) {
          e.currentTarget.style.background = "hsl(var(--surface-hover))";
          e.currentTarget.style.borderColor = "hsl(var(--border-default))";
        }
      }}
      onMouseLeave={(e) => {
        if (!selected) {
          e.currentTarget.style.background = "hsl(var(--surface-raised))";
          e.currentTarget.style.borderColor = "hsl(var(--border-subtle))";
        }
      }}
    >
      {label}
    </button>
  );
}

function relDays(iso: string): string {
  const today = TODAY_ISO();
  const days = Math.round(
    (new Date(iso + "T00:00:00").getTime() -
      new Date(today + "T00:00:00").getTime()) /
      86400000,
  );
  if (days === 0) return "today";
  if (days === 1) return "tomorrow";
  if (days === -1) return "yesterday";
  if (days > 0) return `in ${days} days`;
  return `${Math.abs(days)} days ago`;
}

export function DateChipPicker({
  value,
  onChange,
  optional = false,
}: {
  value: string;
  onChange: (iso: string) => void;
  optional?: boolean;
}) {
  const [showCalendar, setShowCalendar] = useState(false);
  const today = TODAY_ISO();
  const tomorrow = addDaysISO(today, 1);
  const isToday = value === today;
  const isTomorrow = value === tomorrow;
  const isCustom = !!value && !isToday && !isTomorrow;

  // Summary view when a custom date is set
  if (isCustom && !showCalendar) {
    const d = new Date(value + "T00:00:00");
    const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    return (
      <div className="flex items-center gap-2">
        <span className="text-[13px] text-text-primary">{label}</span>
        <span className="text-[13px] text-text-secondary">({relDays(value)})</span>
        <button
          type="button"
          onClick={() => setShowCalendar(true)}
          className="ml-2 text-[13px] text-text-secondary hover:text-text-primary transition-colors"
        >
          Change
        </button>
        {optional && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="text-[13px] text-text-secondary hover:text-text-primary transition-colors"
          >
            Clear
          </button>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2 flex-wrap">
        <DateChip
          label="Today"
          selected={isToday}
          onClick={() => {
            onChange(today);
            setShowCalendar(false);
          }}
        />
        <DateChip
          label="Tomorrow"
          selected={isTomorrow}
          onClick={() => {
            onChange(tomorrow);
            setShowCalendar(false);
          }}
        />
        <span className="w-3" />
        <button
          type="button"
          onClick={() => setShowCalendar((s) => !s)}
          className="inline-flex items-center gap-1.5 text-[13px] text-text-secondary hover:text-text-primary transition-colors"
        >
          <CalendarIcon size={12} />
          Pick another date
        </button>
        {optional && value && (
          <button
            type="button"
            onClick={() => {
              onChange("");
              setShowCalendar(false);
            }}
            className="text-[13px] text-text-secondary hover:text-text-primary transition-colors"
          >
            Clear
          </button>
        )}
      </div>
      {showCalendar && (
        <div
          className="mt-2 inline-block rounded-[4px] border p-2"
          style={{ borderColor: "hsl(var(--border-subtle))", background: "hsl(var(--surface-raised))" }}
        >
          <Calendar
            mode="single"
            selected={value ? new Date(value + "T00:00:00") : undefined}
            onSelect={(d) => {
              if (!d) return;
              const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
              onChange(iso);
              setShowCalendar(false);
            }}
            initialFocus
            className="p-2 pointer-events-auto"
          />
        </div>
      )}
    </div>
  );
}


function StatusDot({ status }: { status: ActionStatus }) {
  return (
    <span
      className="inline-block w-2 h-2 rounded-full shrink-0"
      style={{ background: STATUS_COLOR[status] }}
    />
  );
}

export function StatusDropdown({
  current,
  isGoalLevel,
  onPick,
}: {
  current: ActionStatus;
  isGoalLevel: boolean;
  onPick: (s: ActionStatus) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="w-full max-w-[280px] flex items-center justify-between gap-2 bg-surface-raised border border-border-default rounded-[4px] px-3 py-2 text-[13px] text-text-primary hover:bg-surface-hover transition-colors"
        >
          <span className="flex items-center gap-2">
            <StatusDot status={current} />
            <span>{STATUS_LABEL[current]}</span>
          </span>
          <ChevronDown size={14} className="text-text-tertiary" />
        </button>
      </PopoverTrigger>
      {/*
        Z-INDEX HIERARCHY (app-wide):
          0-10  Sidebar / regular page content
          90    Slide-in panel (Sheet / ActionEditorPanel)
          100   Content inside slide-in panel (this popover, dropdowns)
          200   Modals (Plan today, Close day, confirmations)
          250   Command Palette
          300   Toasts
        This popover lives inside the z-90 ActionEditorPanel and is portaled
        to <body>, so it must explicitly sit above 90. We override locally
        instead of bumping the shared PopoverContent default.
      */}
      <PopoverContent
        align="start"
        className="z-[100] w-[280px] p-1 bg-surface-raised border border-border-default"
      >
        <TooltipProvider delayDuration={200}>
          {STATUS_ORDER.map((s) => {
            const disabled = isGoalLevel && s !== "backlog";
            const selected = s === current;
            const item = (
              <button
                key={s}
                type="button"
                disabled={disabled}
                onClick={() => {
                  if (disabled) return;
                  // Fire the picker first so any state updates / modals open
                  // before the popover unmounts; then close the popover.
                  onPick(s);
                  setOpen(false);
                }}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-[13px] rounded-[3px] transition-colors ${
                  disabled
                    ? "opacity-40 cursor-not-allowed"
                    : "hover:bg-surface-hover cursor-pointer"
                } ${selected ? "text-[hsl(var(--accent))]" : "text-text-primary"}`}
              >
                <span className="flex items-center gap-2">
                  <StatusDot status={s} />
                  <span>{STATUS_LABEL[s]}</span>
                </span>
                {selected && <Check size={14} className="text-[hsl(var(--accent))]" />}
              </button>
            );
            if (disabled) {
              return (
                <Tooltip key={s}>
                  <TooltipTrigger asChild>
                    <span className="block">{item}</span>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="text-[12px]">
                    Assign to a Project to plan or complete this action.
                  </TooltipContent>
                </Tooltip>
              );
            }
            return item;
          })}
        </TooltipProvider>
      </PopoverContent>
    </Popover>
  );
}

function TimestampLine({ action, onClose }: { action: Action; onClose: () => void }) {
  const status = action.status;
  if (status === "backlog") return null;

  const linkDate = (iso: string, label: string) => (
    <Link
      to={`/reviews/days/${iso}`}
      onClick={onClose}
      className="underline-offset-2 hover:underline hover:text-[hsl(var(--accent))] transition-colors cursor-pointer"
    >
      {label}
    </Link>
  );

  if (status === "planned") {
    const sd = action.scheduledDate;
    if (!sd) return null;
    const today = TODAY_ISO();
    const overdue = sd < today;
    const label = fmtRelDate(sd);
    return (
      <div
        className="mt-3 font-mono text-[12px]"
        style={{ color: overdue ? "hsl(var(--state-stalled))" : "hsl(var(--text-secondary))" }}
      >
        {overdue ? "Overdue · scheduled for " : "Scheduled for "}
        {linkDate(sd, label)}
      </div>
    );
  }

  if (status === "done" && action.completedAt) {
    const cDate = action.completedAt.slice(0, 10);
    const cLabel = fmtRelFromNow(action.completedAt);
    const sd = action.scheduledDate;
    const showOriginal = sd && sd !== cDate;
    return (
      <div className="mt-3 space-y-0.5">
        <div className="font-mono text-[12px] text-text-secondary">
          Completed {linkDate(cDate, cLabel)}
        </div>
        {showOriginal && (
          <div className="font-mono text-[12px] text-text-tertiary">
            Originally scheduled for {fmtRelDate(sd!)}
          </div>
        )}
      </div>
    );
  }

  if (status === "delegated" && action.delegatedAt) {
    const dDate = action.delegatedAt.slice(0, 10);
    return (
      <div className="mt-3 font-mono text-[12px] text-text-secondary">
        Delegated{action.delegateName ? ` to ${action.delegateName}` : ""} ·{" "}
        {linkDate(dDate, fmtRelFromNow(action.delegatedAt))}
      </div>
    );
  }

  if (status === "dropped" && action.droppedAt) {
    const dDate = action.droppedAt.slice(0, 10);
    return (
      <div className="mt-3 font-mono text-[12px] text-text-secondary">
        Dropped on {linkDate(dDate, fmtRelDate(dDate))}
      </div>
    );
  }

  if (status === "cancelled" && action.cancelledAt) {
    const dDate = action.cancelledAt.slice(0, 10);
    return (
      <div className="mt-3 font-mono text-[12px] text-text-secondary">
        Cancelled on {linkDate(dDate, fmtRelDate(dDate))}
      </div>
    );
  }

  return null;
}
