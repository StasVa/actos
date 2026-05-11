// Auth-gated route wrapper. Logged-out users get sent to /auth?next=<original path>.
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/useAuth";

export const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  if (!isAuthenticated) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/auth?next=${next}`} replace />;
  }
  return <>{children}</>;
};

export const RedirectIfAuthed: React.FC<{ children: React.ReactNode; to?: string }> = ({
  children,
  to = "/today",
}) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  if (isAuthenticated) return <Navigate to={to} replace />;
  // Resume signup verification: if user has a pending signup, route to /auth/verify
  // (unless they're already there). Cheap LocalStorage read.
  if (location.pathname !== "/auth/verify") {
    try {
      const raw = localStorage.getItem("actos.auth.pendingSignup");
      if (raw) {
        const p = JSON.parse(raw);
        const ageMs = Date.now() - new Date(p.createdAt).getTime();
        if (ageMs < 24 * 60 * 60 * 1000) {
          return <Navigate to="/auth/verify" replace />;
        }
        localStorage.removeItem("actos.auth.pendingSignup");
      }
    } catch {
      // ignore parse errors
    }
  }
  return <>{children}</>;
};

// Requires both auth + isAdmin flag. Non-admins are bounced to /today
// (rather than an error page) so the route's existence isn't disclosed.
export const RequireAdmin: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();
  if (!isAuthenticated) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/auth?next=${next}`} replace />;
  }
  if (!user?.isAdmin) return <Navigate to="/today" replace />;
  return <>{children}</>;
};
