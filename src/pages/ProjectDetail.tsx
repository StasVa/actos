import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams, useNavigate, useBeforeUnload } from "react-router-dom";
import { toast } from "sonner";
import { Tooltip, StateDotTooltip } from "@/components/Tooltip";
import { useStore, selectors } from "@/store/useStore";
import type { Action, ActionStatus, GoalColorVar, Project, ProjectReference, ProjectStatus } from "@/types";
import { AppSidebar } from "@/components/AppSidebar";
import { ActionRow as SharedActionRow } from "@/components/ActionRow";
import { RichTextEditor } from "@/components/RichTextEditor";
import { CardMenu } from "@/components/CardMenu";
import { ConfirmModal } from "@/components/ConfirmModal";

const COLOR_VAR: Record<GoalColorVar, string> = {
  "goal-1": "hsl(var(--goal-1))",
  "goal-2": "hsl(var(--goal-2))",
  "goal-3": "hsl(var(--goal-3))",
};

function fmtAgo(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const Check: React.FC<{ done?: boolean; color: string; onClick?: () => void }> = ({
  done,
  color,
  onClick,
}) => (
  <button
    onClick={onClick}
    type="button"
    className="inline-flex items-center justify-center w-4 h-4 rounded-[2px] shrink-0"
    style={{
      border: done ? "none" : "1px solid hsl(var(--text-tertiary))",
      background: done ? color : "transparent",
      color: "hsl(var(--surface-base))",
      fontSize: 10,
      lineHeight: 1,
      cursor: "pointer",
    }}
    aria-label={done ? "Mark not done" : "Mark done"}
  >
    {done ? "✓" : ""}
  </button>
);

const STATUS_LABEL: Record<ActionStatus, string> = {
  backlog: "BACKLOG",
  planned: "PLANNED",
  done: "DONE",
  delegated: "DELEGATED",
  dropped: "DROPPED",
  cancelled: "CANCELLED",
};

const ActionRow: React.FC<{ a: Action; color: string }> = ({ a, color }) => {
  const openPanel = useStore((s) => s.openPanel);
  const changeStatus = useStore((s) => s.changeActionStatus);
  return (
    <SharedActionRow
      action={a}
      goalColor={color}
      onClick={() => openPanel({ kind: "action", mode: "edit", id: a.id })}
      onToggleDone={() =>
        changeStatus(a.id, a.status === "done" ? "backlog" : "done")
      }
    />
  );
};

const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `ref-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

const ReferencesSection: React.FC<{
  project: Project;
  onAdd: (r: ProjectReference) => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, partial: Partial<ProjectReference>) => void;
}> = ({ project, onAdd, onRemove, onUpdate }) => {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");

  const startAdd = () => {
    setEditingId(null);
    setUrl("");
    setTitle("");
    setAdding(true);
  };

  const startEdit = (r: ProjectReference) => {
    setAdding(false);
    setUrl(r.url);
    setTitle(r.title ?? "");
    setEditingId(r.id);
  };

  const cancel = () => {
    setAdding(false);
    setEditingId(null);
    setUrl("");
    setTitle("");
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const u = url.trim();
    if (!u) return;
    if (editingId) {
      onUpdate(editingId, { url: u, title: title.trim() || undefined });
    } else {
      onAdd({ id: uid(), url: u, title: title.trim() || undefined });
    }
    cancel();
  };

  const formOpen = adding || editingId !== null;

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-tertiary">
          REFERENCES · {project.references.length}
        </h2>
        {!formOpen && (
          <button
            type="button"
            onClick={startAdd}
            className="text-[12px] text-accent hover:text-accent-hover"
          >
            + Add reference
          </button>
        )}
      </div>

      {formOpen && (
        <form
          onSubmit={submit}
          className="mb-3 bg-surface-raised border border-border-subtle rounded-[6px] p-3 flex flex-col gap-2"
        >
          <input
            autoFocus
            type="url"
            placeholder="https://..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
            className="bg-surface-base border border-border-subtle rounded-[4px] px-2 py-1.5 text-[13px] text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent"
          />
          <input
            type="text"
            placeholder="Title (optional)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="bg-surface-base border border-border-subtle rounded-[4px] px-2 py-1.5 text-[13px] text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent"
          />
          <div className="flex items-center gap-2 justify-end">
            <button
              type="button"
              onClick={cancel}
              className="text-[12px] text-text-tertiary hover:text-text-secondary px-2 py-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="text-[12px] bg-accent hover:bg-accent-hover text-white px-3 py-1 rounded-[4px]"
            >
              {editingId ? "Save" : "Add"}
            </button>
          </div>
        </form>
      )}

      {project.references.length === 0 && !formOpen ? (
        <div className="text-[13px] text-text-tertiary">
          No references yet. Click + Add reference to add docs, links, materials.
        </div>
      ) : (
        <div className="flex flex-col">
          {project.references.map((r) => (
            <div
              key={r.id}
              className="group flex items-start gap-2 px-2 py-2 rounded-[4px] hover:bg-surface-hover transition-colors"
            >
              <span className="text-text-tertiary text-[12px] mt-0.5 shrink-0">↗</span>
              <a
                href={r.url}
                target="_blank"
                rel="noreferrer"
                className="flex-1 min-w-0"
              >
                <div className="text-[13px] text-text-primary hover:text-accent truncate">
                  {r.title || r.url}
                </div>
                {r.title && (
                  <div className="font-mono text-[11px] text-text-tertiary truncate">
                    {r.url}
                  </div>
                )}
              </a>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <CardMenu
                  ariaLabel="Reference menu"
                  items={[
                    { label: "Edit", onSelect: () => startEdit(r) },
                    { label: "Remove", destructive: true, onSelect: () => onRemove(r.id) },
                  ]}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

/* ===== Inline title editor ===== */
const TitleField: React.FC<{
  value: string;
  autoFocus: boolean;
  onCommit: (next: string) => void;
}> = ({ value, autoFocus, onCommit }) => {
  const [editing, setEditing] = useState(autoFocus);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editing) setDraft(value);
  }, [value, editing]);

  useEffect(() => {
    if (editing) {
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [editing]);

  const commit = () => {
    const next = draft.trim();
    if (next !== value) onCommit(next);
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit();
          } else if (e.key === "Escape") {
            setDraft(value);
            setEditing(false);
          }
        }}
        placeholder="Untitled project"
        className="w-full bg-transparent outline-none text-[32px] font-medium text-text-primary placeholder:text-text-tertiary leading-tight"
      />
    );
  }

  return (
    <h1
      onClick={() => setEditing(true)}
      className="text-[32px] font-medium leading-tight cursor-text"
      style={{ color: value ? "hsl(var(--text-primary))" : "hsl(var(--text-tertiary))" }}
    >
      {value || "Untitled project"}
    </h1>
  );
};

/* ===== Inline goal selector ===== */
const GoalSelector: React.FC<{
  project: Project;
  onChange: (goalId: string) => void;
}> = ({ project, onChange }) => {
  const goals = useStore((s) => s.goals.filter((g) => g.status === "active"));
  const goal = useStore((s) => s.goals.find((g) => g.id === project.goalId));
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const color = goal ? COLOR_VAR[goal.color] : "hsl(var(--text-tertiary))";

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 px-2 py-1 rounded-[4px] border border-border-subtle hover:border-border-default text-[12px] text-text-primary transition-colors"
      >
        <span className="w-2 h-2 rounded-full" style={{ background: color }} />
        {goal?.title ?? "—"}
        <span className="text-text-tertiary">▾</span>
      </button>
      {open && (
        <div className="absolute z-20 mt-1 left-0 min-w-[200px] bg-surface-elevated border border-border-subtle rounded-[4px] shadow-lg py-1">
          {goals.map((g) => (
            <button
              key={g.id}
              onClick={() => {
                onChange(g.id);
                setOpen(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-[12px] text-text-primary hover:bg-surface-hover"
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ background: `hsl(var(--${g.color}))` }}
              />
              {g.title}
              {g.id === project.goalId && (
                <span className="ml-auto text-text-tertiary">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

/* ===== Inline status toggle ===== */
const STATUSES: { value: ProjectStatus; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "dropped", label: "Dropped" },
];

const StatusToggle: React.FC<{
  status: ProjectStatus;
  onChange: (next: ProjectStatus) => void;
}> = ({ status, onChange }) => (
  <div className="inline-flex items-center gap-0.5 p-0.5 rounded-[4px] bg-surface-raised border border-border-subtle">
    {STATUSES.map((s) => (
      <button
        key={s.value}
        type="button"
        onClick={() => onChange(s.value)}
        className="text-[11px] px-2 py-0.5 rounded-[3px] transition-colors"
        style={{
          background: s.value === status ? "hsl(var(--surface-elevated))" : "transparent",
          color: s.value === status ? "hsl(var(--text-primary))" : "hsl(var(--text-tertiary))",
        }}
      >
        {s.label}
      </button>
    ))}
  </div>
);

const ProjectDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const project = useStore((s) => s.projects.find((p) => p.id === id));
  const allActions = useStore((s) => s.actions);
  const goal = useStore((s) => (project ? s.goals.find((g) => g.id === project.goalId) : undefined));
  const openPanel = useStore((s) => s.openPanel);
  const updateProject = useStore((s) => s.updateProject);
  const moveProjectToGoal = useStore((s) => s.moveProjectToGoal);
  const markComplete = useStore((s) => s.markProjectComplete);
  const dropProject = useStore((s) => s.dropProject);
  const deleteProject = useStore((s) => s.deleteProject);
  const createAction = useStore((s) => s.createAction);
  const progressOutcome = useStore((s) =>
    project ? selectors.projectProgress(s, project.id).outcome : 0,
  );
  const progressEffort = useStore((s) =>
    project ? selectors.projectProgress(s, project.id).effort : 0,
  );
  const progress = { outcome: progressOutcome, effort: progressEffort };
  const stateInd = useStore((s) =>
    project ? selectors.stateIndicator(s, "project", project.id) : "active",
  );

  const actions = useMemo(
    () => (project ? allActions.filter((a) => a.projectId === project.id) : []),
    [allActions, project],
  );

  // ─── Draft promotion ──────────────────────────────────────────
  // A project is "real" once it has a non-empty title, any reference, any
  // description content, or at least one action.
  const isDraft = !!project?.isDraft;

  const hasMeaningfulContent = (() => {
    if (!project) return false;
    if (project.title.trim()) return true;
    if (project.references.length > 0) return true;
    const desc = project.description ?? "";
    const stripped = desc.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, "").trim();
    if (stripped.length > 0) return true;
    if (actions.length > 0) return true;
    return false;
  })();

  // Auto-promote when draft acquires meaningful content.
  useEffect(() => {
    if (isDraft && hasMeaningfulContent && project && goal) {
      updateProject(project.id, { isDraft: false });
      toast(`Project created in “${goal.title}”`);
    }
  }, [isDraft, hasMeaningfulContent, project, goal, updateProject]);

  // Confirm-on-leave for partial drafts (some content but no title).
  const [confirmLeave, setConfirmLeave] = useState<null | (() => void)>(null);

  // Silent-delete abandoned drafts on unmount when fully empty.
  // (Title-less drafts with content are caught by browser unload prompt fallback.)
  useEffect(() => {
    return () => {
      const fresh = useStore.getState().projects.find((p) => p.id === id);
      if (fresh?.isDraft) {
        const desc = fresh.description ?? "";
        const stripped = desc.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, "").trim();
        const acts = useStore
          .getState()
          .actions.some((a) => a.projectId === fresh.id);
        const empty =
          !fresh.title.trim() &&
          fresh.references.length === 0 &&
          stripped.length === 0 &&
          !acts;
        if (empty) {
          useStore.getState().deleteProject(fresh.id);
        } else if (!fresh.title.trim()) {
          // Promote with placeholder title instead of losing content.
          useStore
            .getState()
            .updateProject(fresh.id, { title: "Untitled project", isDraft: false });
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Quick-add action input (inside hooks scope so it never trips rules-of-hooks).
  const [quickAdd, setQuickAdd] = useState("");

  if (!project || !goal) {
    return (
      <div className="min-h-screen bg-surface-base text-text-primary">
        <AppSidebar />
        <main className="ml-[220px] p-10">
          <div className="text-[14px] text-text-secondary">Project not found.</div>
          <Link to="/" className="mt-4 inline-block text-[13px] text-accent hover:underline">
            ← Back to home
          </Link>
        </main>
      </div>
    );
  }

  const color = COLOR_VAR[goal.color];

  const grouped = {
    planned: actions.filter((a) => a.status === "planned"),
    backlog: actions.filter((a) => a.status === "backlog"),
    done: actions.filter((a) => a.status === "done"),
    delegated: actions.filter((a) => a.status === "delegated"),
    dropped: actions.filter((a) => a.status === "dropped" || a.status === "cancelled"),
  };
  const activeList = [...grouped.planned, ...grouped.backlog].sort(
    (a, b) => (b.impact ?? 0) - (a.impact ?? 0),
  );

  const lastTs = actions
    .map((a) => a.completedAt ?? a.delegatedAt ?? a.updatedAt ?? a.createdAt)
    .filter(Boolean)
    .sort()
    .reverse()[0];

  const totalMinutes = actions
    .filter((a) => a.status !== "dropped" && a.status !== "cancelled")
    .reduce((s, a) => s + (a.timeEstimateMinutes ?? 0), 0);
  const doneMinutes = actions
    .filter((a) => a.status === "done")
    .reduce((s, a) => s + (a.timeEstimateMinutes ?? 0), 0);
  const fmtHM = (m: number) => {
    if (m === 0) return "0h";
    const h = Math.floor(m / 60);
    const min = m % 60;
    return `${h ? `${h}h` : ""}${min ? ` ${min}m` : ""}`.trim() || "0h";
  };

  const ageDays = Math.floor((Date.now() - new Date(project.createdAt).getTime()) / 86400000);
  const projStatusColor =
    project.status === "completed"
      ? "hsl(var(--status-done))"
      : project.status === "dropped"
      ? "hsl(var(--status-dropped))"
      : "hsl(var(--status-done))";
  const projStatusText =
    project.status === "completed" ? "COMPLETED" : project.status === "dropped" ? "DROPPED" : "ACTIVE";

  const handleStatusChange = (next: ProjectStatus) => {
    if (next === project.status) return;
    if (next === "completed") {
      markComplete(project.id);
      toast("Project completed");
    } else if (next === "dropped") {
      dropProject(project.id);
      toast("Project dropped");
    } else {
      updateProject(project.id, {
        status: "active",
        completedAt: undefined,
        droppedAt: undefined,
      });
      toast("Project re-opened");
    }
  };

  const submitQuickAdd = () => {
    const t = quickAdd.trim();
    if (!t) return;
    createAction({
      title: t,
      projectId: project.id,
      goalId: goal.id,
      status: "backlog",
    });
    setQuickAdd("");
  };

  return (
    <div className="min-h-screen bg-surface-base text-text-primary">
      <AppSidebar />
      <div className="ml-[220px] min-h-screen flex">
        {/* Left column */}
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="h-12 px-8 flex items-center justify-between border-b border-border-subtle">
            <Link
              to={`/goals/${goal.id}`}
              className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-tertiary hover:text-text-secondary transition-colors"
            >
              ← {goal.title.toUpperCase()} · PROJECTS
            </Link>
            <div className="flex items-center gap-2">
              {isDraft && (
                <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-text-tertiary">
                  DRAFT
                </span>
              )}
              <span
                className="font-mono text-[10px] uppercase tracking-[0.08em] px-2 py-1 rounded-[4px] bg-surface-hover"
                style={{ color: projStatusColor }}
              >
                {projStatusText}
              </span>
            </div>
          </div>

          <div className="px-10 py-8 space-y-8">
            <section>
              <TitleField
                value={project.title}
                autoFocus={isDraft}
                onCommit={(next) => updateProject(project.id, { title: next })}
              />
              <div className="mt-3 flex items-center gap-2 flex-wrap">
                <GoalSelector
                  project={project}
                  onChange={(gid) => {
                    moveProjectToGoal(project.id, gid);
                    toast("Project moved");
                  }}
                />
                {!isDraft && (
                  <StatusToggle status={project.status} onChange={handleStatusChange} />
                )}
              </div>
              {!isDraft && (
                <>
                  <div className="mt-3 font-mono text-[12px] text-text-tertiary tabular-nums">
                    Created {new Date(project.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })} · {ageDays} days active ·{" "}
                    {grouped.done.length} of {actions.length} actions done
                  </div>
                  <div className="mt-3 font-mono text-[12px] text-text-tertiary">
                    <span>PROGRESS </span>
                    <span className="text-text-primary">{progress.outcome}%</span>
                    <span> · OUTCOME </span>
                    <span className="text-text-primary">{progress.outcome}%</span>
                    <span> · EFFORT </span>
                    <span className="text-text-primary">{progress.effort}%</span>
                    <span> · LAST ACTIVITY </span>
                    <span className="text-text-primary">{lastTs ? fmtAgo(lastTs) : "—"}</span>
                  </div>
                  <div className="mt-2 h-1.5 w-full bg-surface-hover rounded-[4px] overflow-hidden">
                    <div className="h-full rounded-[4px]" style={{ width: `${progress.outcome}%`, background: color }} />
                  </div>
                </>
              )}
            </section>

            <section>
              <h2 className="text-[12px] font-medium uppercase tracking-[0.08em] text-text-secondary mb-2">
                Description
              </h2>
              <RichTextEditor
                value={project.description ?? ""}
                onChange={(html) => updateProject(project.id, { description: html })}
                placeholder="Describe the project, add references, materials..."
              />
            </section>

            <ReferencesSection
              project={project}
              onAdd={(ref) =>
                updateProject(project.id, {
                  references: [...project.references, ref],
                })
              }
              onRemove={(refId) =>
                updateProject(project.id, {
                  references: project.references.filter((r) => r.id !== refId),
                })
              }
              onUpdate={(refId, partial) =>
                updateProject(project.id, {
                  references: project.references.map((r) =>
                    r.id === refId ? { ...r, ...partial } : r,
                  ),
                })
              }
            />

            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-[12px] font-medium uppercase tracking-[0.08em] text-text-secondary">
                  Actions · {actions.length}
                </h2>
                <div className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-tertiary">
                  {grouped.done.length} DONE · {grouped.backlog.length} BACKLOG · {grouped.planned.length} PLANNED · {grouped.delegated.length} DELEGATED
                </div>
              </div>

              <div className="border-t border-border-subtle">
                {activeList.length === 0 ? (
                  <div className="py-3 font-mono text-[11px] text-text-tertiary px-3">
                    No active actions in this project.
                  </div>
                ) : (
                  activeList.map((a) => <ActionRow key={a.id} a={a} color={color} />)
                )}
              </div>

              <div className="mt-2 flex items-center gap-3 h-9 w-full px-3 bg-surface-base border border-border-subtle hover:border-border-default rounded-[4px] transition-colors">
                <span className="inline-block w-4 h-4 rounded-[2px] border border-text-tertiary opacity-50 shrink-0" />
                <input
                  value={quickAdd}
                  onChange={(e) => setQuickAdd(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      submitQuickAdd();
                    }
                  }}
                  placeholder="Add an action…"
                  className="flex-1 bg-transparent outline-none text-[13px] text-text-primary placeholder:text-text-tertiary"
                />
                <span className="font-mono text-[11px] text-text-tertiary">↵</span>
              </div>

              {grouped.delegated.length > 0 && (
                <div className="mt-4">
                  <div className="flex items-center gap-2 h-7 px-3">
                    <span className="text-text-secondary text-[10px]">▾</span>
                    <span className="text-[12px] font-medium uppercase tracking-[0.08em] text-text-secondary">
                      Delegated · {grouped.delegated.length}
                    </span>
                  </div>
                  <div className="border-t border-border-subtle">
                    {grouped.delegated.map((a) => (
                      <ActionRow key={a.id} a={a} color={color} />
                    ))}
                  </div>
                </div>
              )}

              {grouped.done.length > 0 && (
                <div className="mt-4">
                  <div className="flex items-center gap-2 h-7 px-3">
                    <span className="text-text-tertiary text-[10px]">▾</span>
                    <span className="text-[12px] font-medium uppercase tracking-[0.08em] text-text-tertiary">
                      Done · {grouped.done.length}
                    </span>
                  </div>
                  <div className="border-t border-border-subtle">
                    {grouped.done.map((a) => (
                      <ActionRow key={a.id} a={a} color={color} />
                    ))}
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>

        {/* Right column */}
        <aside className="w-[320px] shrink-0 bg-surface-raised border-l border-border-subtle">
          <div className="h-12 px-6 flex items-center justify-end gap-2 border-b border-border-subtle">
            {!isDraft && (
              <CardMenu
                ariaLabel="Project actions"
                items={[
                  ...(project.status === "active"
                    ? [
                        {
                          label: "Mark complete",
                          onSelect: () => handleStatusChange("completed"),
                        },
                        {
                          label: "Drop project",
                          destructive: true,
                          onSelect: () => handleStatusChange("dropped"),
                        },
                      ]
                    : [
                        {
                          label: "Re-open",
                          onSelect: () => handleStatusChange("active"),
                        },
                      ]),
                  {
                    label: "Delete project",
                    destructive: true,
                    onSelect: () => {
                      if (confirm("Delete this project? This cannot be undone.")) {
                        deleteProject(project.id);
                        toast("Project deleted");
                        navigate("/projects");
                      }
                    },
                  },
                ]}
              />
            )}
          </div>
          <div className="p-6 space-y-6">
            <div>
              {([
                [
                  "STATUS",
                  <span className="inline-flex items-center gap-1.5">
                    <Tooltip content={<StateDotTooltip state={stateInd} lastActivity={lastTs ? fmtAgo(lastTs) : "—"} />}>
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{
                          background:
                            stateInd === "active" ? "hsl(var(--state-active))" : "hsl(var(--state-stalled))",
                        }}
                      />
                    </Tooltip>
                    {projStatusText.charAt(0) + projStatusText.slice(1).toLowerCase()}
                  </span>,
                ],
                [
                  "PARENT GOAL",
                  <Link
                    to={`/goals/${goal.id}`}
                    className="inline-flex items-center gap-1.5 hover:text-accent transition-colors"
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
                    {goal.title}
                  </Link>,
                ],
                ["CREATED", new Date(project.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })],
                ["AGE", `${ageDays} days`],
              ] as [string, React.ReactNode][]).map(([k, v], i, arr) => (
                <div
                  key={k}
                  className={`flex items-center justify-between h-6 ${
                    i < arr.length - 1 ? "border-b border-border-subtle" : ""
                  }`}
                >
                  <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-text-tertiary">{k}</span>
                  <span className="text-[12px] text-text-primary">{v}</span>
                </div>
              ))}
            </div>

            {!isDraft && (
              <div>
                <h3 className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-secondary mb-3">
                  State
                </h3>
                <div>
                  {[
                    { label: "OUTCOME", value: `${progress.outcome}%`, pct: progress.outcome, opacity: 1 },
                    { label: "EFFORT", value: `${progress.effort}%`, pct: progress.effort, opacity: 0.6 },
                  ].map((row, i) => (
                    <div
                      key={row.label}
                      className={`h-8 flex items-center gap-3 py-1.5 ${
                        i < 2 ? "border-b border-border-subtle" : ""
                      }`}
                    >
                      <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-text-tertiary w-[70px] shrink-0">
                        {row.label}
                      </span>
                      <span className="flex-1 font-mono text-[14px] text-text-primary tabular-nums">
                        {row.value}
                      </span>
                      <div className="w-[80px] h-[5px] bg-surface-hover rounded-[2px] overflow-hidden shrink-0">
                        <div
                          className="h-full rounded-[2px]"
                          style={{ width: `${row.pct}%`, background: color, opacity: row.opacity }}
                        />
                      </div>
                    </div>
                  ))}
                  <div className="h-8 flex items-center gap-3 py-1.5">
                    <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-text-tertiary w-[70px] shrink-0">
                      TIME
                    </span>
                    <span className="flex-1 font-mono tabular-nums">
                      <span className="text-[14px] text-text-primary">{fmtHM(doneMinutes)}</span>
                      <span className="text-text-tertiary"> / </span>
                      <span className="text-[12px] text-text-secondary">{fmtHM(totalMinutes)}</span>
                    </span>
                    <div className="w-[80px] h-[5px] bg-surface-hover rounded-[2px] overflow-hidden shrink-0">
                      <div
                        className="h-full rounded-[2px]"
                        style={{
                          width: `${totalMinutes > 0 ? Math.round((doneMinutes / totalMinutes) * 100) : 0}%`,
                          background: color,
                        }}
                      />
                    </div>
                  </div>
                </div>
                <p className="mt-2 font-mono text-[11px] text-text-tertiary">
                  Effort discounts delegated work to 20%.
                </p>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};

export default ProjectDetail;
