// Builds the "Show me how it works" sample dataset from the canonical fixture.
//
// The fixture (src/data/sampleDataFixture.json) is anchored to 2026-05-09.
// At seed time, every ISO date / datetime is shifted by (today - anchor) days
// so the timeline always feels current relative to the user's local date.

import fixture from "@/data/sampleDataFixture.json";
import type {
  Action,
  DayEntry,
  Goal,
  Idea,
  Project,
  Ritual,
  Session,
} from "@/types";

const ANCHOR_DATE = "2026-05-09";

function offsetDays(): number {
  const now = new Date();
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const anchor = Date.UTC(2026, 4, 9); // 2026-05-09
  return Math.round((today - anchor) / 86400000);
}

const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/;
const DATE_TIME_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;

function shift(value: string, days: number): string {
  if (DATE_ONLY_RE.test(value)) {
    const d = new Date(value + "T00:00:00.000Z");
    d.setUTCDate(d.getUTCDate() + days);
    return d.toISOString().slice(0, 10);
  }
  if (DATE_TIME_RE.test(value)) {
    const iso = value.endsWith("Z") ? value : value + "Z";
    const d = new Date(iso);
    d.setUTCDate(d.getUTCDate() + days);
    return d.toISOString();
  }
  return value;
}

const sh = (v: string | undefined | null, days: number) =>
  v ? shift(v, days) : v ?? undefined;

// Minimal TipTap JSON → HTML converter for the subset used in the fixture.
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderMarks(text: string, marks: any[] | undefined): string {
  let html = escapeHtml(text);
  for (const m of marks ?? []) {
    if (m.type === "bold") html = `<strong>${html}</strong>`;
    else if (m.type === "italic") html = `<em>${html}</em>`;
    else if (m.type === "code") html = `<code>${html}</code>`;
    else if (m.type === "underline") html = `<u>${html}</u>`;
    else if (m.type === "strike") html = `<s>${html}</s>`;
    else if (m.type === "link") {
      const href = escapeHtml(m.attrs?.href ?? "#");
      html = `<a href="${href}" target="_blank" rel="noopener noreferrer">${html}</a>`;
    }
  }
  return html;
}

function renderNode(node: any): string {
  if (!node) return "";
  switch (node.type) {
    case "doc":
      return (node.content ?? []).map(renderNode).join("");
    case "paragraph":
      return `<p>${(node.content ?? []).map(renderNode).join("")}</p>`;
    case "heading": {
      const level = node.attrs?.level ?? 2;
      return `<h${level}>${(node.content ?? []).map(renderNode).join("")}</h${level}>`;
    }
    case "bulletList":
      return `<ul>${(node.content ?? []).map(renderNode).join("")}</ul>`;
    case "orderedList":
      return `<ol>${(node.content ?? []).map(renderNode).join("")}</ol>`;
    case "listItem":
      return `<li>${(node.content ?? []).map(renderNode).join("")}</li>`;
    case "blockquote":
      return `<blockquote>${(node.content ?? []).map(renderNode).join("")}</blockquote>`;
    case "codeBlock":
      return `<pre><code>${(node.content ?? []).map(renderNode).join("")}</code></pre>`;
    case "hardBreak":
      return "<br />";
    case "image": {
      const src = escapeHtml(node.attrs?.src ?? "");
      const alt = escapeHtml(node.attrs?.alt ?? "");
      const title = node.attrs?.title ? ` title="${escapeHtml(node.attrs.title)}"` : "";
      return `<img src="${src}" alt="${alt}"${title} />`;
    }
    case "text":
      return renderMarks(node.text ?? "", node.marks);
    default:
      return (node.content ?? []).map(renderNode).join("");
  }
}

function tiptapJsonToHtml(doc: any): string {
  if (!doc) return "";
  if (typeof doc === "string") return doc;
  return renderNode(doc);
}

const SAMPLE_COACHMARKS: Record<string, string> =
  (fixture as any).coachmarks ?? {};

export interface SampleSeed {
  goals: Goal[];
  projects: Project[];
  actions: Action[];
  rituals: Ritual[];
  ideas: Idea[];
  sessions: Session[];
  dayEntries: DayEntry[];
  coachmarks: Record<string, string>;
}

