// Stable TanStack Query keys for the data layer.
// Entries are const-typed arrays so they survive value-equality checks across
// hooks and selectors. Nested keys (e.g., ["goal", id]) can be added later.

export const queryKeys = {
  goals: ["goals"] as const,
  projects: ["projects"] as const,
  actions: ["actions"] as const,
} as const;
