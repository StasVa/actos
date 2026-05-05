import React, { useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  ACTIONS,
  Action,
  ActionStatus,
  GoalKey,
  GOALS,
  STATUS_LABEL,
  isActive,
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

/* ===== Buttons ===== */
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


const fakeAction = (label: string) => () => {
  // Placeholder for future interactivity.
  // eslint-disable-next-line no-console
  console.log(`[ActOS prototype] ${label} — full interactivity coming next`);
};

/* ===== Action row ===== */
const ActionRow: React.FC<{ action: Action; selected: boolean; onSelect: () => void }> = ({
  action,
  selected,
  onSelect,
}) => {
  const goal = GOALS[action.goal];
  const isTerminal = !isActive(action.status);
  const bottomBits: React.ReactNode[] = [];
  bottomBits.push(<span key="goal">{goal.short}</span>);
  bottomBits.push(<span key="proj">{action.project}</span>);
  if (action.impact) bottomBits.push(<span key="imp">I{action.impact}</span>);
  if (action.timeMinutes) bottomBits.push(<span key="time">{formatTime(action.timeMinutes)}</span>);
  if (action.status === "delegated" && action.delegate)
    bottomBits.push(<span key="del">→ {action.delegate.toUpperCase()}</span>);

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
      <div className="flex flex-col gap-1 py-3 pr-4 w-full" style={{ paddingLeft: 16 + (selected ? 2 : 3) }}>
        {/* Top row */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <span
              className="inline-flex items-center justify-center rounded-[2px] border shrink-0"
              style={{
                width: 16,
                height: 16,
                background: action.status === "done" ? goal.color : "transparent",
                borderColor:
                  action.status === "done" ? goal.color : "hsl(var(--text-tertiary))",
                color: "hsl(var(--surface-base))",
                fontSize: 11,
                lineHeight: 1,
              }}
            >
              {action.status === "done" ? "✓" : ""}
            </span>
            <span
              className={`text-[14px] font-medium truncate ${
                isTerminal ? "text-text-secondary line-through" : "text-text-primary"
              }`}
            >
              {action.title}
            </span>
          </div>
          <div className="shrink-0">
            {action.status === "planned" && action.scheduledLabel && (
              <span
                className="font-mono uppercase tracking-[0.06em] text-text-secondary bg-surface-hover"
                style={{ fontSize: 10, padding: "2px 6px", borderRadius: 2 }}
              >
                {action.scheduledLabel}
              </span>
            )}
            {action.status === "done" && (
              <span
                className="font-mono"
                style={{ color: "hsl(var(--status-done))", fontSize: 12 }}
              >
                ✓
              </span>
            )}
          </div>
        </div>
        {/* Bottom row */}
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

/* ===== Group header ===== */
const GroupHeader: React.FC<{
  label: string;
  count: number;
  collapsible?: boolean;
  collapsed?: boolean;
  onToggle?: () => void;
}> = ({ label, count, collapsible, collapsed, onToggle }) => (
  <button
    type="button"
    onClick={onToggle}
    disabled={!collapsible}
    className={`w-full flex items-center gap-2 px-3 h-8 bg-surface-raised border-b border-border-subtle text-left ${
      collapsible ? "cursor-pointer hover:bg-surface-hover" : "cursor-default"
    }`}
  >
    {collapsible && (
      <span className="font-mono text-[11px] text-text-tertiary">{collapsed ? "▸" : "▾"}</span>
    )}
    <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-text-tertiary">
      {label} · {count}
    </span>
  </button>
);

/* ===== Detail ===== */
const StatusPill: React.FC<{ status: ActionStatus }> = ({ status }) => (
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

const ActionDetail: React.FC<{ action: Action }> = ({ action }) => {
  const goal = GOALS[action.goal];
  const isOverdue =
    action.status === "delegated" &&
    action.expectedReturnDelta !== undefined &&
    action.expectedReturnDelta < 0;

  const quickInfoBits: React.ReactNode[] = [
    `IMPACT ${action.impact}`,
    formatTime(action.timeMinutes),
  ];
  if (action.status === "planned" && action.scheduledLabel) {
    quickInfoBits.push(`SCHEDULED ${action.scheduledLabel}`);
  }
  quickInfoBits.push(`CREATED ${action.createdLabel.toUpperCase()}`);

  return (
    <div className="px-10 py-8 max-w-[760px]">
      {/* Breadcrumb */}
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

      <div className="h-3" />
      <StatusPill status={action.status} />

      <div className="h-4" />
      <h1 className="text-[22px] font-medium text-text-primary leading-tight">{action.title}</h1>

      <div className="h-8" />
      <div className="font-mono text-[13px] text-text-tertiary tabular-nums">
        {quickInfoBits.map((b, i) => (
          <React.Fragment key={i}>
            {i > 0 && <span> · </span>}
            <span>{b}</span>
          </React.Fragment>
        ))}
        {action.status === "delegated" && action.delegate && (
          <>
            <span> · </span>
            <span>→ {action.delegate.toUpperCase()}</span>
            {action.expectedReturnLabel && (
              <>
                <span> · EXPECTED </span>
                <span style={{ color: isOverdue ? "hsl(var(--text-warning))" : undefined }}>
                  {action.expectedReturnLabel}
                </span>
              </>
            )}
          </>
        )}
      </div>

      {action.notes && (
        <>
          <div className="h-8" />
          <div className="font-mono text-[11px] uppercase tracking-[0.08em] text-text-secondary">
            NOTES
          </div>
          <div className="h-3" />
          <p className="text-[14px] text-text-primary leading-[1.6]">{action.notes}</p>
        </>
      )}

      <div className="h-12" />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GhostButton onClick={fakeAction("Edit action")}>Edit action</GhostButton>
          {isActive(action.status) && (
            <GhostButton accent onClick={fakeAction("Mark done")}>
              Mark done
            </GhostButton>
          )}
          {action.status === "delegated" && (
            <>
              <GhostButton accent onClick={fakeAction("Mark delegated done")}>
                Mark done
              </GhostButton>
              <GhostButton onClick={fakeAction("Re-open delegation")}>Re-open</GhostButton>
            </>
          )}
          {(action.status === "done" ||
            action.status === "dropped" ||
            action.status === "cancelled") && (
            <GhostButton onClick={fakeAction("Re-open action")}>Re-open</GhostButton>
          )}
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
const EmptyDetail: React.FC = () => (
  <div className="h-full flex flex-col items-center justify-center text-center px-10">
    <div className="text-[14px] text-text-secondary">Select an action to view details</div>
  </div>
);

const EmptyFiltered: React.FC<{ onClear: () => void }> = ({ onClear }) => (
  <div className="h-full flex flex-col items-center justify-center text-center px-10">
    <div className="text-[14px] text-text-secondary">No actions match these filters</div>
    <div className="mt-1 font-mono text-[11px] text-text-tertiary">
      Clear filters or change them above.
    </div>
    <div className="mt-4">
      <GhostButton onClick={onClear}>Clear filters</GhostButton>
    </div>
  </div>
);

/* ===== Page ===== */
type StatusFilter = "all" | ActionStatus;
type GoalFilter = "all" | GoalKey;
type DateFilter = "all" | "today" | "week" | "month";

const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "backlog", label: "Backlog" },
  { key: "planned", label: "Planned" },
  { key: "done", label: "Done" },
  { key: "delegated", label: "Delegated" },
  { key: "dropped", label: "Dropped" },
  { key: "cancelled", label: "Cancelled" },
];

const DATE_FILTERS: { key: DateFilter; label: string }[] = [
  { key: "all", label: "All time" },
  { key: "today", label: "Today" },
  { key: "week", label: "This week" },
  { key: "month", label: "This month" },
];

const AllActions: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [goalFilter, setGoalFilter] = useState<GoalFilter>("all");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string>("a-research-thumb");
  const [terminalCollapsed, setTerminalCollapsed] = useState(false);

  const filtered = useMemo(() => {
    return ACTIONS.filter((a) => {
      if (statusFilter !== "all" && a.status !== statusFilter) return false;
      if (goalFilter !== "all" && a.goal !== goalFilter) return false;
      if (dateFilter === "today") {
        const isToday = a.scheduledSort === 0 || a.createdLabel === "May 5";
        if (!isToday) return false;
      }
      if (query.trim() && !a.title.toLowerCase().includes(query.trim().toLowerCase())) return false;
      return true;
    });
  }, [statusFilter, goalFilter, dateFilter, query]);

  const meta = useMemo(() => {
    const total = ACTIONS.length;
    const active = ACTIONS.filter((a) => isActive(a.status)).length;
    const done = ACTIONS.filter((a) => a.status === "done").length;
    const delegated = ACTIONS.filter((a) => a.status === "delegated").length;
    return `${total} ACTIONS · ${active} ACTIVE · ${done} DONE · ${delegated} DELEGATED`;
  }, []);

  const grouped = useMemo(() => {
    if (statusFilter !== "all") {
      return {
        single: [...filtered].sort((a, b) => b.changedSort - a.changedSort),
      };
    }
    const active = filtered
      .filter((a) => isActive(a.status))
      .sort((a, b) => {
        const sa = a.scheduledSort ?? Number.POSITIVE_INFINITY;
        const sb = b.scheduledSort ?? Number.POSITIVE_INFINITY;
        if (sa !== sb) return sa - sb;
        return b.impact - a.impact;
      });
    const terminal = filtered
      .filter((a) => !isActive(a.status))
      .sort((a, b) => b.changedSort - a.changedSort);
    return { active, terminal };
  }, [filtered, statusFilter]);

  const selected = filtered.find((a) => a.id === selectedId) ?? filtered[0];

  React.useEffect(() => {
    if (selected && selected.id !== selectedId) setSelectedId(selected.id);
  }, [selected, selectedId]);

  const clearFilters = () => {
    setStatusFilter("all");
    setGoalFilter("all");
    setDateFilter("all");
    setQuery("");
  };

  return (
    <div className="min-h-screen bg-surface-base text-text-primary">
      <Sidebar />
      <main className="ml-[220px] flex flex-col h-screen">
        {/* Header */}
        <div className="px-8 py-6 border-b border-border-subtle shrink-0">
          <div className="flex items-baseline justify-between">
            <h1 className="text-[24px] font-medium text-text-primary">All actions</h1>
            <div className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-tertiary tabular-nums">
              {meta}
            </div>
          </div>
          <div className="h-3" />
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-6 flex-wrap">
              <FilterGroup label="STATUS">
                {STATUS_FILTERS.map((f) => (
                  <Chip
                    key={f.key}
                    active={statusFilter === f.key}
                    onClick={() => setStatusFilter(f.key)}
                  >
                    {f.label}
                  </Chip>
                ))}
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
              <FilterGroup label="DATE">
                {DATE_FILTERS.map((f) => (
                  <Chip
                    key={f.key}
                    active={dateFilter === f.key}
                    onClick={() => setDateFilter(f.key)}
                  >
                    {f.label}
                  </Chip>
                ))}
              </FilterGroup>
            </div>
            <div className="flex items-center gap-2 bg-surface-raised border border-border-subtle rounded-[4px] px-2.5 py-1.5 w-[240px]">
              <span className="text-[12px] text-text-tertiary">⌕</span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search actions..."
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
                  No actions match these filters.
                </div>
              ) : "single" in grouped ? (
                grouped.single!.map((a) => (
                  <ActionRow
                    key={a.id}
                    action={a}
                    selected={selected?.id === a.id}
                    onSelect={() => setSelectedId(a.id)}
                  />
                ))
              ) : (
                <>
                  {grouped.active!.length > 0 &&
                    grouped.active!.map((a) => (
                      <ActionRow
                        key={a.id}
                        action={a}
                        selected={selected?.id === a.id}
                        onSelect={() => setSelectedId(a.id)}
                      />
                    ))}
                  {grouped.terminal!.length > 0 && (
                    <>
                      <GroupHeader
                        label="TERMINAL"
                        count={grouped.terminal!.length}
                        collapsible
                        collapsed={terminalCollapsed}
                        onToggle={() => setTerminalCollapsed((v) => !v)}
                      />
                      {!terminalCollapsed &&
                        grouped.terminal!.map((a) => (
                          <ActionRow
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
              <ActionDetail action={selected} key={selected.id} />
            ) : (
              <EmptyDetail />
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AllActions;
