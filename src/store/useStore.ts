// ActOS single source of truth — Zustand store with localStorage persistence.
//
// All entity collections, mutations, and selectors live here. Pages read via
// useStore(selector) and call mutations as zero-arg/payload methods.
//
// Persistence: middleware syncs to `localStorage['actos-store']` on every change.
// Dev utility: window.__resetStore() clears storage and restores seed data.

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  ActionStatus,
  DayEntry,
  DayType,
  Idea,
  Ritual,
  RitualSchedule,
  RitualScheduleConfig,
  Session,
  SessionMode,
  UIState,
  UserSettings,
  ID,
  ISODate,
  ISODateTime,
} from "@/types";
import { readGoalsFromCache } from "@/lib/storeQueryRef";
import {
  SEED_DAY_ENTRIES,
  SEED_IDEAS,
  SEED_RITUALS,
  SEED_SETTINGS,
  TODAY_ISO,
} from "./mockData";
import { buildSampleSeed, applySampleCoachmarks } from "@/lib/sampleSeed";

// ───────── helpers ─────────
const uid = (): ID =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const nowISO = (): string => new Date().toISOString();
const todayISO = (): ISODate => new Date().toISOString().slice(0, 10);

export const TERMINAL_ACTION_STATUSES: ActionStatus[] = ["done", "delegated", "dropped", "cancelled"];

// 7-tier ritual multiplier formula (per spec 02-MODEL.md).
function ritualMultiplier(totalCompletions: number): number {
  if (totalCompletions < 3) return 1.0;
  if (totalCompletions < 7) return 1.1;
  if (totalCompletions < 14) return 1.25;
  if (totalCompletions < 30) return 1.5;
  if (totalCompletions < 60) return 1.75;
  if (totalCompletions < 100) return 2.0;
  return 2.5;
}

// ───────── Store shape ─────────
export interface StoreState {
  // entities
  rituals: Ritual[];
  ideas: Idea[];
  dayEntries: DayEntry[];
  sessions: Session[];
  settings: UserSettings;
  ui: UIState;


  // ─── Ritual actions ───
  createRitual: (
    payload: Pick<Ritual, "title" | "schedule" | "goalId"> & Partial<Ritual>,
  ) => ID;
  updateRitual: (id: ID, partial: Partial<Ritual>) => void;
  markRitualInstanceDone: (ritualId: ID, date?: ISODate) => void;
  skipRitualInstance: (ritualId: ID, date?: ISODate) => void;
  unskipRitualInstance: (ritualId: ID, date?: ISODate) => void;
  archiveRitual: (id: ID) => void;
  restoreRitual: (id: ID) => void;
  deleteRitual: (id: ID) => void;

  // ─── Idea actions ───
  captureIdea: (payload: Pick<Idea, "title"> & Partial<Idea>) => ID;
  updateIdea: (id: ID, partial: Partial<Idea>) => void;
  /**
   * Marks an idea as converted to an action. Caller is responsible for creating
   * the action (via useCreateActionMutation) and passing the resulting id.
   * Action creation can't happen inside Zustand once actions live in Supabase.
   */
  convertIdeaToAction: (ideaId: ID, newActionId: ID) => void;
  /**
   * Marks an idea as converted to a project. Caller is responsible for creating
   * the project (via useCreateProjectMutation) and passing the resulting id.
   */
  convertIdeaToProject: (ideaId: ID, newProjectId: ID) => void;
  discardIdea: (id: ID) => void;
  moveIdeaToGoal: (ideaId: ID, newGoalId: ID) => void;

  // ─── Day entry actions ───
  startDay: (
    date: ISODate,
    dayType?: DayType,
    mainTaskActionId?: ID,
    morningEnergyScore?: number,
    morningIntentNote?: string,
  ) => void;
  startDayPlan: (params: {
    date: ISODate;
    dayType?: DayType;
    mainTaskActionId?: ID;
    morningEnergyScore?: number;
    morningIntentNote?: string;
    plannedActionIds: ID[];
    plannedRitualIds: ID[];
    skippedRitualIds: ID[];
  }) => void;
  updateDayEntry: (date: ISODate, partial: Partial<DayEntry>) => void;
  closeDay: (date: ISODate, opts?: { closedAt?: ISODateTime }) => void;
  reopenDay: (date: ISODate) => void;
  getDayEntry: (date: ISODate) => DayEntry | undefined;

