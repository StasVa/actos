// Boundary mappers between Supabase row shapes and app entity types.
//
// Conventions:
// - Status enums (Goal/Project/Action) match 1:1 between app and DB. Mappers
//   cast `string` ↔ enum at the boundary; DB CHECK constraints enforce validity.
// - snake_case ↔ camelCase field renaming is the bulk of the work.
// - Nullable DB columns map to optional app fields. On read, `null` → `undefined`.
//   On insert/update, `undefined` → don't touch (omit) or `null` (clear), depending
//   on Insert/Update semantics.
// - DB transition timestamps (completed_at, dropped_at, planned_at, etc.) are
//   only written when the corresponding status transition happens — never on insert.
// - DB-managed timestamps (created_at, updated_at) are omitted on insert; updated_at
//   is maintained by the set_updated_at trigger.
// - Deprecated Action fields (energyCost, focusCost) have no DB columns. Dropped silently.
// - Child rows (goal_success_criteria, project_references, action_timeline) get
//   client-generated `crypto.randomUUID()` IDs on insert so optimistic updates can
//   reference them before the round-trip. Returned IDs in mapper output are authoritative;
//   any caller-supplied id on child items is ignored. sort_order is assigned by
//   array index for criteria and references.
// - Project.description (Decision A): treated as opaque JSON string. JSON.stringify
//   on insert/update; on read, accept as string. See TODO in src/types/index.ts.

import type {
  Action,
  ActionStatus,
  DayEntry,
  DayType,
  Goal,
  GoalColorVar,
  GoalStatus,
  GoalType,
  Idea,
  IdeaImageAttachment,
  IdeaReference,
  IdeaStatus,
  Project,
  ProjectStatus,
  Ritual,
  RitualCompletion,
  RitualCompletionStatus,
  RitualSchedule,
  RitualScheduleConfig,
  RitualStatus,
  Session,
  SessionMode,
  SessionStatus,
} from "@/types";
import type { Database, Json } from "./supabase.types";

// ────── Row / Insert / Update aliases ──────
type GoalRow = Database["public"]["Tables"]["goals"]["Row"];
type GoalInsert = Database["public"]["Tables"]["goals"]["Insert"];
type GoalUpdate = Database["public"]["Tables"]["goals"]["Update"];

type GoalSCRow = Database["public"]["Tables"]["goal_success_criteria"]["Row"];
type GoalSCInsert = Database["public"]["Tables"]["goal_success_criteria"]["Insert"];

type ProjectRow = Database["public"]["Tables"]["projects"]["Row"];
type ProjectInsert = Database["public"]["Tables"]["projects"]["Insert"];
type ProjectUpdate = Database["public"]["Tables"]["projects"]["Update"];

type ProjectRefRow = Database["public"]["Tables"]["project_references"]["Row"];
type ProjectRefInsert = Database["public"]["Tables"]["project_references"]["Insert"];

type ActionRow = Database["public"]["Tables"]["actions"]["Row"];
type ActionInsert = Database["public"]["Tables"]["actions"]["Insert"];
type ActionUpdate = Database["public"]["Tables"]["actions"]["Update"];

type ActionTimelineRow = Database["public"]["Tables"]["action_timeline"]["Row"];
type ActionTimelineInsert = Database["public"]["Tables"]["action_timeline"]["Insert"];

type RitualRow = Database["public"]["Tables"]["rituals"]["Row"];
type RitualInsert = Database["public"]["Tables"]["rituals"]["Insert"];
type RitualUpdate = Database["public"]["Tables"]["rituals"]["Update"];

type RitualCompletionRow = Database["public"]["Tables"]["ritual_completions"]["Row"];
type RitualCompletionInsert = Database["public"]["Tables"]["ritual_completions"]["Insert"];

type IdeaRow = Database["public"]["Tables"]["ideas"]["Row"];
type IdeaInsert = Database["public"]["Tables"]["ideas"]["Insert"];
type IdeaUpdate = Database["public"]["Tables"]["ideas"]["Update"];

type IdeaRefRow = Database["public"]["Tables"]["idea_references"]["Row"];
type IdeaRefInsert = Database["public"]["Tables"]["idea_references"]["Insert"];

type IdeaImageRow = Database["public"]["Tables"]["idea_image_attachments"]["Row"];
type IdeaImageInsert = Database["public"]["Tables"]["idea_image_attachments"]["Insert"];

