// Bridge so the legacy Zustand store (which can't use React hooks) can read
// goals out of the TanStack Query cache during the strangler migration.
// App.tsx populates the ref once after creating the queryClient.
//
// Still used by Zustand's captureIdea (goalId fallback) and a handful of
// imperative call sites. Delete once those migrate to Supabase in Session 2.

import type { QueryClient } from "@tanstack/react-query";
import type { Goal } from "@/types";
import { queryKeys } from "./queryKeys";

let _qc: QueryClient | null = null;

export function setStoreQueryClientRef(qc: QueryClient): void {
  _qc = qc;
}

export function readGoalsFromCache(): Goal[] {
  return _qc?.getQueryData<Goal[]>(queryKeys.goals) ?? [];
}
