// /admin/components — visual smoke test of every component in every state.
// Dev tool. Gated by settings.showAdminTools for nav visibility (URL works directly).

import React from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Plus, Search, ChevronDown } from "lucide-react";
import { useStore } from "@/store/useStore";
import { ImpactPill, TimePill } from "@/components/MetaPills";
import { ActionRow } from "@/components/ActionRow";
import { EmptyState, FilteredEmpty, ReviewEmpty } from "@/components/EmptyState";
import { ConfirmModal } from "@/components/ConfirmModal";
import { ProjectCard } from "@/components/ProjectCard";
import { Avatar, TierBadge } from "@/components/UserMenu";
import { FilterDropdown } from "@/components/FilterDropdown";
import { PageHeader } from "@/components/PageHeader";
import {
  SEED_GOALS,
  SEED_PROJECTS,
  SEED_ACTIONS,
  SEED_RITUALS,
  SEED_IDEAS,
  GOAL_IDS,
  PROJECT_IDS,
} from "@/store/mockData";
import type { Action } from "@/types";

// ───────── Mock data fixtures ─────────
const MOCK_GOALS = SEED_GOALS;
const MOCK_PROJECTS = SEED_PROJECTS;
const MOCK_ACTIONS = SEED_ACTIONS;
const MOCK_RITUALS = SEED_RITUALS;
const MOCK_IDEAS = SEED_IDEAS;

const STORAGE_TOGGLE = "admin-components-source";

// ───────── Layout primitives ─────────
const Section: React.FC<{
  id: string;
  title: string;
  description: string;
  children: React.ReactNode;
}> = ({ id, title, description, children }) => (
  <section id={id} style={{ scrollMarginTop: 120 }} className="pt-8">
    <div className="text-[18px] font-medium text-text-primary">{title}</div>
    <div className="text-[14px] text-text-secondary mt-1">{description}</div>
    <div className="mt-6 flex flex-col gap-8">{children}</div>
    <div className="mt-10 border-t border-border-subtle" />
  </section>
);

const Sample: React.FC<{
  name: string;
  spec?: string;
  children: React.ReactNode;
}> = ({ name, spec, children }) => (
  <div>
    <div className="flex items-baseline gap-3">
      <div
        className="font-mono uppercase text-text-primary"
        style={{ fontSize: 11, letterSpacing: "0.06em" }}
      >
        {name}
      </div>
      {spec && (
        <div
          className="font-mono text-text-tertiary"
          style={{ fontSize: 11, letterSpacing: "0.04em" }}
        >
          {spec}
        </div>
      )}
    </div>
    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {children}
    </div>
  </div>
);

const Cell: React.FC<{ label: string; children: React.ReactNode }> = ({
  label,
  children,
}) => (
  <div className="flex flex-col gap-2">
    <div
      className="font-mono uppercase text-text-tertiary"
      style={{ fontSize: 10, letterSpacing: "0.06em" }}
    >
      {label}
    </div>
    <div
      className="rounded-[4px] bg-surface-raised flex items-center justify-center"
      style={{
        padding: 16,
        border: "1px solid hsl(var(--border-subtle))",
        minHeight: 60,
      }}
    >
      {children}
    </div>
  </div>
);

// ───────── Atoms ─────────
const COLOR_TOKENS = [
  ["surface-base", "Surface base"],
  ["surface-raised", "Surface raised"],
  ["surface-elevated", "Surface elevated"],
  ["surface-hover", "Surface hover"],
  ["text-primary", "Text primary"],
  ["text-secondary", "Text secondary"],
  ["text-tertiary", "Text tertiary"],
  ["text-warning", "Text warning"],
  ["border-subtle", "Border subtle"],
  ["border-default", "Border default"],
  ["accent", "Accent"],
  ["state-active", "State active"],
  ["state-stalled", "State stalled"],
  ["status-dropped", "Status dropped"],
  ["goal-1", "Goal 1"],
  ["goal-2", "Goal 2"],
  ["goal-3", "Goal 3"],
];

