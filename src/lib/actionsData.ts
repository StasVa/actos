/* Shared mock data for All Actions / All Delegated pages.
 * Today is May 5, 2026 in the prototype.
 */

export type GoalKey = "g1" | "g2" | "g3";
export type Delegate = "Maria" | "AI";
export type ActionStatus =
  | "backlog"
  | "planned"
  | "done"
  | "delegated"
  | "dropped"
  | "cancelled";

export type Action = {
  id: string;
  title: string;
  goal: GoalKey;
  project: string;
  status: ActionStatus;
  impact: number; // 1-10
  timeMinutes: number;
  /** ISO-like "MAY 5" / "TOMORROW" friendly label for planned date pill */
  scheduledLabel?: string;
  /** Sort key for scheduled date ascending (lower = earlier; undated = Infinity) */
  scheduledSort?: number;
  /** Date the action was created, e.g. "Apr 28" */
  createdLabel: string;
  /** Sort key — most recently changed first (higher = more recent) */
  changedSort: number;
  notes?: string;
  /** Timeline events for detail panel */
  timeline: { date: string; text: string }[];
  /* Delegation fields */
  delegate?: Delegate;
  /** Friendly label, e.g. "MAY 6", "TODAY", "APR 30" */
  expectedReturnLabel?: string;
  /** Days until expected return: negative = overdue, 0 = today, positive = future, undefined = no date */
  expectedReturnDelta?: number;
  /** When delegated, e.g. "Apr 25" */
  delegatedLabel?: string;
  /** Days ago since delegated, for detail copy */
  delegatedAgoDays?: number;
  delegationNote?: string;
};

export const GOALS: Record<GoalKey, { name: string; short: string; color: string }> = {
  g1: { name: "Launch YouTube channel", short: "Launch YouTube", color: "hsl(var(--goal-1))" },
  g2: { name: "Lose 5 kg", short: "Lose 5 kg", color: "hsl(var(--goal-2))" },
  g3: { name: "Read 24 books this year", short: "Read 24 books", color: "hsl(var(--goal-3))" },
};

export const STATUS_LABEL: Record<ActionStatus, string> = {
  backlog: "BACKLOG",
  planned: "PLANNED",
  done: "DONE",
  delegated: "DELEGATED",
  dropped: "DROPPED",
  cancelled: "CANCELLED",
};

export function statusColorVar(status: ActionStatus): string {
  switch (status) {
    case "done":
      return "hsl(var(--status-done))";
    case "delegated":
      return "hsl(var(--status-delegated))";
    case "dropped":
      return "hsl(var(--status-dropped))";
    case "cancelled":
      return "hsl(var(--text-tertiary))";
    case "backlog":
      return "hsl(var(--text-secondary))";
    case "planned":
      return "hsl(var(--text-primary))";
  }
}

const make = (a: Action): Action => a;

