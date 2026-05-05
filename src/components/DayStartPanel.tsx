// Day Start / Day Close panel — captures dayType, morning intent, energy,
// and (at end of day) reflection + evening energy. Backed by store.dayEntries.

import React, { useMemo, useState } from "react";
import { useStore } from "@/store/useStore";
import type { DayType } from "@/types";
import { toast } from "sonner";

const TODAY_ISO = new Date().toISOString().slice(0, 10);

const DAY_TYPES: { value: DayType; label: string }[] = [
  { value: "deep", label: "Deep" },
  { value: "light", label: "Light" },
  { value: "admin", label: "Admin" },
  { value: "creative", label: "Creative" },
  { value: "rest", label: "Rest" },
];

const Pill: React.FC<{
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}> = ({ active, onClick, children }) => (
  <button
    type="button"
    onClick={onClick}
    className={`px-2.5 py-1 rounded-[4px] border text-[12px] transition-colors ${
      active
        ? "bg-surface-hover text-text-primary border-accent"
        : "bg-transparent text-text-secondary border-border-default hover:text-text-primary"
    }`}
  >
    {children}
  </button>
);

const Score: React.FC<{
  value: number | undefined;
  onChange: (v: number) => void;
  label: string;
}> = ({ value, onChange, label }) => (
  <div className="flex items-center gap-2">
    <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-text-tertiary w-[80px]">
      {label}
    </span>
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className={`w-6 h-6 rounded-[2px] font-mono text-[11px] transition-colors ${
            value === n
              ? "bg-accent text-text-primary"
              : "bg-surface-hover text-text-tertiary hover:text-text-primary"
          }`}
        >
          {n}
        </button>
      ))}
    </div>
  </div>
);

