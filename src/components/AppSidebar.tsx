import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Search,
  Calendar,
  TrendingUp,
  CheckSquare,
  Repeat,
  Send,
  Target,
  FolderKanban,
  Lightbulb,
  Timer,
  Sun,
  CalendarDays,
  CalendarRange,
  PanelLeftClose,
  PanelLeftOpen,
  HelpCircle,
} from "lucide-react";
import { LifetimeCounters } from "@/components/LifetimeCounters";
import { UserMenu } from "@/components/UserMenu";
import { emitAppEvent } from "@/lib/appEvents";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import type { LucideIcon } from "lucide-react";
type NavItem = { label: string; href: string; icon: LucideIcon };

const GROUP_EXECUTION: NavItem[] = [
  { label: "Today", href: "/today", icon: Sun },
  { label: "Progress", href: "/progress", icon: TrendingUp },
  { label: "Actions", href: "/actions", icon: CheckSquare },
  { label: "Delegated", href: "/delegated", icon: Send },
  { label: "Rituals", href: "/rituals", icon: Repeat },
];

const GROUP_STRATEGY: NavItem[] = [
  { label: "Goals", href: "/goals", icon: Target },
  { label: "Projects", href: "/projects", icon: FolderKanban },
  { label: "Ideas", href: "/ideas", icon: Lightbulb },
  { label: "Sessions", href: "/sessions", icon: Timer },
];

const GROUP_REVIEWS: NavItem[] = [
  { label: "Days", href: "/reviews/days", icon: Calendar },
  { label: "Weeks", href: "/reviews/weeks", icon: CalendarDays },
  { label: "Months", href: "/reviews/months", icon: CalendarRange },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/today") {
    return pathname === "/" || pathname === "/today" || pathname === "/home";
  }
  if (href === "/goals") return pathname === "/goals";
  if (href === "/projects") return pathname === "/projects" || pathname === "/all-projects";
  if (href === "/actions") return pathname === "/actions" || pathname === "/all-actions";
  return pathname === href || pathname.startsWith(href + "/");
}

const COLLAPSE_KEY = "sidebarCollapsed";
const EXPANDED_W = 220;
const COLLAPSED_W = 64;

const NavRow: React.FC<{
  item: NavItem;
  pathname: string;
  collapsed: boolean;
}> = ({ item, pathname, collapsed }) => {
  const active = isActive(pathname, item.href);
  const Icon = item.icon;
  const link = (
    <Link
      to={item.href}
      className={`relative flex items-center rounded-[4px] text-[13px] transition-colors ${
        collapsed ? "justify-center mx-auto w-10 h-10" : "gap-2 pl-2.5 pr-2.5 py-1.5"
      } ${
        active
          ? "bg-surface-hover text-text-primary font-medium"
          : "text-text-secondary font-normal hover:text-text-primary hover:bg-surface-hover"
      }`}
      style={
        active && !collapsed
          ? { boxShadow: "inset 2px 0 0 0 hsl(var(--accent))" }
          : active && collapsed
          ? { boxShadow: "inset 2px 0 0 0 hsl(var(--accent))" }
          : undefined
      }
      aria-label={item.label}
    >
      <Icon size={16} className="shrink-0" />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </Link>
  );

  if (!collapsed) return link;
  return (
    <Tooltip delayDuration={150}>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right" className="text-[12px]">
        {item.label}
      </TooltipContent>
    </Tooltip>
  );
};

const NavGroup: React.FC<{
  items: NavItem[];
  pathname: string;
  collapsed: boolean;
}> = ({ items, pathname, collapsed }) => (
  <nav className="flex flex-col gap-1">
    {items.map((item) => (
      <NavRow key={item.href} item={item} pathname={pathname} collapsed={collapsed} />
    ))}
  </nav>
);

const Divider: React.FC = () => <div className="my-4 border-t border-border-subtle" />;

