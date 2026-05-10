import { useTranslation } from "react-i18next";
import { useStore } from "@/store/useStore";

/**
 * Live lifetime counters for the sidebar footer.
 * Reads `projects completed` and `actions done` straight from the store.
 */
export function LifetimeCounters() {
  const { t } = useTranslation();
  // Subscribe to primitives only — returning a new object each render would
  // trip Zustand's strict-equality check and cause an infinite update loop.
  const projectsClosed = useStore((s) => s.projects.filter((p) => p.status === "completed").length);
  const actionsDone = useStore((s) => s.actions.filter((a) => a.status === "done").length);
  return (
    <>
      <div>{t("lifetime.projectsClosed", { count: projectsClosed })}</div>
      <div>{t("lifetime.actionsDone", { count: actionsDone })}</div>
    </>
  );
}
