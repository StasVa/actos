import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { queryClient, persister } from "./lib/queryClient";
import { useGoalsQuery } from "./lib/queries/useGoals";
import { useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import Progress from "./pages/Progress.tsx";
import ReviewsMonths from "./pages/ReviewsMonths.tsx";
import ReviewMonthDetail from "./pages/ReviewMonthDetail.tsx";
import Goals from "./pages/Goals.tsx";

import ReviewsDays from "./pages/ReviewsDays.tsx";
import ReviewsWeeks from "./pages/ReviewsWeeks.tsx";
import ReviewWeekDetail from "./pages/ReviewWeekDetail.tsx";
import ReviewDayDetail from "./pages/ReviewDayDetail.tsx";
import GoalDetail from "./pages/GoalDetail.tsx";
import ProjectDetail from "./pages/ProjectDetail.tsx";
import Ideas from "./pages/Ideas.tsx";
import Sessions from "./pages/Sessions.tsx";
import SessionBuilder from "./pages/SessionBuilder.tsx";
import SessionActive from "./pages/SessionActive.tsx";
import SessionSummary from "./pages/SessionSummary.tsx";
import Rituals from "./pages/Rituals.tsx";
import AllActions from "./pages/AllActions.tsx";
import AllDelegated from "./pages/AllDelegated.tsx";
import AllProjects from "./pages/AllProjects.tsx";
import Settings from "./pages/Settings.tsx";
import SettingsSubscription from "./pages/SettingsSubscription.tsx";
import NotFound from "./pages/NotFound.tsx";
import Setup, { isSetupCompleted } from "./pages/Setup.tsx";
import GoalBuilder from "./pages/GoalBuilder.tsx";
import Landing from "./pages/Landing.tsx";
import AdminManifesto from "./pages/AdminManifesto.tsx";
import Pricing from "./pages/Pricing.tsx";
import Manifesto from "./pages/Manifesto.tsx";
import Auth from "./pages/Auth.tsx";
import AuthVerify from "./pages/AuthVerify.tsx";
import AuthReset from "./pages/AuthReset.tsx";
import { AuthProvider } from "./lib/useAuth";
import { RequireAuth, RedirectIfAuthed, RequireAdmin } from "./components/AuthRoute";
import { LegalPrivacy, LegalTerms } from "./pages/LegalPlaceholder.tsx";
import { NoGoalsLayout } from "./components/NoGoalsLayout";
import { ActionEditor } from "./components/ActionEditor";

import { GoalEditor } from "./components/GoalEditor";
import { RitualEditor } from "./components/RitualEditor";
import { CommandPalette } from "./components/CommandPalette";
import { KeyboardShortcuts } from "./components/KeyboardShortcuts";
import { GlobalSettingsHost } from "./components/GlobalSettingsHost";
import { ActiveSessionGuard } from "./components/ActiveSessionGuard";
import { MobileHeader } from "./components/MobileHeader";
import { AdminLayout } from "./admin/AdminLayout";
import AdminDashboard from "./admin/pages/AdminDashboard";
import AdminUsers from "./admin/pages/AdminUsers";
import AdminUserDetail from "./admin/pages/AdminUserDetail";
import AdminFeedback from "./admin/pages/AdminFeedback";
import AdminBilling from "./admin/pages/AdminBilling";
import AdminAudit from "./admin/pages/AdminAudit";
import AdminAnnouncements from "./admin/pages/AdminAnnouncements";
import AdminComponents from "./admin/pages/AdminComponents";
import { ImpersonationBanner } from "./admin/ImpersonationBanner";

/**
 * Redirects first-run users to /setup. Setup completion is tracked in
 * localStorage["actos.setup.completed"]; clearing it re-runs the wizard.
 * Admin routes are exempt so demo tooling stays reachable.
 */
const SetupGuard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    if (isSetupCompleted()) return;
    // Legacy users: existing persisted store predates the wizard — auto-mark
    // completed so they don't get bounced into setup and lose their data.
    try {
      if (localStorage.getItem("actos-store")) {
        localStorage.setItem("actos.setup.completed", "true");
        return;
      }
    } catch {}
    if (location.pathname === "/") return;
    if (location.pathname.startsWith("/pricing")) return;
    if (location.pathname.startsWith("/start")) return;
    if (location.pathname.startsWith("/manifesto")) return;
    if (location.pathname.startsWith("/login")) return;
    if (location.pathname.startsWith("/auth")) return;
    if (location.pathname.startsWith("/legal")) return;
    if (location.pathname.startsWith("/setup")) return;
    if (location.pathname.startsWith("/onboarding")) return;
    if (location.pathname.startsWith("/admin")) return;
    navigate("/setup", { replace: true });
  }, [location.pathname, navigate]);
  return null;
};

