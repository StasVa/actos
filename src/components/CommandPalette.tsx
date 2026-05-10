// Global Command Palette — opens with ⌘K / Ctrl+K from anywhere.
// Single unified search across goals, projects, actions, rituals, ideas,
// days, plus quick actions and navigation. Keyboard navigable.

import React from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useStore } from "@/store/useStore";
import { emitAppEvent } from "@/lib/appEvents";
import { getRecent, pushRecent, type RecentKind } from "@/lib/recentlyViewed";
import type { Action, Goal, Idea, Project, Ritual, DayEntry } from "@/types";
import { toast } from "sonner";

// ───────── Row model ─────────
type RowKind =
  | "recent"
  | "quick"
  | "nav"
  | "goal"
  | "project"
  | "action"
  | "ritual"
  | "idea"
  | "day";

interface Row {
  key: string;
  kind: RowKind;
  title: string;
  meta?: string;
  rightHint?: string;
  iconChar?: string;
  dotColorVar?: string; // e.g. "--goal-1"
  onSelect: () => void;
}

interface Section {
  heading: string;
  rows: Row[];
}

// ───────── Icons by kind ─────────
const KIND_ICON: Record<RecentKind, string> = {
  goal: "●",
  project: "⌐",
  action: "[]",
  ritual: "⊙",
  idea: "✦",
  day: "▤",
};

const NAV_ITEMS: { labelKey: string; path: string }[] = [
  { labelKey: "nav.today", path: "/today" },
  { labelKey: "nav.progress", path: "/progress" },
  { labelKey: "nav.goals", path: "/goals" },
  { labelKey: "nav.projects", path: "/projects" },
  { labelKey: "nav.actions", path: "/actions" },
  { labelKey: "nav.delegated", path: "/delegated" },
  { labelKey: "nav.rituals", path: "/rituals" },
  { labelKey: "nav.ideas", path: "/ideas" },
  { labelKey: "nav.reviews.days", path: "/reviews/days" },
];

const TODAY_ISO = () => new Date().toISOString().slice(0, 10);

