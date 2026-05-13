// ActOS Zustand store — UI state + user preferences only.
//
// All entity collections (goals, projects, actions, rituals, ideas,
// day entries, sessions) have migrated to TanStack Query backed by Supabase.
// This store now holds Layer 1/2 state only: settings (default goal, admin
// toggle, layer flags) + transient UI (active panel, selected idea).
//
// Persistence: localStorage['actos-store'] holds settings only. UI state is
// volatile by design.

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { UIState, UserSettings, ID } from "@/types";
import { SEED_SETTINGS } from "./mockData";

// ───────── Store shape ─────────
export interface StoreState {
  settings: UserSettings;
  ui: UIState;

  // ─── Settings ───
  toggleLayer: (layerName: keyof UserSettings["layers"], enabled: boolean) => void;
  setDefaultGoal: (goalId: ID) => void;
  setShowAdminTools: (enabled: boolean) => void;
  setUserName: (name: string) => void;

  // ─── UI ───
  openPanel: (panel: UIState["activePanel"]) => void;
  closePanel: () => void;
  selectIdea: (id: ID | undefined) => void;
}

const initialState = {
  settings: SEED_SETTINGS,
  ui: { activePanel: null } as UIState,
};

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      ...initialState,

      // ───────── Settings ─────────
      // Layer toggles removed — Plan & Review and Log Time are always-on now.
      // The setter is retained as a no-op for compatibility.
      toggleLayer: (_layerName, _enabled) => {
        set({
          settings: {
            ...get().settings,
            layers: { planAndReview: true, logTime: true },
          },
        });
      },

      setDefaultGoal: (goalId) => {
        set({ settings: { ...get().settings, defaultGoalId: goalId } });
      },

      setShowAdminTools: (enabled: boolean) => {
        set({ settings: { ...get().settings, showAdminTools: enabled } });
      },

      setUserName: (name: string) =>
        set({ settings: { ...get().settings, userName: name } }),

      // ───────── UI ─────────
      openPanel: (panel) => set({ ui: { ...get().ui, activePanel: panel } }),
      closePanel: () => set({ ui: { ...get().ui, activePanel: null } }),
      selectIdea: (id) => set({ ui: { ...get().ui, selectedIdeaId: id } }),
    }),
    {
      name: "actos-store",
      version: 2,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        settings: state.settings,
      }),
      // v2: layer toggles removed — both layers permanently true.
      migrate: (persisted: any, _version: number) => {
        if (persisted?.settings) {
          persisted.settings.layers = { planAndReview: true, logTime: true };
        }
        return persisted;
      },
      onRehydrateStorage: () => (state) => {
        if (state?.settings) {
          state.settings.layers = { planAndReview: true, logTime: true };
        }
      },
    },
  ),
);

// Legacy selectors export — empty after all entities migrated. Kept as a
// re-export point for any non-React imperative consumer; can be removed
// once all callers stop importing it.
export const selectors = {} as const;

// ───────── Dev utility ─────────
// Wipes localStorage caches (Zustand store + TanStack Query). Useful when
// you want a fresh hydrate from Supabase without signing out.
if (typeof window !== "undefined") {
  (window as unknown as { __resetStore: () => void }).__resetStore = () => {
    try {
      localStorage.removeItem("actos-store");
      localStorage.removeItem("actos-query-cache");
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line no-console
    console.info(
      "[actos] cleared actos-store + actos-query-cache from localStorage. Reload to hydrate from Supabase.",
    );
  };
}