const Atoms: React.FC = () => (
  <Section
    id="atoms"
    title="Atoms"
    description="Color tokens, typography scale, spacing scale."
  >
    <Sample name="Color tokens" spec="08-DESIGN-SYSTEM § 1">
      {COLOR_TOKENS.map(([token, name]) => (
        <Cell key={token} label={name}>
          <div className="flex items-center gap-3 w-full">
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 4,
                background: `hsl(var(--${token}))`,
                border: "1px solid hsl(var(--border-subtle))",
              }}
            />
            <div className="flex flex-col">
              <span className="font-mono text-[11px] text-text-primary">--{token}</span>
              <span className="font-mono text-[10px] text-text-tertiary">hsl(var(--{token}))</span>
            </div>
          </div>
        </Cell>
      ))}
    </Sample>

    <Sample name="Typography" spec="08-DESIGN-SYSTEM § 2">
      <Cell label="Inter 24 medium">
        <span className="text-[24px] font-medium text-text-primary">Page heading</span>
      </Cell>
      <Cell label="Inter 18 medium">
        <span className="text-[18px] font-medium text-text-primary">Section heading</span>
      </Cell>
      <Cell label="Inter 16">
        <span className="text-[16px] text-text-primary">Body large</span>
      </Cell>
      <Cell label="Inter 14">
        <span className="text-[14px] text-text-primary">Body</span>
      </Cell>
      <Cell label="Inter 13 secondary">
        <span className="text-[13px] text-text-secondary">Secondary copy</span>
      </Cell>
      <Cell label="Mono 11 uppercase">
        <span
          className="font-mono uppercase text-text-tertiary"
          style={{ fontSize: 11, letterSpacing: "0.06em" }}
        >
          SECTION LABEL
        </span>
      </Cell>
    </Sample>

    <Sample name="Spacing scale" spec="08-DESIGN-SYSTEM § 4">
      {[4, 8, 12, 16, 24, 32, 48, 64].map((px) => (
        <Cell key={px} label={`${px}px`}>
          <div className="flex items-center gap-3 w-full">
            <div
              style={{
                width: px,
                height: 16,
                background: "hsl(var(--accent))",
                borderRadius: 2,
              }}
            />
            <span className="font-mono text-[11px] text-text-tertiary">{px}</span>
          </div>
        </Cell>
      ))}
    </Sample>
  </Section>
);

// ───────── Buttons ─────────
const TierAButton: React.FC<{ label: string; disabled?: boolean }> = ({ label, disabled }) => (
  <button
    type="button"
    disabled={disabled}
    onClick={() => toast.success(`${label} clicked`)}
    className="h-9 px-4 text-[13px] font-medium rounded-[4px] text-white transition-colors disabled:opacity-50"
    style={{ background: "hsl(var(--accent))" }}
  >
    {label}
  </button>
);
const TierBButton: React.FC<{ label: string; disabled?: boolean }> = ({ label, disabled }) => (
  <button
    type="button"
    disabled={disabled}
    onClick={() => toast.success(`${label} clicked`)}
    className="h-9 px-4 text-[13px] font-medium rounded-[4px] text-text-primary hover:bg-surface-hover transition-colors disabled:opacity-50"
    style={{ border: "1px solid hsl(var(--border-default))" }}
  >
    {label}
  </button>
);
const TierCButton: React.FC<{ label: string; disabled?: boolean }> = ({ label, disabled }) => (
  <button
    type="button"
    disabled={disabled}
    onClick={() => toast.success(`${label} clicked`)}
    className="h-9 px-3 text-[13px] text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors rounded-[4px] disabled:opacity-50"
  >
    {label}
  </button>
);

const Buttons: React.FC = () => (
  <Section id="buttons" title="Buttons" description="Three tiers, hover and disabled states for each.">
    <Sample name="Tier A — Primary" spec="08-DESIGN-SYSTEM § 3.1">
      <Cell label="Default"><TierAButton label="Save" /></Cell>
      <Cell label="Disabled"><TierAButton label="Save" disabled /></Cell>
    </Sample>
    <Sample name="Tier B — Secondary" spec="08-DESIGN-SYSTEM § 3.2">
      <Cell label="Default"><TierBButton label="Cancel" /></Cell>
      <Cell label="Disabled"><TierBButton label="Cancel" disabled /></Cell>
    </Sample>
    <Sample name="Tier C — Ghost" spec="08-DESIGN-SYSTEM § 3.3">
      <Cell label="Default"><TierCButton label="Skip" /></Cell>
      <Cell label="Disabled"><TierCButton label="Skip" disabled /></Cell>
    </Sample>
    <Sample name="Icon-only" spec="08-DESIGN-SYSTEM § 3.4">
      <Cell label="Default">
        <button
          type="button"
          className="w-8 h-8 flex items-center justify-center rounded-[4px] text-text-tertiary hover:text-text-primary hover:bg-surface-hover transition-colors"
        >
          <Plus size={16} />
        </button>
      </Cell>
    </Sample>
    <Sample name="Mobile FAB" spec="08-DESIGN-SYSTEM § 3.5">
      <Cell label="Default">
        <button
          type="button"
          className="w-12 h-12 rounded-full text-white flex items-center justify-center shadow-lg"
          style={{ background: "hsl(var(--accent))" }}
        >
          <Plus size={20} />
        </button>
      </Cell>
    </Sample>
  </Section>
);

