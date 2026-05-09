import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Tooltip, StateDotTooltip } from "@/components/Tooltip";
import { CardMenu } from "@/components/CardMenu";
import { ConfirmModal } from "@/components/ConfirmModal";
import { useStore, selectors } from "@/store/useStore";
import { MetricInfoPopover } from "@/components/MetricInfoPopover";
import { formatTime } from "@/lib/format";
import { timeInvestedMinutes } from "@/lib/timeStats";

/* ===== MeasureBar (matches Index/Goals variant) ===== */
const MeasureBar: React.FC<{
  label: string;
  percentage: number;
  color: string;
  opacity?: number;
}> = ({ label, percentage, color, opacity = 1 }) => (
  <div
    className="grid w-full min-w-0 items-center gap-2"
    style={{ gridTemplateColumns: "56px minmax(0, 1fr) 36px" }}
  >
    <div className="w-[56px] shrink-0 whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.06em] text-text-tertiary leading-none">
      {label}
    </div>
    <div className="min-w-0 h-[7px] w-full overflow-hidden rounded-[2px] bg-surface-hover">
      <div
        className="block h-full rounded-[2px]"
        style={{ width: `${Math.max(0, Math.min(100, percentage))}%`, background: color, opacity }}
      />
    </div>
    <div className="w-[36px] shrink-0 whitespace-nowrap text-right font-mono text-[11px] tabular-nums text-text-primary leading-none">
      {percentage}%
    </div>
  </div>
);

function fmtAgo(iso?: string): { label: string; days: number } {
  if (!iso) return { label: "—", days: 999 };
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days <= 0) return { label: "today", days: 0 };
  if (days === 1) return { label: "1d ago", days: 1 };
  if (days < 30) return { label: `${days}d ago`, days };
  const d = new Date(iso);
  return { label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }), days };
}

function fmtShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function daysBetween(aIso: string, bIso?: string): number {
  const b = bIso ? new Date(bIso).getTime() : Date.now();
  return Math.max(1, Math.floor((b - new Date(aIso).getTime()) / 86400000));
}

export type ProjectCardProps = {
  projectId: string;
  goalLabel: string;
  goalColor: string; // css color, e.g. hsl(var(--goal-1))
};

