// Module-scoped TanStack QueryClient — the single source of truth for cache
// across the app. Consumed by:
//   - App.tsx (PersistQueryClientProvider)
//   - storeQueryRef.ts (legacy Zustand bridge)
//   - useAuth.tsx (signOut clears cache before redirect)

import { QueryClient } from "@tanstack/react-query";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,
      gcTime: 5 * 60 * 1000,
      refetchOnWindowFocus: true,
      retry: 1,
    },
  },
});

export const QUERY_CACHE_STORAGE_KEY = "actos-query-cache";

export const persister = createSyncStoragePersister({
  storage: window.localStorage,
  key: QUERY_CACHE_STORAGE_KEY,
});
