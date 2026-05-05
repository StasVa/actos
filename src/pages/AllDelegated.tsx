import React, { useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  ACTIONS,
  Action,
  Delegate,
  GoalKey,
  GOALS,
  STATUS_LABEL,
  statusColorVar,
} from "@/lib/actionsData";
import { formatTime } from "@/lib/format";

/* ===== Sidebar ===== */
const NAV: { label: string; href: string }[] = [
  { label: "Home", href: "/" },
  { label: "Weekly", href: "#" },
  { label: "Ideas", href: "/ideas" },
  { label: "Rituals", href: "/rituals" },
  { label: "All actions", href: "/all-actions" },
  { label: "All projects", href: "#" },
  { label: "All delegated", href: "/all-delegated" },
];

const Sidebar: React.FC = () => {
  const { pathname } = useLocation();
  return (
    <aside className="fixed left-0 top-0 bottom-0 w-[220px] bg-surface-raised border-r border-border-subtle p-4 flex flex-col">
      <Link to="/" className="px-1 py-1 text-[17px] font-semibold text-text-primary tracking-tight">
        ActOS
      </Link>
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
};

/* ===== Filter chips ===== */
const Chip: React.FC<{
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  dot?: string;
}> = ({ active, onClick, children, dot }) => (
  <button
    onClick={onClick}
    className={`inline-flex items-center gap-1.5 px-[10px] py-1 rounded-[4px] border text-[12px] transition-colors ${
      active
        ? "bg-surface-hover text-text-primary border-accent"
        : "bg-transparent text-text-secondary border-border-default hover:text-text-primary"
    }`}
  >
    {dot && <span className="w-2 h-2 rounded-full" style={{ background: dot }} />}
    {children}
  </button>
);

const FilterGroup: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="flex items-center gap-2">
    <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-text-tertiary">{label}</span>
    <div className="flex items-center gap-1.5 flex-wrap">{children}</div>
  </div>
);

const GhostButton: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  accent?: boolean;
}> = ({ children, onClick, accent }) => (
  <button
    onClick={onClick}
    className={`h-9 px-4 text-[13px] font-medium rounded-[4px] border bg-transparent transition-colors ${
      accent
        ? "text-text-primary border-[hsl(var(--accent))] hover:bg-surface-hover"
        : "text-text-primary border-border-default hover:border-[hsl(var(--accent))] hover:bg-surface-hover"
    }`}
  >
    {children}
  </button>
);

const TertiaryLink: React.FC<{ children: React.ReactNode; onClick?: () => void }> = ({ children, onClick }) => (
  <button
    onClick={onClick}
    className="h-9 px-2 text-[13px] text-text-tertiary hover:text-text-secondary transition-colors"
  >
    {children}
  </button>
);

const fakeAction = (label: string) => () => {
  // eslint-disable-next-line no-console
  console.log(`[ActOS prototype] ${label} — full interactivity coming next`);
};

/* ===== Bucket logic ===== */
type Bucket = "overdue" | "upcoming" | "nodate";

function bucketFor(a: Action): Bucket {
  if (a.expectedReturnDelta === undefined) return "nodate";
  if (a.expectedReturnDelta < 0) return "overdue";
  return "upcoming";
}

function returnLabelFor(a: Action): { text: string; color?: string } | null {
  const d = a.expectedReturnDelta;
  if (d === undefined) return null;
  if (d < 0) {
    return { text: `OVERDUE ${Math.abs(d)}d`, color: "hsl(var(--text-warning))" };
  }
  if (d === 0) return { text: "TODAY", color: "hsl(var(--text-primary))" };
  return { text: a.expectedReturnLabel ?? "", color: "hsl(var(--text-secondary))" };
}

