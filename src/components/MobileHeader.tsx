import React from "react";
import { Menu } from "lucide-react";
import { emitAppEvent } from "@/lib/appEvents";

/**
 * Mobile-only header with hamburger button. Renders nothing on desktop
 * (display: none via .mobile-hamburger CSS class).
 */
export const MobileHeader: React.FC<{ title?: string }> = ({ title }) => {
  return (
    <div className="mobile-hamburger">
      <button
        type="button"
        aria-label="Open navigation"
        onClick={() => emitAppEvent("open-mobile-sidebar")}
        className="tap-target inline-flex items-center justify-center rounded-[4px] text-text-primary hover:bg-surface-hover"
      >
        <Menu size={20} />
      </button>
      {title && (
        <span className="text-[14px] font-medium text-text-primary truncate">
          {title}
        </span>
      )}
    </div>
  );
};

export default MobileHeader;
