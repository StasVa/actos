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
  Action,
  ActionStatus,
  DayEntry,
  DayType,
  Goal,
  GoalColorVar,
  Idea,
  Project,
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
import {
  SEED_ACTIONS,
  SEED_DAY_ENTRIES,
  SEED_GOALS,
  SEED_IDEAS,
  SEED_PROJECTS,
  SEED_RITUALS,
  SEED_SETTINGS,
  TODAY_ISO,
} from "./mockData";

// ───────── helpers ─────────
const uid = (): ID =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const nowISO = (): string => new Date().toISOString();
const todayISO = (): ISODate => new Date().toISOString().slice(0, 10);

const TERMINAL_ACTION_STATUSES: ActionStatus[] = ["done", "delegated", "dropped", "cancelled"];

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

function pickNextGoalColor(goals: Goal[]): GoalColorVar {
  const used = new Set(goals.filter((g) => g.status === "active").map((g) => g.color));
  const palette: GoalColorVar[] = ["goal-1", "goal-2", "goal-3"];
  return palette.find((c) => !used.has(c)) ?? "goal-1";
}

function activeGoalCount(goals: Goal[]): number {
  return goals.filter((g) => g.status === "active").length;
}

// ───────── Store shape ─────────
export interface StoreState {
  // entities
  goals: Goal[];
  projects: Project[];
  actions: Action[];
  rituals: Ritual[];
  ideas: Idea[];
  dayEntries: DayEntry[];
  sessions: Session[];
  settings: UserSettings;
  ui: UIState;

  // ─── Goal actions ───
  createGoal: (
    payload: Pick<Goal, "title" | "type"> & Partial<Omit<Goal, "id" | "status" | "color" | "createdAt">>,
  ) => { ok: true; id: ID } | { ok: false; reason: "limit" };
  updateGoal: (id: ID, partial: Partial<Goal>) => void;
  markGoalComplete: (id: ID) => void;
  dropGoal: (id: ID) => void;
  deleteGoal: (id: ID) => void;
  reopenGoal: (id: ID) => void;

  // ─── Project actions ───
  createProject: (payload: Pick<Project, "title" | "goalId"> & Partial<Project>) => ID;
  updateProject: (id: ID, partial: Partial<Project>) => void;
  markProjectComplete: (id: ID) => void;
  dropProject: (id: ID) => void;
  deleteProject: (id: ID) => void;
  moveProjectToGoal: (projectId: ID, newGoalId: ID) => void;

  // ─── Action actions ───
  createAction: (
    payload: Pick<Action, "title"> & {
      projectId?: ID | null;
      goalId?: ID;
    } & Partial<Action>,
  ) => ID;
  updateAction: (id: ID, partial: Partial<Action>) => void;
  changeActionStatus: (
    id: ID,
    newStatus: ActionStatus,
    statusPayload?: { delegateName?: string; delegateNote?: string; expectedReturnDate?: ISODate; scheduledDate?: ISODate },
  ) => void;
  deleteAction: (id: ID) => void;

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
  convertIdeaToAction: (
    ideaId: ID,
    actionPayload: Pick<Action, "title"> & { projectId?: ID | null; goalId?: ID } & Partial<Action>,
  ) => ID;
  convertIdeaToProject: (
    ideaId: ID,
    projectPayload: Pick<Project, "title"> & { goalId?: ID } & Partial<Project>,
  ) => ID;
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
  setSubscriptionTier: (tier: "free" | "pro") => void;

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
  goals: SEED_GOALS,
  projects: SEED_PROJECTS,
  actions: SEED_ACTIONS,
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

      // ───────── Goals ─────────
      createGoal: (payload) => {
        const state = get();
        if (activeGoalCount(state.goals) >= 3) {
          return { ok: false, reason: "limit" };
        }
        const id = uid();
        const goal: Goal = {
          id,
          title: payload.title,
          type: payload.type,
          status: "active",
          description: payload.description,
          successCriteria: payload.successCriteria ?? [],
          targetDate: payload.targetDate,
          color: pickNextGoalColor(state.goals),
          createdAt: nowISO(),
        };
        set({ goals: [...state.goals, goal] });
        return { ok: true, id };
      },

      updateGoal: (id, partial) => {
        set({
          goals: get().goals.map((g) =>
            g.id === id ? { ...g, ...partial, updatedAt: nowISO() } : g,
          ),
        });
      },

