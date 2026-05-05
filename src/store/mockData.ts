// Seed mock data for first-time load.
// After first interaction, the persisted Zustand store takes over.
//
// Today is May 5, 2026 in this prototype.

import type {
  Action,
  DayEntry,
  Goal,
  Idea,
  Project,
  Ritual,
  UserSettings,
} from "@/types";
import {
  ACTIONS as LEGACY_ACTIONS,
  GOALS as LEGACY_GOALS,
  type Action as LegacyAction,
  type GoalKey,
} from "@/lib/actionsData";

const NOW = "2026-05-05T08:00:00.000Z";
const TODAY = "2026-05-05";

// Stable goal IDs (also used as the goal's URL slug down the line).
export const GOAL_IDS: Record<GoalKey, string> = {
  g1: "goal-launch-youtube-channel",
  g2: "goal-lose-5-kg",
  g3: "goal-read-24-books",
};

// Stable project IDs keyed by their human title (matches strings in legacy data).
export const PROJECT_IDS: Record<string, string> = {
  "Shoot video #1": "proj-shoot-video-1",
  "Set up workspace": "proj-set-up-workspace",
  "Channel launch plan": "proj-channel-launch-plan",
  "Nutrition plan": "proj-nutrition-plan",
  "Build cardio routine": "proj-build-cardio-routine",
  "Build daily reading habit": "proj-build-reading-habit",
  "Build a reading list": "proj-build-reading-list",
};

// ───────── Goals ─────────
export const SEED_GOALS: Goal[] = [
  {
    id: GOAL_IDS.g1,
    title: LEGACY_GOALS.g1.name,
    type: "mid-term",
    status: "active",
    description: "Launch a productivity-focused YouTube channel with consistent weekly uploads.",
    successCriteria: [
      { id: "c1", text: "Publish 10 videos", done: false },
      { id: "c2", text: "Reach 1000 subscribers", done: false },
      { id: "c3", text: "Establish weekly upload cadence", done: false },
    ],
    targetDate: "2026-12-31",
    color: "goal-1",
    createdAt: "2026-04-01T09:00:00.000Z",
  },
  {
    id: GOAL_IDS.g2,
    title: LEGACY_GOALS.g2.name,
    type: "short-term",
    status: "active",
    description: "Lose 5 kg through nutrition and cardio.",
    successCriteria: [
      { id: "c1", text: "Hit target weight", done: false },
      { id: "c2", text: "Sustain for 4 weeks", done: false },
    ],
    targetDate: "2026-08-01",
    color: "goal-2",
    createdAt: "2026-04-05T09:00:00.000Z",
  },
  {
    id: GOAL_IDS.g3,
    title: LEGACY_GOALS.g3.name,
    type: "mid-term",
    status: "active",
    description: "Build a daily reading habit and finish 24 books this year.",
    successCriteria: [
      { id: "c1", text: "Finish 24 books", done: false },
      { id: "c2", text: "Maintain daily 30-min habit", done: false },
    ],
    targetDate: "2026-12-31",
    color: "goal-3",
    createdAt: "2026-04-10T09:00:00.000Z",
  },
];

// ───────── Projects ─────────
const PROJECT_DEFS: { title: string; goalKey: GoalKey; status: Project["status"]; createdAt: string; completedAt?: string; droppedAt?: string; description?: string }[] = [
  { title: "Shoot video #1", goalKey: "g1", status: "active", createdAt: "2026-04-15T09:00:00.000Z", description: "Shoot, edit, and publish the first channel video." },
  { title: "Set up workspace", goalKey: "g1", status: "active", createdAt: "2026-04-08T09:00:00.000Z", description: "Get a recording-ready workspace." },
  { title: "Channel launch plan", goalKey: "g1", status: "completed", createdAt: "2026-04-01T09:00:00.000Z", completedAt: "2026-04-22T09:00:00.000Z" },
  { title: "Nutrition plan", goalKey: "g2", status: "active", createdAt: "2026-04-12T09:00:00.000Z" },
  { title: "Build cardio routine", goalKey: "g2", status: "active", createdAt: "2026-04-18T09:00:00.000Z" },
  { title: "Build daily reading habit", goalKey: "g3", status: "active", createdAt: "2026-04-10T09:00:00.000Z" },
  { title: "Build a reading list", goalKey: "g3", status: "active", createdAt: "2026-04-20T09:00:00.000Z" },
];

