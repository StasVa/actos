// Full-page takeover rendered when the user has zero active goals. Replaces
// sidebar, header, and the requested route with a minimal-chrome shell that
// hosts the goal-builder. The only escape hatches are the avatar menu
// (Settings, Sign out) — there is no close button because there is nowhere to
// close to.

import React from "react";
import GoalBuilder from "@/pages/GoalBuilder";
import { UserMenu } from "@/components/UserMenu";

export const NoGoalsLayout: React.FC = () => {
  React.useEffect(() => {
    const prev = document.title;
    document.title = "Set up your first goal — ActOS";
    return () => { document.title = prev; };
  }, []);

  return (
    <div
      className="relative min-h-screen w-full"
      style={{ background: "hsl(var(--surface-base))" }}
    >
      {/* Minimal top chrome */}
      <div
        className="absolute left-0 right-0 top-0 flex items-center justify-between"
        style={{ padding: "16px 24px", zIndex: 5 }}
      >
        <span
          aria-label="ActOS"
          className="text-text-primary"
          style={{
            fontFamily: "Inter, ui-sans-serif, system-ui",
            fontSize: 15,
            fontWeight: 600,
            letterSpacing: "-0.01em",
          }}
        >
          ActOS
        </span>
        <div style={{ width: 40 }}>
          <UserMenu collapsed />
        </div>
      </div>

      <GoalBuilder />
    </div>
  );
};

export default NoGoalsLayout;
