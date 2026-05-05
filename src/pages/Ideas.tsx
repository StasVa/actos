import React, { useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";

const G1 = "hsl(var(--goal-1))";
const G2 = "hsl(var(--goal-2))";

/* ===== Sidebar (Ideas active) ===== */
const NAV = [
  { label: "Home", href: "/" },
  { label: "Weekly", href: "#" },
  { label: "Ideas", href: "/ideas" },
  { label: "All actions", href: "#" },
  { label: "All projects", href: "#" },
  { label: "All delegated", href: "#" },
];

const Sidebar: React.FC<{ activePath: string }> = ({ activePath }) => (
  <aside className="fixed left-0 top-0 bottom-0 w-[220px] bg-surface-raised border-r border-border-subtle p-4 flex flex-col">
    <Link to="/" className="px-1 py-1 text-[17px] font-semibold text-text-primary tracking-tight">
      ActOS
    </Link>
    <nav className="mt-8 flex flex-col gap-1">
      {NAV.map((item) => {
        const active =
          (item.href === "/" && activePath === "/") ||
          (item.href !== "/" && item.href !== "#" && activePath.startsWith(item.href));
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

/* ===== Data ===== */
type Goal = "g1" | "g2";
type Status = "captured" | "converted" | "discarded";
type Reference = { title: string; url: string };
type Idea = {
  id: string;
  title: string;
  goal: Goal;
  capturedLabel: string;
  capturedFull: string;
  capturedSort: number; // higher = more recent
  status: Status;
  note?: string[]; // paragraphs
  refs?: Reference[];
  images?: string[];
};

const GOALS: Record<Goal, { name: string; color: string }> = {
  g1: { name: "Launch YouTube channel", color: G1 },
  g2: { name: "Lose 5 kg", color: G2 },
};

const IDEAS: Idea[] = [
  {
    id: "i1",
    title: "Test vlog-style intro for video #2",
    goal: "g1",
    capturedLabel: "Captured 2d ago",
    capturedFull: "CAPTURED · 2 DAYS AGO · APR 3",
    capturedSort: 80,
    status: "captured",
    note: [
      "What if video #2 opens with a 30-second vlog-style segment showing my actual workspace? Could create more personal connection vs. talking head intro.",
      "Risk: feels like cheap engagement bait. Worth testing — could shoot both and decide in edit.",
    ],
    refs: [{ title: "Casey Neistat workflow vlog", url: "youtube.com/watch?v=..." }],
  },
  {
    id: "i2",
    title: "Research lighting kits under $200",
    goal: "g1",
    capturedLabel: "Captured 3d ago",
    capturedFull: "CAPTURED · 3 DAYS AGO · APR 2",
    capturedSort: 70,
    status: "captured",
    refs: [
      { title: "Neewer 660 LED panel review", url: "bhphotovideo.com/c/product/..." },
      { title: "Budget lighting comparison", url: "youtube.com/watch?v=..." },
    ],
  },
  {
    id: "i3",
    title: "Music licensing services comparison",
    goal: "g1",
    capturedLabel: "Captured 4d ago",
    capturedFull: "CAPTURED · 4 DAYS AGO · APR 1",
    capturedSort: 60,
    status: "captured",
    note: ["Epidemic Sound vs Artlist vs Musicbed — pick one for the channel."],
    images: ["spotify_pricing.png"],
  },
  {
    id: "i4",
    title: "Try keto for 2 weeks as experiment",
    goal: "g2",
    capturedLabel: "Captured 5d ago",
    capturedFull: "CAPTURED · 5 DAYS AGO · MAR 31",
    capturedSort: 50,
    status: "captured",
    note: [
      "Run a 14-day keto trial. Goal isn't long-term diet change — it's to see how my energy and hunger respond when I drop carbs hard.",
      "Track weight, sleep, gym performance daily. If lifts crash by week 2, abort.",
      "Important: don't combine with new training stimulus. Keep workouts identical to current block so the only variable is diet.",
    ],
  },
  {
    id: "i5",
    title: "Replace evening snack with protein",
    goal: "g2",
    capturedLabel: "Captured today",
    capturedFull: "CAPTURED · TODAY · MAY 5",
    capturedSort: 100,
    status: "captured",
  },
  {
    id: "i6",
    title: "Interview format for video #3",
    goal: "g1",
    capturedLabel: "Captured today",
    capturedFull: "CAPTURED · TODAY · MAY 5",
    capturedSort: 99,
    status: "captured",
    note: ["Bring on a guest for #3 — lower pressure on me, more dynamic content."],
  },
  {
    id: "i7",
    title: "Find HIIT routine for home",
    goal: "g2",
    capturedLabel: "Captured 6d ago",
    capturedFull: "CAPTURED · 6 DAYS AGO · MAR 30",
    capturedSort: 40,
    status: "captured",
    note: ["20-minute, no equipment, 3x per week. Should slot in on non-gym days."],
    refs: [
      { title: "Tabata protocol overview", url: "ncbi.nlm.nih.gov/..." },
      { title: "Heather Robertson 20min HIIT", url: "youtube.com/watch?v=..." },
      { title: "MadFit no-equipment series", url: "youtube.com/playlist?list=..." },
    ],
    images: ["hiit_routine.jpg"],
  },
  {
    id: "i8",
    title: "Audio editing tutorial reference",
    goal: "g1",
    capturedLabel: "Captured Apr 18",
    capturedFull: "CAPTURED · APR 18",
    capturedSort: 10,
    status: "captured",
    refs: [
      { title: "Curtis Judd voice processing", url: "youtube.com/watch?v=..." },
      { title: "Auphonic web service", url: "auphonic.com" },
    ],
  },
];

const PROJECTS_BY_GOAL: Record<Goal, string[]> = {
  g1: ["Shoot video #1", "Set up workspace"],
  g2: ["Build cardio base", "Meal prep system"],
};

/* ===== Chip ===== */
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
    <div className="flex items-center gap-1.5">{children}</div>
  </div>
);

/* ===== Capture input ===== */
const CaptureInput: React.FC<{ subHint?: string }> = ({ subHint }) => {
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <div
        className={`flex items-center gap-2 bg-surface-raised rounded-[4px] px-3 py-2.5 border transition-colors ${
          focused ? "border-border-default" : "border-border-subtle"
        }`}
      >
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={(e) => {
            if (e.key === "Enter") setValue("");
          }}
          placeholder="Capture an idea..."
          className={`flex-1 bg-transparent outline-none text-[13px] text-text-primary ${
            focused ? "placeholder:text-text-secondary" : "placeholder:text-text-tertiary"
          }`}
        />
        {focused && (
          <span className="font-mono text-[10px] text-text-tertiary shrink-0">⏎ to capture</span>
        )}
      </div>
      {subHint && <div className="mt-2 text-[12px] text-text-tertiary">{subHint}</div>}
    </div>
  );
};

/* ===== Idea row ===== */
const IdeaRow: React.FC<{ idea: Idea; selected: boolean; onSelect: () => void }> = ({
  idea,
  selected,
  onSelect,
}) => {
  const goalColor = GOALS[idea.goal].color;
  const refCount = idea.refs?.length ?? 0;
  const imgCount = idea.images?.length ?? 0;
  return (
    <div
      onClick={onSelect}
      className={`relative flex items-stretch h-14 cursor-pointer transition-colors ${
        selected ? "bg-surface-elevated" : "hover:bg-surface-hover"
      }`}
    >
      <span className="w-[3px] shrink-0" style={{ background: goalColor }} />
      {selected && (
        <span
          className="absolute left-0 top-0 bottom-0 w-[2px]"
          style={{ background: "hsl(var(--accent))" }}
        />
      )}
      <div className="flex-1 min-w-0 flex flex-col justify-center gap-1 pl-3 pr-4">
        <div className="flex items-center justify-between gap-3">
          <div className="text-[14px] font-medium text-text-primary truncate max-w-[80%]">
            {idea.title}
          </div>
          {(refCount > 0 || imgCount > 0) && (
            <div className="flex items-center gap-1.5 shrink-0 font-mono text-[10px] text-text-tertiary">
              {refCount > 0 && (
                <span className="inline-flex items-center gap-0.5">
                  <span style={{ color: goalColor }}>↗</span>
                  {refCount}
                </span>
              )}
              {imgCount > 0 && (
                <span className="inline-flex items-center gap-0.5">
                  <span style={{ color: goalColor }}>▣</span>
                  {imgCount}
                </span>
              )}
            </div>
          )}
        </div>
        <div className="font-mono text-[11px] text-text-tertiary">{idea.capturedLabel}</div>
      </div>
    </div>
  );
};

/* ===== Detail sub-components ===== */
const SectionHeading: React.FC<{ children: React.ReactNode; action?: React.ReactNode }> = ({
  children,
  action,
}) => (
  <div className="flex items-center justify-between mb-2">
    <div className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-secondary">
      {children}
    </div>
    {action}
  </div>
);

const AddLink: React.FC = () => (
  <a
    href="#"
    onClick={(e) => e.preventDefault()}
    className="text-[12px] text-text-secondary hover:text-text-primary transition-colors"
  >
    + Add
  </a>
);

const GhostButton: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  accent?: boolean;
  warning?: boolean;
}> = ({ children, onClick, accent, warning }) => (
  <button
    onClick={onClick}
    className={`h-9 px-4 py-2 text-[13px] font-medium rounded-[4px] border bg-transparent transition-colors ${
      warning
        ? "text-text-warning border-[hsl(var(--text-warning))] hover:bg-surface-hover"
        : accent
        ? "text-[hsl(var(--accent))] border-[hsl(var(--accent))] hover:bg-surface-hover"
        : "text-text-primary border-border-default hover:border-[hsl(var(--accent))] hover:bg-surface-hover"
    }`}
  >
    {children}
  </button>
);

const TertiaryLink: React.FC<{ children: React.ReactNode; onClick?: () => void }> = ({
  children,
  onClick,
}) => (
  <button
    onClick={onClick}
    className="h-9 px-2 text-[13px] text-text-tertiary hover:text-text-secondary transition-colors"
  >
    {children}
  </button>
);

/* ===== Convert overlays ===== */
type OverlayMode = null | "action" | "project" | "discard";

const ConvertActionOverlay: React.FC<{ idea: Idea; onClose: () => void }> = ({ idea, onClose }) => {
  const projects = PROJECTS_BY_GOAL[idea.goal];
  const [title, setTitle] = useState(idea.title);
  const [project, setProject] = useState(projects[0]);
  const [notes, setNotes] = useState(idea.note?.join("\n\n") ?? "");
  return (
    <div className="bg-surface-elevated border border-border-default rounded-[4px] p-5">
      <div className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-secondary">
        CONVERT TO ACTION
      </div>
      <div className="mt-4 flex flex-col gap-3">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="bg-surface-hover rounded-[4px] px-3 py-2 text-[14px] text-text-primary outline-none border border-transparent focus:border-border-default"
        />
        <select
          value={project}
          onChange={(e) => setProject(e.target.value)}
          className="bg-surface-hover rounded-[4px] px-3 py-2 text-[14px] text-text-primary outline-none border border-transparent focus:border-border-default"
        >
          {projects.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="bg-surface-hover rounded-[4px] px-3 py-2 text-[14px] text-text-primary outline-none border border-transparent focus:border-border-default resize-none"
        />
      </div>
      <div className="mt-4 flex items-center gap-3">
        <GhostButton accent onClick={onClose}>
          Create action
        </GhostButton>
        <TertiaryLink onClick={onClose}>Cancel</TertiaryLink>
      </div>
    </div>
  );
};

const ConvertProjectOverlay: React.FC<{ idea: Idea; onClose: () => void }> = ({ idea, onClose }) => {
  const [title, setTitle] = useState(idea.title);
  const [desc, setDesc] = useState("");
  const [notes, setNotes] = useState(idea.note?.join("\n\n") ?? "");
  return (
    <div className="bg-surface-elevated border border-border-default rounded-[4px] p-5">
      <div className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-secondary">
        CONVERT TO PROJECT
      </div>
      <div className="mt-4 flex flex-col gap-3">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="bg-surface-hover rounded-[4px] px-3 py-2 text-[14px] text-text-primary outline-none border border-transparent focus:border-border-default"
        />
        <input
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="Short description"
          className="bg-surface-hover rounded-[4px] px-3 py-2 text-[14px] text-text-primary outline-none border border-transparent focus:border-border-default placeholder:text-text-tertiary"
        />
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="bg-surface-hover rounded-[4px] px-3 py-2 text-[14px] text-text-primary outline-none border border-transparent focus:border-border-default resize-none"
        />
      </div>
      <div className="mt-4 flex items-center gap-3">
        <GhostButton accent onClick={onClose}>
          Create project
        </GhostButton>
        <TertiaryLink onClick={onClose}>Cancel</TertiaryLink>
      </div>
    </div>
  );
};

const DiscardConfirm: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <div className="flex items-center gap-4 flex-wrap">
    <span className="text-[13px] text-text-secondary">
      Discard this idea? It will be archived but not deleted.
    </span>
    <div className="flex items-center gap-3">
      <GhostButton warning onClick={onClose}>
        Discard
      </GhostButton>
      <TertiaryLink onClick={onClose}>Cancel</TertiaryLink>
    </div>
  </div>
);

/* ===== Detail panel ===== */
const IdeaDetail: React.FC<{ idea: Idea }> = ({ idea }) => {
  const [overlay, setOverlay] = useState<OverlayMode>(null);
  const goal = GOALS[idea.goal];

  // Reset overlay on idea change
  React.useEffect(() => {
    setOverlay(null);
  }, [idea.id]);

  return (
    <div className="px-10 py-8 max-w-[760px]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer group">
          <span className="w-2 h-2 rounded-full" style={{ background: goal.color }} />
          <span className="text-[12px] text-text-secondary group-hover:text-text-primary transition-colors">
            {goal.name}
          </span>
        </div>
        <button className="px-2 py-1 rounded-[4px] text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors text-[16px] leading-none">
          ···
        </button>
      </div>

      <div className="h-2" />
      <h1 className="text-[24px] font-medium text-text-primary leading-tight">{idea.title}</h1>

      <div className="h-2" />
      <div className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-tertiary">
        {idea.capturedFull}
      </div>

      {idea.note && idea.note.length > 0 && (
        <>
          <div className="h-6" />
          <SectionHeading>NOTE</SectionHeading>
          <div className="flex flex-col gap-3">
            {idea.note.map((p, i) => (
              <p key={i} className="text-[14px] text-text-primary leading-[1.6]">
                {p}
              </p>
            ))}
          </div>
        </>
      )}

      {idea.refs && idea.refs.length > 0 && (
        <>
          <div className="h-6" />
          <SectionHeading action={<AddLink />}>{`REFERENCES · ${idea.refs.length}`}</SectionHeading>
          <div>
            {idea.refs.map((r, i) => (
              <div
                key={i}
                className={`flex items-start gap-3 py-2 ${
                  i < idea.refs!.length - 1 ? "border-b border-border-subtle" : ""
                }`}
              >
                <span className="text-text-tertiary text-[13px] leading-[1.4]">↗</span>
                <div className="min-w-0">
                  <a
                    href="#"
                    onClick={(e) => e.preventDefault()}
                    className="block text-[13px] text-text-primary hover:text-[hsl(var(--accent))] transition-colors"
                  >
                    {r.title}
                  </a>
                  <div className="mt-1 font-mono text-[11px] text-text-tertiary truncate">
                    {r.url}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {idea.images && idea.images.length > 0 && (
        <>
          <div className="h-6" />
          <SectionHeading action={<AddLink />}>{`ATTACHMENTS · ${idea.images.length}`}</SectionHeading>
          <div className="flex flex-wrap gap-3">
            {idea.images.map((img, i) => (
              <div
                key={i}
                className="w-[200px] h-[140px] bg-surface-hover border border-border-subtle rounded-[4px] flex items-center justify-center"
              >
                <span className="font-mono text-[11px] text-text-tertiary">[ Image: {img} ]</span>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="h-8" />

      {overlay === null && (
        <div className="flex items-center gap-3">
          <GhostButton onClick={() => setOverlay("action")}>Convert to action</GhostButton>
          <GhostButton onClick={() => setOverlay("project")}>Convert to project</GhostButton>
          <TertiaryLink onClick={() => setOverlay("discard")}>Discard</TertiaryLink>
        </div>
      )}
      {overlay === "action" && (
        <ConvertActionOverlay idea={idea} onClose={() => setOverlay(null)} />
      )}
      {overlay === "project" && (
        <ConvertProjectOverlay idea={idea} onClose={() => setOverlay(null)} />
      )}
      {overlay === "discard" && <DiscardConfirm onClose={() => setOverlay(null)} />}
    </div>
  );
};

/* ===== Empty states ===== */
const EmptyDetail: React.FC = () => (
  <div className="h-full flex flex-col items-center justify-center text-center px-10">
    <div className="text-[14px] text-text-secondary">Select an idea to view details</div>
    <div className="mt-1 font-mono text-[11px] text-text-tertiary">or capture a new one above</div>
  </div>
);

const EmptyFiltered: React.FC<{ onClear: () => void }> = ({ onClear }) => (
  <div className="h-full flex flex-col items-center justify-center text-center px-10">
    <div className="text-[14px] text-text-secondary">No ideas match these filters</div>
    <div className="mt-1 font-mono text-[11px] text-text-tertiary">
      Clear filters or change them above.
    </div>
    <div className="mt-4">
      <GhostButton onClick={onClear}>Clear filters</GhostButton>
    </div>
  </div>
);

/* ===== Page ===== */
type GoalFilter = "all" | Goal;

const useQueryGoal = (): GoalFilter | null => {
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const g = params.get("goal");
  if (g === "g1" || g === "g2") return g;
  return null;
};

const Ideas: React.FC = () => {
  const initialGoal = useQueryGoal();
  const [goalFilter, setGoalFilter] = useState<GoalFilter>(initialGoal ?? "all");
  const [statusFilter, setStatusFilter] = useState<Status>("captured");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string>("i1");
  const location = useLocation();

  const filtered = useMemo(() => {
    return IDEAS.filter((i) => {
      if (goalFilter !== "all" && i.goal !== goalFilter) return false;
      if (i.status !== statusFilter) return false;
      if (query.trim() && !i.title.toLowerCase().includes(query.trim().toLowerCase())) return false;
      return true;
    }).sort((a, b) => b.capturedSort - a.capturedSort);
  }, [goalFilter, statusFilter, query]);

  const selected = filtered.find((i) => i.id === selectedId) ?? filtered[0];

  React.useEffect(() => {
    if (selected && selected.id !== selectedId) setSelectedId(selected.id);
  }, [selected, selectedId]);

  const meta = useMemo(() => {
    const total = IDEAS.filter((i) => i.status === "captured").length;
    const g1c = IDEAS.filter((i) => i.status === "captured" && i.goal === "g1").length;
    const g2c = IDEAS.filter((i) => i.status === "captured" && i.goal === "g2").length;
    return `${total} captured · ${g1c} in Launch YouTube channel · ${g2c} in Lose 5 kg`;
  }, []);

  const clearFilters = () => {
    setGoalFilter("all");
    setStatusFilter("captured");
    setQuery("");
  };

  return (
    <div className="min-h-screen bg-surface-base text-text-primary">
      <Sidebar activePath={location.pathname} />
      <main className="ml-[220px] flex flex-col h-screen">
        {/* Header */}
        <div className="px-8 py-6 border-b border-border-subtle shrink-0">
          <div className="flex items-center justify-between">
            <h1 className="text-[24px] font-medium text-text-primary">Ideas</h1>
            <div className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-tertiary tabular-nums">
              {meta}
            </div>
          </div>
          <div className="h-3" />
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-6 flex-wrap">
              <FilterGroup label="GOAL">
                <Chip active={goalFilter === "all"} onClick={() => setGoalFilter("all")}>
                  All
                </Chip>
                <Chip
                  active={goalFilter === "g1"}
                  onClick={() => setGoalFilter("g1")}
                  dot={G1}
                >
                  Launch YouTube channel
                </Chip>
                <Chip active={goalFilter === "g2"} onClick={() => setGoalFilter("g2")} dot={G2}>
                  Lose 5 kg
                </Chip>
              </FilterGroup>
              <FilterGroup label="STATUS">
                <Chip
                  active={statusFilter === "captured"}
                  onClick={() => setStatusFilter("captured")}
                >
                  Captured
                </Chip>
                <Chip
                  active={statusFilter === "converted"}
                  onClick={() => setStatusFilter("converted")}
                >
                  Converted
                </Chip>
                <Chip
                  active={statusFilter === "discarded"}
                  onClick={() => setStatusFilter("discarded")}
                >
                  Discarded
                </Chip>
              </FilterGroup>
              <button className="font-mono text-[11px] text-text-secondary hover:text-text-primary inline-flex items-center gap-1 transition-colors">
                Sort: Recent first <span className="text-text-tertiary">▾</span>
              </button>
            </div>
            <div className="flex items-center gap-2 bg-surface-raised border border-border-subtle rounded-[4px] px-2.5 py-1.5 w-[240px]">
              <span className="text-[12px] text-text-tertiary">⌕</span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search ideas..."
                className="flex-1 bg-transparent outline-none text-[13px] text-text-primary placeholder:text-text-tertiary"
              />
            </div>
          </div>
        </div>

        {/* Two-column body */}
        <div className="flex-1 flex min-h-0">
          {/* Left column */}
          <div className="w-[42%] border-r border-border-subtle flex flex-col min-h-0">
            <div className="p-4 border-b border-border-subtle shrink-0">
              <CaptureInput subHint="Captured ideas land in your default goal — Launch YouTube channel." />
            </div>
            <div className="flex-1 overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="p-8 text-center font-mono text-[11px] text-text-tertiary">
                  No ideas match these filters.
                </div>
              ) : (
                filtered.map((idea) => (
                  <IdeaRow
                    key={idea.id}
                    idea={idea}
                    selected={selected?.id === idea.id}
                    onSelect={() => setSelectedId(idea.id)}
                  />
                ))
              )}
            </div>
          </div>

          {/* Right column */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {filtered.length === 0 ? (
              <EmptyFiltered onClear={clearFilters} />
            ) : selected ? (
              <IdeaDetail idea={selected} key={selected.id} />
            ) : (
              <EmptyDetail />
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Ideas;