export const SEED_PROJECTS: Project[] = PROJECT_DEFS.map((p) => ({
  id: PROJECT_IDS[p.title],
  goalId: GOAL_IDS[p.goalKey],
  title: p.title,
  status: p.status,
  description: p.description,
  references: [],
  createdAt: p.createdAt,
  completedAt: p.completedAt,
  droppedAt: p.droppedAt,
}));

// ───────── Actions ─────────
// Convert legacy actions into the new schema. We map createdLabel ("Apr 28")
// into 2026 ISO dates with a quick parser; missing dates fall back to NOW.
function labelToISO(label?: string): string | undefined {
  if (!label) return undefined;
  const m = label.match(/^([A-Za-z]+)\s+(\d{1,2})$/);
  if (!m) return undefined;
  const months: Record<string, string> = {
    jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06",
    jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12",
  };
  const mo = months[m[1].slice(0, 3).toLowerCase()];
  if (!mo) return undefined;
  return `2026-${mo}-${m[2].padStart(2, "0")}`;
}

function scheduledLabelToISO(label?: string): string | undefined {
  if (!label) return undefined;
  if (label === "TODAY") return TODAY;
  if (label === "TOMORROW") return "2026-05-06";
  // "MAY 8" style
  const m = label.match(/^([A-Z]+)\s+(\d{1,2})$/);
  if (!m) return undefined;
  return labelToISO(`${m[1].slice(0, 1) + m[1].slice(1).toLowerCase()} ${m[2]}`);
}

function legacyToAction(a: LegacyAction): Action {
  const createdISO = labelToISO(a.createdLabel) ?? TODAY;
  const projTitle = a.project;
  const projectId = PROJECT_IDS[projTitle] ?? null;
  return {
    id: a.id,
    title: a.title,
    goalId: GOAL_IDS[a.goal],
    projectId,
    status: a.status,
    scheduledDate: scheduledLabelToISO(a.scheduledLabel),
    notes: a.notes,
    impact: a.impact,
    timeEstimateMinutes: a.timeMinutes || undefined,
    delegateName: a.delegate,
    delegateNote: a.delegationNote,
    expectedReturnDate: scheduledLabelToISO(a.expectedReturnLabel),
    timeline: a.timeline.map((t) => ({
      at: (labelToISO(t.date) ?? TODAY) + "T09:00:00.000Z",
      text: t.text,
    })),
    createdAt: createdISO + "T09:00:00.000Z",
    completedAt: a.status === "done" ? createdISO + "T17:00:00.000Z" : undefined,
    delegatedAt:
      a.status === "delegated" && a.delegatedLabel
        ? (labelToISO(a.delegatedLabel) ?? TODAY) + "T09:00:00.000Z"
        : undefined,
    droppedAt: a.status === "dropped" ? createdISO + "T17:00:00.000Z" : undefined,
    cancelledAt: a.status === "cancelled" ? createdISO + "T17:00:00.000Z" : undefined,
  };
}

export const SEED_ACTIONS: Action[] = LEGACY_ACTIONS.map(legacyToAction);

