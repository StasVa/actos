// TanStack Query hooks for Rituals. Source of truth: Supabase `public.rituals`
// joined with `ritual_completions`. RLS enforces per-user scoping; query
// filters by user.id for cache stability.
//
// totalCompletions is DERIVED at the mapper boundary (count of status='done'
// in joined completion rows), not stored. Every state change is therefore a
// single DB write — no insert-then-increment gap, no Postgres function needed.
//
// markRitualInstanceDone / skipRitualInstance use UPSERT on (ritual_id, date)
// so repeated calls for the same date replace the prior entry. unskip is a
// targeted DELETE on the specific (date, status='skipped') row.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/useAuth";
import { queryKeys } from "@/lib/queryKeys";
import {
  ritualToInsert,
  ritualToUpdate,
  rowToRitual,
  type RitualRowWithJoin,
} from "@/lib/rowMappers";
import type { ID, ISODate, Ritual } from "@/types";

function nowISO(): string {
  return new Date().toISOString();
}

function todayISO(): ISODate {
  return new Date().toISOString().slice(0, 10);
}

// Cache helpers — apply a completion-history mutation optimistically.
function applyMarkDone(ritual: Ritual, date: ISODate, at: string): Ritual {
  const filtered = ritual.completionHistory.filter((c) => c.date !== date);
  const next = [...filtered, { date, at, status: "done" as const }];
  return {
    ...ritual,
    completionHistory: next,
    totalCompletions: next.filter((c) => c.status === "done").length,
  };
}

function applySkip(ritual: Ritual, date: ISODate, at: string): Ritual {
  const filtered = ritual.completionHistory.filter((c) => c.date !== date);
  const next = [...filtered, { date, at, status: "skipped" as const }];
  return {
    ...ritual,
    completionHistory: next,
    totalCompletions: next.filter((c) => c.status === "done").length,
  };
}

function applyUnskip(ritual: Ritual, date: ISODate): Ritual {
  const next = ritual.completionHistory.filter(
    (c) => !(c.date === date && c.status === "skipped"),
  );
  return {
    ...ritual,
    completionHistory: next,
    totalCompletions: next.filter((c) => c.status === "done").length,
  };
}

// ────── query ──────

export function useRitualsQuery() {
  const { user } = useAuth();
  return useQuery<Ritual[]>({
    queryKey: queryKeys.rituals,
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("rituals")
        .select("*, ritual_completions(*)")
        .eq("user_id", user.id);
      if (error) throw error;
      return (data as RitualRowWithJoin[])
        .map(rowToRitual)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    },
    enabled: !!user,
  });
}

// ────── createRitual ──────

export type CreateRitualPayload = Pick<Ritual, "title" | "schedule" | "goalId"> &
  Partial<Ritual>;

export function useCreateRitualMutation() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation<
    { id: ID },
    Error,
    CreateRitualPayload,
    { prev?: Ritual[]; tempId?: string }
  >({
    mutationFn: async (payload) => {
      if (!user) throw new Error("Not authenticated");
      const { row, completions } = ritualToInsert(payload, user.id);
      const { data: inserted, error: insertErr } = await supabase
        .from("rituals")
        .insert(row)
        .select("*, ritual_completions(*)")
        .single();
      if (insertErr || !inserted) throw insertErr ?? new Error("Ritual insert failed");
      if (completions.length > 0) {
        const { error: cErr } = await supabase
          .from("ritual_completions")
          .insert(completions.map((c) => ({ ...c, ritual_id: inserted.id })));
        if (cErr) throw cErr;
      }
      return { id: inserted.id };
    },
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.rituals });
      const prev = queryClient.getQueryData<Ritual[]>(queryKeys.rituals);
      const tempId = crypto.randomUUID();
      const completionHistory = payload.completionHistory ?? [];
      const optimistic: Ritual = {
        id: tempId,
        goalId: payload.goalId,
        projectId: payload.projectId ?? null,
        title: payload.title,
        schedule: payload.schedule,
        scheduleConfig: payload.scheduleConfig,
        baseImpact: payload.baseImpact ?? 5,
        notes: payload.notes,
        timeEstimateMinutes: payload.timeEstimateMinutes,
        totalCompletions: completionHistory.filter((c) => c.status === "done").length,
        completionHistory,
        status: payload.status ?? "active",
        createdAt: nowISO(),
        isSample: payload.isSample,
      };
      queryClient.setQueryData<Ritual[]>(queryKeys.rituals, (old) => [
        ...(old ?? []),
        optimistic,
      ]);
      return { prev, tempId };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev !== undefined) queryClient.setQueryData(queryKeys.rituals, ctx.prev);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.rituals });
    },
  });
}

// ────── updateRitual (general edit) ──────