export const DayStartPanel: React.FC = () => {
  const settings = useStore((s) => s.settings);
  const actions = useStore((s) => s.actions);
  const dayEntries = useStore((s) => s.dayEntries);
  const todaysActions = useMemo(
    () => actions.filter((a) => a.scheduledDate === TODAY_ISO && a.status === "planned"),
    [actions],
  );
  const entry = useMemo(
    () => dayEntries.find((d) => d.date === TODAY_ISO),
    [dayEntries],
  );
  const startDay = useStore((s) => s.startDay);
  const updateDayEntry = useStore((s) => s.updateDayEntry);
  const closeDay = useStore((s) => s.closeDay);

  const started = !!entry?.startedAt;
  const closed = !!entry?.closedAt;

  const [dayType, setDayType] = useState<DayType | undefined>(entry?.dayType);
  const [mainTaskId, setMainTaskId] = useState<string | undefined>(
    entry?.mainTaskActionId,
  );
  const [morningEnergy, setMorningEnergy] = useState<number | undefined>(
    entry?.morningEnergyScore,
  );
  const [intent, setIntent] = useState(entry?.morningIntentNote ?? "");
  const [eveningEnergy, setEveningEnergy] = useState<number | undefined>(
    entry?.eveningEnergyScore,
  );
  const [reflection, setReflection] = useState(entry?.reflectionText ?? "");

  React.useEffect(() => {
    setDayType(entry?.dayType);
    setMainTaskId(entry?.mainTaskActionId);
    setMorningEnergy(entry?.morningEnergyScore);
    setIntent(entry?.morningIntentNote ?? "");
    setEveningEnergy(entry?.eveningEnergyScore);
    setReflection(entry?.reflectionText ?? "");
  }, [entry?.date]);

  const handleStart = () => {
    startDay(TODAY_ISO, dayType, mainTaskId, morningEnergy, intent || undefined);
    toast.success("Day started");
  };

  const handleSave = () => {
    updateDayEntry(TODAY_ISO, {
      dayType,
      mainTaskActionId: mainTaskId,
      morningEnergyScore: morningEnergy,
      morningIntentNote: intent || undefined,
    });
    toast.success("Day updated");
  };

  const handleClose = () => {
    closeDay(TODAY_ISO, eveningEnergy, reflection || undefined);
    toast.success("Day closed");
  };

  return (
    <div className="bg-surface-elevated border border-border-subtle rounded-[6px] p-5 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[14px] font-medium text-text-primary">
            {closed ? "Day closed" : started ? "Today's plan" : "Start your day"}
          </h2>
          <div className="font-mono text-[11px] text-text-tertiary mt-0.5">
            {TODAY_ISO}
            {entry?.startedAt && ` · started ${new Date(entry.startedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}
            {entry?.closedAt && ` · closed ${new Date(entry.closedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}
          </div>
        </div>
        {!started && (
          <button
            type="button"
            onClick={handleStart}
            className="h-9 px-4 text-[13px] font-medium rounded-[4px] border border-[hsl(var(--accent))] text-[hsl(var(--accent))] hover:bg-surface-hover transition-colors"
          >
            Start day
          </button>
        )}
        {started && !closed && (
          <button
            type="button"
            onClick={handleSave}
            className="h-9 px-4 text-[13px] font-medium rounded-[4px] border border-border-default text-text-primary hover:border-[hsl(var(--accent))] hover:bg-surface-hover transition-colors"
          >
            Save
          </button>
        )}
      </div>

      <div>
        <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-text-tertiary mb-2">
          DAY TYPE
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {DAY_TYPES.map((dt) => (
            <Pill
              key={dt.value}
              active={dayType === dt.value}
              onClick={() => setDayType(dt.value)}
            >
              {dt.label}
            </Pill>
          ))}
        </div>
      </div>

      <div>
        <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-text-tertiary mb-2">
          MAIN TASK
        </div>
        <select
          value={mainTaskId ?? ""}
          onChange={(e) => setMainTaskId(e.target.value || undefined)}
          className="w-full bg-surface-hover rounded-[4px] px-3 py-2 text-[13px] text-text-primary outline-none border border-transparent focus:border-border-default"
        >
          <option value="">— Pick from today's planned actions —</option>
          {todaysActions.map((a) => (
            <option key={a.id} value={a.id}>
              {a.title}
            </option>
          ))}
        </select>
      </div>

      {settings.layers.logEnergy && (
        <Score value={morningEnergy} onChange={setMorningEnergy} label="MORNING" />
      )}

      <div>
        <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-text-tertiary mb-2">
          INTENT
        </div>
        <textarea
          value={intent}
          onChange={(e) => setIntent(e.target.value)}
          rows={2}
          placeholder="One sentence: what does success today look like?"
          className="w-full bg-surface-hover rounded-[4px] px-3 py-2 text-[13px] text-text-primary outline-none border border-transparent focus:border-border-default resize-none placeholder:text-text-tertiary"
        />
      </div>

      {started && !closed && (
        <>
          <div className="border-t border-border-subtle pt-5 space-y-5">
            <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-text-secondary">
              CLOSE DAY
            </div>
            {settings.layers.logEnergy && (
              <Score value={eveningEnergy} onChange={setEveningEnergy} label="EVENING" />
            )}
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-text-tertiary mb-2">
                REFLECTION
              </div>
              <textarea
                value={reflection}
                onChange={(e) => setReflection(e.target.value)}
                rows={3}
                placeholder="What worked? What didn't? Carry into tomorrow…"
                className="w-full bg-surface-hover rounded-[4px] px-3 py-2 text-[13px] text-text-primary outline-none border border-transparent focus:border-border-default resize-none placeholder:text-text-tertiary"
              />
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="h-9 px-4 text-[13px] font-medium rounded-[4px] border border-[hsl(var(--accent))] text-[hsl(var(--accent))] hover:bg-surface-hover transition-colors"
            >
              Close day
            </button>
          </div>
        </>
      )}

      {closed && entry?.reflectionText && (
        <div className="border-t border-border-subtle pt-4">
          <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-text-tertiary mb-2">
            REFLECTION
          </div>
          <p className="text-[13px] text-text-primary leading-[1.5]">
            {entry.reflectionText}
          </p>
        </div>
      )}
    </div>
  );
};
