import React from "react";
import { Link } from "react-router-dom";
import { Tooltip, StateDotTooltip } from "@/components/Tooltip";

const G1 = "hsl(var(--goal-1))";

/* ===== Sidebar (mirrors Goal page) ===== */
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

/* ===== Action row primitives ===== */
const Check: React.FC<{ done?: boolean }> = ({ done }) => (
  <span
    className="inline-flex items-center justify-center w-4 h-4 rounded-[2px] shrink-0"
    style={{
      border: done ? "none" : "1px solid hsl(var(--text-tertiary))",
      background: done ? G1 : "transparent",
      color: "hsl(var(--surface-base))",
      fontSize: 10,
      lineHeight: 1,
    }}
  >
    {done ? "✓" : ""}
  </span>
);

type ActiveAction = {
  kind: "planned" | "backlog";
  title: string;
  date?: string;
  impact?: number;
  time?: string;
};

const ACTIVE: ActiveAction[] = [
  { kind: "planned", title: "Record talking-head intro", date: "TOMORROW" },
  { kind: "backlog", title: "Edit first video draft", impact: 8, time: "2h 30m" },
  { kind: "backlog", title: "Outline video #2 series structure", impact: 7, time: "2h" },
];

const ActionRow: React.FC<{ a: ActiveAction }> = ({ a }) => (
  <div className="group flex items-center gap-3 h-9 px-3 border-b border-border-subtle hover:bg-surface-hover transition-colors">
    <Check />
    {a.date && (
      <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-text-secondary bg-surface-hover px-1.5 py-0.5 rounded-[2px]">
        {a.date}
      </span>
    )}
    <span className="text-[13px] font-medium text-text-primary truncate">{a.title}</span>
    <div className="flex-1" />
    {a.impact !== undefined && (
      <span className="font-mono text-[11px] text-text-secondary">I{a.impact}</span>
    )}
    {a.time && <span className="font-mono text-[11px] text-text-secondary">{a.time}</span>}
    <span className="opacity-0 group-hover:opacity-100 transition-opacity font-mono text-[11px] text-text-tertiary hover:text-text-secondary cursor-pointer">
      Edit
    </span>
    <span className="opacity-0 group-hover:opacity-100 transition-opacity font-mono text-[11px] text-text-tertiary hover:text-text-secondary cursor-pointer">
      ···
    </span>
  </div>
);

/* ===== Right column sections ===== */
const StatusBlock: React.FC = () => {
  const rows: [string, React.ReactNode][] = [
    [
      "STATUS",
      <span className="inline-flex items-center gap-1.5">
        <Tooltip content={<StateDotTooltip state="active" lastActivity="today" />}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: "hsl(var(--status-done))" }} />
        </Tooltip>
        Active
      </span>,
    ],
    [
      "PARENT GOAL",
      <Link to="/goals/launch-youtube-channel" className="inline-flex items-center gap-1.5 hover:text-accent transition-colors">
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: G1 }} />
        Launch YouTube channel
      </Link>,
    ],
    ["CREATED", "Apr 12, 2026"],
    ["AGE", "23 days"],
  ];
  return (
    <div>
      {rows.map(([k, v], i) => (
        <div
          key={i}
          className={`flex items-center justify-between h-6 ${i < rows.length - 1 ? "border-b border-border-subtle" : ""}`}
        >
          <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-text-tertiary">{k}</span>
          <span className="text-[12px] text-text-primary">{v}</span>
        </div>
      ))}
    </div>
  );
};