/* ====== Active actions (backlog + planned) ====== */
const ACTIVE: Action[] = [
  make({
    id: "a-research-thumb",
    title: "Research thumbnail styles",
    goal: "g1",
    project: "Shoot video #1",
    status: "planned",
    impact: 5,
    timeMinutes: 30,
    scheduledLabel: "TODAY",
    scheduledSort: 0,
    createdLabel: "Apr 28",
    changedSort: 1000,
    notes:
      "Look at top 5 channels in productivity space. Note their style consistency, color palettes, font choices. Save 10 examples to reference doc.",
    timeline: [
      { date: "Apr 28", text: "Created in Backlog" },
      { date: "May 4", text: "Scheduled for May 5 (Planned)" },
    ],
  }),
  make({
    id: "a-write-script",
    title: "Write script for video #1",
    goal: "g1",
    project: "Shoot video #1",
    status: "planned",
    impact: 9,
    timeMinutes: 90,
    scheduledLabel: "TODAY",
    scheduledSort: 0,
    createdLabel: "Apr 26",
    changedSort: 999,
    notes: "Main heavy-lift today. Aim for full first draft in one sitting.",
    timeline: [
      { date: "Apr 26", text: "Created in Backlog" },
      { date: "May 3", text: "Scheduled for May 5 (Planned)" },
    ],
  }),
  make({
    id: "a-plan-meals",
    title: "Plan tomorrow's meals",
    goal: "g2",
    project: "Nutrition plan",
    status: "planned",
    impact: 4,
    timeMinutes: 20,
    scheduledLabel: "TODAY",
    scheduledSort: 0,
    createdLabel: "May 4",
    changedSort: 998,
    timeline: [
      { date: "May 4", text: "Created in Backlog" },
      { date: "May 4", text: "Scheduled for May 5 (Planned)" },
    ],
  }),
  make({
    id: "a-read-ch4",
    title: "Read chapter 4 of current book",
    goal: "g3",
    project: "Build daily reading habit",
    status: "planned",
    impact: 5,
    timeMinutes: 30,
    scheduledLabel: "TODAY",
    scheduledSort: 0,
    createdLabel: "May 5",
    changedSort: 997,
    timeline: [
      { date: "May 5", text: "Created in Backlog" },
      { date: "May 5", text: "Scheduled for today (Planned)" },
    ],
  }),
  make({
    id: "a-edit-draft",
    title: "Edit first video draft",
    goal: "g1",
    project: "Shoot video #1",
    status: "planned",
    impact: 8,
    timeMinutes: 150,
    scheduledLabel: "TOMORROW",
    scheduledSort: 1,
    createdLabel: "Apr 30",
    changedSort: 990,
    timeline: [
      { date: "Apr 30", text: "Created in Backlog" },
      { date: "May 4", text: "Scheduled for May 6 (Planned)" },
    ],
  }),
  make({
    id: "a-outline-v2",
    title: "Outline video #2 series structure",
    goal: "g1",
    project: "Shoot video #1",
    status: "planned",
    impact: 7,
    timeMinutes: 120,
    scheduledLabel: "MAY 8",
    scheduledSort: 3,
    createdLabel: "Apr 29",
    changedSort: 985,
    timeline: [
      { date: "Apr 29", text: "Created in Backlog" },
      { date: "May 2", text: "Scheduled for May 8 (Planned)" },
    ],
  }),
  make({
    id: "a-batch-cook",
    title: "Cook batch meals for the week",
    goal: "g2",
    project: "Nutrition plan",
    status: "planned",
    impact: 6,
    timeMinutes: 90,
    scheduledLabel: "MAY 10",
    scheduledSort: 5,
    createdLabel: "May 1",
    changedSort: 980,
    timeline: [
      { date: "May 1", text: "Created in Backlog" },
      { date: "May 4", text: "Scheduled for May 10 (Planned)" },
    ],
  }),
  make({
    id: "a-review-equipment",
    title: "Review camera audio setup",
    goal: "g1",
    project: "Set up workspace",
    status: "backlog",
    impact: 4,
    timeMinutes: 45,
    createdLabel: "Apr 22",
    changedSort: 870,
    timeline: [{ date: "Apr 22", text: "Created in Backlog" }],
  }),
  make({
    id: "a-find-hiit",
    title: "Find HIIT routine for home",
    goal: "g2",
    project: "Build cardio routine",
    status: "backlog",
    impact: 5,
    timeMinutes: 25,
    createdLabel: "Apr 18",
    changedSort: 850,
    timeline: [{ date: "Apr 18", text: "Created in Backlog" }],
  }),
  make({
    id: "a-pick-music",
    title: "Pick music licensing service",
    goal: "g1",
    project: "Set up workspace",
    status: "backlog",
    impact: 3,
    timeMinutes: 40,
    createdLabel: "Apr 15",
    changedSort: 840,
    timeline: [{ date: "Apr 15", text: "Created in Backlog" }],
  }),
  make({
    id: "a-book-list-q3",
    title: "Pick next book to read",
    goal: "g3",
    project: "Build daily reading habit",
    status: "backlog",
    impact: 4,
    timeMinutes: 15,
    createdLabel: "Apr 20",
    changedSort: 830,
    timeline: [{ date: "Apr 20", text: "Created in Backlog" }],
  }),
  make({
    id: "a-test-vlog-intro",
    title: "Test vlog-style intro for video #2",
    goal: "g1",
    project: "Shoot video #1",
    status: "backlog",
    impact: 6,
    timeMinutes: 60,
    createdLabel: "Apr 12",
    changedSort: 820,
    timeline: [{ date: "Apr 12", text: "Created in Backlog" }],
  }),
];

