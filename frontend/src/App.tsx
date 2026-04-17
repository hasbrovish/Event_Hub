import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, HashRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/AppLayout";
import { AuthProvider } from "@/contexts/AuthContext";
import Dashboard from "./pages/Dashboard";
import EventDetail from "./pages/EventDetail";
import CalendarPage from "./pages/CalendarPage";
import CreateEvent from "./pages/CreateEvent";
import Preferences from "./pages/Preferences";
import Notifications from "./pages/Notifications";
import ManageEvents from "./pages/ManageEvents";
import PendingApprovals from "./pages/PendingApprovals";
import MySessions from "./pages/MySessions";
import Campaigns from "./pages/Campaigns";
import AdminPanel from "./pages/AdminPanel";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const Router = import.meta.env.VITE_ELECTRON === "true" ? HashRouter : BrowserRouter;

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Router>
          <AppLayout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/event/:id" element={<EventDetail />} />
              <Route path="/calendar" element={<CalendarPage />} />
              <Route path="/create-event" element={<CreateEvent />} />
              <Route path="/preferences" element={<Preferences />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/manage-events" element={<ManageEvents />} />
              <Route path="/approvals" element={<PendingApprovals />} />
              <Route path="/my-sessions" element={<MySessions />} />
              <Route path="/campaigns" element={<Campaigns />} />
              <Route path="/admin/access" element={<AdminPanel />} />
              <Route path="/admin/logs" element={<AdminPanel />} />
              <Route path="/admin/config" element={<AdminPanel />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AppLayout>
        </Router>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
