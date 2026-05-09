// Full-page goal-builder. Reachable at /onboarding/goal both from the Setup
// Wizard's "own" path and from any goals=0 entry in the app. Walks the user
// through 4 ceremonial steps:
//   1. Goal (title + color)
//   2. Success Criteria (up to 5, optional)
//   3. Project (under the goal)
//   4. Actions (2–3 under the project)
// Lands on /today.

import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, X, Plus, Trash2 } from "lucide-react";
import { useStore } from "@/store/useStore";
import type { GoalColorVar } from "@/types";
import { toast } from "sonner";

const STORE_KEY = "actos.onboarding.goal";

type Step = 1 | 2 | 3 | 4;
type Persisted = { step: Step; goalId?: string; projectId?: string };

function read(): Persisted {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return { step: 1 };
    const p = JSON.parse(raw);
    if (p && (p.step === 1 || p.step === 2 || p.step === 3 || p.step === 4)) return p;
  } catch {}
  return { step: 1 };
}
function write(p: Persisted | null) {
  try {
    if (!p) localStorage.removeItem(STORE_KEY);
    else localStorage.setItem(STORE_KEY, JSON.stringify(p));
  } catch {}
}

const reducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

const GOAL_EXAMPLES = [
  "$10k MRR from my side business",
  "Reach 100k YouTube subscribers",
  "Run a sub-2h half marathon",
  "Pass C1 Spanish proficiency exam",
  "Publish my novel on Amazon",
];

const COLORS: { value: GoalColorVar; label: string }[] = [
  { value: "goal-1", label: "Teal" },
  { value: "goal-2", label: "Orange" },
  { value: "goal-3", label: "Purple" },
];

/* ───────── Shell ───────── */
const ScreenWrap: React.FC<{
  step: Step;
  onBack?: () => void;
  children: React.ReactNode;
}> = ({ step, onBack, children }) => (
  <div
    className="relative min-h-screen w-full"
    style={{
      background: "hsl(var(--surface-base))",
      color: "hsl(var(--text-primary))",
      animation: reducedMotion() ? undefined : "gbFadeIn 250ms cubic-bezier(0.32,0.72,0,1)",
    }}
  >
    <style>{`@keyframes gbFadeIn { from { opacity:0; transform: translateY(8px) } to { opacity:1; transform: none } }`}</style>
    <div className="mx-auto" style={{ maxWidth: 640, padding: "80px 24px 120px" }}>
      {children}
    </div>
    {onBack && (
      <button
        type="button"
        onClick={onBack}
        className="absolute transition-colors"
        style={{
          left: 32, bottom: 28,
          fontFamily: "Inter, ui-sans-serif, system-ui",
          fontSize: 14,
          color: "hsl(var(--text-tertiary))",
          background: "transparent", border: "none", cursor: "pointer",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "hsl(var(--text-secondary))")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "hsl(var(--text-tertiary))")}
      >
        ← Back
      </button>
    )}
    <div
      className="absolute"
      style={{
        right: 32, bottom: 28,
        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
        fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase",
        color: "hsl(var(--text-tertiary))",
      }}
    >
      Step {step} of 4
    </div>
  </div>
);

const PrimaryBtn: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ children, style, ...rest }) => (
  <button
    type="button"
    {...rest}
    className="group inline-flex items-center gap-2 transition-all"
    style={{
      fontFamily: "Inter", fontSize: 16, fontWeight: 500,
      color: "hsl(var(--accent-foreground))",
      background: "hsl(var(--accent))",
      border: "none", borderRadius: 8,
      padding: "12px 22px",
      cursor: rest.disabled ? "not-allowed" : "pointer",
      opacity: rest.disabled ? 0.4 : 1,
      ...style,
    }}
  >
    <span>{children}</span>
    <ArrowRight size={18} />
  </button>
);

const GhostLink: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ children, style, ...rest }) => (
  <button
    type="button"
    {...rest}
    style={{
      background: "transparent",
      color: "hsl(var(--text-tertiary))",
      border: "none",
      padding: "10px 8px",
      fontFamily: "Inter", fontSize: 14,
      cursor: "pointer",
      ...style,
    }}
    onMouseEnter={(e) => (e.currentTarget.style.color = "hsl(var(--text-secondary))")}
    onMouseLeave={(e) => (e.currentTarget.style.color = "hsl(var(--text-tertiary))")}
  >
    {children}
  </button>
);

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "hsl(var(--surface-raised))",
  border: "1px solid hsl(var(--border-subtle))",
  borderRadius: 8,
  padding: "12px 14px",
  color: "hsl(var(--text-primary))",
  fontFamily: "Inter", fontSize: 15, outline: "none",
};