      markGoalComplete: (id) => {
        set({
          goals: get().goals.map((g) =>
            g.id === id ? { ...g, status: "completed", completedAt: nowISO() } : g,
          ),
        });
      },

      dropGoal: (id) => {
        const at = nowISO();
        const state = get();
        const projectIds = state.projects.filter((p) => p.goalId === id).map((p) => p.id);
        set({
          goals: state.goals.map((g) =>
            g.id === id ? { ...g, status: "dropped", droppedAt: at } : g,
          ),
          projects: state.projects.map((p) =>
            p.goalId === id ? { ...p, status: "dropped", droppedAt: at } : p,
          ),
          actions: state.actions.map((a) =>
            a.goalId === id && !TERMINAL_ACTION_STATUSES.includes(a.status)
              ? { ...a, status: "dropped", droppedAt: at }
              : a,
          ),
          rituals: state.rituals.map((r) =>
            (r.goalId === id || (r.projectId && projectIds.includes(r.projectId))) &&
            r.status === "active"
              ? { ...r, status: "archived", archivedAt: at }
              : r,
          ),
        });
      },

      deleteGoal: (id) => {
        const state = get();
        const projIds = new Set(state.projects.filter((p) => p.goalId === id).map((p) => p.id));
        set({
          goals: state.goals.filter((g) => g.id !== id),
          projects: state.projects.filter((p) => p.goalId !== id),
          actions: state.actions.filter((a) => a.goalId !== id),
          rituals: state.rituals.filter(
            (r) => r.goalId !== id && !(r.projectId && projIds.has(r.projectId)),
          ),
          ideas: state.ideas.filter((i) => i.goalId !== id),
        });
      },

      reopenGoal: (id) => {
        set({
          goals: get().goals.map((g) =>
            g.id === id
              ? { ...g, status: "active", completedAt: undefined, droppedAt: undefined }
              : g,
          ),
        });
      },

      // ───────── Projects ─────────
      createProject: (payload) => {
        const id = uid();
        const project: Project = {
          id,
          goalId: payload.goalId,
          title: payload.title,
          status: payload.status ?? "active",
          description: payload.description,
          references: payload.references ?? [],
          createdAt: nowISO(),
          isDraft: payload.isDraft ?? false,
        };
        set({ projects: [...get().projects, project] });
        return id;
      },

      updateProject: (id, partial) => {
        set({
          projects: get().projects.map((p) =>
            p.id === id ? { ...p, ...partial, updatedAt: nowISO() } : p,
          ),
        });
      },

      markProjectComplete: (id) => {
        set({
          projects: get().projects.map((p) =>
            p.id === id ? { ...p, status: "completed", completedAt: nowISO() } : p,
          ),
        });
      },

      dropProject: (id) => {
        const at = nowISO();
        const state = get();
        set({
          projects: state.projects.map((p) =>
            p.id === id ? { ...p, status: "dropped", droppedAt: at } : p,
          ),
          actions: state.actions.map((a) =>
            a.projectId === id && !TERMINAL_ACTION_STATUSES.includes(a.status)
              ? { ...a, status: "dropped", droppedAt: at }
              : a,
          ),
          rituals: state.rituals.map((r) =>
            r.projectId === id && r.status === "active"
              ? { ...r, status: "archived", archivedAt: at }
              : r,
          ),
        });
      },

      deleteProject: (id) => {
        const state = get();
        set({
          projects: state.projects.filter((p) => p.id !== id),
          actions: state.actions.filter((a) => a.projectId !== id),
          rituals: state.rituals.filter((r) => r.projectId !== id),
        });
      },

      moveProjectToGoal: (projectId, newGoalId) => {
        const state = get();
        set({
          projects: state.projects.map((p) =>
            p.id === projectId ? { ...p, goalId: newGoalId, updatedAt: nowISO() } : p,
          ),
          // Cascade goalId on the project's actions to keep parent integrity.
          actions: state.actions.map((a) =>
            a.projectId === projectId ? { ...a, goalId: newGoalId } : a,
          ),
        });
      },

