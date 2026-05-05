import React, { useMemo, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { LifetimeCounters } from "@/components/LifetimeCounters";
import { Tooltip, StateDotTooltip } from "@/components/Tooltip";
import { useStore, selectors } from "@/store/useStore";
import type { Action, Goal, Project, Ritual, GoalColorVar } from "@/types";

const COLOR_VAR: Record<GoalColorVar, string> = {
  "goal-1": "hsl(var(--goal-1))",
  "goal-2": "hsl(var(--goal-2))",
  "goal-3": "hsl(var(--goal-3))",
};

const NAV: { label: string; href: string }[] = [
  { label: "Home", href: "/" },
  { label: "Weekly", href: "#" },
  { label: "Ideas", href: "/ideas" },
  { label: "Rituals", href: "/rituals" },
  { label: "All actions", href: "/all-actions" },
  { label: "All projects", href: "/all-projects" },
  { label: "All delegated", href: "/all-delegated" },
];

const Sidebar: React.FC = () => (
  <aside className="fixed left-0 top-0 bottom-0 w-[220px] bg-surface-raised border-r border-border-subtle p-4 flex flex-col">
    <Link to="/" className="px-1 py-1 text-[17px] font-semibold text-text-primary tracking-tight">
      ActOS
    </Link>
    <nav className="mt-8 flex flex-col gap-1">
      {NAV.map((item) => (
        <Link
          key={item.label}
          to={item.href}
          className="px-2.5 py-1.5 rounded-[4px] text-[13px] text-text-secondary font-normal hover:text-text-primary transition-colors"
        >
          {item.label}
        </Link>
      ))}
    </nav>
    <div className="flex-1" />
    <div className="font-mono text-[11px] text-text-tertiary px-1">⌘K  Quick add</div>
    <div className="mt-4 font-mono text-[11px] text-text-secondary px-1 leading-[1.7]">
      <LifetimeCounters />
    </div>
    <div className="mt-3 flex items-center gap-2 p-1 rounded-[4px] hover:bg-surface-hover cursor-pointer">
      <span className="w-7 h-7 rounded-full bg-surface-hover flex items-center justify-center font-mono text-[11px] text-text-primary">
        AK
      </span>
      <span className="font-mono text-[11px] text-text-secondary truncate">ak@email</span>
    </div>
  </aside>
);

const SectionHeader: React.FC<{ children: React.ReactNode; meta?: React.ReactNode }> = ({ children, meta }) => (
  <div className="flex items-center justify-between mb-3">
    <h2 className="text-[12px] font-medium uppercase tracking-[0.08em] text-text-secondary">{children}</h2>
    {meta && <div className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-tertiary">{meta}</div>}
  </div>
);

const GhostAddButton: React.FC<{ children: React.ReactNode; onClick?: () => void }> = ({ children, onClick }) => (
  <button
    onClick={onClick}
    className="block w-full h-9 px-4 py-2 mt-4 text-[13px] text-text-secondary text-center bg-transparent border border-dashed border-border-default rounded-[4px] cursor-pointer transition-[border-color,color] duration-100 hover:border-solid hover:border-accent-muted hover:text-text-primary"
  >
    {children}
  </button>
);

/* ===== Success Criteria ===== */
const SuccessCriteria: React.FC<{ goal: Goal }> = ({ goal }) => {
  const updateGoal = useStore((s) => s.updateGoal);
  const criteria = goal.successCriteria ?? [];
  const met = criteria.filter((c) => c.done).length;
  const toggle = (cid: string) => {
    updateGoal(goal.id, {
      successCriteria: criteria.map((c) => (c.id === cid ? { ...c, done: !c.done } : c)),
    });
  };
  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[12px] font-medium uppercase tracking-[0.08em] text-text-secondary">Success criteria</h2>
        <div className="font-mono text-[11px] tabular-nums text-text-tertiary">
          {met} of {criteria.length} met
        </div>
      </div>
      {criteria.length === 0 ? (
        <div className="font-mono text-[11px] text-text-tertiary">No criteria defined.</div>
      ) : (
        <div>
          {criteria.map((c) => (
            <div
              key={c.id}
              onClick={() => toggle(c.id)}
              className="flex items-center gap-3 h-7 px-2 -mx-2 rounded-[2px] hover:bg-surface-hover transition-colors cursor-pointer"
            >
              <span
                className="inline-flex items-center justify-center w-4 h-4 rounded-[2px] border shrink-0"
                style={{
                  borderColor: c.done ? "hsl(var(--accent))" : "hsl(var(--text-tertiary))",
                  background: c.done ? "hsl(var(--accent))" : "transparent",
                }}
              >
                {c.done && <span className="text-text-primary text-[10px] leading-none">✓</span>}
              </span>
              <span
                className={`text-[13px] ${c.done ? "text-text-secondary line-through" : "text-text-primary"}`}
              >
                {c.text}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

/* ===== Hero state ===== */
const Pillar: React.FC<{ label: string; value: string; sub: string }> = ({ label, value, sub }) => (
  <div className="flex flex-col">
    <div className="font-mono text-[10px] uppercase tracking-[0.06em] text-text-tertiary">{label}</div>
    <div className="font-mono text-[24px] text-text-primary leading-tight mt-1">{value}</div>
    <div className="font-mono text-[11px] text-text-secondary mt-0.5">{sub}</div>
  </div>
);

const StateRow: React.FC<{
  label: string;
  value: React.ReactNode;
  pct: number;
  color: string;
  opacity?: number;
  isLast?: boolean;
}> = ({ label, value, pct, color, opacity = 1, isLast }) => (
  <div
    className={`h-8 flex items-center gap-4 py-1.5 ${isLast ? "" : "border-b border-border-subtle"}`}
  >
    <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-text-tertiary w-[70px] shrink-0">
      {label}
    </span>
    <span className="flex-1 min-w-0">{value}</span>
    <div className="w-[80px] h-[5px] bg-surface-hover rounded-[2px] overflow-hidden shrink-0">
      <div className="h-full rounded-[2px]" style={{ width: `${pct}%`, background: color, opacity }} />
    </div>
  </div>
);

const HeroState: React.FC<{
  goal: Goal;
  projects: Project[];
  rituals: Ritual[];
  actions: Action[];
}> = ({ goal, projects, rituals, actions }) => {
  const color = COLOR_VAR[goal.color];
  const progress = useStore((s) => selectors.goalProgress(s, goal.id));
  const projectsClosed = projects.filter((p) => p.status === "completed").length;
  const projectsActive = projects.filter((p) => p.status === "active").length;
  const projectsTotal = projects.length;
  const criteria = goal.successCriteria ?? [];
  const criteriaMet = criteria.filter((c) => c.done).length;
  const ritualMultText =
    rituals.length === 0
      ? "no rituals"
      : `×${(
          rituals.reduce((acc, r) => acc + (r.totalCompletions >= 3 ? 1 : 0), 0) > 0
            ? 1.1
            : 1.0
        ).toFixed(2)} multiplier`;

  // Time estimate aggregate
  const totalMinutes = actions
    .filter((a) => a.status !== "dropped" && a.status !== "cancelled")
    .reduce((s, a) => s + (a.timeEstimateMinutes ?? 0), 0);
  const doneMinutes = actions
    .filter((a) => a.status === "done")
    .reduce((s, a) => s + (a.timeEstimateMinutes ?? 0), 0);
  const fmtH = (m: number) => `${Math.round(m / 60)}h`;

  // Last activity
  const lastTs = actions
    .map((a) => a.completedAt ?? a.delegatedAt ?? a.updatedAt ?? a.createdAt)
    .filter(Boolean)
    .sort()
    .reverse()[0];
  const lastLabel = lastTs ? fmtAgo(lastTs) : "—";

  const actionsDone = actions.filter((a) => a.status === "done").length;
  const ageMonths = Math.max(
    1,
    Math.round((Date.now() - new Date(goal.createdAt).getTime()) / (1000 * 60 * 60 * 24 * 30)),
  );

  return (
    <div className="bg-surface-elevated border border-border-subtle rounded-[8px] p-8">
      <div className="flex justify-between items-start gap-8">
        <div>
          <div className="font-mono text-[56px] font-medium text-text-primary tabular-nums leading-none">
            {progress.outcome}%
          </div>
          <div className="mt-3 text-[13px] uppercase tracking-[0.08em] text-text-tertiary">
            PROGRESS · OUTCOME
          </div>
          <div className="mt-1 text-[12px] text-text-secondary">
            {actionsDone} actions done · {projectsClosed} of {projectsTotal} projects closed · Active{" "}
            {ageMonths} {ageMonths === 1 ? "month" : "months"}
          </div>
        </div>
        <div className="flex gap-6 shrink-0">
          <Pillar
            label="PROJECTS"
            value={`${projectsClosed}/${projectsTotal}`}
            sub={`closed · ${projectsActive} active`}
          />
          <Pillar
            label="RITUALS"
            value={`${rituals.length}`}
            sub={`active · ${ritualMultText}`}
          />
          <Pillar
            label="CRITERIA"
            value={`${criteriaMet}/${criteria.length}`}
            sub="criteria met"
          />
        </div>
      </div>

      <div className="mt-8">
        <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-text-tertiary mb-2">STATE</div>
        <div>
          <StateRow
            label="OUTCOME"
            value={<span className="font-mono text-[14px] text-text-primary tabular-nums">{progress.outcome}%</span>}
            pct={progress.outcome}
            color={color}
          />
          <StateRow
            label="EFFORT"
            value={<span className="font-mono text-[14px] text-text-primary tabular-nums">{progress.effort}%</span>}
            pct={progress.effort}
            color={color}
            opacity={0.6}
          />
          <StateRow
            label="TIME"
            value={
              <span className="font-mono tabular-nums">
                <span className="text-[14px] text-text-primary">{fmtH(doneMinutes)}</span>
                <span className="text-text-tertiary"> / </span>
                <span className="text-[12px] text-text-secondary">{fmtH(totalMinutes)}</span>
              </span>
            }
            pct={totalMinutes > 0 ? Math.round((doneMinutes / totalMinutes) * 100) : 0}
            color={color}
            isLast
          />
        </div>
        <div className="mt-2 font-mono text-[11px] text-text-tertiary">
          Effort discounts delegated work to 20%.
        </div>
      </div>

      <div className="mt-4 font-mono text-[12px] text-text-secondary">
        Last activity {lastLabel} · {actionsDone} actions done overall
      </div>
    </div>
  );
};

function fmtAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/* ===== Project card ===== */
const ProjectCard: React.FC<{ p: Project; color: string; goalLabel: string }> = ({
  p,
  color,
  goalLabel,
}) => {
  const progress = useStore((s) => selectors.projectProgress(s, p.id));
  const state = useStore((s) => selectors.stateIndicator(s, "project", p.id));
  const counts = useStore((s) => {
    const acts = s.actions.filter(
      (a) => a.projectId === p.id && a.status !== "dropped" && a.status !== "cancelled",
    );
    return { done: acts.filter((a) => a.status === "done").length, total: acts.length };
  });
  const lastTs = useStore((s) => {
    const acts = s.actions.filter((a) => a.projectId === p.id);
    return acts
      .map((a) => a.completedAt ?? a.delegatedAt ?? a.updatedAt ?? a.createdAt)
      .filter(Boolean)
      .sort()
      .reverse()[0];
  });
  const last = lastTs ? fmtAgo(lastTs) : "—";
  const warnLast = lastTs ? Date.now() - new Date(lastTs).getTime() > 7 * 86400000 : false;

  return (
    <Link to={`/projects/${p.id}`} className="block">
      <div className="group h-[120px] p-3 flex flex-col gap-2 rounded-[6px] bg-surface-raised border border-border-subtle hover:bg-surface-hover hover:border-accent cursor-pointer transition-colors duration-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
            <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-text-tertiary truncate">
              {goalLabel}
            </span>
          </div>
          <Tooltip content={<StateDotTooltip state={state} lastActivity={last} stalledFor={last} />}>
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ background: state === "active" ? "hsl(var(--state-active))" : "hsl(var(--state-stalled))" }}
            />
          </Tooltip>
        </div>
        <div
          className="flex-1 text-[15px] font-medium text-text-primary leading-[1.3] overflow-hidden"
          style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}
        >
          {p.title}
        </div>
        <div className="h-1 w-full bg-surface-hover rounded-[2px] overflow-hidden">
          <div className="h-full rounded-[2px]" style={{ width: `${progress.outcome}%`, background: color }} />
        </div>
        <div className="flex items-center justify-between font-mono text-[11px] tabular-nums">
          <div>
            <span className="text-text-primary">
              {counts.done}/{counts.total}
            </span>
            <span className="text-text-tertiary"> actions</span>
          </div>
          <div className="text-text-secondary">
            Last: <span className={warnLast ? "text-text-warning" : "text-text-secondary"}>{last}</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

/* ===== Ritual row ===== */
const RitualRow: React.FC<{ r: Ritual; color: string; onOpen: () => void }> = ({ r, color, onOpen }) => {
  const mult = useStore((s) => selectors.ritualMultiplier(s, r.id));
  const lastDays = r.completionHistory.slice(-12).map(() => 1);
  while (lastDays.length < 12) lastDays.unshift(0);
  return (
    <div
      onClick={onOpen}
      role="button"
      tabIndex={0}
      className="bg-surface-raised border border-border-subtle rounded-[6px] p-4 flex items-center gap-6 cursor-pointer hover:bg-surface-hover transition-colors"
    >
      <span className="w-3 h-3 rounded-full shrink-0" style={{ background: color }} />
      <div>
        <div className="text-[14px] font-medium text-text-primary">{r.title}</div>
        <div className="mt-0.5 font-mono text-[11px] uppercase tracking-[0.06em] text-text-secondary">
          {r.schedule}
        </div>
      </div>
      <div className="flex-1" />
      <div className="flex flex-col items-end">
        <div className="font-mono text-[18px] text-text-primary">×{mult.toFixed(2)}</div>
        <div className="font-mono text-[11px] text-text-tertiary">{r.totalCompletions} completions</div>
      </div>
      <div className="flex gap-[2px]">
        {lastDays.map((v, i) => (
          <span
            key={i}
            className="w-2 h-2"
            style={{ background: v ? color : "hsl(var(--surface-hover))" }}
          />
        ))}
      </div>
    </div>
  );
};

/* ===== Recent activity ===== */
const RecentActivity: React.FC<{ actions: Action[] }> = ({ actions }) => {
  const events = useMemo(() => {
    const items = actions
      .filter(
        (a) =>
          a.status === "done" ||
          a.status === "delegated" ||
          a.status === "dropped" ||
          a.status === "cancelled",
      )
      .map((a) => {
        const at =
          a.completedAt ?? a.delegatedAt ?? a.droppedAt ?? a.cancelledAt ?? a.updatedAt ?? a.createdAt;
        return { a, at };
      })
      .sort((x, y) => (y.at ?? "").localeCompare(x.at ?? ""))
      .slice(0, 10);
    return items;
  }, [actions]);

  if (events.length === 0) {
    return (
      <section>
        <SectionHeader>Recent activity · 0</SectionHeader>
        <div className="font-mono text-[11px] text-text-tertiary">No completed actions yet.</div>
      </section>
    );
  }

  return (
    <section>
      <SectionHeader>Recent activity · {events.length}</SectionHeader>
      <div>
        {events.map(({ a, at }) => (
          <div
            key={a.id}
            className="flex items-center gap-3 h-8 py-1 border-b border-border-subtle last:border-b-0"
          >
            <span
              className="text-[12px] w-3 text-center"
              style={{
                color:
                  a.status === "done"
                    ? "hsl(var(--status-done))"
                    : a.status === "delegated"
                    ? "hsl(var(--status-delegated))"
                    : "hsl(var(--text-secondary))",
              }}
            >
              {a.status === "done" ? "✓" : a.status === "delegated" ? "→" : "■"}
            </span>
            <span className="text-[13px] text-text-primary">{a.title}</span>
            <div className="flex-1" />
            <span className="font-mono text-[11px] text-text-tertiary">{fmtAgo(at!)}</span>
          </div>
        ))}
      </div>
    </section>
  );
};

/* ===== Ideas ===== */
const IdeasSection: React.FC<{ goalId: string }> = ({ goalId }) => {
  const [open, setOpen] = useState(true);
  const ideas = useStore((s) => s.ideas.filter((i) => i.goalId === goalId && i.status === "captured"));
  const captureIdea = useStore((s) => s.captureIdea);
  const [text, setText] = useState("");
  const submit = () => {
    if (!text.trim()) return;
    captureIdea({ title: text.trim(), goalId });
    setText("");
  };
  return (
    <section>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-[12px] font-medium uppercase tracking-[0.08em] text-text-tertiary hover:text-text-secondary transition-colors cursor-pointer"
      >
        <span className="inline-block w-3">{open ? "▾" : "▸"}</span>
        Ideas · {ideas.length} captured
      </button>
      {open && (
        <div className="mt-3">
          <div className="flex items-center gap-2 bg-surface-raised border border-border-subtle rounded-[4px] px-3 py-2.5">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="Capture an idea..."
              className="flex-1 bg-transparent outline-none text-[13px] text-text-primary placeholder:text-text-tertiary"
            />
          </div>
          <div className="mt-3">
            {ideas.map((idea) => (
              <div
                key={idea.id}
                className="flex items-center justify-between gap-3 h-8 px-2 -mx-2 rounded-[2px] hover:bg-surface-hover transition-colors"
              >
                <span className="text-[13px] text-text-primary truncate">{idea.title}</span>
                <span className="font-mono text-[11px] text-text-tertiary shrink-0">{fmtAgo(idea.capturedAt)}</span>
              </div>
            ))}
          </div>
          <Link
            to="/ideas"
            className="inline-block mt-3 text-[12px] text-[hsl(var(--accent))] hover:text-text-primary transition-colors"
          >
            View all ideas in this goal →
          </Link>
        </div>
      )}
    </section>
  );
};

/* ===== Page ===== */
const GoalDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const goal = useStore((s) => s.goals.find((g) => g.id === id));
  const projects = useStore((s) => s.projects.filter((p) => p.goalId === id));
  const rituals = useStore((s) => s.rituals.filter((r) => r.goalId === id && r.status === "active"));
  const actions = useStore((s) => s.actions.filter((a) => a.goalId === id));
  const openPanel = useStore((s) => s.openPanel);

  if (!goal) {
    return (
      <div className="min-h-screen bg-surface-base text-text-primary">
        <Sidebar />
        <main className="ml-[220px] p-10">
          <div className="text-[14px] text-text-secondary">Goal not found.</div>
          <Link to="/" className="mt-4 inline-block text-[13px] text-accent hover:underline">
            ← Back to home
          </Link>
        </main>
      </div>
    );
  }

  const color = COLOR_VAR[goal.color];
  const goalLabel = goal.title.toUpperCase();
  const state = useStore((s) => selectors.stateIndicator(s, "goal", goal.id));
  const activeProjects = projects.filter((p) => p.status === "active");

  return (
    <div className="min-h-screen bg-surface-base text-text-primary">
      <Sidebar />
      <main className="ml-[220px] flex justify-center">
        <div className="w-full max-w-[1000px] px-10 pt-8 pb-16">
          <div>
            <Link
              to="/"
              className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-tertiary hover:text-text-secondary transition-colors"
            >
              ← GOALS
            </Link>
            <div className="h-4" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <Tooltip content={<StateDotTooltip state={state} lastActivity="recent" />}>
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ background: state === "active" ? "hsl(var(--state-active))" : "hsl(var(--state-stalled))" }}
                  />
                </Tooltip>
                <h1 className="text-[28px] font-medium text-text-primary truncate">{goal.title}</h1>
                <span className="ml-3 font-mono text-[11px] uppercase tracking-[0.08em] text-text-tertiary shrink-0">
                  {goal.type === "mid-term" ? "MID-TERM" : "SHORT-TERM"}
                </span>
              </div>
              <button
                onClick={() => openPanel({ kind: "goal", mode: "edit", id: goal.id })}
                className="px-2 py-1 rounded-[4px] text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors text-[16px] leading-none"
                aria-label="Edit goal"
              >
                ···
              </button>
            </div>
            <div className="h-2" />
            <div className="font-mono text-[12px] text-text-tertiary">
              Created {new Date(goal.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} ·{" "}
              {goal.targetDate
                ? `Target ${new Date(goal.targetDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
                : "No target date"}
            </div>
          </div>

          <div className="h-6" />

          {goal.description && (
            <p className="text-[14px] text-text-secondary leading-[1.6]">{goal.description}</p>
          )}

          <div className="h-14" />
          <SuccessCriteria goal={goal} />

          <div className="h-14" />
          <HeroState goal={goal} projects={projects} rituals={rituals} actions={actions} />

          <div className="h-14" />
          <section>
            <SectionHeader meta={`${activeProjects.length} ACTIVE`}>
              Active projects · {activeProjects.length}
            </SectionHeader>
            {activeProjects.length === 0 ? (
              <div className="font-mono text-[11px] text-text-tertiary">No active projects.</div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {activeProjects.map((p) => (
                  <ProjectCard key={p.id} p={p} color={color} goalLabel={goalLabel} />
                ))}
              </div>
            )}
            <GhostAddButton
              onClick={() =>
                openPanel({
                  kind: "project",
                  mode: "new",
                  prefill: { goalId: goal.id } as Partial<Project>,
                })
              }
            >
              + Add project to this goal
            </GhostAddButton>
          </section>

          <div className="h-14" />
          <section>
            <SectionHeader>Rituals · {rituals.length}</SectionHeader>
            {rituals.length === 0 ? (
              <div className="font-mono text-[11px] text-text-tertiary">No active rituals.</div>
            ) : (
              <div className="space-y-3">
                {rituals.map((r) => (
                  <RitualRow
                    key={r.id}
                    r={r}
                    color={color}
                    onOpen={() => openPanel({ kind: "ritual", mode: "edit", id: r.id })}
                  />
                ))}
              </div>
            )}
            <GhostAddButton
              onClick={() =>
                openPanel({
                  kind: "ritual",
                  mode: "new",
                  prefill: { goalId: goal.id } as Partial<Ritual>,
                })
              }
            >
              + Add ritual to this goal
            </GhostAddButton>
          </section>

          <div className="h-14" />
          <RecentActivity actions={actions} />

          <div className="h-14" />
          <IdeasSection goalId={goal.id} />
        </div>
      </main>
    </div>
  );
};

export default GoalDetail;