export function buildSampleSeed(): SampleSeed {
  const days = offsetDays();
  const f: any = fixture;
  const fallbackGoalId: string = f.goals[0]?.id ?? "g1";

  const goals: Goal[] = f.goals.map((g: any) => ({
    id: g.id,
    title: g.title,
    type: g.type,
    status: g.status,
    color: g.color,
    description: g.description,
    successCriteria: (g.successCriteria ?? []).map((c: any) => ({
      id: c.id,
      text: c.text,
      done: !!c.done,
    })),
    targetDate: g.targetDate ? shift(g.targetDate, days).slice(0, 10) : undefined,
    createdAt: shift(g.createdAt, days),
    isSample: true,
  }));

  const projects: Project[] = f.projects.map((p: any) => ({
    id: p.id,
    goalId: p.goalId,
    title: p.title,
    status: p.status,
    description: p.description ? tiptapJsonToHtml(p.description) : undefined,
    references: Array.isArray(p.references)
      ? p.references.map((r: any) => ({ id: r.id, url: r.url, title: r.title }))
      : [],
    createdAt: shift(p.createdAt, days),
    completedAt:
      p.closedAt && p.status === "completed" ? shift(p.closedAt, days) : undefined,
    droppedAt:
      p.closedAt && p.status === "dropped" ? shift(p.closedAt, days) : undefined,
    isSample: true,
  }));

  const actions: Action[] = f.actions.map((a: any) => ({
    id: a.id,
    title: a.title,
    goalId: a.goalId,
    projectId: a.projectId ?? null,
    status: a.status,
    impact: a.impact ?? 0,
    timeEstimateMinutes: a.timeEstimate,
    scheduledDate: a.scheduledDate ? shift(a.scheduledDate, days) : undefined,
    notes: a.notes,
    delegateName: a.delegateName,
    delegateNote: a.delegateNote,
    expectedReturnDate: a.returnDate ? shift(a.returnDate, days) : undefined,
    timeline: [],
    createdAt: shift(a.createdAt, days),
    completedAt: sh(a.completedAt, days),
    delegatedAt: sh(a.delegatedAt, days),
    droppedAt: sh(a.droppedAt, days),
    cancelledAt: sh(a.cancelledAt, days),
    isSample: true,
  }));

  const rituals: Ritual[] = f.rituals.map((r: any) => {
    const cfg = r.scheduleConfig ?? {};
    const scheduleConfig =
      cfg.dayOfWeek != null
        ? { weekday: cfg.dayOfWeek }
        : cfg.weekday != null
        ? { weekday: cfg.weekday }
        : cfg;
    return {
      id: r.id,
      goalId: r.goalId,
      projectId: r.projectId ?? null,
      title: r.title,
      schedule: r.schedule,
      scheduleConfig,
      baseImpact: r.baseImpact ?? 5,
      timeEstimateMinutes: r.timeEstimate,
      totalCompletions: r.totalCompletions ?? 0,
      status: r.status,
      createdAt: shift(r.createdAt, days),
      completionHistory: (r.completionHistory ?? []).map((c: any) => {
        const date = shift(c.date, days);
        return { date, at: date + "T09:00:00.000Z", status: c.status };
      }),
      isSample: true,
    };
  });

  const ideas: Idea[] = f.ideas.map((i: any) => ({
    id: i.id,
    goalId: i.goalId ?? fallbackGoalId,
    title: i.title,
    references: [],
    imageAttachments: [],
    status: "captured",
    capturedAt: shift(i.createdAt, days),
    isSample: true,
  }));

  const sessions: Session[] = f.sessions.map((s: any) => ({
    id: s.id,
    status: "completed",
    startedAt: shift(s.startedAt, days),
    endedAt: shift(s.endedAt, days),
    mode: "continuous",
    workDuration: s.durationMinutes ?? 0,
    breakDuration: 0,
    cyclesPlanned: 1,
    cyclesCompleted: 1,
    plannedActionIds: s.actionIds ?? [],
    completedActionIds: s.actionIds ?? [],
    droppedActionIds: [],
    isSample: true,
  }));

  const dayEntries: DayEntry[] = f.dayEntries.map((d: any) => ({
    date: shift(d.date, days),
    dayType: d.dayType === "dayoff" ? "day-off" : d.dayType,
    isPlanned: !!d.isPlanned,
    isClosed: !!d.isClosed,
    isSample: true,
  }));

  return { goals, projects, actions, rituals, ideas, sessions, dayEntries, coachmarks: SAMPLE_COACHMARKS };
}

export function applySampleCoachmarks(coachmarks: Record<string, string>) {
  try {
    Object.entries(coachmarks).forEach(([key, value]) => {
      localStorage.setItem(key, value);
    });
    localStorage.setItem("actos.setup.sampleDataSeeded", "true");
  } catch {}
}

export { ANCHOR_DATE };
