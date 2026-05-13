// TanStack Query hooks for Sessions (focus timer). Source of truth:
// Supabase `public.sessions`. RLS enforces per-user scoping; query filters
// by user.id for cache stability.
//
// Single-in-progress invariant: createDraft checks the cache for any
// status='in_progress' session and refuses if one exists. The DB has no
// such constraint — this is a UX invariant, not a data invariant.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/useAuth";
import { queryKeys } from "@/lib/queryKeys";
import {
  rowToSession,
  sessionPartialToUpdate,
  sessionToInsert,
} from "@/lib/rowMappers";
import type { ID, Session, SessionMode } from "@/types";

function nowISO(): string {
  return new Date().toISOString();
}

// ────── query ──────

export function useSessionsQuery() {
  const { user } = useAuth();
  return useQuery<Session[]>({
    queryKey: queryKeys.sessions,
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("sessions")
        .select("*")
        .eq("user_id", user.id);
      if (error) throw error;
      return data.map(rowToSession).sort((a, b) => a.startedAt.localeCompare(b.startedAt));
    },
    enabled: !!user,
  });
}

// ────── createDraftSession ──────

export interface CreateDraftSessionConfig {
  mode: SessionMode;
  workDuration: number;
  breakDuration: number;
  cyclesPlanned: number;
  plannedActionIds: ID[];
}

export type CreateDraftSessionResult =
  | { ok: true; id: ID }
  | { ok: false; reason: "active-exists" | "not-authenticated" };

export function useCreateDraftSessionMutation() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation<
    CreateDraftSessionResult,
    Error,
    CreateDraftSessionConfig,
    { prev?: Session[]; tempId?: string }
  >({
    mutationFn: async (config) => {
      if (!user) return { ok: false, reason: "not-authenticated" };
      const sessions = queryClient.getQueryData<Session[]>(queryKeys.sessions) ?? [];
      if (sessions.some((s) => s.status === "in_progress")) {
        return { ok: false, reason: "active-exists" };
      }
      const id = crypto.randomUUID();
      const session: Session = {
        id,
        status: "in_progress",
        startedAt: nowISO(),
        endedAt: null,
        mode: config.mode,
        workDuration: config.workDuration,
        breakDuration: config.breakDuration,
        cyclesPlanned: config.cyclesPlanned,
        plannedActionIds: [...config.plannedActionIds],
        completedActionIds: [],
        droppedActionIds: [],
        cyclesCompleted: 0,
      };
      const { error } = await supabase.from("sessions").insert(sessionToInsert(session, user.id));
      if (error) throw error;
      return { ok: true, id };
    },
    onMutate: async (config) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.sessions });
      const prev = queryClient.getQueryData<Session[]>(queryKeys.sessions);
      const sessions = prev ?? [];
      if (sessions.some((s) => s.status === "in_progress")) {
        return { prev };
      }
      const tempId = crypto.randomUUID();
      const optimistic: Session = {
        id: tempId,
        status: "in_progress",
        startedAt: nowISO(),
        endedAt: null,
        mode: config.mode,
        workDuration: config.workDuration,
        breakDuration: config.breakDuration,
        cyclesPlanned: config.cyclesPlanned,
        plannedActionIds: [...config.plannedActionIds],
        completedActionIds: [],
        droppedActionIds: [],
        cyclesCompleted: 0,
      };
      queryClient.setQueryData<Session[]>(queryKeys.sessions, (old) => [
        ...(old ?? []),
        optimistic,
      ]);
      return { prev, tempId };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev !== undefined) queryClient.setQueryData(queryKeys.sessions, ctx.prev);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.sessions });
    },
  });
}

// ────── completeSession / abortSession ──────

function useEndSessionMutation(targetStatus: "completed" | "aborted") {
  const queryClient = useQueryClient();

  return useMutation<void, Error, ID, { prev?: Session[] }>({
    mutationFn: async (id) => {
      const at = nowISO();
      const { error } = await supabase
        .from("sessions")
        .update(sessionPartialToUpdate({ status: targetStatus, endedAt: at }))
        .eq("id", id)
        .eq("status", "in_progress");
      if (error) throw error;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.sessions });
      const prev = queryClient.getQueryData<Session[]>(queryKeys.sessions);
      const at = nowISO();
      queryClient.setQueryData<Session[]>(queryKeys.sessions, (old) =>
        (old ?? []).map((s) =>
          s.id === id && s.status === "in_progress"
            ? { ...s, status: targetStatus, endedAt: at }
            : s,
        ),
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev !== undefined) queryClient.setQueryData(queryKeys.sessions, ctx.prev);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.sessions });
    },
  });
}

export function useCompleteSessionMutation() {
  return useEndSessionMutation("completed");
}

export function useAbortSessionMutation() {
  return useEndSessionMutation("aborted");
}

// ────── addCompletedActionToSession ──────

export interface SessionActionVars {
  sessionId: ID;
  actionId: ID;
}

