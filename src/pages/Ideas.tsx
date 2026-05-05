import React, { useMemo, useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useStore } from "@/store/useStore";
import type { Idea, IdeaStatus, ID } from "@/types";
import { toast } from "sonner";
import { ConfirmModal } from "@/components/ConfirmModal";
import { AppSidebar } from "@/components/AppSidebar";
import { subscribeAppEvent } from "@/lib/appEvents";

 function relativeAgo(iso: string): { label: string; full: string; sort: number } {
  const d = new Date(iso);
  const now = new Date();
  const days = Math.floor((now.getTime() - d.getTime()) / 86400000);
  const monthDay = d
    .toLocaleDateString("en-US", { month: "short", day: "numeric" })
    .toUpperCase();
  let label: string;
  let fullPrefix: string;
  if (days <= 0) {
    label = "Captured today";
    fullPrefix = "TODAY";
  } else if (days === 1) {
    label = "Captured 1d ago";
    fullPrefix = "1 DAY AGO";
  } else if (days < 14) {
    label = `Captured ${days}d ago`;
    fullPrefix = `${days} DAYS AGO`;
  } else {
    label = `Captured ${monthDay}`;
    fullPrefix = "";
  }
  const full = fullPrefix ? `CAPTURED · ${fullPrefix} · ${monthDay}` : `CAPTURED · ${monthDay}`;
  return { label, full, sort: d.getTime() };
}

/* ===== Chip / FilterGroup ===== */
const Chip: React.FC<{
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  dot?: string;
}> = ({ active, onClick, children, dot }) => (
  <button
    onClick={onClick}
    className={`inline-flex items-center gap-1.5 px-[10px] py-1 rounded-[4px] border text-[12px] transition-colors ${
      active
        ? "bg-surface-hover text-text-primary border-accent"
        : "bg-transparent text-text-secondary border-border-default hover:text-text-primary"
    }`}
  >
    {dot && <span className="w-2 h-2 rounded-full" style={{ background: dot }} />}
    {children}
  </button>
);

const FilterGroup: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="flex items-center gap-2">
    <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-text-tertiary">{label}</span>
    <div className="flex items-center gap-1.5">{children}</div>
  </div>
);

/* ===== Capture input — live wired ===== */
const CaptureInput: React.FC<{ subHint?: string; defaultGoalTitle?: string }> = ({
  subHint,
  defaultGoalTitle,
}) => {
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const captureIdea = useStore((s) => s.captureIdea);
  const selectIdea = useStore((s) => s.selectIdea);
  const active = focused || hovered;

  const submit = () => {
    const title = value.trim();
    if (!title) return;
    const id = captureIdea({ title });
    selectIdea(id);
    setValue("");
    toast.success("Idea captured");
  };

  const hint = subHint ?? (defaultGoalTitle
    ? `Captured ideas land in your default goal — ${defaultGoalTitle}.`
    : "Captured ideas land in your default goal.");

  return (
    <div>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="flex items-center gap-3 bg-surface-elevated rounded-[4px] px-4 transition-colors"
        style={{
          height: 52,
          border: `1px dashed ${active ? "hsl(var(--accent))" : "hsl(var(--border-default))"}`,
          borderStyle: active ? "solid" : "dashed",
        }}
      >
        <span
          className="font-mono text-[16px] leading-none shrink-0"
          style={{ color: active ? "hsl(var(--text-secondary))" : "hsl(var(--text-tertiary))" }}
        >
          +
        </span>
        <input
          id="ideas-capture-input"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
          placeholder="Capture an idea..."
          className="flex-1 bg-transparent outline-none text-[14px] text-text-primary placeholder:text-text-tertiary"
        />
        {focused && (
          <span className="font-mono text-[10px] text-text-tertiary shrink-0">⏎</span>
        )}
      </div>
      <div className="mt-2 text-[12px] text-text-tertiary">{hint}</div>
    </div>
  );
};

