import { useStore, selectors } from "@/store/useStore";

/**
 * Live lifetime counters for the sidebar footer.
 * Reads `projects completed` and `actions done` straight from the store.
 *
 * Renders the exact same two <div> lines the pages used to hardcode, so the
 * visual output is identical — only the numbers are now real.
 */
export function LifetimeCounters() {
  const counters = useStore((s) => selectors.lifetimeCounters(s));
  return (
    <>
      <div>{counters.projectsClosed} projects closed</div>
      <div>{counters.actionsDone} actions done</div>
    </>
  );
}
