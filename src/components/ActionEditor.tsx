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
import { ChevronDown, Check, Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n";
import { useStore } from "@/store/useStore";
import { useProjectsQuery } from "@/lib/queries/useProjects";
import { useGoalsQuery } from "@/lib/queries/useGoals";
import {
  useActionsQuery,
  useChangeActionStatusMutation,
  useCreateActionMutation,
  useDeleteActionMutation,
  useUpdateActionMutation,
} from "@/lib/queries/useActions";
import type { Action, ActionStatus, ID } from "@/types";
import { ConfirmModal } from "./ConfirmModal";
import { ClampedNumberInput } from "./ClampedNumberInput";
import {
  DeleteTypeConfirm,
  EditorOverflowMenu,
  MarkDoneButton,
  SaveIndicator,
  overflowDelete,
  overflowDrop,
  overflowDuplicate,
  useSaveIndicator,
} from "./EditorFooterControls";
import { EditorShell, EditorCloseX, EditorCancelButton } from "./EditorShell";
import { MetricInfoPopover } from "./MetricInfoPopover";
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
  if (iso === today) return i18n.t("actionEditor.relDays.today");
  if (iso === addDaysISO(today, 1)) return i18n.t("actionEditor.relDays.tomorrow");
  if (iso === addDaysISO(today, -1)) return i18n.t("actionEditor.relDays.yesterday");
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString(i18n.language || "en", { month: "short", day: "numeric" });
}
function fmtRelFromNow(isoTime: string): string {
  const dDate = isoTime.slice(0, 10);
  const today = TODAY_ISO();
  const days = Math.round(
    (new Date(today + "T00:00:00").getTime() -
      new Date(dDate + "T00:00:00").getTime()) /
      86400000,
  );
  if (days <= 0) return i18n.t("actionEditor.relFromNow.today");
  if (days === 1) return i18n.t("actionEditor.relFromNow.yesterday");
  if (days < 30) return i18n.t("actionEditor.relFromNow.daysAgo", { count: days });
  return new Date(dDate + "T00:00:00").toLocaleDateString(i18n.language || "en", {
    month: "short",
    day: "numeric",
  });
}