const Heading: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h1 style={{
    margin: "0 0 12px", fontSize: 32, fontWeight: 500, lineHeight: 1.2,
    color: "hsl(var(--text-primary))",
  }}>{children}</h1>
);

const Lede: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p style={{
    margin: "0 0 32px", fontSize: 15, lineHeight: 1.55,
    color: "hsl(var(--text-secondary))", maxWidth: 560,
  }}>{children}</p>
);

/* ───────── Step 1: Goal ───────── */
const GoalStep: React.FC<{
  initialTitle: string;
  initialColor: GoalColorVar;
  onSubmit: (title: string, color: GoalColorVar) => void;
  onSkip: () => void;
}> = ({ initialTitle, initialColor, onSubmit, onSkip }) => {
  const [title, setTitle] = React.useState(initialTitle);
  const [color, setColor] = React.useState<GoalColorVar>(initialColor);
  const [showExamples, setShowExamples] = React.useState(false);

  const submit = () => { const t = title.trim(); if (t) onSubmit(t, color); };

  return (
    <>
      <Heading>Create your first goal</Heading>
      <Lede>
        A goal is a result you want to reach — months or years of work
        toward something concrete you'll know you've achieved.
      </Lede>
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <input
          autoFocus
          type="text"
          value={title}
          placeholder="e.g. Get my SaaS to $10k MRR"
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
          style={inputStyle}
          maxLength={120}
        />
        <div>
          <button
            type="button"
            onClick={() => setShowExamples((v) => !v)}
            style={{
              background: "transparent", border: "none", padding: 0,
              color: "hsl(var(--text-tertiary))",
              fontFamily: "Inter", fontSize: 13, cursor: "pointer",
              display: "inline-flex", alignItems: "center", gap: 4,
            }}
          >
            <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}>
              {showExamples ? "−" : "+"}
            </span>
            Examples
          </button>
          {showExamples && (
            <div style={{
              marginTop: 8,
              display: "flex", flexDirection: "column", gap: 4,
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: 13,
            }}>
              {GOAL_EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => setTitle(ex)}
                  style={{
                    background: "transparent", border: "none",
                    color: "hsl(var(--text-secondary))",
                    textAlign: "left", padding: "2px 0", cursor: "pointer",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "hsl(var(--text-primary))")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "hsl(var(--text-secondary))")}
                >
                  {ex}
                </button>
              ))}
            </div>
          )}
        </div>
        <div>
          <div style={{
            fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase",
            color: "hsl(var(--text-tertiary))", marginBottom: 8,
            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
          }}>Color</div>
          <div style={{ display: "flex", gap: 10 }}>
            {COLORS.map((c) => {
              const sel = color === c.value;
              return (
                <button
                  key={c.value}
                  type="button"
                  aria-label={c.label}
                  onClick={() => setColor(c.value)}
                  style={{
                    width: 36, height: 36, borderRadius: 8,
                    background: `hsl(var(--${c.value}))`,
                    border: sel ? "2px solid hsl(var(--text-primary))" : "2px solid transparent",
                    cursor: "pointer", padding: 0,
                  }}
                />
              );
            })}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 16 }}>
          <PrimaryBtn onClick={submit} disabled={!title.trim()}>Create goal</PrimaryBtn>
        </div>
      </div>
    </>
  );
};

