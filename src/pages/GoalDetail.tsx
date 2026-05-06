import React, { useMemo, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Tooltip, StateDotTooltip } from "@/components/Tooltip";
import { CardMenu } from "@/components/CardMenu";
import { ConfirmModal } from "@/components/ConfirmModal";
import { toast } from "sonner";
import { useStore, selectors } from "@/store/useStore";
import type { Action, Goal, Project, Ritual, GoalColorVar } from "@/types";
import { AppSidebar } from "@/components/AppSidebar";
import { ProjectCard as SharedProjectCard } from "@/components/ProjectCard";

const COLOR_VAR: Record<GoalColorVar, string> = {
  "goal-1": "hsl(var(--goal-1))",
  "goal-2": "hsl(var(--goal-2))",
  "goal-3": "hsl(var(--goal-3))",
};


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
    <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-text-tertiary">{label}</div>
    <div className="text-[26px] font-medium text-text-primary leading-tight tabular-nums mt-1.5">{value}</div>
    <div className="font-mono text-[11px] text-text-tertiary mt-1">{sub}</div>
  </div>
);

const StateBarRow: React.FC<{
  label: string;
  pct: number;
  value: string;
  color: string;
  opacity?: number;
}> = ({ label, pct, value, color, opacity = 1 }) => (
  <div className="flex items-center gap-4 py-1.5">
    <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-secondary w-[80px] shrink-0">
      {label}
    </span>
    <div className="flex-1 h-[7px] bg-surface-hover rounded-[2px] overflow-hidden">
      <div
        className="h-full rounded-[2px]"
        style={{ width: `${Math.max(0, Math.min(100, pct))}%`, background: color, opacity }}
      />
    </div>
    <span className="font-mono text-[13px] text-text-primary tabular-nums w-[70px] text-right shrink-0">
      {value}
    </span>
  </div>
);

const HeroState: React.FC<{
  goal: Goal;
  projects: Project[];
  rituals: Ritual[];
  actions: Action[];
}> = ({ goal, projects, rituals, actions }) => {
  const color = COLOR_VAR[goal.color];
  const progressOutcome = useStore((s) => selectors.goalProgress(s, goal.id).outcome);
  const progressEffort = useStore((s) => selectors.goalProgress(s, goal.id).effort);
  const projectsClosed = projects.filter((p) => p.status === "completed").length;
  const projectsActive = projects.filter((p) => p.status === "active").length;
  const projectsTotal = projects.length;
  const criteria = goal.successCriteria ?? [];
  const criteriaMet = criteria.filter((c) => c.done).length;

  // Average ritual multiplier (rituals with ≥3 completions get ×1.10, else ×1.00 — matches existing heuristic)
  const avgMult =
    rituals.length === 0
      ? 0
      : rituals.reduce((acc, r) => acc + (r.totalCompletions >= 3 ? 1.1 : 1.0), 0) / rituals.length;

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
      {/* Top tier */}
      <div className="flex justify-between items-start gap-8">
        <div>
          <div className="text-[60px] font-medium text-text-primary tabular-nums leading-none">
            {progressOutcome}%
          </div>
          <div className="mt-1 font-mono text-[11px] uppercase tracking-[0.06em] text-text-tertiary">
            PROGRESS · VALUE
          </div>
          <div className="mt-3 font-mono text-[12px] text-text-secondary tabular-nums">
            {actionsDone} actions done · {projectsClosed} of {projectsTotal} projects closed · Active{" "}
            {ageMonths} {ageMonths === 1 ? "month" : "months"}
          </div>
        </div>
        <div className="flex gap-10 shrink-0">
          <Pillar
            label="PROJECTS"
            value={projectsTotal === 0 ? "—" : `${projectsClosed}/${projectsTotal}`}
            sub={projectsTotal === 0 ? "no projects" : `closed · ${projectsActive} active`}
          />
          <Pillar
            label="RITUALS"
            value={rituals.length === 0 ? "—" : `${rituals.length}`}
            sub={
              rituals.length === 0
                ? "no active"
                : `active · ×${avgMult.toFixed(2)} avg multiplier`
            }
          />
          <Pillar
            label="CRITERIA"
            value={criteria.length === 0 ? "—" : `${criteriaMet}/${criteria.length}`}
            sub={criteria.length === 0 ? "no criteria" : "criteria met"}
          />
        </div>
      </div>

      {/* Bottom tier — STATE */}
      <div className="mt-8">
        <div className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-tertiary mb-3">
          STATE
        </div>
        <div className="space-y-1">
          <StateBarRow label="VALUE" pct={progressOutcome} value={`${progressOutcome}%`} color={color} />
          <StateBarRow label="EFFORT" pct={progressEffort} value={`${progressEffort}%`} color={color} opacity={0.6} />
        </div>
        <div className="mt-3 font-mono text-[11px] italic text-text-tertiary">
          Effort discounts delegated work to 20%.
        </div>
      </div>

      {/* Last activity */}
      <div className="mt-6 font-mono text-[12px] text-text-secondary tabular-nums">
        Last activity {lastLabel} · {actionsDone} actions done overall
      </div>
    </div>
  );
};

