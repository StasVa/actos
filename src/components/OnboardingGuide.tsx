// Inline onboarding guide rendered on /today after the Setup Wizard's
// "Set up my own goal" path. Walks the user through:
//   1. Create 1 goal
//   2. Create 1 project under that goal
//   3. Add 2–3 actions to that project
// Skip is available on every step. State persists in localStorage so a refresh
// resumes the user where they left off.

import React from "react";
import { Target, Folder, ListChecks, X, Sparkles, Plus, Trash2 } from "lucide-react";
import { useStore } from "@/store/useStore";
import type { GoalColorVar } from "@/types";
import { toast } from "sonner";

const KEY = "actos.onboarding.guide";

type Step = "goal" | "project" | "actions" | "done";

function read(): { step: Step; goalId?: string; projectId?: string } {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { step: "done" };
    if (raw === "step:goal") return { step: "goal" };
    if (raw.startsWith("{")) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.step === "string") return parsed;
    }
  } catch {}
  return { step: "done" };
}
function write(state: { step: Step; goalId?: string; projectId?: string }) {
  try {
    if (state.step === "done") localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, JSON.stringify(state));
  } catch {}
}

const COLORS: { value: GoalColorVar; label: string }[] = [
  { value: "goal-1", label: "Teal" },
  { value: "goal-2", label: "Orange" },
  { value: "goal-3", label: "Purple" },
];

/* ───────── Shared shell ───────── */
const Shell: React.FC<{
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  description: string;
  onSkip: () => void;
  children: React.ReactNode;
}> = ({ icon, eyebrow, title, description, onSkip, children }) => (
  <div
    role="region"
    aria-label="Setup guide"
    style={{
      position: "relative",
      background: "hsl(var(--surface-raised))",
      border: "1px solid hsl(var(--border-subtle))",
      borderRadius: 12,
      padding: 24,
      margin: "16px 0 24px",
      fontFamily: "Inter",
    }}
  >
    <button
      type="button"
      aria-label="Skip guide"
      onClick={onSkip}
      style={{
        position: "absolute", top: 12, right: 12,
        background: "transparent", border: "none", cursor: "pointer",
        color: "hsl(var(--text-tertiary))", padding: 6, borderRadius: 6,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.color = "hsl(var(--text-secondary))")}
      onMouseLeave={(e) => (e.currentTarget.style.color = "hsl(var(--text-tertiary))")}
    >
      <X size={14} />
    </button>
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
      <span
        style={{
          width: 28, height: 28, borderRadius: 6,
          background: "hsl(var(--surface-hover))",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "hsl(var(--accent))",
        }}
      >
        {icon}
      </span>
      <span style={{
        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
        fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase",
        color: "hsl(var(--text-tertiary))",
      }}>{eyebrow}</span>
    </div>
    <h2 style={{
      margin: "8px 0 4px", fontSize: 22, fontWeight: 500,
      color: "hsl(var(--text-primary))",
    }}>{title}</h2>
    <p style={{
      margin: 0, fontSize: 14, color: "hsl(var(--text-secondary))",
      maxWidth: 560,
    }}>{description}</p>
    <div style={{ marginTop: 20 }}>{children}</div>
  </div>
);

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "hsl(var(--surface-base))",
  border: "1px solid hsl(var(--border-subtle))",
  borderRadius: 8,
  padding: "10px 12px",
  color: "hsl(var(--text-primary))",
  fontFamily: "Inter", fontSize: 14, outline: "none",
};

const PrimaryBtn: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ children, style, ...rest }) => (
  <button
    type="button"
    {...rest}
    style={{
      background: "hsl(var(--accent))",
      color: "hsl(var(--accent-foreground))",
      border: "none", borderRadius: 8,
      padding: "10px 18px",
      fontFamily: "Inter", fontSize: 14, fontWeight: 500,
      cursor: rest.disabled ? "not-allowed" : "pointer",
      opacity: rest.disabled ? 0.4 : 1,
      ...style,
    }}
  >{children}</button>
);

const GhostBtn: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ children, style, ...rest }) => (
  <button
    type="button"
    {...rest}
    style={{
      background: "transparent",
      color: "hsl(var(--text-tertiary))",
      border: "none",
      padding: "10px 4px",
      fontFamily: "Inter", fontSize: 14,
      cursor: "pointer",
      ...style,
    }}
  >{children}</button>
);