/* ===== Row ===== */
const DelegationRow: React.FC<{ action: Action; selected: boolean; onSelect: () => void }> = ({
  action,
  selected,
  onSelect,
}) => {
  const goal = GOALS[action.goal];
  const ret = returnLabelFor(action);
  const overdueDays =
    action.expectedReturnDelta !== undefined && action.expectedReturnDelta < 0
      ? Math.abs(action.expectedReturnDelta)
      : 0;
  // Right side label for top row
  let topRight: React.ReactNode = null;
  if (overdueDays > 0) {
    topRight = (
      <span
        className="font-mono uppercase tracking-[0.06em]"
        style={{ fontSize: 10, color: "hsl(var(--text-warning))" }}
      >
        {overdueDays}d OVERDUE
      </span>
    );
  } else if (ret) {
    topRight = (
      <span
        className="font-mono uppercase tracking-[0.06em] text-text-secondary bg-surface-hover"
        style={{ fontSize: 10, padding: "2px 6px", borderRadius: 2 }}
      >
        {ret.text}
      </span>
    );
  }

  const bottomBits: React.ReactNode[] = [
    <span key="goal">{goal.short}</span>,
    <span key="proj">{action.project}</span>,
    <span key="del">→ {(action.delegate ?? "").toUpperCase()}</span>,
  ];
  if (action.impact) bottomBits.push(<span key="imp">I{action.impact}</span>);
  if (action.timeMinutes) bottomBits.push(<span key="time">{formatTime(action.timeMinutes)}</span>);

  return (
    <div
      onClick={onSelect}
      className={`relative flex items-stretch cursor-pointer border-b border-border-subtle transition-colors ${
        selected ? "bg-surface-elevated" : "hover:bg-surface-hover"
      }`}
      style={{ minHeight: 56 }}
    >
      <span
        className="absolute left-0 top-0 bottom-0"
        style={{
          background: selected ? "hsl(var(--accent))" : goal.color,
          width: selected ? 2 : 3,
        }}
      />
      <div
        className="flex flex-col gap-1 py-3 pr-4 w-full"
        style={{ paddingLeft: 16 + (selected ? 2 : 3) }}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <span
              className="inline-block rounded-[2px] border shrink-0"
              style={{
                width: 16,
                height: 16,
                borderColor: "hsl(var(--text-tertiary))",
              }}
            />
            <span className="text-[14px] font-medium text-text-primary truncate">
              {action.title}
            </span>
          </div>
          <div className="shrink-0">{topRight}</div>
        </div>
        <div className="flex items-center font-mono text-[11px] text-text-tertiary tabular-nums">
          <span
            className="inline-block w-1.5 h-1.5 rounded-full mr-1.5 shrink-0"
            style={{ background: goal.color }}
          />
          {bottomBits.map((b, i) => (
            <React.Fragment key={i}>
              {i > 0 && <span className="mx-1.5">·</span>}
              {b}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};

const GroupHeader: React.FC<{ label: string; count: number; warning?: boolean }> = ({
  label,
  count,
  warning,
}) => (
  <div
    className="flex items-center px-3 h-8 bg-surface-raised border-b border-border-subtle"
    style={{ color: warning ? "hsl(var(--text-warning))" : undefined }}
  >
    <span
      className={`font-mono text-[11px] uppercase tracking-[0.08em] ${
        warning ? "font-medium" : "text-text-tertiary"
      }`}
      style={warning ? { color: "hsl(var(--text-warning))" } : undefined}
    >
      {label} · {count}
    </span>
  </div>
);

/* ===== Detail ===== */
const StatusPill: React.FC<{ status: Action["status"] }> = ({ status }) => (
  <span
    className="inline-flex items-center font-mono uppercase tracking-[0.08em] rounded-[4px]"
    style={{
      padding: "4px 8px",
      fontSize: 10,
      background: "hsl(var(--surface-hover))",
      color: statusColorVar(status),
    }}
  >
    {STATUS_LABEL[status]}
  </span>
);

const InfoRow: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="flex items-baseline gap-3 py-1.5 border-b border-border-subtle last:border-0">
    <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-text-tertiary w-[160px] shrink-0">
      {label}
    </span>
    <span className="text-[13px] text-text-primary">{children}</span>
  </div>
);

const DelegationDetail: React.FC<{ action: Action }> = ({ action }) => {
  const goal = GOALS[action.goal];
  const overdueDays =
    action.expectedReturnDelta !== undefined && action.expectedReturnDelta < 0
      ? Math.abs(action.expectedReturnDelta)
      : 0;
  const isToday = action.expectedReturnDelta === 0;

  return (
    <div className="px-10 py-8 max-w-[760px]">
      <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.06em] text-text-tertiary">
        <span className="w-2 h-2 rounded-full" style={{ background: goal.color }} />
        <span className="hover:text-text-secondary cursor-pointer transition-colors">
          {goal.name}
        </span>
        <span>·</span>
        <span className="hover:text-text-secondary cursor-pointer transition-colors">
          {action.project}
        </span>
      </div>

      <div className="h-2" />
      <StatusPill status={action.status} />

      <div className="h-3" />
      <h1 className="text-[22px] font-medium text-text-primary leading-tight">{action.title}</h1>

      <div className="h-6" />
      <div className="font-mono text-[12px] text-text-tertiary tabular-nums">
        IMPACT {action.impact} · {formatTime(action.timeMinutes)} · CREATED{" "}
        {action.createdLabel.toUpperCase()}
      </div>

      <div className="h-6" />
      <div className="font-mono text-[11px] uppercase tracking-[0.08em] text-text-secondary">
        DELEGATION
      </div>
      <div className="h-2" />
      <div className="border-t border-border-subtle">
        <InfoRow label="DELEGATE">{action.delegate}</InfoRow>
        <InfoRow label="EXPECTED RETURN">
          {action.expectedReturnLabel ? (
            <>
              {action.expectedReturnLabel}
              {overdueDays > 0 && (
                <>
                  <span className="text-text-tertiary"> — </span>
                  <span style={{ color: "hsl(var(--text-warning))" }}>
                    OVERDUE {overdueDays} {overdueDays === 1 ? "DAY" : "DAYS"}
                  </span>
                </>
              )}
              {isToday && (
                <>
                  <span className="text-text-tertiary"> — </span>
                  <span className="text-text-primary">DUE TODAY</span>
                </>
              )}
            </>
          ) : (
            <span className="text-text-tertiary">No date set</span>
          )}
        </InfoRow>
        <InfoRow label="DELEGATED">
          {action.delegatedLabel}
          {action.delegatedAgoDays !== undefined && (
            <span className="text-text-tertiary">
              {" "}
              ({action.delegatedAgoDays} {action.delegatedAgoDays === 1 ? "day" : "days"} ago)
            </span>
          )}
        </InfoRow>
        {action.delegationNote && (
          <InfoRow label="DELEGATION NOTE">{action.delegationNote}</InfoRow>
        )}
      </div>

      {action.notes && (
        <>
          <div className="h-6" />
          <div className="font-mono text-[11px] uppercase tracking-[0.08em] text-text-secondary">
            NOTES
          </div>
          <div className="h-2" />
          <p className="text-[14px] text-text-primary leading-[1.6]">{action.notes}</p>
        </>
      )}

      <div className="h-6" />
      <div className="font-mono text-[11px] uppercase tracking-[0.08em] text-text-secondary">
        TIMELINE
      </div>
      <div className="h-2" />
      <div className="flex flex-col gap-1">
        {action.timeline.map((t, i) => (
          <div key={i} className="font-mono text-[12px] text-text-secondary tabular-nums">
            {t.date} — {t.text}
          </div>
        ))}
        <div className="font-mono text-[12px] text-text-tertiary">—</div>
      </div>

      <div className="h-12" />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GhostButton accent onClick={fakeAction("Mark delegated done")}>
            Mark done
          </GhostButton>
          <GhostButton onClick={fakeAction("Re-open delegation")}>Re-open</GhostButton>
          <TertiaryLink onClick={fakeAction("Edit delegated action")}>Edit action</TertiaryLink>
        </div>
        <button
          onClick={fakeAction("Open menu")}
          className="w-6 h-6 inline-flex items-center justify-center rounded-[4px] text-text-tertiary hover:bg-surface-hover hover:text-text-secondary transition-colors"
        >
          ···
        </button>
      </div>
    </div>
  );
};

/* ===== Empty states ===== */
const EmptyFiltered: React.FC<{ onClear: () => void }> = ({ onClear }) => (
  <div className="h-full flex flex-col items-center justify-center text-center px-10">
    <div className="text-[14px] text-text-secondary">No delegations match these filters</div>
    <div className="mt-1 font-mono text-[11px] text-text-tertiary">
      Clear filters or change them above.
    </div>
    <div className="mt-4">
      <GhostButton onClick={onClear}>Clear filters</GhostButton>
    </div>
  </div>
);

/* ===== Page ===== */
type DateFilter = "all" | "overdue" | "upcoming" | "nodate";
type DelegateFilter = "all" | Delegate;
type GoalFilter = "all" | GoalKey;

const AllDelegated: React.FC = () => {
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [delegateFilter, setDelegateFilter] = useState<DelegateFilter>("all");
  const [goalFilter, setGoalFilter] = useState<GoalFilter>("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string>("d-grocery");

  const allDelegated = useMemo(() => ACTIONS.filter((a) => a.status === "delegated"), []);

  const filtered = useMemo(() => {
    return allDelegated.filter((a) => {
      const b = bucketFor(a);
      if (dateFilter !== "all" && b !== dateFilter) return false;
      if (delegateFilter !== "all" && a.delegate !== delegateFilter) return false;
      if (goalFilter !== "all" && a.goal !== goalFilter) return false;
      const q = query.trim().toLowerCase();
      if (q) {
        const titleMatch = a.title.toLowerCase().includes(q);
        const delegateMatch = (a.delegate ?? "").toLowerCase().includes(q);
        if (!titleMatch && !delegateMatch) return false;
      }
      return true;
    });
  }, [allDelegated, dateFilter, delegateFilter, goalFilter, query]);

  const groups = useMemo(() => {
    const overdue = filtered
      .filter((a) => bucketFor(a) === "overdue")
      .sort((a, b) => (a.expectedReturnDelta ?? 0) - (b.expectedReturnDelta ?? 0));
    const upcoming = filtered
      .filter((a) => bucketFor(a) === "upcoming")
      .sort((a, b) => (a.expectedReturnDelta ?? 0) - (b.expectedReturnDelta ?? 0));
    const nodate = filtered
      .filter((a) => bucketFor(a) === "nodate")
      .sort((a, b) => b.changedSort - a.changedSort);
    return { overdue, upcoming, nodate };
  }, [filtered]);

  const meta = useMemo(() => {
    const total = allDelegated.length;
    const overdue = allDelegated.filter((a) => bucketFor(a) === "overdue").length;
    const upcoming = allDelegated.filter((a) => bucketFor(a) === "upcoming").length;
    const nodate = allDelegated.filter((a) => bucketFor(a) === "nodate").length;
    return `${total} DELEGATED · ${overdue} OVERDUE · ${upcoming} UPCOMING · ${nodate} NO DATE`;
  }, [allDelegated]);

  const selected = filtered.find((a) => a.id === selectedId) ?? filtered[0];

  React.useEffect(() => {
    if (selected && selected.id !== selectedId) setSelectedId(selected.id);
  }, [selected, selectedId]);

  const clearFilters = () => {
    setDateFilter("all");
    setDelegateFilter("all");
    setGoalFilter("all");
    setQuery("");
  };

  return (
    <div className="min-h-screen bg-surface-base text-text-primary">
      <Sidebar />
      <main className="ml-[220px] flex flex-col h-screen">
        {/* Header */}
        <div className="px-8 py-6 border-b border-border-subtle shrink-0">
          <div className="flex items-baseline justify-between">
            <h1 className="text-[24px] font-medium text-text-primary">All delegated</h1>
            <div className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-tertiary tabular-nums">
              {meta}
            </div>
          </div>
          <div className="h-3" />
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-6 flex-wrap">
              <FilterGroup label="RETURN">
                <Chip active={dateFilter === "all"} onClick={() => setDateFilter("all")}>
                  All
                </Chip>
                <Chip
                  active={dateFilter === "overdue"}
                  onClick={() => setDateFilter("overdue")}
                >
                  Overdue
                </Chip>
                <Chip
                  active={dateFilter === "upcoming"}
                  onClick={() => setDateFilter("upcoming")}
                >
                  Upcoming
                </Chip>
                <Chip
                  active={dateFilter === "nodate"}
                  onClick={() => setDateFilter("nodate")}
                >
                  No date
                </Chip>
              </FilterGroup>
              <FilterGroup label="DELEGATE">
                <Chip
                  active={delegateFilter === "all"}
                  onClick={() => setDelegateFilter("all")}
                >
                  All
                </Chip>
                <Chip
                  active={delegateFilter === "Maria"}
                  onClick={() => setDelegateFilter("Maria")}
                >
                  Maria
                </Chip>
                <Chip
                  active={delegateFilter === "AI"}
                  onClick={() => setDelegateFilter("AI")}
                >
                  AI
                </Chip>
              </FilterGroup>
              <FilterGroup label="GOAL">
                <Chip active={goalFilter === "all"} onClick={() => setGoalFilter("all")}>
                  All
                </Chip>
                <Chip
                  active={goalFilter === "g1"}
                  onClick={() => setGoalFilter("g1")}
                  dot={GOALS.g1.color}
                >
                  Launch YouTube
                </Chip>
                <Chip
                  active={goalFilter === "g2"}
                  onClick={() => setGoalFilter("g2")}
                  dot={GOALS.g2.color}
                >
                  Lose 5 kg
                </Chip>
                <Chip
                  active={goalFilter === "g3"}
                  onClick={() => setGoalFilter("g3")}
                  dot={GOALS.g3.color}
                >
                  Read 24 books
                </Chip>
              </FilterGroup>
            </div>
            <div className="flex items-center gap-2 bg-surface-raised border border-border-subtle rounded-[4px] px-2.5 py-1.5 w-[240px]">
              <span className="text-[12px] text-text-tertiary">⌕</span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search delegations..."
                className="flex-1 bg-transparent outline-none text-[13px] text-text-primary placeholder:text-text-tertiary"
              />
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 flex min-h-0">
          {/* Left column */}
          <div className="w-[42%] border-r border-border-subtle flex flex-col min-h-0">
            <div className="flex-1 overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="p-8 text-center font-mono text-[11px] text-text-tertiary">
                  No delegations match these filters.
                </div>
              ) : (
                <>
                  {groups.overdue.length > 0 && (
                    <>
                      <GroupHeader label="OVERDUE" count={groups.overdue.length} warning />
                      {groups.overdue.map((a) => (
                        <DelegationRow
                          key={a.id}
                          action={a}
                          selected={selected?.id === a.id}
                          onSelect={() => setSelectedId(a.id)}
                        />
                      ))}
                    </>
                  )}
                  {groups.upcoming.length > 0 && (
                    <>
                      <GroupHeader label="UPCOMING" count={groups.upcoming.length} />
                      {groups.upcoming.map((a) => (
                        <DelegationRow
                          key={a.id}
                          action={a}
                          selected={selected?.id === a.id}
                          onSelect={() => setSelectedId(a.id)}
                        />
                      ))}
                    </>
                  )}
                  {groups.nodate.length > 0 && (
                    <>
                      <GroupHeader label="NO RETURN DATE" count={groups.nodate.length} />
                      {groups.nodate.map((a) => (
                        <DelegationRow
                          key={a.id}
                          action={a}
                          selected={selected?.id === a.id}
                          onSelect={() => setSelectedId(a.id)}
                        />
                      ))}
                    </>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Right column */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {filtered.length === 0 ? (
              <EmptyFiltered onClear={clearFilters} />
            ) : selected ? (
              <DelegationDetail action={selected} key={selected.id} />
            ) : null}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AllDelegated;
