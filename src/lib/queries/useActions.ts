// TanStack Query hooks for Actions. Source of truth: Supabase `public.actions`
// joined with `action_timeline`. RLS enforces per-user scoping; the query
// filters by user.id for cache stability.
//
// Each mutation owns its optimistic update (Decision F). Status validation
// (Impact + Time required for "done", etc.) lives in the UI layer per pre-flight
// — these hooks accept any client-validated payload and write through.
//
// useChangeActionStatusMutation issues two sequential DB calls (action row
// update + timeline event insert). This is acceptable for Session 1; can be
// collapsed into a Postgres function later if atomicity becomes load-bearing.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/useAuth";
import { useStore } from "@/store/useStore";
import { queryKeys } from "@/lib/queryKeys";
import {
  actionToInsert,
  actionToUpdate,
  rowToAction,
  type ActionRowWithJoin,
} from "@/lib/rowMappers";
import type {
  Action,
  ActionStatus,
  Goal,
  ID,
  ISODate,
  Project,
} from "@/types";

function nowISO(): string {
  return new Date().toISOString();
}

const CREATED_LABEL: Record<ActionStatus, string> = {
  backlog: "Backlog",
  planned: "Planned",
  done: "Done",
  delegated: "Delegated",
  dropped: "Dropped",
  cancelled: "Cancelled",
};

// ────── query ──────

export function useActionsQuery() {
  const { user } = useAuth();
  return useQuery<Action[]>({
    queryKey: queryKeys.actions,
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("actions")
        .select("*, action_timeline(*)")
        .eq("user_id", user.id);
      if (error) throw error;
      return (data as ActionRowWithJoin[])
        .map(rowToAction)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    },
    enabled: !!user,
  });
}

// ────── createAction ──────

export type CreateActionPayload = Pick<Action, "title"> & {
  projectId?: ID | null;
  goalId?: ID;
} & Partial<Action>;

function resolveGoalId(
  payload: CreateActionPayload,
  projectsInCache: Project[],
  goalsInCache: Goal[],
): ID | undefined {
  if (payload.goalId) return payload.goalId;
  if (payload.projectId) {
    const proj = projectsInCache.find((p) => p.id === payload.projectId);
    if (proj) return proj.goalId;
  }
  const defaultGoalId = useStore.getState().settings.defaultGoalId;
  if (defaultGoalId) return defaultGoalId;
  return (
    goalsInCache.find((g) => g.status === "active")?.id ??
    goalsInCache[0]?.id
  );
}

function buildOptimisticAction(
  payload: CreateActionPayload,
  goalId: ID,
  tempId: ID,
): Action {
  const status: ActionStatus =
    payload.status ?? (payload.scheduledDate ? "planned" : "backlog");
  const at = nowISO();
  const completedAt =
    payload.completedAt ?? (status === "done" ? at : undefined);
  const delegatedAt =
    payload.delegatedAt ?? (status === "delegated" ? at : undefined);
  const droppedAt =
    payload.droppedAt ?? (status === "dropped" ? at : undefined);
  const cancelledAt =
    payload.cancelledAt ?? (status === "cancelled" ? at : undefined);
  const plannedAt =
    payload.plannedAt ?? (status === "planned" ? at : undefined);
  return {
    id: tempId,
    title: payload.title,
    goalId,
    projectId: payload.projectId ?? null,
    status,
    scheduledDate: payload.scheduledDate,
    notes: payload.notes,
    impact: payload.impact ?? 0,
    timeEstimateMinutes: payload.timeEstimateMinutes,
    delegateName: payload.delegateName,
    delegateNote: payload.delegateNote,
    expectedReturnDate: payload.expectedReturnDate,
    plannedAt,
    completedAt,
    delegatedAt,
    droppedAt,
    cancelledAt,
    timeline: [{ at, text: `Created in ${CREATED_LABEL[status]}` }],
    createdAt: at,
    isSample: payload.isSample,
  };
}

