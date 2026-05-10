import React from "react";
import { useTranslation } from "react-i18next";
import { Tooltip } from "@/components/Tooltip";
import { useStore } from "@/store/useStore";
import { computeTimeStats, formatHM, formatDateLabel } from "@/lib/timeStats";
import { HistoryHint } from "@/components/LockModal";

const DEFAULT_PROJECT_LIMIT = 5;

const TimeSparkline: React.FC<{
  series: number[];
  color: string;
  yMax: number;
  goalTitle: string;
}> = ({ series, color, yMax, goalTitle }) => {
  const { t } = useTranslation();
  return (
    <div className="w-full h-8 flex items-end gap-[1px]">
      {series.map((v, i) => {
        const h = v === 0 ? 0 : Math.max(2, Math.round((v / yMax) * 32));
        const daysAgo = series.length - 1 - i;
        const tip = (
          <div className="font-mono text-[11px] leading-snug">
            <div className="text-text-primary">
              {formatDateLabel(daysAgo)} — {v === 0 ? "0" : formatHM(v)}
            </div>
            <div className="text-text-tertiary">{t("timeInvest.tooltip.onGoal", { goal: goalTitle })}</div>
          </div>
        );
        return (
          <Tooltip key={i} content={tip} className="flex-1 h-full flex items-end">
            <div
              className="w-full hover:brightness-[1.15]"
              style={{
                height: h || 1,
                background: v === 0 ? "hsl(var(--border-subtle))" : color,
                opacity: v === 0 ? 0.4 : 1,
                transition: "filter 80ms ease",
              }}
            />
          </Tooltip>
        );
      })}
    </div>
  );
};

const ProjectRow: React.FC<{
  title: string;
  color: string;
  total30d: number;
  totalAllTime: number;
  pctOfGoal: number;
}> = ({ title, color, total30d, totalAllTime, pctOfGoal }) => {
  const { t } = useTranslation();
  const tip = (
    <div className="font-mono text-[11px] leading-snug">
      <div className="text-text-primary">{title}</div>
      <div className="text-text-tertiary">{t("timeInvest.tooltip.allTime", { time: formatHM(totalAllTime) })}</div>
    </div>
  );
  return (
    <Tooltip content={tip} className="block">
      <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-3 py-1 pl-6 hover:bg-surface-hover rounded-[3px] transition-colors">
        <div className="md:w-[200px] shrink-0 min-w-0 flex items-center gap-1.5">
          <span className="font-mono text-[12px] text-text-tertiary leading-none">└</span>
          <span className="text-[13px] text-text-secondary truncate">{title}</span>
        </div>
        <div className="flex-1 min-w-0 h-4 flex items-center">
          <div className="w-full h-1.5 rounded-[2px] bg-surface-hover overflow-hidden">
            <div
              className="h-full rounded-[2px]"
              style={{
                width: `${Math.max(2, pctOfGoal)}%`,
                background: color,
                opacity: 0.6,
              }}
            />
          </div>
        </div>
        <div className="md:w-[160px] shrink-0 md:text-right">
          <span className="font-mono text-[12px] tabular-nums text-text-secondary">
            {formatHM(total30d)}
          </span>
        </div>
      </div>
    </Tooltip>
  );
};

