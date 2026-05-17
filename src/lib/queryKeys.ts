// Stable TanStack Query keys for the data layer.
// Entries are const-typed arrays so they survive value-equality checks across
// hooks and selectors. Nested keys (e.g., ["goal", id]) can be added later.

export const queryKeys = {
  goals: ["goals"] as const,
  projects: ["projects"] as const,
  actions: ["actions"] as const,
  rituals: ["rituals"] as const,
  ideas: ["ideas"] as const,
  dayEntries: ["dayEntries"] as const,
  sessions: ["sessions"] as const,
  userSetup: ["userSetup"] as const,
} as const;