/* ===== Idea row ===== */
const IdeaRow: React.FC<{
  idea: Idea;
  goalColor: string;
  selected: boolean;
  onSelect: () => void;
}> = ({ idea, goalColor, selected, onSelect }) => {
  const refCount = idea.references?.length ?? 0;
  const imgCount = idea.imageAttachments?.length ?? 0;
  const { label } = relativeAgo(idea.capturedAt);
  return (
    <div
      onClick={onSelect}
      className={`relative flex items-stretch h-14 cursor-pointer transition-colors ${
        selected ? "bg-surface-elevated" : "hover:bg-surface-hover"
      }`}
    >
      <span className="w-[3px] shrink-0" style={{ background: goalColor }} />
      {selected && (
        <span
          className="absolute left-0 top-0 bottom-0 w-[2px]"
          style={{ background: "hsl(var(--accent))" }}
        />
      )}
      <div className="flex-1 min-w-0 flex flex-col justify-center gap-1 pl-3 pr-4">
        <div className="flex items-center justify-between gap-3">
          <div className="text-[14px] font-medium text-text-primary truncate max-w-[80%]">
            {idea.title}
          </div>
          {(refCount > 0 || imgCount > 0) && (
            <div className="flex items-center gap-1.5 shrink-0 font-mono text-[10px] text-text-tertiary">
              {refCount > 0 && (
                <span className="inline-flex items-center gap-0.5">
                  <span style={{ color: goalColor }}>↗</span>
                  {refCount}
                </span>
              )}
              {imgCount > 0 && (
                <span className="inline-flex items-center gap-0.5">
                  <span style={{ color: goalColor }}>▣</span>
                  {imgCount}
                </span>
              )}
            </div>
          )}
        </div>
        <div className="font-mono text-[11px] text-text-tertiary">{label}</div>
      </div>
    </div>
  );
};

/* ===== Detail sub-components ===== */
const SectionHeading: React.FC<{ children: React.ReactNode; action?: React.ReactNode }> = ({
  children,
  action,
}) => (
  <div className="flex items-center justify-between mb-2">
    <div className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-secondary">
      {children}
    </div>
    {action}
  </div>
);

const GhostButton: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  accent?: boolean;
  warning?: boolean;
}> = ({ children, onClick, accent, warning }) => (
  <button
    onClick={onClick}
    className={`h-9 px-4 py-2 text-[13px] font-medium rounded-[4px] border bg-transparent transition-colors ${
      warning
        ? "text-text-warning border-[hsl(var(--text-warning))] hover:bg-surface-hover"
        : accent
        ? "text-[hsl(var(--accent))] border-[hsl(var(--accent))] hover:bg-surface-hover"
        : "text-text-primary border-border-default hover:border-[hsl(var(--accent))] hover:bg-surface-hover"
    }`}
  >
    {children}
  </button>
);

const TertiaryLink: React.FC<{ children: React.ReactNode; onClick?: () => void }> = ({
  children,
  onClick,
}) => (
  <button
    onClick={onClick}
    className="h-9 px-2 text-[13px] text-text-tertiary hover:text-text-secondary transition-colors"
  >
    {children}
  </button>
);

/* ===== Convert overlays — live wired ===== */
type OverlayMode = null | "action" | "project" | "discard";

const ConvertActionOverlay: React.FC<{ idea: Idea; onDone: () => void }> = ({ idea, onDone }) => {
  const projects = useStore((s) =>
    s.projects.filter((p) => p.goalId === idea.goalId && p.status === "active"),
  );
  const convertIdeaToAction = useStore((s) => s.convertIdeaToAction);
  const [title, setTitle] = useState(idea.title);
  const [projectId, setProjectId] = useState<string>(projects[0]?.id ?? "");
  const [notes, setNotes] = useState(idea.note ?? "");

  const submit = () => {
    if (!title.trim()) return;
    convertIdeaToAction(idea.id, {
      title: title.trim(),
      projectId: projectId || null,
      goalId: idea.goalId,
      notes: notes.trim() || undefined,
    });
    toast.success("Idea converted to action");
    onDone();
  };

  return (
    <div className="bg-surface-elevated border border-border-default rounded-[4px] p-5">
      <div className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-secondary">
        CONVERT TO ACTION
      </div>
      <div className="mt-4 flex flex-col gap-3">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="bg-surface-hover rounded-[4px] px-3 py-2 text-[14px] text-text-primary outline-none border border-transparent focus:border-border-default"
        />
        <select
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          className="bg-surface-hover rounded-[4px] px-3 py-2 text-[14px] text-text-primary outline-none border border-transparent focus:border-border-default"
        >
          <option value="">— Goal-level (no project) —</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title}
            </option>
          ))}
        </select>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Notes (optional)"
          className="bg-surface-hover rounded-[4px] px-3 py-2 text-[14px] text-text-primary outline-none border border-transparent focus:border-border-default resize-none placeholder:text-text-tertiary"
        />
      </div>
      <div className="mt-4 flex items-center gap-3">
        <GhostButton accent onClick={submit}>
          Create action
        </GhostButton>
        <TertiaryLink onClick={onDone}>Cancel</TertiaryLink>
      </div>
    </div>
  );
};

