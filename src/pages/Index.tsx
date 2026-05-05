import React from "react";

/* ===== Tokens ===== */
const G1 = "hsl(var(--goal-1))";
const G2 = "hsl(var(--goal-2))";

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
const NAV = ["Home", "Weekly", "All actions", "All projects", "All delegated"];

const Sidebar: React.FC = () => (
  <aside className="fixed left-0 top-0 bottom-0 w-[220px] bg-surface-raised border-r border-border-subtle p-4 flex flex-col">
    <div className="px-1 py-1 text-[17px] font-semibold text-text-primary tracking-tight">ActOS</div>
    <nav className="mt-8 flex flex-col gap-1">
      {NAV.map((item) => {
        const active = item === "Home";
        return (
          <a
            key={item}
            href="#"
            className={`px-2.5 py-1.5 rounded-[4px] text-[13px] transition-colors ${
              active
                ? "bg-surface-hover text-text-primary font-medium"
                : "text-text-secondary font-normal hover:text-text-primary"
            }`}
          >
            {item}
          </a>
        );
      })}
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

/* ===== Hero: Active Goals ===== */
const SPARK_1 = [2, 3, 1, 4, 2, 5, 3, 4, 0, 2, 3, 4];
const SPARK_2 = [3, 4, 2, 3, 5, 4, 3, 2, 1, 0, 0, 0];

const Sparkline: React.FC<{ data: number[]; color: string }> = ({ data, color }) => {
  const max = 5;
  return (
    <div className="w-full h-9 flex items-end gap-[2px]">
      {data.map((v, i) => {
        const h = v === 0 ? 2 : Math.max(2, Math.round((v / max) * 36));
        return (
          <div
            key={i}
            className="flex-1"
            style={{
              height: h,
              background: v === 0 ? "hsl(var(--border-subtle))" : color,
            }}
          />
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
  color: string;
  recent: React.ReactNode;
}> = ({ title, state, type, target, progress, meta, outcome, effort, spark, color, recent }) => (
  <div className="flex-1 px-6 py-1 space-y-4 first:pl-0 last:pr-0">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <span
          className="w-2 h-2 rounded-full shrink-0"
          style={{ background: state === "active" ? "hsl(var(--state-active))" : "hsl(var(--state-stalled))" }}
        />
        <h3 className="text-[18px] font-medium text-text-primary">{title}</h3>
        <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-text-tertiary">{type}</span>
      </div>
      {target && (
        <div className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-tertiary">{target}</div>
      )}
    </div>

    <div className="flex gap-6 items-end">
      <div>
        <div className="font-mono font-medium text-text-primary leading-none" style={{ fontSize: 36 }}>
          {progress}%
        </div>
        <div className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-tertiary mt-2">Progress</div>
      </div>
      <div className="flex-1 flex flex-col gap-1.5 pb-1">
        {meta.map((m, i) => (
          <div key={i} className="font-mono text-[12px] text-text-secondary">
            {m}
          </div>
        ))}
      </div>
    </div>

    <DualBars outcome={outcome} effort={effort} color={color} />

    <div>
      <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-text-tertiary mb-1.5">
        Activity · Last 12 weeks
      </div>
      <Sparkline data={spark} color={color} />
    </div>

    <div className="font-mono text-[11px] text-text-secondary leading-relaxed">{recent}</div>
  </div>
);

const Hero: React.FC = () => (
  <div className="bg-surface-elevated border border-border-subtle rounded-[6px] p-6 flex">
    <GoalColumn
      title="Launch YouTube channel"
      state="active"
      type="MID-TERM"
      progress={47}
      meta={["2 of 3 projects closed", "12 actions done", "Last activity: today"]}
      outcome={47}
      effort={32}
      spark={SPARK_1}
      color={G1}
      recent={<>Recent: ✓ Outline structure · ✓ Set up workspace · ✓ Define content pillars</>}
    />
    <div className="w-px bg-border-subtle self-stretch" />
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
      color={G2}
      recent={
        <>
          Last action <span className="text-text-primary font-medium">9 days ago</span>: Cook batch meals
        </>
      }
    />
  </div>
);

/* ===== Today ===== */
const Today: React.FC = () => (
  <section>
    <SectionLabel meta="3 ACTIONS · 2 RITUALS">Today</SectionLabel>
    <div className="space-y-2">
      {/* Main */}
      <div className="flex items-center gap-3 px-3 py-2 bg-surface-raised rounded-[4px]">
        <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-text-tertiary">MAIN</span>
        <span className="text-[13px] font-medium text-text-primary">Write script for video #1</span>
        <span className="text-[12px] text-text-secondary">· YouTube channel · Shoot video #1</span>
        <div className="flex-1" />
        <TimePill>~90 min</TimePill>
        <Checkbox />
      </div>

      {/* Scheduled rows */}
      {[
        { c: G1, title: "Research thumbnail styles", crumb: "YouTube · Shoot video #1", time: "30m" },
        { c: G1, title: "Buy ring light", crumb: "YouTube · Set up workspace", del: "→ Maria", time: "45m" },
        { c: G2, title: "Plan tomorrow's meals", crumb: "Lose 5 kg · Nutrition plan", time: "20m" },
      ].map((r, i) => (
        <div
          key={i}
          className="flex items-center gap-3 pr-3 h-8 rounded-[2px] hover:bg-surface-hover transition-colors overflow-hidden"
        >
          <Strip color={r.c} />
          <div className="pl-1">
            <Checkbox />
          </div>
          <span className="text-[13px] text-text-primary">{r.title}</span>
          <span className="text-[12px] text-text-secondary">· {r.crumb}</span>
          <div className="flex-1" />
          {r.del && <span className="font-mono text-[11px] text-text-tertiary">{r.del}</span>}
          <TimePill>{r.time}</TimePill>
        </div>
      ))}

      {/* Rituals */}
      <div className="flex gap-6 pt-1">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: G2 }} />
          <span className="text-[13px] text-text-primary">Morning run</span>
          <span className="font-mono text-[11px] text-text-tertiary">Daily · 24 done · ×1.10</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full border" style={{ borderColor: G2 }} />
          <span className="text-[13px] text-text-primary">Evening weight log</span>
          <span className="font-mono text-[11px] text-text-tertiary">Daily · 8 done · ×1.05</span>
        </div>
      </div>

      {/* Quick add */}
      <div className="flex items-center gap-2 bg-surface-raised border border-border-subtle rounded-[4px] px-3 py-2 mt-2">
        <input
          className="flex-1 bg-transparent text-[13px] text-text-primary placeholder:text-text-tertiary focus:outline-none"
          placeholder="Add an action…  ⌘K for command"
        />
        <span className="font-mono text-[11px] text-text-tertiary">⌘K</span>
      </div>
    </div>
  </section>
);

/* ===== Heavy Lift ===== */
const HEAVY = [
  { c: G1, impact: 8, title: "Edit first video draft", crumb: "YouTube · Shoot video #1", time: "~150 min" },
  { c: G1, impact: 7, title: "Outline video #2 series structure", crumb: "YouTube · Shoot video #1", time: "~120 min" },
  { c: G2, impact: 6, title: "Cook batch meals for the week", crumb: "Lose 5 kg · Nutrition plan", time: "~90 min" },
];

const HeavyLift: React.FC = () => (
  <section>
    <SectionLabel meta="HIGH IMPACT · HIGH EFFORT">Heavy lift today</SectionLabel>
    <div className="space-y-1">
      {HEAVY.map((r, i) => (
        <div
          key={i}
          className="flex items-center gap-3 pr-3 min-h-9 rounded-[2px] hover:bg-surface-hover transition-colors overflow-hidden"
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
          <a href="#" className="text-[12px] text-accent hover:text-accent-hover whitespace-nowrap">
            Mark done
          </a>
          <a href="#" className="text-[12px] text-text-secondary hover:text-text-primary whitespace-nowrap">
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

/* ===== Activity Heatmap ===== */
type Cell = { g1: number; g2: number }; // intensity 0-4
const OPACITIES = [0, 0.3, 0.55, 0.8, 1];

function buildHeatmap(): Cell[][] {
  const weeks: Cell[][] = [];
  // seeded pseudo-random
  let seed = 7;
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  for (let w = 0; w < 12; w++) {
    const week: Cell[] = [];
    for (let d = 0; d < 7; d++) {
      const isWeekend = d === 0 || d === 6;
      const weekendActive = isWeekend && rand() > 0.7;
      const weekdayActive = !isWeekend && rand() > 0.25;
      const active = weekendActive || weekdayActive;
      let g1 = 0, g2 = 0;
      if (active) {
        const r = rand();
        if (r < 0.45) g1 = Math.ceil(rand() * 4);
        else if (r < 0.85) g2 = Math.ceil(rand() * 4);
        else { g1 = Math.ceil(rand() * 4); g2 = Math.ceil(rand() * 4); }
      }
      // last 3 weeks: no goal-2
      if (w >= 9) g2 = 0;
      week.push({ g1, g2 });
    }
    weeks.push(week);
  }
  return weeks;
}

const HEATMAP = buildHeatmap();

const HeatCell: React.FC<{ cell: Cell }> = ({ cell }) => {
  const { g1, g2 } = cell;
  if (g1 === 0 && g2 === 0) {
    return (
      <div
        className="w-3 h-3 rounded-[2px] border border-border-subtle"
        style={{ background: "hsl(var(--surface-raised))" }}
      />
    );
  }
  let bg = "";
  if (g1 > 0 && g2 > 0) {
    bg = `linear-gradient(135deg, hsl(var(--goal-1) / ${OPACITIES[g1]}) 50%, hsl(var(--goal-2) / ${OPACITIES[g2]}) 50%)`;
  } else if (g1 > 0) {
    bg = `hsl(var(--goal-1) / ${OPACITIES[g1]})`;
  } else {
    bg = `hsl(var(--goal-2) / ${OPACITIES[g2]})`;
  }
  return <div className="w-3 h-3 rounded-[2px]" style={{ background: bg }} />;
};

const Activity: React.FC = () => (
  <section>
    <SectionLabel meta="LAST 12 WEEKS · ALL GOALS">Activity</SectionLabel>
    <div className="overflow-x-auto">
      <div className="flex gap-[3px]">
        {HEATMAP.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-[3px]">
            {week.map((cell, di) => (
              <HeatCell key={di} cell={cell} />
            ))}
          </div>
        ))}
      </div>
    </div>
    <div className="mt-3 flex items-center gap-4 font-mono text-[11px] text-text-tertiary uppercase tracking-[0.06em]">
      <div className="flex items-center gap-1.5">
        <span className="w-2.5 h-2.5 rounded-[2px]" style={{ background: G1 }} />
        YouTube channel
      </div>
      <div className="flex items-center gap-1.5">
        <span className="w-2.5 h-2.5 rounded-[2px]" style={{ background: G2 }} />
        Lose 5 kg
      </div>
      <div className="ml-auto flex items-center gap-1.5">
        <span>Less</span>
        {[1, 2, 3, 4].map((l) => (
          <span
            key={l}
            className="w-2.5 h-2.5 rounded-[2px]"
            style={{ background: `hsl(var(--text-secondary) / ${OPACITIES[l]})` }}
          />
        ))}
        <span>More</span>
      </div>
    </div>
  </section>
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
        <Today />

        <div className="my-6 border-t border-border-subtle" />
        <HeavyLift />

        <div className="my-6 border-t border-border-subtle" />
        <QuickMoves />

        <div className="my-6 border-t border-border-subtle" />
        <Activity />

        <div className="h-12" />
      </main>
    </div>
  );
};

export default Index;
