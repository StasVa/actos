// Tracks whether the current user has completed the initial Setup wizard.
// Source of truth: public.users.has_completed_initial_setup (boolean).
// Replaces the localStorage actos.setup.completed flag, which was unreliable
// (cleared by signOut sweep, leaked across accounts on shared devices) and
// caused the wizard to re-trigger on plain login.
//
// Query returns `undefined` while loading. SetupGuard treats `undefined` as
// "don't redirect yet" so the page doesn't bounce mid-hydration.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/useAuth";
import { queryKeys } from "@/lib/queryKeys";

export function useUserSetupFlagQuery() {
  const { user } = useAuth();
  return useQuery<boolean>({
    queryKey: queryKeys.userSetup,
    queryFn: async () => {
      if (!user) return false;
      const { data, error } = await supabase
        .from("users")
        .select("has_completed_initial_setup")
        .eq("id", user.id)
        .maybeSingle();
      if (error) throw error;
      return Boolean(data?.has_completed_initial_setup);
    },
    enabled: !!user,
    staleTime: Infinity,
  });
}

export function useMarkSetupCompletedMutation() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation<void, Error, void, { prev?: boolean }>({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("users")
        .update({ has_completed_initial_setup: true })
        .eq("id", user.id);
      if (error) throw error;
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: queryKeys.userSetup });
      const prev = queryClient.getQueryData<boolean>(queryKeys.userSetup);
      queryClient.setQueryData<boolean>(queryKeys.userSetup, true);
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev !== undefined) {
        queryClient.setQueryData(queryKeys.userSetup, ctx.prev);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.userSetup });
    },
  });
}
