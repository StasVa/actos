import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Tooltip, SparkTooltipContent, StateDotTooltip } from "@/components/Tooltip";
import { buildYouTubeTooltips } from "@/lib/sparkTooltips";

const G1 = "hsl(var(--goal-1))";

/* ===== Sidebar (inactive variant for sub-routes) ===== */
const NAV = ["Home", "Weekly", "All actions", "All projects", "All delegated"];

const Sidebar: React.FC = () => (
  <aside className="fixed left-0 top-0 bottom-0 w-[220px] bg-surface-raised border-r border-border-subtle p-4 flex flex-col">
    <Link to="/" className="px-1 py-1 text-[17px] font-semibold text-text-primary tracking-tight">
      ActOS
    </Link>
    <nav className="mt-8 flex flex-col gap-1">
      {NAV.map((item) => (
        <Link
          key={item}
          to={item === "Home" ? "/" : "#"}
          className="px-2.5 py-1.5 rounded-[4px] text-[13px] text-text-secondary font-normal hover:text-text-primary transition-colors"
        >
          {item}
        </Link>
      ))}
    </nav>
    <div className="flex-1" />
    <div className="font-mono text-[11px] text-text-tertiary px-1">⌘K  Quick add</div>
    <div className="mt-4 font-mono text-[11px] text-text-secondary px-1 leading-[1.7]">
      <div>3 projects closed</div>
      <div>47 actions done</div>
    </div>
    <div className="mt-3 flex items-center gap-2 p-1 rounded-[4px] hover:bg-surface-hover cursor-pointer">
      <span className="w-7 h-7 rounded-full bg-surface-hover flex items-center justify-center font-mono text-[11px] text-text-primary">
        AK
      </span>
      <span className="font-mono text-[11px] text-text-secondary truncate">ak@email</span>
    </div>
  </aside>
);