type DayEntryRow = Database["public"]["Tables"]["day_entries"]["Row"];
type DayEntryInsert = Database["public"]["Tables"]["day_entries"]["Insert"];
type DayEntryUpdate = Database["public"]["Tables"]["day_entries"]["Update"];

type SessionRow = Database["public"]["Tables"]["sessions"]["Row"];
type SessionInsert = Database["public"]["Tables"]["sessions"]["Insert"];
type SessionUpdate = Database["public"]["Tables"]["sessions"]["Update"];

// Joined-row shapes (returned by `.select("*, child_table(*)")`)
export type GoalRowWithJoin = GoalRow & {
  goal_success_criteria: GoalSCRow[];
};
export type ProjectRowWithJoin = ProjectRow & {
  project_references: ProjectRefRow[];
};
export type ActionRowWithJoin = ActionRow & {
  action_timeline: ActionTimelineRow[];
};

// Child-row insert shapes the mappers emit (parent id filled in by the hook
// after the parent row is created).
export type GoalSCInsertChild = Omit<GoalSCInsert, "goal_id">;
export type ProjectRefInsertChild = Omit<ProjectRefInsert, "project_id">;
export type ActionTimelineInsertChild = Omit<ActionTimelineInsert, "action_id">;
export type RitualCompletionInsertChild = Omit<RitualCompletionInsert, "ritual_id">;
export type IdeaRefInsertChild = Omit<IdeaRefInsert, "idea_id">;
export type IdeaImageInsertChild = Omit<IdeaImageInsert, "idea_id">;

// Joined-row shapes for the new entities
export type RitualRowWithJoin = RitualRow & {
  ritual_completions: RitualCompletionRow[];
};
export type IdeaRowWithJoin = IdeaRow & {
  idea_references: IdeaRefRow[];
  idea_image_attachments: IdeaImageRow[];
};

// ──────────────────────────────────────────────────────────
// Goal
// ──────────────────────────────────────────────────────────

export function rowToGoal(row: GoalRowWithJoin): Goal {
  return {
    id: row.id,
    title: row.title,
    type: row.type as GoalType,
    status: row.status as GoalStatus,
    description: row.description ?? undefined,
    successCriteria: [...row.goal_success_criteria]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((c) => ({ id: c.id, text: c.text, done: c.done })),
    targetDate: row.target_date ?? undefined,
    color: row.color as GoalColorVar,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    completedAt: row.completed_at ?? undefined,
    droppedAt: row.dropped_at ?? undefined,
    isSample: row.is_sample,
  };
}

export function goalToInsert(
  goal: Partial<Goal> & Pick<Goal, "title" | "type" | "color">,
  userId: string,
): { row: GoalInsert; criteria: GoalSCInsertChild[] } {
  return {
    row: {
      user_id: userId,
      title: goal.title,
      type: goal.type,
      color: goal.color,
      status: goal.status ?? "active",
      description: goal.description ?? null,
      target_date: goal.targetDate ?? null,
      is_sample: goal.isSample ?? false,
    },
    criteria: (goal.successCriteria ?? []).map((c, i) => ({
      id: crypto.randomUUID(),
      text: c.text,
      done: c.done,
      sort_order: i,
    })),
  };
}

export function goalToUpdate(
  goal: Partial<Goal>,
): { row: GoalUpdate; criteria?: GoalSCInsertChild[] } {
  const row: GoalUpdate = {};
  if (goal.title !== undefined) row.title = goal.title;
  if (goal.type !== undefined) row.type = goal.type;
  if (goal.status !== undefined) row.status = goal.status;
  if (goal.description !== undefined) row.description = goal.description ?? null;
  if (goal.targetDate !== undefined) row.target_date = goal.targetDate ?? null;
  if (goal.color !== undefined) row.color = goal.color;
  if (goal.completedAt !== undefined) row.completed_at = goal.completedAt ?? null;
  if (goal.droppedAt !== undefined) row.dropped_at = goal.droppedAt ?? null;
  const criteria = goal.successCriteria
    ? goal.successCriteria.map((c, i) => ({
        id: crypto.randomUUID(),
        text: c.text,
        done: c.done,
        sort_order: i,
      }))
    : undefined;
  return { row, criteria };
}

// ──────────────────────────────────────────────────────────
// Project
// ──────────────────────────────────────────────────────────

