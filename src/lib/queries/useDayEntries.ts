// TanStack Query hooks for DayEntries. Source of truth: Supabase
// `public.day_entries`. RLS enforces per-user scoping; query filters by user.id
// for cache stability. Unique constraint on (user_id, date) makes upsert the
// natural mutation: createDay/startDayPlan/updateDayEntry from the prior
// Zustand surface all collapse into a single useUpsertDayEntryMutation that
// merges with the existing row before writing.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/useAuth";
import { queryKeys } from "@/lib/queryKeys";
import {
  dayEntryPartialToUpdate,
  dayEntryToInsert,
  rowToDayEntry,
} from "@/lib/rowMappers";
import type { DayEntry, ISODate, ISODateTime } from "@/types";

function nowISO(): string {
  return new Date().toISOString();
}

// ────── query ──────

export function useDayEntriesQuery() {
  const { user } = useAuth();
  return useQuery<DayEntry[]>({
    queryKey: queryKeys.dayEntries,
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("day_entries")
        .select("*")
        .eq("user_id", user.id);
      if (error) throw error;
      return data.map(rowToDayEntry).sort((a, b) => a.date.localeCompare(b.date));
    },
    enabled: !!user,
  });
}

// ────── upsertDayEntry (consolidates create/start/update) ──────

export interface UpsertDayEntryVars {
  date: ISODate;
  partial: Partial<DayEntry>;
}

export function useUpsertDayEntryMutation() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation<void, Error, UpsertDayEntryVars, { prev?: DayEntry[] }>({
    mutationFn: async ({ date, partial }) => {
      if (!user) throw new Error("Not authenticated");
      // Look up existing row in cache; merge partial into it for the upsert.
      // (Supabase upsert with onConflict replaces the whole row.)
      const all = queryClient.getQueryData<DayEntry[]>(queryKeys.dayEntries) ?? [];
      const existing = all.find((d) => d.date === date);
      const merged: DayEntry = { date, ...(existing ?? {}), ...partial };
      const row = dayEntryToInsert(merged, user.id);
      const { error } = await supabase
        .from("day_entries")
        .upsert(row, { onConflict: "user_id,date" });
      if (error) throw error;
    },
    onMutate: async ({ date, partial }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.dayEntries });
      const prev = queryClient.getQueryData<DayEntry[]>(queryKeys.dayEntries);
      queryClient.setQueryData<DayEntry[]>(queryKeys.dayEntries, (old) => {
        const list = old ?? [];
        const existing = list.find((d) => d.date === date);
        if (existing) {
          return list.map((d) => (d.date === date ? { ...d, ...partial } : d));
        }
        return [...list, { date, ...partial }];
      });
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev !== undefined) queryClient.setQueryData(queryKeys.dayEntries, ctx.prev);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.dayEntries });
    },
  });
}

// ────── closeDay ──────

export interface CloseDayVars {
  date: ISODate;
  closedAt?: ISODateTime;
}

export function useCloseDayMutation() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation<void, Error, CloseDayVars, { prev?: DayEntry[] }>({
    mutationFn: async ({ date, closedAt }) => {
      if (!user) throw new Error("Not authenticated");
      const at = closedAt ?? nowISO();
      const all = queryClient.getQueryData<DayEntry[]>(queryKeys.dayEntries) ?? [];
      const existing = all.find((d) => d.date === date);
      if (existing) {
        const { error } = await supabase
          .from("day_entries")
          .update(dayEntryPartialToUpdate({ isClosed: true, closedAt: at }))
          .eq("user_id", user.id)
          .eq("date", date);
        if (error) throw error;
      } else {
        const row = dayEntryToInsert({ date, isClosed: true, closedAt: at }, user.id);
        const { error } = await supabase
          .from("day_entries")
          .insert(row);
        if (error) throw error;
      }
    },
    onMutate: async ({ date, closedAt }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.dayEntries });
      const prev = queryClient.getQueryData<DayEntry[]>(queryKeys.dayEntries);
      const at = closedAt ?? nowISO();
      queryClient.setQueryData<DayEntry[]>(queryKeys.dayEntries, (old) => {
        const list = old ?? [];
        const existing = list.find((d) => d.date === date);
        if (existing) {
          return list.map((d) =>
            d.date === date ? { ...d, isClosed: true, closedAt: at } : d,
          );
        }
        return [...list, { date, isClosed: true, closedAt: at }];
      });
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev !== undefined) queryClient.setQueryData(queryKeys.dayEntries, ctx.prev);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.dayEntries });
    },
  });
}

// ────── reopenDay ──────

export function useReopenDayMutation() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation<void, Error, ISODate, { prev?: DayEntry[] }>({
    mutationFn: async (date) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("day_entries")
        .update(dayEntryPartialToUpdate({ isClosed: false, closedAt: undefined }))
        .eq("user_id", user.id)
        .eq("date", date);
      if (error) throw error;
    },
    onMutate: async (date) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.dayEntries });
      const prev = queryClient.getQueryData<DayEntry[]>(queryKeys.dayEntries);
      queryClient.setQueryData<DayEntry[]>(queryKeys.dayEntries, (old) =>
        (old ?? []).map((d) =>
          d.date === date ? { ...d, isClosed: false, closedAt: undefined } : d,
        ),
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev !== undefined) queryClient.setQueryData(queryKeys.dayEntries, ctx.prev);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.dayEntries });
    },
  });
}
