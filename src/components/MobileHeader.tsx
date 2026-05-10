import React from "react";
import { useTranslation } from "react-i18next";
import { Menu } from "lucide-react";
import { emitAppEvent } from "@/lib/appEvents";

export const MobileHeader: React.FC<{ title?: string }> = () => {
  const { t } = useTranslation();
  return (
    <div className="mobile-hamburger" aria-hidden={false}>
      <button
        type="button"
        aria-label={t("nav.openMobile")}
        onClick={() => emitAppEvent("open-mobile-sidebar")}
        className="tap-target inline-flex items-center justify-center rounded-[4px] text-text-primary hover:bg-surface-hover"
      >
        <Menu size={20} />
      </button>
    </div>
  );
};

export default MobileHeader;