const ChromeOnlyOutsideSetup: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { pathname } = useLocation();
  const { data: goalsData, isLoading: goalsLoading } = useGoalsQuery();
  if (pathname === "/") return null;
  if (pathname.startsWith("/pricing")) return null;
  if (pathname.startsWith("/start")) return null;
  if (pathname.startsWith("/manifesto")) return null;
  if (pathname.startsWith("/login")) return null;
  if (pathname.startsWith("/auth")) return null;
  if (pathname.startsWith("/legal")) return null;
  if (pathname.startsWith("/setup")) return null;
  if (pathname.startsWith("/onboarding")) return null;
  // Keep chrome visible while goals are loading; only hide once we're sure
  // the user has no active goals (prevents flash on page reload).
  if (goalsLoading) return <>{children}</>;
  const hasActiveGoal = (goalsData ?? []).some((g) => g.status === "active");
  if (!hasActiveGoal && !pathname.startsWith("/admin") && !pathname.startsWith("/settings")) return null;
  return <>{children}</>;
};

/**
 * When the user has zero active goals, the entire app is replaced by the
 * goal-builder. The only exempt routes are /setup (first-run wizard),
 * /admin (demo tooling), /settings (escape hatch from the avatar menu),
 * and /onboarding/goal itself.
 */
const NoGoalsGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { pathname } = useLocation();
  const { data: goalsData, isLoading: goalsLoading } = useGoalsQuery();
  const exempt =
    pathname === "/" ||
    pathname.startsWith("/pricing") ||
    pathname.startsWith("/start") ||
    pathname.startsWith("/manifesto") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/legal") ||
    pathname.startsWith("/setup") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/onboarding/goal");
  // Hold blank during the initial goals hydration to prevent the NoGoalsLayout
  // flash on reload before the cache resolves.
  if (goalsLoading) return null;
  const hasActiveGoal = (goalsData ?? []).some((g) => g.status === "active");
  if (!hasActiveGoal && !exempt) return <NoGoalsLayout />;
  return <>{children}</>;
};

