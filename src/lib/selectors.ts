// Computed selectors over the TanStack Query cache.
//
// Convention: every selector here ships in two variants.
//   1. Reactive hook — `useGoalById(id)`. Use inside React component bodies.
//      Subscribes to query updates; consumers re-render when the underlying
//      data changes.
//   2. Plain function — `selectGoalById(queryClient, id)`. Use in event
//      handlers, callbacks, or any non-React code path. One-shot read against
//      `queryClient.getQueryData(...)`. Does NOT subscribe — the caller is
//      responsible for invalidation/refetch awareness.
//
// Selectors that depend only on Goals live here today; cross-entity selectors
// (projectCost, goalProgress, etc.) join over the next tasks as projects and
// actions migrate out of Zustand.

import { useMemo } from "react";
import type { QueryClient } from "@tanstack/react-query";
import { useGoalsQuery } from "./queries/useGoals";
import { useProjectsQuery } from "./queries/useProjects";
import { useActionsQuery } from "./queries/useActions";
import { queryKeys } from "./queryKeys";
import type { Action, Goal, ID, ISODate, Project } from "@/types";

function todayISO(): ISODate {
  return new Date().toISOString().slice(0, 10);
}

// ────── activeGoals ──────

export function useActiveGoals(): Goal[] {
  const { data: goals } = useGoalsQuery();
  return useMemo(() => (goals ?? []).filter((g) => g.status === "active"), [goals]);
}

export function selectActiveGoals(queryClient: QueryClient): Goal[] {
  const goals = queryClient.getQueryData<Goal[]>(queryKeys.goals) ?? [];
  return goals.filter((g) => g.status === "active");
}

// ────── goalById ──────

export function useGoalById(id: ID | undefined): Goal | undefined {
  const { data: goals } = useGoalsQuery();
  return useMemo(
    () => (id ? (goals ?? []).find((g) => g.id === id) : undefined),
    [goals, id],
  );
}

export function selectGoalById(queryClient: QueryClient, id: ID): Goal | undefined {
  const goals = queryClient.getQueryData<Goal[]>(queryKeys.goals) ?? [];
  return goals.find((g) => g.id === id);
}

// ────── projectById ──────

export function useProjectById(id: ID | undefined): Project | undefined {
  const { data: projects } = useProjectsQuery();
  return useMemo(
    () => (id ? (projects ?? []).find((p) => p.id === id) : undefined),
    [projects, id],
  );
}

export function selectProjectById(queryClient: QueryClient, id: ID): Project | undefined {
  const projects = queryClient.getQueryData<Project[]>(queryKeys.projects) ?? [];
  return projects.find((p) => p.id === id);
}

// ────── projectsByGoal (excludes drafts) ──────

export function useProjectsByGoal(goalId: ID | undefined): Project[] {
  const { data: projects } = useProjectsQuery();
  return useMemo(
    () =>
      goalId
        ? (projects ?? []).filter((p) => p.goalId === goalId && !p.isDraft)
        : [],
    [projects, goalId],
  );
}

export function selectProjectsByGoal(queryClient: QueryClient, goalId: ID): Project[] {
  const projects = queryClient.getQueryData<Project[]>(queryKeys.projects) ?? [];
  return projects.filter((p) => p.goalId === goalId && !p.isDraft);
}

// ────── visibleProjects (all projects excluding drafts) ──────

export function useVisibleProjects(): Project[] {
  const { data: projects } = useProjectsQuery();
  return useMemo(() => (projects ?? []).filter((p) => !p.isDraft), [projects]);
}

export function selectVisibleProjects(queryClient: QueryClient): Project[] {
  const projects = queryClient.getQueryData<Project[]>(queryKeys.projects) ?? [];
  return projects.filter((p) => !p.isDraft);
}

// ────── projectCost / goalCost / projectProgress / goalProgress / lifetimeCounters ──────
// All compute over the actions cache. projectCost is exported on its own row
// below alongside the other action-related selectors.

function actionImpactSum(actions: Action[], projectId: ID): number {
  return actions
    .filter(
      (a) =>
        a.projectId === projectId &&
        a.status !== "dropped" &&
        a.status !== "cancelled",
    )
    .reduce((sum, a) => sum + (a.impact ?? 0), 0);
}

