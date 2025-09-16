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
import Website from "./pages/Website";
import Inbox from "./pages/Inbox";
import NotFound from "./pages/NotFound";
import SignIn from "./pages/auth/SignIn";
import SignUp from "./pages/auth/SignUp";
import AuthCallback from "./pages/auth/AuthCallback";
import EmailConfirmation from "./pages/auth/EmailConfirmation";
import UniversalProfile from "./pages/UniversalProfile";
import EditProfile from "./pages/EditProfile";
import BillingPayments from "./pages/BillingPayments";
import FanDashboard from "./pages/FanDashboard";
import FanCampaigns from "./pages/FanCampaigns";
import CreatorDashboard from "./pages/CreatorDashboard";
import Campaigns from "./pages/Campaigns";
import Marketplace from "./pages/Marketplace";
import Leaderboards from "./pages/Leaderboards";
import ManageRewards from "./pages/ManageRewards";
import RoleSelection from "./pages/RoleSelection";
import ProfileSetup from "./pages/ProfileSetup";
import Feed from "./pages/Feed";
import PurchaseXP from "./pages/PurchaseXP";
import XPPurchaseSuccess from "./pages/XPPurchaseSuccess";
import TermsConditions from "./pages/TermsConditions";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import AwardXP from "./pages/AwardXP";
import BulkXPUpdate from "./pages/BulkXPUpdate";
import ShoutoutGenerator from "./pages/ShoutoutGenerator";
import SentimentAnalysis from "./pages/SentimentAnalysis";
import { EnhancedPurchaseXP } from "./pages/EnhancedPurchaseXP";

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
            <Route path="/purchase-xp" element={<PurchaseXP />} />
            <Route path="/enhanced-purchase-xp" element={<EnhancedPurchaseXP />} />
            <Route path="/xp-purchase-success" element={<XPPurchaseSuccess />} />
            <Route path="/award-xp" element={<ProtectedRoute><AwardXP /></ProtectedRoute>} />
            <Route path="/bulk-xp-update" element={<ProtectedRoute><BulkXPUpdate /></ProtectedRoute>} />
            <Route path="/terms-conditions" element={<TermsConditions />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            
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
            <Route path="/profile/edit" element={
              <ProtectedRoute>
                <EditProfile />
              </ProtectedRoute>
            } />
            <Route path="/billing-payments" element={
              <ProtectedRoute>
                <BillingPayments />
              </ProtectedRoute>
            } />
            <Route path="/fan-dashboard" element={
              <ProtectedRoute>
                <FanDashboard />
              </ProtectedRoute>
            } />
            <Route path="/fan-campaigns" element={
              <ProtectedRoute>
                <FanCampaigns />
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
            <Route path="/inbox" element={
              <ProtectedRoute>
                <Inbox />
              </ProtectedRoute>
            } />
            <Route path="/feed" element={
              <ProtectedRoute>
                <Feed />
              </ProtectedRoute>
            } />
            <Route path="/shoutout-generator" element={
              <ProtectedRoute>
                <ShoutoutGenerator />
              </ProtectedRoute>
            } />
            <Route path="/sentiment-analysis" element={
              <ProtectedRoute>
                <SentimentAnalysis />
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
