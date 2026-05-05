import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import GoalDetail from "./pages/GoalDetail.tsx";
import ProjectDetail from "./pages/ProjectDetail.tsx";
import Ideas from "./pages/Ideas.tsx";
import Rituals from "./pages/Rituals.tsx";
import AllActions from "./pages/AllActions.tsx";
import AllDelegated from "./pages/AllDelegated.tsx";
import AllProjects from "./pages/AllProjects.tsx";
import NotFound from "./pages/NotFound.tsx";
import { ActionEditor } from "./components/ActionEditor";
import { ProjectEditor } from "./components/ProjectEditor";
import { GoalEditor } from "./components/GoalEditor";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner position="bottom-right" />
      <ActionEditor />
      <ProjectEditor />
      <GoalEditor />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/goals/launch-youtube-channel" element={<GoalDetail />} />
          <Route path="/projects/shoot-video-1" element={<ProjectDetail />} />
          <Route path="/ideas" element={<Ideas />} />
          <Route path="/rituals" element={<Rituals />} />
          <Route path="/all-actions" element={<AllActions />} />
          <Route path="/all-delegated" element={<AllDelegated />} />
          <Route path="/all-projects" element={<AllProjects />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