/* ====== Delegated actions (6 total) ====== */
const DELEGATED: Action[] = [
  make({
    id: "d-grocery",
    title: "Research grocery delivery services",
    goal: "g2",
    project: "Nutrition plan",
    status: "delegated",
    impact: 4,
    timeMinutes: 30,
    createdLabel: "Apr 24",
    changedSort: 700,
    delegate: "Maria",
    expectedReturnLabel: "APR 30",
    expectedReturnDelta: -5,
    delegatedLabel: "Apr 25",
    delegatedAgoDays: 10,
    delegationNote:
      "Asked her to check 3 services and compare prices for weekly delivery.",
    timeline: [
      { date: "Apr 24", text: "Created in Backlog" },
      { date: "Apr 25", text: "Delegated to Maria · expected Apr 30" },
    ],
  }),
  make({
    id: "d-physio",
    title: "Schedule physiotherapy consultation",
    goal: "g2",
    project: "Build cardio routine",
    status: "delegated",
    impact: 6,
    timeMinutes: 20,
    createdLabel: "May 2",
    changedSort: 720,
    delegate: "Maria",
    expectedReturnLabel: "TODAY",
    expectedReturnDelta: 0,
    delegatedLabel: "May 2",
    delegatedAgoDays: 3,
    delegationNote:
      "Find a clinic that takes our insurance and book the earliest available slot.",
    timeline: [
      { date: "May 2", text: "Created in Backlog" },
      { date: "May 2", text: "Delegated to Maria · expected May 5" },
    ],
  }),
  make({
    id: "d-ring-light",
    title: "Buy ring light",
    goal: "g1",
    project: "Set up workspace",
    status: "delegated",
    impact: 5,
    timeMinutes: 45,
    createdLabel: "Apr 28",
    changedSort: 730,
    delegate: "Maria",
    expectedReturnLabel: "MAY 6",
    expectedReturnDelta: 1,
    delegatedLabel: "Apr 29",
    delegatedAgoDays: 6,
    delegationNote:
      "Stick to under $80. Neewer 18\" or equivalent. Needs to ship by May 6.",
    timeline: [
      { date: "Apr 28", text: "Created in Backlog" },
      { date: "Apr 29", text: "Delegated to Maria · expected May 6" },
    ],
  }),
  make({
    id: "d-reading-list",
    title: "Compile reading list for next quarter",
    goal: "g3",
    project: "Build daily reading habit",
    status: "delegated",
    impact: 5,
    timeMinutes: 45,
    createdLabel: "May 3",
    changedSort: 740,
    delegate: "AI",
    expectedReturnLabel: "MAY 6",
    expectedReturnDelta: 1,
    delegatedLabel: "May 4",
    delegatedAgoDays: 1,
    delegationNote:
      "Pick 6 books across deep work, philosophy, and biography. Mix audiobook-friendly with print.",
    timeline: [
      { date: "May 3", text: "Created in Backlog" },
      { date: "May 4", text: "Delegated to AI · expected May 6" },
    ],
  }),
  make({
    id: "d-thumb-brief",
    title: "Send brief to thumbnail designer",
    goal: "g1",
    project: "Shoot video #1",
    status: "delegated",
    impact: 6,
    timeMinutes: 30,
    createdLabel: "Apr 27",
    changedSort: 690,
    delegate: "AI",
    delegatedLabel: "Apr 28",
    delegatedAgoDays: 7,
    delegationNote:
      "Generate brief from the video outline. Include 3 reference thumbnails and a tone note.",
    timeline: [
      { date: "Apr 27", text: "Created in Backlog" },
      { date: "Apr 28", text: "Delegated to AI" },
    ],
  }),
  make({
    id: "d-script-feedback",
    title: "Edit script feedback notes",
    goal: "g1",
    project: "Shoot video #1",
    status: "delegated",
    impact: 3,
    timeMinutes: 15,
    createdLabel: "May 1",
    changedSort: 680,
    delegate: "Maria",
    delegatedLabel: "May 2",
    delegatedAgoDays: 3,
    delegationNote: "Consolidate her feedback from voice notes into bullet list.",
    timeline: [
      { date: "May 1", text: "Created in Backlog" },
      { date: "May 2", text: "Delegated to Maria" },
    ],
  }),
];