/* ───────── Step 1: Goal ───────── */
const GoalStep: React.FC<{
  onCreated: (goalId: string) => void;
  onSkip: () => void;
}> = ({ onCreated, onSkip }) => {
  const createGoal = useStore((s) => s.createGoal);
  const updateGoal = useStore((s) => s.updateGoal);
  const [title, setTitle] = React.useState("");
  const [color, setColor] = React.useState<GoalColorVar>("goal-1");

  const submit = () => {
    const t = title.trim();
    if (!t) return;
    const res = createGoal({ title: t, type: "mid-term" });
    if (!res.ok) {
      toast.error("Goal limit reached");
      return;
    }
    // Force the user-picked color (createGoal auto-picks next available).
    updateGoal(res.id, { color });
    onCreated(res.id);
  };

  return (
    <Shell
      icon={<Target size={16} />}
      eyebrow="Step 1 of 3"
      title="Create your first goal"
      description="A goal is a meaningful outcome you want to move toward — something you'd be proud to finish in a few weeks or months."
      onSkip={onSkip}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <input
          autoFocus
          type="text"
          value={title}
          placeholder="e.g. Launch personal portfolio site"
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
          style={inputStyle}
          maxLength={120}
        />
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
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
          <PrimaryBtn onClick={submit} disabled={!title.trim()}>Create goal</PrimaryBtn>
          <GhostBtn onClick={onSkip}>Skip</GhostBtn>
        </div>
      </div>
    </Shell>
  );
};

/* ───────── Step 2: Project ───────── */
const ProjectStep: React.FC<{
  goalId: string;
  onCreated: (projectId: string) => void;
  onSkip: () => void;
}> = ({ goalId, onCreated, onSkip }) => {
  const goalTitle = useStore((s) => s.goals.find((g) => g.id === goalId)?.title ?? "your goal");
  const createProject = useStore((s) => s.createProject);
  const [title, setTitle] = React.useState("");
  const [desc, setDesc] = React.useState("");

  const submit = () => {
    const t = title.trim();
    if (!t) return;
    const id = createProject({
      goalId,
      title: t,
      description: desc.trim() || undefined,
    });
    onCreated(id);
  };

  return (
    <Shell
      icon={<Folder size={16} />}
      eyebrow="Step 2 of 3"
      title={`Add a project to "${goalTitle}"`}
      description="A project is a concrete piece of work that moves the goal forward — usually 1–4 weeks of effort."
      onSkip={onSkip}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <input
          autoFocus
          type="text"
          value={title}
          placeholder="e.g. Design the landing page"
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
          style={inputStyle}
          maxLength={140}
        />
        <textarea
          value={desc}
          placeholder="Short description (optional)"
          onChange={(e) => setDesc(e.target.value)}
          rows={2}
          style={{ ...inputStyle, resize: "vertical", minHeight: 56 }}
          maxLength={400}
        />
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
          <PrimaryBtn onClick={submit} disabled={!title.trim()}>Create project</PrimaryBtn>
          <GhostBtn onClick={onSkip}>Skip</GhostBtn>
        </div>
      </div>
    </Shell>
  );
};

/* ───────── Step 3: Actions ───────── */
type ActionDraft = { id: string; title: string; impact: number; time: string };
const newDraft = (): ActionDraft => ({
  id: Math.random().toString(36).slice(2, 9),
  title: "", impact: 5, time: "",
});

