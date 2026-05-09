// Unified action row used everywhere actions are listed.
//
// Two-line layout, 56px min-height, goal stripe at left.
// Top line: checkbox + title + optional right pill (date / DONE / etc.).
// Bottom line: " · "-joined metadata, mono 12px text-secondary.
//
// The component accepts a raw `Action` from the store. Pages that have their
// own enriched view-models (e.g. AllActions / AllDelegated) construct an
// equivalent display by passing pre-built bottom segments via `bottomSegments`.

import React from "react";
import { Star } from "lucide-react";
import { useStore } from "@/store/useStore";
import type { Action } from "@/types";
import { formatTime } from "@/lib/format";
import { ImpactPill, TimePill } from "@/components/MetaPills";

type RightPill =
  | { kind: "date"; label: string } // "TODAY", "MAY 12"
  | { kind: "done" } // ✓
  | { kind: "delegate"; name: string } // → MARIA
  | { kind: "custom"; node: React.ReactNode }
  | null;

export interface ActionRowProps {
  action: Action;
  selected?: boolean;
  borderBottom?: boolean;
  /** Override the goal color (otherwise derived from store). */
  goalColor?: string;
  /** Override the bottom-line segments. Default: Goal · Project · Iα · Time · → Delegate */
  bottomSegments?: React.ReactNode[];
  /** Override the right pill on the top line. Default: derived from status. */
  rightPill?: RightPill;
  /** Hide the leading checkbox entirely. */
  hideCheckbox?: boolean;
  /** Force the title to render as terminal (line-through, dim). */
  terminal?: boolean;
  /** Show inline Star marker before title (Main Task indicator). */
  isMainTask?: boolean;
  onClick?: () => void;
  onToggleDone?: () => void;
}