// ───────── Inputs ─────────
const Inputs: React.FC = () => {
  const [text, setText] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [num, setNum] = React.useState(30);
  const [toggle, setToggle] = React.useState(true);
  return (
    <Section id="inputs" title="Inputs" description="Text, search, inline-add, dropdowns, steppers, toggles.">
      <Sample name="Text input">
        <Cell label="Default">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type here…"
            className="w-full bg-surface-hover rounded-[4px] px-3 py-2 text-[13px] text-text-primary outline-none border border-transparent focus:border-border-default"
          />
        </Cell>
        <Cell label="Disabled">
          <input
            type="text"
            disabled
            placeholder="Disabled"
            className="w-full bg-surface-hover rounded-[4px] px-3 py-2 text-[13px] text-text-tertiary outline-none opacity-50"
          />
        </Cell>
        <Cell label="Error">
          <input
            type="text"
            defaultValue="Invalid"
            className="w-full bg-surface-hover rounded-[4px] px-3 py-2 text-[13px] text-text-primary outline-none"
            style={{ border: "1px solid hsl(var(--text-warning))" }}
          />
        </Cell>
      </Sample>

      <Sample name="Textarea">
        <Cell label="Default">
          <textarea
            rows={3}
            placeholder="Notes…"
            className="w-full bg-surface-hover rounded-[4px] px-3 py-2 text-[13px] text-text-primary outline-none border border-transparent focus:border-border-default resize-none"
          />
        </Cell>
      </Sample>

      <Sample name="Search input">
        <Cell label="Default">
          <div className="w-full flex items-center gap-2 bg-surface-hover rounded-[4px] px-3 py-2">
            <Search size={14} className="text-text-tertiary" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search…"
              className="flex-1 bg-transparent text-[13px] text-text-primary outline-none"
            />
          </div>
        </Cell>
      </Sample>

      <Sample name="Inline-add">
        <Cell label="Default">
          <div
            className="w-full flex items-center gap-2 rounded-[4px] px-3 py-2 text-text-tertiary"
            style={{ border: "1px dashed hsl(var(--border-subtle))" }}
          >
            <Plus size={14} />
            <span className="text-[13px]">Add an action…</span>
          </div>
        </Cell>
      </Sample>

      <Sample name="Number stepper">
        <Cell label="Value">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setNum((n) => Math.max(0, n - 5))}
              className="w-7 h-7 rounded-[4px] bg-surface-hover text-text-primary"
            >
              −
            </button>
            <span className="w-10 text-center font-mono text-[13px] tabular-nums text-text-primary">
              {num}
            </span>
            <button
              type="button"
              onClick={() => setNum((n) => n + 5)}
              className="w-7 h-7 rounded-[4px] bg-surface-hover text-text-primary"
            >
              +
            </button>
          </div>
        </Cell>
      </Sample>

      <Sample name="Toggle switch">
        <Cell label={toggle ? "On" : "Off"}>
          <button
            type="button"
            role="switch"
            aria-checked={toggle}
            onClick={() => setToggle((v) => !v)}
            className="rounded-full transition-colors"
            style={{
              width: 32,
              height: 18,
              background: toggle ? "hsl(var(--accent))" : "hsl(var(--surface-hover))",
              border: "1px solid hsl(var(--border-subtle))",
              position: "relative",
            }}
          >
            <span
              className="block rounded-full bg-white transition-transform"
              style={{
                width: 12,
                height: 12,
                position: "absolute",
                top: 2,
                left: 2,
                transform: toggle ? "translateX(14px)" : "translateX(0)",
              }}
            />
          </button>
        </Cell>
      </Sample>
    </Section>
  );
};