export function useCreateActionMutation() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation<
    { id: ID },
    Error,
    CreateActionPayload,
    { prev?: Action[]; tempId?: string }
  >({
    mutationFn: async (payload) => {
      if (!user) throw new Error("Not authenticated");
      const projects = queryClient.getQueryData<Project[]>(queryKeys.projects) ?? [];
      const goals = queryClient.getQueryData<Goal[]>(queryKeys.goals) ?? [];
      const goalId = resolveGoalId(payload, projects, goals);
      if (!goalId) throw new Error("No goal context for action creation");
      const status: ActionStatus =
        payload.status ?? (payload.scheduledDate ? "planned" : "backlog");
      const at = nowISO();
      const enriched: Partial<Action> & Pick<Action, "title" | "goalId" | "impact"> = {
        ...payload,
        title: payload.title,
        goalId,
        status,
        impact: payload.impact ?? 0,
        plannedAt:
          payload.plannedAt ?? (status === "planned" ? at : undefined),
        completedAt:
          payload.completedAt ?? (status === "done" ? at : undefined),
        delegatedAt:
          payload.delegatedAt ?? (status === "delegated" ? at : undefined),
        droppedAt:
          payload.droppedAt ?? (status === "dropped" ? at : undefined),
        cancelledAt:
          payload.cancelledAt ?? (status === "cancelled" ? at : undefined),
        timeline: [{ at, text: `Created in ${CREATED_LABEL[status]}` }],
      };
      const { row, timeline } = actionToInsert(enriched, user.id);
      const { data: inserted, error: insertErr } = await supabase
        .from("actions")
        .insert(row)
        .select("*, action_timeline(*)")
        .single();
      if (insertErr || !inserted) throw insertErr ?? new Error("Action insert failed");
      if (timeline.length > 0) {
        const { error: tErr } = await supabase
          .from("action_timeline")
          .insert(timeline.map((t) => ({ ...t, action_id: inserted.id })));
        if (tErr) throw tErr;
      }
      return { id: inserted.id };
    },
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.actions });
      const prev = queryClient.getQueryData<Action[]>(queryKeys.actions);
      const projects = queryClient.getQueryData<Project[]>(queryKeys.projects) ?? [];
      const goals = queryClient.getQueryData<Goal[]>(queryKeys.goals) ?? [];
      const goalId = resolveGoalId(payload, projects, goals);
      if (!goalId) return { prev };
      const tempId = crypto.randomUUID();
      const optimistic = buildOptimisticAction(payload, goalId, tempId);
      queryClient.setQueryData<Action[]>(queryKeys.actions, (old) => [
        ...(old ?? []),
        optimistic,
      ]);
      return { prev, tempId };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev !== undefined) queryClient.setQueryData(queryKeys.actions, ctx.prev);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.actions });
    },
  });
}

// ────── updateAction (general edit; no timeline event) ──────

export interface UpdateActionVars {
  id: ID;
  partial: Partial<Action>;
}

export function useUpdateActionMutation() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, UpdateActionVars, { prev?: Action[] }>({
    mutationFn: async ({ id, partial }) => {
      const { row } = actionToUpdate(partial);
      if (Object.keys(row).length === 0) return;
      const { error } = await supabase.from("actions").update(row).eq("id", id);
      if (error) throw error;
    },
    onMutate: async ({ id, partial }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.actions });
      const prev = queryClient.getQueryData<Action[]>(queryKeys.actions);
      queryClient.setQueryData<Action[]>(queryKeys.actions, (old) =>
        (old ?? []).map((a) =>
          a.id === id ? { ...a, ...partial, updatedAt: nowISO() } : a,
        ),
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev !== undefined) queryClient.setQueryData(queryKeys.actions, ctx.prev);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.actions });
    },
  });
}

// ────── changeActionStatus (status + terminal timestamps + timeline event) ──────

export interface ChangeActionStatusVars {
  id: ID;
  newStatus: ActionStatus;
  statusPayload?: {
    delegateName?: string;
    delegateNote?: string;
    expectedReturnDate?: ISODate;
    scheduledDate?: ISODate;
  };
}

interface StatusTransition {
  partial: Partial<Action>;
  timelineText: string;
}