export function useGoalCost(goalId: ID): number {
  const { data: projects } = useProjectsQuery();
  const { data: actions } = useActionsQuery();
  return useMemo(() => {
    return (projects ?? [])
      .filter((p) => p.goalId === goalId && p.status === "active")
      .reduce((sum, p) => sum + actionImpactSum(actions ?? [], p.id), 0);
  }, [projects, actions, goalId]);
}

export function selectGoalCost(queryClient: QueryClient, goalId: ID): number {
  const projects = queryClient.getQueryData<Project[]>(queryKeys.projects) ?? [];
  const actions = queryClient.getQueryData<Action[]>(queryKeys.actions) ?? [];
  return projects
    .filter((p) => p.goalId === goalId && p.status === "active")
    .reduce((sum, p) => sum + actionImpactSum(actions, p.id), 0);
}

export interface ProgressPair {
  outcome: number;
  effort: number;
}

function projectProgressInternal(
  actions: Action[],
  projectId: ID,
): ProgressPair {
  const acts = actions.filter(
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
}

function goalProgressInternal(
  projects: Project[],
  actions: Action[],
  goalId: ID,
): ProgressPair {
  const projs = projects.filter((p) => p.goalId === goalId && p.status === "active");
  if (projs.length === 0) return { outcome: 0, effort: 0 };
  const sums = projs.reduce(
    (acc, p) => {
      const pr = projectProgressInternal(actions, p.id);
      const cost = actionImpactSum(actions, p.id);
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
}

export function useGoalProgress(goalId: ID): ProgressPair {
  const { data: projects } = useProjectsQuery();
  const { data: actions } = useActionsQuery();
  return useMemo(
    () => goalProgressInternal(projects ?? [], actions ?? [], goalId),
    [projects, actions, goalId],
  );
}

export function selectGoalProgress(queryClient: QueryClient, goalId: ID): ProgressPair {
  const projects = queryClient.getQueryData<Project[]>(queryKeys.projects) ?? [];
  const actions = queryClient.getQueryData<Action[]>(queryKeys.actions) ?? [];
  return goalProgressInternal(projects, actions, goalId);
}

export interface LifetimeCounters {
  projectsClosed: number;
  actionsDone: number;
}

export function useLifetimeCounters(): LifetimeCounters {
  const { data: projects } = useProjectsQuery();
  const { data: actions } = useActionsQuery();
  return useMemo(
    () => ({
      projectsClosed: (projects ?? []).filter((p) => p.status === "completed").length,
      actionsDone: (actions ?? []).filter((a) => a.status === "done").length,
    }),
    [projects, actions],
  );
}

export function selectLifetimeCounters(queryClient: QueryClient): LifetimeCounters {
  const projects = queryClient.getQueryData<Project[]>(queryKeys.projects) ?? [];
  const actions = queryClient.getQueryData<Action[]>(queryKeys.actions) ?? [];
  return {
    projectsClosed: projects.filter((p) => p.status === "completed").length,
    actionsDone: actions.filter((a) => a.status === "done").length,
  };
}

// ────── action selectors (single-entity reads) ──────

export function useActionById(id: ID | undefined): Action | undefined {
  const { data: actions } = useActionsQuery();
  return useMemo(
    () => (id ? (actions ?? []).find((a) => a.id === id) : undefined),
    [actions, id],
  );
}

export function selectActionById(queryClient: QueryClient, id: ID): Action | undefined {
  const actions = queryClient.getQueryData<Action[]>(queryKeys.actions) ?? [];
  return actions.find((a) => a.id === id);
}

export function useActionsByProject(projectId: ID | undefined): Action[] {
  const { data: actions } = useActionsQuery();
  return useMemo(
    () =>
      projectId
        ? (actions ?? []).filter((a) => a.projectId === projectId)
        : [],
    [actions, projectId],
  );
}

export function selectActionsByProject(queryClient: QueryClient, projectId: ID): Action[] {
  const actions = queryClient.getQueryData<Action[]>(queryKeys.actions) ?? [];
  return actions.filter((a) => a.projectId === projectId);
}

export function useActionsByGoal(goalId: ID | undefined): Action[] {
  const { data: actions } = useActionsQuery();
  return useMemo(
    () =>
      goalId ? (actions ?? []).filter((a) => a.goalId === goalId) : [],
    [actions, goalId],
  );
}

export function selectActionsByGoal(queryClient: QueryClient, goalId: ID): Action[] {
  const actions = queryClient.getQueryData<Action[]>(queryKeys.actions) ?? [];
  return actions.filter((a) => a.goalId === goalId);
}

// ────── projectCost ──────
// Sum of impact for non-terminal actions in a project.

export function useProjectCost(projectId: ID): number {
  const { data: actions } = useActionsQuery();
  return useMemo(
    () => actionImpactSum(actions ?? [], projectId),
    [actions, projectId],
  );
}

export function selectProjectCost(queryClient: QueryClient, projectId: ID): number {
  const actions = queryClient.getQueryData<Action[]>(queryKeys.actions) ?? [];
  return actionImpactSum(actions, projectId);
}

// ────── projectProgress ──────

export function useProjectProgress(projectId: ID): ProgressPair {
  const { data: actions } = useActionsQuery();
  return useMemo(
    () => projectProgressInternal(actions ?? [], projectId),
    [actions, projectId],
  );
}

export function selectProjectProgress(queryClient: QueryClient, projectId: ID): ProgressPair {
  const actions = queryClient.getQueryData<Action[]>(queryKeys.actions) ?? [];
  return projectProgressInternal(actions, projectId);
}

// ────── stateIndicator ──────
// 'active' if any descendant action progressed in the last 7 days, else 'stalled'.

export type StateIndicator = "active" | "stalled";

function stateIndicatorInternal(
  actions: Action[],
  entityType: "goal" | "project",
  entityId: ID,
): StateIndicator {
  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const inScope = (a: Action) =>
    entityType === "goal" ? a.goalId === entityId : a.projectId === entityId;
  const recent = actions.some((a) => {
    if (!inScope(a)) return false;
    const t = a.completedAt ?? a.delegatedAt ?? a.updatedAt ?? a.createdAt;
    return new Date(t).getTime() >= cutoff;
  });
  return recent ? "active" : "stalled";
}

export function useStateIndicator(
  entityType: "goal" | "project",
  entityId: ID,
): StateIndicator {
  const { data: actions } = useActionsQuery();
  return useMemo(
    () => stateIndicatorInternal(actions ?? [], entityType, entityId),
    [actions, entityType, entityId],
  );
}

export function selectStateIndicator(
  queryClient: QueryClient,
  entityType: "goal" | "project",
  entityId: ID,
): StateIndicator {
  const actions = queryClient.getQueryData<Action[]>(queryKeys.actions) ?? [];
  return stateIndicatorInternal(actions, entityType, entityId);
}

// ────── todaysActions / overdueDelegations (page-level lists) ──────

export function useTodaysActions(): Action[] {
  const { data: actions } = useActionsQuery();
  return useMemo(() => {
    const today = todayISO();
    return (actions ?? []).filter(
      (a) => a.scheduledDate === today && a.status === "planned",
    );
  }, [actions]);
}

export function selectTodaysActions(queryClient: QueryClient): Action[] {
  const actions = queryClient.getQueryData<Action[]>(queryKeys.actions) ?? [];
  const today = todayISO();
  return actions.filter((a) => a.scheduledDate === today && a.status === "planned");
}

export function useOverdueDelegations(): Action[] {
  const { data: actions } = useActionsQuery();
  return useMemo(() => {
    const today = todayISO();
    return (actions ?? []).filter(
      (a) =>
        a.status === "delegated" &&
        a.expectedReturnDate &&
        a.expectedReturnDate < today,
    );
  }, [actions]);
}

export function selectOverdueDelegations(queryClient: QueryClient): Action[] {
  const actions = queryClient.getQueryData<Action[]>(queryKeys.actions) ?? [];
  const today = todayISO();
  return actions.filter(
    (a) =>
      a.status === "delegated" &&
      a.expectedReturnDate &&
      a.expectedReturnDate < today,
  );
}