export const TimeInvestmentSection: React.FC = () => {
  const actions = useStore((s) => s.actions);
  const goals = useStore((s) => s.goals);
  const projects = useStore((s) => s.projects);
  const settings = useStore((s) => s.settings);
  const isFree = settings.subscriptionTier !== "all-in";

  const stats = React.useMemo(
    () => computeTimeStats(actions, goals, 30, new Date(), projects),
    [actions, goals, projects],
  );
  const [expanded, setExpanded] = React.useState<Record<string, boolean>>({});
  if (!stats.hasAny && stats.perGoal.length === 0) return null;

  return (
    <section>
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-tertiary">
          Time investment
        </h2>
        <div className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-tertiary tabular-nums">
          {formatHM(stats.total30d)} LAST 30 DAYS · {formatHM(stats.totalAllTime)} ALL-TIME
        </div>
      </div>

      <div className="bg-surface-elevated border border-border-subtle rounded-[6px] p-4">
        {stats.perGoal.map(({ goal, total30d, totalAllTime, series30d, perProject, isClosed }, idx) => {
          const pct =
            stats.total30d > 0 ? Math.round((total30d / stats.total30d) * 100) : 0;
          const color = `hsl(var(--${goal.color}))`;
          const isExpanded = !!expanded[goal.id];
          const hasOverflow = perProject.length > DEFAULT_PROJECT_LIMIT;
          const visibleProjects =
            isExpanded || !hasOverflow
              ? perProject
              : perProject.slice(0, DEFAULT_PROJECT_LIMIT);
          const projMax = Math.max(1, ...perProject.map((p) => p.total30d));

          return (
            <div
              key={goal.id}
              className={
                idx > 0
                  ? "pt-3 mt-3 border-t border-border-subtle"
                  : ""
              }
            >
              {/* Goal row */}
              <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
                <div className="md:w-[220px] shrink-0 min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ background: color }}
                    />
                    <span className="text-[14px] text-text-primary truncate">
                      {goal.title}
                    </span>
                    {isClosed && (
                      <span className="font-mono text-[9px] uppercase tracking-[0.06em] text-text-tertiary border border-border-subtle rounded-[2px] px-1 py-px shrink-0">
                        Closed
                      </span>
                    )}
                  </div>
                  <div className="font-mono text-[11px] text-text-tertiary tabular-nums mt-0.5 pl-4">
                    {pct}% of last 30d
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <TimeSparkline
                    series={series30d}
                    color={color}
                    yMax={stats.yMax}
                    goalTitle={goal.title}
                  />
                </div>

                <div className="md:w-[160px] shrink-0 flex md:block items-baseline justify-between md:text-right gap-4">
                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-[0.06em] text-text-tertiary">
                      30 days
                    </div>
                    <div className="text-[14px] font-medium tabular-nums text-text-primary">
                      {formatHM(total30d)}
                    </div>
                  </div>
                  <div className="md:mt-1.5">
                    <div className="font-mono text-[10px] uppercase tracking-[0.06em] text-text-tertiary">
                      All-time
                    </div>
                    <div className="font-mono text-[12px] tabular-nums text-text-secondary">
                      {formatHM(totalAllTime)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Projects */}
              {perProject.length === 0 ? (
                <div className="pl-6 mt-1.5 italic text-text-tertiary text-[12px]">
                  No time invested in this goal yet
                </div>
              ) : (
                <div
                  className="mt-2 space-y-0.5 overflow-hidden transition-[max-height] duration-200 ease-out"
                  style={{ maxHeight: isExpanded ? `${perProject.length * 40 + 40}px` : `${visibleProjects.length * 40 + 40}px` }}
                >
                  {visibleProjects.map((p) => (
                    <ProjectRow
                      key={p.project.id}
                      title={p.project.title}
                      color={color}
                      total30d={p.total30d}
                      totalAllTime={p.totalAllTime}
                      pctOfGoal={projMax > 0 ? (p.total30d / projMax) * 100 : 0}
                    />
                  ))}
                  {hasOverflow && (
                    <button
                      type="button"
                      onClick={() =>
                        setExpanded((m) => ({ ...m, [goal.id]: !m[goal.id] }))
                      }
                      className="font-mono text-[11px] text-text-tertiary hover:text-text-secondary transition-colors pl-6 py-1"
                    >
                      {isExpanded
                        ? "Show fewer ▴"
                        : `+ ${perProject.length - DEFAULT_PROJECT_LIMIT} more projects ▾`}
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {isFree && <HistoryHint>Showing last 90 days · </HistoryHint>}
    </section>
  );
};

export default TimeInvestmentSection;