  // ─── Settings ───
  toggleLayer: (layerName: keyof UserSettings["layers"], enabled: boolean) => void;
  setDefaultGoal: (goalId: ID) => void;
  setShowAdminTools: (enabled: boolean) => void;

  // ─── Sessions ───
  createDraftSession: (config: {
    mode: SessionMode;
    workDuration: number;
    breakDuration: number;
    cyclesPlanned: number;
    plannedActionIds: ID[];
  }) => { ok: true; id: ID } | { ok: false; reason: "active-exists" };
  completeSession: (sessionId: ID) => void;
  abortSession: (sessionId: ID) => void;
  addCompletedActionToSession: (sessionId: ID, actionId: ID) => void;
  addDroppedActionToSession: (sessionId: ID, actionId: ID) => void;
  addPlannedActionsToSession: (sessionId: ID, actionIds: ID[]) => void;
  incrementSessionCycles: (sessionId: ID) => void;
  deleteSession: (sessionId: ID) => void;
  setSessionReflection: (sessionId: ID, reflection: string) => void;
  getActiveSession: () => Session | null;

  // ─── UI ───
  openPanel: (panel: UIState["activePanel"]) => void;
  closePanel: () => void;
  selectIdea: (id: ID | undefined) => void;

  // ─── Reset ───
  resetToSeed: () => void;
  /** Wipe all entities & day entries for a fresh-start workspace. */
  resetToEmpty: () => void;
  /** Replace workspace with seed fixtures, marking every entity isSample=true. */
  seedSampleData: () => void;
  /** Delete every entity (and dependent day entries) flagged isSample=true. */
  clearSampleData: () => void;
  setUserName: (name: string) => void;
}

