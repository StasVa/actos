// Guards for "+ New action" / "+ New ritual" entry points. When the user
// has zero active goals, these flows reroute to the full-page goal-builder
// instead of opening their normal create panel.

import type { QueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import type { Goal } from "@/types";

export function hasActiveGoal(queryClient: QueryClient): boolean {
  const goals = queryClient.getQueryData<Goal[]>(queryKeys.goals) ?? [];
  return goals.some((g) => g.status === "active");
}

/**
 * Imperative redirect when called outside of React (e.g. from KeyboardShortcuts
 * or CommandPalette callbacks). We use full-page navigation as a fallback if
 * no router navigate is supplied.
 */
export function redirectToGoalBuilder(navigate?: (to: string) => void) {
  if (navigate) navigate("/onboarding/goal");
  else if (typeof window !== "undefined") window.location.assign("/onboarding/goal");
}
