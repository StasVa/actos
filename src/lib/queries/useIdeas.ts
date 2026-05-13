// TanStack Query hooks for Ideas. Source of truth: Supabase `public.ideas`
// joined with `idea_references` and `idea_image_attachments`. RLS enforces
// per-user scoping; query filters by user.id for cache stability.
//
// Idea conversion (idea → action, idea → project) uses Postgres RPCs
// (convert_idea_to_action, convert_idea_to_project) so the new-entity insert
// and the idea status update happen in a single transaction. This closes the
// cross-store atomicity gap that was P1 #2 tech debt.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/useAuth";
import { queryKeys } from "@/lib/queryKeys";
import {
  ideaToInsert,
  ideaToUpdate,
  rowToIdea,
  type IdeaRowWithJoin,
} from "@/lib/rowMappers";
import type { Action, ID, Idea, Project } from "@/types";

function nowISO(): string {
  return new Date().toISOString();
}

// ────── query ──────

export function useIdeasQuery() {
  const { user } = useAuth();
  return useQuery<Idea[]>({
    queryKey: queryKeys.ideas,
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("ideas")
        .select("*, idea_references(*), idea_image_attachments(*)")
        .eq("user_id", user.id);
      if (error) throw error;
      return (data as IdeaRowWithJoin[])
        .map(rowToIdea)
        .sort((a, b) => b.capturedAt.localeCompare(a.capturedAt));
    },
    enabled: !!user,
  });
}

// ────── captureIdea ──────

export type CaptureIdeaPayload = Pick<Idea, "title" | "goalId"> & Partial<Idea>;

export function useCaptureIdeaMutation() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation<
    { id: ID },
    Error,
    CaptureIdeaPayload,
    { prev?: Idea[]; tempId?: string }
  >({
    mutationFn: async (payload) => {
      if (!user) throw new Error("Not authenticated");
      const { row, references, images } = ideaToInsert(payload, user.id);
      const { data: inserted, error: insertErr } = await supabase
        .from("ideas")
        .insert(row)
        .select("*, idea_references(*), idea_image_attachments(*)")
        .single();
      if (insertErr || !inserted) throw insertErr ?? new Error("Idea insert failed");
      if (references.length > 0) {
        const { error: refErr } = await supabase
          .from("idea_references")
          .insert(references.map((r) => ({ ...r, idea_id: inserted.id })));
        if (refErr) throw refErr;
      }
      if (images.length > 0) {
        const { error: imgErr } = await supabase
          .from("idea_image_attachments")
          .insert(images.map((a) => ({ ...a, idea_id: inserted.id })));
        if (imgErr) throw imgErr;
      }
      return { id: inserted.id };
    },
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.ideas });
      const prev = queryClient.getQueryData<Idea[]>(queryKeys.ideas);
      const tempId = crypto.randomUUID();
      const optimistic: Idea = {
        id: tempId,
        goalId: payload.goalId,
        title: payload.title,
        note: payload.note,
        references: (payload.references ?? []).map((r) => ({
          id: crypto.randomUUID(),
          url: r.url,
          title: r.title,
        })),
        imageAttachments: (payload.imageAttachments ?? []).map((a) => ({
          id: crypto.randomUUID(),
          dataUrl: a.dataUrl,
          caption: a.caption,
        })),
        status: "captured",
        capturedAt: nowISO(),
        isSample: payload.isSample,
      };
      queryClient.setQueryData<Idea[]>(queryKeys.ideas, (old) => [
        optimistic,
        ...(old ?? []),
      ]);
      return { prev, tempId };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev !== undefined) queryClient.setQueryData(queryKeys.ideas, ctx.prev);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.ideas });
    },
  });
}

// ────── updateIdea ──────

export interface UpdateIdeaVars {
  id: ID;
  partial: Partial<Idea>;
}

