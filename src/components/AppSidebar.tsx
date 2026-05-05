import React from "react";
import { Link, useLocation } from "react-router-dom";
import { LifetimeCounters } from "@/components/LifetimeCounters";
import { emitAppEvent } from "@/lib/appEvents";

type NavItem = { label: string; href: string };

const GROUP_TEMPORAL: NavItem[] = [
  { label: "Today", href: "/today" },
  { label: "Progress", href: "/progress" },
];

const GROUP_ENTITIES: NavItem[] = [
  { label: "Goals", href: "/goals" },
  { label: "Projects", href: "/projects" },
  { label: "Actions", href: "/actions" },
  { label: "Rituals", href: "/rituals" },
  { label: "Ideas", href: "/ideas" },
];

const GROUP_ARCHIVE: NavItem[] = [
  { label: "Reviews", href: "/reviews" },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/today") {
    return pathname === "/" || pathname === "/today" || pathname === "/home";
  }
  if (href === "/goals") {
    // /goals list — exclude /goals/:id detail
    return pathname === "/goals";
  }
  if (href === "/projects") {
    return pathname === "/projects" || pathname === "/all-projects";
  }
  if (href === "/actions") {
    return pathname === "/actions" || pathname === "/all-actions";
  }
  return pathname === href || pathname.startsWith(href + "/");
}

const NavGroup: React.FC<{ items: NavItem[]; pathname: string }> = ({ items, pathname }) => (
  <nav className="flex flex-col gap-1">
    {items.map((item) => {
      const active = isActive(pathname, item.href);
      return (
        <Link
          key={item.label}
          to={item.href}
          className={`relative pl-2.5 pr-2.5 py-1.5 rounded-[4px] text-[13px] transition-colors ${
            active
              ? "bg-surface-hover text-text-primary font-medium"
              : "text-text-secondary font-normal hover:text-text-primary"
          }`}
          style={
            active
              ? { boxShadow: "inset 2px 0 0 0 hsl(var(--accent))" }
              : undefined
          }
        >
          {item.label}
        </Link>
      );
    })}
  </nav>
);

const Divider: React.FC = () => (
  <div className="my-4 border-t border-border-subtle" />
);

export const AppSidebar: React.FC<{ onOpenSettings?: () => void }> = ({ onOpenSettings }) => {
  const { pathname } = useLocation();
  const handleSettings = onOpenSettings ?? (() => emitAppEvent("open-settings"));
  return (
    <aside className="fixed left-0 top-0 bottom-0 w-[220px] bg-surface-raised border-r border-border-subtle p-4 flex flex-col">
      <Link to="/today" className="px-1 py-1 text-[17px] font-semibold text-text-primary tracking-tight">
        ActOS
      </Link>
      <div className="mt-8 flex flex-col">
        <NavGroup items={GROUP_TEMPORAL} pathname={pathname} />
        <Divider />
        <NavGroup items={GROUP_ENTITIES} pathname={pathname} />
        <Divider />
        <NavGroup items={GROUP_ARCHIVE} pathname={pathname} />
      </div>

      <div className="flex-1" />

      <button
        type="button"
        onClick={handleSettings}
        className="text-left px-2.5 py-1.5 rounded-[4px] text-[13px] text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors mb-2"
      >
        Settings
      </button>
      <button
        type="button"
        onClick={() => {
          // Dispatch a synthetic ⌘K so the global palette opens.
          const ev = new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true });
          document.dispatchEvent(ev);
        }}
        className="text-left font-mono text-[11px] text-text-tertiary px-1 hover:text-text-primary transition-colors"
      >
        ⌘K  Search
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
    </aside>
  );
};

export default AppSidebar;