/* ───────── Step 2: Success Criteria ───────── */
const CriteriaStep: React.FC<{
  goalTitle: string;
  initial: string[];
  onContinue: (criteria: string[]) => void;
  onBack: () => void;
}> = ({ goalTitle, initial, onContinue, onBack }) => {
  const [items, setItems] = React.useState<string[]>(initial.length ? initial : []);
  const max = 5;

  const addRow = () => { if (items.length < max) setItems([...items, ""]); };
  const update = (i: number, v: string) =>
    setItems(items.map((x, idx) => (idx === i ? v : x)));
  const remove = (i: number) => setItems(items.filter((_, idx) => idx !== i));

  const submit = () => onContinue(items.map((s) => s.trim()).filter(Boolean));
  const skip = () => onContinue([]);

  return (
    <>
      <Heading>What does "done" look like?</Heading>
      <Lede>
        Add up to 5 concrete signs you've reached "{goalTitle}". You'll
        check these off as you make progress. You can add or change these
        anytime on the goal page.
      </Lede>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {items.map((val, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              autoFocus={i === items.length - 1 && val === ""}
              type="text"
              value={val}
              placeholder="e.g. Reached MRR threshold for 3 consecutive months"
              onChange={(e) => update(i, e.target.value)}
              style={inputStyle}
              maxLength={120}
            />
            <button
              type="button"
              aria-label="Remove criterion"
              onClick={() => remove(i)}
              style={{
                background: "transparent", border: "none", cursor: "pointer",
                color: "hsl(var(--text-tertiary))", padding: 6, borderRadius: 6,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "hsl(var(--text-secondary))")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "hsl(var(--text-tertiary))")}
            >
              <X size={14} />
            </button>
          </div>
        ))}
        {items.length < max && (
          <button
            type="button"
            onClick={addRow}
            style={{
              alignSelf: "flex-start",
              background: "transparent", border: "none",
              color: "hsl(var(--accent))",
              cursor: "pointer",
              fontSize: 14, fontFamily: "Inter",
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "6px 0",
            }}
          >
            <Plus size={14} /> Add criterion
          </button>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 16 }}>
          <PrimaryBtn onClick={submit}>Continue</PrimaryBtn>
          <GhostLink onClick={skip}>Skip — add later</GhostLink>
        </div>
      </div>
      {/* back affordance */}
      <button
        type="button"
        onClick={onBack}
        style={{
          marginTop: 32,
          background: "transparent", border: "none",
          color: "hsl(var(--text-tertiary))",
          fontSize: 13, fontFamily: "Inter", cursor: "pointer",
          padding: 0,
        }}
      >← Back to goal</button>
    </>
  );
};

/* ───────── Step 3: Project ───────── */
const ProjectStep: React.FC<{
  goalTitle: string;
  initialTitle: string;
  initialDesc: string;
  onSubmit: (title: string, desc: string) => void;
  onSkip: () => void;
}> = ({ goalTitle, initialTitle, initialDesc, onSubmit, onSkip }) => {
  const [title, setTitle] = React.useState(initialTitle);
  const [desc, setDesc] = React.useState(initialDesc);
  const submit = () => { const t = title.trim(); if (t) onSubmit(t, desc.trim()); };
  return (
    <>
      <Heading>Add a project to "{goalTitle}"</Heading>
      <Lede>
        A project is a chunk of work that finishes — usually in days or weeks.
        Break a goal into projects, projects into actions.
      </Lede>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <input
          autoFocus
          type="text"
          value={title}
          placeholder="e.g. Set up landing page"
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
          style={inputStyle}
          maxLength={140}
        />
        <textarea
          value={desc}
          placeholder="What's this project about? Optional."
          onChange={(e) => setDesc(e.target.value)}
          rows={3}
          style={{ ...inputStyle, resize: "vertical", minHeight: 72 }}
          maxLength={400}
        />
        <p style={{
          margin: 0,
          fontFamily: "Inter, ui-sans-serif, system-ui",
          fontSize: 13,
          color: "hsl(var(--text-tertiary))",
        }}>
          Detailed editor with images, links, and references is available on the project page.
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12 }}>
          <PrimaryBtn onClick={submit} disabled={!title.trim()}>Create project</PrimaryBtn>
          <GhostLink onClick={onSkip}>Skip</GhostLink>
        </div>
      </div>
    </>
  );
};

/* ───────── Step 4: Actions ───────── */
type Draft = { id: string; title: string; impact: number; time: string };
const newDraft = (): Draft => ({
  id: Math.random().toString(36).slice(2, 9),
  title: "", impact: 5, time: "",
});