// Computes the row patch + timeline text for a status transition. Pure so it
// can be reused in mutationFn (DB write) and onMutate (cache write).
function deriveStatusTransition(
  prev: Action,
  newStatus: ActionStatus,
  statusPayload: ChangeActionStatusVars["statusPayload"],
  at: string,
): StatusTransition {
  // Clear all terminal timestamps; keep plannedAt and delegatedAt as history.
  const partial: Partial<Action> = {
    status: newStatus,
    completedAt: undefined,
    droppedAt: undefined,
    cancelledAt: undefined,
  };
  let timelineText = `Status → ${newStatus}`;
  switch (newStatus) {
    case "done":
      partial.completedAt = at;
      timelineText = "Marked Done";
      break;
    case "delegated": {
      partial.delegatedAt = at;
      const delegateName = statusPayload?.delegateName ?? prev.delegateName;
      if (statusPayload?.delegateName) partial.delegateName = statusPayload.delegateName;
      if (statusPayload?.delegateNote) partial.delegateNote = statusPayload.delegateNote;
      if (statusPayload?.expectedReturnDate)
        partial.expectedReturnDate = statusPayload.expectedReturnDate;
      timelineText = `Delegated${delegateName ? ` to ${delegateName}` : ""}`;
      break;
    }
    case "dropped":
      partial.droppedAt = at;
      timelineText = "Dropped";
      break;
    case "cancelled":
      partial.cancelledAt = at;
      timelineText = "Cancelled";
      break;
    case "planned": {
      const scheduledDate = statusPayload?.scheduledDate ?? prev.scheduledDate;
      if (statusPayload?.scheduledDate) partial.scheduledDate = statusPayload.scheduledDate;
      if (!prev.plannedAt) partial.plannedAt = at;
      timelineText = `Scheduled${scheduledDate ? ` for ${scheduledDate}` : ""} (Planned)`;
      break;
    }
    case "backlog":
      timelineText = "Re-opened in Backlog";
      break;
  }
  return { partial, timelineText };
}

export function useChangeActionStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation<
    void,
    Error,
    ChangeActionStatusVars,
    { prev?: Action[] }
  >({
    mutationFn: async ({ id, newStatus, statusPayload }) => {
      const actions = queryClient.getQueryData<Action[]>(queryKeys.actions) ?? [];
      const prev = actions.find((a) => a.id === id);
      if (!prev) throw new Error(`Action ${id} not found in cache`);
      const at = nowISO();
      const { partial, timelineText } = deriveStatusTransition(
        prev,
        newStatus,
        statusPayload,
        at,
      );
      const { row } = actionToUpdate(partial);
      const { error: updateErr } = await supabase
        .from("actions")
        .update(row)
        .eq("id", id);
      if (updateErr) throw updateErr;
      const { error: timelineErr } = await supabase
        .from("action_timeline")
        .insert({
          id: crypto.randomUUID(),
          action_id: id,
          at,
          text: timelineText,
        });
      if (timelineErr) throw timelineErr;
    },
    onMutate: async ({ id, newStatus, statusPayload }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.actions });
      const prev = queryClient.getQueryData<Action[]>(queryKeys.actions);
      const prevAction = (prev ?? []).find((a) => a.id === id);
      if (!prevAction) return { prev };
      const at = nowISO();
      const { partial, timelineText } = deriveStatusTransition(
        prevAction,
        newStatus,
        statusPayload,
        at,
      );
      queryClient.setQueryData<Action[]>(queryKeys.actions, (old) =>
        (old ?? []).map((a) =>
          a.id === id
            ? {
                ...a,
                ...partial,
                updatedAt: at,
                timeline: [...a.timeline, { at, text: timelineText }],
              }
            : a,
        ),
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev !== undefined) queryClient.setQueryData(queryKeys.actions, ctx.prev);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.actions });
    },
  });
}

// ────── deleteAction ──────

export function useDeleteActionMutation() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, ID, { prev?: Action[] }>({
    mutationFn: async (id) => {
      // DB CASCADE handles action_timeline rows.
      const { error } = await supabase.from("actions").delete().eq("id", id);
      if (error) throw error;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.actions });
      const prev = queryClient.getQueryData<Action[]>(queryKeys.actions);
      queryClient.setQueryData<Action[]>(queryKeys.actions, (old) =>
        (old ?? []).filter((a) => a.id !== id),
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev !== undefined) queryClient.setQueryData(queryKeys.actions, ctx.prev);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.actions });
    },
  });
}