export function rowToProject(row: ProjectRowWithJoin): Project {
  return {
    id: row.id,
    goalId: row.goal_id,
    title: row.title,
    status: row.status as ProjectStatus,
    description: typeof row.description === "string" ? row.description : undefined,
    references: [...row.project_references]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((r) => ({ id: r.id, url: r.url, title: r.title ?? undefined })),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    completedAt: row.completed_at ?? undefined,
    droppedAt: row.dropped_at ?? undefined,
    isDraft: row.is_draft,
    isSample: row.is_sample,
  };
}

export function projectToInsert(
  project: Partial<Project> & Pick<Project, "title" | "goalId">,
  userId: string,
): { row: ProjectInsert; references: ProjectRefInsertChild[] } {
  return {
    row: {
      user_id: userId,
      goal_id: project.goalId,
      title: project.title,
      status: project.status ?? "active",
      description:
        project.description !== undefined ? JSON.stringify(project.description) : null,
      is_draft: project.isDraft ?? false,
      is_sample: project.isSample ?? false,
    },
    references: (project.references ?? []).map((r, i) => ({
      id: crypto.randomUUID(),
      url: r.url,
      title: r.title ?? null,
      sort_order: i,
    })),
  };
}

export function projectToUpdate(
  project: Partial<Project>,
): { row: ProjectUpdate; references?: ProjectRefInsertChild[] } {
  const row: ProjectUpdate = {};
  if (project.goalId !== undefined) row.goal_id = project.goalId;
  if (project.title !== undefined) row.title = project.title;
  if (project.status !== undefined) row.status = project.status;
  if (project.description !== undefined) {
    row.description = JSON.stringify(project.description);
  }
  if (project.isDraft !== undefined) row.is_draft = project.isDraft;
  if (project.completedAt !== undefined) row.completed_at = project.completedAt ?? null;
  if (project.droppedAt !== undefined) row.dropped_at = project.droppedAt ?? null;
  const references = project.references
    ? project.references.map((r, i) => ({
        id: crypto.randomUUID(),
        url: r.url,
        title: r.title ?? null,
        sort_order: i,
      }))
    : undefined;
  return { row, references };
}

// ──────────────────────────────────────────────────────────
// Action
// ──────────────────────────────────────────────────────────

export function rowToAction(row: ActionRowWithJoin): Action {
  return {
    id: row.id,
    title: row.title,
    goalId: row.goal_id,
    projectId: row.project_id,
    status: row.status as ActionStatus,
    scheduledDate: row.scheduled_date ?? undefined,
    notes: row.notes ?? undefined,
    impact: row.impact,
    timeEstimateMinutes: row.time_estimate_minutes ?? undefined,
    delegateName: row.delegate_name ?? undefined,
    delegateNote: row.delegate_note ?? undefined,
    expectedReturnDate: row.expected_return_date ?? undefined,
    timeline: [...row.action_timeline]
      .sort((a, b) => a.at.localeCompare(b.at))
      .map((t) => ({ at: t.at, text: t.text })),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    plannedAt: row.planned_at ?? undefined,
    completedAt: row.completed_at ?? undefined,
    delegatedAt: row.delegated_at ?? undefined,
    droppedAt: row.dropped_at ?? undefined,
    cancelledAt: row.cancelled_at ?? undefined,
    isSample: row.is_sample,
  };
}

export function actionToInsert(
  action: Partial<Action> & Pick<Action, "title" | "goalId" | "impact">,
  userId: string,
): { row: ActionInsert; timeline: ActionTimelineInsertChild[] } {
  return {
    row: {
      user_id: userId,
      goal_id: action.goalId,
      project_id: action.projectId ?? null,
      title: action.title,
      status: action.status ?? "backlog",
      scheduled_date: action.scheduledDate ?? null,
      notes: action.notes ?? null,
      impact: action.impact,
      time_estimate_minutes: action.timeEstimateMinutes ?? null,
      delegate_name: action.delegateName ?? null,
      delegate_note: action.delegateNote ?? null,
      expected_return_date: action.expectedReturnDate ?? null,
      is_sample: action.isSample ?? false,
    },
    timeline: (action.timeline ?? []).map((t) => ({
      id: crypto.randomUUID(),
      at: t.at,
      text: t.text,
    })),
  };
}

