// useCurrentUser - single source of truth for the current user's public.users row.
// Separate from useAuth which owns auth.users and session. This hook reads
// public.users for app-domain fields like subscription tier, display name, etc.
//
// Why this exists: useAuth.tsx's fetchProfile was a single-shot fetch with no
// automatic recovery on failure. If it returned null due to network glitch or
// RLS race with handle_new_user trigger, the entire app fell back to free tier
// silently. TanStack provides automatic refetch on focus and stale-time
// invalidation for resilient recovery.

import { useQuery } from "@tanstack/react-query";
import { supabase } from "../supabase";
import { queryKeys } from "../queryKeys";
import { useAuth } from "../useAuth";
import type { Database } from "../supabase.types";

type PublicUserRow = Database["public"]["Tables"]["users"]["Row"];

export interface CurrentUser {
  id: string;
  email: string;
  displayName: string | null;
  subscriptionTier: "free" | "all-in";
  subscriptionStartedAt: string | null;
  billingCycle: string | null;
  isAdmin: boolean;
  hasCompletedInitialSetup: boolean;
}

function rowToCurrentUser(row: PublicUserRow): CurrentUser {
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    subscriptionTier: row.subscription_tier === "all-in" ? "all-in" : "free",
    subscriptionStartedAt: row.subscription_started_at,
    billingCycle: row.billing_cycle,
    isAdmin: row.is_admin,
    hasCompletedInitialSetup: row.has_completed_initial_setup,
  };
}

export function useCurrentUserQuery() {
  const { user } = useAuth();
  return useQuery({
    queryKey: queryKeys.currentUser,
    queryFn: async (): Promise<CurrentUser | null> => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single();
      if (error) {
        // eslint-disable-next-line no-console
        console.error("useCurrentUserQuery failed:", error);
        throw error;
      }
      return rowToCurrentUser(data);
    },
    enabled: !!user,
    staleTime: 5 * 60_000,
  });
}
