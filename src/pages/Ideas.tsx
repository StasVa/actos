import React, { useMemo, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useStore } from "@/store/useStore";
import type { Idea, IdeaStatus, ID } from "@/types";
import { toast } from "sonner";
import { ConfirmModal } from "@/components/ConfirmModal";
import { AppSidebar } from "@/components/AppSidebar";
import { subscribeAppEvent } from "@/lib/appEvents";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { FilterDropdown, FilterOption } from "@/components/FilterDropdown";
import { SortDropdown } from "@/components/SortDropdown";
import { EmptyState, FilteredEmpty } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";

function useRelativeAgo() {
  const { t, i18n } = useTranslation();
  return (iso: string): { label: string; full: string; sort: number } => {
    const d = new Date(iso);
    const now = new Date();
    const days = Math.floor((now.getTime() - d.getTime()) / 86400000);
    const monthDay = d
      .toLocaleDateString(i18n.language, { month: "short", day: "numeric" })
      .toUpperCase();
    let label: string;
    let fullPrefix: string;
    if (days <= 0) {
      label = t("ideas.label.capturedToday");
      fullPrefix = t("ideas.label.capturedFullToday");
    } else if (days === 1) {
      label = t("ideas.relCaptured.captured1d");
      fullPrefix = t("ideas.relCaptured.dayAgoUpper");
    } else if (days < 14) {
      label = t("ideas.relCaptured.capturedDays", { count: days });
      fullPrefix = t("ideas.relCaptured.daysAgoUpper", { count: days });
    } else {
      label = t("ideas.relCaptured.capturedOnDate", { date: monthDay });
      fullPrefix = "";
    }
    const full = fullPrefix
      ? t("ideas.label.capturedFullPrefix", { prefix: fullPrefix, date: monthDay })
      : t("ideas.label.capturedFullNoPrefix", { date: monthDay });
    return { label, full, sort: d.getTime() };
  };
}

/* ===== Pill / FilterPillRow ===== */
const Pill: React.FC<{
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  dot?: string;
}> = ({ active, onClick, children, dot }) => (
  <button
    onClick={onClick}
    className={`inline-flex items-center gap-2 shrink-0 rounded-[4px] border transition-colors whitespace-nowrap ${
      active
        ? "border-[hsl(var(--accent))] text-text-primary font-medium bg-transparent"
        : "border-border-subtle text-text-secondary bg-transparent hover:bg-surface-hover hover:border-border-default"
    }`}
    style={{ height: 32, padding: "6px 12px", fontSize: 13, lineHeight: "20px" }}
  >
    {dot && <span className="w-2 h-2 rounded-full shrink-0" style={{ background: dot }} />}
    {children}
  </button>
);

const FilterPillRow: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="flex items-center gap-2 min-w-0">
    <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-tertiary shrink-0">
      {label}
    </span>
    <div
      className="flex items-center gap-2 min-w-0 flex-nowrap md:flex-wrap overflow-x-auto md:overflow-visible scrollbar-hide"
      style={{ WebkitOverflowScrolling: "touch" }}
    >
      {children}
    </div>
  </div>
);

/* ===== Small id helper for refs/attachments ===== */
const localId = () =>
  (typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `id-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`);