const initialState = {
  rituals: SEED_RITUALS,
  ideas: SEED_IDEAS,
  dayEntries: SEED_DAY_ENTRIES,
  sessions: [] as Session[],
  settings: SEED_SETTINGS,
  ui: { activePanel: null } as UIState,
};

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      ...initialState,

      // ───────── Rituals ─────────
      createRitual: (payload) => {
        const id = uid();
        const ritual: Ritual = {
          id,
          goalId: payload.goalId,
          projectId: payload.projectId ?? null,
          title: payload.title,
          schedule: payload.schedule,
          scheduleConfig: payload.scheduleConfig,
          baseImpact: payload.baseImpact ?? 5,
          notes: payload.notes,
          energyCost: payload.energyCost,
          focusCost: payload.focusCost,
          timeEstimateMinutes: payload.timeEstimateMinutes,
          totalCompletions: 0,
          completionHistory: [],
          status: "active",
          createdAt: nowISO(),
        };
        set({ rituals: [...get().rituals, ritual] });
        return id;
      },

      updateRitual: (id, partial) => {
        set({
          rituals: get().rituals.map((r) => (r.id === id ? { ...r, ...partial } : r)),
        });
      },

      markRitualInstanceDone: (ritualId, date) => {
        const at = nowISO();
        const day = date ?? todayISO();
        set({
          rituals: get().rituals.map((r) =>
            r.id === ritualId
              ? {
                  ...r,
                  totalCompletions: r.totalCompletions + 1,
                  // Replace any existing entry for this date (e.g. a prior "skipped"),
                  // then append the new "done" entry.
                  completionHistory: [
                    ...r.completionHistory.filter((c) => c.date !== day),
                    { date: day, at, status: "done" },
                  ],
                }
              : r,
          ),
        });
      },

      skipRitualInstance: (ritualId, date) => {
        const at = nowISO();
        const day = date ?? todayISO();
        set({
          rituals: get().rituals.map((r) =>
            r.id === ritualId
              ? {
                  ...r,
                  // Skipped does NOT increment totalCompletions.
                  completionHistory: [
                    ...r.completionHistory.filter((c) => c.date !== day),
                    { date: day, at, status: "skipped" },
                  ],
                }
              : r,
          ),
        });
      },

      unskipRitualInstance: (ritualId, date) => {
        const day = date ?? todayISO();
        set({
          rituals: get().rituals.map((r) =>
            r.id === ritualId
              ? {
                  ...r,
                  completionHistory: r.completionHistory.filter(
                    (c) => !(c.date === day && c.status === "skipped"),
                  ),
                }
              : r,
          ),
        });
      },

      archiveRitual: (id) => {
        set({
          rituals: get().rituals.map((r) =>
            r.id === id ? { ...r, status: "archived", archivedAt: nowISO() } : r,
          ),
        });
      },

      restoreRitual: (id) => {
        set({
          rituals: get().rituals.map((r) =>
            r.id === id ? { ...r, status: "active", archivedAt: undefined } : r,
          ),
        });
      },

      deleteRitual: (id) => {
        set({ rituals: get().rituals.filter((r) => r.id !== id) });
      },

      // ───────── Ideas ─────────
      captureIdea: (payload) => {
        const state = get();
        const id = uid();
        const cachedGoals = readGoalsFromCache();
        const goalId =
          payload.goalId ??
          state.settings.defaultGoalId ??
          cachedGoals.find((g) => g.status === "active")?.id ??
          cachedGoals[0]?.id;
        const idea: Idea = {
          id,
          goalId: goalId!,
          title: payload.title,
          note: payload.note,
          references: payload.references ?? [],
          imageAttachments: payload.imageAttachments ?? [],
          status: "captured",
          capturedAt: nowISO(),
        };
        set({ ideas: [idea, ...state.ideas] });
        return id;
      },

      updateIdea: (id, partial) => {
        set({
          ideas: get().ideas.map((i) => (i.id === id ? { ...i, ...partial } : i)),
        });
      },

      convertIdeaToAction: (ideaId, newActionId) => {
        set({
          ideas: get().ideas.map((i) =>
            i.id === ideaId
              ? { ...i, status: "converted_to_action", convertedToId: newActionId }
              : i,
          ),
        });
      },

      convertIdeaToProject: (ideaId, newProjectId) => {
        set({
          ideas: get().ideas.map((i) =>
            i.id === ideaId
              ? { ...i, status: "converted_to_project", convertedToId: newProjectId }
              : i,
          ),
        });
      },

      discardIdea: (id) => {
        set({
          ideas: get().ideas.map((i) =>
            i.id === id ? { ...i, status: "discarded", discardedAt: nowISO() } : i,
          ),
        });
      },

      moveIdeaToGoal: (ideaId, newGoalId) => {
        set({
          ideas: get().ideas.map((i) => (i.id === ideaId ? { ...i, goalId: newGoalId } : i)),
        });
      },

      // ───────── Day entries ─────────
      startDay: (date, dayType, mainTaskActionId, morningEnergyScore, morningIntentNote) => {
        const state = get();
        const existing = state.dayEntries.find((d) => d.date === date);
        const at = nowISO();
        if (existing) {
          set({
            dayEntries: state.dayEntries.map((d) =>
              d.date === date
                ? { ...d, dayType, mainTaskActionId, morningEnergyScore, morningIntentNote, startedAt: existing.startedAt ?? at }
                : d,
            ),
          });
        } else {
          set({
            dayEntries: [
              ...state.dayEntries,
              { date, dayType, mainTaskActionId, morningEnergyScore, morningIntentNote, startedAt: at },
            ],
          });
        }
      },

      updateDayEntry: (date, partial) => {
        const state = get();
        const existing = state.dayEntries.find((d) => d.date === date);
        if (existing) {
          set({
            dayEntries: state.dayEntries.map((d) =>
              d.date === date ? { ...d, ...partial } : d,
            ),
          });
        } else {
          set({ dayEntries: [...state.dayEntries, { date, ...partial }] });
        }
      },

      startDayPlan: ({
        date,
        dayType,
        mainTaskActionId,
        morningEnergyScore,
        morningIntentNote,
        plannedActionIds,
        plannedRitualIds,
        skippedRitualIds,
      }) => {
        const state = get();
        const existing = state.dayEntries.find((d) => d.date === date);
        const at = nowISO();
        const next: DayEntry = {
          ...(existing ?? { date }),
          dayType,
          mainTaskActionId,
          morningEnergyScore,
          morningIntentNote,
          plannedActionIds,
          plannedRitualIds,
          skippedRitualIds,
          isPlanned: true,
          startedAt: existing?.startedAt ?? at,
        };
        set({
          dayEntries: existing
            ? state.dayEntries.map((d) => (d.date === date ? next : d))
            : [...state.dayEntries, next],
        });
        // Persist skip decisions to ritual completion history.
        for (const rid of skippedRitualIds) {
          state.skipRitualInstance(rid, date);
        }
      },

      closeDay: (date, opts) => {
        const at = opts?.closedAt ?? nowISO();
        const state = get();
        const existing = state.dayEntries.find((d) => d.date === date);
        if (existing) {
          set({
            dayEntries: state.dayEntries.map((d) =>
              d.date === date ? { ...d, closedAt: at, isClosed: true } : d,
            ),
          });
        } else {
          set({
            dayEntries: [
              ...state.dayEntries,
              { date, closedAt: at, isClosed: true },
            ],
          });
        }
      },

      reopenDay: (date) => {
        const state = get();
        set({
          dayEntries: state.dayEntries.map((d) =>
            d.date === date ? { ...d, isClosed: false, closedAt: undefined } : d,
          ),
        });
      },

      getDayEntry: (date) => get().dayEntries.find((d) => d.date === date),

      // ───────── Settings ─────────
      // Layer toggles removed — Plan & Review and Log Time are now always-on
      // core mechanics. The setter is kept as a no-op for compatibility.
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

      // ───────── Sessions ─────────
      createDraftSession: (config) => {
        const state = get();
        if (state.sessions.some((s) => s.status === "in_progress")) {
          return { ok: false, reason: "active-exists" };
        }
        const id = uid();
        const session: Session = {
          id,
          status: "in_progress",
          startedAt: nowISO(),
          endedAt: null,
          mode: config.mode,
          workDuration: config.workDuration,
          breakDuration: config.breakDuration,
          cyclesPlanned: config.cyclesPlanned,
          plannedActionIds: [...config.plannedActionIds],
          completedActionIds: [],
          droppedActionIds: [],
          cyclesCompleted: 0,
        };
        set({ sessions: [...state.sessions, session] });
        return { ok: true, id };
      },

      completeSession: (sessionId) => {
        set({
          sessions: get().sessions.map((s) =>
            s.id === sessionId && s.status === "in_progress"
              ? { ...s, status: "completed", endedAt: nowISO() }
              : s,
          ),
        });
      },

      abortSession: (sessionId) => {
        set({
          sessions: get().sessions.map((s) =>
            s.id === sessionId && s.status === "in_progress"
              ? { ...s, status: "aborted", endedAt: nowISO() }
              : s,
          ),
        });
      },

      addCompletedActionToSession: (sessionId, actionId) => {
        set({
          sessions: get().sessions.map((s) =>
            s.id === sessionId && s.status === "in_progress" && !s.completedActionIds.includes(actionId)
              ? { ...s, completedActionIds: [...s.completedActionIds, actionId] }
              : s,
          ),
        });
      },

      addDroppedActionToSession: (sessionId, actionId) => {
        set({
          sessions: get().sessions.map((s) =>
            s.id === sessionId && s.status === "in_progress" && !s.droppedActionIds.includes(actionId)
              ? { ...s, droppedActionIds: [...s.droppedActionIds, actionId] }
              : s,
          ),
        });
      },

      addPlannedActionsToSession: (sessionId, actionIds) => {
        set({
          sessions: get().sessions.map((s) => {
            if (s.id !== sessionId || s.status !== "in_progress") return s;
            const existing = new Set(s.plannedActionIds);
            const additions = actionIds.filter((id) => !existing.has(id));
            if (additions.length === 0) return s;
            return { ...s, plannedActionIds: [...s.plannedActionIds, ...additions] };
          }),
        });
      },

      incrementSessionCycles: (sessionId) => {
        set({
          sessions: get().sessions.map((s) =>
            s.id === sessionId && s.status === "in_progress"
              ? { ...s, cyclesCompleted: s.cyclesCompleted + 1 }
              : s,
          ),
        });
      },

      deleteSession: (sessionId) => {
        set({ sessions: get().sessions.filter((s) => s.id !== sessionId) });
      },

      setSessionReflection: (sessionId, reflection) => {
        set({
          sessions: get().sessions.map((s) =>
            s.id === sessionId ? { ...s, reflection } : s,
          ),
        });
      },

      getActiveSession: () => get().sessions.find((s) => s.status === "in_progress") ?? null,

      // ───────── UI ─────────
      openPanel: (panel) => set({ ui: { ...get().ui, activePanel: panel } }),
      closePanel: () => set({ ui: { ...get().ui, activePanel: null } }),
      selectIdea: (id) => set({ ui: { ...get().ui, selectedIdeaId: id } }),

      // ───────── Reset ─────────
      resetToSeed: () => set({ ...initialState }),

      resetToEmpty: () =>
        set({
          rituals: [],
          ideas: [],
          dayEntries: [],
          sessions: [],
        }),

      seedSampleData: () => {
        // Pick locale from the user's i18n setting at seed time. Once seeded,
        // entities are real workspace data and don't react to language switches.
        let locale: string | undefined;
        try {
          locale =
            localStorage.getItem("actos.i18n.language") ||
            (navigator?.language ? navigator.language.slice(0, 2) : undefined);
        } catch {
          locale = undefined;
        }
        const seed = buildSampleSeed(locale);
        // Goals are seeded into Supabase via the Setup Wizard path now (Session 2);
        // here we only seed entities still living in Zustand.
        set({
          rituals: seed.rituals,
          ideas: seed.ideas,
          sessions: seed.sessions,
          dayEntries: seed.dayEntries,
        });
        applySampleCoachmarks(seed.coachmarks);
      },

      clearSampleData: () => {
        const s = get();
        set({
          rituals: s.rituals.filter((r) => !r.isSample),
          ideas: s.ideas.filter((i) => !i.isSample),
          sessions: s.sessions.filter((x) => !(x as any).isSample),
          dayEntries: s.dayEntries.filter((d) => !(d as any).isSample),
        });
      },

      setUserName: (name: string) =>
        set({ settings: { ...get().settings, userName: name } }),
    }),
    {
      name: "actos-store",
      version: 2,
      storage: createJSONStorage(() => localStorage),
      // Persist everything except transient UI state.
      partialize: (state) => ({
        rituals: state.rituals,
        ideas: state.ideas,
        dayEntries: state.dayEntries,
        sessions: state.sessions,
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

// ───────── Selectors (read-only helpers) ─────────
// Use as plain functions: getActiveGoals(useStore.getState()) — or wrap inline
// in a useStore(selector) call when reactive updates are needed.

export const selectors = {
  ritualById: (s: StoreState, id: ID) => s.rituals.find((r) => r.id === id),
  ideaById: (s: StoreState, id: ID) => s.ideas.find((i) => i.id === id),

  ritualsByGoal: (s: StoreState, goalId: ID) =>
    s.rituals.filter((r) => r.goalId === goalId && r.status === "active"),
  ideasByGoal: (s: StoreState, goalId: ID) => s.ideas.filter((i) => i.goalId === goalId),

  ritualMultiplier: (s: StoreState, ritualId: ID) => {
    const r = s.rituals.find((x) => x.id === ritualId);
    return r ? ritualMultiplier(r.totalCompletions) : 1.0;
  },

  ritualEffectiveImpact: (s: StoreState, ritualId: ID) => {
    const r = s.rituals.find((x) => x.id === ritualId);
    if (!r) return 0;
    return r.baseImpact * ritualMultiplier(r.totalCompletions);
  },

  todaysPendingRituals: (s: StoreState) => {
    const today = todayISO();
    return s.rituals.filter(
      (r) =>
        r.status === "active" &&
        !r.completionHistory.some((c) => c.date === today),
    );
  },
};

// ───────── Dev utility ─────────
if (typeof window !== "undefined") {
  (window as unknown as { __resetStore: () => void }).__resetStore = () => {
    localStorage.removeItem("actos-store");
    useStore.getState().resetToSeed();
    // eslint-disable-next-line no-console
    console.info("[actos] store reset to seed data");
  };
}

export { ritualMultiplier };