// ───────── Pills ─────────
const ColorDatePill: React.FC<{
  kind: "overdue" | "today" | "soon" | "later" | "none";
  label: string;
}> = ({ kind, label }) => {
  const palette: Record<typeof kind, { bg: string; fg: string }> = {
    overdue: { bg: "hsl(var(--text-warning) / 0.12)", fg: "hsl(var(--text-warning))" },
    today: { bg: "hsl(var(--accent) / 0.12)", fg: "hsl(var(--accent))" },
    soon: { bg: "hsl(var(--state-active) / 0.12)", fg: "hsl(var(--state-active))" },
    later: { bg: "hsl(var(--surface-hover))", fg: "hsl(var(--text-secondary))" },
    none: { bg: "transparent", fg: "hsl(var(--text-tertiary))" },
  };
  const p = palette[kind];
  return (
    <span
      className="inline-flex items-center justify-center font-mono uppercase tabular-nums"
      style={{
        padding: "3px 8px",
        borderRadius: 4,
        fontSize: 11,
        letterSpacing: "0.04em",
        background: p.bg,
        color: p.fg,
        border: kind === "none" ? "1px dashed hsl(var(--border-subtle))" : "none",
      }}
    >
      {label}
    </span>
  );
};

const StatusPill: React.FC<{ label: string; tone: "neutral" | "success" | "muted" }> = ({
  label,
  tone,
}) => {
  const palette = {
    neutral: { bg: "hsl(var(--surface-hover))", fg: "hsl(var(--text-secondary))" },
    success: { bg: "hsl(var(--state-active) / 0.12)", fg: "hsl(var(--state-active))" },
    muted: { bg: "transparent", fg: "hsl(var(--text-tertiary))" },
  } as const;
  const p = palette[tone];
  return (
    <span
      className="inline-flex items-center justify-center font-mono uppercase"
      style={{
        padding: "3px 8px",
        borderRadius: 4,
        fontSize: 10,
        letterSpacing: "0.06em",
        background: p.bg,
        color: p.fg,
      }}
    >
      {label}
    </span>
  );
};

const Pills: React.FC = () => (
  <Section id="pills" title="Pills" description="Compact information units. Color tints carry semantics.">
    <Sample name="ImpactPill — all goals × I1-I10" spec="MetaPills.tsx">
      {(["goal-1", "goal-2", "goal-3"] as const).map((g) => (
        <Cell key={g} label={`var(--${g})`}>
          <div className="flex flex-wrap gap-1.5">
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
              <ImpactPill key={n} impact={n} goalColor={`hsl(var(--${g}))`} />
            ))}
          </div>
        </Cell>
      ))}
      <Cell label="Dimmed (Done)">
        <ImpactPill impact={7} goalColor="hsl(var(--goal-1))" dimmed />
      </Cell>
    </Sample>

    <Sample name="TimePill" spec="MetaPills.tsx">
      <Cell label="Variants">
        <div className="flex flex-wrap gap-1.5">
          {[20, 45, 60, 90, 120, 150, 180].map((m) => (
            <TimePill key={m} minutes={m} />
          ))}
        </div>
      </Cell>
    </Sample>

    <Sample name="MultiplierPill">
      <Cell label="Variants">
        <div className="flex flex-wrap gap-1.5">
          {[1.0, 1.25, 1.5, 2.0].map((m) => (
            <span
              key={m}
              className="inline-flex items-center justify-center font-mono tabular-nums"
              style={{
                padding: "3px 7px",
                borderRadius: 4,
                fontSize: 11,
                background: "hsl(var(--goal-1) / 0.12)",
                color: "hsl(var(--goal-1))",
              }}
            >
              ×{m.toFixed(2)}
            </span>
          ))}
        </div>
      </Cell>
    </Sample>

    <Sample name="ColorCodedDatePill (desktop)">
      <Cell label="Overdue"><ColorDatePill kind="overdue" label="2D OVERDUE" /></Cell>
      <Cell label="Today"><ColorDatePill kind="today" label="TODAY" /></Cell>
      <Cell label="≤7d"><ColorDatePill kind="soon" label="MAY 8" /></Cell>
      <Cell label="≥8d"><ColorDatePill kind="later" label="MAY 22" /></Cell>
      <Cell label="No date"><ColorDatePill kind="none" label="—" /></Cell>
    </Sample>

    <Sample name="Idea status pill">
      <Cell label="Captured"><StatusPill label="CAPTURED" tone="neutral" /></Cell>
      <Cell label="Converted"><StatusPill label="CONVERTED" tone="success" /></Cell>
      <Cell label="Discarded"><StatusPill label="DISCARDED" tone="muted" /></Cell>
    </Sample>

    <Sample name="Tier badge">
      <Cell label="Free"><TierBadge tier="free" /></Cell>
      <Cell label="Pro"><TierBadge tier="pro" /></Cell>
    </Sample>
  </Section>
);

