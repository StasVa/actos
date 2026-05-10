import React from "react";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
  const goals = useStore((s) => s.goals);
  const projects = useStore((s) => s.projects);
  const goalById = (id: string) => goals.find((g) => g.id === id);
  const projectById = (id: string) => projects.find((p) => p.id === id);

  if (outcome.valueAdded === 0 && !outcome.hadOutcomeButNoneOnActiveGoals) return null;

  return (
    <section>
      <SectionHead meta={t("outcome.totalMeta", { value: outcome.valueAdded })}>
        {t("outcome.heading")}
      </SectionHead>
      {outcome.outcomePerGoal.length === 0 ? (
        <div className="text-[13px] text-text-tertiary italic">
          {t(`outcome.empty.${period}` as const)}
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
                      {t("outcome.actionsDone", { count: row.actionsCount })}
                      {row.delegatedCount > 0 &&
                        t("outcome.delegatedSuffix", { count: row.delegatedCount })}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[18px] sm:text-[20px] tabular-nums text-text-primary leading-tight">
                      +{row.impactAdded}
                    </div>
                    <div className="font-mono text-[12px] text-text-tertiary tabular-nums">
                      {row.percentageOfGoalCost > 0
                        ? t("outcome.percentOfGoal", { pct: Math.round(row.percentageOfGoalCost) })
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
                            {t("outcome.projectFromActions", {
                              count: p.actionsCount,
                              value: p.impactAdded,
                            })}
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
