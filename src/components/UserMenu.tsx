import React from "react";
import { useNavigate } from "react-router-dom";
import { Settings as SettingsIcon, Sparkles, LogOut, Wrench } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ConfirmModal } from "@/components/ConfirmModal";
import { useStore } from "@/store/useStore";
import { toast } from "sonner";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const Avatar: React.FC<{ name: string; size?: number }> = ({ name, size = 32 }) => (
  <span
    className="shrink-0 rounded-full bg-surface-hover flex items-center justify-center font-mono text-text-primary"
    style={{ width: size, height: size, fontSize: Math.round(size * 0.34) }}
  >
    {initials(name)}
  </span>
);

const TierBadge: React.FC<{ tier: "free" | "all-in" }> = ({ tier }) => {
  if (tier === "all-in") {
    return (
      <span
        className="font-medium"
        style={{
          fontFamily: "Inter",
          fontSize: 11,
          padding: "2px 6px",
          borderRadius: 3,
          color: "hsl(var(--accent))",
        }}
      >
        All-In
      </span>
    );
  }
  return (
    <span
      className="font-mono uppercase text-text-tertiary"
      style={{
        fontSize: 10,
        letterSpacing: "0.06em",
        padding: "2px 6px",
        borderRadius: 3,
        border: "1px solid hsl(var(--border-subtle))",
      }}
    >
      FREE
    </span>
  );
};

export { Avatar, TierBadge };

export const UserMenu: React.FC<{ collapsed: boolean }> = ({ collapsed }) => {
  const navigate = useNavigate();
  const settings = useStore((s) => s.settings);
  const [open, setOpen] = React.useState(false);
  const [confirmSignOut, setConfirmSignOut] = React.useState(false);

  const email = settings.userEmail ?? "ak@email";
  const name = settings.userName ?? email.split("@")[0];
  const tier: "free" | "all-in" = settings.subscriptionTier === "all-in" ? "all-in" : "free";

  const goto = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  const trigger = collapsed ? (
    <Tooltip delayDuration={150}>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label="Account menu"
          className="flex items-center justify-center w-10 h-10 mx-auto rounded-[4px] hover:bg-surface-hover transition-colors duration-150"
          data-state={open ? "open" : "closed"}
        >
          <Avatar name={name} size={28} />
        </button>
      </TooltipTrigger>
      <TooltipContent side="right" className="text-[12px]">
        Account
      </TooltipContent>
    </Tooltip>
  ) : (
    <button
      type="button"
      aria-label="Account menu"
      className="flex-1 min-w-0 flex items-center gap-[10px] rounded-[4px] hover:bg-surface-hover transition-colors duration-150 data-[state=open]:bg-surface-hover"
      style={{ padding: "6px 8px" }}
      data-state={open ? "open" : "closed"}
    >
      <Avatar name={name} size={32} />
      <span className="flex-1 min-w-0 flex flex-col items-start text-left">
        <span
          className="text-[13px] font-medium text-text-primary truncate w-full"
          style={{ lineHeight: 1.2 }}
        >
          {name}
        </span>
        <span
          className="text-[11px] text-text-tertiary truncate w-full"
          style={{ lineHeight: 1.2 }}
        >
          {email}
        </span>
      </span>
    </button>
  );

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>{trigger}</PopoverTrigger>
        <PopoverContent
          side={collapsed ? "right" : "top"}
          align={collapsed ? "end" : "start"}
          sideOffset={8}
          className="p-0 w-[240px] bg-surface-elevated border-border-subtle rounded-[6px] shadow-none"
          style={{ paddingTop: 4, paddingBottom: 4, zIndex: 100 }}
        >
          {/* Identity header */}
          <div
            className="flex items-center gap-[10px] border-b border-border-subtle"
            style={{ padding: "12px 14px" }}
          >
            <Avatar name={name} size={32} />
            <div className="flex-1 min-w-0">
              <div
                className="text-[13px] font-medium text-text-primary truncate"
                style={{ lineHeight: 1.2 }}
              >
                {name}
              </div>
              <div
                className="text-[11px] text-text-tertiary truncate"
                style={{ lineHeight: 1.2, marginTop: 2 }}
              >
                {email}
              </div>
            </div>
          </div>

          {/* Settings */}
          <button
            type="button"
            onClick={() => goto("/settings")}
            className="w-full flex items-center gap-[10px] hover:bg-surface-hover transition-colors text-left group"
            style={{ padding: "8px 14px" }}
          >
            <SettingsIcon size={16} className="text-text-secondary group-hover:text-text-primary" />
            <span className="text-[13px] text-text-primary flex-1">Settings</span>
          </button>

          {/* Subscription */}
          <button
            type="button"
            onClick={() => goto("/settings/subscription")}
            className="w-full flex items-center gap-[10px] hover:bg-surface-hover transition-colors text-left group"
            style={{ padding: "8px 14px" }}
          >
            <Sparkles size={16} className="text-text-secondary group-hover:text-text-primary" />
            <span className="text-[13px] text-text-primary flex-1">Subscription</span>
            <TierBadge tier={tier} />
          </button>

          {/* Admin (gated by demo flag) */}
          {settings.showAdminTools && (
            <button
              type="button"
              onClick={() => goto("/admin/components")}
              className="w-full flex items-center gap-[10px] hover:bg-surface-hover transition-colors text-left group"
              style={{ padding: "8px 14px" }}
            >
              <Wrench size={16} className="text-text-secondary group-hover:text-text-primary" />
              <span className="text-[13px] text-text-primary flex-1">Admin</span>
            </button>
          )}

          <div
            className="border-t border-border-subtle"
            style={{ marginTop: 4, marginBottom: 4 }}
          />

          {/* Sign out */}
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              setConfirmSignOut(true);
            }}
            className="w-full flex items-center gap-[10px] hover:bg-surface-hover transition-colors text-left group"
            style={{ padding: "8px 14px" }}
          >
            <LogOut size={16} className="text-text-secondary group-hover:text-text-primary" />
            <span className="text-[13px] text-text-primary flex-1">Sign out</span>
          </button>
        </PopoverContent>
      </Popover>

      <ConfirmModal
        open={confirmSignOut}
        title="Sign out of ActOS?"
        body="You'll need to sign back in to access your data."
        cancelLabel="Cancel"
        confirmLabel="Sign out"
        onCancel={() => setConfirmSignOut(false)}
        onConfirm={() => {
          setConfirmSignOut(false);
          toast.success("Signed out (demo).");
        }}
      />
    </>
  );
};

export default UserMenu;