const App = () => (
  <PersistQueryClientProvider
    client={queryClient}
    persistOptions={{
      persister,
      maxAge: 1000 * 60 * 60 * 24, // 24 hours
      buster: "actos-v1",
    }}
  >
    <TooltipProvider>
      <Sonner position="bottom-right" />
      <BrowserRouter>
        <AuthProvider>
        <SetupGuard />
        <ChromeOnlyOutsideSetup>
          {/* EmailVerificationBanner removed: signup now uses inline /auth/verify flow. */}
          <ActionEditor />
          <GoalEditor />
          <RitualEditor />
          <GlobalSettingsHost />
          <CommandPalette />
          <KeyboardShortcuts />
          <ActiveSessionGuard />
          <MobileHeader />
          <ImpersonationBanner />
        </ChromeOnlyOutsideSetup>
        <NoGoalsGate>
        <Routes>
          {/* Setup wizard (no chrome) — gated */}
          <Route path="/setup" element={<RequireAuth><Setup /></RequireAuth>} />
          <Route path="/onboarding/goal" element={<RequireAuth><GoalBuilder /></RequireAuth>} />

          {/* Admin */}
          <Route path="/admin" element={<RequireAdmin><AdminLayout /></RequireAdmin>}>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="users/:userId" element={<AdminUserDetail />} />
            <Route path="feedback" element={<AdminFeedback />} />
            <Route path="billing" element={<AdminBilling />} />
            <Route path="audit" element={<AdminAudit />} />
            <Route path="announcements" element={<AdminAnnouncements />} />
          </Route>
          <Route path="/admin/components" element={<RequireAdmin><AdminComponents /></RequireAdmin>} />
          <Route path="/admin/manifesto" element={<RequireAdmin><AdminManifesto /></RequireAdmin>} />

          {/* Public + auth pages */}
          <Route path="/" element={<RedirectIfAuthed><Landing /></RedirectIfAuthed>} />
          <Route path="/start" element={<Navigate to="/" replace />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/manifesto" element={<Manifesto />} />
          <Route path="/login" element={<Navigate to="/auth" replace />} />
          <Route path="/auth" element={<RedirectIfAuthed><Auth /></RedirectIfAuthed>} />
          <Route path="/auth/verify" element={<AuthVerify />} />
          <Route path="/auth/reset" element={<AuthReset />} />
          <Route path="/legal/privacy" element={<LegalPrivacy />} />
          <Route path="/legal/terms" element={<LegalTerms />} />
          <Route path="/home" element={<Navigate to="/today" replace />} />
          <Route path="/all-actions" element={<Navigate to="/actions" replace />} />
          <Route path="/all-projects" element={<Navigate to="/projects" replace />} />
          <Route path="/all-delegated" element={<Navigate to="/delegated" replace />} />

          {/* Primary routes — all gated */}
          <Route path="/today" element={<RequireAuth><Index /></RequireAuth>} />
          <Route path="/progress" element={<RequireAuth><Progress /></RequireAuth>} />
          <Route path="/goals" element={<RequireAuth><Goals /></RequireAuth>} />
          <Route path="/goals/:id" element={<RequireAuth><GoalDetail /></RequireAuth>} />
          <Route path="/projects" element={<RequireAuth><AllProjects /></RequireAuth>} />
          <Route path="/projects/:id" element={<RequireAuth><ProjectDetail /></RequireAuth>} />
          <Route path="/actions" element={<RequireAuth><AllActions /></RequireAuth>} />
          <Route path="/delegated" element={<RequireAuth><AllDelegated /></RequireAuth>} />
          <Route path="/rituals" element={<RequireAuth><Rituals /></RequireAuth>} />
          <Route path="/ideas" element={<RequireAuth><Ideas /></RequireAuth>} />
          <Route path="/sessions" element={<RequireAuth><Sessions /></RequireAuth>} />
          <Route path="/sessions/new" element={<RequireAuth><SessionBuilder /></RequireAuth>} />
          <Route path="/sessions/active" element={<RequireAuth><SessionActive /></RequireAuth>} />
          <Route path="/sessions/:sessionId/summary" element={<RequireAuth><SessionSummary /></RequireAuth>} />
          <Route path="/reviews" element={<Navigate to="/reviews/days" replace />} />
          <Route path="/reviews/days" element={<RequireAuth><ReviewsDays /></RequireAuth>} />
          <Route path="/reviews/days/:date" element={<RequireAuth><ReviewDayDetail /></RequireAuth>} />
          <Route path="/reviews/weeks" element={<RequireAuth><ReviewsWeeks /></RequireAuth>} />
          <Route path="/reviews/weeks/:yearWeek" element={<RequireAuth><ReviewWeekDetail /></RequireAuth>} />
          <Route path="/reviews/months" element={<RequireAuth><ReviewsMonths /></RequireAuth>} />
          <Route path="/reviews/months/:yearMonth" element={<RequireAuth><ReviewMonthDetail /></RequireAuth>} />
          <Route path="/settings" element={<RequireAuth><Settings /></RequireAuth>} />
          <Route path="/settings/subscription" element={<RequireAuth><SettingsSubscription /></RequireAuth>} />

          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        </NoGoalsGate>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </PersistQueryClientProvider>
);

export default App;
