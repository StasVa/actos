// Project editor — slide-in panel from the right. Controlled by the store's
// ui.activePanel slot (`{ kind: "project", mode, id?, prefill? }`).
//
// Edit mode autosaves on blur; new mode requires explicit Save. Status changes
// route through the store's lifecycle methods so cascades (drop → drop child
// actions/rituals) stay correct.

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useStore } from "@/store/useStore";
import type { ID, Project, ProjectReference, ProjectStatus } from "@/types";
import { ConfirmModal } from "./ConfirmModal";

const STATUS_ORDER: ProjectStatus[] = ["active", "completed", "dropped"];
const STATUS_LABEL: Record<ProjectStatus, string> = {
  active: "Active",
  completed: "Completed",
  dropped: "Dropped",
};

export function ProjectEditor() {
  const panel = useStore((s) => s.ui.activePanel);
  const closePanel = useStore((s) => s.closePanel);
  const open = panel?.kind === "project";

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closePanel();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, closePanel]);

  if (!open || panel?.kind !== "project") return null;

  return (
    <>
      <div
        className="fixed inset-0 z-[80]"
        style={{ background: "rgba(0,0,0,0.4)" }}
        onClick={closePanel}
      />
      <ProjectEditorPanel
        key={(panel.mode === "edit" ? panel.id : "new") ?? "new"}
        mode={panel.mode}
        projectId={panel.id}
        prefill={panel.prefill}
        onClose={closePanel}
      />
    </>
  );
}

