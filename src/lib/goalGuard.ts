// Guards for "+ New action" / "+ New ritual" entry points. When the user
// has zero active goals, these flows reroute to the full-page goal-builder
// instead of opening their normal create panel.

import { readGoalsFromCache } from "@/lib/storeQueryRef";

export function hasActiveGoal(): boolean {
  return readGoalsFromCache().some((g) => g.status === "active");
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