// ───────── Rows ─────────
const Rows: React.FC<{ live: boolean }> = ({ live }) => {
  const liveActions = useStore((s) => s.actions);
  const actions = live ? liveActions : MOCK_ACTIONS;
  const byStatus = (status: Action["status"]) => actions.find((a) => a.status === status);
  const states: Action["status"][] = ["backlog", "planned", "done", "delegated", "dropped", "cancelled"];

  return (
    <Section id="rows" title="Rows" description="Action / Delegated / Idea / Ritual list rows.">
      <Sample name="ActionRow — by status" spec="ActionRow.tsx">
        {states.map((s) => {
          const a = byStatus(s);
          if (!a) return (
            <Cell key={s} label={s.toUpperCase()}>
              <div className="text-[12px] text-text-tertiary">no sample</div>
            </Cell>
          );
          return (
            <div key={s} className="col-span-1 sm:col-span-2 lg:col-span-3">
              <div
                className="font-mono uppercase text-text-tertiary mb-2"
                style={{ fontSize: 10, letterSpacing: "0.06em" }}
              >
                {s.toUpperCase()}
              </div>
              <div className="rounded-[4px] overflow-hidden" style={{ border: "1px solid hsl(var(--border-subtle))" }}>
                <ActionRow action={a} borderBottom={false} />
              </div>
            </div>
          );
        })}
      </Sample>

      <Sample name="ActionRow with Main Task star">
        {(() => {
          const a = byStatus("planned") ?? actions[0];
          if (!a) return null;
          return (
            <div className="col-span-1 sm:col-span-2 lg:col-span-3">
              <div className="rounded-[4px] overflow-hidden" style={{ border: "1px solid hsl(var(--border-subtle))" }}>
                <ActionRow action={a} borderBottom={false} isMainTask />
              </div>
            </div>
          );
        })()}
      </Sample>
    </Section>
  );
};

// ───────── Cards ─────────
const dayTypeCards = [
  { key: "execution", label: "Execution", color: "hsl(var(--state-active))", desc: "A normal working day." },
  { key: "recovery", label: "Recovery", color: "hsl(var(--goal-3))", desc: "Lighter day. Pace yourself." },
  { key: "day-off", label: "Day Off", color: "hsl(var(--text-tertiary))", desc: "No work. Rest." },
  { key: "sick", label: "Sick", color: "hsl(var(--text-warning))", desc: "Recover fully." },
];

const Cards: React.FC<{ live: boolean }> = ({ live }) => {
  const liveProjects = useStore((s) => s.projects);
  const projects = live ? liveProjects : MOCK_PROJECTS;
  const goalsList = live ? useStore.getState().goals : MOCK_GOALS;
  const sample = projects.find((p) => p.status === "active");
  const sampleGoal = sample ? goalsList.find((g) => g.id === sample.goalId) : null;

  return (
    <Section id="cards" title="Cards" description="Project, ritual, day-type, and stat tile cards.">
      <Sample name="Project card" spec="ProjectCard.tsx">
        {sample && sampleGoal ? (
          <div className="col-span-1 sm:col-span-2 lg:col-span-3">
            <ProjectCard
              projectId={sample.id}
              goalLabel={sampleGoal.title}
              goalColor={`hsl(var(--${sampleGoal.color}))`}
            />
          </div>
        ) : (
          <Cell label="No project"><span className="text-text-tertiary text-[12px]">—</span></Cell>
        )}
      </Sample>

      <Sample name="Day Type card" spec="PlanCloseModals.tsx">
        {dayTypeCards.map((d) => (
          <Cell key={d.key} label={d.label.toUpperCase()}>
            <div
              className="w-full rounded-[6px] cursor-pointer transition-all"
              style={{
                padding: 16,
                background: `color-mix(in srgb, ${d.color} 8%, transparent)`,
                border: `1px solid ${d.color}`,
              }}
            >
              <div className="text-[16px] font-medium" style={{ color: d.color }}>
                {d.label}
              </div>
              <div className="text-[12px] text-text-secondary mt-1">{d.desc}</div>
            </div>
          </Cell>
        ))}
      </Sample>

      <Sample name="Stat tile" spec="CloseDayRecap.tsx">
        {[
          { label: "Done", value: 7 },
          { label: "Skipped", value: 1 },
          { label: "Hours", value: "4.5" },
          { label: "Impact", value: 38 },
        ].map((t) => (
          <Cell key={t.label} label={t.label.toUpperCase()}>
            <div
              className="w-full rounded-[6px] bg-surface-raised"
              style={{ padding: 16, border: "1px solid hsl(var(--border-subtle))" }}
            >
              <div className="font-mono text-[11px] uppercase text-text-tertiary tracking-[0.06em]">
                {t.label}
              </div>
              <div className="text-[24px] font-medium tabular-nums text-text-primary mt-1">
                {t.value}
              </div>
            </div>
          </Cell>
        ))}
      </Sample>
    </Section>
  );
};