export interface UpdateRitualVars {
  id: ID;
  partial: Partial<Ritual>;
}

export function useUpdateRitualMutation() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, UpdateRitualVars, { prev?: Ritual[] }>({
    mutationFn: async ({ id, partial }) => {
      const { row } = ritualToUpdate(partial);
      if (Object.keys(row).length === 0) return;
      const { error } = await supabase.from("rituals").update(row).eq("id", id);
      if (error) throw error;
    },
    onMutate: async ({ id, partial }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.rituals });
      const prev = queryClient.getQueryData<Ritual[]>(queryKeys.rituals);
      queryClient.setQueryData<Ritual[]>(queryKeys.rituals, (old) =>
        (old ?? []).map((r) => (r.id === id ? { ...r, ...partial } : r)),
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev !== undefined) queryClient.setQueryData(queryKeys.rituals, ctx.prev);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.rituals });
    },
  });
}

// ────── markRitualInstanceDone ──────

export interface RitualInstanceVars {
  ritualId: ID;
  date?: ISODate;
}

export function useMarkRitualInstanceDoneMutation() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, RitualInstanceVars, { prev?: Ritual[] }>({
    mutationFn: async ({ ritualId, date }) => {
      const day = date ?? todayISO();
      const at = nowISO();
      const { error } = await supabase
        .from("ritual_completions")
        .upsert(
          {
            id: crypto.randomUUID(),
            ritual_id: ritualId,
            date: day,
            at,
            status: "done",
          },
          { onConflict: "ritual_id,date" },
        );
      if (error) throw error;
    },
    onMutate: async ({ ritualId, date }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.rituals });
      const prev = queryClient.getQueryData<Ritual[]>(queryKeys.rituals);
      const day = date ?? todayISO();
      const at = nowISO();
      queryClient.setQueryData<Ritual[]>(queryKeys.rituals, (old) =>
        (old ?? []).map((r) => (r.id === ritualId ? applyMarkDone(r, day, at) : r)),
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev !== undefined) queryClient.setQueryData(queryKeys.rituals, ctx.prev);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.rituals });
    },
  });
}

// ────── skipRitualInstance ──────

export function useSkipRitualInstanceMutation() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, RitualInstanceVars, { prev?: Ritual[] }>({
    mutationFn: async ({ ritualId, date }) => {
      const day = date ?? todayISO();
      const at = nowISO();
      const { error } = await supabase
        .from("ritual_completions")
        .upsert(
          {
            id: crypto.randomUUID(),
            ritual_id: ritualId,
            date: day,
            at,
            status: "skipped",
          },
          { onConflict: "ritual_id,date" },
        );
      if (error) throw error;
    },
    onMutate: async ({ ritualId, date }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.rituals });
      const prev = queryClient.getQueryData<Ritual[]>(queryKeys.rituals);
      const day = date ?? todayISO();
      const at = nowISO();
      queryClient.setQueryData<Ritual[]>(queryKeys.rituals, (old) =>
        (old ?? []).map((r) => (r.id === ritualId ? applySkip(r, day, at) : r)),
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev !== undefined) queryClient.setQueryData(queryKeys.rituals, ctx.prev);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.rituals });
    },
  });
}

// ────── reopenRitualInstance (removes a 'done' entry for that date) ──────
// Inverse of markRitualInstanceDone. Used by the Today page "undo done" affordance.

export function useReopenRitualInstanceMutation() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, RitualInstanceVars, { prev?: Ritual[] }>({
    mutationFn: async ({ ritualId, date }) => {
      const day = date ?? todayISO();
      const { error } = await supabase
        .from("ritual_completions")
        .delete()
        .eq("ritual_id", ritualId)
        .eq("date", day)
        .eq("status", "done");
      if (error) throw error;
    },
    onMutate: async ({ ritualId, date }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.rituals });
      const prev = queryClient.getQueryData<Ritual[]>(queryKeys.rituals);
      const day = date ?? todayISO();
      queryClient.setQueryData<Ritual[]>(queryKeys.rituals, (old) =>
        (old ?? []).map((r) => {
          if (r.id !== ritualId) return r;
          const next = r.completionHistory.filter(
            (c) => !(c.date === day && c.status === "done"),
          );
          return {
            ...r,
            completionHistory: next,
            totalCompletions: next.filter((c) => c.status === "done").length,
          };
        }),
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev !== undefined) queryClient.setQueryData(queryKeys.rituals, ctx.prev);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.rituals });
    },
  });
}

// ────── markRitualInstanceMissed (inserts a 'missed' entry only if no row exists) ──────
// Called by the day-rollover sweep when a planned ritual wasn't completed.