export const ActionRow: React.FC<ActionRowProps> = ({
  action,
  selected = false,
  borderBottom = true,
  goalColor,
  bottomSegments,
  rightPill,
  hideCheckbox = false,
  terminal,
  isMainTask = false,
  onClick,
  onToggleDone,
}) => {
  const goals = useStore((s) => s.goals);
  const projects = useStore((s) => s.projects);

  const goal = goals.find((g) => g.id === action.goalId);
  const project = action.projectId
    ? projects.find((p) => p.id === action.projectId)
    : undefined;
  const color = goalColor ?? (goal ? `hsl(var(--${goal.color}))` : "hsl(var(--text-tertiary))");

  const isTerminal =
    terminal ??
    (action.status === "done" ||
      action.status === "dropped" ||
      action.status === "cancelled");
  const isDone = action.status === "done";

  // Derive default right pill from status when not overridden.
  let pill: RightPill = rightPill ?? null;
  if (rightPill === undefined) {
    if (action.status === "planned" && action.scheduledDate) {
      pill = { kind: "date", label: formatScheduledLabel(action.scheduledDate) };
    } else if (action.status === "delegated" && action.delegateName) {
      pill = { kind: "delegate", name: action.delegateName };
    } else if (isDone) {
      pill = { kind: "done" };
    }
  }

  // Default bottom segments. Time and Impact moved to right-side pill cluster
  // — only Goal · Project · → Delegate live in the meta line.
  const segs: React.ReactNode[] =
    bottomSegments ??
    (() => {
      const out: React.ReactNode[] = [];
      if (goal) out.push(<span key="g">{goal.title}</span>);
      if (project) out.push(<span key="p">{project.title}</span>);
      if (action.status === "delegated" && action.delegateName)
        out.push(<span key="d">→ {action.delegateName}</span>);
      return out;
    })();

  const stripeWidth = selected ? 2 : 3;
  const stripeBg = selected ? "hsl(var(--accent))" : color;

  return (
    <div
      onClick={onClick}
      className={`relative flex items-stretch transition-colors ${
        onClick ? "cursor-pointer" : ""
      } ${selected ? "bg-surface-elevated" : "hover:bg-surface-hover"} ${
        borderBottom ? "border-b border-border-subtle" : ""
      }`}
      style={{ minHeight: 56 }}
    >
      <span
        className="absolute left-0 top-0 bottom-0"
        style={{ background: stripeBg, width: stripeWidth }}
      />
      <div
        className="flex flex-col gap-1 py-3 pr-4 w-full min-w-0"
        style={{ paddingLeft: 16 + stripeWidth }}
      >
        {/* Top line */}
        <div className="flex items-center justify-between gap-3 min-w-0">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {!hideCheckbox && (() => {
              const disabled =
                action.status === "delegated" ||
                action.status === "dropped" ||
                action.status === "cancelled";
              return (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (disabled) return;
                    onToggleDone?.();
                  }}
                  disabled={disabled}
                  title={disabled ? "Re-open this action via the editor" : undefined}
                  aria-label={isDone ? "Re-open" : "Mark done"}
                  className="inline-flex items-center justify-center rounded-[2px] border shrink-0"
                  style={{
                    width: 16,
                    height: 16,
                    background: isDone ? color : "transparent",
                    borderColor: isDone ? color : "hsl(var(--text-tertiary))",
                    color: "hsl(var(--surface-base))",
                    fontSize: 11,
                    lineHeight: 1,
                    opacity: disabled ? 0.4 : 1,
                    cursor: disabled ? "not-allowed" : "pointer",
                  }}
                >
                  {isDone ? "✓" : ""}
                </button>
              );
            })()}
            {isMainTask && (
              <Star
                size={12}
                className="shrink-0"
                style={{ color: "hsl(var(--accent))", fill: "hsl(var(--accent))" }}
              />
            )}
            <span
              className={`text-[15px] font-medium truncate ${
                isTerminal ? "text-text-secondary line-through" : "text-text-primary"
              }`}
            >
              {action.title}
            </span>
          </div>
          <div className="shrink-0">{renderPill(pill)}</div>
        </div>
        {/* Bottom line */}
        {segs.length > 0 && (
          <div
            className={`flex items-center font-mono text-[12px] tabular-nums truncate ${
              isTerminal ? "text-text-tertiary" : "text-text-secondary"
            }`}
          >
            <span
              className="inline-block w-1.5 h-1.5 rounded-full mr-1.5 shrink-0"
              style={{ background: color }}
            />
            <span className="truncate">
              {segs.map((b, i) => (
                <React.Fragment key={i}>
                  {i > 0 && <span className="mx-1.5 text-text-tertiary">·</span>}
                  {b}
                </React.Fragment>
              ))}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

function renderPill(pill: RightPill): React.ReactNode {
  if (!pill) return null;
  if (pill.kind === "custom") return pill.node;
  if (pill.kind === "done")
    return (
      <span
        className="font-mono"
        style={{ color: "hsl(var(--state-active))", fontSize: 12 }}
      >
        ✓
      </span>
    );
  if (pill.kind === "delegate")
    return (
      <span
        className="font-mono uppercase tracking-[0.06em] text-text-secondary"
        style={{ fontSize: 11 }}
      >
        → {pill.name}
      </span>
    );
  // date
  return (
    <span
      className="font-mono uppercase tracking-[0.06em] text-text-secondary bg-surface-hover"
      style={{ fontSize: 11, padding: "2px 8px", borderRadius: 2 }}
    >
      {pill.label}
    </span>
  );
}

function formatScheduledLabel(iso: string): string {
  const today = new Date().toISOString().slice(0, 10);
  if (iso === today) return "TODAY";
  const t = new Date(today + "T00:00:00");
  const tomorrow = new Date(t.getTime() + 86400000).toISOString().slice(0, 10);
  if (iso === tomorrow) return "TOMORROW";
  const d = new Date(iso + "T00:00:00");
  return d
    .toLocaleDateString("en-US", { month: "short", day: "numeric" })
    .toUpperCase();
}