export function actionToUpdate(action: Partial<Action>): { row: ActionUpdate } {
  const row: ActionUpdate = {};
  if (action.title !== undefined) row.title = action.title;
  if (action.goalId !== undefined) row.goal_id = action.goalId;
  if (action.projectId !== undefined) row.project_id = action.projectId;
  if (action.status !== undefined) row.status = action.status;
  if (action.scheduledDate !== undefined) row.scheduled_date = action.scheduledDate ?? null;
  if (action.notes !== undefined) row.notes = action.notes ?? null;
  if (action.impact !== undefined) row.impact = action.impact;
  if (action.timeEstimateMinutes !== undefined)
    row.time_estimate_minutes = action.timeEstimateMinutes ?? null;
  if (action.delegateName !== undefined) row.delegate_name = action.delegateName ?? null;
  if (action.delegateNote !== undefined) row.delegate_note = action.delegateNote ?? null;
  if (action.expectedReturnDate !== undefined)
    row.expected_return_date = action.expectedReturnDate ?? null;
  if (action.plannedAt !== undefined) row.planned_at = action.plannedAt ?? null;
  if (action.completedAt !== undefined) row.completed_at = action.completedAt ?? null;
  if (action.delegatedAt !== undefined) row.delegated_at = action.delegatedAt ?? null;
  if (action.droppedAt !== undefined) row.dropped_at = action.droppedAt ?? null;
  if (action.cancelledAt !== undefined) row.cancelled_at = action.cancelledAt ?? null;
  // Timeline events are append-only and inserted separately via a dedicated
  // path during status-change mutations; not handled in updates.
  return { row };
}

// ──────────────────────────────────────────────────────────
// Ritual
// ──────────────────────────────────────────────────────────
// totalCompletions is DERIVED from the joined ritual_completions array
// (count of status='done') rather than read from rituals.total_completions.
// This eliminates the atomicity gap between "insert completion row" and
// "increment counter" — a single insert is all that's needed to record a
// completion. The DB column remains but is no longer the source of truth.

export function rowToRitualCompletion(row: RitualCompletionRow): RitualCompletion {
  return {
    date: row.date,
    at: row.at,
    status: row.status as RitualCompletionStatus,
  };
}

export function rowToRitual(row: RitualRowWithJoin): Ritual {
  const completionHistory = [...row.ritual_completions]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(rowToRitualCompletion);
  const totalCompletions = completionHistory.filter((c) => c.status === "done").length;
  return {
    id: row.id,
    goalId: row.goal_id,
    projectId: row.project_id,
    title: row.title,
    schedule: row.schedule as RitualSchedule,
    scheduleConfig: (row.schedule_config as RitualScheduleConfig | null) ?? undefined,
    baseImpact: row.base_impact,
    notes: row.notes ?? undefined,
    timeEstimateMinutes: row.time_estimate_minutes ?? undefined,
    totalCompletions,
    completionHistory,
    status: row.status as RitualStatus,
    createdAt: row.created_at,
    archivedAt: row.archived_at ?? undefined,
    isSample: row.is_sample,
  };
}

export function ritualToInsert(
  ritual: Partial<Ritual> & Pick<Ritual, "title" | "schedule" | "goalId">,
  userId: string,
): { row: RitualInsert; completions: RitualCompletionInsertChild[] } {
  return {
    row: {
      user_id: userId,
      goal_id: ritual.goalId,
      project_id: ritual.projectId ?? null,
      title: ritual.title,
      schedule: ritual.schedule,
      schedule_config: ritual.scheduleConfig
        ? (ritual.scheduleConfig as unknown as Json)
        : null,
      base_impact: ritual.baseImpact ?? 5,
      notes: ritual.notes ?? null,
      time_estimate_minutes: ritual.timeEstimateMinutes ?? null,
      status: ritual.status ?? "active",
      is_sample: ritual.isSample ?? false,
    },
    completions: (ritual.completionHistory ?? []).map((c) => ({
      id: crypto.randomUUID(),
      date: c.date,
      at: c.at,
      status: c.status ?? "done",
    })),
  };
}

export function ritualToUpdate(ritual: Partial<Ritual>): { row: RitualUpdate } {
  const row: RitualUpdate = {};
  if (ritual.title !== undefined) row.title = ritual.title;
  if (ritual.goalId !== undefined) row.goal_id = ritual.goalId;
  if (ritual.projectId !== undefined) row.project_id = ritual.projectId;
  if (ritual.schedule !== undefined) row.schedule = ritual.schedule;
  if (ritual.scheduleConfig !== undefined) {
    row.schedule_config = ritual.scheduleConfig
      ? (ritual.scheduleConfig as unknown as Json)
      : null;
  }
  if (ritual.baseImpact !== undefined) row.base_impact = ritual.baseImpact;
  if (ritual.notes !== undefined) row.notes = ritual.notes ?? null;
  if (ritual.timeEstimateMinutes !== undefined)
    row.time_estimate_minutes = ritual.timeEstimateMinutes ?? null;
  if (ritual.status !== undefined) row.status = ritual.status;
  if (ritual.archivedAt !== undefined) row.archived_at = ritual.archivedAt ?? null;
  return { row };
}

