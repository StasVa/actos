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
  /** Marks this entity as part of the seeded sample dataset (Setup Wizard). */
  isSample?: boolean;
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
  // TODO(post-beta): consider TiptapDoc type — currently treated as opaque JSON string by Supabase rowMappers.
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
  /** Marks this entity as part of the seeded sample dataset (Setup Wizard). */
  isSample?: boolean;
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
  /** @deprecated Energy/Focus tracking removed; field kept to tolerate legacy data. */
  energyCost?: number;
  /** @deprecated Energy/Focus tracking removed; field kept to tolerate legacy data. */
  focusCost?: number;
  timeEstimateMinutes?: number;
  delegateName?: string;
  delegateNote?: string;
  expectedReturnDate?: ISODate;
  timeline: ActionTimelineEvent[];
  createdAt: ISODateTime;
  updatedAt?: ISODateTime;
  plannedAt?: ISODateTime;
  completedAt?: ISODateTime;
  delegatedAt?: ISODateTime;
  droppedAt?: ISODateTime;
  cancelledAt?: ISODateTime;
  /** Marks this entity as part of the seeded sample dataset (Setup Wizard). */
  isSample?: boolean;
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
  /** @deprecated removed from UI; legacy field. */
  energyCost?: number;
  /** @deprecated removed from UI; legacy field. */
  focusCost?: number;
  timeEstimateMinutes?: number;
  totalCompletions: number;
  completionHistory: RitualCompletion[];
  status: RitualStatus;
  createdAt: ISODateTime;
  archivedAt?: ISODateTime;
  /** Marks this entity as part of the seeded sample dataset (Setup Wizard). */
  isSample?: boolean;
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
  /** Marks this entity as part of the seeded sample dataset (Setup Wizard). */
  isSample?: boolean;
}

// ───────── Day entries ─────────
export type DayType = "execution" | "recovery" | "day-off" | "sick";

export interface DayEntry {
  date: ISODate;
  dayType?: DayType;
  mainTaskActionId?: ID;
  /** @deprecated Energy tracking removed; field kept to tolerate legacy data. */
  morningEnergyScore?: number;
  /** @deprecated removed; field kept to tolerate legacy localStorage data. */
  morningIntentNote?: string;
  /** @deprecated Energy tracking removed; field kept to tolerate legacy data. */
  eveningEnergyScore?: number;
  /** @deprecated Reflection field removed in v2. */
  reflectionText?: string;
  startedAt?: ISODateTime;
  closedAt?: ISODateTime;
  // New plan-flow fields
  plannedActionIds?: ID[];
  plannedRitualIds?: ID[];
  skippedRitualIds?: ID[];
  isPlanned?: boolean;
  isClosed?: boolean;
  /** Marks this entity as part of the seeded sample dataset (Setup Wizard). */
  isSample?: boolean;
}

// ───────── Sessions ─────────
export type SessionStatus = "in_progress" | "completed" | "aborted";
export type SessionMode = "pomodoro" | "continuous" | "custom";

export interface Session {
  id: ID;
  status: SessionStatus;
  startedAt: ISODateTime;
  endedAt: ISODateTime | null;
  mode: SessionMode;
  workDuration: number; // minutes per work block
  breakDuration: number; // minutes per break (0 for continuous)
  cyclesPlanned: number;
  plannedActionIds: ID[];
  completedActionIds: ID[];
  droppedActionIds: ID[];
  cyclesCompleted: number;
  /** Optional user reflection captured on the session summary screen. */
  reflection?: string | null;
  /** Marks this entity as part of the seeded sample dataset (Setup Wizard). */
  isSample?: boolean;
}

// ───────── Settings ─────────
export interface UserSettings {
  layers: {
    planAndReview: boolean;
    logTime: boolean;
  };
  defaultGoalId?: ID;
  userName?: string;
  userEmail?: string;
  /** Demo flag — exposes /admin/components and tier toggle. Will be removed when real auth lands. */
  showAdminTools?: boolean;
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
