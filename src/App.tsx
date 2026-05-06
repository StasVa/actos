import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import Progress from "./pages/Progress.tsx";
import Goals from "./pages/Goals.tsx";
import Reviews from "./pages/Reviews.tsx";
import ReviewsDays from "./pages/ReviewsDays.tsx";
import ReviewsWeeks from "./pages/ReviewsWeeks.tsx";
import ReviewWeekDetail from "./pages/ReviewWeekDetail.tsx";
import ReviewDayDetail from "./pages/ReviewDayDetail.tsx";
import GoalDetail from "./pages/GoalDetail.tsx";
import ProjectDetail from "./pages/ProjectDetail.tsx";
import Ideas from "./pages/Ideas.tsx";
import Rituals from "./pages/Rituals.tsx";
import AllActions from "./pages/AllActions.tsx";
import AllDelegated from "./pages/AllDelegated.tsx";
import AllProjects from "./pages/AllProjects.tsx";
import NotFound from "./pages/NotFound.tsx";
import { ActionEditor } from "./components/ActionEditor";

import { GoalEditor } from "./components/GoalEditor";
import { RitualEditor } from "./components/RitualEditor";
import { CommandPalette } from "./components/CommandPalette";
import { KeyboardShortcuts } from "./components/KeyboardShortcuts";
import { GlobalSettingsHost } from "./components/GlobalSettingsHost";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner position="bottom-right" />
      <BrowserRouter>
        <ActionEditor />
        <GoalEditor />
        <RitualEditor />
        <GlobalSettingsHost />
        <CommandPalette />
        <KeyboardShortcuts />
        <Routes>
          {/* Default + legacy redirects */}
          <Route path="/" element={<Navigate to="/today" replace />} />
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
          <Route path="/reviews" element={<Navigate to="/reviews/days" replace />} />
          <Route path="/reviews/days" element={<ReviewsDays />} />
          <Route path="/reviews/days/:date" element={<ReviewDayDetail />} />
          <Route path="/reviews/weeks" element={<ReviewsWeeks />} />
          <Route path="/reviews/weeks/:yearWeek" element={<ReviewWeekDetail />} />
          <Route path="/reviews/months" element={<Reviews />} />

          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
