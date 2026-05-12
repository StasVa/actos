// TanStack Query hooks for Goals. Source of truth: Supabase `public.goals` +
// joined `goal_success_criteria`. RLS guarantees per-user scoping server-side;
// the client filters by user.id only for clarity / cache stability.
//
// Mutations follow the standard optimistic pattern: onMutate snapshots and writes
// to cache, onError rolls back via context, onSettled invalidates. Each verb gets
// its own hook (per Decision F) so optimistic UX + error toasts can vary per verb.
//
// Cross-entity cascade (Session 1 transitional):
//   - useDropGoalMutation cascade-drops child projects (Supabase) + child actions
//     (TanStack cache) — non-terminal actions move to status='dropped'.
//   - useDeleteGoalMutation relies on DB CASCADE for projects + action rows;
//     the client mirrors that by removing them from the cache optimistically.
//   - Rituals/ideas/dayEntries are NOT cascaded client-side (Decision C — accept
//     transient staleness until those entities migrate to Supabase in Session 2,
//     at which point DB CASCADE handles it).

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/useAuth";
import { TERMINAL_ACTION_STATUSES } from "@/store/useStore";
import { queryKeys } from "@/lib/queryKeys";
import {
  goalToInsert,
  goalToUpdate,
  rowToGoal,
  type GoalRowWithJoin,
} from "@/lib/rowMappers";
import type { Action, Goal, GoalColorVar, ID, Project } from "@/types";

// ────── helpers (lifted from Zustand) ──────

function pickNextGoalColor(goals: Goal[]): GoalColorVar {
  const used = new Set(goals.filter((g) => g.status === "active").map((g) => g.color));
  const palette: GoalColorVar[] = ["goal-1", "goal-2", "goal-3"];
  return palette.find((c) => !used.has(c)) ?? "goal-1";
}

function nowISO(): string {
  return new Date().toISOString();
}

// ────── query ──────

export function useGoalsQuery() {
  const { user } = useAuth();
  return useQuery<Goal[]>({
    queryKey: queryKeys.goals,
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("goals")
        .select("*, goal_success_criteria(*)")
        .eq("user_id", user.id);
      if (error) throw error;
      return (data as GoalRowWithJoin[])
        .map(rowToGoal)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    },
    enabled: !!user,
  });
}

// ────── createGoal ──────

export type CreateGoalPayload = Pick<Goal, "title" | "type"> &
  Partial<Omit<Goal, "id" | "status" | "color" | "createdAt">>;

export type CreateGoalResult =
  | { ok: true; id: ID }
  | { ok: false; reason: "limit" | "not-authenticated" };

export function useCreateGoalMutation() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation<CreateGoalResult, Error, CreateGoalPayload, { prev?: Goal[]; tempId?: string }>({
    mutationFn: async (payload) => {
      if (!user) return { ok: false, reason: "not-authenticated" };
      const tier = user.subscriptionTier;
      const goals = queryClient.getQueryData<Goal[]>(queryKeys.goals) ?? [];
      const limit = tier === "all-in" ? 3 : 1;
      if (goals.filter((g) => g.status === "active").length >= limit) {
        return { ok: false, reason: "limit" };
      }
      const color = pickNextGoalColor(goals);
      const { row, criteria } = goalToInsert({ ...payload, color }, user.id);
      const { data: inserted, error: insertErr } = await supabase
        .from("goals")
        .insert(row)
        .select("*, goal_success_criteria(*)")
        .single();
      if (insertErr || !inserted) throw insertErr ?? new Error("Goal insert failed");
      if (criteria.length > 0) {
        const { error: cErr } = await supabase
          .from("goal_success_criteria")
          .insert(criteria.map((c) => ({ ...c, goal_id: inserted.id })));
        if (cErr) throw cErr;
      }
      return { ok: true, id: inserted.id };
    },
    onMutate: async (payload) => {
      if (!user) return {};
      const tier = user.subscriptionTier;
      const goals = queryClient.getQueryData<Goal[]>(queryKeys.goals) ?? [];
      const limit = tier === "all-in" ? 3 : 1;
      if (goals.filter((g) => g.status === "active").length >= limit) {
        // Caller will see ok:false; don't dirty the cache.
        return {};
      }
      await queryClient.cancelQueries({ queryKey: queryKeys.goals });
      const prev = queryClient.getQueryData<Goal[]>(queryKeys.goals);
      const tempId = crypto.randomUUID();
      const optimistic: Goal = {
        id: tempId,
        title: payload.title,
        type: payload.type,
        status: "active",
        description: payload.description,
        successCriteria: (payload.successCriteria ?? []).map((c) => ({
          id: crypto.randomUUID(),
          text: c.text,
          done: c.done,
        })),
        targetDate: payload.targetDate,
        color: pickNextGoalColor(goals),
        createdAt: nowISO(),
        isSample: payload.isSample,
      };
      queryClient.setQueryData<Goal[]>(queryKeys.goals, (old) => [...(old ?? []), optimistic]);
      return { prev, tempId };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev !== undefined) queryClient.setQueryData(queryKeys.goals, ctx.prev);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.goals });
    },
  });
}

