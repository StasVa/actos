import { useMemo, useState } from "react";

const GOAL_INKWELL = "#2A3A4A";
const GOAL_OLIVE = "#5C6B4A";

type Cell = { intensity: 0 | 1 | 2 | 3 | 4; colors: string[] };

function generateHeatmap(): Cell[][] {
  // 12 weeks (columns) x 7 days (rows). Deterministic pseudo-random.
  let seed = 7;
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  const weeks: Cell[][] = [];
  for (let w = 0; w < 12; w++) {
    const days: Cell[] = [];
    const weekActivity = rand();
    for (let d = 0; d < 7; d++) {
      const isWeekend = d === 0 || d === 6;
      const r = rand();
      let active = !isWeekend ? r < 0.55 + weekActivity * 0.25 : r < 0.18;
      if (weekActivity < 0.18) active = r < 0.15; // quiet weeks
      if (!active) {
        days.push({ intensity: 0, colors: [] });
        continue;
      }
      const intensity = (Math.min(4, Math.max(1, Math.floor(rand() * 4) + 1)) as 1 | 2 | 3 | 4);
      const which = rand();
      const colors =
        which < 0.45 ? [GOAL_INKWELL] : which < 0.85 ? [GOAL_OLIVE] : [GOAL_INKWELL, GOAL_OLIVE];
      days.push({ intensity, colors });
    }
    weeks.push(days);
  }
  return weeks;
}

const intensityOpacity: Record<number, number> = { 0: 0, 1: 0.3, 2: 0.6, 3: 0.8, 4: 1 };

function Checkbox({
  checked = false,
  onChange,
}: {
  checked?: boolean;
  onChange?: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={checked}
      onClick={() => onChange?.(!checked)}
      className="shrink-0 inline-flex items-center justify-center"
      style={{
        width: 16,
        height: 16,
        border: "1px solid #A09989",
        borderRadius: 2,
        background: checked ? GOAL_INKWELL : "transparent",
      }}
    >
      {checked && (
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
          <path d="M2 5.2L4 7L8 3" stroke="#FAF7F2" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  );
}

function TimePill({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="font-mono text-text-secondary"
      style={{ background: "#F4F0E8", padding: "2px 6px", borderRadius: 2, fontSize: 12, lineHeight: 1.2 }}
    >
      {children}
    </span>
  );
}

function SectionHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <header className="mb-3">
      <h2 style={{ fontSize: 18, fontWeight: 500, lineHeight: 1.3, color: "#1F1A14", letterSpacing: "-0.005em" }}>
        {title}
      </h2>
      {sub && (
        <p className="text-text-secondary" style={{ fontSize: 13, marginTop: 2 }}>
          {sub}
        </p>
      )}
      <div className="mt-3" style={{ height: 1, background: "#E5DFD3" }} />
    </header>
  );
}

function TinyLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="text-text-tertiary"
      style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase" }}
    >
      {children}
    </div>
  );
}

