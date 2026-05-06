// Outcome computation shared across Day/Week/Month review drill-downs.
// Outcome = sum of Impact from Done + Delegated actions whose relevant
// timestamp falls in the period, scoped to actions tied to active goals
// (and active projects, when projectId is set).

import type { Action, Goal, ID, Project } from "@/types";

export interface OutcomePerGoalRow {
  goalId: ID;
  impactAdded: number;
  actionsCount: number;
  delegatedCount: number;
  /** % of the goal's current total cost (active projects only). */
  percentageOfGoalCost: number;
  /** Per-project breakdown within the goal. */
  projects: { projectId: ID; impactAdded: number; actionsCount: number }[];
}

export interface OutcomeSummary {
  /** Total Outcome added (all qualifying actions, regardless of goal filter). */
  outcomeAdded: number;
  /** Per-active-goal breakdown. */
  outcomePerGoal: OutcomePerGoalRow[];
  /**
   * True if there were Done/Delegated actions in the period but none of them
   * tied to active goals (e.g., all in dropped goals/projects).
   */
  hadOutcomeButNoneOnActiveGoals: boolean;
}

function isActiveProjectFor(
  projectId: ID | null,
  goalId: ID,
  projects: Project[],
  activeGoalIds: Set<ID>,
): boolean {
  if (!activeGoalIds.has(goalId)) return false;
  if (projectId == null) return true; // goal-level backlog still counts toward goal
  const p = projects.find((x) => x.id === projectId);
  if (!p) return false;
  return p.status === "active" && activeGoalIds.has(p.goalId);
}

/** Computed goal cost = sum of impacts of non-dropped/cancelled actions within active projects of the goal. */
function computeGoalCost(goalId: ID, actions: Action[], projects: Project[]): number {
  const activeProjectIds = new Set(
    projects.filter((p) => p.goalId === goalId && p.status === "active").map((p) => p.id),
  );
  return actions
    .filter(
      (a) =>
        a.projectId != null &&
        activeProjectIds.has(a.projectId) &&
        a.status !== "dropped" &&
        a.status !== "cancelled",
    )
    .reduce((s, a) => s + (a.impact ?? 0), 0);
}

export function getOutcomeSummary(
  done: Action[],
  delegated: Action[],
  goals: Goal[],
  projects: Project[],
  allActions: Action[],
): OutcomeSummary {
  const activeGoals = goals.filter((g) => g.status === "active");
  const activeGoalIds = new Set(activeGoals.map((g) => g.id));

  const qualifying: { a: Action; kind: "done" | "delegated" }[] = [];
  for (const a of done)
    if (isActiveProjectFor(a.projectId, a.goalId, projects, activeGoalIds))
      qualifying.push({ a, kind: "done" });
  for (const a of delegated)
    if (isActiveProjectFor(a.projectId, a.goalId, projects, activeGoalIds))
      qualifying.push({ a, kind: "delegated" });

  const outcomeAdded = qualifying.reduce((s, x) => s + (x.a.impact ?? 0), 0);

  const perGoal: OutcomePerGoalRow[] = activeGoals
    .map((g) => {
      const list = qualifying.filter((x) => x.a.goalId === g.id);
      if (list.length === 0)
        return {
          goalId: g.id,
          impactAdded: 0,
          actionsCount: 0,
          delegatedCount: 0,
          percentageOfGoalCost: 0,
          projects: [],
        };
      const impactAdded = list.reduce((s, x) => s + (x.a.impact ?? 0), 0);
      const actionsCount = list.filter((x) => x.kind === "done").length;
      const delegatedCount = list.filter((x) => x.kind === "delegated").length;
      const cost = computeGoalCost(g.id, allActions, projects);
      const byProject = new Map<ID, { impactAdded: number; actionsCount: number }>();
      for (const { a } of list) {
        if (a.projectId == null) continue;
        const slot = byProject.get(a.projectId) ?? { impactAdded: 0, actionsCount: 0 };
        slot.impactAdded += a.impact ?? 0;
        slot.actionsCount += 1;
        byProject.set(a.projectId, slot);
      }
      const projectRows = Array.from(byProject.entries())
        .map(([projectId, v]) => ({ projectId, ...v }))
        .sort((a, b) => b.impactAdded - a.impactAdded);
      return {
        goalId: g.id,
        impactAdded,
        actionsCount,
        delegatedCount,
        percentageOfGoalCost: cost > 0 ? (impactAdded / cost) * 100 : 0,
        projects: projectRows,
      };
    })
    .filter((row) => row.impactAdded > 0)
    .sort((a, b) => b.impactAdded - a.impactAdded);

  const hadAnyDoneOrDelegated = done.length + delegated.length > 0;
  const hadOutcomeButNoneOnActiveGoals =
    hadAnyDoneOrDelegated && qualifying.length === 0;

  return { outcomeAdded, outcomePerGoal: perGoal, hadOutcomeButNoneOnActiveGoals };
}
