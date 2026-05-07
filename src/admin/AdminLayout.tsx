// Admin shell: warning-bordered sidebar + main pane. Reused by every admin page.

import React from "react";
import { Link, NavLink, Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Users as UsersIcon, MessageSquare, CreditCard, ScrollText, Megaphone,
  ArrowLeftRight,
} from "lucide-react";
import { isAdmin } from "./adminStore";
import { toast } from "sonner";

const NAV = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/users", label: "Users", icon: UsersIcon },
  { to: "/admin/feedback", label: "Feedback", icon: MessageSquare },
  { to: "/admin/billing", label: "Billing", icon: CreditCard },
  { to: "/admin/audit", label: "Audit Log", icon: ScrollText },
  { to: "/admin/announcements", label: "Announcements", icon: Megaphone },
];

export const AdminLayout: React.FC = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // Access check
  if (!isAdmin()) {
    toast.error("Access denied");
    return <Navigate to="/today" replace />;
  }

  return (
    <div className="min-h-screen bg-surface-base text-text-primary">
      <aside
        className="fixed left-0 top-0 bottom-0 w-[220px] bg-surface-raised border-r border-border-subtle flex flex-col"
        style={{ borderTop: "2px solid hsl(var(--text-warning))" }}
      >
        <div className="px-4 pt-4">
          <button
            type="button"
            onClick={() => navigate("/today")}
            className="flex items-center gap-1.5 text-[12px] text-text-tertiary hover:text-text-primary transition-colors"
          >
            <ArrowLeftRight size={12} /> Exit admin →
          </button>
          <div className="mt-3 text-[17px] font-semibold tracking-tight text-text-primary">
            ActOS <span className="font-mono text-[11px]" style={{ color: "hsl(var(--text-warning))" }}>· admin</span>
          </div>
        </div>
        <nav className="mt-6 px-2 flex flex-col gap-0.5">
          {NAV.map((n) => {
            const Icon = n.icon;
            const active = n.exact ? pathname === n.to : pathname === n.to || pathname.startsWith(n.to + "/");
            return (
              <NavLink key={n.to} to={n.to} end={!!n.exact}
                className={`flex items-center gap-2 pl-2.5 pr-2.5 py-1.5 rounded-[4px] text-[13px] transition-colors ${
                  active ? "bg-surface-hover text-text-primary font-medium" : "text-text-secondary hover:text-text-primary hover:bg-surface-hover"
                }`}
                style={active ? { boxShadow: "inset 2px 0 0 0 hsl(var(--text-warning))" } : undefined}
              >
                <Icon size={16} className="shrink-0" />
                <span>{n.label}</span>
              </NavLink>
            );
          })}
        </nav>
        <div className="flex-1" />
        <div className="px-4 pb-4 font-mono text-[11px] text-text-tertiary">
          Logged in as<br/>
          <span className="text-text-secondary">admin@actos.app</span>
        </div>
      </aside>
      <main className="ml-[220px] px-8 py-6 max-w-[1280px]">
        <Outlet />
      </main>
    </div>
  );
};
