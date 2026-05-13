// TanStack Query hooks for Projects. Source of truth: Supabase `public.projects`
// joined with `project_references`. RLS enforces per-user scoping; query filter
// by user.id is for cache stability.
//
// Each mutation owns its optimistic update (Decision F). Cross-entity cascade:
//   - useDropProjectMutation cascade-drops non-terminal child actions (Supabase
//     status update + TanStack cache write). Rituals stay active — they survive
//     a dropped project and become goal-level if the project is later deleted.
//   - useDeleteProjectMutation: DB ON DELETE SET NULL orphans child actions
//     AND child rituals to goal-level (their project_id becomes null). Cache
//     mirrors this.
//   - useMoveProjectToGoalMutation cascades goalId on child actions (Supabase
//     update + cache write). Rituals don't follow — they're attached to the
//     original goal/project and stay there.
//   - All rollback action cache via prevActions snapshot in onError.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/useAuth";
import { TERMINAL_ACTION_STATUSES } from "@/lib/queries/useActions";
import { queryKeys } from "@/lib/queryKeys";
import {
  projectToInsert,
  projectToUpdate,
  rowToProject,
  type ProjectRowWithJoin,
} from "@/lib/rowMappers";
import type { Action, ID, Project, Ritual } from "@/types";

function nowISO(): string {
  return new Date().toISOString();
}

// ────── query ──────

export function useProjectsQuery() {
  const { user } = useAuth();
  return useQuery<Project[]>({
    queryKey: queryKeys.projects,
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("projects")
        .select("*, project_references(*)")
        .eq("user_id", user.id);
      if (error) throw error;
      return (data as ProjectRowWithJoin[])
        .map(rowToProject)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    },
    enabled: !!user,
  });
}

// ────── createProject ──────

export type CreateProjectPayload = Pick<Project, "title" | "goalId"> & Partial<Project>;

export function useCreateProjectMutation() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation<
    { id: ID },
    Error,
    CreateProjectPayload,
    { prev?: Project[]; tempId?: string }
  >({
    mutationFn: async (payload) => {
      if (!user) throw new Error("Not authenticated");
      const { row, references } = projectToInsert(payload, user.id);
      const { data: inserted, error: insertErr } = await supabase
        .from("projects")
        .insert(row)
        .select("*, project_references(*)")
        .single();
      if (insertErr || !inserted) throw insertErr ?? new Error("Project insert failed");
      if (references.length > 0) {
        const { error: refErr } = await supabase
          .from("project_references")
          .insert(references.map((r) => ({ ...r, project_id: inserted.id })));
        if (refErr) throw refErr;
      }
      return { id: inserted.id };
    },
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.projects });
      const prev = queryClient.getQueryData<Project[]>(queryKeys.projects);
      const tempId = crypto.randomUUID();
      const optimistic: Project = {
        id: tempId,
        goalId: payload.goalId,
        title: payload.title,
        status: payload.status ?? "active",
        description: payload.description,
        references: (payload.references ?? []).map((r) => ({
          id: crypto.randomUUID(),
          url: r.url,
          title: r.title,
        })),
        createdAt: nowISO(),
        isDraft: payload.isDraft ?? false,
        isSample: payload.isSample,
      };
      queryClient.setQueryData<Project[]>(queryKeys.projects, (old) => [
        ...(old ?? []),
        optimistic,
      ]);
      return { prev, tempId };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev !== undefined) queryClient.setQueryData(queryKeys.projects, ctx.prev);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.projects });
    },
  });
}

// ────── updateProject ──────

export interface UpdateProjectVars {
  id: ID;
  partial: Partial<Project>;
}

export function useUpdateProjectMutation() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, UpdateProjectVars, { prev?: Project[] }>({
    mutationFn: async ({ id, partial }) => {
      const { row, references } = projectToUpdate(partial);
      if (Object.keys(row).length > 0) {
        const { error } = await supabase.from("projects").update(row).eq("id", id);
        if (error) throw error;
      }
      if (references !== undefined) {
        // Replace strategy: delete-all-then-reinsert.
        const { error: delErr } = await supabase
          .from("project_references")
          .delete()
          .eq("project_id", id);
        if (delErr) throw delErr;
        if (references.length > 0) {
          const { error: insErr } = await supabase
            .from("project_references")
            .insert(references.map((r) => ({ ...r, project_id: id })));
          if (insErr) throw insErr;
        }
      }
    },
    onMutate: async ({ id, partial }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.projects });
      const prev = queryClient.getQueryData<Project[]>(queryKeys.projects);
      queryClient.setQueryData<Project[]>(queryKeys.projects, (old) =>
        (old ?? []).map((p) =>
          p.id === id ? { ...p, ...partial, updatedAt: nowISO() } : p,
        ),
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev !== undefined) queryClient.setQueryData(queryKeys.projects, ctx.prev);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.projects });
    },
  });
}

