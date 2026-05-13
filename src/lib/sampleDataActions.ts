// Sample-data lifecycle hooks for the Setup Wizard "Show me how it works"
// flow and the Settings → "Clear sample data" action.
//
// After Phase 4 Session 2, all entities live in Supabase. Seeding and clearing
// therefore run as sequences of TanStack mutations / Supabase deletes rather
// than Zustand state replacement.

import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/useAuth";
import { queryKeys } from "@/lib/queryKeys";
import { buildSampleSeed, applySampleCoachmarks, type SampleSeed } from "@/lib/sampleSeed";
import {
  goalToInsert,
  projectToInsert,
  actionToInsert,
  ritualToInsert,
  ideaToInsert,
  dayEntryToInsert,
  sessionToInsert,
} from "@/lib/rowMappers";

function pickLocale(): string | undefined {
  try {
    return (
      localStorage.getItem("actos.i18n.language") ||
      (navigator?.language ? navigator.language.slice(0, 2) : undefined) ||
      undefined
    );
  } catch {
    return undefined;
  }
}

/**
 * Rewrites every top-level entity ID and FK reference in `seed` to a freshly
 * generated UUID. Required because the fixture ships with stable UUIDs that
 * would collide on the goals/projects/actions/etc. primary key the moment a
 * second user tried to seed the same workspace on the same Supabase project.
 *
 * The map is built lazily: any ID encountered (whether as a parent .id or as
 * a FK reference) gets a new UUID on first sight, cached on subsequent
 * lookups. Walk order is therefore irrelevant.
 *
 * NOT remapped (intentional):
 *  - goal_success_criteria[].id, project_references[].id — rowMappers
 *    overwrite these with crypto.randomUUID() at insert time.
 *  - ritual_completions[].id — sampleDataActions assigns crypto.randomUUID().
 *  - dayEntries[].id — DB default fills via gen_random_uuid().
 *  - dayEntries[].mainTaskActionId / plannedActionIds[] / plannedRitualIds[]
 *    / skippedRitualIds[] — buildSampleSeed strips all of these before they
 *    reach this function.
 */
function remapSeedIds(seed: SampleSeed): void {
  const idMap = new Map<string, string>();
  const m = (oldId: string): string => {
    let next = idMap.get(oldId);
    if (!next) {
      next = crypto.randomUUID();
      idMap.set(oldId, next);
    }
    return next;
  };

  for (const g of seed.goals) g.id = m(g.id);
  for (const p of seed.projects) {
    p.id = m(p.id);
    p.goalId = m(p.goalId);
  }
  for (const a of seed.actions) {
    a.id = m(a.id);
    a.goalId = m(a.goalId);
    if (a.projectId) a.projectId = m(a.projectId);
  }
  for (const r of seed.rituals) {
    r.id = m(r.id);
    r.goalId = m(r.goalId);
    if (r.projectId) r.projectId = m(r.projectId);
  }
  for (const i of seed.ideas) {
    i.id = m(i.id);
    if (i.goalId) i.goalId = m(i.goalId);
  }
  for (const s of seed.sessions) {
    s.id = m(s.id);
    s.plannedActionIds = (s.plannedActionIds ?? []).map(m);
    s.completedActionIds = (s.completedActionIds ?? []).map(m);
    s.droppedActionIds = (s.droppedActionIds ?? []).map(m);
  }
}

/**
 * Returns an async function that seeds the canonical sample workspace into
 * Supabase for the current user. All entities flagged `is_sample = true`.
 * Order: goals → projects → actions → rituals (+ completions) → ideas →
 * day entries → sessions. Every entity ID and FK reference is freshly
 * randomized per seed run (see `remapSeedIds`) so seeds from different users
 * don't collide on the global primary-key namespace.
 */
