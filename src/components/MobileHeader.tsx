import React from "react";
import { Menu } from "lucide-react";
import { emitAppEvent } from "@/lib/appEvents";

/**
 * Global mobile-only hamburger button. Mounted once at the app shell so it
 * appears on every route at ≤768px viewport. Fixed top-left of the viewport;
 * `.app-main` mobile padding-top reserves space so it never overlaps page
 * content. Renders nothing on desktop (display: none via .mobile-hamburger).
 */
export const MobileHeader: React.FC<{ title?: string }> = () => {
  return (
    <div className="mobile-hamburger" aria-hidden={false}>
      <button
        type="button"
        aria-label="Open navigation"
        onClick={() => emitAppEvent("open-mobile-sidebar")}
        className="tap-target inline-flex items-center justify-center rounded-[4px] text-text-primary hover:bg-surface-hover"
      >
        <Menu size={20} />
      </button>
    </div>
  );
};

export default MobileHeader;