// ──────────────────────────────────────────────────────────
// Idea
// ──────────────────────────────────────────────────────────
// idea_image_attachments.storage_path stores the base64 dataUrl while images
// remain inline (P3 tech debt: deferred Supabase Storage migration). Once the
// migration ships, this mapper swaps storage_path → public URL lookup and
// dataUrl can be derived from storage_path.

export function rowToIdea(row: IdeaRowWithJoin): Idea {
  return {
    id: row.id,
    goalId: row.goal_id,
    title: row.title,
    note: row.note ?? undefined,
    references: [...row.idea_references]
      .sort((a, b) => a.created_at.localeCompare(b.created_at))
      .map((r) => ({ id: r.id, url: r.url, title: r.title ?? undefined })),
    imageAttachments: [...row.idea_image_attachments]
      .sort((a, b) => a.created_at.localeCompare(b.created_at))
      .map((a) => ({
        id: a.id,
        dataUrl: a.storage_path,
        caption: a.caption ?? undefined,
      })),
    status: row.status as IdeaStatus,
    convertedToId: row.converted_to_id ?? undefined,
    capturedAt: row.captured_at,
    discardedAt: row.discarded_at ?? undefined,
    isSample: row.is_sample,
  };
}

export function ideaToInsert(
  idea: Partial<Idea> & Pick<Idea, "title" | "goalId">,
  userId: string,
): {
  row: IdeaInsert;
  references: IdeaRefInsertChild[];
  images: IdeaImageInsertChild[];
} {
  return {
    row: {
      user_id: userId,
      goal_id: idea.goalId,
      title: idea.title,
      note: idea.note ?? null,
      status: idea.status ?? "captured",
      converted_to_id: idea.convertedToId ?? null,
      captured_at: idea.capturedAt ?? new Date().toISOString(),
      is_sample: idea.isSample ?? false,
    },
    references: (idea.references ?? []).map((r) => ({
      id: crypto.randomUUID(),
      url: r.url,
      title: r.title ?? null,
    })),
    images: (idea.imageAttachments ?? []).map((a) => ({
      id: crypto.randomUUID(),
      storage_path: a.dataUrl,
      caption: a.caption ?? null,
    })),
  };
}

export function ideaToUpdate(
  idea: Partial<Idea>,
): {
  row: IdeaUpdate;
  references?: IdeaRefInsertChild[];
  images?: IdeaImageInsertChild[];
} {
  const row: IdeaUpdate = {};
  if (idea.title !== undefined) row.title = idea.title;
  if (idea.goalId !== undefined) row.goal_id = idea.goalId;
  if (idea.note !== undefined) row.note = idea.note ?? null;
  if (idea.status !== undefined) row.status = idea.status;
  if (idea.convertedToId !== undefined) row.converted_to_id = idea.convertedToId ?? null;
  if (idea.discardedAt !== undefined) row.discarded_at = idea.discardedAt ?? null;
  const references = idea.references
    ? idea.references.map((r) => ({
        id: crypto.randomUUID(),
        url: r.url,
        title: r.title ?? null,
      }))
    : undefined;
  const images = idea.imageAttachments
    ? idea.imageAttachments.map((a) => ({
        id: crypto.randomUUID(),
        storage_path: a.dataUrl,
        caption: a.caption ?? null,
      }))
    : undefined;
  return { row, references, images };
}

// ──────────────────────────────────────────────────────────
// DayEntry
// ──────────────────────────────────────────────────────────
// One row per (user_id, date). Array columns map straight to uuid[]. The
// upsert-based mutation merges with the existing row in cache before writing,
// since Supabase upsert with onConflict replaces the entire row.