/* ===== Resources block ===== */
const ResourcesBlock: React.FC<{ actions: Action[] }> = ({ actions }) => {
  const done = actions.filter((a) => a.status === "done");
  const delegated = actions.filter((a) => a.status === "delegated");
  const pending = actions.filter((a) => a.status === "backlog" || a.status === "planned");

  // Time invested = full Done time + 20% Delegated time.
  const timeSpent =
    done.reduce((s, a) => s + (a.timeEstimateMinutes ?? 0), 0) +
    Math.round(delegated.reduce((s, a) => s + (a.timeEstimateMinutes ?? 0), 0) * 0.2);
  const timeRemaining = pending.reduce((s, a) => s + (a.timeEstimateMinutes ?? 0), 0);

  const showTime = timeSpent > 0;

  if (!showTime) return null;

  const fmtH = (m: number) => {
    if (m < 60) return `${m}m`;
    return `${Math.round(m / 60)}h`;
  };

  return (
    <section>
      <div className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-tertiary mb-3">
        RESOURCES
      </div>
      <div className="space-y-1.5">
        {showTime && (
          <div className="font-mono text-[13px] text-text-secondary tabular-nums">
            Time spent: {fmtH(timeSpent)} · Time remaining: {fmtH(timeRemaining)} estimated
          </div>
        )}
      </div>
    </section>
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

/* ===== Project card (delegates to shared component) ===== */
const ProjectCard: React.FC<{ p: Project; color: string; goalLabel: string }> = ({
  p,
  color,
  goalLabel,
}) => (
  <SharedProjectCard projectId={p.id} goalLabel={goalLabel} goalColor={color} />
);

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
  const ideas = useStore(
    useShallow((s) => s.ideas.filter((i) => i.goalId === goalId && i.status === "captured")),
  );
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
  const allProjects = useStore((s) => s.projects);
  const allRituals = useStore((s) => s.rituals);
  const allActions = useStore((s) => s.actions);
  const openPanel = useStore((s) => s.openPanel);
  const state = useStore((s) =>
    goal ? selectors.stateIndicator(s, "goal", goal.id) : "active",
  );

  const projects = useMemo(
    () => allProjects.filter((p) => p.goalId === id && !p.isDraft),
    [allProjects, id],
  );
  const rituals = useMemo(
    () => allRituals.filter((r) => r.goalId === id && r.status === "active"),
    [allRituals, id],
  );
  const actions = useMemo(
    () => allActions.filter((a) => a.goalId === id),
    [allActions, id],
  );

  if (!goal) {
    return (
      <div className="min-h-screen bg-surface-base text-text-primary">
        <AppSidebar />
        <main className="ml-[var(--sidebar-w,220px)] p-10">
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
  const activeProjects = projects.filter((p) => p.status === "active");

  return (
    <div className="min-h-screen bg-surface-base text-text-primary">
      <AppSidebar />
      <main className="ml-[var(--sidebar-w,220px)] flex justify-center">
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

          <div className="h-8" />
          <ResourcesBlock actions={actions} />

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
              onClick={() => {
                const newId = useStore.getState().createProject({
                  title: "",
                  goalId: goal.id,
                  isDraft: true,
                });
                navigate(`/projects/${newId}`);
              }}
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
