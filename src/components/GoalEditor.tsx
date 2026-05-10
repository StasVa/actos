// Goal editor — slide-in panel from the right. Controlled by the store's
// ui.activePanel slot (`{ kind: "goal", mode, id?, prefill? }`).
//
// Enforces the 3-active-goal limit on creation. Drop cascades to all child
// projects/actions/rituals via the store. Supports success criteria checklist
// editing inline.

import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useStore } from "@/store/useStore";
import type { Goal, GoalType, GoalStatus, ID } from "@/types";
import { ConfirmModal } from "./ConfirmModal";
import { EditorShell, EditorCloseX, EditorCancelButton } from "./EditorShell";

const GOAL_EXAMPLE_KEYS = [
  "goalEditor.examples.0",
  "goalEditor.examples.1",
  "goalEditor.examples.2",
  "goalEditor.examples.3",
  "goalEditor.examples.4",
];

function GoalExamplesToggle({ onPick }: { onPick: (v: string) => void }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-[13px] text-text-tertiary hover:text-text-secondary inline-flex items-center gap-1"
      >
        <span className="font-mono">{open ? "−" : "+"}</span> {t("goalEditor.examplesToggle")}
      </button>
      {open && (
        <div className="mt-2 flex flex-col gap-1 font-mono text-[13px]">
          {GOAL_EXAMPLE_KEYS.map((key) => {
            const ex = t(key);
            return (
              <button
                key={ex}
                type="button"
                onClick={() => onPick(ex)}
                className="text-left text-text-secondary hover:text-text-primary"
              >
                {ex}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

const STATUS_ORDER: GoalStatus[] = ["active", "completed", "dropped"];
const STATUS_LABEL_KEY: Record<GoalStatus, string> = {
  active: "goalEditor.status.active",
  completed: "goalEditor.status.completed",
  dropped: "goalEditor.status.dropped",
};

const TYPE_OPTIONS: { value: GoalType; labelKey: string }[] = [
  { value: "short-term", labelKey: "goalEditor.type.shortTerm" },
  { value: "mid-term", labelKey: "goalEditor.type.midTerm" },
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
  const settings = useStore((s) => s.settings);
  const navigate = useNavigate();
  const { t } = useTranslation();

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
  const [softBlock, setSoftBlock] = useState(false);
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
  const isFree = settings.subscriptionTier !== "all-in";
  const freeCap = 1;
  const allInCap = 3;
  const atCap = isFree ? activeCount >= freeCap : activeCount >= allInCap;

  // Free user opening "new" panel while at cap → show soft block immediately.
  useEffect(() => {
    if (mode === "new" && isFree && activeCount >= freeCap) {
      setSoftBlock(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const persistField = <K extends keyof Goal>(field: K, value: Goal[K]) => {
    if (mode !== "edit" || !goalId) return;
    updateGoal(goalId, { [field]: value } as Partial<Goal>);
  };

  const handleSaveNew = () => {
    if (!title.trim()) {
      toast.error(t("goalEditor.error.titleRequired"));
      return;
    }
    const isFreeNow = settings.subscriptionTier !== "all-in";
    if (isFreeNow && activeCount >= freeCap) {
      setSoftBlock(true);
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
      toast.error(
        isFreeNow
          ? t("goalEditor.atCap.free")
          : t("goalEditor.atCap.allIn"),
      );
      return;
    }
    toast(t("goalEditor.toast.created"));
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
      toast.error(t("goalEditor.error.tooManyActive"));
      return;
    }
    reopenGoal(goalId);
    toast(t("goalEditor.toast.reopened"));
  };

  const handleDelete = () => {
    if (!goalId) return;
    deleteGoal(goalId);
    toast(t("goalEditor.toast.deleted"));
    setConfirmDelete(false);
    onClose();
  };

  const handleConfirmDrop = () => {
    if (!goalId) return;
    dropGoal(goalId);
    const parts: string[] = [];
    if (childStats.openProjects > 0) parts.push(t("goalEditor.summary.openProjects", { count: childStats.openProjects }));
    if (childStats.openActions > 0) parts.push(t("goalEditor.summary.openActions", { count: childStats.openActions }));
    toast(parts.length > 0 ? t("goalEditor.toast.droppedWith", { summary: parts.join(", ") }) : t("goalEditor.toast.dropped"));
    setConfirmDrop(false);
  };

  const handleConfirmComplete = () => {
    if (!goalId) return;
    markGoalComplete(goalId);
    toast(t("goalEditor.toast.completed"));
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
            <div className="text-[18px] font-medium text-text-primary">{t("goalEditor.header.new")}</div>
          ) : (
            <div className="font-mono text-[11px] uppercase tracking-[0.08em] text-text-tertiary">
              {t("goalEditor.header.edit")}
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
        {mode === "new" && atCap && (
          <div
            className="text-[12px] px-3 py-2 rounded-[4px] border"
            style={{
              borderColor: "hsl(var(--text-warning))",
              color: "hsl(var(--text-warning))",
              background: "hsl(var(--surface-raised))",
            }}
          >
            {isFree
              ? t("goalEditor.atCap.free")
              : t("goalEditor.atCap.allIn")}
          </div>
        )}

        {mode === "new" && (
          <div className="text-[13px] text-text-tertiary leading-[1.5]">
            {t("goalEditor.lede")}
          </div>
        )}

        {/* Title */}
        <div>
          <input
            ref={titleRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => persistField("title", title.trim())}
            placeholder={mode === "new" ? t("goalEditor.titlePlaceholderNew") : t("goalEditor.titlePlaceholderEdit")}
            className="w-full bg-transparent outline-none text-[18px] font-medium text-text-primary placeholder:text-text-tertiary"
          />
          {mode === "new" && <GoalExamplesToggle onPick={(v) => setTitle(v)} />}
        </div>

        {/* Status */}
        {mode === "edit" && (
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-text-tertiary mb-2">
              {t("goalEditor.section.status")}
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
                  {t(STATUS_LABEL_KEY[s])}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Type + target date */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-text-tertiary mb-2">
              {t("goalEditor.section.type")}
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
                  {t(o.labelKey)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-text-tertiary mb-2">
              {t("goalEditor.section.targetDate")}
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
            {t("goalEditor.section.description")}
          </div>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={() => persistField("description", description || undefined)}
            placeholder={t("goalEditor.descriptionPlaceholder")}
            rows={3}
            className="w-full bg-surface-raised border border-border-subtle rounded-[4px] px-2 py-1.5 text-[13px] text-text-primary placeholder:text-text-tertiary outline-none resize-y"
          />
        </div>

        {/* Success criteria */}
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-text-tertiary mb-2">
            {t("goalEditor.section.successCriteria")}
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
                placeholder={t("goalEditor.criteriaPlaceholder")}
                className="flex-1 bg-surface-raised border border-border-subtle rounded-[4px] px-2 py-1.5 text-[12px] text-text-primary placeholder:text-text-tertiary outline-none"
              />
              <button
                onClick={addCriterion}
                className="text-[12px] px-2.5 py-1 rounded-[4px] border border-border-subtle text-text-secondary hover:text-text-primary"
              >
                {t("goalEditor.criteriaAdd")}
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        {mode === "edit" && (
          <div className="grid grid-cols-3 gap-3 pt-2 border-t border-border-subtle">
            <Stat label={t("goalEditor.stat.projects")} value={childStats.projects} />
            <Stat label={t("goalEditor.stat.openProjects")} value={childStats.openProjects} />
            <Stat label={t("goalEditor.stat.openActions")} value={childStats.openActions} />
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-border-subtle px-6 py-3 flex items-center justify-between shrink-0">
        {mode === "new" ? (
          <>
            <EditorCancelButton />
            <button
              onClick={handleSaveNew}
              disabled={atCap}
              className="text-[13px] font-medium px-3 py-1.5 rounded-[4px] disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: "hsl(var(--accent))",
                color: "hsl(var(--surface-base))",
              }}
            >
              {t("goalEditor.create.cta")}
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setConfirmDelete(true)}
              className="text-[13px] text-text-tertiary hover:text-text-warning px-3 py-1.5"
            >
              {t("common.delete")}
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
                  {t("goalEditor.markComplete")}
                </button>
              )}
            </div>
          </>
        )}
      </div>

      <ConfirmModal
        open={confirmDelete}
        title={t("confirm.delete.goal.heading")}
        body={t("goalEditor.confirm.delete.body")}
        confirmLabel={t("common.delete")}
        destructive
        onCancel={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
      />
      <ConfirmModal
        open={confirmDrop}
        title={t("confirm.drop.goal.heading")}
        body={
          childStats.openProjects + childStats.openActions > 0
            ? t("goalEditor.confirm.drop.bodyWith", {
                projects: t("goalEditor.summary.openProjects", { count: childStats.openProjects }),
                actions: t("goalEditor.summary.openActions", { count: childStats.openActions }),
              })
            : t("goalEditor.confirm.drop.bodyEmpty")
        }
        confirmLabel={t("goalEditor.confirm.drop.cta")}
        destructive
        onCancel={() => setConfirmDrop(false)}
        onConfirm={handleConfirmDrop}
      />
      <ConfirmModal
        open={confirmComplete}
        title={t("goalEditor.confirm.complete.heading")}
        body={
          childStats.openProjects + childStats.openActions > 0
            ? t("goalEditor.confirm.complete.bodyWith", {
                projects: t("goalEditor.summary.projects", { count: childStats.openProjects }),
                actions: t("goalEditor.summary.actions", { count: childStats.openActions }),
              })
            : t("goalEditor.confirm.complete.bodyEmpty")
        }
        confirmLabel={t("goalEditor.confirm.complete.cta")}
        onCancel={() => setConfirmComplete(false)}
        onConfirm={handleConfirmComplete}
      />
      {softBlock && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center"
          style={{ background: "var(--backdrop)" }}
          onClick={() => setSoftBlock(false)}
        >
          <div
            className="w-[460px] max-w-[90vw] bg-surface-elevated border border-border-subtle rounded-[6px] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-[16px] font-medium text-text-primary">
              {t("goalEditor.softBlock.heading")}
            </h2>
            <div className="mt-3 text-[13px] text-text-secondary leading-[1.5]">
              {t("goalEditor.softBlock.body")}
            </div>
            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setSoftBlock(false);
                  onClose();
                }}
                className="text-[13px] text-text-secondary hover:text-text-primary transition-colors px-3 py-1.5"
              >
                {t("common.cancel")}
              </button>
              <button
                type="button"
                onClick={() => {
                  setSoftBlock(false);
                  toast(t("goalEditor.toast.draftSaved"));
                  onClose();
                }}
                className="text-[13px] px-3 py-1.5 rounded-[4px] hover:bg-surface-hover text-text-secondary transition-colors"
              >
                {t("goalEditor.softBlock.saveDraft")}
              </button>
              <button
                type="button"
                onClick={() => {
                  setSoftBlock(false);
                  navigate("/settings/subscription");
                }}
                className="text-[13px] font-medium px-3 py-1.5 rounded-[4px] text-white transition-colors"
                style={{ background: "hsl(var(--accent))" }}
              >
                {t("goalEditor.softBlock.goAllIn")}
              </button>
            </div>
          </div>
        </div>
      )}
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
