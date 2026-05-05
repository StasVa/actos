// Global host components mounted once at the app shell. They own
// app-wide modal state that needs to be reachable from anywhere
// (e.g. the Settings panel triggered by sidebar or ⌘K palette).

import React from "react";
import { SettingsPanel } from "@/components/SettingsPanel";
import { subscribeAppEvent } from "@/lib/appEvents";

export function GlobalSettingsHost() {
  const [open, setOpen] = React.useState(false);
  React.useEffect(() => {
    return subscribeAppEvent("open-settings", () => setOpen(true));
  }, []);
  return <SettingsPanel open={open} onOpenChange={setOpen} />;
}
