import React from "react";
import { useStore } from "@/store/useStore";
import type { OutcomeSummary } from "@/lib/outcomeUtils";

interface Props {
  outcome: OutcomeSummary;
  period: "day" | "week" | "month";
}

const SectionHead: React.FC<{ children: React.ReactNode; meta?: string }> = ({ children, meta }) => (
  <div className="flex items-baseline justify-between mb-3">
    <h2 className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-tertiary">
      {children}
    </h2>
    {meta && (
      <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-tertiary tabular-nums">
        {meta}
      </span>
    )}
  </div>
);

export const OutcomeAddedSection: React.FC<Props> = ({ outcome, period }) => {
  const goals = useStore((s) => s.goals);
  const projects = useStore((s) => s.projects);
  const goalById = (id: string) => goals.find((g) => g.id === id);
  const projectById = (id: string) => projects.find((p) => p.id === id);

  // Hide when zero outcome and no fallback message needed.
  if (outcome.outcomeAdded === 0 && !outcome.hadOutcomeButNoneOnActiveGoals) return null;

  return (
    <section>
      <SectionHead meta={`+${outcome.outcomeAdded} TOTAL`}>Outcome added</SectionHead>
      {outcome.outcomePerGoal.length === 0 ? (
        <div className="text-[13px] text-text-tertiary italic">
          No outcome added to active goals this {period}.
        </div>
      ) : (
        <div>
          {outcome.outcomePerGoal.map((row) => {
            const g = goalById(row.goalId);
            if (!g) return null;
            const goalColor = `hsl(var(--${g.color}))`;
            const showProjects = row.projects.length > 1;
            return (
              <div
                key={row.goalId}
                className="py-3 border-b border-border-subtle last:border-b-0"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ background: goalColor }}
                      />
                      <span className="text-[14px] text-text-primary truncate">
                        {g.title}
                      </span>
                    </div>
                    <div className="mt-0.5 font-mono text-[12px] text-text-secondary tabular-nums">
                      {row.actionsCount} action{row.actionsCount === 1 ? "" : "s"} done
                      {row.delegatedCount > 0 && `, ${row.delegatedCount} delegated`}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[18px] sm:text-[20px] tabular-nums text-text-primary leading-tight">
                      +{row.impactAdded}
                    </div>
                    <div className="font-mono text-[12px] text-text-tertiary tabular-nums">
                      {row.percentageOfGoalCost > 0
                        ? `${Math.round(row.percentageOfGoalCost)}% of goal`
                        : "—"}
                    </div>
                  </div>
                </div>
                {showProjects && (
                  <div className="mt-2 pl-[18px] space-y-0.5">
                    {row.projects.map((p) => {
                      const proj = projectById(p.projectId);
                      return (
                        <div
                          key={p.projectId}
                          className="flex items-center gap-2 font-mono text-[12px] tabular-nums"
                        >
                          <span className="text-text-tertiary leading-none">└</span>
                          <span className="text-text-secondary truncate flex-1">
                            {proj?.title ?? "—"}
                          </span>
                          <span className="text-text-tertiary">
                            +{p.impactAdded} from {p.actionsCount} action
                            {p.actionsCount === 1 ? "" : "s"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default OutcomeAddedSection;
