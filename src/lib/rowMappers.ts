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
  Goal,
  GoalColorVar,
  GoalStatus,
  GoalType,
  Project,
  ProjectStatus,
} from "@/types";
import type { Database } from "./supabase.types";

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