function useAppendSessionActionMutation(field: "completedActionIds" | "droppedActionIds") {
  const queryClient = useQueryClient();

  return useMutation<void, Error, SessionActionVars, { prev?: Session[] }>({
    mutationFn: async ({ sessionId, actionId }) => {
      const sessions = queryClient.getQueryData<Session[]>(queryKeys.sessions) ?? [];
      const session = sessions.find((s) => s.id === sessionId);
      if (!session || session.status !== "in_progress") return;
      const current = session[field];
      if (current.includes(actionId)) return;
      const next = [...current, actionId];
      const update =
        field === "completedActionIds"
          ? sessionPartialToUpdate({ completedActionIds: next })
          : sessionPartialToUpdate({ droppedActionIds: next });
      const { error } = await supabase
        .from("sessions")
        .update(update)
        .eq("id", sessionId);
      if (error) throw error;
    },
    onMutate: async ({ sessionId, actionId }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.sessions });
      const prev = queryClient.getQueryData<Session[]>(queryKeys.sessions);
      queryClient.setQueryData<Session[]>(queryKeys.sessions, (old) =>
        (old ?? []).map((s) => {
          if (s.id !== sessionId || s.status !== "in_progress") return s;
          const current = s[field];
          if (current.includes(actionId)) return s;
          return { ...s, [field]: [...current, actionId] };
        }),
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev !== undefined) queryClient.setQueryData(queryKeys.sessions, ctx.prev);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.sessions });
    },
  });
}

export function useAddCompletedActionToSessionMutation() {
  return useAppendSessionActionMutation("completedActionIds");
}

export function useAddDroppedActionToSessionMutation() {
  return useAppendSessionActionMutation("droppedActionIds");
}

// ────── addPlannedActionsToSession ──────

export interface AddPlannedActionsVars {
  sessionId: ID;
  actionIds: ID[];
}

export function useAddPlannedActionsToSessionMutation() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, AddPlannedActionsVars, { prev?: Session[] }>({
    mutationFn: async ({ sessionId, actionIds }) => {
      const sessions = queryClient.getQueryData<Session[]>(queryKeys.sessions) ?? [];
      const session = sessions.find((s) => s.id === sessionId);
      if (!session || session.status !== "in_progress") return;
      const existing = new Set(session.plannedActionIds);
      const additions = actionIds.filter((id) => !existing.has(id));
      if (additions.length === 0) return;
      const next = [...session.plannedActionIds, ...additions];
      const { error } = await supabase
        .from("sessions")
        .update(sessionPartialToUpdate({ plannedActionIds: next }))
        .eq("id", sessionId);
      if (error) throw error;
    },
    onMutate: async ({ sessionId, actionIds }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.sessions });
      const prev = queryClient.getQueryData<Session[]>(queryKeys.sessions);
      queryClient.setQueryData<Session[]>(queryKeys.sessions, (old) =>
        (old ?? []).map((s) => {
          if (s.id !== sessionId || s.status !== "in_progress") return s;
          const existing = new Set(s.plannedActionIds);
          const additions = actionIds.filter((id) => !existing.has(id));
          if (additions.length === 0) return s;
          return { ...s, plannedActionIds: [...s.plannedActionIds, ...additions] };
        }),
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev !== undefined) queryClient.setQueryData(queryKeys.sessions, ctx.prev);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.sessions });
    },
  });
}

// ────── incrementSessionCycles ──────

export function useIncrementSessionCyclesMutation() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, ID, { prev?: Session[] }>({
    mutationFn: async (sessionId) => {
      const sessions = queryClient.getQueryData<Session[]>(queryKeys.sessions) ?? [];
      const session = sessions.find((s) => s.id === sessionId);
      if (!session || session.status !== "in_progress") return;
      const { error } = await supabase
        .from("sessions")
        .update(sessionPartialToUpdate({ cyclesCompleted: session.cyclesCompleted + 1 }))
        .eq("id", sessionId);
      if (error) throw error;
    },
    onMutate: async (sessionId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.sessions });
      const prev = queryClient.getQueryData<Session[]>(queryKeys.sessions);
      queryClient.setQueryData<Session[]>(queryKeys.sessions, (old) =>
        (old ?? []).map((s) =>
          s.id === sessionId && s.status === "in_progress"
            ? { ...s, cyclesCompleted: s.cyclesCompleted + 1 }
            : s,
        ),
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev !== undefined) queryClient.setQueryData(queryKeys.sessions, ctx.prev);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.sessions });
    },
  });
}

// ────── setSessionReflection ──────

export interface SetSessionReflectionVars {
  sessionId: ID;
  reflection: string;
}

export function useSetSessionReflectionMutation() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, SetSessionReflectionVars, { prev?: Session[] }>({
    mutationFn: async ({ sessionId, reflection }) => {
      const { error } = await supabase
        .from("sessions")
        .update(sessionPartialToUpdate({ reflection }))
        .eq("id", sessionId);
      if (error) throw error;
    },
    onMutate: async ({ sessionId, reflection }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.sessions });
      const prev = queryClient.getQueryData<Session[]>(queryKeys.sessions);
      queryClient.setQueryData<Session[]>(queryKeys.sessions, (old) =>
        (old ?? []).map((s) => (s.id === sessionId ? { ...s, reflection } : s)),
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev !== undefined) queryClient.setQueryData(queryKeys.sessions, ctx.prev);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.sessions });
    },
  });
}

// ────── deleteSession ──────

export function useDeleteSessionMutation() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, ID, { prev?: Session[] }>({
    mutationFn: async (id) => {
      const { error } = await supabase.from("sessions").delete().eq("id", id);
      if (error) throw error;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.sessions });
      const prev = queryClient.getQueryData<Session[]>(queryKeys.sessions);
      queryClient.setQueryData<Session[]>(queryKeys.sessions, (old) =>
        (old ?? []).filter((s) => s.id !== id),
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev !== undefined) queryClient.setQueryData(queryKeys.sessions, ctx.prev);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.sessions });
    },
  });
}
