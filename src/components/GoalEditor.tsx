// Goal editor — slide-in panel from the right. Controlled by the store's
// ui.activePanel slot (`{ kind: "goal", mode, id?, prefill? }`).
//
// Enforces the 3-active-goal limit on creation. Drop cascades to all child
// projects/actions/rituals via the store. Supports success criteria checklist
// editing inline.

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useStore } from "@/store/useStore";
import type { Goal, GoalType, GoalStatus, ID } from "@/types";
import { ConfirmModal } from "./ConfirmModal";
import { EditorShell, EditorCloseX, EditorCancelButton } from "./EditorShell";

const STATUS_ORDER: GoalStatus[] = ["active", "completed", "dropped"];
const STATUS_LABEL: Record<GoalStatus, string> = {
  active: "Active",
  completed: "Completed",
  dropped: "Dropped",
};

const TYPE_OPTIONS: { value: GoalType; label: string }[] = [
  { value: "short-term", label: "Short-term" },
  { value: "mid-term", label: "Mid-term" },
];

const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export function GoalEditor() {
  const panel = useStore((s) => s.ui.activePanel);
  const closePanel = useStore((s) => s.closePanel);
  const open = panel?.kind === "goal";

  if (!open || panel?.kind !== "goal") return null;

  return (
    <GoalEditorPanel
      key={(panel.mode === "edit" ? panel.id : "new") ?? "new"}
      mode={panel.mode}
      goalId={panel.id}
      prefill={panel.prefill}
      onClose={closePanel}
    />
  );
}