      // ───────── Actions ─────────
      createAction: (payload) => {
        const state = get();
        const id = uid();
        let goalId = payload.goalId;
        if (!goalId && payload.projectId) {
          const proj = state.projects.find((p) => p.id === payload.projectId);
          if (proj) goalId = proj.goalId;
        }
        if (!goalId) {
          // fall back to settings default or first active goal
          goalId =
            state.settings.defaultGoalId ??
            state.goals.find((g) => g.status === "active")?.id ??
            state.goals[0]?.id;
        }
        const status: ActionStatus =
          payload.status ?? (payload.scheduledDate ? "planned" : "backlog");
        const at = nowISO();
        // For retroactive creation (e.g. logging a Done action against a past day),
        // honor terminal timestamps from the payload instead of forcing them to "now".
        const completedAt =
          payload.completedAt ?? (status === "done" ? at : undefined);
        const delegatedAt =
          payload.delegatedAt ?? (status === "delegated" ? at : undefined);
        const droppedAt =
          payload.droppedAt ?? (status === "dropped" ? at : undefined);
        const cancelledAt =
          payload.cancelledAt ?? (status === "cancelled" ? at : undefined);
        const plannedAt =
          (payload as Partial<Action>).plannedAt ?? (status === "planned" ? at : undefined);
        const createdLabel: Record<ActionStatus, string> = {
          backlog: "Backlog",
          planned: "Planned",
          done: "Done",
          delegated: "Delegated",
          dropped: "Dropped",
          cancelled: "Cancelled",
        };
        const action: Action = {
          id,
          title: payload.title,
          goalId: goalId!,
          projectId: payload.projectId ?? null,
          status,
          scheduledDate: payload.scheduledDate,
          notes: payload.notes,
          impact: payload.impact ?? 0,
          energyCost: payload.energyCost,
          focusCost: payload.focusCost,
          timeEstimateMinutes: payload.timeEstimateMinutes,
          delegateName: payload.delegateName,
          delegateNote: payload.delegateNote,
          expectedReturnDate: payload.expectedReturnDate,
          plannedAt,
          completedAt,
          delegatedAt,
          droppedAt,
          cancelledAt,
          timeline: [{ at, text: `Created in ${createdLabel[status]}` }],
          createdAt: at,
        };
        set({ actions: [...state.actions, action] });
        return id;
      },

      updateAction: (id, partial) => {
        set({
          actions: get().actions.map((a) =>
            a.id === id ? { ...a, ...partial, updatedAt: nowISO() } : a,
          ),
        });
      },

      changeActionStatus: (id, newStatus, statusPayload) => {
        const at = nowISO();
        set({
          actions: get().actions.map((a) => {
            if (a.id !== id) return a;
            const next: Action = { ...a, status: newStatus, updatedAt: at };
            // Clear only the *terminal* timestamps; keep plannedAt and
            // delegatedAt as historical breadcrumbs across re-opens.
            next.completedAt = undefined;
            next.droppedAt = undefined;
            next.cancelledAt = undefined;
            let text = `Status → ${newStatus}`;
            switch (newStatus) {
              case "done":
                next.completedAt = at;
                text = "Marked Done";
                break;
              case "delegated":
                next.delegatedAt = at;
                if (statusPayload?.delegateName) next.delegateName = statusPayload.delegateName;
                if (statusPayload?.delegateNote) next.delegateNote = statusPayload.delegateNote;
                if (statusPayload?.expectedReturnDate)
                  next.expectedReturnDate = statusPayload.expectedReturnDate;
                text = `Delegated${next.delegateName ? ` to ${next.delegateName}` : ""}`;
                break;
              case "dropped":
                next.droppedAt = at;
                text = "Dropped";
                break;
              case "cancelled":
                next.cancelledAt = at;
                text = "Cancelled";
                break;
              case "planned":
                if (statusPayload?.scheduledDate) next.scheduledDate = statusPayload.scheduledDate;
                if (!next.plannedAt) next.plannedAt = at;
                text = `Scheduled${next.scheduledDate ? ` for ${next.scheduledDate}` : ""} (Planned)`;
                break;
              case "backlog":
                // Keep scheduledDate & plannedAt as history.
                text = "Re-opened in Backlog";
                break;
            }
            next.timeline = [...a.timeline, { at, text }];
            return next;
          }),
        });
      },