// ────── updateGoal (general edit) ──────

export interface UpdateGoalVars {
  id: ID;
  partial: Partial<Goal>;
}

export function useUpdateGoalMutation() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, UpdateGoalVars, { prev?: Goal[] }>({
    mutationFn: async ({ id, partial }) => {
      const { row, criteria } = goalToUpdate(partial);
      if (Object.keys(row).length > 0) {
        const { error } = await supabase.from("goals").update(row).eq("id", id);
        if (error) throw error;
      }
      if (criteria !== undefined) {
        // Replace strategy: delete-all-then-reinsert.
        const { error: delErr } = await supabase
          .from("goal_success_criteria")
          .delete()
          .eq("goal_id", id);
        if (delErr) throw delErr;
        if (criteria.length > 0) {
          const { error: insErr } = await supabase
            .from("goal_success_criteria")
            .insert(criteria.map((c) => ({ ...c, goal_id: id })));
          if (insErr) throw insErr;
        }
      }
    },
    onMutate: async ({ id, partial }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.goals });
      const prev = queryClient.getQueryData<Goal[]>(queryKeys.goals);
      queryClient.setQueryData<Goal[]>(queryKeys.goals, (old) =>
        (old ?? []).map((g) =>
          g.id === id ? { ...g, ...partial, updatedAt: nowISO() } : g,
        ),
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev !== undefined) queryClient.setQueryData(queryKeys.goals, ctx.prev);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.goals });
    },
  });
}

// ────── markGoalComplete ──────

export function useMarkGoalCompleteMutation() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, ID, { prev?: Goal[] }>({
    mutationFn: async (id) => {
      const completedAt = nowISO();
      const { error } = await supabase
        .from("goals")
        .update({ status: "completed", completed_at: completedAt })
        .eq("id", id);
      if (error) throw error;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.goals });
      const prev = queryClient.getQueryData<Goal[]>(queryKeys.goals);
      const at = nowISO();
      queryClient.setQueryData<Goal[]>(queryKeys.goals, (old) =>
        (old ?? []).map((g) =>
          g.id === id ? { ...g, status: "completed", completedAt: at } : g,
        ),
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev !== undefined) queryClient.setQueryData(queryKeys.goals, ctx.prev);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.goals });
    },
  });
}

// ────── dropGoal (cascades projects + actions via Supabase status updates) ──────