const ConvertProjectOverlay: React.FC<{ idea: Idea; onDone: () => void }> = ({ idea, onDone }) => {
  const convertIdeaToProject = useStore((s) => s.convertIdeaToProject);
  const [title, setTitle] = useState(idea.title);
  const [desc, setDesc] = useState("");
  const [notes, setNotes] = useState(idea.note ?? "");

  const submit = () => {
    if (!title.trim()) return;
    convertIdeaToProject(idea.id, {
      title: title.trim(),
      goalId: idea.goalId,
      description: (desc.trim() || notes.trim() || undefined),
    });
    toast.success("Idea converted to project");
    onDone();
  };

  return (
    <div className="bg-surface-elevated border border-border-default rounded-[4px] p-5">
      <div className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-secondary">
        CONVERT TO PROJECT
      </div>
      <div className="mt-4 flex flex-col gap-3">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="bg-surface-hover rounded-[4px] px-3 py-2 text-[14px] text-text-primary outline-none border border-transparent focus:border-border-default"
        />
        <input
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="Short description"
          className="bg-surface-hover rounded-[4px] px-3 py-2 text-[14px] text-text-primary outline-none border border-transparent focus:border-border-default placeholder:text-text-tertiary"
        />
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="bg-surface-hover rounded-[4px] px-3 py-2 text-[14px] text-text-primary outline-none border border-transparent focus:border-border-default resize-none"
        />
      </div>
      <div className="mt-4 flex items-center gap-3">
        <GhostButton accent onClick={submit}>
          Create project
        </GhostButton>
        <TertiaryLink onClick={onDone}>Cancel</TertiaryLink>
      </div>
    </div>
  );
};

