// Action editor — slide-in panel from the right. Controlled by the store's
// ui.activePanel slot (`{ kind: "action", mode, id?, prefill? }`).
//
// Edit mode: autosaves on blur. New mode: explicit Save button.
// Status changes route through changeActionStatus so timeline events,
// timestamps and cascades stay correct.
//
// Visible fields are gated by settings.layers (planAndReview, logTime,
// logEnergy, logFocus) to match the spec's tracking layers.

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useStore } from "@/store/useStore";
import type { Action, ActionStatus, ID } from "@/types";
import { ConfirmModal } from "./ConfirmModal";

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

export function ActionEditor() {
  const panel = useStore((s) => s.ui.activePanel);
  const closePanel = useStore((s) => s.closePanel);

  const open = panel?.kind === "action";

  // Esc to close
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
  const layers = useStore((s) => s.settings.layers);

  const updateAction = useStore((s) => s.updateAction);
  const createAction = useStore((s) => s.createAction);
  const changeActionStatus = useStore((s) => s.changeActionStatus);
  const deleteAction = useStore((s) => s.deleteAction);

  // Local form state (edit mode mirrors store, new mode is local-only).
  const seed: Partial<Action> = mode === "edit" && action ? action : prefill ?? {};
  const [title, setTitle] = useState(seed.title ?? "");
  const [projectId, setProjectId] = useState<ID | null>(seed.projectId ?? null);
  const [goalId, setGoalId] = useState<ID>(
    seed.goalId ?? goals.find((g) => g.status === "active")?.id ?? goals[0]?.id ?? "",
  );
  const [scheduledDate, setScheduledDate] = useState<string>(seed.scheduledDate ?? "");
  const [notes, setNotes] = useState<string>(seed.notes ?? "");
  const [impact, setImpact] = useState<number>(seed.impact ?? 0);
  const [timeMin, setTimeMin] = useState<number | "">(seed.timeEstimateMinutes ?? "");
  const [energy, setEnergy] = useState<number | "">(seed.energyCost ?? "");
  const [focus, setFocus] = useState<number | "">(seed.focusCost ?? "");
  const [delegateName, setDelegateName] = useState<string>(seed.delegateName ?? "");
  const [delegateNote, setDelegateNote] = useState<string>(seed.delegateNote ?? "");
  const [expectedReturn, setExpectedReturn] = useState<string>(seed.expectedReturnDate ?? "");

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmDrop, setConfirmDrop] = useState<ActionStatus | null>(null);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    titleRef.current?.focus();
    if (mode === "new") titleRef.current?.select();
  }, [mode]);

  // ─── Save helpers ───
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

  const status = action?.status ?? "backlog";
  const isTerminal =
    status === "done" || status === "dropped" || status === "cancelled";

  // ─── Status changes ───
  const handleStatusChange = (next: ActionStatus) => {
    if (!actionId || mode !== "edit") {
      // In new mode the status is just local — applied on Save.
      return;
    }
    if (next === status) return;
    if (next === "delegated") {
      // Need delegate name; if not yet present, just set status — the inline
      // delegate section appears below to capture the name, then we re-save.
      changeActionStatus(actionId, "delegated", {
        delegateName: delegateName || "Maria",
        delegateNote: delegateNote || undefined,
        expectedReturnDate: expectedReturn || undefined,
      });
      toast(`Delegated to ${delegateName || "Maria"}`);
      return;
    }
    if (next === "dropped" || next === "cancelled") {
      setConfirmDrop(next);
      return;
    }
    if (next === "planned") {
      const date = scheduledDate || new Date().toISOString().slice(0, 10);
      changeActionStatus(actionId, "planned", { scheduledDate: date });
      toast("Action scheduled");
      return;
    }
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

  // ─── Save (new mode) ───
  const handleSaveNew = () => {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    const newId = createAction({
      title: title.trim(),
      projectId,
      goalId,
      scheduledDate: scheduledDate || undefined,
      notes: notes || undefined,
      impact: Number(impact) || 0,
      timeEstimateMinutes: timeMin === "" ? undefined : Number(timeMin),
      energyCost: energy === "" ? undefined : Number(energy),
      focusCost: focus === "" ? undefined : Number(focus),
    });
    toast("Action created");
    // Re-open as edit so user can keep tweaking the saved record.
    useStore.getState().openPanel({ kind: "action", mode: "edit", id: newId });
  };

  const handleDelete = () => {
    if (!actionId) return;
    deleteAction(actionId);
    toast("Action deleted");
    setConfirmDelete(false);
    onClose();
  };

  const projectTitle = projectId
    ? projects.find((p) => p.id === projectId)?.title ?? "—"
    : "Goal-level backlog";

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
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
        {/* Title */}
        <div>
          <input
            ref={titleRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => persistField("title", title.trim())}
            placeholder="Action title"
            className="w-full bg-transparent outline-none text-[18px] font-medium text-text-primary placeholder:text-text-tertiary"
          />
        </div>

        {/* Status */}
        {mode === "edit" && (
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-text-tertiary mb-2">
              Status
            </div>
            <div className="flex flex-wrap gap-1.5">
              {STATUS_ORDER.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleStatusChange(s)}
                  className="text-[12px] px-2.5 py-1 rounded-[4px] border transition-colors"
                  style={{
                    background: s === status ? "hsl(var(--surface-elevated))" : "transparent",
                    borderColor:
                      s === status ? "hsl(var(--accent))" : "hsl(var(--border-subtle))",
                    color: s === status ? "hsl(var(--text-primary))" : "hsl(var(--text-secondary))",
                  }}
                >
                  {STATUS_LABEL[s]}
                </button>
              ))}
            </div>
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
              <option value="">— Goal-level backlog —</option>
              {(projectsByGoal.find((g) => g.goal.id === goalId)?.projects ?? []).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
            <div className="font-mono text-[10px] text-text-tertiary">{projectTitle}</div>
          </div>
        </div>

        {/* Scheduled date (only when planAndReview is on) */}
        {layers.planAndReview && (
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
        )}

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
            rows={4}
            className="w-full bg-surface-raised border border-border-subtle rounded-[4px] px-2 py-1.5 text-[13px] text-text-primary placeholder:text-text-tertiary outline-none resize-y"
          />
        </div>

        {/* Impact + costs */}
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
        </div>

        {/* Delegation section (only when delegated) */}
        {status === "delegated" && mode === "edit" && (
          <div className="border border-border-subtle rounded-[4px] p-3 space-y-3">
            <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-text-tertiary">
              Delegation
            </div>
            <FieldRow label="Delegate name">
              <input
                value={delegateName}
                onChange={(e) => setDelegateName(e.target.value)}
                onBlur={() => persistField("delegateName", delegateName || undefined)}
                placeholder="Maria, AI, etc."
                className="w-full bg-surface-raised border border-border-subtle rounded-[4px] px-2 py-1.5 text-[13px] text-text-primary outline-none"
              />
            </FieldRow>
            <FieldRow label="Expected return">
              <input
                type="date"
                value={expectedReturn}
                onChange={(e) => setExpectedReturn(e.target.value)}
                onBlur={() =>
                  persistField("expectedReturnDate", expectedReturn || undefined)
                }
                className="bg-surface-raised border border-border-subtle rounded-[4px] px-2 py-1.5 text-[13px] text-text-primary outline-none"
              />
            </FieldRow>
            <FieldRow label="Delegate note">
              <textarea
                value={delegateNote}
                onChange={(e) => setDelegateNote(e.target.value)}
                onBlur={() => persistField("delegateNote", delegateNote || undefined)}
                rows={2}
                className="w-full bg-surface-raised border border-border-subtle rounded-[4px] px-2 py-1.5 text-[13px] text-text-primary outline-none resize-y"
              />
            </FieldRow>
          </div>
        )}
      </div>

      {/* Footer / actions */}
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
              {!isTerminal && status !== "delegated" && (
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