// ────── markProjectComplete ──────

export function useMarkProjectCompleteMutation() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, ID, { prev?: Project[] }>({
    mutationFn: async (id) => {
      const { error } = await supabase
        .from("projects")
        .update({ status: "completed", completed_at: nowISO() })
        .eq("id", id);
      if (error) throw error;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.projects });
      const prev = queryClient.getQueryData<Project[]>(queryKeys.projects);
      const at = nowISO();
      queryClient.setQueryData<Project[]>(queryKeys.projects, (old) =>
        (old ?? []).map((p) =>
          p.id === id ? { ...p, status: "completed", completedAt: at } : p,
        ),
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev !== undefined) queryClient.setQueryData(queryKeys.projects, ctx.prev);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.projects });
    },
  });
}

// ────── dropProject (Supabase project status update + action cascade) ──────

export function useDropProjectMutation() {
  const queryClient = useQueryClient();

  return useMutation<
    void,
    Error,
    ID,
    { prevProjects?: Project[]; prevActions?: Action[] }
  >({
    mutationFn: async (id) => {
      const droppedAt = nowISO();
      const { error: projErr } = await supabase
        .from("projects")
        .update({ status: "dropped", dropped_at: droppedAt })
        .eq("id", id);
      if (projErr) throw projErr;
      // Cascade non-terminal child actions to dropped.
      const { error: actErr } = await supabase
        .from("actions")
        .update({ status: "dropped", dropped_at: droppedAt })
        .eq("project_id", id)
        .not("status", "in", `(${TERMINAL_ACTION_STATUSES.map((s) => `"${s}"`).join(",")})`);
      if (actErr) throw actErr;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.projects });
      await queryClient.cancelQueries({ queryKey: queryKeys.actions });
      const prevProjects = queryClient.getQueryData<Project[]>(queryKeys.projects);
      const prevActions = queryClient.getQueryData<Action[]>(queryKeys.actions);
      const at = nowISO();
      queryClient.setQueryData<Project[]>(queryKeys.projects, (old) =>
        (old ?? []).map((p) =>
          p.id === id ? { ...p, status: "dropped", droppedAt: at } : p,
        ),
      );
      queryClient.setQueryData<Action[]>(queryKeys.actions, (old) =>
        (old ?? []).map((a) =>
          a.projectId === id && !TERMINAL_ACTION_STATUSES.includes(a.status)
            ? { ...a, status: "dropped", droppedAt: at }
            : a,
        ),
      );
      return { prevProjects, prevActions };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prevProjects !== undefined) {
        queryClient.setQueryData(queryKeys.projects, ctx.prevProjects);
      }
      if (ctx?.prevActions !== undefined) {
        queryClient.setQueryData(queryKeys.actions, ctx.prevActions);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.projects });
      void queryClient.invalidateQueries({ queryKey: queryKeys.actions });
    },
  });
}

// ────── reopenProject ──────

export function useReopenProjectMutation() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, ID, { prev?: Project[] }>({
    mutationFn: async (id) => {
      const { error } = await supabase
        .from("projects")
        .update({ status: "active", completed_at: null, dropped_at: null })
        .eq("id", id);
      if (error) throw error;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.projects });
      const prev = queryClient.getQueryData<Project[]>(queryKeys.projects);
      queryClient.setQueryData<Project[]>(queryKeys.projects, (old) =>
        (old ?? []).map((p) =>
          p.id === id
            ? { ...p, status: "active", completedAt: undefined, droppedAt: undefined }
            : p,
        ),
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev !== undefined) queryClient.setQueryData(queryKeys.projects, ctx.prev);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.projects });
    },
  });
}