/* ===== New idea form — inline panel below page header ===== */
const NewIdeaForm: React.FC<{
  defaultGoalId?: ID;
  onClose: () => void;
}> = ({ defaultGoalId, onClose }) => {
  const goals = useStore((s) => s.goals);
  const activeGoals = useMemo(() => goals.filter((g) => g.status === "active"), [goals]);
  const captureIdea = useStore((s) => s.captureIdea);
  const selectIdea = useStore((s) => s.selectIdea);

  const [goalId, setGoalId] = useState<ID>(
    defaultGoalId ?? activeGoals[0]?.id ?? goals[0]?.id ?? "",
  );
  const [title, setTitle] = useState("");
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const canSubmit = title.trim().length > 0 && !!goalId;

  const submit = () => {
    if (!canSubmit) return;
    const id = captureIdea({ title: title.trim(), goalId });
    selectIdea(id);
    toast.success("Idea captured");
    onClose();
  };

  return (
    <div
      id="ideas-new-form"
      className="bg-surface-elevated border border-border-default rounded-[4px] p-4"
    >
      <div className="flex items-center gap-3">
        <select
          value={goalId}
          onChange={(e) => setGoalId(e.target.value)}
          className="bg-surface-hover rounded-[4px] px-2 py-2 text-[12px] text-text-secondary outline-none border border-transparent focus:border-border-default cursor-pointer"
        >
          {activeGoals.map((g) => (
            <option key={g.id} value={g.id}>
              {g.title}
            </option>
          ))}
        </select>
        <input
          id="ideas-capture-input"
          ref={inputRef}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
            if (e.key === "Escape") onClose();
          }}
          placeholder="Idea title…"
          className="flex-1 bg-transparent outline-none text-[14px] text-text-primary placeholder:text-text-tertiary"
        />
        <button
          onClick={submit}
          disabled={!canSubmit}
          className="h-9 px-4 text-[13px] font-medium rounded-[4px] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: "hsl(var(--accent))",
            color: "hsl(var(--accent-foreground))",
          }}
        >
          Save
        </button>
        <button
          onClick={onClose}
          className="h-9 px-2 text-[13px] text-text-tertiary hover:text-text-secondary transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

/* ===== Idea row (matches /actions row pattern) ===== */
const STATUS_PILL_LABEL: Record<IdeaStatus, string> = {
  captured: "CAPTURED",
  converted_to_action: "CONVERTED",
  converted_to_project: "CONVERTED",
  discarded: "DISCARDED",
};

const IdeaStatusPill: React.FC<{ status: IdeaStatus }> = ({ status }) => (
  <span
    className="inline-flex items-center font-mono uppercase tracking-[0.08em] rounded-[4px] border border-border-subtle text-text-secondary"
    style={{ padding: "4px 8px", fontSize: 11, background: "transparent" }}
  >
    {STATUS_PILL_LABEL[status]}
  </span>
);

const IdeaRow: React.FC<{
  idea: Idea;
  goalColor: string;
  goalTitle: string;
  metaSuffix: string;
  onSelect: () => void;
}> = ({ idea, goalColor, goalTitle, metaSuffix, onSelect }) => {
  const isDiscarded = idea.status === "discarded";
  const isConverted =
    idea.status === "converted_to_action" || idea.status === "converted_to_project";
  return (
    <div
      onClick={onSelect}
      className="relative flex items-stretch cursor-pointer border-b border-border-subtle hover:bg-surface-hover transition-colors"
      style={{ minHeight: 56, opacity: isDiscarded ? 0.6 : 1 }}
    >
      <span
        className="absolute left-0 top-0 bottom-0"
        style={{ background: goalColor, width: 3 }}
      />
      <div className="flex flex-col gap-1 py-3 pr-4 w-full" style={{ paddingLeft: 19 }}>
        <div className="flex items-center justify-between gap-3">
          <span
            className={`text-[15px] font-medium truncate ${
              isDiscarded || isConverted ? "text-text-secondary" : "text-text-primary"
            }`}
          >
            {idea.title}
          </span>
          <div className="shrink-0">
            <IdeaStatusPill status={idea.status} />
          </div>
        </div>
        <div className="flex items-center font-mono text-[12px] text-text-secondary truncate">
          <span
            className="inline-block w-1.5 h-1.5 rounded-full mr-1.5 shrink-0"
            style={{ background: goalColor }}
          />
          <span className="truncate">
            {goalTitle}
            <span className="mx-1.5 text-text-tertiary">·</span>
            {metaSuffix}
          </span>
        </div>
      </div>
    </div>
  );
};

/* ===== Group header (collapsible) ===== */
const GroupHeader: React.FC<{
  label: string;
  count: number;
  collapsed: boolean;
  onToggle: () => void;
}> = ({ label, count, collapsed, onToggle }) => (
  <button
    type="button"
    onClick={onToggle}
    className="w-full flex items-center gap-2 px-3 h-8 bg-surface-raised border-b border-border-subtle text-left cursor-pointer hover:bg-surface-hover"
  >
    <span className="font-mono text-[11px] text-text-tertiary">{collapsed ? "▸" : "▾"}</span>
    <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-text-tertiary">
      {label} · {count}
    </span>
  </button>
);

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
      references: (idea.references ?? []).map((r) => ({ ...r })),
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

