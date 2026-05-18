import React from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Sparkles, LogOut, Wrench, HelpCircle } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useStore } from "@/store/useStore";
import { useAuth } from "@/lib/useAuth";
import { useCurrentUserQuery } from "@/lib/queries/useCurrentUser";
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
  const { t } = useTranslation();
  const settings = useStore((s) => s.settings);
  const { user, signOut } = useAuth();
  const { data: currentUser } = useCurrentUserQuery();
  const effectiveTier = currentUser?.subscriptionTier ?? user?.subscriptionTier ?? "free";
  const [open, setOpen] = React.useState(false);

  const email = user?.email ?? settings.userEmail ?? "ak@email";
  const name = user?.name ?? settings.userName ?? email.split("@")[0];
  const tier: "free" | "all-in" = effectiveTier === "all-in" ? "all-in" : "free";

  const goto = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  const triggerButton = collapsed ? (
    <button
      type="button"
      aria-label={t("menu.account.aria")}
      className="flex items-center justify-center w-10 h-10 mx-auto rounded-[4px] hover:bg-surface-hover transition-colors duration-150"
      data-state={open ? "open" : "closed"}
    >
      <Avatar name={name} size={28} />
    </button>
  ) : (
    <button
      type="button"
      aria-label={t("menu.account.aria")}
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

  const trigger = collapsed ? (
    <Tooltip delayDuration={150}>
      <TooltipTrigger asChild>
        <PopoverTrigger asChild>{triggerButton}</PopoverTrigger>
      </TooltipTrigger>
      <TooltipContent side="right" className="text-[12px]">
        {t("menu.account.tooltip", { name })}
      </TooltipContent>
    </Tooltip>
  ) : (
    <PopoverTrigger asChild>{triggerButton}</PopoverTrigger>
  );

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        {trigger}
        <PopoverContent
          side={collapsed ? "right" : "top"}
          align={collapsed ? "start" : "start"}
          sideOffset={8}
          collisionPadding={8}
          className="p-0 w-[280px] bg-surface-elevated border-border-subtle rounded-[8px] shadow-md"
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
                className="text-[14px] font-medium text-text-primary truncate"
                style={{ lineHeight: 1.2 }}
              >
                {name}
              </div>
              <div
                className="text-[12px] text-text-tertiary truncate"
                style={{ lineHeight: 1.2, marginTop: 2 }}
              >
                {email}
              </div>
            </div>
            {tier === "all-in" && <TierBadge tier="all-in" />}
          </div>

          {/* Subscription */}
          <button
            type="button"
            onClick={() => goto("/settings/subscription")}
            className="w-full flex items-center gap-[10px] hover:bg-surface-hover transition-colors text-left group"
            style={{ padding: "8px 14px" }}
          >
            <Sparkles size={16} className="text-text-secondary group-hover:text-text-primary" />
            <span className="text-[13px] text-text-primary flex-1">{t("menu.subscription")}</span>
            {tier === "all-in" && <TierBadge tier="all-in" />}
          </button>

          {/* Help */}
          <a
            href="https://actos.app/help"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            className="w-full flex items-center gap-[10px] hover:bg-surface-hover transition-colors text-left group"
            style={{ padding: "8px 14px" }}
          >
            <HelpCircle size={16} className="text-text-secondary group-hover:text-text-primary" />
            <span className="text-[13px] text-text-primary flex-1">{t("common.help")}</span>
          </a>

          {/* Admin (gated by demo flag) */}
          {settings.showAdminTools && (
            <button
              type="button"
              onClick={() => goto("/admin/components")}
              className="w-full flex items-center gap-[10px] hover:bg-surface-hover transition-colors text-left group"
              style={{ padding: "8px 14px" }}
            >
              <Wrench size={16} className="text-text-secondary group-hover:text-text-primary" />
              <span className="text-[13px] text-text-primary flex-1">{t("menu.admin")}</span>
            </button>
          )}

          <div
            className="border-t border-border-subtle"
            style={{ marginTop: 4, marginBottom: 4 }}
          />

          {/* Sign out */}
          <button
            type="button"
            onClick={async () => {
              setOpen(false);
              await signOut();
              toast.success(t("signOut.toast"));
              navigate("/", { replace: true });
            }}
            className="w-full flex items-center gap-[10px] hover:bg-surface-hover transition-colors text-left group"
            style={{ padding: "8px 14px" }}
          >
            <LogOut size={16} className="text-text-secondary group-hover:text-text-primary" />
            <span className="text-[13px] text-text-primary flex-1">{t("common.signOut")}</span>
          </button>
        </PopoverContent>
      </Popover>
    </>
  );
};

export default UserMenu;
