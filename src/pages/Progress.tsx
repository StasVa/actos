import React from "react";
import { Link } from "react-router-dom";
import { FolderOpen, Target } from "lucide-react";
import { useStore } from "@/store/useStore";
import { AppSidebar } from "@/components/AppSidebar";
import { SettingsPanel } from "@/components/SettingsPanel";
import { TimeInvestmentSection } from "@/components/TimeInvestmentSection";
import { ReturnDatePill } from "@/components/ReturnDatePill";
import { timeInvestedMinutes, formatHM } from "@/lib/timeStats";
import type { Action, Goal, Project } from "@/types";
import {
  Hero,
  ActiveProjects,
  SectionLabel,
} from "./Index";

function fmtAgo(iso?: string): string {
  if (!iso) return "—";
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const MS_DAY = 86400000;

/* ===== Recently Closed Projects & Goals ===== */
const RecentlyClosedHigherSection: React.FC = () => {
  const projects = useStore((s) => s.projects);
  const goals = useStore((s) => s.goals);
  const actions = useStore((s) => s.actions);

  type Row = {
    kind: "project" | "goal";
    id: string;
    title: string;
    goal: Goal | undefined;
    closureIso: string;
    isDropped: boolean;
    countLabel: string; // "N actions" or "N projects"
    valueAdded: number;
    timeInvestedMin: number;
  };

  const cutoff = Date.now() - 30 * MS_DAY;
  const rows: Row[] = [];

  for (const p of projects) {
    if (p.isDraft) continue;
    if (p.status !== "completed" && p.status !== "dropped") continue;
    const stamp = p.completedAt ?? p.droppedAt;
    if (!stamp || new Date(stamp).getTime() < cutoff) continue;
    const projActions = actions.filter((a) => a.projectId === p.id);
    const doneActs = projActions.filter((a) => a.status === "done" || a.status === "delegated");
    const valueAdded = doneActs.reduce((s, a) => s + (a.impact ?? 0), 0);
    const timeMin = doneActs.reduce((s, a) => s + timeInvestedMinutes(a), 0);
    rows.push({
      kind: "project",
      id: p.id,
      title: p.title,
      goal: goals.find((g) => g.id === p.goalId),
      closureIso: stamp,
      isDropped: p.status === "dropped",
      countLabel: `${doneActs.length} action${doneActs.length === 1 ? "" : "s"} done`,
      valueAdded,
      timeInvestedMin: timeMin,
    });
  }

  for (const g of goals) {
    if (g.status !== "completed" && g.status !== "dropped") continue;
    const stamp = g.completedAt ?? g.droppedAt;
    if (!stamp || new Date(stamp).getTime() < cutoff) continue;
    const goalProjects = projects.filter((p) => p.goalId === g.id && !p.isDraft);
    const goalActions = actions.filter(
      (a) => a.goalId === g.id && (a.status === "done" || a.status === "delegated"),
    );
    const valueAdded = goalActions.reduce((s, a) => s + (a.impact ?? 0), 0);
    const timeMin = goalActions.reduce((s, a) => s + timeInvestedMinutes(a), 0);
    rows.push({
      kind: "goal",
      id: g.id,
      title: g.title,
      goal: g,
      closureIso: stamp,
      isDropped: g.status === "dropped",
      countLabel: `${goalProjects.length} project${goalProjects.length === 1 ? "" : "s"}`,
      valueAdded,
      timeInvestedMin: timeMin,
    });
  }

  rows.sort((a, b) => b.closureIso.localeCompare(a.closureIso));

  if (rows.length === 0) return null;

  const projCount = rows.filter((r) => r.kind === "project").length;
  const goalCount = rows.filter((r) => r.kind === "goal").length;
  const metaParts: string[] = [];
  if (projCount > 0) metaParts.push(`${projCount} project${projCount === 1 ? "" : "s"}`);
  if (goalCount > 0) metaParts.push(`${goalCount} goal${goalCount === 1 ? "" : "s"}`);

  const visible = rows.slice(0, 8);
  const remaining = rows.length - visible.length;

  return (
    <section>
      <SectionLabel meta={metaParts.join(" · ").toUpperCase()}>
        Recently closed · {rows.length}
      </SectionLabel>
      <div className="bg-surface-elevated border border-border-subtle rounded-[6px] overflow-hidden">
        {visible.map((r, i) => {
          const color = r.goal ? `hsl(var(--${r.goal.color}))` : "hsl(var(--text-tertiary))";
          const Icon = r.kind === "project" ? FolderOpen : Target;
          const href = r.kind === "project" ? `/projects/${r.id}` : `/goals/${r.id}`;
          return (
            <Link
              key={`${r.kind}-${r.id}`}
              to={href}
              className={`relative flex items-stretch hover:bg-surface-hover transition-colors ${
                i < visible.length - 1 ? "border-b border-border-subtle" : ""
              }`}
              style={{ minHeight: 56 }}
            >
              <span
                className="absolute left-0 top-0 bottom-0"
                style={{ background: color, width: 3 }}
              />
              <div
                className="flex flex-col gap-1 py-3 pr-4 w-full min-w-0"
                style={{ paddingLeft: 19 }}
              >
                {/* Top line */}
                <div className="flex items-center justify-between gap-3 min-w-0">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {r.kind === "project" && r.goal && (
                      <>
                        <span
                          className="inline-block rounded-full shrink-0"
                          style={{ width: 8, height: 8, background: color }}
                        />
                        <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-tertiary truncate">
                          {r.goal.title}
                        </span>
                        <span className="font-mono text-[11px] text-text-tertiary">·</span>
                      </>
                    )}
                    <span className="text-[14px] font-medium text-text-primary truncate">
                      {r.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className="font-mono uppercase tracking-[0.06em] text-text-secondary"
                      style={{
                        fontSize: 11,
                        padding: "2px 8px",
                        borderRadius: 2,
                        background: "hsl(var(--surface-hover))",
                      }}
                    >
                      [{r.isDropped ? "DROPPED" : "COMPLETED"}]
                    </span>
                    <span className="font-mono text-[11px] text-text-tertiary tabular-nums whitespace-nowrap">
                      {fmtAgo(r.closureIso)}
                    </span>
                  </div>
                </div>
                {/* Bottom line */}
                <div className="flex items-center gap-1.5 font-mono text-[12px] text-text-secondary tabular-nums truncate">
                  <Icon size={12} className="text-text-tertiary shrink-0" />
                  <span className="text-text-primary">{r.countLabel.split(" ")[0]}</span>
                  <span> {r.countLabel.split(" ").slice(1).join(" ")}</span>
                  <span className="mx-1.5 text-text-tertiary">·</span>
                  <span className="text-text-primary">+{r.valueAdded}</span>
                  <span> value</span>
                  <span className="mx-1.5 text-text-tertiary">·</span>
                  <span className="text-text-primary">{formatHM(r.timeInvestedMin)}</span>
                  <span> invested</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
      {remaining > 0 && (
        <div className="mt-2 px-1 font-mono text-[11px] text-text-tertiary">
          + {remaining} more
        </div>
      )}
      <Link
        to="/projects"
        className="inline-block mt-3 text-[13px] text-accent hover:text-accent-hover"
      >
        {goalCount > 0 ? "View all closed →" : "View all closed projects →"}
      </Link>
    </section>
  );
};

/* ===== Recently Closed Actions (enriched ActionRow-style) ===== */
const RecentlyClosedActionsSection: React.FC = () => {
  const actions = useStore((s) => s.actions);
  const goals = useStore((s) => s.goals);
  const projects = useStore((s) => s.projects);
  const openPanel = useStore((s) => s.openPanel);

  type Row = {
    action: Action;
    goal: Goal | undefined;
    project: Project | undefined;
    closureIso: string;
    kind: "done" | "delegated" | "dropped" | "cancelled";
  };

  const rows: Row[] = [];
  for (const a of actions) {
    let stamp: string | undefined;
    let kind: Row["kind"] | null = null;
    if (a.status === "done" && a.completedAt) {
      stamp = a.completedAt;
      kind = "done";
    } else if (a.status === "delegated" && a.delegatedAt) {
      stamp = a.delegatedAt;
      kind = "delegated";
    } else if (a.status === "dropped" && a.droppedAt) {
      stamp = a.droppedAt;
      kind = "dropped";
    } else if (a.status === "cancelled" && a.cancelledAt) {
      stamp = a.cancelledAt;
      kind = "cancelled";
    }
    if (!stamp || !kind) continue;
    rows.push({
      action: a,
      goal: goals.find((g) => g.id === a.goalId),
      project: a.projectId ? projects.find((p) => p.id === a.projectId) : undefined,
      closureIso: stamp,
      kind,
    });
  }
  rows.sort((a, b) => b.closureIso.localeCompare(a.closureIso));
  const top = rows.slice(0, 10);

  return (
    <section>
      <SectionLabel>Recently closed</SectionLabel>
      {top.length === 0 ? (
        <div className="font-mono text-[11px] text-text-tertiary px-3 py-2">
          Nothing closed yet.
        </div>
      ) : (
        <div className="bg-surface-elevated border border-border-subtle rounded-[6px] overflow-hidden">
          {top.map((r, i) => {
            const a = r.action;
            const color = r.goal
              ? `hsl(var(--${r.goal.color}))`
              : "hsl(var(--text-tertiary))";
            const isTerminal = r.kind === "dropped" || r.kind === "cancelled";
            const showValuePill = r.kind === "done" || r.kind === "delegated";
            const timeMin =
              r.kind === "delegated"
                ? Math.round((a.timeEstimateMinutes ?? 0) * 0.2)
                : a.timeEstimateMinutes ?? 0;

            const breadcrumb: string[] = [];
            if (r.goal) breadcrumb.push(r.goal.title);
            if (r.project) breadcrumb.push(r.project.title);

            return (
              <button
                key={a.id}
                onClick={() => openPanel({ kind: "action", mode: "edit", id: a.id })}
                className={`relative flex items-stretch w-full text-left hover:bg-surface-hover transition-colors ${
                  i < top.length - 1 ? "border-b border-border-subtle" : ""
                }`}
                style={{ minHeight: 56 }}
              >
                <span
                  className="absolute left-0 top-0 bottom-0"
                  style={{ background: color, width: 3 }}
                />
                <div
                  className="flex flex-col gap-1 py-3 pr-4 w-full min-w-0"
                  style={{ paddingLeft: 19 }}
                >
                  {/* Top line */}
                  <div className="flex items-center justify-between gap-3 min-w-0">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {r.kind === "done" && (
                        <span
                          className="font-mono text-[12px] shrink-0"
                          style={{ color: "hsl(var(--state-active))" }}
                        >
                          ✓
                        </span>
                      )}
                      {r.kind === "delegated" && (
                        <span
                          className="font-mono text-[12px] shrink-0"
                          style={{ color: "hsl(var(--accent))" }}
                        >
                          →
                        </span>
                      )}
                      {isTerminal && (
                        <span
                          className="font-mono text-[12px] shrink-0"
                          style={{ color: "hsl(var(--text-warning))" }}
                        >
                          ⊘
                        </span>
                      )}
                      <span
                        className={`text-[14px] font-medium truncate ${
                          isTerminal
                            ? "text-text-secondary line-through"
                            : "text-text-primary"
                        }`}
                      >
                        {a.title}
                      </span>
                      {r.kind === "delegated" && a.delegateName && (
                        <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-tertiary truncate">
                          {a.delegateName}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {showValuePill && (a.impact ?? 0) > 0 && (
                        <span
                          className="inline-flex items-center font-mono tabular-nums font-medium"
                          style={{
                            fontSize: 12,
                            padding: "3px 10px",
                            borderRadius: 4,
                            background: r.goal
                              ? `hsl(var(--${r.goal.color}) / 0.15)`
                              : "hsl(var(--surface-hover))",
                            color,
                          }}
                        >
                          +{a.impact}
                        </span>
                      )}
                      {timeMin > 0 && (
                        <span className="font-mono text-[12px] tabular-nums text-text-secondary whitespace-nowrap">
                          {formatHM(timeMin)}
                        </span>
                      )}
                      <span className="font-mono text-[11px] text-text-tertiary tabular-nums whitespace-nowrap">
                        {fmtAgo(r.closureIso)}
                      </span>
                    </div>
                  </div>
                  {/* Bottom line */}
                  {breadcrumb.length > 0 && (
                    <div className="font-mono text-[12px] text-text-secondary truncate">
                      {breadcrumb.map((b, j) => (
                        <React.Fragment key={j}>
                          {j > 0 && <span className="mx-1.5 text-text-tertiary">·</span>}
                          {b}
                        </React.Fragment>
                      ))}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
      <Link
        to="/actions"
        className="inline-block mt-3 text-[13px] text-accent hover:text-accent-hover"
      >
        View all actions →
      </Link>
    </section>
  );
};

const DelegatedSection: React.FC = () => {
  const actions = useStore((s) => s.actions);
  const openPanel = useStore((s) => s.openPanel);
  const items = actions.filter((a) => a.status === "delegated");

  const TODAY_ISO = "2026-05-05";
  const todayMs = new Date(TODAY_ISO + "T00:00:00.000Z").getTime();
  let overdue = 0;
  let dueToday = 0;
  for (const a of items) {
    if (!a.expectedReturnDate) continue;
    const d = Math.round(
      (new Date(a.expectedReturnDate + "T00:00:00.000Z").getTime() - todayMs) / 86400000,
    );
    if (d < 0) overdue++;
    else if (d === 0) dueToday++;
  }
  const meta = `${items.length} ACTIVE · ${overdue} OVERDUE · ${dueToday} DUE TODAY`;

  return (
    <section>
      <SectionLabel meta={meta}>Delegated · {items.length}</SectionLabel>
      {items.length === 0 ? (
        <div className="font-mono text-[11px] text-text-tertiary px-3 py-2">No active delegations.</div>
      ) : (
        <div className="space-y-1 bg-surface-elevated border border-border-subtle rounded-[6px] p-3">
          {items.map((a) => (
            <button
              key={a.id}
              onClick={() => openPanel({ kind: "action", mode: "edit", id: a.id })}
              className="w-full flex items-center gap-3 px-2 py-1.5 rounded-[3px] hover:bg-surface-hover transition-colors text-left"
            >
              <span className="text-[13px] text-text-primary truncate">{a.title}</span>
              {a.delegateName && (
                <span className="font-mono text-[11px] text-text-tertiary truncate">· → {a.delegateName}</span>
              )}
              <div className="flex-1" />
              <ReturnDatePill expectedReturnDate={a.expectedReturnDate} />
            </button>
          ))}
        </div>
      )}
      <Link to="/delegated" className="inline-block mt-3 text-[13px] text-accent hover:text-accent-hover">
        View all delegated →
      </Link>
    </section>
  );
};

const Progress: React.FC = () => {
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const goals = useStore((s) => s.goals);
  const projects = useStore((s) => s.projects);
  const actions = useStore((s) => s.actions);

  const activeGoals = goals.filter((g) => g.status === "active").length;
  const activeProjects = projects.filter((p) => p.status === "active").length;
  const actionsDone = actions.filter((a) => a.status === "done").length;

  return (
    <div className="min-h-screen bg-surface-base text-text-primary">
      <AppSidebar onOpenSettings={() => setSettingsOpen(true)} />
      <SettingsPanel open={settingsOpen} onOpenChange={setSettingsOpen} />
      <main className="app-main page-wide">
        <PageHeader
          title="Progress"
          meta={`${activeGoals} GOALS · ${activeProjects} ACTIVE PROJECTS · ${actionsDone} ACTIONS DONE ALL-TIME`}
        />
        <div style={{ height: 24 }} />

        <Hero />
        <div className="h-10" />
        <TimeInvestmentSection />
        <div className="h-10" />
        <RecentlyClosedHigherSection />
        <div className="h-10" />
        <RecentlyClosedActionsSection />
        <div className="h-10" />
        <DelegatedSection />
        <div className="h-10" />
        <ActiveProjects />
        <div className="h-12" />
      </main>
    </div>
  );
};

export default Progress;
