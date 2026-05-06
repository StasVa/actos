import React from "react";
import { Tooltip } from "@/components/Tooltip";
import { useStore } from "@/store/useStore";
import { computeTimeStats, formatHM, formatDateLabel } from "@/lib/timeStats";
import { SectionLabel } from "@/pages/Index";

const TimeSparkline: React.FC<{
  series: number[];
  color: string;
  yMax: number;
  goalTitle: string;
}> = ({ series, color, yMax, goalTitle }) => {
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
            <div className="text-text-tertiary">on {goalTitle}</div>
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

export const TimeInvestmentSection: React.FC = () => {
  const actions = useStore((s) => s.actions);
  const goals = useStore((s) => s.goals);

  const stats = React.useMemo(() => computeTimeStats(actions, goals, 30), [actions, goals]);
  if (!stats.hasAny) return null;

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

      <div className="bg-surface-elevated border border-border-subtle rounded-[6px] p-4 space-y-4">
        {stats.perGoal.map(({ goal, total30d, totalAllTime, series30d }) => {
          const pct =
            stats.total30d > 0 ? Math.round((total30d / stats.total30d) * 100) : 0;
          const color = `hsl(var(--${goal.color}))`;
          return (
            <div
              key={goal.id}
              className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4"
            >
              {/* Label */}
              <div className="md:w-[220px] shrink-0 min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: color }}
                  />
                  <span className="text-[14px] text-text-primary truncate">
                    {goal.title}
                  </span>
                </div>
                <div className="font-mono text-[11px] text-text-tertiary tabular-nums mt-0.5 pl-4">
                  {pct}% of last 30d
                </div>
              </div>

              {/* Sparkline */}
              <div className="flex-1 min-w-0">
                <TimeSparkline
                  series={series30d}
                  color={color}
                  yMax={stats.yMax}
                  goalTitle={goal.title}
                />
              </div>

              {/* Numbers */}
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
          );
        })}
      </div>
    </section>
  );
};

export default TimeInvestmentSection;