      deleteAction: (id) => {
        set({ actions: get().actions.filter((a) => a.id !== id) });
      },

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
        const goalId =
          payload.goalId ??
          state.settings.defaultGoalId ??
          state.goals.find((g) => g.status === "active")?.id ??
          state.goals[0]?.id;
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

      convertIdeaToAction: (ideaId, actionPayload) => {
        const state = get();
        const idea = state.ideas.find((i) => i.id === ideaId);
        if (!idea) return "";
        const newId = state.createAction({
          title: actionPayload.title || idea.title,
          notes: actionPayload.notes ?? idea.note,
          projectId: actionPayload.projectId ?? null,
          goalId: actionPayload.goalId ?? idea.goalId,
          impact: actionPayload.impact ?? 0,
          ...actionPayload,
        });
        set({
          ideas: get().ideas.map((i) =>
            i.id === ideaId ? { ...i, status: "converted_to_action", convertedToId: newId } : i,
          ),
        });
        return newId;
      },

      convertIdeaToProject: (ideaId, projectPayload) => {
        const state = get();
        const idea = state.ideas.find((i) => i.id === ideaId);
        if (!idea) return "";
        const newId = state.createProject({
          title: projectPayload.title || idea.title,
          goalId: projectPayload.goalId ?? idea.goalId,
          description: projectPayload.description ?? idea.note,
          references: projectPayload.references ?? [],
        });
        set({
          ideas: get().ideas.map((i) =>
            i.id === ideaId ? { ...i, status: "converted_to_project", convertedToId: newId } : i,
          ),
        });
        return newId;
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

      setSubscriptionTier: (tier: "free" | "pro") => {
        set({ settings: { ...get().settings, subscriptionTier: tier } });
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
          goals: [],
          projects: [],
          actions: [],
          rituals: [],
          ideas: [],
          dayEntries: [],
          sessions: [],
        }),

      seedSampleData: () => {
        const stamp = (arr: any[]) => arr.map((x) => ({ ...x, isSample: true }));
        set({
          goals: stamp(SEED_GOALS),
          projects: stamp(SEED_PROJECTS),
          actions: stamp(SEED_ACTIONS),
          rituals: stamp(SEED_RITUALS),
          ideas: stamp(SEED_IDEAS),
          dayEntries: SEED_DAY_ENTRIES,
        });
      },

      clearSampleData: () => {
        const s = get();
        set({
          goals: s.goals.filter((g) => !g.isSample),
          projects: s.projects.filter((p) => !p.isSample),
          actions: s.actions.filter((a) => !a.isSample),
          rituals: s.rituals.filter((r) => !r.isSample),
          ideas: s.ideas.filter((i) => !i.isSample),
        });
      },

