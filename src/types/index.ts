// ActOS entity types — single source of truth for the app's data model.

export type ID = string;
export type ISODate = string; // "2026-05-05"
export type ISODateTime = string; // ISO timestamp

// ───────── Goals ─────────
export type GoalType = "short-term" | "mid-term";
export type GoalStatus = "active" | "completed" | "dropped";
export type GoalColorVar = "goal-1" | "goal-2" | "goal-3";

export interface Goal {
  id: ID;
  title: string;
  type: GoalType;
  status: GoalStatus;
  description?: string;
  successCriteria: { id: ID; text: string; done: boolean }[];
  targetDate?: ISODate;
  color: GoalColorVar;
  createdAt: ISODateTime;
  updatedAt?: ISODateTime;
  completedAt?: ISODateTime;
  droppedAt?: ISODateTime;
}

// ───────── Projects ─────────
export type ProjectStatus = "active" | "completed" | "dropped";

export interface ProjectReference {
  id: ID;
  url: string;
  title?: string;
}

export interface Project {
  id: ID;
  goalId: ID;
  title: string;
  status: ProjectStatus;
  description?: string;
  references: ProjectReference[];
  createdAt: ISODateTime;
  updatedAt?: ISODateTime;
  completedAt?: ISODateTime;
  droppedAt?: ISODateTime;
  /**
   * Draft mode — true while the user is still creating the project on the
   * Project page and hasn't entered any meaningful content yet. Drafts are
   * hidden from all lists/counts and silently deleted if abandoned.
   */
  isDraft?: boolean;
}

// ───────── Actions ─────────
export type ActionStatus =
  | "backlog"
  | "planned"
  | "done"
  | "delegated"
  | "dropped"
  | "cancelled";

export interface ActionTimelineEvent {
  at: ISODateTime;
  text: string;
}

export interface Action {
  id: ID;
  title: string;
  goalId: ID;
  projectId: ID | null; // null = goal-level backlog
  status: ActionStatus;
  scheduledDate?: ISODate;
  notes?: string;
  impact: number; // 0..10
  energyCost?: number; // 1..10
  focusCost?: number; // 1..10
  timeEstimateMinutes?: number;
  delegateName?: string;
  delegateNote?: string;
  expectedReturnDate?: ISODate;
  timeline: ActionTimelineEvent[];
  createdAt: ISODateTime;
  updatedAt?: ISODateTime;
  completedAt?: ISODateTime;
  delegatedAt?: ISODateTime;
  droppedAt?: ISODateTime;
  cancelledAt?: ISODateTime;
}

// ───────── Rituals ─────────
export type RitualSchedule = "daily" | "weekdays" | "weekly" | "monthly" | "custom";
export type RitualStatus = "active" | "archived";

export interface RitualScheduleConfig {
  weekday?: number; // 0..6 for weekly
  monthDay?: number; // 1..31 for monthly
  customDays?: number[]; // 0..6 for custom (subset)
  timeOfDay?: string; // "07:00"
}

export type RitualCompletionStatus = "pending" | "done" | "skipped" | "missed";

export interface RitualCompletion {
  date: ISODate;
  at: ISODateTime;
  // Optional for backwards compat — legacy entries without status are treated as "done".
  status?: RitualCompletionStatus;
}

export interface Ritual {
  id: ID;
  goalId: ID;
  projectId: ID | null;
  title: string;
  schedule: RitualSchedule;
  scheduleConfig?: RitualScheduleConfig;
  baseImpact: number;
  notes?: string;
  energyCost?: number;
  focusCost?: number;
  timeEstimateMinutes?: number;
  totalCompletions: number;
  completionHistory: RitualCompletion[];
  status: RitualStatus;
  createdAt: ISODateTime;
  archivedAt?: ISODateTime;
}

// ───────── Ideas ─────────
export type IdeaStatus =
  | "captured"
  | "converted_to_action"
  | "converted_to_project"
  | "discarded";

export interface IdeaReference {
  id: ID;
  url: string;
  title?: string;
}

export interface IdeaImageAttachment {
  id: ID;
  dataUrl: string;
  caption?: string;
}

export interface Idea {
  id: ID;
  goalId: ID;
  title: string;
  note?: string;
  references: IdeaReference[];
  imageAttachments: IdeaImageAttachment[];
  status: IdeaStatus;
  convertedToId?: ID;
  capturedAt: ISODateTime;
  discardedAt?: ISODateTime;
}

// ───────── Day entries ─────────
export type DayType = "execution" | "recovery" | "day-off" | "sick";

export interface DayEntry {
  date: ISODate;
  dayType?: DayType;
  mainTaskActionId?: ID;
  morningEnergyScore?: number; // 1..10
  morningIntentNote?: string;
  eveningEnergyScore?: number;
  reflectionText?: string;
  startedAt?: ISODateTime;
  closedAt?: ISODateTime;
  // New plan-flow fields
  plannedActionIds?: ID[];
  plannedRitualIds?: ID[];
  skippedRitualIds?: ID[];
  isPlanned?: boolean;
  isClosed?: boolean;
}

// ───────── Settings ─────────
export interface UserSettings {
  layers: {
    planAndReview: boolean;
    logEnergy: boolean;
    logFocus: boolean;
    logTime: boolean;
  };
  defaultGoalId?: ID;
}

// ───────── UI state ─────────
export interface UIState {
  activePanel:
    | { kind: "action"; mode: "edit" | "new"; id?: ID; prefill?: Partial<Action> }
    | { kind: "goal"; mode: "edit" | "new"; id?: ID; prefill?: Partial<Goal> }
    | { kind: "ritual"; mode: "edit" | "new"; id?: ID; prefill?: Partial<Ritual> }
    | null;
  selectedIdeaId?: ID;
}
