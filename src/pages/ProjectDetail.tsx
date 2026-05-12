import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Tooltip, StateDotTooltip } from "@/components/Tooltip";

import { useStore } from "@/store/useStore";
import { useProjectProgress, useStateIndicator } from "@/lib/selectors";
import { useGoalsQuery } from "@/lib/queries/useGoals";
import {
  useDeleteProjectMutation,
  useDropProjectMutation,
  useMarkProjectCompleteMutation,
  useMoveProjectToGoalMutation,
  useProjectsQuery,
  useUpdateProjectMutation,
} from "@/lib/queries/useProjects";
import {
  useActionsQuery,
  useChangeActionStatusMutation,
  useCreateActionMutation,
} from "@/lib/queries/useActions";
import { queryKeys } from "@/lib/queryKeys";
import type { Action, ActionStatus, GoalColorVar, Project, ProjectReference, ProjectStatus } from "@/types";
import { AppSidebar } from "@/components/AppSidebar";
import { ActionRow as SharedActionRow } from "@/components/ActionRow";
import { RichTextEditor } from "@/components/RichTextEditor";
import { CardMenu } from "@/components/CardMenu";
import { formatDuration } from "@/lib/format";

const COLOR_VAR: Record<GoalColorVar, string> = {
  "goal-1": "hsl(var(--goal-1))",
  "goal-2": "hsl(var(--goal-2))",
  "goal-3": "hsl(var(--goal-3))",
};

function fmtAgo(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days <= 0) return i18n.t("time.today");
  if (days === 1) return i18n.t("time.yesterday");
  if (days < 30) return i18n.t("time.daysAgo_other", { count: days });
  return new Date(iso).toLocaleDateString(i18n.language || "en", { month: "short", day: "numeric" });
}