// ───────── Component ─────────
export function CommandPalette() {
  const { t } = useTranslation();
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [selectedIdx, setSelectedIdx] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const goals = useStore((s) => s.goals);
  const projects = useStore((s) => s.projects);
  const actions = useStore((s) => s.actions);
  const rituals = useStore((s) => s.rituals);
  const ideas = useStore((s) => s.ideas);
  const dayEntries = useStore((s) => s.dayEntries);
  const settings = useStore((s) => s.settings);
  const openPanel = useStore((s) => s.openPanel);
  const createAction = useStore((s) => s.createAction);
  const createProject = useStore((s) => s.createProject);

  // Open/close listener
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === "Escape" && open) {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  // Reset on open + focus
  React.useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIdx(0);
      // small delay so the input has mounted
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const close = () => setOpen(false);

  // ─── Build helpers ───
  const goalById = React.useMemo(
    () => Object.fromEntries(goals.map((g) => [g.id, g])) as Record<string, Goal>,
    [goals],
  );
  const projectById = React.useMemo(
    () => Object.fromEntries(projects.map((p) => [p.id, p])) as Record<string, Project>,
    [projects],
  );

  const goalDot = (g?: Goal) =>
    g ? `--${g.color}` : undefined;

  // Today plan/close state for conditional Quick Actions
  const todayEntry = dayEntries.find((d) => d.date === TODAY_ISO());
  const planAndReview = settings.layers.planAndReview;
  const isPlanned = !!todayEntry?.isPlanned;
  const isClosed = !!todayEntry?.isClosed;

  // ─── Navigation helpers ───
  const goEntity = (kind: RecentKind, id: string, path?: string) => {
    pushRecent(kind, id);
    if (path) navigate(path);
    close();
  };

  const openEditor = (
    kind: "action" | "goal" | "ritual",
    id: string,
    recentKind: RecentKind,
  ) => {
    pushRecent(recentKind, id);
    openPanel({ kind, mode: "edit", id });
    close();
  };

  // ─── Quick actions list ───
  const quickActions: Row[] = React.useMemo(() => {
    const items: Row[] = [];
    if (planAndReview && !isPlanned && !isClosed) {
      items.push({
        key: "qa-plan",
        kind: "quick",
        title: t("commandPalette.quick.planToday"),
        iconChar: "▸",
        onSelect: () => {
          close();
          if (window.location.pathname !== "/today") navigate("/today");
          setTimeout(() => emitAppEvent("open-plan-today"), 50);
        },
      });
    }
    if (planAndReview && isPlanned && !isClosed) {
      items.push({
        key: "qa-close",
        kind: "quick",
        title: t("commandPalette.quick.closeDay"),
        iconChar: "▸",
        onSelect: () => {
          close();
          if (window.location.pathname !== "/today") navigate("/today");
          setTimeout(() => emitAppEvent("open-close-day"), 50);
        },
      });
    }
    items.push(
      {
        key: "qa-new-action",
        kind: "quick",
        title: t("commandPalette.quick.newAction"),
        iconChar: "+",
        rightHint: "⌘N",
        onSelect: () => {
          if (!goals.some((g) => g.status === "active")) {
            navigate("/onboarding/goal"); close(); return;
          }
          openPanel({ kind: "action", mode: "new" });
          close();
        },
      },
      {
        key: "qa-new-project",
        kind: "quick",
        title: t("commandPalette.quick.newProject"),
        iconChar: "+",
        onSelect: () => {
          const goalId =
            goals.find((g) => g.status === "active")?.id ?? goals[0]?.id;
          if (!goalId) {
            toast.error(t("commandPalette.toast.needActiveGoal"));
            close();
            return;
          }
          const id = createProject({ title: "", goalId, isDraft: true });
          navigate(`/projects/${id}`);
          close();
        },
      },
      {
        key: "qa-new-goal",
        kind: "quick",
        title: t("commandPalette.quick.newGoal"),
        iconChar: "+",
        onSelect: () => {
          openPanel({ kind: "goal", mode: "new" });
          close();
        },
      },
      {
        key: "qa-new-ritual",
        kind: "quick",
        title: t("commandPalette.quick.newRitual"),
        iconChar: "+",
        onSelect: () => {
          if (!goals.some((g) => g.status === "active")) {
            navigate("/onboarding/goal"); close(); return;
          }
          openPanel({ kind: "ritual", mode: "new" });
          close();
        },
      },
      {
        key: "qa-capture-idea",
        kind: "quick",
        title: t("commandPalette.quick.captureIdea"),
        iconChar: "✦",
        onSelect: () => {
          close();
          navigate("/ideas");
          setTimeout(() => emitAppEvent("focus-idea-capture"), 50);
        },
      },
    );
    return items;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planAndReview, isPlanned, isClosed]);

  const navRows: Row[] = React.useMemo(() => {
    const rows: Row[] = NAV_ITEMS.map((n) => ({
      key: `nav-${n.path}`,
      kind: "nav" as const,
      title: t("commandPalette.nav.goTo", { label: t(n.labelKey) }),
      rightHint: "→",
      onSelect: () => {
        navigate(n.path);
        close();
      },
    }));
    rows.push({
      key: "nav-settings",
      kind: "nav",
      title: t("commandPalette.nav.settings"),
      rightHint: "→",
      onSelect: () => {
        close();
        emitAppEvent("open-settings");
      },
    });
    return rows;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Default-state sections ───
  const defaultSections: Section[] = React.useMemo(() => {
    const recent = getRecent();
    const recentRows: Row[] = [];
    for (const r of recent) {
      if (r.kind === "goal") {
        const g = goalById[r.id];
        if (!g) continue;
        recentRows.push({
          key: `r-g-${r.id}`,
          kind: "recent",
          title: g.title,
          iconChar: KIND_ICON.goal,
          dotColorVar: goalDot(g),
          meta: t("commandPalette.meta.goal"),
          onSelect: () => goEntity("goal", g.id, `/goals/${g.id}`),
        });
      } else if (r.kind === "project") {
        const p = projectById[r.id];
        if (!p) continue;
        const g = goalById[p.goalId];
        recentRows.push({
          key: `r-p-${r.id}`,
          kind: "recent",
          title: p.title,
          iconChar: KIND_ICON.project,
          dotColorVar: goalDot(g),
          meta: g?.title ?? t("commandPalette.meta.project"),
          onSelect: () => goEntity("project", p.id, `/projects/${p.id}`),
        });
      } else if (r.kind === "action") {
        const a = actions.find((x) => x.id === r.id);
        if (!a) continue;
        const g = goalById[a.goalId];
        const p = a.projectId ? projectById[a.projectId] : undefined;
        recentRows.push({
          key: `r-a-${r.id}`,
          kind: "recent",
          title: a.title,
          iconChar: KIND_ICON.action,
          dotColorVar: goalDot(g),
          meta: [g?.title, p?.title].filter(Boolean).join(" · "),
          onSelect: () => openEditor("action", a.id, "action"),
        });
      } else if (r.kind === "ritual") {
        const rt = rituals.find((x) => x.id === r.id);
        if (!rt) continue;
        const g = goalById[rt.goalId];
        recentRows.push({
          key: `r-rt-${r.id}`,
          kind: "recent",
          title: rt.title,
          iconChar: KIND_ICON.ritual,
          dotColorVar: goalDot(g),
          meta: g?.title ?? t("commandPalette.meta.ritual"),
          onSelect: () => openEditor("ritual", rt.id, "ritual"),
        });
      } else if (r.kind === "idea") {
        const i = ideas.find((x) => x.id === r.id);
        if (!i) continue;
        const g = goalById[i.goalId];
        recentRows.push({
          key: `r-i-${r.id}`,
          kind: "recent",
          title: i.title,
          iconChar: KIND_ICON.idea,
          dotColorVar: goalDot(g),
          meta: g?.title ?? t("commandPalette.meta.idea"),
          onSelect: () => goEntity("idea", i.id, `/ideas?selected=${i.id}`),
        });
      } else if (r.kind === "day") {
        recentRows.push({
          key: `r-d-${r.id}`,
          kind: "recent",
          title: r.id,
          iconChar: KIND_ICON.day,
          meta: t("commandPalette.meta.day"),
          onSelect: () => goEntity("day", r.id, `/reviews/days/${r.id}`),
        });
      }
    }

    const out: Section[] = [];
    if (recentRows.length > 0)
      out.push({ heading: t("commandPalette.section.recentlyViewed"), rows: recentRows });
    if (quickActions.length > 0)
      out.push({ heading: t("commandPalette.section.quickActions"), rows: quickActions });
    out.push({ heading: t("commandPalette.section.navigation"), rows: navRows });
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, quickActions, navRows, goals, projects, actions, rituals, ideas]);

  // ─── Typed-state sections ───
  const typedSections: Section[] = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const goalRows: Row[] = goals
      .filter((g) => g.title.toLowerCase().includes(q))
      .slice(0, 8)
      .map((g) => ({
        key: `g-${g.id}`,
        kind: "goal",
        title: g.title,
        iconChar: KIND_ICON.goal,
        dotColorVar: goalDot(g),
        meta: g.status === "active" ? t("commandPalette.meta.active") : g.status,
        onSelect: () => goEntity("goal", g.id, `/goals/${g.id}`),
      }));

    const projectRows: Row[] = projects
      .filter((p) => !p.isDraft && p.title.toLowerCase().includes(q))
      .slice(0, 12)
      .map((p) => {
        const g = goalById[p.goalId];
        return {
          key: `p-${p.id}`,
          kind: "project",
          title: p.title,
          iconChar: KIND_ICON.project,
          dotColorVar: goalDot(g),
          meta: g?.title ?? "",
          onSelect: () => goEntity("project", p.id, `/projects/${p.id}`),
        };
      });

    const actionRows: Row[] = actions
      .filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          (a.notes ?? "").toLowerCase().includes(q),
      )
      .slice(0, 15)
      .map((a) => {
        const g = goalById[a.goalId];
        const p = a.projectId ? projectById[a.projectId] : undefined;
        return {
          key: `a-${a.id}`,
          kind: "action",
          title: a.title,
          iconChar: KIND_ICON.action,
          dotColorVar: goalDot(g),
          meta: [g?.title, p?.title].filter(Boolean).join(" · "),
          onSelect: () => openEditor("action", a.id, "action"),
        };
      });

    const ritualRows: Row[] = rituals
      .filter((r) => r.title.toLowerCase().includes(q))
      .slice(0, 10)
      .map((r) => {
        const g = goalById[r.goalId];
        return {
          key: `rt-${r.id}`,
          kind: "ritual",
          title: r.title,
          iconChar: KIND_ICON.ritual,
          dotColorVar: goalDot(g),
          meta: g?.title ?? "",
          onSelect: () => openEditor("ritual", r.id, "ritual"),
        };
      });

    const ideaRows: Row[] = ideas
      .filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          (i.note ?? "").toLowerCase().includes(q),
      )
      .slice(0, 10)
      .map((i) => {
        const g = goalById[i.goalId];
        return {
          key: `i-${i.id}`,
          kind: "idea",
          title: i.title,
          iconChar: KIND_ICON.idea,
          dotColorVar: goalDot(g),
          meta: g?.title ?? "",
          onSelect: () => goEntity("idea", i.id, `/ideas?selected=${i.id}`),
        };
      });

    const dayRows: Row[] = (dayEntries as DayEntry[])
      .filter(
        (d) =>
          (d.reflectionText ?? "").toLowerCase().includes(q) ||
          (d.morningIntentNote ?? "").toLowerCase().includes(q) ||
          d.date.includes(q),
      )
      .slice(0, 8)
      .map((d) => {
        const summary =
          d.reflectionText?.slice(0, 60) ??
          d.morningIntentNote?.slice(0, 60) ??
          "";
        return {
          key: `d-${d.date}`,
          kind: "day",
          title: d.date,
          iconChar: KIND_ICON.day,
          meta: [d.dayType, summary].filter(Boolean).join(" · "),
          onSelect: () => goEntity("day", d.date, `/reviews/days/${d.date}`),
        };
      });

    const cmdRows: Row[] = quickActions.filter((r) =>
      r.title.toLowerCase().includes(q),
    );

    const navMatches: Row[] = navRows.filter((r) =>
      r.title.toLowerCase().includes(q),
    );

    const out: Section[] = [];
    if (goalRows.length)
      out.push({ heading: t("commandPalette.section.goals", { count: goalRows.length }), rows: goalRows });
    if (projectRows.length)
      out.push({
        heading: t("commandPalette.section.projects", { count: projectRows.length }),
        rows: projectRows,
      });
    if (actionRows.length)
      out.push({
        heading: t("commandPalette.section.actions", { count: actionRows.length }),
        rows: actionRows,
      });
    if (ritualRows.length)
      out.push({
        heading: t("commandPalette.section.rituals", { count: ritualRows.length }),
        rows: ritualRows,
      });
    if (ideaRows.length)
      out.push({ heading: t("commandPalette.section.ideas", { count: ideaRows.length }), rows: ideaRows });
    if (dayRows.length)
      out.push({ heading: t("commandPalette.section.days", { count: dayRows.length }), rows: dayRows });
    if (cmdRows.length)
      out.push({ heading: t("commandPalette.section.commands", { count: cmdRows.length }), rows: cmdRows });
    if (navMatches.length)
      out.push({
        heading: t("commandPalette.section.navigationCount", { count: navMatches.length }),
        rows: navMatches,
      });
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, goals, projects, actions, rituals, ideas, dayEntries, quickActions, navRows]);

  const sections = query.trim() ? typedSections : defaultSections;
  const flatRows: Row[] = sections.flatMap((s) => s.rows);

  // Reset selectedIdx when row count changes
  React.useEffect(() => {
    setSelectedIdx(0);
  }, [query, sections.length, flatRows.length]);

  // Keyboard nav while open
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIdx((i) => Math.min(i + 1, Math.max(0, flatRows.length - 1)));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIdx((i) => Math.max(0, i - 1));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const row = flatRows[selectedIdx];
        if (row) row.onSelect();
        else if (query.trim()) {
          // Empty results → quick-create action with the query (or route to
          // goal-builder if the user has no goals yet).
          if (!useStore.getState().goals.some((g) => g.status === "active")) {
            navigate("/onboarding/goal");
            close();
            return;
          }
          const id = createAction({ title: query.trim() });
          toast.success(t("commandPalette.toast.actionCreated"));
          openPanel({ kind: "action", mode: "edit", id });
          close();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, flatRows, selectedIdx, query, createAction, openPanel]);

  // Scroll selected row into view
  React.useEffect(() => {
    if (!open || !listRef.current) return;
    const el = listRef.current.querySelector<HTMLElement>(
      `[data-row-idx="${selectedIdx}"]`,
    );
    el?.scrollIntoView({ block: "nearest" });
  }, [selectedIdx, open]);

  if (!open) return null;

  let runningIdx = -1;
  const isMobile =
    typeof window !== "undefined" && window.innerWidth < 768;

  return (
    <div
      className="fixed inset-0 z-[100] flex justify-center"
      style={{
        background: "var(--backdrop)",
        paddingTop: isMobile ? "5vh" : "12vh",
        paddingLeft: isMobile ? "8px" : "16px",
        paddingRight: isMobile ? "8px" : "16px",
      }}
      onClick={close}
      role="dialog"
      aria-modal="true"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: isMobile ? "100%" : 640,
          maxHeight: isMobile ? "85vh" : "calc(100vh - 24vh)",
          background: "hsl(var(--surface-elevated))",
          border: "1px solid hsl(var(--border-subtle))",
          borderRadius: 6,
          boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Search input */}
        <div
          style={{
            height: 56,
            padding: "0 16px",
            display: "flex",
            alignItems: "center",
            gap: 16,
            borderBottom: "1px solid hsl(var(--border-subtle))",
          }}
        >
          <span
            style={{
              fontSize: 16,
              color: "hsl(var(--text-tertiary))",
              width: 16,
              textAlign: "center",
            }}
          >
            ⌕
          </span>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("commandPalette.searchPlaceholder")}
            className="flex-1 bg-transparent outline-none text-text-primary placeholder:text-text-tertiary"
            style={{ fontSize: 16, fontFamily: "inherit" }}
          />
          <span
            className="font-mono"
            style={{
              fontSize: 11,
              color: "hsl(var(--text-tertiary))",
              background: "hsl(var(--surface-hover))",
              padding: "2px 6px",
              borderRadius: 3,
            }}
          >
            ⌘K
          </span>
          {isMobile && (
            <button
              onClick={close}
              className="text-text-tertiary hover:text-text-primary"
              aria-label={t("commandPalette.closeAria")}
              style={{ fontSize: 18, lineHeight: 1, padding: 4 }}
            >
              ×
            </button>
          )}
        </div>

        {/* Results */}
        <div
          ref={listRef}
          style={{
            maxHeight: isMobile ? "60vh" : 400,
            overflowY: "auto",
            padding: "8px 0",
          }}
        >
          {sections.length === 0 && query.trim() ? (
            <div style={{ padding: "32px 16px", textAlign: "center" }}>
              <div
                className="text-text-secondary"
                style={{ fontSize: 13, marginBottom: 8 }}
              >
                {t("commandPalette.empty.heading", { query: query.trim() })}
              </div>
              <div
                className="font-mono text-text-tertiary"
                style={{ fontSize: 11 }}
              >
                {t("commandPalette.empty.hint")}
              </div>
            </div>
          ) : (
            sections.map((sec) => (
              <div key={sec.heading}>
                <div
                  className="font-mono"
                  style={{
                    padding: "12px 16px 4px",
                    fontSize: 10,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    color: "hsl(var(--text-tertiary))",
                  }}
                >
                  {sec.heading}
                </div>
                {sec.rows.map((row) => {
                  runningIdx += 1;
                  const idx = runningIdx;
                  const selected = idx === selectedIdx;
                  return (
                    <div
                      key={row.key}
                      data-row-idx={idx}
                      onMouseEnter={() => setSelectedIdx(idx)}
                      onClick={() => row.onSelect()}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "8px 16px",
                        cursor: "pointer",
                        background: selected
                          ? "hsl(var(--surface-hover))"
                          : "transparent",
                      }}
                    >
                      {row.dotColorVar ? (
                        <span
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            background: `hsl(var(${row.dotColorVar}))`,
                            flexShrink: 0,
                          }}
                        />
                      ) : row.iconChar ? (
                        <span
                          className="font-mono"
                          style={{
                            width: 16,
                            textAlign: "center",
                            fontSize: 12,
                            color: "hsl(var(--text-tertiary))",
                            flexShrink: 0,
                          }}
                        >
                          {row.iconChar}
                        </span>
                      ) : (
                        <span style={{ width: 16, flexShrink: 0 }} />
                      )}
                      <span
                        className="text-text-primary truncate"
                        style={{ fontSize: 14, flex: 1 }}
                      >
                        {row.title}
                      </span>
                      {row.meta && (
                        <span
                          className="font-mono text-text-tertiary truncate"
                          style={{
                            fontSize: 11,
                            maxWidth: 240,
                            textAlign: "right",
                          }}
                        >
                          {row.meta}
                        </span>
                      )}
                      {row.rightHint && (
                        <span
                          className="font-mono text-text-tertiary"
                          style={{ fontSize: 11, marginLeft: 8 }}
                        >
                          {row.rightHint}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