// ────── deleteProject (DB SET NULL orphans actions to goal-level) ──────

export function useDeleteProjectMutation() {
  const queryClient = useQueryClient();

  return useMutation<
    void,
    Error,
    ID,
    { prevProjects?: Project[]; prevActions?: Action[]; prevRituals?: Ritual[] }
  >({
    mutationFn: async (id) => {
      // DB schema: project_references CASCADE; actions.project_id SET NULL
      // (Decision B1 — orphan to goal-level rather than delete actions);
      // rituals.project_id SET NULL (same — orphan to goal-level).
      const { error } = await supabase.from("projects").delete().eq("id", id);
      if (error) throw error;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.projects });
      await queryClient.cancelQueries({ queryKey: queryKeys.actions });
      await queryClient.cancelQueries({ queryKey: queryKeys.rituals });
      const prevProjects = queryClient.getQueryData<Project[]>(queryKeys.projects);
      const prevActions = queryClient.getQueryData<Action[]>(queryKeys.actions);
      const prevRituals = queryClient.getQueryData<Ritual[]>(queryKeys.rituals);
      queryClient.setQueryData<Project[]>(queryKeys.projects, (old) =>
        (old ?? []).filter((p) => p.id !== id),
      );
      queryClient.setQueryData<Action[]>(queryKeys.actions, (old) =>
        (old ?? []).map((a) =>
          a.projectId === id ? { ...a, projectId: null } : a,
        ),
      );
      queryClient.setQueryData<Ritual[]>(queryKeys.rituals, (old) =>
        (old ?? []).map((r) =>
          r.projectId === id ? { ...r, projectId: null } : r,
        ),
      );
      return { prevProjects, prevActions, prevRituals };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prevProjects !== undefined) {
        queryClient.setQueryData(queryKeys.projects, ctx.prevProjects);
      }
      if (ctx?.prevActions !== undefined) {
        queryClient.setQueryData(queryKeys.actions, ctx.prevActions);
      }
      if (ctx?.prevRituals !== undefined) {
        queryClient.setQueryData(queryKeys.rituals, ctx.prevRituals);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.projects });
      void queryClient.invalidateQueries({ queryKey: queryKeys.actions });
      void queryClient.invalidateQueries({ queryKey: queryKeys.rituals });
    },
  });
}

// ────── moveProjectToGoal (cascades goalId on child actions via Supabase) ──────

export interface MoveProjectToGoalVars {
  projectId: ID;
  newGoalId: ID;
}

export function useMoveProjectToGoalMutation() {
  const queryClient = useQueryClient();

  return useMutation<
    void,
    Error,
    MoveProjectToGoalVars,
    { prevProjects?: Project[]; prevActions?: Action[] }
  >({
    mutationFn: async ({ projectId, newGoalId }) => {
      const { error: projErr } = await supabase
        .from("projects")
        .update({ goal_id: newGoalId })
        .eq("id", projectId);
      if (projErr) throw projErr;
      const { error: actErr } = await supabase
        .from("actions")
        .update({ goal_id: newGoalId })
        .eq("project_id", projectId);
      if (actErr) throw actErr;
    },
    onMutate: async ({ projectId, newGoalId }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.projects });
      await queryClient.cancelQueries({ queryKey: queryKeys.actions });
      const prevProjects = queryClient.getQueryData<Project[]>(queryKeys.projects);
      const prevActions = queryClient.getQueryData<Action[]>(queryKeys.actions);
      queryClient.setQueryData<Project[]>(queryKeys.projects, (old) =>
        (old ?? []).map((p) =>
          p.id === projectId ? { ...p, goalId: newGoalId, updatedAt: nowISO() } : p,
        ),
      );
      queryClient.setQueryData<Action[]>(queryKeys.actions, (old) =>
        (old ?? []).map((a) =>
          a.projectId === projectId ? { ...a, goalId: newGoalId } : a,
        ),
      );
      return { prevProjects, prevActions };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prevProjects !== undefined) {
        queryClient.setQueryData(queryKeys.projects, ctx.prevProjects);
      }
      if (ctx?.prevActions !== undefined) {
        queryClient.setQueryData(queryKeys.actions, ctx.prevActions);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.projects });
      void queryClient.invalidateQueries({ queryKey: queryKeys.actions });
    },
  });
}
