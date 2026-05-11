import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
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
import Start from "./pages/Start.tsx";
import Pricing from "./pages/Pricing.tsx";
import Manifesto from "./pages/Manifesto.tsx";
import Login from "./pages/Login.tsx";
import Auth from "./pages/Auth.tsx";
import AuthReset from "./pages/AuthReset.tsx";
import { AuthProvider } from "./lib/useAuth";
import { RequireAuth, RedirectIfAuthed } from "./components/AuthRoute";
import { EmailVerificationBanner } from "./components/EmailVerificationBanner";
import { LegalPrivacy, LegalTerms } from "./pages/LegalPlaceholder.tsx";
import { NoGoalsLayout } from "./components/NoGoalsLayout";
import { useStore } from "./store/useStore";
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

const queryClient = new QueryClient();

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
  const hasActiveGoal = useStore((s) => s.goals.some((g) => g.status === "active"));
  if (pathname === "/") return null;
  if (pathname.startsWith("/pricing")) return null;
  if (pathname.startsWith("/start")) return null;
  if (pathname.startsWith("/manifesto")) return null;
  if (pathname.startsWith("/login")) return null;
  if (pathname.startsWith("/auth")) return null;
  if (pathname.startsWith("/legal")) return null;
  if (pathname.startsWith("/setup")) return null;
  if (pathname.startsWith("/onboarding")) return null;
  // No-goals mode also hides global chrome.
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
  const hasActiveGoal = useStore((s) => s.goals.some((g) => g.status === "active"));
  const exempt =
    pathname === "/" ||
    pathname.startsWith("/pricing") ||
    pathname.startsWith("/start") ||
    pathname.startsWith("/manifesto") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/legal") ||
    pathname.startsWith("/setup") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/onboarding/goal");
  if (!hasActiveGoal && !exempt) return <NoGoalsLayout />;
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner position="bottom-right" />
      <BrowserRouter>
        <SetupGuard />
        <ChromeOnlyOutsideSetup>
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
          {/* Setup wizard (no chrome) */}
          <Route path="/setup" element={<Setup />} />
          <Route path="/onboarding/goal" element={<GoalBuilder />} />

          {/* Admin */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="users/:userId" element={<AdminUserDetail />} />
            <Route path="feedback" element={<AdminFeedback />} />
            <Route path="billing" element={<AdminBilling />} />
            <Route path="audit" element={<AdminAudit />} />
            <Route path="announcements" element={<AdminAnnouncements />} />
          </Route>
          <Route path="/admin/components" element={<AdminComponents />} />

          {/* Default + legacy redirects */}
          <Route path="/" element={<Landing />} />
          <Route path="/start" element={<Start />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/manifesto" element={<Manifesto />} />
          <Route path="/login" element={<Login />} />
          <Route path="/legal/privacy" element={<LegalPrivacy />} />
          <Route path="/legal/terms" element={<LegalTerms />} />
          <Route path="/home" element={<Navigate to="/today" replace />} />
          <Route path="/all-actions" element={<Navigate to="/actions" replace />} />
          <Route path="/all-projects" element={<Navigate to="/projects" replace />} />
          <Route path="/all-delegated" element={<Navigate to="/delegated" replace />} />

          {/* Primary routes */}
          <Route path="/today" element={<Index />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/goals" element={<Goals />} />
          <Route path="/goals/:id" element={<GoalDetail />} />
          <Route path="/projects" element={<AllProjects />} />
          <Route path="/projects/:id" element={<ProjectDetail />} />
          <Route path="/actions" element={<AllActions />} />
          <Route path="/delegated" element={<AllDelegated />} />
          <Route path="/rituals" element={<Rituals />} />
          <Route path="/ideas" element={<Ideas />} />
          <Route path="/sessions" element={<Sessions />} />
          <Route path="/sessions/new" element={<SessionBuilder />} />
          <Route path="/sessions/active" element={<SessionActive />} />
          <Route path="/sessions/:sessionId/summary" element={<SessionSummary />} />
          <Route path="/reviews" element={<Navigate to="/reviews/days" replace />} />
          <Route path="/reviews/days" element={<ReviewsDays />} />
          <Route path="/reviews/days/:date" element={<ReviewDayDetail />} />
          <Route path="/reviews/weeks" element={<ReviewsWeeks />} />
          <Route path="/reviews/weeks/:yearWeek" element={<ReviewWeekDetail />} />
          <Route path="/reviews/months" element={<ReviewsMonths />} />
          <Route path="/reviews/months/:yearMonth" element={<ReviewMonthDetail />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/settings/subscription" element={<SettingsSubscription />} />

          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        </NoGoalsGate>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
