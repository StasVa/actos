import type { DayInfo } from "@/components/Tooltip";

/**
 * Build per-day tooltip data for a 30-day sparkline.
 * `data[0]` is the OLDEST day (29 days ago); `data[data.length-1]` is TODAY.
 *
 * For each day, we want plausible action titles. Real, known actions for the
 * YouTube goal are sprinkled in at known positions; the rest pull from a
 * project-relevant pool.
 */

const POOL_YT = [
  "Edit script draft",
  "Review reference videos",
  "Test lighting setup",
  "Plan thumbnail concepts",
  "Draft channel description",
  "Pick recording mic",
  "Review feedback notes",
  "Sketch storyboard",
  "Brainstorm hook ideas",
  "Tag b-roll clips",
];

/** Anchored real actions, indexed from TODAY (0 = today). */
const ANCHORS_YT: Record<number, string[]> = {
  0: ["Outline structure", "Plan video #2 outline", "Review feedback notes"],
  1: ["Define content pillars"],
  2: ["Buy ring light"],
  3: ["Research camera options"],
  4: ["Set up recording space"],
  6: ["Test microphone"],
  7: ["Define audience persona"],
};

export function buildYouTubeTooltips(data: number[]): DayInfo[] {
  const last = data.length - 1;
  let pool = 0;
  return data.map((count, i) => {
    const daysFromToday = last - i;
    const anchored = ANCHORS_YT[daysFromToday] ?? [];
    const actions: string[] = [...anchored];
    while (actions.length < count) {
      actions.push(POOL_YT[pool++ % POOL_YT.length]);
    }
    // If anchors exceed count, trust the anchors but cap at max(count, anchors)
    return { daysFromToday, count: Math.max(count, actions.length), actions };
  });
}

/** Goal 2 (Lose 5kg): last 9 days are stalled (no activity). */
const POOL_FIT = [
  "Cook batch meals",
  "Plan tomorrow's meals",
  "Order resistance bands",
  "Log evening weight",
  "Morning run",
  "Schedule meal prep day",
  "Review macros",
];

export function buildFitnessTooltips(data: number[]): DayInfo[] {
  const last = data.length - 1;
  let pool = 0;
  return data.map((count, i) => {
    const daysFromToday = last - i;
    const actions: string[] = [];
    if (count > 0) {
      for (let k = 0; k < count; k++) actions.push(POOL_FIT[pool++ % POOL_FIT.length]);
    }
    return { daysFromToday, count, actions };
  });
}

const POOL_READ = [
  "Read 30 minutes",
  "Finished a chapter",
  "Wrote book notes",
  "Logged today's read",
  "Started new book",
  "Reviewed highlights",
];

export function buildReadingTooltips(data: number[]): DayInfo[] {
  const last = data.length - 1;
  let pool = 0;
  return data.map((count, i) => {
    const daysFromToday = last - i;
    const actions: string[] = [];
    for (let k = 0; k < count; k++) actions.push(POOL_READ[pool++ % POOL_READ.length]);
    return { daysFromToday, count, actions };
  });
}
