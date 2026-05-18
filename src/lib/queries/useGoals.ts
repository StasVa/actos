// TanStack Query hooks for Goals. Source of truth: Supabase `public.goals` +
// joined `goal_success_criteria`. RLS guarantees per-user scoping server-side;
// the client filters by user.id only for clarity / cache stability.
//
// Mutations follow the standard optimistic pattern: onMutate snapshots and writes
// to cache, onError rolls back via context, onSettled invalidates. Each verb gets
// its own hook (per Decision F) so optimistic UX + error toasts can vary per verb.
//
// Cross-entity cascade (post-Session 2):
//   - useDropGoalMutation cascade-drops child projects (Supabase) + child actions
//     (cache mirror) — non-terminal actions move to status='dropped'. Rituals
//     and ideas stay active (no status='dropped' for those; they remain visible
//     under the dropped goal until archived/discarded). Day entries are unrelated.
//   - useDeleteGoalMutation relies on DB CASCADE: deleting the goal cascades to
//     projects, actions, rituals (+ ritual_completions), ideas (+ refs +
//     attachments), goal_success_criteria. day_entries don't reference goals.
//     The client mirrors all cache slices in onMutate.

import { useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/useAuth";
import { TERMINAL_ACTION_STATUSES } from "@/lib/queries/useActions";
import { useCurrentUserQuery } from "@/lib/queries/useCurrentUser";
import { queryKeys } from "@/lib/queryKeys";
import {
  goalToInsert,
  goalToUpdate,
  rowToGoal,
  type GoalRowWithJoin,
} from "@/lib/rowMappers";
import type {
  Action,
  DayEntry,
  Goal,
  GoalColorVar,
  ID,
  Idea,
  Project,
  Ritual,
} from "@/types";

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
  // Primary tier source. useAuth().user is the fallback if the query hasn't
  // hydrated yet (cold cache, network glitch). On a final null, we treat as
  // free.
  const { data: currentUser } = useCurrentUserQuery();
  // Set by onMutate when the cap is hit, read & reset by mutationFn so the
  // INSERT is short-circuited without re-reading the goals cache (which would
  // include onMutate's optimistic write and double-count the user's own pending
  // goal). onMutate→mutationFn is sequential per mutate() call so a ref is safe.
  const capHitRef = useRef(false);

  return useMutation<CreateGoalResult, Error, CreateGoalPayload, { prev?: Goal[]; tempId?: string }>({
    mutationFn: async (payload) => {
      if (capHitRef.current) {
        capHitRef.current = false;
        return { ok: false, reason: "limit" };
      }
      if (!user) return { ok: false, reason: "not-authenticated" };
      const goals = queryClient.getQueryData<Goal[]>(queryKeys.goals) ?? [];
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
      if (!user) {
        capHitRef.current = false;
        return {};
      }
      const tier = currentUser?.subscriptionTier ?? user?.subscriptionTier;
      if (!tier) {
        // eslint-disable-next-line no-console
        console.warn("Goal limit check: no tier source available, defaulting to free");
      }
      const goals = queryClient.getQueryData<Goal[]>(queryKeys.goals) ?? [];
      const limit = tier === "all-in" ? 3 : 1;
      if (goals.filter((g) => g.status === "active").length >= limit) {
        // At cap — flag for mutationFn to short-circuit, skip optimistic write.
        capHitRef.current = true;
        return {};
      }
      capHitRef.current = false;
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
    {
      prevGoals?: Goal[];
      prevProjects?: Project[];
      prevActions?: Action[];
      prevRituals?: Ritual[];
      prevIdeas?: Idea[];
    }
  >({
    mutationFn: async (id) => {
      // DB CASCADE handles: goal_success_criteria, projects (+ project_references),
      // actions (+ action_timeline), rituals (+ ritual_completions),
      // ideas (+ idea_references, idea_image_attachments). day_entries don't
      // reference goals so they are unaffected.
      const { error } = await supabase.from("goals").delete().eq("id", id);
      if (error) throw error;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.goals });
      await queryClient.cancelQueries({ queryKey: queryKeys.projects });
      await queryClient.cancelQueries({ queryKey: queryKeys.actions });
      await queryClient.cancelQueries({ queryKey: queryKeys.rituals });
      await queryClient.cancelQueries({ queryKey: queryKeys.ideas });
      const prevGoals = queryClient.getQueryData<Goal[]>(queryKeys.goals);
      const prevProjects = queryClient.getQueryData<Project[]>(queryKeys.projects);
      const prevActions = queryClient.getQueryData<Action[]>(queryKeys.actions);
      const prevRituals = queryClient.getQueryData<Ritual[]>(queryKeys.rituals);
      const prevIdeas = queryClient.getQueryData<Idea[]>(queryKeys.ideas);
      queryClient.setQueryData<Goal[]>(queryKeys.goals, (old) =>
        (old ?? []).filter((g) => g.id !== id),
      );
      queryClient.setQueryData<Project[]>(queryKeys.projects, (old) =>
        (old ?? []).filter((p) => p.goalId !== id),
      );
      queryClient.setQueryData<Action[]>(queryKeys.actions, (old) =>
        (old ?? []).filter((a) => a.goalId !== id),
      );
      queryClient.setQueryData<Ritual[]>(queryKeys.rituals, (old) =>
        (old ?? []).filter((r) => r.goalId !== id),
      );
      queryClient.setQueryData<Idea[]>(queryKeys.ideas, (old) =>
        (old ?? []).filter((i) => i.goalId !== id),
      );
      return { prevGoals, prevProjects, prevActions, prevRituals, prevIdeas };
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
      if (ctx?.prevRituals !== undefined) {
        queryClient.setQueryData(queryKeys.rituals, ctx.prevRituals);
      }
      if (ctx?.prevIdeas !== undefined) {
        queryClient.setQueryData(queryKeys.ideas, ctx.prevIdeas);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.goals });
      void queryClient.invalidateQueries({ queryKey: queryKeys.projects });
      void queryClient.invalidateQueries({ queryKey: queryKeys.actions });
      void queryClient.invalidateQueries({ queryKey: queryKeys.rituals });
      void queryClient.invalidateQueries({ queryKey: queryKeys.ideas });
    },
  });
}
