import React from "react";
import { useTranslation } from "react-i18next";
import { AppSidebar } from "@/components/AppSidebar";
import { SettingsPanel } from "@/components/SettingsPanel";

const Reviews: React.FC = () => {
  const { t } = useTranslation();
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  return (
    <div className="min-h-screen bg-surface-base text-text-primary">
      <AppSidebar onOpenSettings={() => setSettingsOpen(true)} />
      <SettingsPanel open={settingsOpen} onOpenChange={setSettingsOpen} />
      <main className="app-main page-medium">
        <header className="mb-8">
          <h1 className="text-[24px] font-medium text-text-primary leading-tight">{t("reviews.page.title")}</h1>
        </header>
        <div className="bg-surface-elevated border border-dashed border-border-subtle rounded-[6px] p-10 text-center">
          <div className="text-[14px] text-text-secondary">{t("reviews.placeholder.comingSoon")}</div>
          <div className="font-mono text-[11px] text-text-tertiary mt-1">
            {t("reviews.placeholder.subtitle")}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Reviews;