// ───────── Headers ─────────
const Headers: React.FC = () => (
  <Section id="headers" title="Headers" description="Unified page header pattern across routes.">
    {[
      { title: "Today", meta: "Wed · May 5", cta: "Plan today" },
      { title: "Actions", meta: "12 active · 3 overdue", cta: "Add action" },
      { title: "Projects", meta: "5 active · 2 stalled", cta: "New project" },
      { title: "Goals", meta: "3 / 3 active", cta: undefined },
      { title: "Rituals", meta: "5 active", cta: "Add ritual" },
      { title: "Ideas", meta: "8 captured", cta: "Capture idea" },
      { title: "Sessions", meta: "1 in progress", cta: "Start session" },
      { title: "Days", meta: "Last 30 days", cta: undefined },
      { title: "Weeks", meta: "ISO weeks", cta: undefined },
      { title: "Months", meta: "2026", cta: undefined },
      { title: "Progress", meta: "Year overview", cta: undefined },
      { title: "Delegated", meta: "2 outstanding", cta: undefined },
    ].map((h) => (
      <div key={h.title}>
        <div
          className="font-mono uppercase text-text-tertiary mb-2"
          style={{ fontSize: 11, letterSpacing: "0.06em" }}
        >
          /{h.title.toLowerCase().replace(/\s/g, "-")}
        </div>
        <div className="rounded-[4px] bg-surface-raised p-4" style={{ border: "1px solid hsl(var(--border-subtle))" }}>
          <PageHeader
            title={h.title}
            meta={h.meta}
            cta={h.cta ? { label: h.cta, onClick: () => toast.info(`${h.cta} clicked`) } : undefined}
          />
        </div>
      </div>
    ))}
  </Section>
);

// ───────── Filters ─────────
const Filters: React.FC = () => {
  const [val, setVal] = React.useState<string>("all");
  return (
    <Section id="filters" title="Filters" description="Dropdown triggers and full filter bar.">
      <Sample name="FilterDropdown" spec="FilterDropdown.tsx">
        <Cell label="Default value">
          <FilterDropdown
            label="Goal"
            value={val}
            defaultValue="all"
            onChange={setVal}
            options={[
              { value: "all", label: "All" },
              { value: "g1", label: "Launch YouTube channel" },
              { value: "g2", label: "Lose 5 kg" },
            ]}
          />
        </Cell>
        <Cell label="Active value">
          <FilterDropdown
            label="Goal"
            value={"g2"}
            defaultValue="all"
            onChange={() => {}}
            options={[
              { value: "all", label: "All" },
              { value: "g2", label: "Lose 5 kg" },
            ]}
          />
        </Cell>
      </Sample>
    </Section>
  );
};

// ───────── Empty states ─────────
const Empties: React.FC = () => (
  <Section id="empty" title="Empty states" description="True empty, filtered empty, review empty.">
    <Sample name="True empty (Actions)">
      <div className="col-span-1 sm:col-span-2 lg:col-span-3">
        <div className="rounded-[4px] bg-surface-raised" style={{ border: "1px solid hsl(var(--border-subtle))", padding: 16 }}>
          <EmptyState
            headline="No actions yet"
            description="Capture your first move toward a goal."
            ctaLabel="Add action"
            onCta={() => toast.info("Add clicked")}
            hint="⌘N to add quickly"
          />
        </div>
      </div>
    </Sample>
    <Sample name="Filtered empty">
      <div className="col-span-1 sm:col-span-2 lg:col-span-3">
        <div className="rounded-[4px] bg-surface-raised" style={{ border: "1px solid hsl(var(--border-subtle))" }}>
          <FilteredEmpty onClear={() => toast.info("Cleared")} />
        </div>
      </div>
    </Sample>
    <Sample name="Review empty">
      <div className="col-span-1 sm:col-span-2 lg:col-span-3">
        <div className="rounded-[4px] bg-surface-raised" style={{ border: "1px solid hsl(var(--border-subtle))" }}>
          <ReviewEmpty message="No closed days yet." />
        </div>
      </div>
    </Sample>
  </Section>
);