/* ===== Detail panel ===== */
const IdeaDetail: React.FC<{ idea: Idea }> = ({ idea }) => {
  const [overlay, setOverlay] = useState<OverlayMode>(null);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const goal = useStore((s) => s.goals.find((g) => g.id === idea.goalId));
  const goals = useStore((s) => s.goals);
  const moveIdeaToGoal = useStore((s) => s.moveIdeaToGoal);
  const updateIdea = useStore((s) => s.updateIdea);
  const discardIdea = useStore((s) => s.discardIdea);

  const [title, setTitle] = useState(idea.title);
  const [note, setNote] = useState(idea.note ?? "");
  useEffect(() => {
    setTitle(idea.title);
    setNote(idea.note ?? "");
    setOverlay(null);
  }, [idea.id]);

  const goalColor = goal ? `hsl(var(--${goal.color}))` : "hsl(var(--text-tertiary))";
  const captured = relativeAgo(idea.capturedAt);

  const commitTitle = () => {
    const t = title.trim();
    if (t && t !== idea.title) updateIdea(idea.id, { title: t });
  };
  const commitNote = () => {
    if ((idea.note ?? "") !== note) updateIdea(idea.id, { note: note.trim() || undefined });
  };

  return (
    <div className="px-10 py-8">
      <div className="max-w-[540px] mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 group">
            <span className="w-2 h-2 rounded-full" style={{ background: goalColor }} />
            <select
              value={idea.goalId}
              onChange={(e) => moveIdeaToGoal(idea.id, e.target.value)}
              className="bg-transparent text-[12px] text-text-secondary hover:text-text-primary outline-none cursor-pointer"
            >
              {goals.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.title}
                </option>
              ))}
            </select>
          </div>
          {idea.status !== "captured" && (
            <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-text-tertiary">
              {idea.status.replace(/_/g, " ")}
            </span>
          )}
        </div>

        <div className="h-2" />
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={commitTitle}
          className="w-full bg-transparent text-[24px] font-medium text-text-primary leading-tight outline-none border-b border-transparent focus:border-border-subtle"
        />

        <div className="h-2" />
        <div className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-tertiary">
          {captured.full}
        </div>

        <div className="h-6" />
        <SectionHeading>NOTE</SectionHeading>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onBlur={commitNote}
          rows={4}
          placeholder="Add a note…"
          className="w-full bg-surface-hover rounded-[4px] px-3 py-2 text-[14px] text-text-primary leading-[1.6] outline-none border border-transparent focus:border-border-default resize-none placeholder:text-text-tertiary"
        />

        {idea.references && idea.references.length > 0 && (
          <>
            <div className="h-6" />
            <SectionHeading>{`REFERENCES · ${idea.references.length}`}</SectionHeading>
            <div>
              {idea.references.map((r, i) => (
                <div
                  key={r.id}
                  className={`flex items-start gap-3 py-2 ${
                    i < idea.references.length - 1 ? "border-b border-border-subtle" : ""
                  }`}
                >
                  <span className="text-text-tertiary text-[13px] leading-[1.4]">↗</span>
                  <div className="min-w-0">
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noreferrer"
                      className="block text-[13px] text-text-primary hover:text-[hsl(var(--accent))] transition-colors"
                    >
                      {r.title || r.url}
                    </a>
                    <div className="mt-1 font-mono text-[11px] text-text-tertiary truncate">
                      {r.url}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="h-8" />

        {idea.status === "captured" && overlay === null && (
          <div className="flex items-center gap-3">
            <GhostButton onClick={() => setOverlay("action")}>Convert to action</GhostButton>
            <GhostButton onClick={() => setOverlay("project")}>Convert to project</GhostButton>
            <TertiaryLink onClick={() => setConfirmDiscard(true)}>Discard</TertiaryLink>
          </div>
        )}
        {overlay === "action" && (
          <ConvertActionOverlay idea={idea} onDone={() => setOverlay(null)} />
        )}
        {overlay === "project" && (
          <ConvertProjectOverlay idea={idea} onDone={() => setOverlay(null)} />
        )}
      </div>

      <ConfirmModal
        open={confirmDiscard}
        title="Discard this idea?"
        body="It will be archived (visible under Discarded) but not deleted."
        confirmLabel="Discard"
        destructive
        onConfirm={() => {
          discardIdea(idea.id);
          toast.success("Idea discarded");
          setConfirmDiscard(false);
        }}
        onCancel={() => setConfirmDiscard(false)}
      />
    </div>
  );
};

/* ===== Empty states ===== */
const EmptyDetail: React.FC = () => (
  <div className="h-full flex flex-col items-center justify-center text-center px-10">
    <div className="text-[14px] text-text-secondary">Select an idea to view details</div>
    <div className="mt-1 font-mono text-[11px] text-text-tertiary">or capture a new one above</div>
  </div>
);

const EmptyFiltered: React.FC<{ onClear: () => void }> = ({ onClear }) => (
  <div className="h-full flex flex-col items-center justify-center text-center px-10">
    <div className="text-[14px] text-text-secondary">No ideas match these filters</div>
    <div className="mt-1 font-mono text-[11px] text-text-tertiary">
      Clear filters or change them above.
    </div>
    <div className="mt-4">
      <GhostButton onClick={onClear}>Clear filters</GhostButton>
    </div>
  </div>
);

/* ===== Page ===== */
type StatusFilter = "captured" | "converted" | "discarded";

const useQueryGoal = (): ID | null => {
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  return params.get("goal");
};

const Ideas: React.FC = () => {
  const initialGoalParam = useQueryGoal();
  const ideas = useStore((s) => s.ideas);
  const goals = useStore((s) => s.goals);
  const settings = useStore((s) => s.settings);
  const selectedIdeaId = useStore((s) => s.ui.selectedIdeaId);
  const selectIdea = useStore((s) => s.selectIdea);
  const location = useLocation();

  const activeGoals = useMemo(() => goals.filter((g) => g.status === "active"), [goals]);
  const defaultGoal =
    goals.find((g) => g.id === settings.defaultGoalId) ?? activeGoals[0] ?? goals[0];

  const [goalFilter, setGoalFilter] = useState<"all" | ID>(
    initialGoalParam && goals.some((g) => g.id === initialGoalParam) ? initialGoalParam : "all",
  );
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("captured");

  // Focus the inline capture input when triggered from the ⌘K palette.
  useEffect(() => {
    return subscribeAppEvent("focus-idea-capture", () => {
      requestAnimationFrame(() => {
        const el = document.getElementById("ideas-capture-input") as HTMLInputElement | null;
        el?.focus();
      });
    });
  }, []);

  const matchesStatus = (s: IdeaStatus): boolean => {
    if (statusFilter === "captured") return s === "captured";
    if (statusFilter === "discarded") return s === "discarded";
    return s === "converted_to_action" || s === "converted_to_project";
  };

  const filtered = useMemo(() => {
    return ideas
      .filter((i) => {
        if (goalFilter !== "all" && i.goalId !== goalFilter) return false;
        if (!matchesStatus(i.status)) return false;
        return true;
      })
      .sort((a, b) => new Date(b.capturedAt).getTime() - new Date(a.capturedAt).getTime());
  }, [ideas, goalFilter, statusFilter]);

  const selected =
    filtered.find((i) => i.id === selectedIdeaId) ?? filtered[0] ?? null;

  useEffect(() => {
    if (selected && selected.id !== selectedIdeaId) selectIdea(selected.id);
    if (!selected && selectedIdeaId) selectIdea(undefined);
  }, [selected, selectedIdeaId, selectIdea]);

  const meta = useMemo(() => {
    const captured = ideas.filter((i) => i.status === "captured");
    const total = captured.length;
    const perGoal = activeGoals
      .map((g) => `${captured.filter((i) => i.goalId === g.id).length} in ${g.title}`)
      .join(" · ");
    return perGoal ? `${total} captured · ${perGoal}` : `${total} captured`;
  }, [ideas, activeGoals]);

  const clearFilters = () => {
    setGoalFilter("all");
    setStatusFilter("captured");
  };

  return (
    <div className="min-h-screen bg-surface-base text-text-primary">
      <AppSidebar />
      <main className="ml-[220px] flex flex-col h-screen">
        {/* Page header */}
        <div className="px-8 py-6 border-b border-border-subtle shrink-0">
          <div className="flex items-center justify-between">
            <h1 className="text-[24px] font-medium text-text-primary">Ideas</h1>
            <div className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-tertiary tabular-nums">
              {meta}
            </div>
          </div>
        </div>

        {/* Two-column body */}
        <div className="flex-1 flex min-h-0">
          {/* Left column */}
          <div className="w-[42%] border-r border-border-subtle flex flex-col min-h-0">
            <div style={{ padding: "16px 16px 12px 32px" }}>
              <div className="flex items-center gap-4 flex-wrap">
                <FilterGroup label="GOAL">
                  <Chip active={goalFilter === "all"} onClick={() => setGoalFilter("all")}>
                    All
                  </Chip>
                  {activeGoals.map((g) => (
                    <Chip
                      key={g.id}
                      active={goalFilter === g.id}
                      onClick={() => setGoalFilter(g.id)}
                      dot={`hsl(var(--${g.color}))`}
                    >
                      {g.title}
                    </Chip>
                  ))}
                </FilterGroup>
                <FilterGroup label="STATUS">
                  <Chip
                    active={statusFilter === "captured"}
                    onClick={() => setStatusFilter("captured")}
                  >
                    Captured
                  </Chip>
                  <Chip
                    active={statusFilter === "converted"}
                    onClick={() => setStatusFilter("converted")}
                  >
                    Converted
                  </Chip>
                  <Chip
                    active={statusFilter === "discarded"}
                    onClick={() => setStatusFilter("discarded")}
                  >
                    Discarded
                  </Chip>
                </FilterGroup>
              </div>
            </div>
            {/* Search removed — global ⌘K palette handles search. */}
            {/* Capture input */}
            <div className="pl-8 pr-4 pb-3 border-b border-border-subtle shrink-0">
              <CaptureInput defaultGoalTitle={defaultGoal?.title} />
            </div>
            {/* Sort row */}
            <div className="flex items-center justify-end pl-8 pr-4 py-2">
              <span className="font-mono text-[11px] text-text-secondary">
                Sort: Recent first
              </span>
            </div>
            <div className="flex-1 overflow-y-auto pl-8">
              {filtered.length === 0 ? (
                <div className="p-8 text-center font-mono text-[11px] text-text-tertiary">
                  No ideas match these filters.
                </div>
              ) : (
                filtered.map((idea) => {
                  const g = goals.find((x) => x.id === idea.goalId);
                  const color = g ? `hsl(var(--${g.color}))` : "hsl(var(--text-tertiary))";
                  return (
                    <IdeaRow
                      key={idea.id}
                      idea={idea}
                      goalColor={color}
                      selected={selected?.id === idea.id}
                      onSelect={() => selectIdea(idea.id)}
                    />
                  );
                })
              )}
            </div>
          </div>

          {/* Right column */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {filtered.length === 0 ? (
              <EmptyFiltered onClear={clearFilters} />
            ) : selected ? (
              <IdeaDetail idea={selected} key={selected.id} />
            ) : (
              <EmptyDetail />
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Ideas;
