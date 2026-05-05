import { useMemo, useState } from "react";

const GOAL_INKWELL = "#2A3A4A";
const GOAL_OLIVE = "#5C6B4A";
const SURFACE_BASE = "#FAF7F2";
const SURFACE_RAISED = "#F4F0E8";
const HAIRLINE = "#E5DFD3";
const TEXT_PRIMARY = "#1F1A14";
const TEXT_SECONDARY = "#6B6358";
const TEXT_TERTIARY = "#A09989";

type Cell = { intensity: 0 | 1 | 2 | 3 | 4; colors: string[] };

function generateHeatmap(): Cell[][] {
  let seed = 11;
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
      if (weekActivity < 0.18) active = r < 0.15;
      if (!active) {
        days.push({ intensity: 0, colors: [] });
        continue;
      }
      const intensity = Math.min(4, Math.max(1, Math.floor(rand() * 4) + 1)) as 1 | 2 | 3 | 4;
      const which = rand();
      const colors =
        which < 0.45 ? [GOAL_INKWELL] : which < 0.85 ? [GOAL_OLIVE] : [GOAL_INKWELL, GOAL_OLIVE];
      days.push({ intensity, colors });
    }
    weeks.push(days);
  }
  return weeks;
}

const intensityOpacity: Record<number, number> = { 0: 0, 1: 0.3, 2: 0.5, 3: 0.75, 4: 1 };

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
        border: `1px solid ${TEXT_TERTIARY}`,
        borderRadius: 2,
        background: checked ? GOAL_INKWELL : "transparent",
      }}
    >
      {checked && (
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
          <path d="M2 5.2L4 7L8 3" stroke={SURFACE_BASE} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  );
}

function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{ fontSize: 18, fontWeight: 500, color: TEXT_PRIMARY, letterSpacing: "-0.005em", lineHeight: 1.3 }}>
      {children}
    </h2>
  );
}

function TinyLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 11,
        fontWeight: 500,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: TEXT_TERTIARY,
      }}
    >
      {children}
    </div>
  );
}

function TimePill({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="font-mono"
      style={{
        background: SURFACE_BASE,
        padding: "2px 6px",
        borderRadius: 2,
        fontSize: 12,
        lineHeight: 1.2,
        color: TEXT_SECONDARY,
        border: `1px solid ${HAIRLINE}`,
      }}
    >
      {children}
    </span>
  );
}

const navItems = [
  { label: "Home", active: true },
  { label: "Weekly" },
  { label: "All actions" },
  { label: "All projects" },
  { label: "All delegated" },
];