export function ActionEditor() {
  const panel = useStore((s) => s.ui.activePanel);
  const closePanel = useStore((s) => s.closePanel);

  const open = panel?.kind === "action";

  if (!open || panel?.kind !== "action") return null;

  return (
    <ActionEditorPanel
      key={(panel.mode === "edit" ? panel.id : "new") ?? "new"}
      mode={panel.mode}
      actionId={panel.id}
      prefill={panel.prefill}
      onClose={closePanel}
    />
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
  const { t } = useTranslation();
  const allActions = useActionsQuery().data ?? [];
  const action = actionId ? allActions.find((a) => a.id === actionId) : undefined;
  const projects = useProjectsQuery().data ?? [];
  const goals = useGoalsQuery().data ?? [];
  const layers = useStore((s) => s.settings.layers);

  const updateActionMutation = useUpdateActionMutation();
  const createActionMutation = useCreateActionMutation();
  const changeActionStatusMutation = useChangeActionStatusMutation();
  const deleteActionMutation = useDeleteActionMutation();

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
  const bodyRef = useRef<HTMLDivElement>(null);

  // Auto-save indicator (edit mode only). Listens to input/change events on
  // the body container — every keystroke marks "Saving"; after 500ms idle
  // the indicator settles to "Saved" with a brief accent flash.
  const { state: saveState, markEditing } = useSaveIndicator();
  useEffect(() => {
    if (mode !== "edit") return;
    const el = bodyRef.current;
    if (!el) return;
    const handler = () => markEditing();
    el.addEventListener("input", handler);
    el.addEventListener("change", handler);
    return () => {
      el.removeEventListener("input", handler);
      el.removeEventListener("change", handler);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  useEffect(() => {
    titleRef.current?.focus();
    if (mode === "new") titleRef.current?.select();
  }, [mode]);

  const persistField = <K extends keyof Action>(field: K, value: Action[K]) => {
    if (mode !== "edit" || !actionId) return;
    updateActionMutation.mutate({
      id: actionId,
      partial: { [field]: value } as Partial<Action>,
    });
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
  // Time is required in edit mode (existing behavior). In the create modal,
  // Time is optional — keep the field but don't block submission.
  const requireTime = mode === "edit";

  const missingForCreate = useMemo(() => {
    const missing: string[] = [];
    if (!title.trim()) missing.push(t("actionEditor.field.required.title"));
    if (!goalId) missing.push(t("actionEditor.field.required.goal"));
    if (!(impactNum > 0)) missing.push(t("actionEditor.field.required.impact"));
    if (requireTime && !(timeNum > 0)) missing.push(t("actionEditor.field.required.time"));
    if (newStatus === "delegated" && !delegateName.trim()) missing.push(t("actionEditor.field.required.delegateName"));
    return missing;
  }, [title, goalId, impactNum, requireTime, timeNum, newStatus, delegateName, t]);

  const canCreate = missingForCreate.length === 0;
  const createTooltip =
    missingForCreate.length === 0
      ? ""
      : t("actionEditor.create.tooltip", { fields: missingForCreate.join(t("actionEditor.create.fieldsJoin")) });

  // Create-modal local UI state.
  const [notesExpanded, setNotesExpanded] = useState<boolean>(!!seed.notes);
  const [goalError, setGoalError] = useState<string | null>(null);
  const [goalPopoverOpen, setGoalPopoverOpen] = useState(false);
  const [projectPopoverOpen, setProjectPopoverOpen] = useState(false);
  const goalPillRef = useRef<HTMLButtonElement>(null);

  // Existing-action migration warning: action exists with no impact value.
  const hasMigrationWarning =
    mode === "edit" && !!action && (action.impact === undefined || action.impact === null || action.impact <= 0);

  // ─── Status transitions (edit mode) ───
  // Note: "planned" is never passed here from the dropdown (it's not an
  // option). Planned transitions are handled by handleScheduledDateChange.
  const handleStatusChange = (next: ActionStatus) => {
    if (isGoalLevel && next !== "backlog") {
      toast.error(t("actionEditor.toast.needAssignProjectPlan"));
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
        setImpactError(t("actionEditor.error.impactDone"));
        toast.error(t("actionEditor.toast.needImpact"));
        return;
      }
      if (requireTime && !(timeNum > 0)) {
        setTimeError(t("actionEditor.error.timeDone"));
        toast.error(t("actionEditor.toast.needTime"));
        return;
      }
    }
    if (next === "delegated") {
      if (!delegateName.trim()) {
        setDelegateError(t("actionEditor.error.delegateName"));
        // Switch UI into delegated state so the field appears
        void changeActionStatusMutation.mutateAsync({
          id: actionId,
          newStatus: "delegated",
          statusPayload: { delegateName: "" },
        });
        toast.error(t("actionEditor.toast.needDelegateName"));
        return;
      }
      void changeActionStatusMutation.mutateAsync({
        id: actionId,
        newStatus: "delegated",
        statusPayload: {
          delegateName: delegateName || "",
          delegateNote: delegateNote || undefined,
          expectedReturnDate: expectedReturn || undefined,
        },
      });
      toast(delegateName ? t("actionEditor.toast.delegatedTo", { name: delegateName }) : t("actionEditor.toast.delegated"));
      return;
    }
    if (next === "dropped" || next === "cancelled") {
      setConfirmDrop(next);
      return;
    }
    setImpactError(null);
    setTimeError(null);
    void changeActionStatusMutation.mutateAsync({ id: actionId, newStatus: next });
    if (next === "done") toast(t("actionEditor.toast.markedDone"));
    if (next === "backlog") toast(t("actionEditor.toast.reopened"));
  };

  const confirmDropAction = () => {
    if (!actionId || !confirmDrop) return;
    void changeActionStatusMutation.mutateAsync({ id: actionId, newStatus: confirmDrop });
    toast(confirmDrop === "dropped" ? t("actionEditor.toast.dropped") : t("actionEditor.toast.cancelled"));
    setConfirmDrop(null);
  };

  // Setting a scheduled date auto-derives status to "Planned".
  // Clearing it returns to "Backlog". plannedAt history is preserved by
  // the store transition logic.
  // Past dates trigger a confirmation modal — "planned in the past" is
  // semantically wrong, so we offer to mark the action Done on that date.
  const handleScheduledDateChange = (iso: string) => {
    if (isGoalLevel && iso) {
      toast.error(t("actionEditor.toast.needAssignProjectSchedule"));
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
      void changeActionStatusMutation.mutateAsync({
        id: actionId,
        newStatus: "planned",
        statusPayload: { scheduledDate: iso },
      });
      toast(t("actionEditor.toast.scheduled"));
    } else {
      void changeActionStatusMutation.mutateAsync({ id: actionId, newStatus: "backlog" });
      persistField("scheduledDate", undefined);
      toast(t("actionEditor.toast.movedToBacklog"));
    }
  };

  const confirmMarkDoneOnPast = () => {
    const iso = confirmPastDate;
    if (!iso) return;
    const shortLabel = new Date(iso + "T00:00:00").toLocaleDateString(i18n.language || "en", {
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
      toast(t("actionEditor.toast.markedDoneOn", { date: shortLabel }));
      return;
    }
    if (!actionId) {
      setConfirmPastDate(null);
      return;
    }
    void changeActionStatusMutation.mutateAsync({ id: actionId, newStatus: "done" });
    // Override timestamps: completedAt = picked date, scheduledDate kept
    // as historical record, plannedAt cleared (never genuinely planned).
    updateActionMutation.mutate({
      id: actionId,
      partial: {
        completedAt,
        scheduledDate: iso,
        plannedAt: undefined,
      },
    });
    setConfirmPastDate(null);
    toast(t("actionEditor.toast.markedDoneOn", { date: shortLabel }));
  };

  const handleSaveNew = () => {
    if (!canCreate) {
      // Set inline errors for missing fields and focus the first one.
      let firstFocus: "title" | "impact" | "goal" | null = null;
      if (!title.trim()) firstFocus = firstFocus ?? "title";
      if (!(impactNum > 0)) {
        setImpactError(t("actionEditor.error.impactRequired"));
        firstFocus = firstFocus ?? "impact";
      }
      if (!goalId) {
        setGoalError(t("actionEditor.error.goalRequired"));
        firstFocus = firstFocus ?? "goal";
      }
      if (firstFocus === "title") titleRef.current?.focus();
      else if (firstFocus === "impact") {
        const el = document.querySelector<HTMLInputElement>('input[aria-label="Impact"]');
        el?.focus();
      }
      else if (firstFocus === "goal") {
        goalPillRef.current?.focus();
        setGoalPopoverOpen(true);
      }
      return;
    }
    void createActionMutation.mutateAsync({
      title: title.trim(),
      projectId,
      goalId,
      scheduledDate: scheduledDate || undefined,
      notes: notes || undefined,
      impact: impactNum,
      timeEstimateMinutes: timeMin === "" ? undefined : Number(timeMin),
      delegateName: delegateName || undefined,
      delegateNote: delegateNote || undefined,
      expectedReturnDate: expectedReturn || undefined,
      status: prefill?.status ?? newStatus,
      completedAt: prefill?.completedAt,
      delegatedAt: prefill?.delegatedAt,
      droppedAt: prefill?.droppedAt,
      cancelledAt: prefill?.cancelledAt,
    });
    toast(t("actionEditor.toast.created", { title: title.trim() }));
    onClose();
  };

  const handleDuplicate = () => {
    if (!action) return;
    void createActionMutation
      .mutateAsync({
        title: t("actionEditor.copyOf", { title: action.title }),
        projectId: action.projectId,
        goalId: action.goalId,
        notes: action.notes,
        impact: action.impact,
        timeEstimateMinutes: action.timeEstimateMinutes,
        status: "backlog",
      })
      .then(({ id: newId }) => {
        toast(t("actionEditor.toast.duplicated"));
        useStore.getState().openPanel({ kind: "action", mode: "edit", id: newId });
      })
      .catch((err) =>
        toast.error(
          "Couldn't duplicate action: " +
            (err instanceof Error ? err.message : "unknown error"),
        ),
      );
  };

  const handleDelete = () => {
    if (!actionId) return;
    void deleteActionMutation.mutateAsync(actionId);
    toast(t("actionEditor.toast.deleted"));
    setConfirmDelete(false);
    onClose();
  };

  const dirty =
    mode === "new" &&
    (!!title.trim() ||
      !!notes.trim() ||
      impact !== "" ||
      timeMin !== "" ||
      !!scheduledDate ||
      !!delegateName.trim() ||
      !!delegateNote.trim());

  return (
    <EditorShell mode={mode} dirty={dirty} onClose={onClose}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle shrink-0">
        {mode === "new" ? (
          <div className="text-[18px] font-medium text-text-primary">{t("actionEditor.header.new")}</div>
        ) : (
          <div className="font-mono text-[11px] uppercase tracking-[0.08em] text-text-tertiary">
            {t("actionEditor.header.edit")}
          </div>
        )}
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
      <div ref={bodyRef} className="flex-1 overflow-y-auto px-6 py-5">
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
            {t("actionEditor.migrationWarning")}
          </div>
        )}
        {/* Title */}
        <div className="mb-6">
          <input
            ref={titleRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => persistField("title", title.trim())}
            onKeyDown={(e) => {
              if (mode === "new" && e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSaveNew();
              }
            }}
            placeholder={t("actionEditor.titlePlaceholder")}
            className="w-full bg-transparent outline-none text-[18px] font-medium text-text-primary placeholder:text-text-tertiary"
          />
        </div>

        {mode === "new" ? (
          <>
            {/* ESTIMATES */}
            <div className="mb-6">
              <SectionHeadRequired label={t("actionEditor.section.estimates")} required />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FieldRow label={t("actionEditor.field.impactRequired")} info={<MetricInfoPopover variant="impact" ariaLabel={t("actionEditor.field.metricImpactAria")} />}>
                  <ClampedNumberInput
                    value={impact}
                    min={1}
                    max={10}
                    step={1}
                    placeholder={t("actionEditor.field.impactPlaceholder")}
                    required
                    requiredMessage={t("actionEditor.error.impactRequired")}
                    ariaLabel="Impact"
                    onChange={(v) => {
                      setImpact(v);
                      if (v === "" || (typeof v === "number" && v > 0)) setImpactError(null);
                    }}
                    onCommit={() => {}}
                  />
                  {impactError && <InlineError text={impactError} />}
                </FieldRow>
                <FieldRow label={t("actionEditor.field.timeOptional")}>
                  <ClampedNumberInput
                    value={timeMin}
                    min={1}
                    max={600}
                    step={5}
                    placeholder={t("actionEditor.field.timePlaceholderOptional")}
                    ariaLabel="Time in minutes"
                    onChange={(v) => setTimeMin(v)}
                    onCommit={() => {}}
                  />
                </FieldRow>
              </div>
            </div>

            {/* PARENT — inline pill popovers */}
            <div className="mb-6">
              <SectionHeadRequired label={t("actionEditor.section.parent")} required />
              <div className="flex items-center gap-2 flex-wrap text-[13px]">
                <span className="text-text-tertiary">{t("actionEditor.field.goal")}</span>
                <Popover open={goalPopoverOpen} onOpenChange={setGoalPopoverOpen}>
                  <PopoverTrigger asChild>
                    <button
                      ref={goalPillRef}
                      type="button"
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] border text-[13px] text-text-primary hover:bg-surface-hover transition-colors max-w-[240px]"
                      style={{
                        background: "hsl(var(--surface-raised))",
                        borderColor: goalError
                          ? "hsl(var(--text-warning))"
                          : "hsl(var(--border-subtle))",
                      }}
                    >
                      <span className="truncate">
                        {goals.find((g) => g.id === goalId)?.title ?? t("actionEditor.field.pickGoal")}
                      </span>
                      <ChevronDown size={12} className="text-text-tertiary shrink-0" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    align="start"
                    className="z-[210] w-[260px] p-1 bg-surface-raised border border-border-default"
                  >
                    {goals
                      .filter((g) => g.status === "active")
                      .map((g) => (
                        <button
                          key={g.id}
                          type="button"
                          onClick={() => {
                            setGoalId(g.id);
                            setProjectId(null);
                            setGoalError(null);
                            setGoalPopoverOpen(false);
                          }}
                          className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-[13px] rounded-[3px] hover:bg-surface-hover ${
                            g.id === goalId ? "text-[hsl(var(--accent))]" : "text-text-primary"
                          }`}
                        >
                          <span className="truncate">{g.title}</span>
                          {g.id === goalId && (
                            <Check size={14} className="text-[hsl(var(--accent))]" />
                          )}
                        </button>
                      ))}
                  </PopoverContent>
                </Popover>

                <span className="text-text-tertiary">{t("actionEditor.field.parentDivider")}</span>
                <span className="text-text-tertiary">{t("actionEditor.field.project")}</span>
                <Popover open={projectPopoverOpen} onOpenChange={setProjectPopoverOpen}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] border border-border-subtle text-[13px] text-text-primary hover:bg-surface-hover transition-colors max-w-[240px]"
                      style={{ background: "hsl(var(--surface-raised))" }}
                    >
                      <span className="truncate">
                        {projectId
                          ? projects.find((p) => p.id === projectId)?.title ?? "—"
                          : t("actionEditor.field.goalLevelBacklog")}
                      </span>
                      <ChevronDown size={12} className="text-text-tertiary shrink-0" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    align="start"
                    className="z-[210] w-[260px] p-1 bg-surface-raised border border-border-default"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setProjectId(null);
                        setProjectPopoverOpen(false);
                      }}
                      className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-[13px] rounded-[3px] hover:bg-surface-hover ${
                        !projectId ? "text-[hsl(var(--accent))]" : "text-text-primary"
                      }`}
                    >
                      <span className="truncate">{t("actionEditor.field.goalLevelBacklog")}</span>
                      {!projectId && (
                        <Check size={14} className="text-[hsl(var(--accent))]" />
                      )}
                    </button>
                    {(projectsByGoal.find((g) => g.goal.id === goalId)?.projects ?? []).map(
                      (p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            setProjectId(p.id);
                            setProjectPopoverOpen(false);
                          }}
                          className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-[13px] rounded-[3px] hover:bg-surface-hover ${
                            p.id === projectId ? "text-[hsl(var(--accent))]" : "text-text-primary"
                          }`}
                        >
                          <span className="truncate">{p.title}</span>
                          {p.id === projectId && (
                            <Check size={14} className="text-[hsl(var(--accent))]" />
                          )}
                        </button>
                      ),
                    )}
                  </PopoverContent>
                </Popover>
              </div>
              {goalError && <InlineError text={goalError} />}
            </div>

            {/* DATE */}
            <div className="mb-6">
              <SectionHead>{t("actionEditor.section.date")}</SectionHead>
              <DateChipPicker
                value={scheduledDate}
                optional
                onChange={handleScheduledDateChange}
              />
            </div>

            {/* NOTES (collapsed by default) */}
            <div>
              {notesExpanded ? (
                <>
                  <SectionHead>{t("actionEditor.section.notes")}</SectionHead>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={t("actionEditor.field.notesPlaceholder")}
                    rows={4}
                    autoFocus
                    className="w-full bg-surface-raised border border-border-subtle rounded-[4px] px-2 py-1.5 text-[13px] text-text-primary placeholder:text-text-tertiary outline-none resize-y"
                  />
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setNotesExpanded(true)}
                  className="text-[13px] text-text-secondary hover:text-text-primary transition-colors"
                >
                  {t("actionEditor.field.addNotes")}
                </button>
              )}
            </div>
          </>
        ) : (
          <>
            {/* STATE */}
            <div className="mb-6">
              <SectionHead>{t("actionEditor.section.state")}</SectionHead>

              <StatusDropdown
                current={status}
                isGoalLevel={isGoalLevel}
                onPick={handleStatusChange}
              />

              {action && <TimestampLine action={action} onClose={onClose} />}

              {status !== "done" &&
                status !== "dropped" &&
                status !== "cancelled" &&
                status !== "delegated" && (
                  <div className="mt-3">
                    <div className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-tertiary mb-2">
                      {t("actionEditor.field.scheduledDate")}
                    </div>
                    <DateChipPicker
                      value={scheduledDate}
                      optional
                      onChange={handleScheduledDateChange}
                    />
                  </div>
                )}

              {status === "delegated" && (
                <div className="mt-2 p-3 rounded-[4px] bg-surface-raised border border-border-subtle space-y-3">
                  <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-text-tertiary">
                    {t("actionEditor.delegation.heading")}
                  </div>
                  <FieldRow label={t("actionEditor.delegation.name")}>
                    <input
                      value={delegateName}
                      onChange={(e) => {
                        setDelegateName(e.target.value);
                        if (e.target.value.trim()) setDelegateError(null);
                      }}
                      onBlur={() => persistField("delegateName", delegateName || undefined)}
                      placeholder={t("actionEditor.delegation.namePlaceholder")}
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
                      {t("actionEditor.delegation.expectedBack")}
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
                  <FieldRow label={t("actionEditor.delegation.note")}>
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
              <SectionHead>{t("actionEditor.section.parent")}</SectionHead>
              <div className="flex flex-col gap-2">
                <select
                  value={goalId}
                  onChange={(e) => {
                    setGoalId(e.target.value);
                    setProjectId(null);
                    persistField("goalId", e.target.value);
                    persistField("projectId", null);
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
                    persistField("projectId", v);
                  }}
                  className="bg-surface-raised border border-border-subtle rounded-[4px] px-2 py-1.5 text-[13px] text-text-primary outline-none"
                >
                  <option value="">{t("actionEditor.field.goalLevelOption")}</option>
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
              <SectionHead>{t("actionEditor.section.estimates")}</SectionHead>
              <div className="grid grid-cols-2 gap-3">
                <FieldRow label={t("actionEditor.field.impactRequiredEdit")}>
                  <ClampedNumberInput
                    value={impact}
                    min={1}
                    max={10}
                    step={1}
                    placeholder={t("actionEditor.field.impactPlaceholder")}
                    required
                    requiredMessage={t("actionEditor.error.impactRequired")}
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
                <FieldRow label={t("actionEditor.field.timeRequired")}>
                  <ClampedNumberInput
                    value={timeMin}
                    min={1}
                    max={600}
                    step={5}
                    placeholder={t("actionEditor.field.timePlaceholderExample")}
                    required
                    requiredMessage={t("actionEditor.error.timeRequired")}
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
              </div>
            </div>

            {/* NOTES */}
            <div>
              <SectionHead>{t("actionEditor.section.notes")}</SectionHead>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                onBlur={() => persistField("notes", notes || undefined)}
                placeholder={t("actionEditor.field.notesPlaceholder")}
                rows={4}
                className="w-full bg-surface-raised border border-border-subtle rounded-[4px] px-2 py-1.5 text-[13px] text-text-primary placeholder:text-text-tertiary outline-none resize-y"
              />
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div
        className="px-6 flex items-center justify-between shrink-0"
        style={{
          borderTop: "1px solid hsl(var(--border-subtle))",
          paddingTop: 16,
          paddingBottom: 16,
        }}
      >
        {mode === "new" ? (
          <>
            <EditorCancelButton />
            <button
              onClick={handleSaveNew}
              title={canCreate ? "" : createTooltip}
              className="text-[13px] font-medium px-3 py-1.5 rounded-[4px] transition-colors cursor-pointer"
              style={{
                background: canCreate ? "hsl(var(--accent))" : "hsl(var(--accent) / 0.4)",
                color: "hsl(var(--surface-base))",
              }}
            >
              {t("actionEditor.create.cta")}
            </button>
          </>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <EditorOverflowMenu
                items={[
                  overflowDuplicate(handleDuplicate),
                  overflowDrop(() => setConfirmDrop("dropped")),
                  overflowDelete(() => setConfirmDelete(true)),
                ]}
              />
              <SaveIndicator state={saveState} />
            </div>
            <div className="flex items-center gap-2">
              {(status === "backlog" || status === "planned") && !isGoalLevel && (
                <MarkDoneButton
                  onClick={() => handleStatusChange("done")}
                  disabled={!(impactNum > 0) || (requireTime && !(timeNum > 0))}
                  disabledTooltip={t("actionEditor.action.markDoneDisabledTooltip")}
                />
              )}
              {status === "delegated" && (
                <>
                  <button
                    onClick={() => handleStatusChange("backlog")}
                    className="text-[13px] px-3 py-1.5 rounded-[4px] border border-border-subtle text-text-secondary hover:text-text-primary"
                  >
                    {t("actionEditor.action.reopen")}
                  </button>
                  <MarkDoneButton
                    onClick={() => handleStatusChange("done")}
                    disabled={!(impactNum > 0) || (requireTime && !(timeNum > 0))}
                    disabledTooltip={t("actionEditor.action.markDoneDisabledTooltip")}
                  />
                </>
              )}
              {(status === "done" || status === "dropped" || status === "cancelled") && (
                <button
                  onClick={() => handleStatusChange("backlog")}
                  className="text-[13px] px-3 py-1.5 rounded-[4px] border border-border-subtle text-text-secondary hover:text-text-primary"
                >
                  {t("actionEditor.action.reopen")}
                </button>
              )}
            </div>
          </>
        )}
      </div>

      <DeleteTypeConfirm
        open={confirmDelete}
        title={t("confirm.delete.action.heading")}
        body={t("confirm.delete.action.body")}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
      />
      <ConfirmModal
        open={confirmDrop !== null}
        title={confirmDrop === "dropped" ? t("confirm.drop.action.heading") : t("actionEditor.confirm.cancel.heading")}
        body={
          confirmDrop === "dropped"
            ? t("confirm.drop.action.body")
            : t("actionEditor.confirm.cancel.body")
        }
        confirmLabel={confirmDrop === "dropped" ? t("confirm.drop.action.cta") : t("actionEditor.confirm.cancel.cta")}
        destructive
        onCancel={() => setConfirmDrop(null)}
        onConfirm={confirmDropAction}
      />
      <PastDateConfirmModal
        iso={confirmPastDate}
        onCancel={() => setConfirmPastDate(null)}
        onConfirm={confirmMarkDoneOnPast}
      />
    </EditorShell>
  );
}

function PastDateConfirmModal({
  iso,
  onCancel,
  onConfirm,
}: {
  iso: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const { t } = useTranslation();
  if (!iso) return null;
  const d = new Date(iso + "T00:00:00");
  const fullLabel = d.toLocaleDateString(i18n.language || "en", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const shortLabel = d.toLocaleDateString(i18n.language || "en", { month: "short", day: "numeric" });
  return (
    <ConfirmModal
      open={true}
      title={t("actionEditor.confirm.pastDate.heading")}
      body={
        <>
          {t("actionEditor.confirm.pastDate.bodyLine1Pre")}<strong>{fullLabel}</strong>{t("actionEditor.confirm.pastDate.bodyLine1Post", { rel: relDays(iso) })}
          <div className="mt-2">
            {t("actionEditor.confirm.pastDate.bodyLine2")}
          </div>
        </>
      }
      confirmLabel={t("actionEditor.confirm.pastDate.cta", { date: shortLabel })}
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
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

function SectionHeadRequired({ label, required }: { label: string; required?: boolean }) {
  return (
    <div className="mb-3 flex items-baseline gap-1.5">
      <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-tertiary">
        {label}
      </span>
      {required && (
        <span
          className="text-[12px]"
          style={{ color: "hsl(var(--text-tertiary))", fontFamily: "Inter, sans-serif" }}
        >
          *
        </span>
      )}
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

function FieldRow({ label, info, children }: { label: React.ReactNode; info?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1">
        <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-text-tertiary">
          {label}
        </div>
        {info}
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
  if (days === 0) return i18n.t("actionEditor.relDays.today");
  if (days === 1) return i18n.t("actionEditor.relDays.tomorrow");
  if (days === -1) return i18n.t("actionEditor.relDays.yesterday");
  if (days > 0) return i18n.t("actionEditor.relDays.inDays", { count: days });
  return i18n.t("actionEditor.relDays.daysAgo", { count: Math.abs(days) });
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
  const { t } = useTranslation();
  const [showCalendar, setShowCalendar] = useState(false);
  const today = TODAY_ISO();
  const tomorrow = addDaysISO(today, 1);
  const isToday = value === today;
  const isTomorrow = value === tomorrow;
  const isCustom = !!value && !isToday && !isTomorrow;

  // Summary view when a custom date is set
  if (isCustom && !showCalendar) {
    const d = new Date(value + "T00:00:00");
    const label = d.toLocaleDateString(i18n.language || "en", { month: "short", day: "numeric" });
    return (
      <div className="flex items-center gap-2">
        <span className="text-[13px] text-text-primary">{label}</span>
        <span className="text-[13px] text-text-secondary">({relDays(value)})</span>
        <button
          type="button"
          onClick={() => setShowCalendar(true)}
          className="ml-2 text-[13px] text-text-secondary hover:text-text-primary transition-colors"
        >
          {t("actionEditor.dateChip.change")}
        </button>
        {optional && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="text-[13px] text-text-secondary hover:text-text-primary transition-colors"
          >
            {t("actionEditor.dateChip.clear")}
          </button>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2 flex-wrap">
        <DateChip
          label={t("actionEditor.dateChip.today")}
          selected={isToday}
          onClick={() => {
            onChange(today);
            setShowCalendar(false);
          }}
        />
        <DateChip
          label={t("actionEditor.dateChip.tomorrow")}
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
          {t("actionEditor.dateChip.pickAnother")}
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
            {t("actionEditor.dateChip.clear")}
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
  const { t } = useTranslation();
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
            <span>{t(`actionEditor.status.${current}`)}</span>
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
                  <span>{t(`actionEditor.status.${s}`)}</span>
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
                    {t("actionEditor.statusDropdown.disabledTooltip")}
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
  const { t } = useTranslation();
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
        {overdue ? t("actionEditor.timestamp.overduePrefix") : t("actionEditor.timestamp.scheduledForPrefix")}
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
          {t("actionEditor.timestamp.completed")}{linkDate(cDate, cLabel)}
        </div>
        {showOriginal && (
          <div className="font-mono text-[12px] text-text-tertiary">
            {t("actionEditor.timestamp.originallyScheduled", { label: fmtRelDate(sd!) })}
          </div>
        )}
      </div>
    );
  }

  if (status === "delegated" && action.delegatedAt) {
    const dDate = action.delegatedAt.slice(0, 10);
    return (
      <div className="mt-3 font-mono text-[12px] text-text-secondary">
        {action.delegateName
          ? t("actionEditor.timestamp.delegatedTo", { name: action.delegateName })
          : t("actionEditor.timestamp.delegated")}
        {linkDate(dDate, fmtRelFromNow(action.delegatedAt))}
      </div>
    );
  }

  if (status === "dropped" && action.droppedAt) {
    const dDate = action.droppedAt.slice(0, 10);
    return (
      <div className="mt-3 font-mono text-[12px] text-text-secondary">
        {t("actionEditor.timestamp.droppedOn")}{linkDate(dDate, fmtRelDate(dDate))}
      </div>
    );
  }

  if (status === "cancelled" && action.cancelledAt) {
    const dDate = action.cancelledAt.slice(0, 10);
    return (
      <div className="mt-3 font-mono text-[12px] text-text-secondary">
        {t("actionEditor.timestamp.cancelledOn")}{linkDate(dDate, fmtRelDate(dDate))}
      </div>
    );
  }

  return null;
}