/* ===== Section header ===== */
const SectionHeader: React.FC<{ children: React.ReactNode; meta?: React.ReactNode }> = ({ children, meta }) => (
  <div className="flex items-center justify-between mb-3">
    <h2 className="text-[12px] font-medium uppercase tracking-[0.08em] text-text-secondary">{children}</h2>
    {meta && <div className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-tertiary">{meta}</div>}
  </div>
);

/* ===== Tier B: Ghost add button ===== */
const GhostAddButton: React.FC<{ children: React.ReactNode; onClick?: () => void }> = ({ children, onClick }) => (
  <button
    onClick={onClick}
    className="block w-full h-9 px-4 py-2 mt-4 text-[13px] text-text-secondary text-center bg-transparent border border-dashed border-border-default rounded-[4px] cursor-pointer transition-[border-color,color] duration-100 hover:border-solid hover:border-accent-muted hover:text-text-primary"
  >
    {children}
  </button>
);

/* ===== Success Criteria ===== */
const CRITERIA = [
  { text: "Define content pillars and audience", done: true },
  { text: "Publish first 3 videos", done: false },
  { text: "Reach 1,000 subscribers", done: false },
  { text: "Sustain weekly publishing for 3 months", done: false },
];

const SuccessCriteria: React.FC = () => (
  <section>
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-[12px] font-medium uppercase tracking-[0.08em] text-text-secondary">Success criteria</h2>
      <div className="font-mono text-[11px] tabular-nums text-text-tertiary">1 of 4 met</div>
    </div>
    <div>
      {CRITERIA.map((c, i) => (
        <div
          key={i}
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
  </section>
);

/* ===== Hero state block ===== */
/* 30 days, weekday-heavy, sustained recent movement */
const SPARK = [
  2, 3, 0, 0, 3, 4, 2,
  3, 4, 1, 0, 2, 3, 4,
  2, 3, 0, 1, 3, 4, 2,
  4, 5, 1, 0, 3, 4, 2,
  3, 5,
];
const SPARK_TIPS = buildYouTubeTooltips(SPARK);

const Pillar: React.FC<{ label: string; value: string; sub: string }> = ({ label, value, sub }) => (
  <div className="flex flex-col">
    <div className="font-mono text-[10px] uppercase tracking-[0.06em] text-text-tertiary">{label}</div>
    <div className="font-mono text-[24px] text-text-primary leading-tight mt-1">{value}</div>
    <div className="font-mono text-[11px] text-text-secondary mt-0.5">{sub}</div>
  </div>
);

/* Unified state row: label / value / mini-bar */
const StateRow: React.FC<{
  label: string;
  value: React.ReactNode;
  pct: number;
  opacity?: number;
  isLast?: boolean;
}> = ({ label, value, pct, opacity = 1, isLast }) => (
  <div
    className={`h-8 flex items-center gap-4 py-1.5 ${isLast ? "" : "border-b border-border-subtle"}`}
  >
    <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-text-tertiary w-[70px] shrink-0">
      {label}
    </span>
    <span className="flex-1 min-w-0">{value}</span>
    <div className="w-[80px] h-[5px] bg-surface-hover rounded-[2px] overflow-hidden shrink-0">
      <div className="h-full rounded-[2px]" style={{ width: `${pct}%`, background: G1, opacity }} />
    </div>
  </div>
);

const HeroState: React.FC = () => {
  const max = Math.max(...SPARK, 1);
  return (
    <div className="bg-surface-elevated border border-border-subtle rounded-[8px] p-8">
      {/* Top row */}
      <div className="flex justify-between items-start gap-8">
        <div>
          <div className="font-mono text-[56px] font-medium text-text-primary tabular-nums leading-none">47%</div>
          <div className="mt-3 text-[13px] uppercase tracking-[0.08em] text-text-tertiary">PROGRESS · OUTCOME</div>
          <div className="mt-1 text-[12px] text-text-secondary">12 actions done · 2 of 3 projects closed · Active 4 months</div>
        </div>
        <div className="flex gap-6 shrink-0">
          <Pillar label="PROJECTS" value="2/3" sub="closed · 1 active" />
          <Pillar label="RITUALS" value="1" sub="active · ×1.10 multiplier" />
          <Pillar label="CRITERIA" value="1/4" sub="criteria met" />
        </div>
      </div>

      {/* State block */}
      <div className="mt-8">
        <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-text-tertiary mb-2">
          STATE
        </div>
        <div>
          <StateRow
            label="OUTCOME"
            value={<span className="font-mono text-[14px] text-text-primary tabular-nums">47%</span>}
            pct={47}
          />
          <StateRow
            label="EFFORT"
            value={<span className="font-mono text-[14px] text-text-primary tabular-nums">32%</span>}
            pct={32}
            opacity={0.6}
          />
          <StateRow
            label="TIME"
            value={
              <span className="font-mono tabular-nums">
                <span className="text-[14px] text-text-primary">32h</span>
                <span className="text-text-tertiary"> / </span>
                <span className="text-[12px] text-text-secondary">75h</span>
              </span>
            }
            pct={43}
            isLast
          />
        </div>
        <div className="mt-2 font-mono text-[11px] text-text-tertiary">
          Effort discounts delegated work to 20%.
        </div>
      </div>

      {/* Sparkline */}
      <div className="mt-6">
        <div className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-tertiary mb-2">
          ACTIVITY · LAST 30 DAYS
        </div>
        <div className="w-full h-20 flex items-end gap-[2px]">
          {SPARK.map((v, i) => {
            const h = v === 0 ? 4 : Math.max(4, Math.round((v / max) * 80));
            const info = SPARK_TIPS[i];
            return (
              <Tooltip key={i} content={<SparkTooltipContent info={info} />} className="flex-1 h-full flex items-end">
                <div
                  className="w-full hover:brightness-[1.15]"
                  style={{
                    height: h,
                    background: v === 0 ? "hsl(var(--border-subtle))" : G1,
                    transition: "filter 80ms ease",
                  }}
                />
              </Tooltip>
            );
          })}
        </div>
      </div>

      {/* State summary */}
      <div className="mt-4 font-mono text-[12px] text-text-secondary">
        Last activity today · 14 actions done in the last 4 weeks ·{" "}
        <span className="text-text-primary">Movement steady</span>
      </div>
    </div>
  );
};

/* ===== Project card (reused style) ===== */
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

const ProjectCard: React.FC<{ p: Project }> = ({ p }) => {
  const pct = Math.round((p.done / p.total) * 100);
  const inner = (
    <div className="group h-[120px] p-3 flex flex-col gap-2 rounded-[6px] bg-surface-raised border border-border-subtle hover:bg-surface-hover hover:border-accent cursor-pointer transition-colors duration-100">
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
          Last: <span className={p.warnLast ? "text-text-warning" : "text-text-secondary"}>{p.last}</span>
        </div>
      </div>
    </div>
  );
  if (p.href) return <Link to={p.href} className="block">{inner}</Link>;
  return inner;
};

const ActiveProjectsSection: React.FC = () => {
  const projects: Project[] = [
    { goalLabel: "YOUTUBE CHANNEL", goalColor: G1, title: "Shoot video #1", done: 3, total: 7, last: "today", state: "active", href: "/projects/shoot-video-1" },
    { goalLabel: "YOUTUBE CHANNEL", goalColor: G1, title: "Set up workspace", done: 4, total: 5, last: "2d ago", state: "active" },
  ];
  return (
    <section>
      <SectionHeader meta="1 NEAR COMPLETION">Active projects · 2</SectionHeader>
      <div className="grid grid-cols-2 gap-4">
        {projects.map((p, i) => (
          <ProjectCard key={i} p={p} />
        ))}
      </div>
      <GhostAddButton>+ Add project to this goal</GhostAddButton>
    </section>
  );
};

/* ===== Rituals ===== */
const RITUAL_STRIP = [1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1];

const RitualsSection: React.FC = () => (
  <section>
    <SectionHeader>Rituals · 1</SectionHeader>
    <div className="bg-surface-raised border border-border-subtle rounded-[6px] p-4 flex items-center gap-6">
      <span className="w-3 h-3 rounded-full shrink-0" style={{ background: G1 }} />
      <div>
        <div className="text-[14px] font-medium text-text-primary">Weekly project audit</div>
        <div className="mt-0.5 font-mono text-[11px] uppercase tracking-[0.06em] text-text-secondary">
          Weekly · Mondays
        </div>
      </div>
      <div className="flex-1" />
      <div className="flex flex-col items-end">
        <div className="font-mono text-[18px] text-text-primary">×1.10</div>
        <div className="font-mono text-[11px] text-text-tertiary">12 completions · next ×1.25 at 30</div>
      </div>
      <div className="flex gap-[2px]">
        {RITUAL_STRIP.map((v, i) => (
          <span
            key={i}
            className="w-2 h-2"
            style={{ background: v ? G1 : "hsl(var(--surface-hover))" }}
          />
        ))}
      </div>
    </div>
    <GhostAddButton>+ Add ritual to this goal</GhostAddButton>
  </section>
);

/* ===== Recent activity ===== */
type ActivityKind = "done" | "delegated" | "closed";
const ACTIVITY: { kind: ActivityKind; title: string; crumb?: string; date: string }[] = [
  { kind: "done", title: "Outline structure", crumb: "Shoot video #1", date: "Today" },
  { kind: "done", title: "Define content pillars", crumb: "Set up workspace", date: "Yesterday" },
  { kind: "delegated", title: "Buy ring light → Maria", crumb: "Set up workspace", date: "2d ago" },
  { kind: "done", title: "Research camera options", crumb: "Set up workspace", date: "3d ago" },
  { kind: "done", title: "Set up recording space", crumb: "Set up workspace", date: "4d ago" },
  { kind: "closed", title: "Define content pillars project closed", date: "5d ago" },
  { kind: "done", title: "Test microphone", crumb: "Set up workspace", date: "6d ago" },
  { kind: "done", title: "Define audience persona", crumb: "Set up workspace", date: "Apr 28" },
];

const ActivityMarker: React.FC<{ kind: ActivityKind }> = ({ kind }) => {
  if (kind === "done") return <span className="text-[12px] w-3 text-center" style={{ color: "hsl(var(--status-done))" }}>✓</span>;
  if (kind === "delegated") return <span className="text-[12px] w-3 text-center" style={{ color: "hsl(var(--status-delegated))" }}>→</span>;
  return <span className="text-[12px] w-3 text-center text-text-secondary">■</span>;
};

const RecentActivity: React.FC = () => (
  <section>
    <SectionHeader>Recent activity · 8</SectionHeader>
    <div>
      {ACTIVITY.map((a, i) => (
        <div
          key={i}
          className="flex items-center gap-3 h-8 py-1 border-b border-border-subtle last:border-b-0"
        >
          <ActivityMarker kind={a.kind} />
          <span className="text-[13px] text-text-primary">{a.title}</span>
          {a.crumb && <span className="text-[12px] text-text-secondary">· {a.crumb}</span>}
          <div className="flex-1" />
          <span className="font-mono text-[11px] text-text-tertiary">{a.date}</span>
        </div>
      ))}
    </div>
    <a href="#" className="inline-block mt-3 text-[12px] text-text-secondary hover:text-text-primary hover:underline transition-colors">
      View all activity →
    </a>
  </section>
);

/* ===== Ideas (collapsible) ===== */
const IDEAS = [
  "Series on creator tooling comparisons",
  "Behind-the-scenes setup teardown video",
  "Collab with workflow channels",
];

const IdeasSection: React.FC = () => {
  const [open, setOpen] = useState(false);
  return (
    <section>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-[12px] font-medium uppercase tracking-[0.08em] text-text-tertiary hover:text-text-secondary transition-colors cursor-pointer"
      >
        <span className="inline-block w-3">{open ? "▾" : "▸"}</span>
        Ideas · 3 captured
      </button>
      {open && (
        <div className="mt-3 space-y-1">
          {IDEAS.map((idea, i) => (
            <div
              key={i}
              className="flex items-center gap-3 h-7 px-2 -mx-2 rounded-[2px] hover:bg-surface-hover transition-colors text-[13px] text-text-primary"
            >
              <span className="font-mono text-[11px] text-text-tertiary w-4">{i + 1}</span>
              <span>{idea}</span>
            </div>
          ))}
          <a href="#" className="inline-block mt-2 text-[12px] text-text-secondary hover:text-text-primary hover:underline transition-colors">
            + Capture idea
          </a>
        </div>
      )}
    </section>
  );
};

/* ===== Page ===== */
const GoalDetail: React.FC = () => {
  return (
    <div className="min-h-screen bg-surface-base text-text-primary">
      <Sidebar />
      <main className="ml-[220px] flex justify-center">
        <div className="w-full max-w-[1000px] px-10 pt-8 pb-16">
          {/* Header */}
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
                <Tooltip content={<StateDotTooltip state="active" lastActivity="today" />}>
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ background: "hsl(var(--state-active))" }}
                  />
                </Tooltip>
                <h1 className="text-[28px] font-medium text-text-primary truncate">
                  Launch YouTube channel
                </h1>
                <span className="ml-3 font-mono text-[11px] uppercase tracking-[0.08em] text-text-tertiary shrink-0">
                  MID-TERM
                </span>
              </div>
              <button className="px-2 py-1 rounded-[4px] text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors text-[16px] leading-none">
                ···
              </button>
            </div>
            <div className="h-2" />
            <div className="font-mono text-[12px] text-text-tertiary">
              Created Jan 15, 2026 · No target date
            </div>
          </div>

          <div className="h-6" />

          {/* Description */}
          <p className="text-[14px] text-text-secondary leading-[1.6]">
            A long-term YouTube channel about creative tools and workflows. Goal is sustained presence and
            meaningful audience, not a viral hit.
          </p>

          <div className="h-14" />
          <SuccessCriteria />

          <div className="h-14" />
          <HeroState />

          <div className="h-14" />
          <ActiveProjectsSection />

          <div className="h-14" />
          <RitualsSection />

          <div className="h-14" />
          <RecentActivity />


          <div className="h-14" />
          <IdeasSection />
        </div>
      </main>
    </div>
  );
};

export default GoalDetail;