export function rowToDayEntry(row: DayEntryRow): DayEntry {
  return {
    date: row.date,
    dayType: (row.day_type as DayType | null) ?? undefined,
    mainTaskActionId: row.main_task_action_id ?? undefined,
    plannedActionIds: row.planned_action_ids ?? undefined,
    plannedRitualIds: row.planned_ritual_ids ?? undefined,
    skippedRitualIds: row.skipped_ritual_ids ?? undefined,
    isPlanned: row.is_planned,
    isClosed: row.is_closed,
    startedAt: row.started_at ?? undefined,
    closedAt: row.closed_at ?? undefined,
    isSample: row.is_sample,
  };
}

export function dayEntryToInsert(entry: DayEntry, userId: string): DayEntryInsert {
  return {
    user_id: userId,
    date: entry.date,
    day_type: entry.dayType ?? null,
    main_task_action_id: entry.mainTaskActionId ?? null,
    planned_action_ids: entry.plannedActionIds ?? null,
    planned_ritual_ids: entry.plannedRitualIds ?? null,
    skipped_ritual_ids: entry.skippedRitualIds ?? null,
    is_planned: entry.isPlanned ?? false,
    is_closed: entry.isClosed ?? false,
    started_at: entry.startedAt ?? null,
    closed_at: entry.closedAt ?? null,
    is_sample: entry.isSample ?? false,
  };
}

export function dayEntryPartialToUpdate(partial: Partial<DayEntry>): DayEntryUpdate {
  const row: DayEntryUpdate = {};
  if (partial.dayType !== undefined) row.day_type = partial.dayType ?? null;
  if (partial.mainTaskActionId !== undefined)
    row.main_task_action_id = partial.mainTaskActionId ?? null;
  if (partial.plannedActionIds !== undefined)
    row.planned_action_ids = partial.plannedActionIds ?? null;
  if (partial.plannedRitualIds !== undefined)
    row.planned_ritual_ids = partial.plannedRitualIds ?? null;
  if (partial.skippedRitualIds !== undefined)
    row.skipped_ritual_ids = partial.skippedRitualIds ?? null;
  if (partial.isPlanned !== undefined) row.is_planned = partial.isPlanned;
  if (partial.isClosed !== undefined) row.is_closed = partial.isClosed;
  if (partial.startedAt !== undefined) row.started_at = partial.startedAt ?? null;
  if (partial.closedAt !== undefined) row.closed_at = partial.closedAt ?? null;
  return row;
}

// ──────────────────────────────────────────────────────────
// Session (focus timer)
// ──────────────────────────────────────────────────────────

export function rowToSession(row: SessionRow): Session {
  return {
    id: row.id,
    status: row.status as SessionStatus,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    mode: row.mode as SessionMode,
    workDuration: row.work_duration,
    breakDuration: row.break_duration,
    cyclesPlanned: row.cycles_planned,
    plannedActionIds: row.planned_action_ids ?? [],
    completedActionIds: row.completed_action_ids ?? [],
    droppedActionIds: row.dropped_action_ids ?? [],
    cyclesCompleted: row.cycles_completed,
    reflection: row.reflection ?? undefined,
    isSample: row.is_sample,
  };
}

export function sessionToInsert(session: Session, userId: string): SessionInsert {
  return {
    id: session.id,
    user_id: userId,
    status: session.status,
    started_at: session.startedAt,
    ended_at: session.endedAt,
    mode: session.mode,
    work_duration: session.workDuration,
    break_duration: session.breakDuration,
    cycles_planned: session.cyclesPlanned,
    planned_action_ids: session.plannedActionIds,
    completed_action_ids: session.completedActionIds,
    dropped_action_ids: session.droppedActionIds,
    cycles_completed: session.cyclesCompleted,
    reflection: session.reflection ?? null,
    is_sample: session.isSample ?? false,
  };
}

export function sessionPartialToUpdate(partial: Partial<Session>): SessionUpdate {
  const row: SessionUpdate = {};
  if (partial.status !== undefined) row.status = partial.status;
  if (partial.endedAt !== undefined) row.ended_at = partial.endedAt;
  if (partial.plannedActionIds !== undefined)
    row.planned_action_ids = partial.plannedActionIds;
  if (partial.completedActionIds !== undefined)
    row.completed_action_ids = partial.completedActionIds;
  if (partial.droppedActionIds !== undefined)
    row.dropped_action_ids = partial.droppedActionIds;
  if (partial.cyclesCompleted !== undefined)
    row.cycles_completed = partial.cyclesCompleted;
  if (partial.reflection !== undefined) row.reflection = partial.reflection ?? null;
  return row;
}
