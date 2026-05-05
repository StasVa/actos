import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Tooltip, SparkTooltipContent, StateDotTooltip } from "@/components/Tooltip";
import { LifetimeCounters } from "@/components/LifetimeCounters";
import { buildYouTubeTooltips, buildFitnessTooltips, buildReadingTooltips } from "@/lib/sparkTooltips";
import { useStore } from "@/store/useStore";
import { DayStartPanel } from "@/components/DayStartPanel";
import { ritualMultiplier } from "@/store/useStore";
import { toast } from "sonner";

const TODAY_ISO = new Date().toISOString().slice(0, 10);

/* ===== Tokens ===== */
const G1 = "hsl(var(--goal-1))";
const G2 = "hsl(var(--goal-2))";
const G3 = "hsl(var(--goal-3))";

/* ===== Primitives ===== */
const SectionLabel: React.FC<{ children: React.ReactNode; meta?: React.ReactNode }> = ({ children, meta }) => (
  <div className="flex items-center justify-between mb-3">
    <h2 className="text-[12px] font-medium uppercase tracking-[0.08em] text-text-secondary">{children}</h2>
    {meta && <div className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-tertiary">{meta}</div>}
  </div>
);

const Checkbox: React.FC<{ size?: number }> = ({ size = 14 }) => (
  <span
    className="inline-block rounded-[2px] border border-text-tertiary hover:border-text-secondary shrink-0"
    style={{ width: size, height: size }}
  />
);

const TimePill: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="font-mono text-[11px] text-text-secondary bg-surface-raised px-1.5 py-0.5 rounded-[2px] whitespace-nowrap">
    {children}
  </span>
);

const Strip: React.FC<{ color: string }> = ({ color }) => (
  <span className="self-stretch w-[3px] shrink-0" style={{ background: color }} />
);

/* ===== Sidebar ===== */
const NAV: { label: string; href: string }[] = [
  { label: "Home", href: "/" },
  { label: "Weekly", href: "#" },
  { label: "Ideas", href: "/ideas" },
  { label: "Rituals", href: "/rituals" },
  { label: "All actions", href: "/all-actions" },
  { label: "All projects", href: "/all-projects" },
  { label: "All delegated", href: "/all-delegated" },
];