export function useUpdateIdeaMutation() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, UpdateIdeaVars, { prev?: Idea[] }>({
    mutationFn: async ({ id, partial }) => {
      const { row, references, images } = ideaToUpdate(partial);
      if (Object.keys(row).length > 0) {
        const { error } = await supabase.from("ideas").update(row).eq("id", id);
        if (error) throw error;
      }
      if (references !== undefined) {
        const { error: delErr } = await supabase
          .from("idea_references")
          .delete()
          .eq("idea_id", id);
        if (delErr) throw delErr;
        if (references.length > 0) {
          const { error: insErr } = await supabase
            .from("idea_references")
            .insert(references.map((r) => ({ ...r, idea_id: id })));
          if (insErr) throw insErr;
        }
      }
      if (images !== undefined) {
        const { error: delErr } = await supabase
          .from("idea_image_attachments")
          .delete()
          .eq("idea_id", id);
        if (delErr) throw delErr;
        if (images.length > 0) {
          const { error: insErr } = await supabase
            .from("idea_image_attachments")
            .insert(images.map((a) => ({ ...a, idea_id: id })));
          if (insErr) throw insErr;
        }
      }
    },
    onMutate: async ({ id, partial }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.ideas });
      const prev = queryClient.getQueryData<Idea[]>(queryKeys.ideas);
      queryClient.setQueryData<Idea[]>(queryKeys.ideas, (old) =>
        (old ?? []).map((i) => (i.id === id ? { ...i, ...partial } : i)),
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev !== undefined) queryClient.setQueryData(queryKeys.ideas, ctx.prev);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.ideas });
    },
  });
}

// ────── convertIdeaToAction (RPC — atomic) ──────

export type ConvertIdeaToActionPayload = {
  ideaId: ID;
  // impact defaults to 1 inside the RPC if omitted, matching the prior convert
  // flow that didn't gather an impact value at conversion time.
  action: Pick<Action, "title" | "goalId"> & Partial<Action>;
};

export function useConvertIdeaToActionMutation() {
  const queryClient = useQueryClient();

  return useMutation<
    { actionId: ID },
    Error,
    ConvertIdeaToActionPayload,
    { prevIdeas?: Idea[]; prevActions?: Action[] }
  >({
    mutationFn: async ({ ideaId, action }) => {
      const payload = {
        goal_id: action.goalId,
        project_id: action.projectId ?? null,
        title: action.title,
        status: action.status ?? "backlog",
        scheduled_date: action.scheduledDate ?? null,
        notes: action.notes ?? null,
        impact: action.impact ?? 1,
        time_estimate_minutes: action.timeEstimateMinutes ?? null,
        delegate_name: action.delegateName ?? null,
        delegate_note: action.delegateNote ?? null,
        expected_return_date: action.expectedReturnDate ?? null,
        is_sample: action.isSample ?? false,
        timeline_text: "Converted from idea",
      };
      const { data, error } = await supabase.rpc("convert_idea_to_action", {
        p_idea_id: ideaId,
        p_action_payload: payload,
      });
      if (error) throw error;
      return { actionId: data as unknown as ID };
    },
    onMutate: async ({ ideaId, action }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.ideas });
      await queryClient.cancelQueries({ queryKey: queryKeys.actions });
      const prevIdeas = queryClient.getQueryData<Idea[]>(queryKeys.ideas);
      const prevActions = queryClient.getQueryData<Action[]>(queryKeys.actions);
      const tempActionId = crypto.randomUUID();
      const at = nowISO();
      queryClient.setQueryData<Idea[]>(queryKeys.ideas, (old) =>
        (old ?? []).map((i) =>
          i.id === ideaId
            ? { ...i, status: "converted_to_action", convertedToId: tempActionId }
            : i,
        ),
      );
      queryClient.setQueryData<Action[]>(queryKeys.actions, (old) => [
        ...(old ?? []),
        {
          id: tempActionId,
          title: action.title,
          goalId: action.goalId,
          projectId: action.projectId ?? null,
          status: action.status ?? "backlog",
          scheduledDate: action.scheduledDate,
          notes: action.notes,
          impact: action.impact ?? 1,
          timeEstimateMinutes: action.timeEstimateMinutes,
          delegateName: action.delegateName,
          delegateNote: action.delegateNote,
          expectedReturnDate: action.expectedReturnDate,
          timeline: [{ at, text: "Converted from idea" }],
          createdAt: at,
          isSample: action.isSample,
        },
      ]);
      return { prevIdeas, prevActions };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prevIdeas !== undefined) {
        queryClient.setQueryData(queryKeys.ideas, ctx.prevIdeas);
      }
      if (ctx?.prevActions !== undefined) {
        queryClient.setQueryData(queryKeys.actions, ctx.prevActions);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.ideas });
      void queryClient.invalidateQueries({ queryKey: queryKeys.actions });
    },
  });
}