/* Unified state row */
const StateRow: React.FC<{
  label: string;
  value: React.ReactNode;
  pct: number;
  opacity?: number;
  isLast?: boolean;
}> = ({ label, value, pct, opacity = 1, isLast }) => (
  <div
    className={`h-8 flex items-center gap-3 py-1.5 ${isLast ? "" : "border-b border-border-subtle"}`}
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

const StateBlock: React.FC = () => (
  <div>
    <h3 className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-secondary mb-3">
      State
    </h3>
    <div>
      <StateRow
        label="OUTCOME"
        value={<span className="font-mono text-[14px] text-text-primary tabular-nums">43%</span>}
        pct={43}
      />
      <StateRow
        label="EFFORT"
        value={<span className="font-mono text-[14px] text-text-primary tabular-nums">38%</span>}
        pct={38}
        opacity={0.6}
      />
      <StateRow
        label="TIME"
        value={
          <span className="font-mono tabular-nums">
            <span className="text-[14px] text-text-primary">6h</span>
            <span className="text-text-tertiary"> / </span>
            <span className="text-[12px] text-text-secondary">11h 30m</span>
          </span>
        }
        pct={52}
        isLast
      />
    </div>
    <p className="mt-2 font-mono text-[11px] text-text-tertiary">
      Effort discounts delegated work to 20%.
    </p>
  </div>
);

const References: React.FC = () => {
  const refs = [
    { title: "Competitor analysis doc", url: "docs.google.com/..." },
    { title: "Audience research notes", url: "notion.so/audience-research" },
    { title: "Storyboard reference", url: "youtube.com/watch?v=..." },
  ];
  return (
    <div>
      <div className="flex items-center justify-between">
        <h3 className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-secondary">
          References · 3
        </h3>
        <a className="text-[12px] text-text-secondary hover:text-text-primary hover:underline cursor-pointer">+ Add</a>
      </div>
      <div className="mt-2">
        {refs.map((r, i) => (
          <div
            key={i}
            className={`py-1.5 ${i < refs.length - 1 ? "border-b border-border-subtle" : ""}`}
          >
            <div className="flex items-center gap-1.5">
              <span className="text-text-tertiary text-[11px]">↗</span>
              <span className="text-[12px] text-text-primary truncate hover:text-accent cursor-pointer">
                {r.title}
              </span>
            </div>
            <div className="mt-0.5 ml-4 font-mono text-[10px] text-text-tertiary truncate">{r.url}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ===== Page ===== */
const ProjectDetail: React.FC = () => {
  return (
    <div className="min-h-screen bg-surface-base text-text-primary">
      <Sidebar />
      <div className="ml-[220px] min-h-screen flex">
        {/* Left column */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Header bar (left part) */}
          <div className="h-12 px-8 flex items-center justify-between border-b border-border-subtle">
            <Link
              to="/goals/launch-youtube-channel"
              className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-tertiary hover:text-text-secondary transition-colors"
            >
              ← LAUNCH YOUTUBE CHANNEL · PROJECTS
            </Link>
            <span
              className="font-mono text-[10px] uppercase tracking-[0.08em] px-2 py-1 rounded-[4px] bg-surface-hover"
              style={{ color: "hsl(var(--status-done))" }}
            >
              ACTIVE
            </span>
          </div>

          <div className="px-10 py-8 space-y-8">
            {/* Section A: Title + info */}
            <section>
              <h1 className="text-[24px] font-medium text-text-primary">Shoot video #1</h1>
              <div className="mt-2 font-mono text-[12px] text-text-tertiary tabular-nums">
                Created Apr 12 · 23 days active · 3 of 7 actions done
              </div>
              <div className="mt-3 font-mono text-[12px] text-text-tertiary">
                <span>PROGRESS </span>
                <span className="text-text-primary">43%</span>
                <span> · OUTCOME </span>
                <span className="text-text-primary">43%</span>
                <span> · EFFORT </span>
                <span className="text-text-primary">38%</span>
                <span> · LAST ACTIVITY </span>
                <span className="text-text-primary">today</span>
              </div>
              <div className="mt-2 h-1.5 w-full bg-surface-hover rounded-[4px] overflow-hidden">
                <div className="h-full rounded-[4px]" style={{ width: "43%", background: G1 }} />
              </div>
            </section>

            {/* Section B: Description */}
            <section>
              <h2 className="text-[12px] font-medium uppercase tracking-[0.08em] text-text-secondary mb-2">
                Description
              </h2>
              <div className="bg-surface-raised border border-border-subtle rounded-[6px] p-6 min-h-[200px]">
                <p className="text-[14px] text-text-primary leading-[1.6]">
                  First video for the channel. Topic: 'How I stopped using 12 productivity apps and started using 2'. Personal angle, conversational tone, 8-10 minutes.
                </p>
                <h3 className="mt-2 text-[16px] font-semibold text-text-primary">Working notes</h3>
                <p className="mt-2 text-[14px] text-text-primary leading-[1.6]">
                  Shooting locked for next Saturday. Script needs final pass — opening hook is still weak. Considering whether to include the screen recording walkthrough or save it for video #2.
                </p>
                <div
                  className="mt-3 w-full h-[180px] rounded-[4px] border border-border-subtle flex items-center justify-center"
                  style={{ background: "hsl(var(--surface-hover))" }}
                >
                  <span className="font-mono text-[11px] text-text-tertiary">
                    [ Reference: storyboard sketch — image placeholder ]
                  </span>
                </div>
                <ul className="mt-3 space-y-1">
                  {[
                    "Hook: contrast between 'app tourist' before/after",
                    "Section 1: which apps I deleted (no shaming, just facts)",
                    "Section 2: what stuck (Notion + ActOS)",
                    "Section 3: what I do differently now",
                    "Outro: open question for viewers",
                  ].map((b, i) => (
                    <li key={i} className="flex gap-2 text-[14px] text-text-primary leading-[1.6]">
                      <span style={{ color: G1 }}>•</span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-[14px] text-text-secondary leading-[1.6]">
                  See competitor analysis for tone reference:{" "}
                  <a className="text-accent hover:underline cursor-pointer">competitor-analysis-doc</a>
                </p>
              </div>
            </section>

            {/* Section C: Actions */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-[12px] font-medium uppercase tracking-[0.08em] text-text-secondary">
                  Actions · 7
                </h2>
                <div className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-tertiary">
                  3 DONE · 2 BACKLOG · 1 PLANNED · 1 DELEGATED
                </div>
              </div>

              <div className="border-t border-border-subtle">
                {ACTIVE.map((a, i) => (
                  <ActionRow key={i} a={a} />
                ))}
              </div>

              {/* Inline add */}
              <div className="mt-2 group flex items-center gap-3 h-9 px-3 bg-surface-base border border-border-subtle hover:border-border-default rounded-[4px] cursor-text transition-colors">
                <span className="inline-block w-4 h-4 rounded-[2px] border border-text-tertiary opacity-50" />
                <span className="text-[13px] text-text-tertiary group-hover:text-text-secondary">
                  Add an action…
                </span>
                <div className="flex-1" />
                <span className="font-mono text-[11px] text-text-tertiary">⌘+</span>
              </div>

              {/* Delegated group */}
              <div className="mt-4">
                <div className="flex items-center gap-2 h-7 px-3 hover:bg-surface-hover transition-colors cursor-pointer">
                  <span className="text-text-secondary text-[10px]">▾</span>
                  <span className="text-[12px] font-medium uppercase tracking-[0.08em] text-text-secondary">
                    Delegated · 1
                  </span>
                </div>
                <div className="border-t border-border-subtle">
                  <div className="group flex items-center gap-3 h-9 px-3 border-b border-border-subtle hover:bg-surface-hover transition-colors">
                    <Check />
                    <span className="text-[13px] font-medium text-text-primary truncate">Buy ring light</span>
                    <span className="font-mono text-[11px] text-text-tertiary">→ Maria</span>
                    <div className="flex-1" />
                    <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-text-tertiary">
                      EXPECTED TOMORROW
                    </span>
                  </div>
                </div>
              </div>

              {/* Done group (collapsed) */}
              <div className="mt-4">
                <div className="flex items-center gap-2 h-7 px-3 hover:bg-surface-hover transition-colors cursor-pointer">
                  <span className="text-text-tertiary text-[10px]">▸</span>
                  <span className="text-[12px] font-medium uppercase tracking-[0.08em] text-text-tertiary">
                    Done · 3
                  </span>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* Right column */}
        <aside className="w-[320px] shrink-0 bg-surface-raised border-l border-border-subtle">
          <div className="h-12 px-6 flex items-center justify-end border-b border-border-subtle">
            <button className="text-text-tertiary hover:text-text-secondary text-[14px] leading-none cursor-pointer">
              ···
            </button>
          </div>
          <div className="p-6 space-y-6">
            <StatusBlock />
            <StateBlock />
            <References />
          </div>
        </aside>
      </div>
    </div>
  );
};

export default ProjectDetail;
