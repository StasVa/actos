import React, { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Tooltip, StateDotTooltip } from "@/components/Tooltip";
import { useStore, selectors } from "@/store/useStore";
import type { Action, ActionStatus, GoalColorVar, Project, ProjectReference } from "@/types";
import { AppSidebar } from "@/components/AppSidebar";
import { ActionRow as SharedActionRow } from "@/components/ActionRow";
import { RichTextEditor } from "@/components/RichTextEditor";
import { CardMenu } from "@/components/CardMenu";

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

const ProjectDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const project = useStore((s) => s.projects.find((p) => p.id === id));
  const allActions = useStore((s) => s.actions);
  const goal = useStore((s) => (project ? s.goals.find((g) => g.id === project.goalId) : undefined));
  const openPanel = useStore((s) => s.openPanel);
  const updateProject = useStore((s) => s.updateProject);
  const markComplete = useStore((s) => s.markProjectComplete);
  const dropProject = useStore((s) => s.dropProject);
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
  const totalActive = activeList.length + grouped.delegated.length;

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
            <span
              className="font-mono text-[10px] uppercase tracking-[0.08em] px-2 py-1 rounded-[4px] bg-surface-hover"
              style={{ color: projStatusColor }}
            >
              {projStatusText}
            </span>
          </div>

          <div className="px-10 py-8 space-y-8">
            <section>
              <h1 className="text-[24px] font-medium text-text-primary">{project.title}</h1>
              <div className="mt-2 font-mono text-[12px] text-text-tertiary tabular-nums">
                Created {new Date(project.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })} · {ageDays} days active ·{" "}
                {grouped.done.length} of {totalActive + grouped.done.length} actions done
              </div>
              <div className="mt-3 font-mono text-[12px] text-text-tertiary">
                <span>PROGRESS </span>
                <span className="text-text-primary">{progress.outcome}%</span>
                <span> · OUTCOME </span>
                <span className="text-text-primary">{progress.outcome}%</span>
                <span> · EFFORT </span>
                <span className="text-text-primary">{progress.effort}%</span>
                <span> · LAST ACTIVITY </span>
                <span className="text-text-primary">{fmtAgo(lastTs)}</span>
              </div>
              <div className="mt-2 h-1.5 w-full bg-surface-hover rounded-[4px] overflow-hidden">
                <div className="h-full rounded-[4px]" style={{ width: `${progress.outcome}%`, background: color }} />
              </div>
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

              <button
                type="button"
                onClick={() =>
                  openPanel({
                    kind: "action",
                    mode: "new",
                    prefill: { projectId: project.id, goalId: goal.id } as Partial<Action>,
                  })
                }
                className="mt-2 group flex items-center gap-3 h-9 w-full px-3 bg-surface-base border border-border-subtle hover:border-border-default rounded-[4px] cursor-pointer transition-colors"
              >
                <span className="inline-block w-4 h-4 rounded-[2px] border border-text-tertiary opacity-50" />
                <span className="text-[13px] text-text-tertiary group-hover:text-text-secondary">
                  Add an action…
                </span>
                <div className="flex-1" />
                <span className="font-mono text-[11px] text-text-tertiary">⌘+</span>
              </button>

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
            <button
              onClick={() => openPanel({ kind: "project", mode: "edit", id: project.id })}
              className="text-text-tertiary hover:text-text-secondary text-[12px] cursor-pointer"
            >
              Edit
            </button>
            {project.status === "active" && (
              <>
                <button
                  onClick={() => markComplete(project.id)}
                  className="text-text-tertiary hover:text-text-secondary text-[12px] cursor-pointer"
                >
                  Complete
                </button>
                <button
                  onClick={() => dropProject(project.id)}
                  className="text-text-tertiary hover:text-text-secondary text-[12px] cursor-pointer"
                >
                  Drop
                </button>
              </>
            )}
          </div>
          <div className="p-6 space-y-6">
            <div>
              {([
                [
                  "STATUS",
                  <span className="inline-flex items-center gap-1.5">
                    <Tooltip content={<StateDotTooltip state={stateInd} lastActivity={fmtAgo(lastTs)} />}>
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
          </div>
        </aside>
      </div>
    </div>
  );
};

export default ProjectDetail;