// ───────── Modals ─────────
const Modals: React.FC = () => {
  const [open, setOpen] = React.useState<string | null>(null);
  return (
    <Section id="modals" title="Modals & overlays" description="Live preview — click to open the actual production overlay.">
      <Sample name="ConfirmModal — Tier 1">
        <Cell label="Trigger">
          <TierBButton label="Open confirm" />
        </Cell>
        <Cell label="Trigger (destructive)">
          <button
            type="button"
            onClick={() => setOpen("destructive")}
            className="h-9 px-4 text-[13px] font-medium rounded-[4px] hover:bg-surface-hover transition-colors"
            style={{ color: "hsl(var(--text-warning))", border: "1px solid hsl(var(--text-warning))" }}
          >
            Open destructive
          </button>
        </Cell>
        <Cell label="Trigger (single button)">
          <button
            type="button"
            onClick={() => setOpen("single")}
            className="h-9 px-4 text-[13px] font-medium rounded-[4px] text-white"
            style={{ background: "hsl(var(--accent))" }}
          >
            Open "Pro is coming soon"
          </button>
        </Cell>
      </Sample>

      <ConfirmModal
        open={open === "destructive"}
        title="Drop this action?"
        body="It will move to the Dropped state. You can reopen it later."
        destructive
        confirmLabel="Drop"
        onCancel={() => setOpen(null)}
        onConfirm={() => setOpen(null)}
      />
      <ConfirmModal
        open={open === "single"}
        title="Pro is coming soon"
        body="We'll email you when it's ready."
        cancelLabel=""
        confirmLabel="Got it"
        onCancel={() => setOpen(null)}
        onConfirm={() => setOpen(null)}
      />
    </Section>
  );
};

// ───────── Toasts ─────────
const Toasts: React.FC = () => (
  <Section id="toasts" title="Toasts" description="Sonner success / info / warning / action variants.">
    <Sample name="Variants">
      <Cell label="Success">
        <TierBButton label="Action created" />
      </Cell>
      <Cell label="Info">
        <button
          type="button"
          onClick={() => toast.info("Idea captured in 'Launch YouTube channel'")}
          className="h-9 px-4 text-[13px] rounded-[4px] hover:bg-surface-hover transition-colors text-text-primary"
          style={{ border: "1px solid hsl(var(--border-default))" }}
        >
          Idea captured
        </button>
      </Cell>
      <Cell label="Warning">
        <button
          type="button"
          onClick={() => toast.warning("Action overdue?")}
          className="h-9 px-4 text-[13px] rounded-[4px] hover:bg-surface-hover transition-colors"
          style={{ border: "1px solid hsl(var(--text-warning))", color: "hsl(var(--text-warning))" }}
        >
          Show warning
        </button>
      </Cell>
      <Cell label="With undo">
        <button
          type="button"
          onClick={() =>
            toast("Action marked done.", {
              action: { label: "Undo", onClick: () => toast.info("Undone") },
            })
          }
          className="h-9 px-4 text-[13px] rounded-[4px] hover:bg-surface-hover transition-colors text-text-primary"
          style={{ border: "1px solid hsl(var(--border-default))" }}
        >
          Show with undo
        </button>
      </Cell>
    </Sample>
  </Section>
);

// ───────── Avatar / user menu ─────────
const Avatars: React.FC = () => (
  <Section id="avatar" title="Avatar & user menu" description="Identity display variants.">
    <Sample name="Avatar">
      {["Anders K.", "Maria Schmidt", "Sam Lee", "Julia O.", "Andrei P."].map((n) => (
        <Cell key={n} label={n}>
          <Avatar name={n} size={32} />
        </Cell>
      ))}
    </Sample>
    <Sample name="Tier badge inline">
      <Cell label="Free"><TierBadge tier="free" /></Cell>
      <Cell label="Pro"><TierBadge tier="pro" /></Cell>
    </Sample>
  </Section>
);

// ───────── Day Type dropdown trigger ─────────
const DayTypeSection: React.FC = () => (
  <Section id="day-type" title="Day Type" description="Plan today step 2 dropdown trigger.">
    <Sample name="Compact dropdown trigger">
      {dayTypeCards.map((d) => (
        <Cell key={d.key} label={d.label}>
          <button
            type="button"
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-[4px] hover:bg-surface-hover transition-colors"
            style={{ border: "1px solid hsl(var(--border-default))" }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: d.color,
                display: "inline-block",
              }}
            />
            <span className="text-[13px] text-text-primary">{d.label}</span>
            <ChevronDown size={14} className="text-text-tertiary" />
          </button>
        </Cell>
      ))}
    </Sample>
  </Section>
);