function ProjectEditorPanel({
  mode,
  projectId,
  prefill,
  onClose,
}: {
  mode: "edit" | "new";
  projectId?: ID;
  prefill?: Partial<Project>;
  onClose: () => void;
}) {
  const project = useStore((s) =>
    projectId ? s.projects.find((p) => p.id === projectId) : undefined,
  );
  const goals = useStore((s) => s.goals);
  const actions = useStore((s) => s.actions);

  const createProject = useStore((s) => s.createProject);
  const updateProject = useStore((s) => s.updateProject);
  const markProjectComplete = useStore((s) => s.markProjectComplete);
  const dropProject = useStore((s) => s.dropProject);
  const deleteProject = useStore((s) => s.deleteProject);
  const moveProjectToGoal = useStore((s) => s.moveProjectToGoal);

  const seed: Partial<Project> = mode === "edit" && project ? project : prefill ?? {};
  const [title, setTitle] = useState(seed.title ?? "");
  const [description, setDescription] = useState(seed.description ?? "");
  const [goalId, setGoalId] = useState<ID>(
    seed.goalId ?? goals.find((g) => g.status === "active")?.id ?? goals[0]?.id ?? "",
  );
  const [refs, setRefs] = useState<ProjectReference[]>(seed.references ?? []);
  const [newRefUrl, setNewRefUrl] = useState("");
  const [newRefTitle, setNewRefTitle] = useState("");

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmDrop, setConfirmDrop] = useState(false);
  const [confirmComplete, setConfirmComplete] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    titleRef.current?.focus();
    if (mode === "new") titleRef.current?.select();
  }, [mode]);

  const status = project?.status ?? "active";
  const isTerminal = status === "completed" || status === "dropped";

  // Derived child stats.
  const childStats = useMemo(() => {
    if (!projectId) return { total: 0, done: 0, openNonTerminal: 0 };
    const list = actions.filter((a) => a.projectId === projectId);
    const done = list.filter((a) => a.status === "done").length;
    const openNonTerminal = list.filter(
      (a) =>
        a.status !== "done" &&
        a.status !== "dropped" &&
        a.status !== "cancelled",
    ).length;
    return { total: list.length, done, openNonTerminal };
  }, [actions, projectId]);

  const persistField = <K extends keyof Project>(field: K, value: Project[K]) => {
    if (mode !== "edit" || !projectId) return;
    updateProject(projectId, { [field]: value } as Partial<Project>);
  };

  const handleStatusChange = (next: ProjectStatus) => {
    if (!projectId || mode !== "edit") return;
    if (next === status) return;
    if (next === "completed") {
      setConfirmComplete(true);
      return;
    }
    if (next === "dropped") {
      setConfirmDrop(true);
      return;
    }
    // Re-open
    updateProject(projectId, {
      status: "active",
      completedAt: undefined,
      droppedAt: undefined,
    });
    toast("Project re-opened");
  };

  const handleSaveNew = () => {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!goalId) {
      toast.error("Pick a goal");
      return;
    }
    const newId = createProject({
      title: title.trim(),
      goalId,
      description: description || undefined,
      references: refs,
    });
    toast("Project created");
    useStore.getState().openPanel({ kind: "project", mode: "edit", id: newId });
  };

  const handleDelete = () => {
    if (!projectId) return;
    deleteProject(projectId);
    toast("Project deleted");
    setConfirmDelete(false);
    onClose();
  };

  const handleConfirmDrop = () => {
    if (!projectId) return;
    dropProject(projectId);
    toast(
      childStats.openNonTerminal > 0
        ? `Project dropped · ${childStats.openNonTerminal} action${childStats.openNonTerminal === 1 ? "" : "s"} dropped`
        : "Project dropped",
    );
    setConfirmDrop(false);
  };

  const handleConfirmComplete = () => {
    if (!projectId) return;
    markProjectComplete(projectId);
    toast("Project completed");
    setConfirmComplete(false);
  };

  const handleGoalChange = (newGoalId: ID) => {
    setGoalId(newGoalId);
    if (mode === "edit" && projectId) {
      moveProjectToGoal(projectId, newGoalId);
      toast("Project moved to new goal");
    }
  };

  const addReference = () => {
    if (!newRefUrl.trim()) return;
    const ref: ProjectReference = {
      id:
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `ref-${Date.now()}`,
      url: newRefUrl.trim(),
      title: newRefTitle.trim() || undefined,
    };
    const next = [...refs, ref];
    setRefs(next);
    setNewRefUrl("");
    setNewRefTitle("");
    if (mode === "edit") persistField("references", next);
  };

  const removeReference = (id: ID) => {
    const next = refs.filter((r) => r.id !== id);
    setRefs(next);
    if (mode === "edit") persistField("references", next);
  };

  return (
    <aside
      className="fixed top-0 right-0 bottom-0 z-[90] w-[480px] max-w-[100vw] bg-surface-base border-l border-border-subtle flex flex-col"
      style={{ boxShadow: "-8px 0 24px rgba(0,0,0,0.3)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle">
        <div className="font-mono text-[11px] uppercase tracking-[0.08em] text-text-tertiary">
          {mode === "new" ? "New project" : "Edit project"}
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
            placeholder="Project title"
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

        {/* Goal */}
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-text-tertiary mb-2">
            Goal
          </div>
          <select
            value={goalId}
            onChange={(e) => handleGoalChange(e.target.value)}
            className="w-full bg-surface-raised border border-border-subtle rounded-[4px] px-2 py-1.5 text-[13px] text-text-primary outline-none"
          >
            {goals
              .filter((g) => g.status === "active")
              .map((g) => (
                <option key={g.id} value={g.id}>
                  {g.title}
                </option>
              ))}
          </select>
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
            placeholder="What is this project about?"
            rows={4}
            className="w-full bg-surface-raised border border-border-subtle rounded-[4px] px-2 py-1.5 text-[13px] text-text-primary placeholder:text-text-tertiary outline-none resize-y"
          />
        </div>

        {/* References */}
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-text-tertiary mb-2">
            References
          </div>
          <div className="space-y-1.5">
            {refs.map((r) => (
              <div
                key={r.id}
                className="flex items-center gap-2 bg-surface-raised border border-border-subtle rounded-[4px] px-2 py-1.5"
              >
                <a
                  href={r.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 truncate text-[12px] text-text-primary hover:text-accent"
                >
                  {r.title || r.url}
                </a>
                <button
                  onClick={() => removeReference(r.id)}
                  className="text-text-tertiary hover:text-text-warning text-[12px] px-1"
                >
                  ✕
                </button>
              </div>
            ))}
            <div className="flex flex-col gap-1.5 pt-1">
              <input
                value={newRefUrl}
                onChange={(e) => setNewRefUrl(e.target.value)}
                placeholder="https://..."
                className="bg-surface-raised border border-border-subtle rounded-[4px] px-2 py-1.5 text-[12px] text-text-primary placeholder:text-text-tertiary outline-none"
              />
              <div className="flex gap-1.5">
                <input
                  value={newRefTitle}
                  onChange={(e) => setNewRefTitle(e.target.value)}
                  placeholder="Optional title"
                  className="flex-1 bg-surface-raised border border-border-subtle rounded-[4px] px-2 py-1.5 text-[12px] text-text-primary placeholder:text-text-tertiary outline-none"
                />
                <button
                  onClick={addReference}
                  className="text-[12px] px-2.5 py-1 rounded-[4px] border border-border-subtle text-text-secondary hover:text-text-primary"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        {mode === "edit" && (
          <div className="grid grid-cols-3 gap-3 pt-2 border-t border-border-subtle">
            <Stat label="Actions" value={childStats.total} />
            <Stat label="Done" value={childStats.done} />
            <Stat label="Open" value={childStats.openNonTerminal} />
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
              className="text-[13px] font-medium px-3 py-1.5 rounded-[4px]"
              style={{
                background: "hsl(var(--accent))",
                color: "hsl(var(--surface-base))",
              }}
            >
              Save project
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
        title="Delete this project?"
        body="This permanently removes the project and all its actions and rituals. This cannot be undone."
        confirmLabel="Delete"
        destructive
        onCancel={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
      />
      <ConfirmModal
        open={confirmDrop}
        title="Drop this project?"
        body={
          childStats.openNonTerminal > 0
            ? `${childStats.openNonTerminal} open action${childStats.openNonTerminal === 1 ? "" : "s"} will be dropped along with it. You can re-open the project later.`
            : "You can re-open the project later."
        }
        confirmLabel="Drop project"
        destructive
        onCancel={() => setConfirmDrop(false)}
        onConfirm={handleConfirmDrop}
      />
      <ConfirmModal
        open={confirmComplete}
        title="Mark this project complete?"
        body={
          childStats.openNonTerminal > 0
            ? `${childStats.openNonTerminal} action${childStats.openNonTerminal === 1 ? " is" : "s are"} still open. Completing the project does not auto-close them.`
            : "All actions are accounted for."
        }
        confirmLabel="Mark complete"
        onCancel={() => setConfirmComplete(false)}
        onConfirm={handleConfirmComplete}
      />
    </aside>
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