const Sidebar: React.FC<{ onOpenSettings: () => void }> = ({ onOpenSettings }) => {
  const { pathname } = useLocation();
  return (
  <aside className="fixed left-0 top-0 bottom-0 w-[220px] bg-surface-raised border-r border-border-subtle p-4 flex flex-col">
    <div className="px-1 py-1 text-[17px] font-semibold text-text-primary tracking-tight">ActOS</div>
    <nav className="mt-8 flex flex-col gap-1">
      {NAV.map((item) => {
        const active =
          (item.href === "/" && pathname === "/") ||
          (item.href !== "/" && item.href !== "#" && pathname.startsWith(item.href));
        return (
          <Link
            key={item.label}
            to={item.href}
            className={`px-2.5 py-1.5 rounded-[4px] text-[13px] transition-colors ${
              active
                ? "bg-surface-hover text-text-primary font-medium"
                : "text-text-secondary font-normal hover:text-text-primary"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>

    <div className="flex-1" />

    <button
      type="button"
      onClick={onOpenSettings}
      className="text-left px-2.5 py-1.5 rounded-[4px] text-[13px] text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors mb-2"
    >
      Settings
    </button>
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
};

/* ===== Hero: Active Goals ===== */
/* 30 days, weekday-heavy, building toward today (right edge) */
const SPARK_1 = [
  2, 3, 0, 0, 3, 4, 2,
  3, 4, 1, 0, 2, 3, 4,
  2, 3, 0, 1, 3, 4, 2,
  4, 5, 1, 0, 3, 4, 2,
  3, 5,
];
/* Active first ~21 days, then 9 days of zero (stalled) */
const SPARK_2 = [
  2, 3, 4, 0, 1, 3, 2,
  3, 4, 2, 0, 0, 3, 4,
  3, 2, 4, 0, 1, 3, 2,
  0, 0, 0, 0, 0, 0, 0,
  0, 0,
];
/* Reading goal — very consistent daily activity */
const SPARK_3 = [
  1, 2, 1, 1, 0, 2, 1,
  1, 1, 2, 1, 0, 1, 2,
  1, 1, 1, 0, 1, 2, 1,
  1, 1, 2, 1, 1, 0, 2,
  1, 1,
];

const Sparkline: React.FC<{ data: number[]; color: string; tips: import("@/components/Tooltip").DayInfo[] }> = ({ data, color, tips }) => {
  const max = 5;
  return (
    <div className="w-full h-7 flex items-end gap-[1px]">
      {data.map((v, i) => {
        const h = v === 0 ? 2 : Math.max(2, Math.round((v / max) * 28));
        return (
          <Tooltip key={i} content={<SparkTooltipContent info={tips[i]} />} className="flex-1 h-full flex items-end">
            <div
              className="w-full hover:brightness-[1.15]"
              style={{
                height: h,
                background: v === 0 ? "hsl(var(--border-subtle))" : color,
                transition: "filter 80ms ease",
              }}
            />
          </Tooltip>
        );
      })}
    </div>
  );
};

const DualBars: React.FC<{ outcome: number; effort: number; color: string }> = ({ outcome, effort, color }) => (
  <div className="space-y-3">
    <div>
      <div className="flex justify-between font-mono text-[10px] uppercase tracking-[0.08em] text-text-tertiary mb-1">
        <span>Outcome</span>
        <span>{outcome}%</span>
      </div>
      <div className="h-2 w-full bg-surface-hover rounded-[1px] overflow-hidden">
        <div className="h-full" style={{ width: `${outcome}%`, background: color }} />
      </div>
    </div>
    <div>
      <div className="flex justify-between font-mono text-[10px] uppercase tracking-[0.08em] text-text-tertiary mb-1">
        <span>Effort</span>
        <span>{effort}%</span>
      </div>
      <div className="h-2 w-full bg-surface-hover rounded-[1px] overflow-hidden">
        <div className="h-full" style={{ width: `${effort}%`, background: color, opacity: 0.6 }} />
      </div>
    </div>
  </div>
);

const GoalColumn: React.FC<{
  title: string;
  state: "active" | "stalled";
  type: string;
  target?: string;
  progress: number;
  meta: string[];
  outcome: number;
  effort: number;
  spark: number[];
  sparkTips: import("@/components/Tooltip").DayInfo[];
  lastActivity?: string;
  stalledFor?: string;
  color: string;
  recent: React.ReactNode;
  href?: string;
}> = ({ title, state, type, target, progress, meta, outcome, effort, spark, sparkTips, lastActivity, stalledFor, color, recent, href }) => {
  const inner = (
    <div className="px-6 py-1 space-y-4 first:pl-0 last:pr-0 group">
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2.5 min-w-0">
        <Tooltip content={<StateDotTooltip state={state} lastActivity={lastActivity} stalledFor={stalledFor} />}>
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ background: state === "active" ? "hsl(var(--state-active))" : "hsl(var(--state-stalled))" }}
          />
        </Tooltip>
        <h3 className={`text-[18px] font-medium text-text-primary truncate ${href ? "group-hover:text-accent transition-colors" : ""}`}>{title}</h3>
        <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-text-tertiary shrink-0">{type}</span>
      </div>
      {target && (
        <div className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-tertiary shrink-0">{target}</div>
      )}
    </div>

    <div className="flex gap-6 items-end">
      <div>
        <div className="font-mono font-medium text-text-primary leading-none" style={{ fontSize: 36 }}>
          {progress}%
        </div>
        <div className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-tertiary mt-2">Progress</div>
      </div>
      <div className="flex-1 flex flex-col gap-1.5 pb-1 min-w-0">
        {meta.map((m, i) => (
          <div key={i} className="font-mono text-[12px] text-text-secondary truncate">
            {m}
          </div>
        ))}
      </div>
    </div>

    <DualBars outcome={outcome} effort={effort} color={color} />

    <div>
      <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-text-tertiary mb-1.5">
        Activity · Last 30 days
      </div>
      <Sparkline data={spark} color={color} tips={sparkTips} />
    </div>

    <div className="font-mono text-[11px] text-text-secondary leading-relaxed">{recent}</div>
    </div>
  );
  if (href) {
    return (
      <Link to={href} className="block cursor-pointer">
        {inner}
      </Link>
    );
  }
  return inner;
};

const SPARK_1_TIPS = buildYouTubeTooltips(SPARK_1);
const SPARK_2_TIPS = buildFitnessTooltips(SPARK_2);
const SPARK_3_TIPS = buildReadingTooltips(SPARK_3);

const Hero: React.FC = () => (
  <div className="bg-surface-elevated border border-border-subtle rounded-[6px] p-6 grid grid-cols-3 divide-x divide-border-subtle">
    <GoalColumn
      href="/goals/launch-youtube-channel"
      title="Launch YouTube channel"
      state="active"
      type="MID-TERM"
      progress={47}
      meta={["2 of 3 projects closed", "12 actions done", "Last activity: today"]}
      outcome={47}
      effort={32}
      spark={SPARK_1}
      sparkTips={SPARK_1_TIPS}
      lastActivity="today"
      color={G1}
      recent={<>Recent: ✓ Outline structure · ✓ Set up workspace · ✓ Define content pillars</>}
    />
    <GoalColumn
      title="Lose 5 kg"
      state="stalled"
      type="MID-TERM"
      target="TARGET MAY 30"
      progress={33}
      meta={["1 of 3 projects closed", "8 actions done", "Last activity: 9 days ago"]}
      outcome={33}
      effort={28}
      spark={SPARK_2}
      sparkTips={SPARK_2_TIPS}
      stalledFor="9 days"
      color={G2}
      recent={
        <>
          Last action <span className="text-text-primary font-medium">9 days ago</span>: Cook batch meals
        </>
      }
    />
    <GoalColumn
      title="Read 24 books this year"
      state="active"
      type="MID-TERM"
      target="TARGET DEC 31"
      progress={38}
      meta={["1 of 1 projects active", "32 actions done", "Last activity: today"]}
      outcome={38}
      effort={42}
      spark={SPARK_3}
      sparkTips={SPARK_3_TIPS}
      lastActivity="today"
      color={G3}
      recent={<>Recent: ✓ Finished book 9 of 24 today · ✓ Read 30 minutes · ✓ Logged today's read</>}
    />
  </div>
);

/* ===== Active Projects ===== */
type Project = {
  goalLabel: string;
  goalColor: string;
  title: string;
  done: number;
  total: number;
  last: string;
  state: "active" | "stalled";
  warnLast?: boolean;
  href?: string;
};

const PROJECTS: Project[] = [
  { goalLabel: "YOUTUBE CHANNEL", goalColor: G1, title: "Shoot video #1", done: 3, total: 7, last: "today", state: "active", href: "/projects/shoot-video-1" },
  { goalLabel: "YOUTUBE CHANNEL", goalColor: G1, title: "Set up workspace", done: 4, total: 5, last: "2d ago", state: "active" },
  { goalLabel: "LOSE 5 KG", goalColor: G2, title: "Nutrition plan", done: 3, total: 4, last: "today", state: "active" },
  { goalLabel: "LOSE 5 KG", goalColor: G2, title: "Build cardio routine", done: 1, total: 6, last: "11d ago", state: "stalled", warnLast: true },
  { goalLabel: "READ 24 BOOKS", goalColor: G3, title: "Build daily reading habit", done: 8, total: 24, last: "today", state: "active" },
];

const ProjectCard: React.FC<{ p: Project }> = ({ p }) => {
  const pct = Math.round((p.done / p.total) * 100);
  const inner = (
    <div
      className="group h-[120px] p-3 flex flex-col gap-2 rounded-[6px] bg-surface-raised border border-border-subtle hover:bg-surface-hover hover:border-accent cursor-pointer transition-colors duration-100"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: p.goalColor }} />
          <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-text-tertiary truncate">
            {p.goalLabel}
          </span>
        </div>
        <Tooltip content={<StateDotTooltip state={p.state} lastActivity={p.last} stalledFor={p.last} />}>
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ background: p.state === "active" ? "hsl(var(--state-active))" : "hsl(var(--state-stalled))" }}
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
        <div className="h-full rounded-[2px]" style={{ width: `${pct}%`, background: p.goalColor }} />
      </div>

      <div className="flex items-center justify-between font-mono text-[11px] tabular-nums">
        <div>
          <span className="text-text-primary">{p.done}/{p.total}</span>
          <span className="text-text-tertiary"> actions</span>
        </div>
        <div className="text-text-secondary">
          Last:{" "}
          <span className={p.warnLast ? "text-text-warning" : "text-text-secondary"}>{p.last}</span>
        </div>
      </div>
    </div>
  );
  if (p.href) return <Link to={p.href} className="block">{inner}</Link>;
  return inner;
};

const ActiveProjects: React.FC = () => (
  <section>
    <SectionLabel meta="5 ACTIVE · 1 STALLED">Active projects · 5</SectionLabel>
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {PROJECTS.map((p, i) => (
        <ProjectCard key={i} p={p} />
      ))}
    </div>
  </section>
);

/* ===== Today (live store-wired) ===== */
function fmtTime(min?: number): string | null {
  if (!min) return null;
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  return `${m}m`;
}

const Today: React.FC = () => {
  const goals = useStore((s) => s.goals);
  const projects = useStore((s) => s.projects);
  const actions = useStore((s) => s.actions);
  const rituals = useStore((s) => s.rituals);
  const dayEntry = useStore((s) =>
    s.dayEntries.find((d) => d.date === TODAY_ISO),
  );
  const settings = useStore((s) => s.settings);
  const changeActionStatus = useStore((s) => s.changeActionStatus);
  const createAction = useStore((s) => s.createAction);
  const openPanel = useStore((s) => s.openPanel);
  const markRitualInstanceDone = useStore((s) => s.markRitualInstanceDone);

  const [quickAdd, setQuickAdd] = useState("");

  const todays = actions
    .filter((a) => a.scheduledDate === TODAY_ISO && a.status === "planned")
    .sort((a, b) => (b.impact ?? 0) - (a.impact ?? 0));

  const mainTaskId = dayEntry?.mainTaskActionId;
  const mainTask = mainTaskId ? actions.find((a) => a.id === mainTaskId) : undefined;
  const others = todays.filter((a) => a.id !== mainTaskId);

  const todaysRituals = rituals.filter((r) => r.status === "active");
  const ritualsTotal = todaysRituals.length;

  const goalById = (id: string) => goals.find((g) => g.id === id);
  const projectById = (id: string | null) =>
    id ? projects.find((p) => p.id === id) : undefined;

  const colorVar = (goalId: string) => {
    const g = goalById(goalId);
    return g ? `hsl(var(--${g.color}))` : "hsl(var(--text-tertiary))";
  };

  const breadcrumb = (goalId: string, projectId: string | null) => {
    const g = goalById(goalId);
    const p = projectById(projectId);
    if (g && p) return `· ${g.title} · ${p.title}`;
    if (g) return `· ${g.title}`;
    return "";
  };

  const handleToggleDone = (id: string) => {
    changeActionStatus(id, "done");
    toast.success("Action completed");
  };

  const handleQuickAdd = () => {
    const t = quickAdd.trim();
    if (!t) return;
    const id = createAction({ title: t, scheduledDate: TODAY_ISO });
    setQuickAdd("");
    toast.success("Action added to today");
    openPanel({ kind: "action", mode: "edit", id });
  };

  const handleRitualToggle = (ritualId: string, alreadyDone: boolean) => {
    if (alreadyDone) return;
    markRitualInstanceDone(ritualId);
    toast.success("Ritual logged");
  };

  return (
    <section>
      <SectionLabel meta={`${todays.length} ACTIONS · ${ritualsTotal} RITUALS`}>Today</SectionLabel>
      <div className="space-y-2">
        {mainTask && (
          <div
            onClick={() => openPanel({ kind: "action", mode: "edit", id: mainTask.id })}
            className="flex items-center gap-3 px-3 py-2 bg-surface-raised rounded-[4px] cursor-pointer hover:bg-surface-hover transition-colors"
          >
            <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-text-tertiary">MAIN</span>
            <span className="text-[13px] font-medium text-text-primary">{mainTask.title}</span>
            <span className="text-[12px] text-text-secondary">{breadcrumb(mainTask.goalId, mainTask.projectId)}</span>
            <div className="flex-1" />
            {fmtTime(mainTask.timeEstimateMinutes) && (
              <TimePill>{fmtTime(mainTask.timeEstimateMinutes)}</TimePill>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); handleToggleDone(mainTask.id); }}
              className="inline-block rounded-[2px] border border-text-tertiary hover:border-accent shrink-0"
              style={{ width: 14, height: 14 }}
              aria-label="Mark done"
            />
          </div>
        )}

        {others.length === 0 && !mainTask && (
          <div className="px-3 py-6 text-center font-mono text-[11px] text-text-tertiary border border-dashed border-border-subtle rounded-[4px]">
            No actions scheduled for today. Add one below.
          </div>
        )}

        {others.map((a) => {
          const time = fmtTime(a.timeEstimateMinutes);
          return (
            <div
              key={a.id}
              onClick={() => openPanel({ kind: "action", mode: "edit", id: a.id })}
              className="flex items-center gap-3 pr-3 h-8 rounded-[2px] hover:bg-surface-hover transition-colors overflow-hidden cursor-pointer"
            >
              <Strip color={colorVar(a.goalId)} />
              <button
                onClick={(e) => { e.stopPropagation(); handleToggleDone(a.id); }}
                className="ml-1 inline-block rounded-[2px] border border-text-tertiary hover:border-accent shrink-0"
                style={{ width: 14, height: 14 }}
                aria-label="Mark done"
              />
              <span className="text-[13px] text-text-primary truncate">{a.title}</span>
              <span className="text-[12px] text-text-secondary truncate">{breadcrumb(a.goalId, a.projectId)}</span>
              <div className="flex-1" />
              {a.delegateName && (
                <span className="font-mono text-[11px] text-text-tertiary">→ {a.delegateName}</span>
              )}
              {time && <TimePill>{time}</TimePill>}
            </div>
          );
        })}

        {todaysRituals.length > 0 && (
          <div className="flex flex-wrap gap-x-6 gap-y-2 pt-1">
            {todaysRituals.map((r) => {
              const doneToday = r.completionHistory.some((c) => c.date === TODAY_ISO);
              const mult = ritualMultiplier(r.totalCompletions);
              const color = colorVar(r.goalId);
              return (
                <div
                  key={r.id}
                  onClick={() => openPanel({ kind: "ritual", mode: "edit", id: r.id })}
                  className="flex items-center gap-2 cursor-pointer group"
                >
                  <button
                    onClick={(e) => { e.stopPropagation(); handleRitualToggle(r.id, doneToday); }}
                    className="w-2.5 h-2.5 rounded-full border transition-colors"
                    style={{
                      borderColor: color,
                      background: doneToday ? color : "transparent",
                    }}
                    aria-label={doneToday ? "Done today" : "Mark ritual done"}
                  />
                  <span className="text-[13px] text-text-primary group-hover:text-accent transition-colors">{r.title}</span>
                  <span className="font-mono text-[11px] text-text-tertiary">
                    {r.schedule[0].toUpperCase() + r.schedule.slice(1)} · {r.totalCompletions} done · ×{mult.toFixed(2)}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex items-center gap-2 bg-surface-raised border border-border-subtle rounded-[4px] px-3 py-2 mt-2">
          <input
            value={quickAdd}
            onChange={(e) => setQuickAdd(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleQuickAdd(); }}
            className="flex-1 bg-transparent text-[13px] text-text-primary placeholder:text-text-tertiary focus:outline-none"
            placeholder="Add an action for today…"
          />
          <span className="font-mono text-[11px] text-text-tertiary">⏎</span>
        </div>
      </div>
    </section>
  );
};


/* ===== Heavy Lift ===== */
const HEAVY = [
  { c: G1, impact: 8, title: "Edit first video draft", crumb: "YouTube · Shoot video #1", time: "2h 30m" },
  { c: G1, impact: 7, title: "Outline video #2 series structure", crumb: "YouTube · Shoot video #1", time: "2h" },
  { c: G2, impact: 6, title: "Cook batch meals for the week", crumb: "Lose 5 kg · Nutrition plan", time: "1h 30m" },
];

const HeavyLift: React.FC = () => (
  <section>
    <SectionLabel meta="HIGH IMPACT · HIGH EFFORT">Heavy lift today</SectionLabel>
    <div className="space-y-1">
      {HEAVY.map((r, i) => (
        <div
          key={i}
          className="group flex items-center gap-3 pr-3 min-h-9 rounded-[2px] hover:bg-surface-hover transition-colors overflow-hidden"
        >
          <Strip color={r.c} />
          <div className="w-[52px] pl-2">
            <div className="font-mono text-[10px] uppercase tracking-[0.06em] text-text-tertiary leading-none">
              IMPACT
            </div>
            <div className="font-mono text-[16px] text-text-primary leading-tight">{r.impact}</div>
          </div>
          <div className="min-w-0 flex-1 py-1.5">
            <div className="text-[13px] font-medium text-text-primary truncate">{r.title}</div>
            <div className="text-[11px] text-text-secondary truncate">{r.crumb}</div>
          </div>
          <span className="font-mono text-[12px] text-text-secondary whitespace-nowrap">{r.time}</span>
          <a
            href="#"
            className="text-[12px] text-accent hover:text-accent-hover whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-100"
          >
            Mark done
          </a>
          <a
            href="#"
            className="text-[12px] text-text-secondary hover:text-text-primary whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-100"
          >
            Open
          </a>
        </div>
      ))}
    </div>
  </section>
);

/* ===== Quick Moves ===== */
const QUICK = [
  { c: G1, title: "Send brief to thumbnail designer", crumb: "YouTube · Shoot video #1", del: "→ AI", meta: "I6 · 20m" },
  { c: G2, title: "Order resistance bands", crumb: "Lose 5 kg · Nutrition plan", meta: "I5 · 15m" },
  { c: G1, title: "Update channel description", crumb: "YouTube · Set up workspace", meta: "I5 · 30m" },
  { c: G2, title: "Schedule weekly meal prep day", crumb: "Lose 5 kg · Nutrition plan", meta: "I4 · 20m" },
  { c: G1, title: "Test new recording mic", crumb: "YouTube · Shoot video #1", meta: "I4 · 30m" },
];

const QuickMoves: React.FC = () => (
  <section>
    <SectionLabel meta="HIGH IMPACT · LOW EFFORT">Quick moves</SectionLabel>
    <div className="space-y-0.5">
      {QUICK.map((r, i) => (
        <div
          key={i}
          className="flex items-center gap-3 pr-3 h-7 rounded-[2px] hover:bg-surface-hover transition-colors overflow-hidden"
        >
          <Strip color={r.c} />
          <div className="pl-1">
            <Checkbox />
          </div>
          <span className="text-[13px] text-text-primary truncate">{r.title}</span>
          <span className="text-[12px] text-text-secondary truncate">· {r.crumb}</span>
          <div className="flex-1" />
          {r.del && <span className="font-mono text-[11px] text-text-tertiary">{r.del}</span>}
          <span className="font-mono text-[11px] text-text-secondary whitespace-nowrap">{r.meta}</span>
        </div>
      ))}
    </div>
  </section>
);

/* ===== Bottom Utility Row ===== */
const TinyHeader: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="font-mono text-[10px] uppercase tracking-[0.06em] text-text-tertiary">{children}</div>
);

const RecentlyClosed: React.FC = () => {
  const items = [
    { c: G1, name: "Set up workspace", date: "Apr 28" },
    { c: G1, name: "Define content pillars", date: "Apr 22" },
    { c: G2, name: "First grocery overhaul", date: "Apr 18" },
  ];
  return (
    <div className="p-4">
      <TinyHeader>RECENTLY CLOSED · 3</TinyHeader>
      <div className="mt-3 space-y-1.5">
        {items.map((it, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: it.c }} />
            <span className="text-[12px] text-text-primary truncate">{it.name}</span>
            <span className="font-mono text-[11px] text-text-tertiary whitespace-nowrap">· {it.date}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const Delegated: React.FC = () => {
  const items = [
    { name: "Buy ring light", to: "→ Maria" },
    { name: "Send brief to thumbnail designer", to: "→ AI" },
  ];
  return (
    <div className="p-4">
      <TinyHeader>DELEGATED · 2 ACTIVE</TinyHeader>
      <div className="mt-3 space-y-1.5">
        {items.map((it, i) => (
          <div key={i} className="flex items-baseline gap-1 min-w-0">
            <span className="text-[12px] text-text-primary truncate">{it.name}</span>
            <span className="font-mono text-[11px] text-text-tertiary whitespace-nowrap">· {it.to}</span>
          </div>
        ))}
      </div>
      <a href="#" className="inline-block mt-2 text-[12px] text-accent hover:text-accent-hover">
        View all →
      </a>
    </div>
  );
};

const ThisWeek: React.FC = () => {
  const stats = [
    { n: "12", label: "actions done" },
    { n: "3", label: "delegated" },
    { n: "1", label: "dropped" },
    { n: "0", label: "projects closed" },
  ];
  return (
    <div className="p-4">
      <TinyHeader>THIS WEEK</TinyHeader>
      <div className="mt-3 space-y-1.5 font-mono text-[12px]">
        {stats.map((s, i) => (
          <div key={i} className="flex items-baseline gap-3">
            <span className="text-text-primary tabular-nums w-4 text-right">{s.n}</span>
            <span className="text-text-tertiary">{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const UtilityRow: React.FC = () => (
  <div className="grid grid-cols-3 divide-x divide-border-subtle border border-border-subtle rounded-[6px] bg-surface-elevated">
    <RecentlyClosed />
    <Delegated />
    <ThisWeek />
  </div>
);

/* ===== Page ===== */
const Index: React.FC = () => {
  return (
    <div className="min-h-screen bg-surface-base text-text-primary">
      <Sidebar />
      <main className="ml-[220px] px-8 py-6">
        <header className="mb-6">
          <h1 className="text-[20px] font-medium text-text-primary">Tuesday, May 5</h1>
          <div className="font-mono text-[12px] text-text-tertiary mt-0.5">Execution day</div>
        </header>

        <Hero />

        <div className="h-8" />
        <ActiveProjects />
        <div className="h-8 border-b border-border-subtle" />

        <div className="h-8" />
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
          <Today />
          <DayStartPanel />
        </div>

        <div className="my-6 border-t border-border-subtle" />
        <HeavyLift />

        <div className="my-6 border-t border-border-subtle" />
        <QuickMoves />

        <div className="h-8" />
        <UtilityRow />

        <div className="h-8" />
      </main>
    </div>
  );
};

export default Index;
