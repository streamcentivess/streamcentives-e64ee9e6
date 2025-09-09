import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Index from "./pages/Index";
import PitchDeck from "./pages/PitchDeck";
import Team from "./pages/Team";
import NotFound from "./pages/NotFound";
import SignIn from "./pages/auth/SignIn";
import SignUp from "./pages/auth/SignUp";
import AuthCallback from "./pages/auth/AuthCallback";
import EmailConfirmation from "./pages/auth/EmailConfirmation";
import UniversalProfile from "./pages/UniversalProfile";
import FanDashboard from "./pages/FanDashboard";
import CreatorDashboard from "./pages/CreatorDashboard";
import Campaigns from "./pages/Campaigns";
import Marketplace from "./pages/Marketplace";
import Leaderboards from "./pages/Leaderboards";
import ManageRewards from "./pages/ManageRewards";
import RoleSelection from "./pages/RoleSelection";
import ProfileSetup from "./pages/ProfileSetup";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/pitch" element={<PitchDeck />} />
            <Route path="/team" element={<Team />} />
            
            {/* Auth Routes */}
            <Route path="/auth/signin" element={<SignIn />} />
            <Route path="/auth/signup" element={<SignUp />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/auth/confirm" element={<EmailConfirmation />} />
            <Route path="/role-selection" element={
              <ProtectedRoute>
                <RoleSelection />
              </ProtectedRoute>
            } />
            <Route path="/profile-setup" element={
              <ProtectedRoute>
                <ProfileSetup />
              </ProtectedRoute>
            } />
            
            {/* Protected Routes */}
            <Route path="/universal-profile" element={
              <ProtectedRoute>
                <UniversalProfile />
              </ProtectedRoute>
            } />
            <Route path="/fan-dashboard" element={
              <ProtectedRoute>
                <FanDashboard />
              </ProtectedRoute>
            } />
            <Route path="/creator-dashboard" element={
              <ProtectedRoute>
                <CreatorDashboard />
              </ProtectedRoute>
            } />
            <Route path="/campaigns" element={
              <ProtectedRoute>
                <Campaigns />
              </ProtectedRoute>
            } />
            <Route path="/marketplace" element={
              <ProtectedRoute>
                <Marketplace />
              </ProtectedRoute>
            } />
            <Route path="/leaderboards" element={
              <ProtectedRoute>
                <Leaderboards />
              </ProtectedRoute>
            } />
            <Route path="/manage-rewards" element={
              <ProtectedRoute>
                <ManageRewards />
              </ProtectedRoute>
            } />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
