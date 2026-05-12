import { useTranslation } from "react-i18next";
import { useLifetimeCounters } from "@/lib/selectors";

/**
 * Live lifetime counters for the sidebar footer.
 */
export function LifetimeCounters() {
  const { t } = useTranslation();
  const { projectsClosed, actionsDone } = useLifetimeCounters();
  return (
    <>
      <div>{t("lifetime.projectsClosed", { count: projectsClosed })}</div>
      <div>{t("lifetime.actionsDone", { count: actionsDone })}</div>
    </>
  );
}