function fmtFullDate(iso: string): string {
  return new Date(iso).toLocaleDateString(i18n.language || "en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function fmtShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString(i18n.language || "en", { month: "short", day: "numeric" });
}

const Check: React.FC<{ done?: boolean; color: string; onClick?: () => void }> = ({
  done,
  color,
  onClick,
}) => {
  const { t } = useTranslation();
  return (
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
      aria-label={done ? t("projectDetail.markNotDone") : t("common.markDone")}
    >
      {done ? "✓" : ""}
    </button>
  );
};

const STATUS_LABEL: Record<ActionStatus, string> = {
  backlog: "BACKLOG",
  planned: "PLANNED",
  done: "DONE",
  delegated: "DELEGATED",
  dropped: "DROPPED",
  cancelled: "CANCELLED",
};

const ActionRow: React.FC<{ a: Action; color: string }> = ({ a, color }) => {
  const { t } = useTranslation();
  const openPanel = useStore((s) => s.openPanel);
  const changeActionStatusMutation = useChangeActionStatusMutation();
  const handleToggle = () => {
    if (a.status === "delegated" || a.status === "dropped" || a.status === "cancelled") return;
    if (a.status === "done") {
      const today = new Date().toISOString().slice(0, 10);
      void changeActionStatusMutation.mutateAsync({
        id: a.id,
        newStatus: "planned",
        statusPayload: { scheduledDate: today },
      });
      toast.dismiss();
      toast.success(t("home.actions.toast.reopened"));
      return;
    }
    if (!a.impact || !a.timeEstimateMinutes) {
      toast.error(t("home.actions.toast.needImpactTime"));
      openPanel({ kind: "action", mode: "edit", id: a.id });
      return;
    }
    void changeActionStatusMutation.mutateAsync({ id: a.id, newStatus: "done" });
    toast.dismiss();
    toast.success(t("home.actions.toast.markedDone"));
  };
  return (
    <SharedActionRow
      action={a}
      goalColor={color}
      onClick={() => openPanel({ kind: "action", mode: "edit", id: a.id })}
      onToggleDone={handleToggle}
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
  const { t } = useTranslation();
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
          {t("projectDetail.references.title", { count: project.references.length })}
        </h2>
        {!formOpen && (
          <button
            type="button"
            onClick={startAdd}
            className="text-[12px] text-accent hover:text-accent-hover"
          >
            {t("projectDetail.references.add")}
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
            placeholder={t("projectDetail.references.urlPlaceholder")}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
            className="bg-surface-base border border-border-subtle rounded-[4px] px-2 py-1.5 text-[13px] text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent"
          />
          <input
            type="text"
            placeholder={t("projectDetail.references.titlePlaceholder")}
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
              {t("common.cancel")}
            </button>
            <button
              type="submit"
              className="text-[12px] bg-accent hover:bg-accent-hover text-white px-3 py-1 rounded-[4px]"
            >
              {editingId ? t("common.save") : t("common.add")}
            </button>
          </div>
        </form>
      )}

      {project.references.length === 0 && !formOpen ? (
        <div className="text-[13px] text-text-tertiary">
          {t("projectDetail.references.empty")}
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
                  ariaLabel={t("projectDetail.references.menu.aria")}
                  items={[
                    { label: t("common.edit"), onSelect: () => startEdit(r) },
                    { label: t("projectDetail.references.remove"), destructive: true, onSelect: () => onRemove(r.id) },
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
  const { t } = useTranslation();
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
        placeholder={t("projectDetail.titlePlaceholder")}
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
      {value || t("projectDetail.untitled")}
    </h1>
  );
};

/* ===== Inline goal selector ===== */
const GoalSelector: React.FC<{
  project: Project;
  onChange: (goalId: string) => void;
}> = ({ project, onChange }) => {
  const allGoals = useGoalsQuery().data ?? [];
  const goals = useMemo(
    () => allGoals.filter((g) => g.status === "active"),
    [allGoals],
  );
  const goal = useMemo(
    () => allGoals.find((g) => g.id === project.goalId),
    [allGoals, project.goalId],
  );
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
const STATUS_KEYS: { value: ProjectStatus; key: string }[] = [
  { value: "active", key: "projectDetail.status.active" },
  { value: "completed", key: "projectDetail.status.completed" },
  { value: "dropped", key: "projectDetail.status.dropped" },
];

const StatusToggle: React.FC<{
  status: ProjectStatus;
  onChange: (next: ProjectStatus) => void;
}> = ({ status, onChange }) => {
  const { t } = useTranslation();
  return (
    <div className="inline-flex items-center gap-0.5 p-0.5 rounded-[4px] bg-surface-raised border border-border-subtle">
      {STATUS_KEYS.map((s) => (
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
          {t(s.key)}
        </button>
      ))}
    </div>
  );
};

const ProjectDetail: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const allProjects = useProjectsQuery().data ?? [];
  const project = allProjects.find((p) => p.id === id);
  const allActions = useActionsQuery().data ?? [];
  const allGoals = useGoalsQuery().data ?? [];
  const goal = project ? allGoals.find((g) => g.id === project.goalId) : undefined;
  const openPanel = useStore((s) => s.openPanel);
  const queryClient = useQueryClient();
  const updateProjectMutation = useUpdateProjectMutation();
  const moveProjectToGoalMutation = useMoveProjectToGoalMutation();
  const markCompleteMutation = useMarkProjectCompleteMutation();
  const dropProjectMutation = useDropProjectMutation();
  const deleteProjectMutation = useDeleteProjectMutation();
  // Mutation handles change identity each render; keep latest in a ref so the
  // unmount cleanup below sees current handles after dependent state changes.
  const cleanupRef = useRef({ update: updateProjectMutation, delete: deleteProjectMutation });
  cleanupRef.current = { update: updateProjectMutation, delete: deleteProjectMutation };
  const createActionMutation = useCreateActionMutation();
  const progress = useProjectProgress(project?.id ?? "");
  const stateInd = useStateIndicator("project", project?.id ?? "");

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
  const projectId = project?.id;
  const goalTitle = goal?.title;
  useEffect(() => {
    if (isDraft && hasMeaningfulContent && projectId) {
      void updateProjectMutation.mutateAsync({ id: projectId, partial: { isDraft: false } });
      if (goalTitle) toast(t("projectDetail.toast.created", { title: goalTitle }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDraft, hasMeaningfulContent, projectId]);

  // Confirm-on-leave for partial drafts (some content but no title).
  const [confirmLeave, setConfirmLeave] = useState<null | (() => void)>(null);

  // Silent-delete abandoned drafts on unmount when fully empty.
  // (Title-less drafts with content are caught by browser unload prompt fallback.)
  useEffect(() => {
    return () => {
      const cachedProjects = queryClient.getQueryData<Project[]>(queryKeys.projects) ?? [];
      const fresh = cachedProjects.find((p) => p.id === id);
      if (fresh?.isDraft) {
        const desc = fresh.description ?? "";
        const stripped = desc.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, "").trim();
        const cachedActions = queryClient.getQueryData<Action[]>(queryKeys.actions) ?? [];
        const acts = cachedActions.some((a) => a.projectId === fresh.id);
        const empty =
          !fresh.title.trim() &&
          fresh.references.length === 0 &&
          stripped.length === 0 &&
          !acts;
        if (empty) {
          void cleanupRef.current.delete.mutateAsync(fresh.id);
        } else if (!fresh.title.trim()) {
          // Promote with placeholder title instead of losing content.
          void cleanupRef.current.update.mutateAsync({
            id: fresh.id,
            partial: { title: i18n.t("projectDetail.untitled"), isDraft: false },
          });
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
      <main className="app-main page-medium">
          <div className="text-[14px] text-text-secondary">{t("projectDetail.notFound")}</div>
          <Link to="/" className="mt-4 inline-block text-[13px] text-accent hover:underline">
            {t("goalDetail.backHome")}
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
  // Time spent = full Done time + 20% Delegated time.
  const doneMinutes = actions.reduce((s, a) => {
    const t = a.timeEstimateMinutes ?? 0;
    if (t <= 0) return s;
    if (a.status === "done") return s + t;
    if (a.status === "delegated") return s + Math.round(t * 0.2);
    return s;
  }, 0);
  const fmtHM = (m: number) => formatDuration(m);
  const fmtLongDate = (iso: string) =>
    new Date(iso).toLocaleDateString(i18n.language || "en", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  const lastActivityLabel = (() => {
    if (!lastTs) return t("progress.relAgo.today");
    const days = Math.floor((Date.now() - new Date(lastTs).getTime()) / 86400000);
    if (days <= 0) return t("progress.relAgo.today");
    if (days === 1) return t("progress.relAgo.yesterday");
    return t("progress.relAgo.daysAgo", { n: days });
  })();

  const ageDays = Math.floor((Date.now() - new Date(project.createdAt).getTime()) / 86400000);
  const projStatusColor =
    project.status === "completed"
      ? "hsl(var(--status-done))"
      : project.status === "dropped"
      ? "hsl(var(--status-dropped))"
      : "hsl(var(--status-done))";
  const projStatusText =
    project.status === "completed"
      ? t("projectDetail.statusBadge.completed")
      : project.status === "dropped"
      ? t("projectDetail.statusBadge.dropped")
      : t("projectDetail.statusBadge.active");
  const projStatusDisplay =
    project.status === "completed"
      ? t("projectDetail.statusDisplay.completed")
      : project.status === "dropped"
      ? t("projectDetail.statusDisplay.dropped")
      : t("projectDetail.statusDisplay.active");

  const handleStatusChange = (next: ProjectStatus) => {
    if (next === project.status) return;
    if (next === "completed") {
      void markCompleteMutation.mutateAsync(project.id);
      toast(t("projectDetail.toast.completed"));
    } else if (next === "dropped") {
      void dropProjectMutation.mutateAsync(project.id);
      toast(t("projectDetail.toast.dropped"));
    } else {
      void updateProjectMutation.mutateAsync({
        id: project.id,
        partial: {
          status: "active",
          completedAt: undefined,
          droppedAt: undefined,
        },
      });
      toast(t("projectDetail.toast.reopened"));
    }
  };

  const submitQuickAdd = () => {
    const trimmed = quickAdd.trim();
    if (!trimmed) return;
    void createActionMutation.mutateAsync({
      title: trimmed,
      projectId: project.id,
      goalId: goal.id,
      status: "backlog",
    });
    setQuickAdd("");
  };

  return (
    <div className="min-h-screen bg-surface-base text-text-primary">
      <AppSidebar />
      <div className="app-main page-medium min-h-screen flex flex-col md:flex-row">
        {/* Left column */}
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="h-12 px-8 flex items-center justify-between border-b border-border-subtle">
            <Link
              to={`/goals/${goal.id}`}
              className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-tertiary hover:text-text-secondary transition-colors"
            >
              {t("projectDetail.backLink", { goal: goal.title.toUpperCase() })}
            </Link>
            <div className="flex items-center gap-2">
              {isDraft && (
                <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-text-tertiary">
                  {t("projectDetail.draft")}
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
                onCommit={(next) => void updateProjectMutation.mutateAsync({ id: project.id, partial: { title: next } })}
              />
              <div className="mt-3 flex items-center gap-2 flex-wrap">
                <GoalSelector
                  project={project}
                  onChange={(gid) => {
                    void moveProjectToGoalMutation.mutateAsync({ projectId: project.id, newGoalId: gid });
                    toast(t("projectDetail.toast.moved"));
                  }}
                />
                {!isDraft && (
                  <StatusToggle status={project.status} onChange={handleStatusChange} />
                )}
              </div>
              {!isDraft && (
                <>
                  <div className="mt-3 font-mono text-[12px] text-text-tertiary tabular-nums">
                    {t("projectDetail.created", {
                      date: fmtShortDate(project.createdAt),
                      age: ageDays,
                      done: grouped.done.length,
                      total: actions.length,
                    })}
                  </div>
                  <div className="mt-3 font-mono text-[12px] text-text-tertiary">
                    <span>{t("projectDetail.progressLabel.progress")} </span>
                    <span className="text-text-primary">{progress.outcome}%</span>
                    <span> · {t("projectDetail.progressLabel.value")} </span>
                    <span className="text-text-primary">{progress.outcome}%</span>
                    <span> · {t("projectDetail.progressLabel.effort")} </span>
                    <span className="text-text-primary">{progress.effort}%</span>
                    <span> · {t("projectDetail.progressLabel.lastActivity")} </span>
                    <span className="text-text-primary">{lastTs ? fmtAgo(lastTs) : t("goalDetail.hero.dash")}</span>
                  </div>
                  <div className="mt-2 h-1.5 w-full bg-surface-hover rounded-[4px] overflow-hidden">
                    <div className="h-full rounded-[4px]" style={{ width: `${progress.outcome}%`, background: color }} />
                  </div>
                </>
              )}
            </section>

            <section>
              <h2 className="text-[12px] font-medium uppercase tracking-[0.08em] text-text-secondary mb-2">
                {t("projectDetail.description.heading")}
              </h2>
              <RichTextEditor
                value={project.description ?? ""}
                onChange={(html) => void updateProjectMutation.mutateAsync({ id: project.id, partial: { description: html } })}
                placeholder={t("projectDetail.description.placeholder")}
              />
            </section>

            <ReferencesSection
              project={project}
              onAdd={(ref) =>
                void updateProjectMutation.mutateAsync({
                  id: project.id,
                  partial: { references: [...project.references, ref] },
                })
              }
              onRemove={(refId) =>
                void updateProjectMutation.mutateAsync({
                  id: project.id,
                  partial: { references: project.references.filter((r) => r.id !== refId) },
                })
              }
              onUpdate={(refId, partial) =>
                void updateProjectMutation.mutateAsync({
                  id: project.id,
                  partial: {
                    references: project.references.map((r) =>
                      r.id === refId ? { ...r, ...partial } : r,
                    ),
                  },
                })
              }
            />

            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-[12px] font-medium uppercase tracking-[0.08em] text-text-secondary">
                  {t("projectDetail.actions.title", { count: actions.length })}
                </h2>
                <div className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-tertiary">
                  {t("projectDetail.actions.meta", {
                    done: grouped.done.length,
                    backlog: grouped.backlog.length,
                    planned: grouped.planned.length,
                    delegated: grouped.delegated.length,
                  })}
                </div>
              </div>

              <div className="border-t border-border-subtle">
                {activeList.length === 0 ? (
                  <div className="py-3 font-mono text-[11px] text-text-tertiary px-3">
                    {t("projectDetail.actions.empty")}
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
                  placeholder={t("projectDetail.actions.placeholder")}
                  className="flex-1 bg-transparent outline-none text-[13px] text-text-primary placeholder:text-text-tertiary"
                />
                <span className="font-mono text-[11px] text-text-tertiary">↵</span>
              </div>

              {grouped.delegated.length > 0 && (
                <div className="mt-4">
                  <div className="flex items-center gap-2 h-7 px-3">
                    <span className="text-text-secondary text-[10px]">▾</span>
                    <span className="text-[12px] font-medium uppercase tracking-[0.08em] text-text-secondary">
                      {t("projectDetail.delegated.title", { count: grouped.delegated.length })}
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
                      {t("projectDetail.done.title", { count: grouped.done.length })}
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
        <aside className="w-full md:w-[320px] shrink-0 bg-surface-raised border-t md:border-t-0 md:border-l border-border-subtle">
          <div className="h-12 px-6 flex items-center justify-end gap-2 border-b border-border-subtle">
            {!isDraft && (
              <CardMenu
                ariaLabel={t("projectDetail.menu.aria")}
                items={[
                  ...(project.status === "active"
                    ? [
                        {
                          label: t("projectDetail.menu.markComplete"),
                          onSelect: () => handleStatusChange("completed"),
                        },
                        {
                          label: t("projectDetail.menu.drop"),
                          destructive: true,
                          onSelect: () => handleStatusChange("dropped"),
                        },
                      ]
                    : [
                        {
                          label: t("projectDetail.menu.reopen"),
                          onSelect: () => handleStatusChange("active"),
                        },
                      ]),
                  {
                    label: t("projectDetail.menu.delete"),
                    destructive: true,
                    onSelect: () => {
                      if (confirm(t("projectDetail.confirm.delete"))) {
                        void deleteProjectMutation.mutateAsync(project.id);
                        toast(t("projectDetail.toast.deleted"));
                        navigate("/projects");
                      }
                    },
                  },
                ]}
              />
            )}
          </div>
          <div className="p-6">
            {(() => {
              const dotColor =
                project.status === "completed"
                  ? "hsl(var(--status-done))"
                  : project.status === "dropped"
                  ? "hsl(var(--status-dropped))"
                  : stateInd === "active"
                  ? "hsl(var(--state-active))"
                  : "hsl(var(--state-stalled))";
              const fields: { label: string; value: React.ReactNode }[] = [
                {
                  label: t("projectDetail.sidebar.status"),
                  value: (
                    <span className="inline-flex items-center gap-2">
                      <Tooltip content={<StateDotTooltip state={stateInd} lastActivity={lastTs ? fmtAgo(lastTs) : t("goalDetail.hero.dash")} />}>
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ background: dotColor }}
                        />
                      </Tooltip>
                      {projStatusDisplay}
                    </span>
                  ),
                },
                {
                  label: t("projectDetail.sidebar.parentGoal"),
                  value: (
                    <Link
                      to={`/goals/${goal.id}`}
                      className="flex items-start gap-2 hover:text-accent hover:underline transition-colors min-w-0"
                    >
                      <span className="w-2 h-2 rounded-full shrink-0 mt-[6px]" style={{ background: color }} />
                      <span className="break-words min-w-0">{goal.title}</span>
                    </Link>
                  ),
                },
                {
                  label: t("projectDetail.sidebar.created"),
                  value: fmtLongDate(project.createdAt),
                },
                {
                  label: t("projectDetail.sidebar.age"),
                  value: t("projectDetail.age", { count: ageDays }),
                },
                {
                  label: t("projectDetail.sidebar.timeInvested"),
                  value: doneMinutes > 0 ? fmtHM(doneMinutes) : "—",
                },
                {
                  label: t("projectDetail.sidebar.lastActivity"),
                  value: lastActivityLabel,
                },
              ];
              return fields.map((f, i) => (
                <div
                  key={f.label}
                  className={`py-3 ${i < fields.length - 1 ? "border-b border-border-subtle" : ""}`}
                >
                  <div className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-tertiary mb-2 break-words whitespace-normal">
                    {f.label}
                  </div>
                  <div className="text-[14px] leading-[1.4] text-text-primary break-words min-w-0">
                    {f.value}
                  </div>
                </div>
              ));
            })()}
          </div>
        </aside>
      </div>
    </div>
  );
};

export default ProjectDetail;