export function useMarkRitualInstanceMissedMutation() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { ritualId: ID; date: ISODate; at?: string }, { prev?: Ritual[] }>({
    mutationFn: async ({ ritualId, date, at }) => {
      // Check cache for existing entry — only insert if none.
      const rituals = queryClient.getQueryData<Ritual[]>(queryKeys.rituals) ?? [];
      const r = rituals.find((x) => x.id === ritualId);
      if (r?.completionHistory.some((c) => c.date === date)) return;
      const { error } = await supabase
        .from("ritual_completions")
        .insert({
          id: crypto.randomUUID(),
          ritual_id: ritualId,
          date,
          at: at ?? nowISO(),
          status: "missed",
        });
      // Ignore unique-constraint conflicts (race with another sweep).
      if (error && !String(error.message).toLowerCase().includes("duplicate")) {
        throw error;
      }
    },
    onMutate: async ({ ritualId, date, at }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.rituals });
      const prev = queryClient.getQueryData<Ritual[]>(queryKeys.rituals);
      const stamp = at ?? nowISO();
      queryClient.setQueryData<Ritual[]>(queryKeys.rituals, (old) =>
        (old ?? []).map((r) => {
          if (r.id !== ritualId) return r;
          if (r.completionHistory.some((c) => c.date === date)) return r;
          const next = [
            ...r.completionHistory,
            { date, at: stamp, status: "missed" as const },
          ];
          return {
            ...r,
            completionHistory: next,
            totalCompletions: next.filter((c) => c.status === "done").length,
          };
        }),
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev !== undefined) queryClient.setQueryData(queryKeys.rituals, ctx.prev);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.rituals });
    },
  });
}

// ────── unskipRitualInstance (removes a 'skipped' entry for that date) ──────

export function useUnskipRitualInstanceMutation() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, RitualInstanceVars, { prev?: Ritual[] }>({
    mutationFn: async ({ ritualId, date }) => {
      const day = date ?? todayISO();
      const { error } = await supabase
        .from("ritual_completions")
        .delete()
        .eq("ritual_id", ritualId)
        .eq("date", day)
        .eq("status", "skipped");
      if (error) throw error;
    },
    onMutate: async ({ ritualId, date }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.rituals });
      const prev = queryClient.getQueryData<Ritual[]>(queryKeys.rituals);
      const day = date ?? todayISO();
      queryClient.setQueryData<Ritual[]>(queryKeys.rituals, (old) =>
        (old ?? []).map((r) => (r.id === ritualId ? applyUnskip(r, day) : r)),
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev !== undefined) queryClient.setQueryData(queryKeys.rituals, ctx.prev);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.rituals });
    },
  });
}

// ────── archiveRitual ──────

export function useArchiveRitualMutation() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, ID, { prev?: Ritual[] }>({
    mutationFn: async (id) => {
      const { error } = await supabase
        .from("rituals")
        .update({ status: "archived", archived_at: nowISO() })
        .eq("id", id);
      if (error) throw error;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.rituals });
      const prev = queryClient.getQueryData<Ritual[]>(queryKeys.rituals);
      const at = nowISO();
      queryClient.setQueryData<Ritual[]>(queryKeys.rituals, (old) =>
        (old ?? []).map((r) =>
          r.id === id ? { ...r, status: "archived", archivedAt: at } : r,
        ),
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev !== undefined) queryClient.setQueryData(queryKeys.rituals, ctx.prev);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.rituals });
    },
  });
}

// ────── restoreRitual ──────

export function useRestoreRitualMutation() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, ID, { prev?: Ritual[] }>({
    mutationFn: async (id) => {
      const { error } = await supabase
        .from("rituals")
        .update({ status: "active", archived_at: null })
        .eq("id", id);
      if (error) throw error;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.rituals });
      const prev = queryClient.getQueryData<Ritual[]>(queryKeys.rituals);
      queryClient.setQueryData<Ritual[]>(queryKeys.rituals, (old) =>
        (old ?? []).map((r) =>
          r.id === id ? { ...r, status: "active", archivedAt: undefined } : r,
        ),
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev !== undefined) queryClient.setQueryData(queryKeys.rituals, ctx.prev);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.rituals });
    },
  });
}

// ────── deleteRitual ──────

export function useDeleteRitualMutation() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, ID, { prev?: Ritual[] }>({
    mutationFn: async (id) => {
      // DB CASCADE handles ritual_completions.
      const { error } = await supabase.from("rituals").delete().eq("id", id);
      if (error) throw error;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.rituals });
      const prev = queryClient.getQueryData<Ritual[]>(queryKeys.rituals);
      queryClient.setQueryData<Ritual[]>(queryKeys.rituals, (old) =>
        (old ?? []).filter((r) => r.id !== id),
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev !== undefined) queryClient.setQueryData(queryKeys.rituals, ctx.prev);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.rituals });
    },
  });
}