// ────── convertIdeaToProject (RPC — atomic) ──────

export type ConvertIdeaToProjectPayload = {
  ideaId: ID;
  project: Pick<Project, "title" | "goalId"> & Partial<Project>;
};

export function useConvertIdeaToProjectMutation() {
  const queryClient = useQueryClient();

  return useMutation<
    { projectId: ID },
    Error,
    ConvertIdeaToProjectPayload,
    { prevIdeas?: Idea[]; prevProjects?: Project[] }
  >({
    mutationFn: async ({ ideaId, project }) => {
      const payload = {
        goal_id: project.goalId,
        title: project.title,
        status: project.status ?? "active",
        description:
          project.description !== undefined ? JSON.stringify(project.description) : null,
        is_draft: project.isDraft ?? false,
        is_sample: project.isSample ?? false,
      };
      const { data, error } = await supabase.rpc("convert_idea_to_project", {
        p_idea_id: ideaId,
        p_project_payload: payload,
      });
      if (error) throw error;
      return { projectId: data as unknown as ID };
    },
    onMutate: async ({ ideaId, project }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.ideas });
      await queryClient.cancelQueries({ queryKey: queryKeys.projects });
      const prevIdeas = queryClient.getQueryData<Idea[]>(queryKeys.ideas);
      const prevProjects = queryClient.getQueryData<Project[]>(queryKeys.projects);
      const tempProjectId = crypto.randomUUID();
      queryClient.setQueryData<Idea[]>(queryKeys.ideas, (old) =>
        (old ?? []).map((i) =>
          i.id === ideaId
            ? { ...i, status: "converted_to_project", convertedToId: tempProjectId }
            : i,
        ),
      );
      queryClient.setQueryData<Project[]>(queryKeys.projects, (old) => [
        ...(old ?? []),
        {
          id: tempProjectId,
          goalId: project.goalId,
          title: project.title,
          status: project.status ?? "active",
          description: project.description,
          references: [],
          createdAt: nowISO(),
          isDraft: project.isDraft ?? false,
          isSample: project.isSample,
        },
      ]);
      return { prevIdeas, prevProjects };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prevIdeas !== undefined) {
        queryClient.setQueryData(queryKeys.ideas, ctx.prevIdeas);
      }
      if (ctx?.prevProjects !== undefined) {
        queryClient.setQueryData(queryKeys.projects, ctx.prevProjects);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.ideas });
      void queryClient.invalidateQueries({ queryKey: queryKeys.projects });
    },
  });
}

// ────── discardIdea (soft delete: status='discarded') ──────

export function useDiscardIdeaMutation() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, ID, { prev?: Idea[] }>({
    mutationFn: async (id) => {
      const { error } = await supabase
        .from("ideas")
        .update({ status: "discarded", discarded_at: nowISO() })
        .eq("id", id);
      if (error) throw error;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.ideas });
      const prev = queryClient.getQueryData<Idea[]>(queryKeys.ideas);
      const at = nowISO();
      queryClient.setQueryData<Idea[]>(queryKeys.ideas, (old) =>
        (old ?? []).map((i) =>
          i.id === id ? { ...i, status: "discarded", discardedAt: at } : i,
        ),
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev !== undefined) queryClient.setQueryData(queryKeys.ideas, ctx.prev);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.ideas });
    },
  });
}

// ────── moveIdeaToGoal ──────

export interface MoveIdeaToGoalVars {
  ideaId: ID;
  newGoalId: ID;
}

export function useMoveIdeaToGoalMutation() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, MoveIdeaToGoalVars, { prev?: Idea[] }>({
    mutationFn: async ({ ideaId, newGoalId }) => {
      const { error } = await supabase
        .from("ideas")
        .update({ goal_id: newGoalId })
        .eq("id", ideaId);
      if (error) throw error;
    },
    onMutate: async ({ ideaId, newGoalId }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.ideas });
      const prev = queryClient.getQueryData<Idea[]>(queryKeys.ideas);
      queryClient.setQueryData<Idea[]>(queryKeys.ideas, (old) =>
        (old ?? []).map((i) => (i.id === ideaId ? { ...i, goalId: newGoalId } : i)),
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev !== undefined) queryClient.setQueryData(queryKeys.ideas, ctx.prev);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.ideas });
    },
  });
}