function GoalEditorPanel({
  mode,
  goalId,
  prefill,
  onClose,
}: {
  mode: "edit" | "new";
  goalId?: ID;
  prefill?: Partial<Goal>;
  onClose: () => void;
}) {
  const goal = useStore((s) => (goalId ? s.goals.find((g) => g.id === goalId) : undefined));
  const projects = useStore((s) => s.projects);
  const actions = useStore((s) => s.actions);
  const goals = useStore((s) => s.goals);

  const createGoal = useStore((s) => s.createGoal);
  const updateGoal = useStore((s) => s.updateGoal);
  const markGoalComplete = useStore((s) => s.markGoalComplete);
  const dropGoal = useStore((s) => s.dropGoal);
  const deleteGoal = useStore((s) => s.deleteGoal);
  const reopenGoal = useStore((s) => s.reopenGoal);

  const seed: Partial<Goal> = mode === "edit" && goal ? goal : prefill ?? {};
  const [title, setTitle] = useState(seed.title ?? "");
  const [type, setType] = useState<GoalType>(seed.type ?? "mid-term");
  const [description, setDescription] = useState(seed.description ?? "");
  const [targetDate, setTargetDate] = useState(seed.targetDate ?? "");
  const [criteria, setCriteria] = useState(seed.successCriteria ?? []);
  const [newCriterion, setNewCriterion] = useState("");

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmDrop, setConfirmDrop] = useState(false);
  const [confirmComplete, setConfirmComplete] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    titleRef.current?.focus();
    if (mode === "new") titleRef.current?.select();
  }, [mode]);

  const status = goal?.status ?? "active";
  const isTerminal = status === "completed" || status === "dropped";

  // Cascade preview for confirmations.
  const childStats = (() => {
    if (!goalId) return { projects: 0, openProjects: 0, openActions: 0 };
    const projs = projects.filter((p) => p.goalId === goalId);
    const openProjects = projs.filter((p) => p.status === "active").length;
    const openActions = actions.filter(
      (a) =>
        a.goalId === goalId &&
        a.status !== "done" &&
        a.status !== "dropped" &&
        a.status !== "cancelled",
    ).length;
    return { projects: projs.length, openProjects, openActions };
  })();

  const activeCount = goals.filter((g) => g.status === "active").length;

  const persistField = <K extends keyof Goal>(field: K, value: Goal[K]) => {
    if (mode !== "edit" || !goalId) return;
    updateGoal(goalId, { [field]: value } as Partial<Goal>);
  };

  const handleSaveNew = () => {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    const result = createGoal({
      title: title.trim(),
      type,
      description: description || undefined,
      targetDate: targetDate || undefined,
      successCriteria: criteria,
    });
    if (!result.ok) {
      toast.error("You already have 3 active goals. Complete or drop one first.");
      return;
    }
    toast("Goal created");
    useStore.getState().openPanel({ kind: "goal", mode: "edit", id: result.id });
  };

  const handleStatusChange = (next: GoalStatus) => {
    if (!goalId || mode !== "edit") return;
    if (next === status) return;
    if (next === "completed") {
      setConfirmComplete(true);
      return;
    }
    if (next === "dropped") {
      setConfirmDrop(true);
      return;
    }
    // re-activate
    if (activeCount >= 3) {
      toast.error("You already have 3 active goals. Complete or drop one first.");
      return;
    }
    reopenGoal(goalId);
    toast("Goal re-opened");
  };

  const handleDelete = () => {
    if (!goalId) return;
    deleteGoal(goalId);
    toast("Goal deleted");
    setConfirmDelete(false);
    onClose();
  };

  const handleConfirmDrop = () => {
    if (!goalId) return;
    dropGoal(goalId);
    const parts = [];
    if (childStats.openProjects > 0) parts.push(`${childStats.openProjects} project${childStats.openProjects === 1 ? "" : "s"}`);
    if (childStats.openActions > 0) parts.push(`${childStats.openActions} action${childStats.openActions === 1 ? "" : "s"}`);
    toast(parts.length > 0 ? `Goal dropped · ${parts.join(", ")} dropped` : "Goal dropped");
    setConfirmDrop(false);
  };

  const handleConfirmComplete = () => {
    if (!goalId) return;
    markGoalComplete(goalId);
    toast("Goal completed");
    setConfirmComplete(false);
  };

  const addCriterion = () => {
    if (!newCriterion.trim()) return;
    const next = [...criteria, { id: uid(), text: newCriterion.trim(), done: false }];
    setCriteria(next);
    setNewCriterion("");
    if (mode === "edit") persistField("successCriteria", next);
  };

  const toggleCriterion = (id: ID) => {
    const next = criteria.map((c) => (c.id === id ? { ...c, done: !c.done } : c));
    setCriteria(next);
    if (mode === "edit") persistField("successCriteria", next);
  };

  const removeCriterion = (id: ID) => {
    const next = criteria.filter((c) => c.id !== id);
    setCriteria(next);
    if (mode === "edit") persistField("successCriteria", next);
  };

  const goalColor = goal?.color ? `hsl(var(--${goal.color}))` : "hsl(var(--text-tertiary))";

  const dirty =
    mode === "new" &&
    (!!title.trim() || !!description.trim() || !!targetDate || criteria.length > 0);

  return (
    <EditorShell mode={mode} dirty={dirty} onClose={onClose}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle shrink-0">
        <div className="flex items-center gap-2">
          {goal && (
            <span className="w-2 h-2 rounded-full" style={{ background: goalColor }} />
          )}
          {mode === "new" ? (
            <div className="text-[18px] font-medium text-text-primary">New goal</div>
          ) : (
            <div className="font-mono text-[11px] uppercase tracking-[0.08em] text-text-tertiary">
              Edit goal
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
        {/* Active limit notice */}
        {mode === "new" && activeCount >= 3 && (
          <div
            className="text-[12px] px-3 py-2 rounded-[4px] border"
            style={{
              borderColor: "hsl(var(--text-warning))",
              color: "hsl(var(--text-warning))",
              background: "hsl(var(--surface-raised))",
            }}
          >
            You already have 3 active goals. Complete or drop one first.
          </div>
        )}

        {/* Title */}
        <div>
          <input
            ref={titleRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => persistField("title", title.trim())}
            placeholder="Goal title"
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

        {/* Type + target date */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-text-tertiary mb-2">
              Type
            </div>
            <select
              value={type}
              onChange={(e) => {
                const v = e.target.value as GoalType;
                setType(v);
                if (mode === "edit") persistField("type", v);
              }}
              className="w-full bg-surface-raised border border-border-subtle rounded-[4px] px-2 py-1.5 text-[13px] text-text-primary outline-none"
            >
              {TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-text-tertiary mb-2">
              Target date
            </div>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => {
                setTargetDate(e.target.value);
                if (mode === "edit") persistField("targetDate", e.target.value || undefined);
              }}
              className="w-full bg-surface-raised border border-border-subtle rounded-[4px] px-2 py-1.5 text-[13px] text-text-primary outline-none"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-text-tertiary mb-2">
            Description
          </div>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={() => persistField("description", description || undefined)}
            placeholder="Why does this goal matter?"
            rows={3}
            className="w-full bg-surface-raised border border-border-subtle rounded-[4px] px-2 py-1.5 text-[13px] text-text-primary placeholder:text-text-tertiary outline-none resize-y"
          />
        </div>

        {/* Success criteria */}
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-text-tertiary mb-2">
            Success criteria
          </div>
          <div className="space-y-1.5">
            {criteria.map((c) => (
              <div
                key={c.id}
                className="flex items-center gap-2 bg-surface-raised border border-border-subtle rounded-[4px] px-2 py-1.5"
              >
                <button
                  onClick={() => toggleCriterion(c.id)}
                  className="w-3.5 h-3.5 rounded-[2px] border border-text-tertiary shrink-0 inline-flex items-center justify-center"
                  style={{
                    background: c.done ? "hsl(var(--accent))" : "transparent",
                    borderColor: c.done ? "hsl(var(--accent))" : "hsl(var(--text-tertiary))",
                  }}
                >
                  {c.done && (
                    <span className="text-[9px]" style={{ color: "hsl(var(--surface-base))" }}>
                      ✓
                    </span>
                  )}
                </button>
                <span
                  className={`flex-1 text-[12px] ${c.done ? "line-through text-text-tertiary" : "text-text-primary"}`}
                >
                  {c.text}
                </span>
                <button
                  onClick={() => removeCriterion(c.id)}
                  className="text-text-tertiary hover:text-text-warning text-[12px] px-1"
                >
                  ✕
                </button>
              </div>
            ))}
            <div className="flex gap-1.5 pt-1">
              <input
                value={newCriterion}
                onChange={(e) => setNewCriterion(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addCriterion();
                  }
                }}
                placeholder="Add a criterion..."
                className="flex-1 bg-surface-raised border border-border-subtle rounded-[4px] px-2 py-1.5 text-[12px] text-text-primary placeholder:text-text-tertiary outline-none"
              />
              <button
                onClick={addCriterion}
                className="text-[12px] px-2.5 py-1 rounded-[4px] border border-border-subtle text-text-secondary hover:text-text-primary"
              >
                Add
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        {mode === "edit" && (
          <div className="grid grid-cols-3 gap-3 pt-2 border-t border-border-subtle">
            <Stat label="Projects" value={childStats.projects} />
            <Stat label="Open projects" value={childStats.openProjects} />
            <Stat label="Open actions" value={childStats.openActions} />
          </div>
        )}
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
              disabled={activeCount >= 3}
              className="text-[13px] font-medium px-3 py-1.5 rounded-[4px] disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: "hsl(var(--accent))",
                color: "hsl(var(--surface-base))",
              }}
            >
              Save goal
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
              {!isTerminal && (
                <button
                  onClick={() => setConfirmComplete(true)}
                  className="text-[13px] font-medium px-3 py-1.5 rounded-[4px]"
                  style={{
                    background: "hsl(var(--accent))",
                    color: "hsl(var(--surface-base))",
                  }}
                >
                  Mark complete
                </button>
              )}
            </div>
          </>
        )}
      </div>

      <ConfirmModal
        open={confirmDelete}
        title="Delete this goal?"
        body="This permanently removes the goal and ALL its projects, actions, rituals, and ideas. This cannot be undone."
        confirmLabel="Delete"
        destructive
        onCancel={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
      />
      <ConfirmModal
        open={confirmDrop}
        title="Drop this goal?"
        body={
          childStats.openProjects + childStats.openActions > 0
            ? `${childStats.openProjects} open project${childStats.openProjects === 1 ? "" : "s"} and ${childStats.openActions} open action${childStats.openActions === 1 ? "" : "s"} will be dropped along with it. You can re-open the goal later (subject to the 3-active limit).`
            : "You can re-open the goal later (subject to the 3-active limit)."
        }
        confirmLabel="Drop goal"
        destructive
        onCancel={() => setConfirmDrop(false)}
        onConfirm={handleConfirmDrop}
      />
      <ConfirmModal
        open={confirmComplete}
        title="Mark this goal complete?"
        body={
          childStats.openProjects + childStats.openActions > 0
            ? `${childStats.openProjects} project${childStats.openProjects === 1 ? "" : "s"} and ${childStats.openActions} action${childStats.openActions === 1 ? "" : "s"} are still open. They will not be auto-closed.`
            : "All projects and actions are accounted for."
        }
        confirmLabel="Mark complete"
        onCancel={() => setConfirmComplete(false)}
        onConfirm={handleConfirmComplete}
      />
    </EditorShell>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="font-mono text-[18px] tabular-nums text-text-primary">{value}</div>
      <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-text-tertiary mt-0.5">
        {label}
      </div>
    </div>
  );
}