const ActionsStep: React.FC<{
  goalId: string;
  projectId: string;
  onDone: () => void;
  onSkip: () => void;
}> = ({ goalId, projectId, onDone, onSkip }) => {
  const projectTitle = useStore((s) => s.projects.find((p) => p.id === projectId)?.title ?? "your project");
  const createAction = useStore((s) => s.createAction);
  const [drafts, setDrafts] = React.useState<ActionDraft[]>([newDraft(), newDraft()]);

  const update = (id: string, patch: Partial<ActionDraft>) =>
    setDrafts((d) => d.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  const remove = (id: string) =>
    setDrafts((d) => (d.length > 1 ? d.filter((x) => x.id !== id) : d));
  const add = () => setDrafts((d) => (d.length < 3 ? [...d, newDraft()] : d));

  const valid = drafts.filter((d) => d.title.trim().length > 0);
  const canSubmit = valid.length >= 1;

  const submit = () => {
    if (!canSubmit) return;
    valid.forEach((d) => {
      const time = parseInt(d.time, 10);
      createAction({
        title: d.title.trim(),
        goalId,
        projectId,
        impact: Math.max(0, Math.min(10, d.impact)),
        timeEstimateMinutes: Number.isFinite(time) && time > 0 ? time : undefined,
      });
    });
    toast.success(`Added ${valid.length} action${valid.length === 1 ? "" : "s"}`);
    onDone();
  };

  return (
    <Shell
      icon={<ListChecks size={16} />}
      eyebrow="Step 3 of 3"
      title={`Add actions to "${projectTitle}"`}
      description="Actions are the small, concrete next steps. Add 2–3 you could do this week. You'll see them on Today."
      onSkip={onSkip}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {drafts.map((d, idx) => (
          <div
            key={d.id}
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 110px 110px 32px",
              gap: 8, alignItems: "center",
            }}
          >
            <input
              type="text"
              value={d.title}
              placeholder={idx === 0 ? "First action…" : "Another action…"}
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
              placeholder="Time min"
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
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 110px 110px 32px",
          gap: 8, marginTop: -4,
          fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase",
          color: "hsl(var(--text-tertiary))",
          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
        }}>
          <span>Title</span><span>Impact</span><span>Time (min)</span><span />
        </div>
        {drafts.length < 3 && (
          <button
            type="button"
            onClick={add}
            style={{
              alignSelf: "flex-start",
              background: "transparent", border: "none",
              color: "hsl(var(--text-secondary))",
              cursor: "pointer",
              fontSize: 13, fontFamily: "Inter",
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "6px 0",
            }}
          >
            <Plus size={14} /> Add another
          </button>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
          <PrimaryBtn onClick={submit} disabled={!canSubmit}>
            Add {valid.length || ""} action{valid.length === 1 ? "" : "s"}
          </PrimaryBtn>
          <GhostBtn onClick={onSkip}>Skip</GhostBtn>
        </div>
      </div>
    </Shell>
  );
};

/* ───────── Done flash ───────── */
const DoneFlash: React.FC<{ onDismiss: () => void }> = ({ onDismiss }) => (
  <Shell
    icon={<Sparkles size={16} />}
    eyebrow="All set"
    title="You're ready to go."
    description="Your goal, project, and actions are live. Open the action you want to start with — or hit ⌘K anytime to add more."
    onSkip={onDismiss}
  >
    <PrimaryBtn onClick={onDismiss}>Got it</PrimaryBtn>
  </Shell>
);

/* ───────── Root ───────── */
export const OnboardingGuide: React.FC = () => {
  const [state, setState] = React.useState(() => read());
  const [showDone, setShowDone] = React.useState(false);
  const goalsCount = useStore((s) => s.goals.length);

  // Sync to storage on every state change.
  React.useEffect(() => { write(state); }, [state]);

  // Safety: if the user has no goals but somehow state is mid-flow, reset to step 1.
  React.useEffect(() => {
    if (goalsCount === 0 && (state.step === "project" || state.step === "actions")) {
      setState({ step: "goal" });
    }
  }, [goalsCount, state.step]);

  const skip = () => {
    setState({ step: "done" });
    setShowDone(false);
  };

  if (state.step === "done" && !showDone) return null;

  if (showDone) return <DoneFlash onDismiss={skip} />;

  switch (state.step) {
    case "goal":
      return (
        <GoalStep
          onCreated={(goalId) => setState({ step: "project", goalId })}
          onSkip={skip}
        />
      );
    case "project":
      if (!state.goalId) { setState({ step: "goal" }); return null; }
      return (
        <ProjectStep
          goalId={state.goalId}
          onCreated={(projectId) => setState({ step: "actions", goalId: state.goalId, projectId })}
          onSkip={skip}
        />
      );
    case "actions":
      if (!state.goalId || !state.projectId) { setState({ step: "goal" }); return null; }
      return (
        <ActionsStep
          goalId={state.goalId}
          projectId={state.projectId}
          onDone={() => { setState({ step: "done" }); setShowDone(true); }}
          onSkip={skip}
        />
      );
    default:
      return null;
  }
};

export default OnboardingGuide;