export const ProjectCard: React.FC<ProjectCardProps> = ({ projectId, goalLabel, goalColor }) => {
  const project = useStore((s) => s.projects.find((p) => p.id === projectId));
  const allActions = useStore((s) => s.actions);
  const actions = useMemo(
    () => allActions.filter((a) => a.projectId === projectId),
    [allActions, projectId],
  );
  // Time tracking is always on; layer references kept for transitional safety.

  const markProjectComplete = useStore((s) => s.markProjectComplete);
  const dropProject = useStore((s) => s.dropProject);
  const deleteProject = useStore((s) => s.deleteProject);
  const [confirmDrop, setConfirmDrop] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const progressOutcome = useStore((s) => selectors.projectProgress(s, projectId).outcome);
  const progressEffort = useStore((s) => selectors.projectProgress(s, projectId).effort);
  const progress = { outcome: progressOutcome, effort: progressEffort };
  const stateDot = useStore((s) => selectors.stateIndicator(s, "project", projectId));

  const meta = useMemo(() => {
    const liveActs = actions.filter((a) => a.status !== "dropped" && a.status !== "cancelled");
    const done = liveActs.filter((a) => a.status === "done").length;
    const delegated = liveActs.filter((a) => a.status === "delegated").length;
    const planned = liveActs.filter((a) => a.status === "planned").length;
    const backlog = liveActs.filter((a) => a.status === "backlog").length;

    const lastIso = actions
      .map((a) => a.completedAt ?? a.delegatedAt ?? a.updatedAt ?? a.createdAt)
      .filter(Boolean)
      .sort()
      .at(-1);
    const ago = fmtAgo(lastIso ?? undefined);

    // Time investment: full time for Done + 20% of time for Delegated.
    const investedMin = liveActs.reduce((sum, a) => sum + timeInvestedMinutes(a), 0);
    const remainingMin = liveActs
      .filter((a) => a.status === "planned" || a.status === "backlog")
      .reduce((sum, a) => sum + (a.timeEstimateMinutes ?? 0), 0);
    const hasTimeData = investedMin > 0 || remainingMin > 0;

    return {
      done,
      delegated,
      planned,
      backlog,
      lastLabel: ago.label,
      investedMin,
      remainingMin,
      hasTimeData,
    };
  }, [actions]);

  if (!project) return null;

  const isClosed = project.status === "completed" || project.status === "dropped";
  const closedAtIso = project.completedAt ?? project.droppedAt;
  const ageDays = daysBetween(project.createdAt, isClosed ? closedAtIso : undefined);

  const actionParts: React.ReactNode[] = [];
  const pushPart = (n: number, label: string) => {
    if (n <= 0) return;
    if (actionParts.length > 0) {
      actionParts.push(
        <span key={`sep-${label}`} className="text-text-tertiary"> · </span>,
      );
    }
    actionParts.push(
      <React.Fragment key={label}>
        <span className="text-text-primary tabular-nums">{n}</span>
        <span className="text-text-secondary"> {label}</span>
      </React.Fragment>,
    );
  };
  pushPart(meta.done, "done");
  pushPart(meta.planned, "planned");
  pushPart(meta.delegated, "delegated");
  pushPart(meta.backlog, "backlog");
  if (actionParts.length === 0) {
    actionParts.push(
      <span key="empty" className="text-text-tertiary">—</span>,
    );
  }

  const showTimeRow = meta.hasTimeData;

  return (
    <>
      <Link to={`/projects/${projectId}`} className="block text-left w-full">
        <div className="group relative min-h-[280px] px-5 py-4 flex flex-col rounded-[6px] bg-surface-raised border border-border-subtle hover:bg-surface-hover hover:border-accent cursor-pointer transition-colors duration-100 overflow-hidden">
          {/* Goal color stripe */}
          <span
            className="absolute left-0 top-0 bottom-0 w-[3px]"
            style={{ background: goalColor }}
          />

          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: goalColor }} />
              <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-text-tertiary truncate">
                {goalLabel}
              </span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Tooltip content={<StateDotTooltip state={stateDot} lastActivity={meta.lastLabel} stalledFor={meta.lastLabel} />}>
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ background: stateDot === "active" ? "hsl(var(--state-active))" : "hsl(var(--state-stalled))" }}
                />
              </Tooltip>
              <CardMenu
                ariaLabel="Project menu"
                items={[
                  { label: "Mark complete", onSelect: () => { markProjectComplete(projectId); toast("Project completed"); } },
                  { label: "Drop", destructive: true, onSelect: () => setConfirmDrop(true) },
                  { label: "Delete", destructive: true, onSelect: () => setConfirmDelete(true) },
                ]}
              />
            </div>
          </div>

          {/* Title */}
          <div
            className="mt-2 text-[16px] font-medium text-text-primary leading-[1.3] overflow-hidden"
            style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}
          >
            {project.title || "Untitled"}
          </div>

          {/* Measure bars */}
          <div className="mt-4 flex flex-col gap-2 min-w-0">
            <MeasureBar label="VALUE" percentage={progress.outcome} color={goalColor} />
            <div className="flex items-center gap-2">
              <div className="flex-1 min-w-0">
                <MeasureBar label="EFFORT" percentage={progress.effort} color={goalColor} opacity={0.6} />
              </div>
              <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                <MetricInfoPopover variant="valueEffort" ariaLabel="What do Value and Effort mean?" />
              </div>
            </div>
          </div>

          {/* Stat rows */}
          <div className="mt-4 flex flex-col gap-1.5 text-[12px]">
            <div className="flex items-center justify-between gap-3 min-h-[22px]">
              <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-text-tertiary">ACTIONS</span>
              <span className="font-mono text-[11px] text-right truncate">{actionParts}</span>
            </div>

            {showTimeRow && (
              <div className="flex items-center justify-between gap-3 min-h-[22px]">
                <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-text-tertiary">TIME</span>
                <span className="font-mono text-[11px] text-right tabular-nums truncate">
                  <span className="text-text-primary">{formatTime(meta.investedMin)}</span>
                  <span className="text-text-secondary"> invested</span>
                  <span className="text-text-tertiary"> · </span>
                  <span className="text-text-primary">{formatTime(meta.remainingMin)}</span>
                  <span className="text-text-secondary"> estimated remaining</span>
                </span>
              </div>
            )}

            <div className="flex items-center justify-between gap-3 min-h-[22px]">
              <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-text-tertiary">STARTED</span>
              <span className="font-mono text-[11px] text-right truncate">
                <span className="text-text-primary">{fmtShortDate(project.createdAt)}</span>
                <span className="text-text-tertiary"> · </span>
                <span className="text-text-secondary">
                  {isClosed ? `closed in ${ageDays} days` : `${ageDays} days active`}
                </span>
              </span>
            </div>
          </div>

          {/* Spacer pushes footer to bottom */}
          <div className="flex-1" />

          {/* Divider */}
          <div className="my-3 h-px bg-border-subtle" />

          {/* Footer */}
          <div className="text-[12px]">
            <span className="text-text-tertiary">Last activity: </span>
            <span className="text-text-secondary">{meta.lastLabel}</span>
          </div>
        </div>
      </Link>
      <ConfirmModal
        open={confirmDrop}
        title="Drop this project?"
        body="Open actions in this project will be dropped. You can re-open it later."
        confirmLabel="Drop project"
        destructive
        onCancel={() => setConfirmDrop(false)}
        onConfirm={() => { dropProject(projectId); toast("Project dropped"); setConfirmDrop(false); }}
      />
      <ConfirmModal
        open={confirmDelete}
        title="Delete this project?"
        body="This permanently removes the project and all its actions. This cannot be undone."
        confirmLabel="Delete"
        destructive
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => { deleteProject(projectId); toast("Project deleted"); setConfirmDelete(false); }}
      />
    </>
  );
};

export default ProjectCard;