/* ====== Done actions (32) — generated compactly ====== */
const doneTitles: { title: string; goal: GoalKey; project: string; impact: number; min: number; date: string }[] = [
  { title: "Outline channel structure", goal: "g1", project: "Shoot video #1", impact: 7, min: 60, date: "May 4" },
  { title: "Define content pillars", goal: "g1", project: "Shoot video #1", impact: 6, min: 45, date: "May 3" },
  { title: "Set up workspace lighting", goal: "g1", project: "Set up workspace", impact: 5, min: 90, date: "May 2" },
  { title: "Buy microphone", goal: "g1", project: "Set up workspace", impact: 6, min: 30, date: "May 1" },
  { title: "Configure recording software", goal: "g1", project: "Set up workspace", impact: 5, min: 60, date: "Apr 30" },
  { title: "Create channel branding", goal: "g1", project: "Shoot video #1", impact: 7, min: 120, date: "Apr 29" },
  { title: "Register channel name", goal: "g1", project: "Shoot video #1", impact: 4, min: 15, date: "Apr 28" },
  { title: "Write channel bio", goal: "g1", project: "Shoot video #1", impact: 3, min: 20, date: "Apr 27" },
  { title: "Pick weekly upload day", goal: "g1", project: "Shoot video #1", impact: 4, min: 10, date: "Apr 26" },
  { title: "Sketch video #1 storyboard", goal: "g1", project: "Shoot video #1", impact: 7, min: 90, date: "Apr 25" },
  { title: "Test camera angles", goal: "g1", project: "Set up workspace", impact: 5, min: 45, date: "Apr 24" },
  { title: "Finished book 9 of 24", goal: "g3", project: "Build daily reading habit", impact: 6, min: 60, date: "May 5" },
  { title: "Read 30 minutes", goal: "g3", project: "Build daily reading habit", impact: 4, min: 30, date: "May 5" },
  { title: "Logged today's read", goal: "g3", project: "Build daily reading habit", impact: 2, min: 5, date: "May 5" },
  { title: "Read 30 minutes", goal: "g3", project: "Build daily reading habit", impact: 4, min: 30, date: "May 4" },
  { title: "Read 30 minutes", goal: "g3", project: "Build daily reading habit", impact: 4, min: 30, date: "May 3" },
  { title: "Finished book 8 of 24", goal: "g3", project: "Build daily reading habit", impact: 6, min: 60, date: "May 2" },
  { title: "Read 30 minutes", goal: "g3", project: "Build daily reading habit", impact: 4, min: 30, date: "May 1" },
  { title: "Read 30 minutes", goal: "g3", project: "Build daily reading habit", impact: 4, min: 30, date: "Apr 30" },
  { title: "Read 30 minutes", goal: "g3", project: "Build daily reading habit", impact: 4, min: 30, date: "Apr 29" },
  { title: "Finished book 7 of 24", goal: "g3", project: "Build daily reading habit", impact: 6, min: 60, date: "Apr 28" },
  { title: "Built reading nook", goal: "g3", project: "Build daily reading habit", impact: 5, min: 60, date: "Apr 27" },
  { title: "Set evening reading reminder", goal: "g3", project: "Build daily reading habit", impact: 3, min: 5, date: "Apr 26" },
  { title: "Cook batch meals", goal: "g2", project: "Nutrition plan", impact: 6, min: 90, date: "Apr 26" },
  { title: "Calculate daily macros", goal: "g2", project: "Nutrition plan", impact: 5, min: 30, date: "Apr 25" },
  { title: "Buy kitchen scale", goal: "g2", project: "Nutrition plan", impact: 4, min: 30, date: "Apr 24" },
  { title: "First gym session", goal: "g2", project: "Build cardio routine", impact: 6, min: 60, date: "Apr 23" },
  { title: "Buy running shoes", goal: "g2", project: "Build cardio routine", impact: 5, min: 45, date: "Apr 22" },
  { title: "Set baseline weight", goal: "g2", project: "Nutrition plan", impact: 3, min: 5, date: "Apr 21" },
  { title: "Plan first week meals", goal: "g2", project: "Nutrition plan", impact: 5, min: 60, date: "Apr 21" },
  { title: "Pick gym near apartment", goal: "g2", project: "Build cardio routine", impact: 4, min: 30, date: "Apr 20" },
  { title: "Sign gym membership", goal: "g2", project: "Build cardio routine", impact: 5, min: 30, date: "Apr 20" },
];

const DONE: Action[] = doneTitles.map((d, i) =>
  make({
    id: `done-${i}`,
    title: d.title,
    goal: d.goal,
    project: d.project,
    status: "done",
    impact: d.impact,
    timeMinutes: d.min,
    createdLabel: d.date,
    changedSort: 600 - i,
    timeline: [
      { date: d.date, text: "Created in Backlog" },
      { date: d.date, text: "Marked Done" },
    ],
  }),
);

/* ====== Dropped (2) ====== */
const DROPPED: Action[] = [
  make({
    id: "drop-1",
    title: "Try keto for 2 weeks as experiment",
    goal: "g2",
    project: "Nutrition plan",
    status: "dropped",
    impact: 4,
    timeMinutes: 0,
    createdLabel: "Apr 10",
    changedSort: 500,
    timeline: [
      { date: "Apr 10", text: "Created in Backlog" },
      { date: "Apr 18", text: "Dropped — not aligned with current plan" },
    ],
  }),
  make({
    id: "drop-2",
    title: "Hire video editor freelancer",
    goal: "g1",
    project: "Shoot video #1",
    status: "dropped",
    impact: 5,
    timeMinutes: 0,
    createdLabel: "Apr 5",
    changedSort: 490,
    timeline: [
      { date: "Apr 5", text: "Created in Backlog" },
      { date: "Apr 14", text: "Dropped — will edit myself" },
    ],
  }),
];

export const ACTIONS: Action[] = [...ACTIVE, ...DELEGATED, ...DONE, ...DROPPED];

export const ACTIVE_STATUSES: ActionStatus[] = ["backlog", "planned"];
export const TERMINAL_STATUSES: ActionStatus[] = ["done", "delegated", "dropped", "cancelled"];

export function isActive(s: ActionStatus): boolean {
  return ACTIVE_STATUSES.includes(s);
}