const ActionsStep: React.FC<{
  goalTitle: string;
  onSubmit: (drafts: Draft[]) => void;
  onSkip: () => void;
}> = ({ goalTitle, onSubmit, onSkip }) => {
  const [drafts, setDrafts] = React.useState<Draft[]>([newDraft(), newDraft()]);
  const update = (id: string, p: Partial<Draft>) =>
    setDrafts((d) => d.map((x) => (x.id === id ? { ...x, ...p } : x)));
  const remove = (id: string) =>
    setDrafts((d) => (d.length > 1 ? d.filter((x) => x.id !== id) : d));
  const add = () => setDrafts((d) => (d.length < 3 ? [...d, newDraft()] : d));

  const valid = drafts.filter((d) => d.title.trim());
  const canSubmit = valid.length >= 1;

  return (
    <>
      <Heading>Add actions to "{goalTitle}"</Heading>
      <Lede>
        Actions are the small, concrete next steps. Add 2–3 you could do
        this week. You'll see them on Today.
      </Lede>
      <div
        style={{
          fontSize: 13,
          lineHeight: 1.6,
          color: "hsl(var(--text-secondary))",
          fontFamily: "Inter",
          marginBottom: 20,
        }}
      >
        <div style={{ marginBottom: 6, color: "hsl(var(--text-primary))" }}>
          About these fields:
        </div>
        <ul style={{ paddingLeft: 18, margin: 0, display: "flex", flexDirection: "column", gap: 4 }}>
          <li>
            <strong style={{ color: "hsl(var(--text-primary))", fontWeight: 600 }}>IMPACT</strong> (1–10) —
            how much this task moves your goal. Critical ones are 8–10, supporting ones are 3–5. You decide.
          </li>
          <li>
            <strong style={{ color: "hsl(var(--text-primary))", fontWeight: 600 }}>TIME</strong> —
            your estimate in minutes. Powers progress tracking ("how much time invested" in Reviews).
          </li>
        </ul>
        <div style={{ marginTop: 8, color: "hsl(var(--text-tertiary))" }}>
          Both are required so we can calculate Value, Effort, and time investment automatically — you focus on doing the work.
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 90px 110px 32px",
          gap: 8,
          fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase",
          color: "hsl(var(--text-tertiary))",
          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
        }}>
          <span>Title</span><span>Impact</span><span>Time (min)</span><span />
        </div>
        {drafts.map((d, idx) => (
          <div key={d.id} style={{
            display: "grid",
            gridTemplateColumns: "1fr 90px 110px 32px",
            gap: 8, alignItems: "center",
          }}>
            <input
              type="text"
              value={d.title}
              placeholder={`e.g. ${["Read Stripe API docs", "Implement webhook handler", "Set up test environment"][idx % 3]}`}
              onChange={(e) => update(d.id, { title: e.target.value })}
              style={inputStyle}
              maxLength={140}
            />
            <input
              type="number" min={0} max={10}
              value={d.impact}
              onChange={(e) => update(d.id, { impact: parseInt(e.target.value, 10) || 0 })}
              aria-label="Impact 0–10"
              style={inputStyle}
            />
            <input
              type="number" min={0}
              value={d.time}
              placeholder="e.g. 30"
              onChange={(e) => update(d.id, { time: e.target.value })}
              aria-label="Time estimate (minutes)"
              style={inputStyle}
            />
            <button
              type="button"
              aria-label="Remove row"
              onClick={() => remove(d.id)}
              disabled={drafts.length <= 1}
              style={{
                background: "transparent", border: "none",
                color: "hsl(var(--text-tertiary))",
                cursor: drafts.length <= 1 ? "not-allowed" : "pointer",
                opacity: drafts.length <= 1 ? 0.3 : 1,
                padding: 6,
              }}
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        {drafts.length < 3 && (
          <button
            type="button"
            onClick={add}
            style={{
              alignSelf: "flex-start",
              background: "transparent", border: "none",
              color: "hsl(var(--accent))",
              cursor: "pointer",
              fontSize: 14, fontFamily: "Inter",
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "6px 0",
            }}
          >
            <Plus size={14} /> Add another
          </button>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 16 }}>
          <PrimaryBtn onClick={() => canSubmit && onSubmit(valid)} disabled={!canSubmit}>
            Add {valid.length || ""} action{valid.length === 1 ? "" : "s"}
          </PrimaryBtn>
          <GhostLink onClick={onSkip}>Skip</GhostLink>
        </div>
      </div>
    </>
  );
};

/* ───────── Root ───────── */
const GoalBuilder: React.FC = () => {
  const navigate = useNavigate();
  const [persisted, setPersisted] = React.useState<Persisted>(() => read());

  // Goal step buffer (we don't create the goal until criteria step submits, so
  // the user can go Back from Criteria and edit title/color without orphans).
  const [goalDraft, setGoalDraft] = React.useState<{ title: string; color: GoalColorVar }>({
    title: "", color: "goal-1",
  });
  const [criteriaDraft, setCriteriaDraft] = React.useState<string[]>([]);

  const createGoal = useStore((s) => s.createGoal);
  const updateGoal = useStore((s) => s.updateGoal);
  const createProject = useStore((s) => s.createProject);
  const createAction = useStore((s) => s.createAction);

  const goal = useStore((s) => persisted.goalId ? s.goals.find((g) => g.id === persisted.goalId) : undefined);
  const project = useStore((s) => persisted.projectId ? s.projects.find((p) => p.id === persisted.projectId) : undefined);

  React.useEffect(() => { write(persisted); }, [persisted]);

  // If a previously created goal still exists, let the user pick up.
  React.useEffect(() => {
    if (persisted.step >= 2 && persisted.goalId && goal) {
      setGoalDraft({ title: goal.title, color: goal.color });
      setCriteriaDraft(goal.successCriteria.map((c) => c.text));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const finish = () => {
    write(null);
    navigate("/today", { replace: true });
  };

  /* ── Step 1: Goal ── */
  if (persisted.step === 1) {
    const onSubmit = (title: string, color: GoalColorVar) => {
      setGoalDraft({ title, color });
      setPersisted({ step: 2 });
    };
    return (
      <ScreenWrap step={1}>
        <GoalStep
          initialTitle={goalDraft.title}
          initialColor={goalDraft.color}
          onSubmit={onSubmit}
          onSkip={finish}
        />
      </ScreenWrap>
    );
  }

  /* ── Step 2: Criteria ── */
  if (persisted.step === 2) {
    const onContinue = (criteria: string[]) => {
      // Create (or update) the goal now.
      let goalId = persisted.goalId;
      if (!goalId || !goal) {
        const res = createGoal({
          title: goalDraft.title,
          type: "mid-term",
          successCriteria: criteria.map((text) => ({
            id: Math.random().toString(36).slice(2, 9), text, done: false,
          })),
        });
        if (!res.ok) {
          toast.error("Goal limit reached");
          return;
        }
        goalId = res.id;
        updateGoal(goalId, { color: goalDraft.color });
      } else {
        updateGoal(goalId, {
          title: goalDraft.title,
          color: goalDraft.color,
          successCriteria: criteria.map((text) => ({
            id: Math.random().toString(36).slice(2, 9), text, done: false,
          })),
        });
      }
      setCriteriaDraft(criteria);
      setPersisted({ step: 3, goalId });
    };
    return (
      <ScreenWrap step={2} onBack={() => setPersisted({ step: 1 })}>
        <CriteriaStep
          goalTitle={goalDraft.title || "your goal"}
          initial={criteriaDraft}
          onContinue={onContinue}
          onBack={() => setPersisted({ step: 1 })}
        />
      </ScreenWrap>
    );
  }

  /* ── Step 3: Project ── */
  if (persisted.step === 3) {
    if (!persisted.goalId) { setPersisted({ step: 1 }); return null; }
    const onSubmit = (title: string, desc: string) => {
      const id = createProject({
        goalId: persisted.goalId!,
        title,
        description: desc || undefined,
      });
      setPersisted({ step: 4, goalId: persisted.goalId, projectId: id });
    };
    return (
      <ScreenWrap step={3} onBack={() => setPersisted({ step: 2, goalId: persisted.goalId })}>
        <ProjectStep
          goalTitle={goal?.title ?? goalDraft.title ?? "your goal"}
          initialTitle=""
          initialDesc=""
          onSubmit={onSubmit}
          onSkip={finish}
        />
      </ScreenWrap>
    );
  }

  /* ── Step 4: Actions ── */
  if (persisted.step === 4) {
    if (!persisted.goalId || !persisted.projectId) { setPersisted({ step: 1 }); return null; }
    const onSubmit = (drafts: Draft[]) => {
      drafts.forEach((d) => {
        const time = parseInt(d.time, 10);
        createAction({
          title: d.title.trim(),
          goalId: persisted.goalId,
          projectId: persisted.projectId,
          impact: Math.max(0, Math.min(10, d.impact)),
          timeEstimateMinutes: Number.isFinite(time) && time > 0 ? time : undefined,
        });
      });
      toast.success(`Added ${drafts.length} action${drafts.length === 1 ? "" : "s"}`);
      finish();
    };
    return (
      <ScreenWrap step={4} onBack={() => setPersisted({ step: 3, goalId: persisted.goalId, projectId: persisted.projectId })}>
        <ActionsStep
          goalTitle={goal?.title ?? goalDraft.title ?? "your goal"}
          onSubmit={onSubmit}
          onSkip={finish}
        />
      </ScreenWrap>
    );
  }

  return null;
};

export default GoalBuilder;
