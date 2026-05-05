import { useStore, selectors } from "@/store/useStore";

/**
 * Live lifetime counters for the sidebar footer.
 * Reads `projects completed` and `actions done` straight from the store.
 *
 * Renders the exact same two <div> lines the pages used to hardcode, so the
 * visual output is identical — only the numbers are now real.
 */
export function LifetimeCounters() {
  // Subscribe to primitives only — returning a new object each render would
  // trip Zustand's strict-equality check and cause an infinite update loop.
  const projectsClosed = useStore((s) => s.projects.filter((p) => p.status === "completed").length);
  const actionsDone = useStore((s) => s.actions.filter((a) => a.status === "done").length);
  return (
    <>
      <div>{projectsClosed} projects closed</div>
      <div>{actionsDone} actions done</div>
    </>
  );
}