// ───────── Page ─────────
const NAV = [
  ["atoms", "Atoms"],
  ["buttons", "Buttons"],
  ["inputs", "Inputs"],
  ["pills", "Pills"],
  ["rows", "Rows"],
  ["cards", "Cards"],
  ["headers", "Headers"],
  ["filters", "Filters"],
  ["empty", "Empty"],
  ["modals", "Modals"],
  ["toasts", "Toasts"],
  ["avatar", "Avatar"],
  ["day-type", "Day Type"],
];

export default function AdminComponents() {
  const [source, setSource] = React.useState<"mock" | "live">(() => {
    const v = typeof window !== "undefined" && window.localStorage.getItem(STORAGE_TOGGLE);
    return v === "live" ? "live" : "mock";
  });
  const live = source === "live";

  React.useEffect(() => {
    window.localStorage.setItem(STORAGE_TOGGLE, source);
  }, [source]);

  // Coverage stats (rough static count of sample components)
  const coverage = React.useMemo(
    () => ({ components: 28, states: 80 }),
    [],
  );

  return (
    <div className="min-h-screen bg-surface-base text-text-primary">
      {/* Sticky header */}
      <div
        className="sticky top-0 z-40"
        style={{
          background: "hsl(var(--surface-base) / 0.92)",
          backdropFilter: "blur(8px)",
          borderBottom: "1px solid hsl(var(--border-subtle))",
        }}
      >
        <div className="max-w-[1280px] mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div>
            <div className="text-[24px] font-medium text-text-primary leading-tight">Components</div>
            <div className="text-[14px] text-text-secondary">
              Visual smoke test of every component in every state.
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/today"
              className="text-[13px] text-text-secondary hover:text-text-primary transition-colors"
            >
              ← Back
            </Link>
            <div
              className="inline-flex rounded-[4px] overflow-hidden"
              style={{ border: "1px solid hsl(var(--border-default))" }}
            >
              {(["mock", "live"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSource(s)}
                  className="px-3 py-1.5 text-[12px] font-medium transition-colors"
                  style={{
                    background: source === s ? "hsl(var(--surface-hover))" : "transparent",
                    color:
                      source === s ? "hsl(var(--text-primary))" : "hsl(var(--text-secondary))",
                  }}
                >
                  {s === "mock" ? "Mock data" : "Live data"}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="max-w-[1280px] mx-auto px-6 pb-3 flex items-center gap-2 flex-wrap">
          <span
            className="font-mono uppercase text-text-tertiary mr-2"
            style={{ fontSize: 11, letterSpacing: "0.06em" }}
          >
            Jump to:
          </span>
          {NAV.map(([id, label]) => (
            <a
              key={id}
              href={`#${id}`}
              className="font-mono uppercase text-text-secondary hover:text-text-primary transition-colors"
              style={{ fontSize: 11, letterSpacing: "0.04em" }}
            >
              {label}
            </a>
          )).reduce<React.ReactNode[]>((acc, el, i) => {
            if (i > 0) acc.push(
              <span key={`sep-${i}`} className="text-text-tertiary" style={{ fontSize: 11 }}>·</span>
            );
            acc.push(el);
            return acc;
          }, [])}
        </div>
      </div>

      <main className="max-w-[1280px] mx-auto px-6 pb-24">
        <Atoms />
        <Buttons />
        <Inputs />
        <Pills />
        <Rows live={live} />
        <Cards live={live} />
        <Headers />
        <Filters />
        <Empties />
        <Modals />
        <Toasts />
        <Avatars />
        <DayTypeSection />

        <footer className="mt-12">
          <div
            className="font-mono text-text-tertiary"
            style={{ fontSize: 11, letterSpacing: "0.04em" }}
          >
            Last updated: {new Date().toISOString().slice(0, 10)}
          </div>
          <div
            className="font-mono text-text-tertiary mt-1"
            style={{ fontSize: 11, letterSpacing: "0.04em" }}
          >
            Coverage: {coverage.components} components / {coverage.states} states.
          </div>
          <div className="text-[11px] text-text-tertiary mt-1">
            Source: {source === "mock" ? "mock fixtures" : "live LocalStorage data"} ·
            Goals seeded: {MOCK_GOALS.length} · Projects: {MOCK_PROJECTS.length} ·
            Actions: {MOCK_ACTIONS.length} · Rituals: {MOCK_RITUALS.length} · Ideas: {MOCK_IDEAS.length}
          </div>
        </footer>
      </main>
    </div>
  );
}
