import React from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { MobileHeader } from "@/components/MobileHeader";
import { SettingsPanel } from "@/components/SettingsPanel";

const Reviews: React.FC = () => {
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  return (
    <div className="min-h-screen bg-surface-base text-text-primary">
      <AppSidebar onOpenSettings={() => setSettingsOpen(true)} />
      <SettingsPanel open={settingsOpen} onOpenChange={setSettingsOpen} />
      <main className="app-main page-medium">
        <header className="mb-8">
          <h1 className="text-[24px] font-medium text-text-primary leading-tight">Reviews</h1>
        </header>
        <div className="bg-surface-elevated border border-dashed border-border-subtle rounded-[6px] p-10 text-center">
          <div className="text-[14px] text-text-secondary">Reviews coming soon</div>
          <div className="font-mono text-[11px] text-text-tertiary mt-1">
            Daily, weekly and monthly reviews will appear here.
          </div>
        </div>
      </main>
    </div>
  );
};

export default Reviews;
// trigger