export const AppSidebar: React.FC<{ onOpenSettings?: () => void }> = ({ onOpenSettings }) => {
  const { pathname } = useLocation();
  const isMobile = useIsMobile();
  const handleSettings = onOpenSettings ?? (() => emitAppEvent("open-settings"));

  const [collapsed, setCollapsed] = React.useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    const stored = window.localStorage.getItem(COLLAPSE_KEY);
    if (stored === null) {
      // Auto-collapse on first load when viewport is narrow
      const auto = window.innerWidth < 1100;
      window.localStorage.setItem(COLLAPSE_KEY, String(auto));
      return auto;
    }
    return stored === "true";
  });

  // Mobile drawer open state
  const [mobileOpen, setMobileOpen] = React.useState(false);
  React.useEffect(() => {
    const off = (window as any).__subAppEvent
      ? null
      : (() => {
          // lazy listen via DOM event
          const handler = () => setMobileOpen(true);
          document.addEventListener("open-mobile-sidebar", handler);
          return () => document.removeEventListener("open-mobile-sidebar", handler);
        })();
    return off ?? undefined;
  }, []);
  // Use the appEvents bus
  React.useEffect(() => {
    import("@/lib/appEvents").then(({ subscribeAppEvent }) => {
      subscribeAppEvent("open-mobile-sidebar", () => setMobileOpen(true));
    });
  }, []);
  React.useEffect(() => {
    if (!isMobile) setMobileOpen(false);
  }, [isMobile]);
  React.useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Mobile never collapsed
  const effectiveCollapsed = !isMobile && collapsed;
  const desktopWidth = effectiveCollapsed ? COLLAPSED_W : EXPANDED_W;
  const width = isMobile ? (mobileOpen ? 260 : 0) : desktopWidth;

  // Sync CSS variable so page main margins follow (always 0 on mobile)
  React.useEffect(() => {
    document.documentElement.style.setProperty(
      "--sidebar-w",
      `${isMobile ? 0 : desktopWidth}px`,
    );
  }, [desktopWidth, isMobile]);

  // Cmd+\ keyboard toggle (desktop only)
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "\\") {
        e.preventDefault();
        if (isMobile) {
          setMobileOpen((v) => !v);
          return;
        }
        setCollapsed((v) => {
          const next = !v;
          window.localStorage.setItem(COLLAPSE_KEY, String(next));
          return next;
        });
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isMobile]);

  const toggle = () => {
    if (isMobile) {
      setMobileOpen((v) => !v);
      return;
    }
    setCollapsed((v) => {
      const next = !v;
      window.localStorage.setItem(COLLAPSE_KEY, String(next));
      return next;
    });
  };

  const openSearch = () => {
    const ev = new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true });
    document.dispatchEvent(ev);
  };

  return (
    <TooltipProvider>
      {isMobile && mobileOpen && (
        <div
          className="mobile-drawer-backdrop"
          onClick={() => setMobileOpen(false)}
          aria-hidden
        />
      )}
      <aside
        className="fixed left-0 top-0 bottom-0 bg-surface-raised border-r border-border-subtle flex flex-col transition-transform duration-200 ease-out overflow-hidden"
        style={{
          width: isMobile ? 260 : desktopWidth,
          zIndex: isMobile ? 70 : 30,
          transform: isMobile && !mobileOpen ? "translateX(-100%)" : "translateX(0)",
        }}
      >
        <div className={`flex items-center ${effectiveCollapsed ? "justify-center px-0" : "justify-between px-4"} pt-4`}>
          {!effectiveCollapsed && (
            <Link to="/today" className="px-1 py-1 text-[17px] font-semibold text-text-primary tracking-tight">
              ActOS
            </Link>
          )}
          {!isMobile && (
            <Tooltip delayDuration={150}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={toggle}
                  className="p-1.5 rounded-[4px] text-text-tertiary hover:text-text-primary hover:bg-surface-hover transition-colors"
                  aria-label={effectiveCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                  {effectiveCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-[12px]">
                {effectiveCollapsed ? "Expand sidebar" : "Collapse sidebar"} <span className="text-text-tertiary ml-1">⌘\</span>
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Search */}
        <div className={`mt-6 ${effectiveCollapsed ? "px-2" : "px-4"}`}>
          {effectiveCollapsed ? (
            <Tooltip delayDuration={150}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={openSearch}
                  className="flex items-center justify-center w-10 h-10 mx-auto rounded-[4px] text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors"
                  aria-label="Search"
                >
                  <Search size={16} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-[12px]">
                Search <span className="text-text-tertiary ml-1">⌘K</span>
              </TooltipContent>
            </Tooltip>
          ) : (
            <button
              type="button"
              onClick={openSearch}
              className="search-row w-full group flex items-center gap-2 pl-2.5 pr-2 py-2 rounded-[4px] text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors"
            >
              <Search size={16} className="shrink-0" />
              <span className="text-[14px] font-medium flex-1 text-left">Search</span>
              <span
                className="kbd-hint inline-flex items-center justify-center font-mono text-text-secondary group-hover:text-text-primary transition-colors mr-2"
                style={{
                  fontSize: 11,
                  letterSpacing: 0,
                  background: "hsl(var(--surface-elevated))",
                  border: "1px solid hsl(var(--border-subtle))",
                  padding: "2px 6px",
                  borderRadius: 3,
                }}
              >
                ⌘K
              </span>
            </button>
          )}
        </div>

        <div className={`mt-2 mb-3 border-t border-border-subtle ${effectiveCollapsed ? "mx-2" : "mx-4"}`} />

        <div className={`flex flex-col ${effectiveCollapsed ? "px-2" : "px-4"}`}>
          <NavGroup items={GROUP_EXECUTION} pathname={pathname} collapsed={effectiveCollapsed} />
          <Divider />
          <NavGroup items={GROUP_STRATEGY} pathname={pathname} collapsed={effectiveCollapsed} />
          <Divider />
          {!effectiveCollapsed && (
            <div
              className="font-mono uppercase text-text-tertiary mb-1"
              style={{
                fontSize: 11,
                letterSpacing: "0.06em",
                padding: "8px 12px",
              }}
            >
              Reviews
            </div>
          )}
          <NavGroup items={GROUP_REVIEWS} pathname={pathname} collapsed={effectiveCollapsed} />
        </div>

        <div className="flex-1" />

        <div className={`${effectiveCollapsed ? "px-2" : "px-4"} pb-4 flex flex-col`}>
          {effectiveCollapsed ? (
            <Tooltip delayDuration={150}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={handleSettings}
                  className="flex items-center justify-center w-10 h-10 mx-auto rounded-[4px] text-text-tertiary hover:text-text-primary hover:bg-surface-hover transition-colors mb-2"
                  aria-label="Settings"
                >
                  <SettingsIcon size={16} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-[12px]">
                Settings
              </TooltipContent>
            </Tooltip>
          ) : (
            <>
              <button
                type="button"
                onClick={handleSettings}
                className="text-left px-2.5 py-1.5 rounded-[4px] text-[13px] text-text-tertiary hover:text-text-primary hover:bg-surface-hover transition-colors mb-2"
              >
                Settings
              </button>
              <div className="font-mono text-[11px] text-text-tertiary px-1">?   Shortcuts</div>
              <div className="mt-4 font-mono text-[11px] text-text-secondary px-1 leading-[1.7]">
                <LifetimeCounters />
              </div>
              <div className="mt-3 flex items-center gap-2 p-1 rounded-[4px] hover:bg-surface-hover cursor-pointer">
                <span className="w-7 h-7 rounded-full bg-surface-hover flex items-center justify-center font-mono text-[11px] text-text-primary">
                  AK
                </span>
                <span className="font-mono text-[11px] text-text-secondary truncate">ak@email</span>
              </div>
            </>
          )}
        </div>
      </aside>
    </TooltipProvider>
  );
};

export default AppSidebar;
