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
import { ChevronDown, Check, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/store/useStore";
import type { Action, ActionStatus, ID } from "@/types";
import { ConfirmModal } from "./ConfirmModal";
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

const STATUS_ORDER: ActionStatus[] = [
  "backlog",
  "planned",
  "done",
  "delegated",
  "dropped",
  "cancelled",
];
const STATUS_LABEL: Record<ActionStatus, string> = {
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
function nextMondayISO(): string {
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  const day = t.getDay(); // 0=Sun..6=Sat
  const diff = day === 0 ? 1 : (8 - day) % 7 || 7;
  t.setDate(t.getDate() + diff);
  return t.toISOString().slice(0, 10);
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

  // When user picks Planned via dropdown but no scheduledDate yet, expose
  // an inline date picker just below.
  const [needsScheduledDate, setNeedsScheduledDate] = useState(false);

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmDrop, setConfirmDrop] = useState<ActionStatus | null>(null);
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
  const isTerminal =
    status === "done" || status === "dropped" || status === "cancelled";
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
    if (newStatus === "planned" && !scheduledDate) missing.push("Scheduled date");
    if (newStatus === "delegated" && !delegateName.trim()) missing.push("Delegate name");
    return missing;
  }, [title, goalId, impactNum, requireTime, timeNum, newStatus, scheduledDate, delegateName]);

  const canCreate = missingForCreate.length === 0;
  const createTooltip =
    missingForCreate.length === 0
      ? ""
      : `Set ${missingForCreate.join(" and ")} to create`;

  // Existing-action migration warning: action exists with no impact value.
  const hasMigrationWarning =
    mode === "edit" && !!action && (action.impact === undefined || action.impact === null || action.impact <= 0);

  // ─── Status transitions (edit mode) ───
  const handleStatusChange = (next: ActionStatus) => {
    if (isGoalLevel && next !== "backlog") {
      toast.error("Assign to a Project to plan or complete this action.");
      return;
    }
    if (mode === "new") {
      setNewStatus(next);
      if (next === "planned" && !scheduledDate) setNeedsScheduledDate(true);
      else setNeedsScheduledDate(false);
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
    if (next === "planned") {
      if (!scheduledDate) {
        setNeedsScheduledDate(true);
        toast.error("Pick a date to plan this action.");
        return;
      }
      changeActionStatus(actionId, "planned", { scheduledDate });
      setNeedsScheduledDate(false);
      toast("Action scheduled");
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

  // Apply the picked scheduled date (after status=Planned was selected without date).
  const applyScheduledDate = (iso: string) => {
    setScheduledDate(iso);
    setNeedsScheduledDate(false);
    if (mode === "edit" && actionId) {
      changeActionStatus(actionId, "planned", { scheduledDate: iso });
      toast("Action scheduled");
    }
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

          {/* Inline scheduled-date picker (when Planned needs a date) */}
          {status === "planned" && (needsScheduledDate || !scheduledDate) && (
            <div className="mt-2 p-3 rounded-[4px] bg-surface-raised border border-border-subtle">
              <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-text-tertiary mb-2">
                Pick a scheduled date
              </div>
              <div className="flex flex-wrap gap-1.5 mb-2">
                <QuickDateBtn label="Today" onClick={() => applyScheduledDate(TODAY_ISO())} />
                <QuickDateBtn
                  label="Tomorrow"
                  onClick={() => applyScheduledDate(addDaysISO(TODAY_ISO(), 1))}
                />
                <QuickDateBtn label="Next Mon" onClick={() => applyScheduledDate(nextMondayISO())} />
              </div>
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => {
                  if (e.target.value) applyScheduledDate(e.target.value);
                }}
                className="bg-surface-base border border-border-subtle rounded-[4px] px-2 py-1.5 text-[13px] text-text-primary outline-none"
              />
            </div>
          )}

          {/* Editable scheduled-date when Planned + already set */}
          {status === "planned" && scheduledDate && !needsScheduledDate && (
            <div className="mt-2">
              <FieldRow label="Scheduled">
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => {
                    setScheduledDate(e.target.value);
                    if (mode === "edit") persistField("scheduledDate", e.target.value || undefined);
                  }}
                  className="bg-surface-raised border border-border-subtle rounded-[4px] px-2 py-1.5 text-[13px] text-text-primary outline-none"
                />
              </FieldRow>
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
                  onChange={(e) => setDelegateName(e.target.value)}
                  onBlur={() => persistField("delegateName", delegateName || undefined)}
                  placeholder="Maria, AI, etc."
                  list="delegate-names"
                  className="w-full bg-surface-base border border-border-subtle rounded-[4px] px-2 py-1.5 text-[13px] text-text-primary outline-none"
                />
                <datalist id="delegate-names">
                  {delegateSuggestions.map((n) => (
                    <option key={n} value={n} />
                  ))}
                </datalist>
              </FieldRow>
              <FieldRow label="Expected return">
                <input
                  type="date"
                  value={expectedReturn}
                  onChange={(e) => setExpectedReturn(e.target.value)}
                  onBlur={() =>
                    persistField("expectedReturnDate", expectedReturn || undefined)
                  }
                  className="bg-surface-base border border-border-subtle rounded-[4px] px-2 py-1.5 text-[13px] text-text-primary outline-none"
                />
              </FieldRow>
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
            <FieldRow label="Impact (0-10)">
              <input
                type="number"
                min={0}
                max={10}
                value={impact}
                onChange={(e) => setImpact(Number(e.target.value))}
                onBlur={() => persistField("impact", Number(impact) || 0)}
                className="w-full bg-surface-raised border border-border-subtle rounded-[4px] px-2 py-1.5 text-[13px] text-text-primary outline-none"
              />
            </FieldRow>
            {layers.logEnergy && (
              <FieldRow label="Energy (1-10)">
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={energy}
                  onChange={(e) => setEnergy(e.target.value === "" ? "" : Number(e.target.value))}
                  onBlur={() =>
                    persistField("energyCost", energy === "" ? undefined : Number(energy))
                  }
                  className="w-full bg-surface-raised border border-border-subtle rounded-[4px] px-2 py-1.5 text-[13px] text-text-primary outline-none"
                />
              </FieldRow>
            )}
            {layers.logFocus && (
              <FieldRow label="Focus (1-10)">
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={focus}
                  onChange={(e) => setFocus(e.target.value === "" ? "" : Number(e.target.value))}
                  onBlur={() =>
                    persistField("focusCost", focus === "" ? undefined : Number(focus))
                  }
                  className="w-full bg-surface-raised border border-border-subtle rounded-[4px] px-2 py-1.5 text-[13px] text-text-primary outline-none"
                />
              </FieldRow>
            )}
            {layers.logTime && (
              <FieldRow label="Time (min)">
                <input
                  type="number"
                  min={0}
                  value={timeMin}
                  onChange={(e) =>
                    setTimeMin(e.target.value === "" ? "" : Number(e.target.value))
                  }
                  onBlur={() =>
                    persistField(
                      "timeEstimateMinutes",
                      timeMin === "" ? undefined : Number(timeMin),
                    )
                  }
                  className="w-full bg-surface-raised border border-border-subtle rounded-[4px] px-2 py-1.5 text-[13px] text-text-primary outline-none"
                />
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
      <div className="border-t border-border-subtle px-6 py-3 flex items-center justify-between">
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
              className="text-[13px] font-medium px-3 py-1.5 rounded-[4px]"
              style={{
                background: "hsl(var(--accent))",
                color: "hsl(var(--surface-base))",
              }}
            >
              Save action
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setConfirmDelete(true)}
              className="text-[13px] text-text-tertiary hover:text-text-warning px-3 py-1.5"
            >
              Delete
            </button>
            <div className="flex items-center gap-2">
              {!isTerminal && status !== "delegated" && !isGoalLevel && (
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
              {isTerminal && (
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

function QuickDateBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-[12px] px-2 py-1 rounded-[4px] border border-border-subtle text-text-secondary hover:text-text-primary hover:border-border-default transition-colors"
    >
      {label}
    </button>
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

function StatusDropdown({
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
      <PopoverContent
        align="start"
        className="w-[280px] p-1 bg-surface-raised border border-border-default"
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
                  setOpen(false);
                  onPick(s);
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
                    <div>{item}</div>
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