const Home = () => {
  const heatmap = useMemo(generateHeatmap, []);
  const [mainDone, setMainDone] = useState(false);
  const [todayChecks, setTodayChecks] = useState<boolean[]>([false, false, false]);
  const [quickChecks, setQuickChecks] = useState<boolean[]>([false, false, false, false, false]);

  const todayActions = [
    {
      title: "Research thumbnail styles",
      breadcrumb: "YouTube channel · Shoot video #1",
      time: "30m",
    },
    {
      title: "Buy ring light",
      breadcrumb: "YouTube channel · Set up workspace",
      time: "45m",
      delegated: "→ Maria",
    },
    {
      title: "Plan tomorrow's meals",
      breadcrumb: "Lose 5 kg · Nutrition plan",
      time: "20m",
    },
  ];

  const heavyLift = [
    {
      impact: 8,
      title: "Edit first video draft",
      breadcrumb: "YouTube channel · Shoot video #1",
      time: "~150 min",
    },
    {
      impact: 7,
      title: "Outline video #2 series structure",
      breadcrumb: "YouTube channel · Shoot video #1",
      time: "~120 min",
    },
    {
      impact: 6,
      title: "Cook batch meals for the week",
      breadcrumb: "Lose 5 kg · Nutrition plan",
      time: "~90 min",
    },
  ];

  const quickMoves = [
    {
      title: "Send brief to thumbnail designer",
      breadcrumb: "YouTube channel · Shoot video #1",
      impact: 6,
      time: "20m",
      delegated: "→ AI",
    },
    {
      title: "Order resistance bands",
      breadcrumb: "Lose 5 kg · Nutrition plan",
      impact: 5,
      time: "15m",
    },
    {
      title: "Update channel description",
      breadcrumb: "YouTube channel · Set up workspace",
      impact: 5,
      time: "30m",
    },
    {
      title: "Schedule weekly meal prep day",
      breadcrumb: "Lose 5 kg · Nutrition plan",
      impact: 4,
      time: "20m",
    },
    {
      title: "Test new recording mic",
      breadcrumb: "YouTube channel · Shoot video #1",
      impact: 4,
      time: "30m",
    },
  ];

  const recentlyClosed = [
    { title: "Set up workspace", goal: "YouTube channel", color: GOAL_INKWELL, date: "Apr 28", count: 5 },
    { title: "Define content pillars", goal: "YouTube channel", color: GOAL_INKWELL, date: "Apr 22", count: 3 },
    { title: "First grocery overhaul", goal: "Lose 5 kg", color: GOAL_OLIVE, date: "Apr 18", count: 4 },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* HEADER */}
      <header
        className="sticky top-0 z-30 w-full"
        style={{ height: 56, background: "#FAF7F2", borderBottom: "1px solid #E5DFD3" }}
      >
        <div className="h-full mx-auto flex items-center justify-between" style={{ maxWidth: 1100, padding: "0 32px" }}>
          <div className="flex items-center" style={{ gap: 32 }}>
            <a href="#" style={{ fontSize: 18, fontWeight: 600, color: GOAL_INKWELL, letterSpacing: "-0.01em" }}>
              ActOS
            </a>
            <nav className="hidden md:flex items-center" style={{ gap: 20 }}>
              <a
                href="#"
                style={{ fontSize: 14, fontWeight: 500, color: "#1F1A14" }}
              >
                Home
              </a>
              <a
                href="#"
                className="text-text-secondary hover:text-foreground transition-colors"
                style={{ fontSize: 14 }}
              >
                Weekly
              </a>
            </nav>
          </div>

          <div className="hidden md:flex items-center" style={{ gap: 24 }}>
            <a
              href="#"
              className="font-mono text-text-secondary hover:text-foreground hover:underline transition-colors"
              style={{ fontSize: 12 }}
            >
              3 projects closed · 47 actions done
            </a>
            <button
              type="button"
              className="hover:bg-surface-raised transition-colors"
              style={{ fontSize: 14, color: GOAL_INKWELL, padding: "6px 10px", borderRadius: 4 }}
            >
              + Add
            </button>
            <div
              className="flex items-center justify-center font-mono"
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: GOAL_INKWELL,
                color: "#FAF7F2",
                fontSize: 12,
              }}
              aria-label="Account"
            >
              AK
            </div>
          </div>

          {/* Mobile hamburger */}
          <button
            type="button"
            className="md:hidden flex items-center justify-center"
            aria-label="Menu"
            style={{ width: 32, height: 32, borderRadius: 4 }}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M3 6H17M3 10H17M3 14H17" stroke="#1F1A14" strokeWidth="1.25" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </header>

      <main className="mx-auto" style={{ maxWidth: 1100, padding: "32px 32px 48px" }}>
        <h1 className="sr-only">Home — Tuesday, May 5</h1>

        {/* SECTION 1: TODAY */}
        <section style={{ marginBottom: 48 }}>
          <header className="mb-3">
            <h2 style={{ fontSize: 22, fontWeight: 500, color: "#1F1A14", letterSpacing: "-0.01em" }}>
              Tuesday, May 5
            </h2>
            <p className="text-text-secondary" style={{ fontSize: 13, marginTop: 2 }}>
              Execution day
            </p>
            <div className="mt-3" style={{ height: 1, background: "#E5DFD3" }} />
          </header>

          {/* Main task block */}
          <div className="flex items-start justify-between" style={{ gap: 16, paddingBottom: 16 }}>
            <div className="min-w-0">
              <TinyLabel>Main task</TinyLabel>
              <div style={{ fontSize: 16, fontWeight: 500, color: "#1F1A14", marginTop: 4 }}>
                Write script for video #1
              </div>
              <div className="text-text-secondary" style={{ fontSize: 12, marginTop: 2 }}>
                YouTube channel · Shoot video #1 · <span className="font-mono">~90 min</span>
              </div>
            </div>
            <Checkbox checked={mainDone} onChange={setMainDone} />
          </div>

          <div style={{ height: 1, background: "#E5DFD3", margin: "0 0 16px" }} />

          {/* Today's actions */}
          <div style={{ marginBottom: 16 }}>
            <TinyLabel>Today · 3 actions</TinyLabel>
            <ul style={{ marginTop: 8 }}>
              {todayActions.map((a, i) => (
                <li
                  key={a.title}
                  className="flex items-center"
                  style={{
                    gap: 12,
                    padding: "10px 0",
                    borderBottom: i < todayActions.length - 1 ? "1px solid #E5DFD3" : "none",
                  }}
                >
                  <Checkbox
                    checked={todayChecks[i]}
                    onChange={(v) => setTodayChecks((p) => p.map((x, idx) => (idx === i ? v : x)))}
                  />
                  <div className="flex-1 min-w-0">
                    <div style={{ fontSize: 14, fontWeight: 500, color: "#1F1A14" }}>{a.title}</div>
                    <div className="text-text-secondary" style={{ fontSize: 12 }}>
                      {a.breadcrumb}
                    </div>
                  </div>
                  {a.delegated && (
                    <span className="text-text-secondary" style={{ fontSize: 12 }}>
                      {a.delegated}
                    </span>
                  )}
                  <TimePill>{a.time}</TimePill>
                </li>
              ))}
            </ul>
          </div>

          {/* Rituals */}
          <div style={{ marginBottom: 16 }}>
            <TinyLabel>Rituals · 2</TinyLabel>
            <ul style={{ marginTop: 8 }}>
              <li className="flex items-center" style={{ gap: 12, padding: "8px 0", borderBottom: "1px solid #E5DFD3" }}>
                <span
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: "50%",
                    border: `1px solid ${GOAL_OLIVE}`,
                    background: GOAL_OLIVE,
                    display: "inline-block",
                  }}
                />
                <div className="flex-1 min-w-0">
                  <div style={{ fontSize: 14, fontWeight: 500 }}>Morning run</div>
                </div>
                <div className="font-mono text-text-secondary" style={{ fontSize: 12 }}>
                  Daily · 24 done · ×1.10
                </div>
              </li>
              <li className="flex items-center" style={{ gap: 12, padding: "8px 0" }}>
                <span
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: "50%",
                    border: `1px solid ${GOAL_OLIVE}`,
                    background: "transparent",
                    display: "inline-block",
                  }}
                />
                <div className="flex-1 min-w-0">
                  <div style={{ fontSize: 14, fontWeight: 500 }}>Evening weight log</div>
                </div>
                <div className="font-mono text-text-secondary" style={{ fontSize: 12 }}>
                  Daily · 8 done · ×1.05
                </div>
              </li>
            </ul>
          </div>

          {/* Quick add */}
          <input
            type="text"
            placeholder="Add an action…"
            className="w-full bg-surface-raised text-foreground placeholder:text-text-tertiary outline-none focus:border-foreground transition-colors"
            style={{
              border: "1px solid #E5DFD3",
              borderRadius: 4,
              padding: "8px 12px",
              fontSize: 14,
              fontFamily: "inherit",
            }}
          />
        </section>

        {/* SECTION 2: HEAVY LIFT */}
        <section style={{ marginBottom: 48 }}>
          <SectionHeader title="Heavy lift today" sub="High impact, real effort. Tackle these when you have focus." />
          <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: 0 }}>
            {heavyLift.map((c, i) => (
              <div
                key={c.title}
                className="flex flex-col"
                style={{
                  padding: i === 0 ? "0 24px 0 0" : i === heavyLift.length - 1 ? "0 0 0 24px" : "0 24px",
                  borderLeft: i > 0 ? "1px solid #E5DFD3" : "none",
                  paddingTop: 4,
                  paddingBottom: 4,
                  minHeight: 160,
                }}
              >
                <div className="font-mono" style={{ fontSize: 11, color: GOAL_INKWELL, letterSpacing: "0.04em" }}>
                  IMPACT {c.impact}
                </div>
                <div style={{ fontSize: 16, fontWeight: 500, color: "#1F1A14", marginTop: 8, lineHeight: 1.35 }}>
                  {c.title}
                </div>
                <div className="text-text-secondary" style={{ fontSize: 12, marginTop: 6 }}>
                  {c.breadcrumb}
                </div>
                <div className="font-mono text-text-secondary" style={{ fontSize: 12, marginTop: 4 }}>
                  {c.time}
                </div>
                <div className="flex items-center mt-auto" style={{ gap: 16, paddingTop: 16 }}>
                  <button
                    type="button"
                    className="hover:underline"
                    style={{ fontSize: 13, fontWeight: 500, color: GOAL_INKWELL }}
                  >
                    Mark done
                  </button>
                  <button
                    type="button"
                    className="text-text-secondary hover:text-foreground hover:underline transition-colors"
                    style={{ fontSize: 13 }}
                  >
                    Open
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 3: QUICK MOVES */}
        <section style={{ marginBottom: 48 }}>
          <SectionHeader title="Quick moves" sub="High impact, low effort. Do these in spare moments." />
          <ul>
            {quickMoves.map((q, i) => (
              <li
                key={q.title}
                className="group flex items-start hover:bg-surface-raised transition-colors"
                style={{
                  gap: 12,
                  padding: "12px 8px",
                  marginLeft: -8,
                  marginRight: -8,
                  borderBottom: i < quickMoves.length - 1 ? "1px solid #E5DFD3" : "none",
                }}
              >
                <div style={{ paddingTop: 2 }}>
                  <Checkbox
                    checked={quickChecks[i]}
                    onChange={(v) => setQuickChecks((p) => p.map((x, idx) => (idx === i ? v : x)))}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div style={{ fontSize: 14, fontWeight: 500, color: "#1F1A14" }}>{q.title}</div>
                  <div className="text-text-secondary" style={{ fontSize: 12, marginTop: 2 }}>
                    {q.breadcrumb}
                  </div>
                </div>
                <div className="flex items-center font-mono text-text-secondary" style={{ gap: 12, fontSize: 12, paddingTop: 2 }}>
                  {q.delegated && <span>{q.delegated}</span>}
                  <span>IMPACT {q.impact}</span>
                  <span>{q.time}</span>
                  <button
                    type="button"
                    className="opacity-0 group-hover:opacity-100 hover:underline transition-opacity"
                    style={{ color: GOAL_INKWELL }}
                  >
                    Open
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* SECTION 4: ACTIVE GOALS */}
        <section style={{ marginBottom: 48 }}>
          <SectionHeader title="Active goals" />
          <GoalRow
            color={GOAL_INKWELL}
            title="Launch YouTube channel"
            badges={[{ text: "MID-TERM" }]}
            progress="47% · 2 of 3 projects closed"
            outcome={47}
            effort={32}
            footer="Ritual: Weekly project audit · 12 done · ×1.10"
          />
          <div style={{ height: 32 }} />
          <GoalRow
            color={GOAL_OLIVE}
            title="Lose 5 kg"
            badges={[{ text: "SHORT-TERM" }, { text: "TARGET MAY 30" }]}
            progress="33% · 0 of 1 projects closed"
            outcome={33}
            effort={28}
            footer="Rituals: Morning run 24/30 days · Evening weight log 8/30 days"
          />
        </section>

        {/* SECTION 5: ACTIVITY */}
        <section style={{ marginBottom: 48 }}>
          <SectionHeader title="Activity" sub="Last 12 weeks across all goals." />
          <div className="overflow-x-auto">
            <div className="flex" style={{ gap: 2 }}>
              {heatmap.map((week, wi) => (
                <div key={wi} className="flex flex-col" style={{ gap: 2 }}>
                  {week.map((cell, di) => {
                    const size = 12;
                    if (cell.intensity === 0) {
                      return (
                        <div
                          key={di}
                          style={{ width: size, height: size, background: "#FAF7F2", border: "1px solid #E5DFD3" }}
                        />
                      );
                    }
                    const op = intensityOpacity[cell.intensity];
                    if (cell.colors.length === 1) {
                      return (
                        <div
                          key={di}
                          style={{
                            width: size,
                            height: size,
                            background: cell.colors[0],
                            opacity: op,
                          }}
                        />
                      );
                    }
                    // split diagonal
                    return (
                      <div
                        key={di}
                        style={{
                          width: size,
                          height: size,
                          opacity: op,
                          background: `linear-gradient(135deg, ${cell.colors[0]} 0%, ${cell.colors[0]} 50%, ${cell.colors[1]} 50%, ${cell.colors[1]} 100%)`,
                        }}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between mt-4 font-mono text-text-tertiary" style={{ fontSize: 11, gap: 16 }}>
            <div className="flex items-center" style={{ gap: 6 }}>
              <span>Less</span>
              {[0.3, 0.6, 0.8, 1].map((o) => (
                <span key={o} style={{ width: 10, height: 10, background: GOAL_INKWELL, opacity: o, display: "inline-block" }} />
              ))}
              <span>More</span>
            </div>
            <div className="flex items-center" style={{ gap: 16 }}>
              <span className="flex items-center" style={{ gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: GOAL_INKWELL, display: "inline-block" }} />
                Launch YouTube channel
              </span>
              <span className="flex items-center" style={{ gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: GOAL_OLIVE, display: "inline-block" }} />
                Lose 5 kg
              </span>
            </div>
          </div>
        </section>

        {/* SECTION 6: RECENTLY CLOSED */}
        <section style={{ marginBottom: 32 }}>
          <SectionHeader title="Recently closed" sub="Last 5 completed projects." />
          <ul>
            {recentlyClosed.map((p) => (
              <li
                key={p.title}
                className="flex items-center"
                style={{ gap: 12, padding: "12px 0", borderBottom: "1px solid #E5DFD3" }}
              >
                <span style={{ width: 8, height: 8, background: p.color, display: "inline-block" }} />
                <div className="flex-1 min-w-0">
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{p.title}</div>
                  <div className="text-text-secondary" style={{ fontSize: 12 }}>
                    {p.goal} · Closed <span className="font-mono">{p.date}</span> ·{" "}
                    <span className="font-mono">{p.count} actions</span>, all done
                  </div>
                </div>
                <a
                  href="#"
                  className="text-text-secondary hover:text-foreground hover:underline transition-colors"
                  style={{ fontSize: 12 }}
                >
                  View
                </a>
              </li>
            ))}
          </ul>
        </section>

        {/* SECTION 7: DELEGATED LINE */}
        <p className="text-text-secondary" style={{ fontSize: 13, marginBottom: 32 }}>
          <span className="font-mono">2</span> actions delegated ·{" "}
          <a href="#" className="hover:text-foreground hover:underline transition-colors">
            View all
          </a>
        </p>
      </main>

      {/* FOOTER */}
      <footer style={{ borderTop: "1px solid #E5DFD3" }}>
        <div
          className="mx-auto grid grid-cols-1 md:grid-cols-3 font-mono text-text-tertiary"
          style={{ maxWidth: 1100, padding: "24px 32px", fontSize: 12, gap: 12 }}
        >
          <div>ActOS</div>
          <div className="md:text-center flex md:justify-center flex-wrap" style={{ gap: 12 }}>
            {["All actions", "All projects", "All delegated", "Weekly", "Settings"].map((l, i, arr) => (
              <span key={l}>
                <a href="#" className="hover:text-text-secondary transition-colors">
                  {l}
                </a>
                {i < arr.length - 1 && <span style={{ marginLeft: 12 }}>·</span>}
              </span>
            ))}
          </div>
          <div className="md:text-right">
            <a href="#" className="hover:text-text-secondary transition-colors">
              Help
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

function GoalRow({
  color,
  title,
  badges,
  progress,
  outcome,
  effort,
  footer,
}: {
  color: string;
  title: string;
  badges: { text: string }[];
  progress: string;
  outcome: number;
  effort: number;
  footer: string;
}) {
  return (
    <div className="flex" style={{ gap: 12 }}>
      <span style={{ width: 8, height: 8, background: color, display: "inline-block", marginTop: 10, flexShrink: 0 }} />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between flex-wrap" style={{ gap: 12 }}>
          <div className="flex items-baseline flex-wrap" style={{ gap: 12 }}>
            <h3 style={{ fontSize: 18, fontWeight: 500, color: "#1F1A14" }}>{title}</h3>
            {badges.map((b) => (
              <span
                key={b.text}
                className="font-mono text-text-tertiary"
                style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase" }}
              >
                {b.text}
              </span>
            ))}
          </div>
          <div className="font-mono text-text-secondary" style={{ fontSize: 12 }}>
            {progress}
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          <ProgressBar label="OUTCOME" value={outcome} color={color} opacity={1} />
          <div style={{ height: 4 }} />
          <ProgressBar label="EFFORT" value={effort} color={color} opacity={0.6} />
        </div>

        <div className="text-text-secondary" style={{ fontSize: 12, marginTop: 10 }}>
          {footer}
        </div>
      </div>
    </div>
  );
}

function ProgressBar({
  label,
  value,
  color,
  opacity,
}: {
  label: string;
  value: number;
  color: string;
  opacity: number;
}) {
  return (
    <div className="flex items-center" style={{ gap: 10 }}>
      <span
        className="font-mono text-text-tertiary"
        style={{ fontSize: 10, letterSpacing: "0.08em", width: 56, flexShrink: 0 }}
      >
        {label}
      </span>
      <div className="flex-1" style={{ height: 4, background: "#E5DFD3", position: "relative" }}>
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: `${value}%`,
            background: color,
            opacity,
          }}
        />
      </div>
    </div>
  );
}

export default Home;