// ───────── Rituals (5 active + 1 archived) ─────────
export const SEED_RITUALS: Ritual[] = [
  {
    id: "ritual-weekly-project-audit",
    goalId: GOAL_IDS.g1,
    projectId: null,
    title: "Weekly project audit",
    schedule: "weekly",
    scheduleConfig: { weekday: 0 },
    baseImpact: 6,
    notes: "Review every active project. Prune stale work, decide next moves.",
    timeEstimateMinutes: 30,
    totalCompletions: 7,
    completionHistory: [],
    status: "active",
    createdAt: "2026-03-15T09:00:00.000Z",
  },
  {
    id: "ritual-morning-pages",
    goalId: GOAL_IDS.g1,
    projectId: null,
    title: "Morning pages",
    schedule: "daily",
    baseImpact: 4,
    timeEstimateMinutes: 15,
    totalCompletions: 21,
    completionHistory: [],
    status: "active",
    createdAt: "2026-03-01T09:00:00.000Z",
  },
  {
    id: "ritual-daily-reading",
    goalId: GOAL_IDS.g3,
    projectId: PROJECT_IDS["Build daily reading habit"],
    title: "Read 30 minutes",
    schedule: "daily",
    baseImpact: 5,
    timeEstimateMinutes: 30,
    totalCompletions: 32,
    completionHistory: [],
    status: "active",
    createdAt: "2026-03-15T09:00:00.000Z",
  },
  {
    id: "ritual-cardio",
    goalId: GOAL_IDS.g2,
    projectId: PROJECT_IDS["Build cardio routine"],
    title: "Cardio session",
    schedule: "custom",
    scheduleConfig: { customDays: [1, 3, 5] },
    baseImpact: 6,
    timeEstimateMinutes: 45,
    totalCompletions: 9,
    completionHistory: [],
    status: "active",
    createdAt: "2026-04-01T09:00:00.000Z",
  },
  {
    id: "ritual-weigh-in",
    goalId: GOAL_IDS.g2,
    projectId: null,
    title: "Weekly weigh-in",
    schedule: "weekly",
    scheduleConfig: { weekday: 1 },
    baseImpact: 3,
    timeEstimateMinutes: 5,
    totalCompletions: 4,
    completionHistory: [],
    status: "active",
    createdAt: "2026-04-05T09:00:00.000Z",
  },
  {
    id: "ritual-evening-walk",
    goalId: GOAL_IDS.g2,
    projectId: null,
    title: "Evening walk",
    schedule: "daily",
    baseImpact: 3,
    timeEstimateMinutes: 25,
    totalCompletions: 12,
    completionHistory: [],
    status: "archived",
    createdAt: "2026-02-15T09:00:00.000Z",
    archivedAt: "2026-04-20T09:00:00.000Z",
  },
];

// ───────── Ideas (8) ─────────
export const SEED_IDEAS: Idea[] = [
  {
    id: "idea-1",
    goalId: GOAL_IDS.g1,
    title: "Series on focused work in noisy environments",
    note: "Could be a 4-part series. Lots of personal stories to draw from.",
    references: [],
    imageAttachments: [],
    status: "captured",
    capturedAt: "2026-05-04T18:00:00.000Z",
  },
  {
    id: "idea-2",
    goalId: GOAL_IDS.g1,
    title: "Interview format for guest experts",
    references: [],
    imageAttachments: [],
    status: "captured",
    capturedAt: "2026-05-03T11:00:00.000Z",
  },
  {
    id: "idea-3",
    goalId: GOAL_IDS.g3,
    title: "Re-read Deep Work and take fresh notes",
    note: "Compare to first reading 3 years ago.",
    references: [],
    imageAttachments: [],
    status: "captured",
    capturedAt: "2026-05-02T20:00:00.000Z",
  },
  {
    id: "idea-4",
    goalId: GOAL_IDS.g2,
    title: "Try intermittent fasting protocol",
    references: [],
    imageAttachments: [],
    status: "captured",
    capturedAt: "2026-05-01T08:30:00.000Z",
  },
  {
    id: "idea-5",
    goalId: GOAL_IDS.g1,
    title: "Behind-the-scenes vlog of channel setup",
    references: [],
    imageAttachments: [],
    status: "captured",
    capturedAt: "2026-04-29T14:00:00.000Z",
  },
  {
    id: "idea-6",
    goalId: GOAL_IDS.g3,
    title: "Book club with friends",
    note: "Monthly cadence, rotating picks.",
    references: [],
    imageAttachments: [],
    status: "captured",
    capturedAt: "2026-04-28T19:00:00.000Z",
  },
  {
    id: "idea-7",
    goalId: GOAL_IDS.g2,
    title: "Outdoor running route map",
    references: [],
    imageAttachments: [],
    status: "discarded",
    discardedAt: "2026-04-25T10:00:00.000Z",
    capturedAt: "2026-04-24T07:00:00.000Z",
  },
  {
    id: "idea-8",
    goalId: GOAL_IDS.g1,
    title: "Newsletter companion to channel",
    references: [],
    imageAttachments: [],
    status: "converted_to_project",
    convertedToId: PROJECT_IDS["Channel launch plan"],
    capturedAt: "2026-04-15T12:00:00.000Z",
  },
];

// ───────── Day entries ─────────
export const SEED_DAY_ENTRIES: DayEntry[] = [];

// ───────── Settings ─────────
export const SEED_SETTINGS: UserSettings = {
  layers: {
    planAndReview: true,
    logEnergy: true,
    logFocus: false,
    logTime: true,
  },
  defaultGoalId: GOAL_IDS.g1,
};

export const NOW_ISO = NOW;
export const TODAY_ISO = TODAY;