      setUserName: (name: string) =>
        set({ settings: { ...get().settings, userName: name } }),
    },
    {
      name: "actos-store",
      version: 2,
      storage: createJSONStorage(() => localStorage),
      // Persist everything except transient UI state.
      partialize: (state) => ({
        goals: state.goals,
        projects: state.projects,
        actions: state.actions,
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
  activeGoals: (s: StoreState) => s.goals.filter((g) => g.status === "active"),
  goalById: (s: StoreState, id: ID) => s.goals.find((g) => g.id === id),
  projectById: (s: StoreState, id: ID) => s.projects.find((p) => p.id === id),
  actionById: (s: StoreState, id: ID) => s.actions.find((a) => a.id === id),
  ritualById: (s: StoreState, id: ID) => s.rituals.find((r) => r.id === id),
  ideaById: (s: StoreState, id: ID) => s.ideas.find((i) => i.id === id),

  projectsByGoal: (s: StoreState, goalId: ID) =>
    s.projects.filter((p) => p.goalId === goalId && !p.isDraft),
  /** All projects excluding drafts. */
  visibleProjects: (s: StoreState) => s.projects.filter((p) => !p.isDraft),
  actionsByProject: (s: StoreState, projectId: ID) =>
    s.actions.filter((a) => a.projectId === projectId),
  actionsByGoal: (s: StoreState, goalId: ID) => s.actions.filter((a) => a.goalId === goalId),
  ritualsByGoal: (s: StoreState, goalId: ID) =>
    s.rituals.filter((r) => r.goalId === goalId && r.status === "active"),
  ideasByGoal: (s: StoreState, goalId: ID) => s.ideas.filter((i) => i.goalId === goalId),

  // sum of impact for non-dropped/non-cancelled actions in a project
  projectCost: (s: StoreState, projectId: ID) =>
    s.actions
      .filter(
        (a) =>
          a.projectId === projectId &&
          a.status !== "dropped" &&
          a.status !== "cancelled",
      )
      .reduce((sum, a) => sum + (a.impact ?? 0), 0),

  projectProgress: (s: StoreState, projectId: ID): { outcome: number; effort: number } => {
    const acts = s.actions.filter(
      (a) =>
        a.projectId === projectId &&
        a.status !== "dropped" &&
        a.status !== "cancelled",
    );
    const total = acts.reduce((sum, a) => sum + (a.impact ?? 0), 0);
    if (total === 0) return { outcome: 0, effort: 0 };
    const done = acts
      .filter((a) => a.status === "done")
      .reduce((sum, a) => sum + (a.impact ?? 0), 0);
    const doneOrDelegated = acts
      .filter((a) => a.status === "done" || a.status === "delegated")
      .reduce((sum, a) => sum + (a.impact ?? 0), 0);
    return {
      outcome: Math.round((doneOrDelegated / total) * 100),
      effort: Math.round((done / total) * 100),
    };
  },

  goalCost: (s: StoreState, goalId: ID) =>
    s.projects
      .filter((p) => p.goalId === goalId && p.status === "active")
      .reduce((sum, p) => sum + selectors.projectCost(s, p.id), 0),

  goalProgress: (s: StoreState, goalId: ID): { outcome: number; effort: number } => {
    const projs = s.projects.filter((p) => p.goalId === goalId && p.status === "active");
    if (projs.length === 0) return { outcome: 0, effort: 0 };
    const sums = projs.reduce(
      (acc, p) => {
        const pr = selectors.projectProgress(s, p.id);
        const cost = selectors.projectCost(s, p.id);
        acc.outcome += pr.outcome * cost;
        acc.effort += pr.effort * cost;
        acc.weight += cost;
        return acc;
      },
      { outcome: 0, effort: 0, weight: 0 },
    );
    if (sums.weight === 0) return { outcome: 0, effort: 0 };
    return {
      outcome: Math.round(sums.outcome / sums.weight),
      effort: Math.round(sums.effort / sums.weight),
    };
  },

  ritualMultiplier: (s: StoreState, ritualId: ID) => {
    const r = s.rituals.find((x) => x.id === ritualId);
    return r ? ritualMultiplier(r.totalCompletions) : 1.0;
  },

  ritualEffectiveImpact: (s: StoreState, ritualId: ID) => {
    const r = s.rituals.find((x) => x.id === ritualId);
    if (!r) return 0;
    return r.baseImpact * ritualMultiplier(r.totalCompletions);
  },

  // 'active' if any descendant action progressed in the last 7 days, else 'stalled'.
  stateIndicator: (
    s: StoreState,
    entityType: "goal" | "project",
    entityId: ID,
  ): "active" | "stalled" => {
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const inScope = (a: Action) =>
      entityType === "goal" ? a.goalId === entityId : a.projectId === entityId;
    const recent = s.actions.some((a) => {
      if (!inScope(a)) return false;
      const t = a.completedAt ?? a.delegatedAt ?? a.updatedAt ?? a.createdAt;
      return new Date(t).getTime() >= cutoff;
    });
    return recent ? "active" : "stalled";
  },

  todaysActions: (s: StoreState) => {
    const today = todayISO();
    return s.actions.filter(
      (a) => a.scheduledDate === today && a.status === "planned",
    );
  },

  todaysPendingRituals: (s: StoreState) => {
    const today = todayISO();
    return s.rituals.filter(
      (r) =>
        r.status === "active" &&
        !r.completionHistory.some((c) => c.date === today),
    );
  },

  overdueDelegations: (s: StoreState) => {
    const today = todayISO();
    return s.actions.filter(
      (a) =>
        a.status === "delegated" &&
        a.expectedReturnDate &&
        a.expectedReturnDate < today,
    );
  },

  // Sidebar lifetime counters
  lifetimeCounters: (s: StoreState) => ({
    projectsClosed: s.projects.filter((p) => p.status === "completed").length,
    actionsDone: s.actions.filter((a) => a.status === "done").length,
  }),
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