const Home = () => {
  const heatmap = useMemo(generateHeatmap, []);
  const [mainDone, setMainDone] = useState(false);
  const [todayChecks, setTodayChecks] = useState([false, false, false]);
  const [quickChecks, setQuickChecks] = useState([false, false, false, false, false]);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const todayActions = [
    { title: "Research thumbnail styles", breadcrumb: "YouTube channel · Shoot video #1", time: "30m" },
    { title: "Buy ring light", breadcrumb: "YouTube channel · Set up workspace", time: "45m", delegated: "→ Maria" },
    { title: "Plan tomorrow's meals", breadcrumb: "Lose 5 kg · Nutrition plan", time: "20m" },
  ];

  const heavyLift = [
    { impact: 8, time: "~150 min", title: "Edit first video draft", breadcrumb: "YouTube channel · Shoot video #1" },
    { impact: 7, time: "~120 min", title: "Outline video #2 series structure", breadcrumb: "YouTube channel · Shoot video #1" },
    { impact: 6, time: "~90 min", title: "Cook batch meals for the week", breadcrumb: "Lose 5 kg · Nutrition plan" },
  ];

  const quickMoves = [
    { title: "Send brief to thumbnail designer", breadcrumb: "YouTube channel · Shoot video #1", impact: 6, time: "20m", delegated: "→ AI" },
    { title: "Order resistance bands", breadcrumb: "Lose 5 kg · Nutrition plan", impact: 5, time: "15m" },
    { title: "Update channel description", breadcrumb: "YouTube channel · Set up workspace", impact: 5, time: "30m" },
    { title: "Schedule weekly meal prep day", breadcrumb: "Lose 5 kg · Nutrition plan", impact: 4, time: "20m" },
    { title: "Test new recording mic", breadcrumb: "YouTube channel · Shoot video #1", impact: 4, time: "30m" },
  ];

  const goals = [
    {
      color: GOAL_INKWELL,
      title: "Launch YouTube channel",
      type: "MID-TERM",
      progress: "47% · 2 of 3 projects",
      outcome: 47,
      effort: 32,
      ritual: "Weekly audit · 12 done · ×1.10",
    },
    {
      color: GOAL_OLIVE,
      title: "Lose 5 kg",
      type: "SHORT-TERM",
      progress: "33% · 0 of 1 projects",
      outcome: 33,
      effort: 28,
      ritual: "Morning run 24/30 · Weight log 8/30",
    },
  ];

  const recentlyClosed = [
    { title: "Set up workspace", color: GOAL_INKWELL, sub: "YouTube channel · Apr 28 · 5 actions" },
    { title: "Define content pillars", color: GOAL_INKWELL, sub: "YouTube channel · Apr 22 · 3 actions" },
    { title: "First grocery overhaul", color: GOAL_OLIVE, sub: "Lose 5 kg · Apr 18 · 4 actions" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: SURFACE_BASE, color: TEXT_PRIMARY }}>
      {/* MOBILE TOP BAR */}
      <div
        className="md:hidden sticky top-0 z-40 flex items-center justify-between"
        style={{ height: 48, background: SURFACE_RAISED, borderBottom: `1px solid ${HAIRLINE}`, padding: "0 16px" }}
      >
        <span style={{ fontSize: 18, fontWeight: 600, color: GOAL_INKWELL }}>ActOS</span>
        <button
          type="button"
          aria-label="Menu"
          onClick={() => setMobileNavOpen((v) => !v)}
          style={{ width: 32, height: 32, borderRadius: 4, display: "inline-flex", alignItems: "center", justifyContent: "center" }}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M3 6H17M3 10H17M3 14H17" stroke={TEXT_PRIMARY} strokeWidth="1.25" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {mobileNavOpen && (
        <nav
          className="md:hidden"
          style={{ background: SURFACE_RAISED, borderBottom: `1px solid ${HAIRLINE}`, padding: 12 }}
        >
          {navItems.map((it) => (
            <a
              key={it.label}
              href="#"
              style={{
                display: "block",
                padding: "8px 12px",
                borderRadius: 4,
                color: it.active ? TEXT_PRIMARY : TEXT_SECONDARY,
                fontWeight: it.active ? 500 : 400,
                background: it.active ? SURFACE_BASE : "transparent",
                fontSize: 14,
              }}
            >
              {it.label}
            </a>
          ))}
        </nav>
      )}

      {/* SIDEBAR (desktop) */}
      <aside
        className="hidden md:flex flex-col"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          width: 220,
          background: SURFACE_RAISED,
          borderRight: `1px solid ${HAIRLINE}`,
          padding: 16,
          paddingTop: 32,
        }}
      >
        <div style={{ padding: "0 12px", marginBottom: 40 }}>
          <span style={{ fontSize: 18, fontWeight: 600, color: GOAL_INKWELL, letterSpacing: "-0.01em" }}>ActOS</span>
        </div>

        <nav className="flex flex-col" style={{ gap: 4 }}>
          {navItems.map((it) => (
            <a
              key={it.label}
              href="#"
              className="transition-colors"
              style={{
                padding: "8px 12px",
                borderRadius: 4,
                fontSize: 14,
                color: it.active ? TEXT_PRIMARY : TEXT_SECONDARY,
                fontWeight: it.active ? 500 : 400,
                background: it.active ? SURFACE_BASE : "transparent",
              }}
              onMouseEnter={(e) => {
                if (!it.active) e.currentTarget.style.color = TEXT_PRIMARY;
              }}
              onMouseLeave={(e) => {
                if (!it.active) e.currentTarget.style.color = TEXT_SECONDARY;
              }}
            >
              {it.label}
            </a>
          ))}
        </nav>

        <div style={{ flexGrow: 1 }} />

        <div className="flex flex-col" style={{ gap: 16 }}>
          <button
            type="button"
            style={{
              background: GOAL_INKWELL,
              color: SURFACE_BASE,
              padding: "8px 12px",
              borderRadius: 4,
              fontWeight: 500,
              fontSize: 14,
              width: "100%",
              textAlign: "center",
            }}
          >
            + Quick add
          </button>

          <div className="font-mono" style={{ fontSize: 11, color: TEXT_SECONDARY, lineHeight: 1.5, padding: "0 4px" }}>
            <div>3 projects closed</div>
            <div>47 actions done</div>
          </div>

          <button
            type="button"
            className="flex items-center transition-colors"
            style={{ gap: 8, padding: 4, borderRadius: 4, width: "100%", textAlign: "left" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = SURFACE_BASE)}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <span
              className="font-mono"
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: GOAL_INKWELL,
                color: SURFACE_BASE,
                fontSize: 11,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              AK
            </span>
            <span
              style={{
                fontSize: 12,
                color: TEXT_SECONDARY,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              ak@email
            </span>
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main
        className="md:ml-[220px]"
        style={{ padding: "32px 40px 48px" }}
      >
        <MainPadding>
          {/* Page header */}
          <header style={{ marginBottom: 24 }}>
            <h1 style={{ fontSize: 22, fontWeight: 500, color: TEXT_PRIMARY, letterSpacing: "-0.01em" }}>
              Tuesday, May 5
            </h1>
            <p style={{ fontSize: 13, color: TEXT_SECONDARY, marginTop: 2 }}>Execution day</p>
            <div style={{ height: 1, background: HAIRLINE, marginTop: 16 }} />
          </header>

          {/* Two columns */}
          <div className="flex flex-col lg:flex-row" style={{ gap: 40 }}>
            {/* LEFT */}
            <div className="flex-1" style={{ maxWidth: 720, minWidth: 0 }}>
              {/* TODAY */}
              <section>
                <H2>Today</H2>
                <div style={{ height: 1, background: HAIRLINE, margin: "12px 0 16px" }} />

                {/* Main task */}
                <div className="flex items-start justify-between" style={{ gap: 16, marginBottom: 16 }}>
                  <div className="min-w-0">
                    <TinyLabel>Main task</TinyLabel>
                    <div style={{ fontSize: 16, fontWeight: 500, marginTop: 4 }}>Write script for video #1</div>
                    <div style={{ fontSize: 12, color: TEXT_SECONDARY, marginTop: 2 }}>
                      YouTube channel · Shoot video #1 · <span className="font-mono">~90 min</span>
                    </div>
                  </div>
                  <Checkbox checked={mainDone} onChange={setMainDone} />
                </div>

                {/* Today actions */}
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
                          borderBottom: i < todayActions.length - 1 ? `1px solid ${HAIRLINE}` : "none",
                        }}
                      >
                        <Checkbox
                          checked={todayChecks[i]}
                          onChange={(v) => setTodayChecks((p) => p.map((x, idx) => (idx === i ? v : x)))}
                        />
                        <div className="flex-1 min-w-0">
                          <div style={{ fontSize: 14, fontWeight: 500 }}>{a.title}</div>
                          <div style={{ fontSize: 12, color: TEXT_SECONDARY }}>{a.breadcrumb}</div>
                        </div>
                        {a.delegated && (
                          <span style={{ fontSize: 12, color: TEXT_SECONDARY }}>{a.delegated}</span>
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
                    <li
                      className="flex items-center"
                      style={{ gap: 12, padding: "8px 0", borderBottom: `1px solid ${HAIRLINE}` }}
                    >
                      <span
                        style={{
                          width: 12,
                          height: 12,
                          borderRadius: "50%",
                          border: `1px solid ${GOAL_OLIVE}`,
                          background: GOAL_OLIVE,
                          display: "inline-block",
                          flexShrink: 0,
                        }}
                      />
                      <div className="flex-1 min-w-0" style={{ fontSize: 14, fontWeight: 500 }}>
                        Morning run
                      </div>
                      <div className="font-mono" style={{ fontSize: 12, color: TEXT_SECONDARY }}>
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
                          flexShrink: 0,
                        }}
                      />
                      <div className="flex-1 min-w-0" style={{ fontSize: 14, fontWeight: 500 }}>
                        Evening weight log
                      </div>
                      <div className="font-mono" style={{ fontSize: 12, color: TEXT_SECONDARY }}>
                        Daily · 8 done · ×1.05
                      </div>
                    </li>
                  </ul>
                </div>

                {/* Quick add */}
                <input
                  type="text"
                  placeholder="Add an action…"
                  className="w-full outline-none transition-colors"
                  style={{
                    background: SURFACE_BASE,
                    border: `1px solid ${HAIRLINE}`,
                    borderRadius: 4,
                    padding: "8px 12px",
                    fontSize: 14,
                    fontFamily: "inherit",
                    color: TEXT_PRIMARY,
                  }}
                />
              </section>

              <Divider />

              {/* HEAVY LIFT */}
              <section>
                <H2>Heavy lift today</H2>
                <p style={{ fontSize: 12, color: TEXT_SECONDARY, marginTop: 2 }}>High impact, real effort.</p>
                <div style={{ height: 1, background: HAIRLINE, margin: "12px 0 16px" }} />

                <ul>
                  {heavyLift.map((c, i) => (
                    <li
                      key={c.title}
                      style={{
                        padding: "12px 0",
                        borderBottom: i < heavyLift.length - 1 ? `1px solid ${HAIRLINE}` : "none",
                      }}
                    >
                      <div className="flex items-center justify-between" style={{ gap: 12 }}>
                        <span
                          className="font-mono"
                          style={{ fontSize: 11, color: GOAL_INKWELL, letterSpacing: "0.04em" }}
                        >
                          IMPACT {c.impact}
                        </span>
                        <span className="font-mono" style={{ fontSize: 12, color: TEXT_SECONDARY }}>
                          {c.time}
                        </span>
                      </div>
                      <div style={{ fontSize: 16, fontWeight: 500, marginTop: 6 }}>{c.title}</div>
                      <div style={{ fontSize: 12, color: TEXT_SECONDARY, marginTop: 2 }}>{c.breadcrumb}</div>
                      <div className="flex items-center" style={{ gap: 16, marginTop: 10 }}>
                        <button
                          type="button"
                          className="hover:underline"
                          style={{ fontSize: 13, fontWeight: 500, color: GOAL_INKWELL }}
                        >
                          Mark done
                        </button>
                        <button
                          type="button"
                          className="hover:underline transition-colors"
                          style={{ fontSize: 13, color: TEXT_SECONDARY }}
                        >
                          Open
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>

              <Divider />

              {/* QUICK MOVES */}
              <section>
                <H2>Quick moves</H2>
                <p style={{ fontSize: 12, color: TEXT_SECONDARY, marginTop: 2 }}>High impact, low effort.</p>
                <div style={{ height: 1, background: HAIRLINE, margin: "12px 0 8px" }} />

                <ul>
                  {quickMoves.map((q, i) => (
                    <li
                      key={q.title}
                      className="flex items-start"
                      style={{
                        gap: 12,
                        padding: "8px 0",
                        borderBottom: i < quickMoves.length - 1 ? `1px solid ${HAIRLINE}` : "none",
                      }}
                    >
                      <div style={{ paddingTop: 2 }}>
                        <Checkbox
                          checked={quickChecks[i]}
                          onChange={(v) => setQuickChecks((p) => p.map((x, idx) => (idx === i ? v : x)))}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div style={{ fontSize: 14, fontWeight: 500 }}>
                          {q.title}
                          {q.delegated && (
                            <span style={{ color: TEXT_SECONDARY, fontWeight: 400, marginLeft: 8 }}>
                              {q.delegated}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 12, color: TEXT_SECONDARY, marginTop: 2 }}>{q.breadcrumb}</div>
                      </div>
                      <span
                        className="font-mono"
                        style={{ fontSize: 12, color: TEXT_SECONDARY, paddingTop: 2, whiteSpace: "nowrap" }}
                      >
                        IMPACT {q.impact} · {q.time}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            </div>

            {/* RIGHT */}
            <aside className="w-full lg:w-[320px] lg:shrink-0">
              {/* ACTIVE GOALS */}
              <section>
                <H2>Active goals</H2>
                <div style={{ height: 1, background: HAIRLINE, margin: "12px 0 16px" }} />

                {goals.map((g, i) => (
                  <div
                    key={g.title}
                    style={{
                      paddingBottom: 16,
                      marginBottom: i < goals.length - 1 ? 24 : 0,
                      borderBottom: i < goals.length - 1 ? `1px solid ${HAIRLINE}` : "none",
                    }}
                  >
                    <div className="flex items-center" style={{ gap: 8, flexWrap: "wrap" }}>
                      <span style={{ width: 8, height: 8, background: g.color, display: "inline-block" }} />
                      <span style={{ fontSize: 14, fontWeight: 500 }}>{g.title}</span>
                      <span
                        className="font-mono"
                        style={{
                          fontSize: 11,
                          color: TEXT_TERTIARY,
                          letterSpacing: "0.08em",
                        }}
                      >
                        {g.type}
                      </span>
                    </div>
                    <div className="font-mono" style={{ fontSize: 12, color: TEXT_SECONDARY, marginTop: 6 }}>
                      {g.progress}
                    </div>

                    <div style={{ marginTop: 10 }}>
                      <CompactBar label="OUT" value={g.outcome} color={g.color} opacity={1} />
                      <div style={{ height: 3 }} />
                      <CompactBar label="EFF" value={g.effort} color={g.color} opacity={0.6} />
                    </div>

                    <div style={{ fontSize: 12, color: TEXT_SECONDARY, marginTop: 10 }}>{g.ritual}</div>
                  </div>
                ))}
              </section>

              <Divider />

              {/* RECENTLY CLOSED */}
              <section>
                <H2>Recently closed</H2>
                <div style={{ height: 1, background: HAIRLINE, margin: "12px 0 4px" }} />

                <ul>
                  {recentlyClosed.map((p, i) => (
                    <li
                      key={p.title}
                      style={{
                        padding: "8px 0",
                        borderBottom: i < recentlyClosed.length - 1 ? `1px solid ${HAIRLINE}` : "none",
                      }}
                    >
                      <div className="flex items-center" style={{ gap: 8 }}>
                        <span style={{ width: 8, height: 8, background: p.color, display: "inline-block" }} />
                        <span style={{ fontSize: 14, fontWeight: 500 }}>{p.title}</span>
                      </div>
                      <div style={{ fontSize: 12, color: TEXT_SECONDARY, marginTop: 2, marginLeft: 16 }}>{p.sub}</div>
                    </li>
                  ))}
                </ul>
              </section>

              <Divider />

              {/* DELEGATED */}
              <section>
                <div style={{ fontSize: 14, color: TEXT_SECONDARY }}>
                  Delegated · <span className="font-mono">2</span> actions
                </div>
                <a
                  href="#"
                  className="hover:underline transition-colors"
                  style={{ fontSize: 12, color: GOAL_INKWELL, marginTop: 4, display: "inline-block" }}
                >
                  View all →
                </a>
              </section>
            </aside>
          </div>

          {/* ACTIVITY full width */}
          <div style={{ marginTop: 32 }}>
            <section>
              <H2>Activity</H2>
              <p style={{ fontSize: 12, color: TEXT_SECONDARY, marginTop: 2 }}>Last 12 weeks across all goals.</p>
              <div style={{ height: 1, background: HAIRLINE, margin: "12px 0 16px" }} />

              <div className="overflow-x-auto">
                <div className="flex" style={{ gap: 3 }}>
                  {heatmap.map((week, wi) => (
                    <div key={wi} className="flex flex-col" style={{ gap: 3 }}>
                      {week.map((cell, di) => {
                        const size = 14;
                        if (cell.intensity === 0) {
                          return (
                            <div
                              key={di}
                              style={{
                                width: size,
                                height: size,
                                background: SURFACE_BASE,
                                border: `1px solid ${HAIRLINE}`,
                              }}
                            />
                          );
                        }
                        const op = intensityOpacity[cell.intensity];
                        if (cell.colors.length === 1) {
                          return (
                            <div
                              key={di}
                              style={{ width: size, height: size, background: cell.colors[0], opacity: op }}
                            />
                          );
                        }
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

              <div
                className="flex flex-wrap items-center justify-between font-mono"
                style={{ fontSize: 11, color: TEXT_TERTIARY, gap: 16, marginTop: 16 }}
              >
                <div className="flex items-center" style={{ gap: 6 }}>
                  <span>Less</span>
                  {[0.3, 0.5, 0.75, 1].map((o) => (
                    <span
                      key={o}
                      style={{ width: 12, height: 12, background: GOAL_INKWELL, opacity: o, display: "inline-block" }}
                    />
                  ))}
                  <span>More</span>
                </div>
                <div className="flex items-center" style={{ gap: 16 }}>
                  <span className="flex items-center" style={{ gap: 6 }}>
                    <span style={{ width: 8, height: 8, background: GOAL_INKWELL, display: "inline-block" }} />
                    Launch YouTube channel
                  </span>
                  <span className="flex items-center" style={{ gap: 6 }}>
                    <span style={{ width: 8, height: 8, background: GOAL_OLIVE, display: "inline-block" }} />
                    Lose 5 kg
                  </span>
                </div>
              </div>
            </section>
          </div>
        </MainPadding>
      </main>
    </div>
  );
};

function MainPadding({ children }: { children: React.ReactNode }) {
  // Mobile padding override
  return (
    <div className="max-md:!px-0" style={{ width: "100%" }}>
      <style>{`@media (max-width: 767px) { main { padding: 16px !important; } }`}</style>
      {children}
    </div>
  );
}

function Divider() {
  return <div style={{ height: 1, background: HAIRLINE, margin: "32px 0" }} />;
}

function CompactBar({
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
    <div className="flex items-center" style={{ gap: 8 }}>
      <span
        className="font-mono"
        style={{
          fontSize: 9,
          letterSpacing: "0.08em",
          color: TEXT_TERTIARY,
          width: 22,
          flexShrink: 0,
        }}
      >
        {label}
      </span>
      <div className="flex-1" style={{ height: 3, background: HAIRLINE, position: "relative" }}>
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