export function useSeedSampleData() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useCallback(async () => {
    if (!user) throw new Error("Not authenticated");
    const userId = user.id;
    const seed = buildSampleSeed(pickLocale());
    remapSeedIds(seed);

    // ── Goals ──
    const goalRows = seed.goals.map((g) => {
      const { row } = goalToInsert(g, userId);
      // Force fixture id so child rows can reference it.
      return { ...row, id: g.id };
    });
    if (goalRows.length > 0) {
      const { error } = await supabase.from("goals").insert(goalRows);
      if (error) throw error;
    }
    // Insert per-goal criteria.
    const criteriaRows = seed.goals.flatMap((g) => {
      const { criteria } = goalToInsert(g, userId);
      return criteria.map((c) => ({ ...c, goal_id: g.id }));
    });
    if (criteriaRows.length > 0) {
      const { error } = await supabase
        .from("goal_success_criteria")
        .insert(criteriaRows);
      if (error) throw error;
    }

    // ── Projects ──
    const projectRows = seed.projects.map((p) => {
      const { row } = projectToInsert(p, userId);
      return { ...row, id: p.id };
    });
    if (projectRows.length > 0) {
      const { error } = await supabase.from("projects").insert(projectRows);
      if (error) throw error;
    }
    const projectRefRows = seed.projects.flatMap((p) => {
      const { references } = projectToInsert(p, userId);
      return references.map((r) => ({ ...r, project_id: p.id }));
    });
    if (projectRefRows.length > 0) {
      const { error } = await supabase
        .from("project_references")
        .insert(projectRefRows);
      if (error) throw error;
    }

    // ── Actions ──
    const actionRows = seed.actions.map((a) => {
      const { row } = actionToInsert(a, userId);
      return { ...row, id: a.id };
    });
    if (actionRows.length > 0) {
      const { error } = await supabase.from("actions").insert(actionRows);
      if (error) throw error;
    }

    // ── Rituals + completions ──
    const ritualRows = seed.rituals.map((r) => {
      const { row } = ritualToInsert(r, userId);
      return { ...row, id: r.id };
    });
    if (ritualRows.length > 0) {
      const { error } = await supabase.from("rituals").insert(ritualRows);
      if (error) throw error;
    }
    const completionRows = seed.rituals.flatMap((r) =>
      (r.completionHistory ?? []).map((c) => ({
        id: crypto.randomUUID(),
        ritual_id: r.id,
        date: c.date,
        at: c.at,
        status: c.status ?? "done",
      })),
    );
    if (completionRows.length > 0) {
      const { error } = await supabase
        .from("ritual_completions")
        .insert(completionRows);
      if (error) throw error;
    }

    // ── Ideas (no children in sample fixture) ──
    const ideaRows = seed.ideas.map((i) => {
      const { row } = ideaToInsert(i, userId);
      return { ...row, id: i.id };
    });
    if (ideaRows.length > 0) {
      const { error } = await supabase.from("ideas").insert(ideaRows);
      if (error) throw error;
    }

    // ── Day entries ──
    const dayRows = seed.dayEntries.map((d) => dayEntryToInsert(d, userId));
    if (dayRows.length > 0) {
      const { error } = await supabase.from("day_entries").insert(dayRows);
      if (error) throw error;
    }

    // ── Sessions ──
    const sessionRows = seed.sessions.map((s) => sessionToInsert(s, userId));
    if (sessionRows.length > 0) {
      const { error } = await supabase.from("sessions").insert(sessionRows);
      if (error) throw error;
    }

    applySampleCoachmarks(seed.coachmarks);

    // Invalidate all entity caches so the UI hydrates from the new data.
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.goals }),
      queryClient.invalidateQueries({ queryKey: queryKeys.projects }),
      queryClient.invalidateQueries({ queryKey: queryKeys.actions }),
      queryClient.invalidateQueries({ queryKey: queryKeys.rituals }),
      queryClient.invalidateQueries({ queryKey: queryKeys.ideas }),
      queryClient.invalidateQueries({ queryKey: queryKeys.dayEntries }),
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions }),
    ]);
  }, [queryClient, user]);
}

/**
 * Returns an async function that deletes every is_sample=true row owned by
 * the current user. Seven sequential DELETEs (one per table); DB CASCADE
 * handles child rows (goal_success_criteria, project_references,
 * action_timeline, ritual_completions, idea_references, idea_image_attachments).
 */
export function useClearSampleData() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useCallback(async () => {
    if (!user) throw new Error("Not authenticated");
    const userId = user.id;
    const tables: Array<
      | "goals"
      | "projects"
      | "actions"
      | "rituals"
      | "ideas"
      | "day_entries"
      | "sessions"
    > = [
      "sessions",
      "day_entries",
      "ideas",
      "rituals",
      "actions",
      "projects",
      "goals",
    ];
    for (const table of tables) {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq("user_id", userId)
        .eq("is_sample", true);
      if (error) throw error;
    }
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.goals }),
      queryClient.invalidateQueries({ queryKey: queryKeys.projects }),
      queryClient.invalidateQueries({ queryKey: queryKeys.actions }),
      queryClient.invalidateQueries({ queryKey: queryKeys.rituals }),
      queryClient.invalidateQueries({ queryKey: queryKeys.ideas }),
      queryClient.invalidateQueries({ queryKey: queryKeys.dayEntries }),
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions }),
    ]);
  }, [queryClient, user]);
}