export function useDropGoalMutation() {
  const queryClient = useQueryClient();

  return useMutation<
    void,
    Error,
    ID,
    { prevGoals?: Goal[]; prevProjects?: Project[]; prevActions?: Action[] }
  >({
    mutationFn: async (id) => {
      const droppedAt = nowISO();
      // 1. Drop the goal itself.
      const { error: goalErr } = await supabase
        .from("goals")
        .update({ status: "dropped", dropped_at: droppedAt })
        .eq("id", id);
      if (goalErr) throw goalErr;
      // 2. Drop active child projects. DB doesn't cascade status, so a separate
      //    update is required.
      const { error: projErr } = await supabase
        .from("projects")
        .update({ status: "dropped", dropped_at: droppedAt })
        .eq("goal_id", id)
        .eq("status", "active");
      if (projErr) throw projErr;
      // 3. Drop non-terminal child actions. Same rationale.
      const { error: actErr } = await supabase
        .from("actions")
        .update({ status: "dropped", dropped_at: droppedAt })
        .eq("goal_id", id)
        .not("status", "in", `(${TERMINAL_ACTION_STATUSES.map((s) => `"${s}"`).join(",")})`);
      if (actErr) throw actErr;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.goals });
      await queryClient.cancelQueries({ queryKey: queryKeys.projects });
      await queryClient.cancelQueries({ queryKey: queryKeys.actions });
      const prevGoals = queryClient.getQueryData<Goal[]>(queryKeys.goals);
      const prevProjects = queryClient.getQueryData<Project[]>(queryKeys.projects);
      const prevActions = queryClient.getQueryData<Action[]>(queryKeys.actions);
      const at = nowISO();
      queryClient.setQueryData<Goal[]>(queryKeys.goals, (old) =>
        (old ?? []).map((g) =>
          g.id === id ? { ...g, status: "dropped", droppedAt: at } : g,
        ),
      );
      queryClient.setQueryData<Project[]>(queryKeys.projects, (old) =>
        (old ?? []).map((p) =>
          p.goalId === id && p.status === "active"
            ? { ...p, status: "dropped", droppedAt: at }
            : p,
        ),
      );
      queryClient.setQueryData<Action[]>(queryKeys.actions, (old) =>
        (old ?? []).map((a) =>
          a.goalId === id && !TERMINAL_ACTION_STATUSES.includes(a.status)
            ? { ...a, status: "dropped", droppedAt: at }
            : a,
        ),
      );
      return { prevGoals, prevProjects, prevActions };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prevGoals !== undefined) {
        queryClient.setQueryData(queryKeys.goals, ctx.prevGoals);
      }
      if (ctx?.prevProjects !== undefined) {
        queryClient.setQueryData(queryKeys.projects, ctx.prevProjects);
      }
      if (ctx?.prevActions !== undefined) {
        queryClient.setQueryData(queryKeys.actions, ctx.prevActions);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.goals });
      void queryClient.invalidateQueries({ queryKey: queryKeys.projects });
      void queryClient.invalidateQueries({ queryKey: queryKeys.actions });
    },
  });
}

// ────── reopenGoal ──────

export function useReopenGoalMutation() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, ID, { prev?: Goal[] }>({
    mutationFn: async (id) => {
      const { error } = await supabase
        .from("goals")
        .update({ status: "active", completed_at: null, dropped_at: null })
        .eq("id", id);
      if (error) throw error;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.goals });
      const prev = queryClient.getQueryData<Goal[]>(queryKeys.goals);
      queryClient.setQueryData<Goal[]>(queryKeys.goals, (old) =>
        (old ?? []).map((g) =>
          g.id === id
            ? { ...g, status: "active", completedAt: undefined, droppedAt: undefined }
            : g,
        ),
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev !== undefined) queryClient.setQueryData(queryKeys.goals, ctx.prev);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.goals });
    },
  });
}

// ────── deleteGoal (DB CASCADE removes projects, action rows, and their joins) ──────

export function useDeleteGoalMutation() {
  const queryClient = useQueryClient();

  return useMutation<
    void,
    Error,
    ID,
    { prevGoals?: Goal[]; prevProjects?: Project[]; prevActions?: Action[] }
  >({
    mutationFn: async (id) => {
      // DB CASCADE handles: goal_success_criteria, projects (+ project_references),
      // actions (goal_id CASCADE) + action_timeline, and rituals/ideas/day_entries
      // once they migrate.
      const { error } = await supabase.from("goals").delete().eq("id", id);
      if (error) throw error;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.goals });
      await queryClient.cancelQueries({ queryKey: queryKeys.projects });
      await queryClient.cancelQueries({ queryKey: queryKeys.actions });
      const prevGoals = queryClient.getQueryData<Goal[]>(queryKeys.goals);
      const prevProjects = queryClient.getQueryData<Project[]>(queryKeys.projects);
      const prevActions = queryClient.getQueryData<Action[]>(queryKeys.actions);
      queryClient.setQueryData<Goal[]>(queryKeys.goals, (old) =>
        (old ?? []).filter((g) => g.id !== id),
      );
      queryClient.setQueryData<Project[]>(queryKeys.projects, (old) =>
        (old ?? []).filter((p) => p.goalId !== id),
      );
      queryClient.setQueryData<Action[]>(queryKeys.actions, (old) =>
        (old ?? []).filter((a) => a.goalId !== id),
      );
      return { prevGoals, prevProjects, prevActions };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prevGoals !== undefined) {
        queryClient.setQueryData(queryKeys.goals, ctx.prevGoals);
      }
      if (ctx?.prevProjects !== undefined) {
        queryClient.setQueryData(queryKeys.projects, ctx.prevProjects);
      }
      if (ctx?.prevActions !== undefined) {
        queryClient.setQueryData(queryKeys.actions, ctx.prevActions);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.goals });
      void queryClient.invalidateQueries({ queryKey: queryKeys.projects });
      void queryClient.invalidateQueries({ queryKey: queryKeys.actions });
    },
  });
}