/* ===== References section ===== */
const ReferencesSection: React.FC<{ idea: Idea }> = ({ idea }) => {
  const updateIdea = useStore((s) => s.updateIdea);
  const refs = idea.references ?? [];
  const [adding, setAdding] = useState(false);
  const [url, setUrl] = useState("");
  const [refTitle, setRefTitle] = useState("");
  const [editingId, setEditingId] = useState<ID | null>(null);
  const [openMenuId, setOpenMenuId] = useState<ID | null>(null);

  const resetForm = () => {
    setUrl("");
    setRefTitle("");
    setAdding(false);
    setEditingId(null);
  };

  const startEdit = (id: ID) => {
    const r = refs.find((x) => x.id === id);
    if (!r) return;
    setUrl(r.url);
    setRefTitle(r.title ?? "");
    setEditingId(id);
    setAdding(true);
    setOpenMenuId(null);
  };

  const submit = () => {
    const u = url.trim();
    if (!u) return;
    const t = refTitle.trim() || undefined;
    if (editingId) {
      updateIdea(idea.id, {
        references: refs.map((r) => (r.id === editingId ? { ...r, url: u, title: t } : r)),
      });
    } else {
      updateIdea(idea.id, {
        references: [...refs, { id: localId(), url: u, title: t }],
      });
    }
    resetForm();
  };

  const remove = (id: ID) => {
    updateIdea(idea.id, { references: refs.filter((r) => r.id !== id) });
    setOpenMenuId(null);
  };

  return (
    <div>
      <SectionHeading
        action={
          !adding && (
            <button
              onClick={() => setAdding(true)}
              className="text-[12px] text-[hsl(var(--accent))] hover:underline"
            >
              + Add reference
            </button>
          )
        }
      >
        {`REFERENCES · ${refs.length}`}
      </SectionHeading>

      {refs.length === 0 && !adding && (
        <div className="text-[12px] text-text-tertiary">
          No references yet. Add links to videos, articles, designs.
        </div>
      )}

      {refs.length > 0 && (
        <div>
          {refs.map((r, i) => (
            <div
              key={r.id}
              className={`group relative flex items-start gap-3 py-2 px-2 -mx-2 rounded-[3px] hover:bg-surface-hover transition-colors ${
                i < refs.length - 1 ? "border-b border-border-subtle" : ""
              }`}
            >
              <span className="text-text-tertiary text-[13px] leading-[1.4]">↗</span>
              <div className="min-w-0 flex-1">
                <a
                  href={r.url}
                  target="_blank"
                  rel="noreferrer"
                  className="block text-[13px] text-text-primary hover:text-[hsl(var(--accent))] transition-colors truncate"
                >
                  {r.title || r.url}
                </a>
                <div className="mt-1 font-mono text-[11px] text-text-tertiary truncate">
                  {r.url}
                </div>
              </div>
              <div className="relative shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenMenuId(openMenuId === r.id ? null : r.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 inline-flex items-center justify-center w-6 h-6 rounded-[3px] text-text-tertiary hover:bg-surface-elevated hover:text-text-primary transition-colors leading-none"
                  aria-label="Reference options"
                >
                  <span className="text-[14px] -mt-1">⋯</span>
                </button>
                {openMenuId === r.id && (
                  <div className="absolute right-0 top-[calc(100%+4px)] z-10 w-32 rounded-[4px] border border-border-subtle bg-surface-elevated p-1 shadow-md">
                    <button
                      onClick={() => startEdit(r.id)}
                      className="block w-full text-left text-[12px] px-2 py-1.5 rounded-[3px] hover:bg-surface-hover text-text-primary"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => remove(r.id)}
                      className="block w-full text-left text-[12px] px-2 py-1.5 rounded-[3px] hover:bg-surface-hover text-text-warning"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {adding && (
        <div className="mt-3 bg-surface-hover rounded-[4px] p-3 flex flex-col gap-2">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submit();
              if (e.key === "Escape") resetForm();
            }}
            autoFocus
            placeholder="https://..."
            className="bg-surface-elevated rounded-[4px] px-3 py-2 text-[13px] text-text-primary outline-none border border-transparent focus:border-border-default placeholder:text-text-tertiary"
          />
          <input
            value={refTitle}
            onChange={(e) => setRefTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submit();
              if (e.key === "Escape") resetForm();
            }}
            placeholder="Optional title"
            className="bg-surface-elevated rounded-[4px] px-3 py-2 text-[13px] text-text-primary outline-none border border-transparent focus:border-border-default placeholder:text-text-tertiary"
          />
          <div className="flex items-center gap-2">
            <button
              onClick={submit}
              disabled={!url.trim()}
              className="h-8 px-3 text-[12px] font-medium rounded-[4px] border border-[hsl(var(--accent))] text-[hsl(var(--accent))] hover:bg-surface-elevated transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {editingId ? "Save" : "Add"}
            </button>
            <button
              onClick={resetForm}
              className="h-8 px-2 text-[12px] text-text-tertiary hover:text-text-secondary transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

/* ===== Attachments section ===== */
const AttachmentsSection: React.FC<{ idea: Idea }> = ({ idea }) => {
  const updateIdea = useStore((s) => s.updateIdea);
  const atts = idea.imageAttachments ?? [];
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const ALLOWED = /^image\/(png|jpe?g|gif|webp)$/i;

  const addFiles = async (files: FileList | File[]) => {
    const list = Array.from(files).filter((f) => ALLOWED.test(f.type));
    if (list.length === 0) {
      toast.error("Only PNG, JPG, GIF, or WebP images are accepted.");
      return;
    }
    const readAsDataUrl = (file: File) =>
      new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      });
    try {
      const newAtts = await Promise.all(
        list.map(async (f) => ({ id: localId(), dataUrl: await readAsDataUrl(f) })),
      );
      updateIdea(idea.id, { imageAttachments: [...atts, ...newAtts] });
      toast.success(newAtts.length === 1 ? "Image attached" : `${newAtts.length} images attached`);
    } catch {
      toast.error("Failed to read image.");
    }
  };

  const remove = (id: ID) => {
    updateIdea(idea.id, { imageAttachments: atts.filter((a) => a.id !== id) });
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer?.files?.length) addFiles(e.dataTransfer.files);
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={onDrop}
      className={`rounded-[4px] transition-colors ${
        dragOver ? "outline outline-1 outline-[hsl(var(--accent))] bg-surface-hover/30" : ""
      }`}
    >
      <SectionHeading
        action={
          <button
            onClick={() => fileInputRef.current?.click()}
            className="text-[12px] text-[hsl(var(--accent))] hover:underline"
          >
            + Upload
          </button>
        }
      >
        {`ATTACHMENTS · ${atts.length}`}
      </SectionHeading>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/gif,image/webp"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) addFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {atts.length === 0 ? (
        <div className="text-[12px] text-text-tertiary">
          No attachments yet. Upload images for visual references.
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(80px,80px))] gap-2">
          {atts.map((a) => (
            <div
              key={a.id}
              className="group relative w-20 h-20 rounded-[4px] overflow-hidden bg-surface-hover cursor-pointer"
              onClick={() => setLightboxUrl(a.dataUrl)}
            >
              <img src={a.dataUrl} alt={a.caption ?? ""} className="w-full h-full object-cover" />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  remove(a.id);
                }}
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white text-[11px] leading-none opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                aria-label="Remove image"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {lightboxUrl && (
        <div
          onClick={() => setLightboxUrl(null)}
          className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-8 cursor-zoom-out"
        >
          <img
            src={lightboxUrl}
            alt=""
            className="max-w-full max-h-full object-contain rounded-[4px]"
          />
        </div>
      )}
    </div>
  );
};

/* ===== Detail panel ===== */
const IdeaDetail: React.FC<{ idea: Idea; mobile?: boolean }> = ({ idea, mobile = false }) => {
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
  const relativeAgo = useRelativeAgo();
  const captured = relativeAgo(idea.capturedAt);

  const commitTitle = () => {
    const t = title.trim();
    if (t && t !== idea.title) updateIdea(idea.id, { title: t });
  };
  const commitNote = () => {
    if ((idea.note ?? "") !== note) updateIdea(idea.id, { note: note.trim() || undefined });
  };

  return (
    <div className={mobile ? "px-4 py-4" : "px-10 py-8"}>
      <div className={mobile ? "" : "max-w-[540px] mx-auto"}>
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

        <div className="h-6" />
        <ReferencesSection idea={idea} />

        <div className="h-6" />
        <AttachmentsSection idea={idea} />

        <div className="h-6" />
        <div className="border-t border-border-subtle" />
        <div className="h-4" />

        {idea.status === "captured" && overlay === null && (
          mobile ? (
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setOverlay("action")}
                className="w-full h-11 text-[14px] font-medium rounded-[4px] border border-border-default text-text-primary bg-transparent hover:bg-surface-hover transition-colors"
              >
                Convert to action
              </button>
              <button
                onClick={() => setOverlay("project")}
                className="w-full h-11 text-[14px] font-medium rounded-[4px] border border-border-default text-text-primary bg-transparent hover:bg-surface-hover transition-colors"
              >
                Convert to project
              </button>
              <button
                onClick={() => setConfirmDiscard(true)}
                className="mt-2 w-full h-11 text-[13px] text-text-tertiary hover:text-text-secondary transition-colors"
              >
                Discard
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <GhostButton onClick={() => setOverlay("action")}>Convert to action</GhostButton>
              <GhostButton onClick={() => setOverlay("project")}>Convert to project</GhostButton>
              <TertiaryLink onClick={() => setConfirmDiscard(true)}>Discard</TertiaryLink>
            </div>
          )
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
    <div className="mt-1 font-mono text-[11px] text-text-tertiary">or click "+ New idea" to capture one</div>
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

type StatusFilter = "all" | "captured" | "converted" | "discarded";
type GoalFilter = "all" | ID;
type DateFilter = "all" | "7d" | "30d" | "month";
type SortKey = "recent" | "oldest" | "title";

const STATUS_OPTIONS: FilterOption<StatusFilter>[] = [
  { value: "all", label: "All" },
  { value: "captured", label: "Captured" },
  { value: "converted", label: "Converted" },
  { value: "discarded", label: "Discarded" },
];

const DATE_OPTIONS: FilterOption<DateFilter>[] = [
  { value: "all", label: "All time" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "month", label: "This month" },
];

const SORT_OPTIONS: FilterOption<SortKey>[] = [
  { value: "recent", label: "Recent first" },
  { value: "oldest", label: "Oldest first" },
  { value: "title", label: "Title A–Z" },
];

const useQueryGoal = (): ID | null => {
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  return params.get("goal");
};

/* ===== New idea modal (Dialog / bottom sheet on mobile) ===== */
const NewIdeaModal: React.FC<{
  open: boolean;
  onClose: () => void;
  defaultGoalId?: ID;
}> = ({ open, onClose, defaultGoalId }) => {
  const goals = useStore((s) => s.goals);
  const activeGoals = useMemo(() => goals.filter((g) => g.status === "active"), [goals]);
  const captureIdea = useStore((s) => s.captureIdea);
  const selectIdea = useStore((s) => s.selectIdea);
  const isMobile = useIsMobile();

  const [title, setTitle] = useState("");
  const [goalId, setGoalId] = useState<ID>(defaultGoalId ?? activeGoals[0]?.id ?? "");
  const [note, setNote] = useState("");
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (open) {
      setTitle("");
      setNote("");
      setGoalId(defaultGoalId ?? activeGoals[0]?.id ?? "");
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open, defaultGoalId, activeGoals]);

  const dirty = title.trim() !== "" || note.trim() !== "";
  const canSubmit = title.trim().length > 0 && !!goalId;

  const tryClose = () => {
    if (dirty) {
      const ok = window.confirm("Discard this idea?");
      if (!ok) return;
    }
    onClose();
  };

  const submit = () => {
    if (!canSubmit) return;
    const id = captureIdea({ title: title.trim(), goalId, note: note.trim() || undefined });
    selectIdea(id);
    toast.success("Idea captured");
    onClose();
  };

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={(v) => (!v ? tryClose() : null)}>
        <SheetContent side="bottom" className="p-0 max-h-[90vh] rounded-t-[16px] border-border-subtle bg-surface-elevated">
          <NewIdeaModalBody
            inputRef={inputRef}
            title={title}
            setTitle={setTitle}
            goalId={goalId}
            setGoalId={setGoalId}
            note={note}
            setNote={setNote}
            activeGoals={activeGoals}
            canSubmit={canSubmit}
            onCancel={tryClose}
            onSubmit={submit}
          />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(v) => (!v ? tryClose() : null)}>
      <DialogContent className="max-w-[640px] p-0 bg-surface-elevated border border-border-subtle rounded-[6px]">
        <NewIdeaModalBody
          inputRef={inputRef}
          title={title}
          setTitle={setTitle}
          goalId={goalId}
          setGoalId={setGoalId}
          note={note}
          setNote={setNote}
          activeGoals={activeGoals}
          canSubmit={canSubmit}
          onCancel={tryClose}
          onSubmit={submit}
        />
      </DialogContent>
    </Dialog>
  );
};

const NewIdeaModalBody: React.FC<{
  inputRef: React.RefObject<HTMLInputElement>;
  title: string;
  setTitle: (v: string) => void;
  goalId: ID;
  setGoalId: (v: ID) => void;
  note: string;
  setNote: (v: string) => void;
  activeGoals: { id: ID; title: string; color: string }[];
  canSubmit: boolean;
  onCancel: () => void;
  onSubmit: () => void;
}> = ({ inputRef, title, setTitle, goalId, setGoalId, note, setNote, activeGoals, canSubmit, onCancel, onSubmit }) => (
  <div className="p-6 flex flex-col gap-4">
    <div className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-secondary">
      NEW IDEA
    </div>
    <input
      ref={inputRef}
      value={title}
      onChange={(e) => setTitle(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") onSubmit();
        if (e.key === "Escape") onCancel();
      }}
      placeholder="Idea title…"
      className="bg-surface-hover rounded-[4px] px-3 py-3 text-[16px] text-text-primary outline-none border border-transparent focus:border-border-default placeholder:text-text-tertiary"
    />
    <div className="flex flex-col gap-1.5">
      <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-tertiary">
        GOAL
      </span>
      <select
        value={goalId}
        onChange={(e) => setGoalId(e.target.value)}
        className="bg-surface-hover rounded-[4px] px-3 py-2.5 text-[14px] text-text-primary outline-none border border-transparent focus:border-border-default cursor-pointer"
      >
        {activeGoals.map((g) => (
          <option key={g.id} value={g.id}>
            {g.title}
          </option>
        ))}
      </select>
    </div>
    <div className="flex flex-col gap-1.5">
      <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-tertiary">
        NOTE
      </span>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={3}
        placeholder="Optional…"
        className="bg-surface-hover rounded-[4px] px-3 py-2 text-[14px] text-text-primary outline-none border border-transparent focus:border-border-default resize-none placeholder:text-text-tertiary"
      />
    </div>
    <div className="flex items-center justify-end gap-2 pt-2">
      <button
        onClick={onCancel}
        className="h-9 px-4 text-[13px] text-text-tertiary hover:text-text-secondary transition-colors"
      >
        Cancel
      </button>
      <button
        onClick={onSubmit}
        disabled={!canSubmit}
        className="h-9 px-4 text-[13px] font-medium rounded-[4px] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        style={{ background: "hsl(var(--accent))", color: "hsl(var(--accent-foreground))" }}
      >
        Create
      </button>
    </div>
  </div>
);

/* ===== Idea editor sheet (right slide-in / bottom on mobile) ===== */
const IdeaEditorSheet: React.FC<{
  idea: Idea | null;
  open: boolean;
  onClose: () => void;
}> = ({ idea, open, onClose }) => {
  const isMobile = useIsMobile();
  return (
    <Sheet open={open} onOpenChange={(v) => (!v ? onClose() : null)}>
      <SheetContent
        side={isMobile ? "bottom" : "right"}
        className={
          isMobile
            ? "p-0 max-h-[90vh] rounded-t-[16px] border-border-subtle bg-surface-elevated overflow-y-auto"
            : "p-0 sm:max-w-[480px] w-[480px] border-l border-border-subtle bg-surface-elevated overflow-y-auto"
        }
      >
        {idea && <IdeaDetail idea={idea} key={idea.id} mobile={isMobile} />}
      </SheetContent>
    </Sheet>
  );
};

const Ideas: React.FC = () => {
  const { t } = useTranslation();
  const initialGoalParam = useQueryGoal();
  const ideas = useStore((s) => s.ideas);
  const goals = useStore((s) => s.goals);
  const settings = useStore((s) => s.settings);
  const selectedIdeaId = useStore((s) => s.ui.selectedIdeaId);
  const selectIdea = useStore((s) => s.selectIdea);

  const activeGoals = useMemo(() => goals.filter((g) => g.status === "active"), [goals]);
  const defaultGoal =
    goals.find((g) => g.id === settings.defaultGoalId) ?? activeGoals[0] ?? goals[0];

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("captured");
  const [goalFilter, setGoalFilter] = useState<GoalFilter>(
    initialGoalParam && goals.some((g) => g.id === initialGoalParam) ? initialGoalParam : "all",
  );
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("recent");
  const [showNew, setShowNew] = useState(false);
  const [terminalCollapsed, setTerminalCollapsed] = useState(true);

  // Open the new-idea modal when triggered from the ⌘K palette.
  useEffect(() => {
    return subscribeAppEvent("focus-idea-capture", () => setShowNew(true));
  }, []);

  const matchesStatus = (s: IdeaStatus): boolean => {
    if (statusFilter === "all") return true;
    if (statusFilter === "captured") return s === "captured";
    if (statusFilter === "discarded") return s === "discarded";
    return s === "converted_to_action" || s === "converted_to_project";
  };

  const matchesDate = (iso: string): boolean => {
    if (dateFilter === "all") return true;
    const d = new Date(iso);
    const now = new Date();
    if (dateFilter === "7d") return now.getTime() - d.getTime() <= 7 * 86400000;
    if (dateFilter === "30d") return now.getTime() - d.getTime() <= 30 * 86400000;
    if (dateFilter === "month")
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    return true;
  };

  const sortFn = useMemo(() => {
    return (a: Idea, b: Idea) => {
      if (sortKey === "title") return a.title.localeCompare(b.title);
      const ta = new Date(a.capturedAt).getTime();
      const tb = new Date(b.capturedAt).getTime();
      return sortKey === "oldest" ? ta - tb : tb - ta;
    };
  }, [sortKey]);

  const filtered = useMemo(() => {
    return ideas
      .filter((i) => {
        if (goalFilter !== "all" && i.goalId !== goalFilter) return false;
        if (!matchesStatus(i.status)) return false;
        if (!matchesDate(i.capturedAt)) return false;
        return true;
      })
      .sort(sortFn);
  }, [ideas, goalFilter, statusFilter, dateFilter, sortFn]);

  const isTerminal = (s: IdeaStatus) => s !== "captured";
  const grouped = useMemo(() => {
    if (statusFilter !== "all") return { single: filtered };
    return {
      active: filtered.filter((i) => !isTerminal(i.status)),
      terminal: filtered.filter((i) => isTerminal(i.status)),
    };
  }, [filtered, statusFilter]);

  const meta = useMemo(() => {
    const captured = ideas.filter((i) => i.status === "captured").length;
    const converted = ideas.filter(
      (i) => i.status === "converted_to_action" || i.status === "converted_to_project",
    ).length;
    const discarded = ideas.filter((i) => i.status === "discarded").length;
    return `${captured} CAPTURED · ${converted} CONVERTED · ${discarded} DISCARDED`;
  }, [ideas]);

  const anyApplied =
    statusFilter !== "captured" ||
    goalFilter !== "all" ||
    dateFilter !== "all" ||
    sortKey !== "recent";

  const clearFilters = () => {
    setStatusFilter("captured");
    setGoalFilter("all");
    setDateFilter("all");
    setSortKey("recent");
  };

  const goalOptions: FilterOption<GoalFilter>[] = useMemo(
    () => [
      { value: "all", label: "All" },
      ...activeGoals.map((g) => ({
        value: g.id as GoalFilter,
        label: g.title,
        dot: `hsl(var(--${g.color}))`,
      })),
    ],
    [activeGoals],
  );

  const editorOpen = !!selectedIdeaId && ideas.some((i) => i.id === selectedIdeaId);
  const selected = ideas.find((i) => i.id === selectedIdeaId) ?? null;

  const relativeAgo = useRelativeAgo();
  const metaSuffix = (idea: Idea): string => {
    const cap = relativeAgo(idea.capturedAt).label;
    if (idea.status === "captured") return cap;
    if (idea.status === "converted_to_action") return t("ideas.status.convertedAction");
    if (idea.status === "converted_to_project") return t("ideas.status.convertedProject");
    const discardedRel = idea.discardedAt ? relativeAgo(idea.discardedAt).label : cap;
    return t("ideas.metaSuffix.discarded", { rel: discardedRel });
  };

  const renderRow = (idea: Idea) => {
    const g = goals.find((x) => x.id === idea.goalId);
    const color = g ? `hsl(var(--${g.color}))` : "hsl(var(--text-tertiary))";
    return (
      <IdeaRow
        key={idea.id}
        idea={idea}
        goalColor={color}
        goalTitle={g?.title ?? "—"}
        metaSuffix={metaSuffix(idea)}
        onSelect={() => selectIdea(idea.id)}
      />
    );
  };

  return (
    <div className="min-h-screen bg-surface-base text-text-primary">
      <AppSidebar />
      <main className="app-main page-medium flex flex-col h-screen">
        <div className="px-4 md:px-10 pt-6 pb-4 shrink-0">
          <PageHeader
            title={t("ideas.page.title")}
            meta={meta}
            cta={{
              label: "+ New idea",
              onClick: () => setShowNew(true),
              ariaLabel: "New idea",
            }}
            filters={
              <>
                <FilterDropdown
                  label="STATUS"
                  value={statusFilter}
                  defaultValue="captured"
                  options={STATUS_OPTIONS}
                  onChange={(v) => setStatusFilter(v)}
                />
                <FilterDropdown
                  label="GOAL"
                  value={goalFilter}
                  defaultValue="all"
                  options={goalOptions}
                  onChange={(v) => setGoalFilter(v)}
                />
                <FilterDropdown
                  label="DATE"
                  value={dateFilter}
                  defaultValue="all"
                  options={DATE_OPTIONS}
                  onChange={(v) => setDateFilter(v)}
                />
                {anyApplied && (
                  <button
                    onClick={clearFilters}
                    className="ml-1 text-[12px] text-text-tertiary hover:text-text-secondary transition-colors shrink-0"
                  >
                    Clear filters
                  </button>
                )}
              </>
            }
            sort={
              <SortDropdown value={sortKey} options={SORT_OPTIONS} onChange={(v) => setSortKey(v)} />
            }
          />
        </div>

        {/* Full-width list */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {ideas.length === 0 ? (
            <EmptyState
              headline="No ideas yet."
              description="Capture rough thoughts here before they become actions or projects. Ideas wait until you decide what to do with them."
              ctaLabel="+ New idea"
              onCta={() => setShowNew(true)}
            />
          ) : filtered.length === 0 ? (
            <FilteredEmpty onClear={clearFilters} />
          ) : "single" in grouped ? (
            grouped.single!.map(renderRow)
          ) : (
            <>
              {grouped.active!.map(renderRow)}
              {grouped.terminal!.length > 0 && (
                <>
                  <GroupHeader
                    label="TERMINAL"
                    count={grouped.terminal!.length}
                    collapsed={terminalCollapsed}
                    onToggle={() => setTerminalCollapsed((v) => !v)}
                  />
                  {!terminalCollapsed && grouped.terminal!.map(renderRow)}
                </>
              )}
            </>
          )}
        </div>
      </main>

      <NewIdeaModal
        open={showNew}
        onClose={() => setShowNew(false)}
        defaultGoalId={defaultGoal?.id}
      />

      <IdeaEditorSheet
        idea={selected}
        open={editorOpen}
        onClose={() => selectIdea(undefined)}
      />
    </div>
  );
};

export default Ideas;
