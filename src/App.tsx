import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import MobileNavigation from "./components/MobileNavigation";
import OfflineIndicator from "./components/OfflineIndicator";
import PWAInstallPrompt from "./components/PWAInstallPrompt";
import ErrorBoundary from "./components/ErrorBoundary";
import SocialIntegrationsPage from "./pages/SocialIntegrationsPage";
import SecurityDashboardPage from "./pages/SecurityDashboardPage";
import AdvancedAnalytics from "./pages/AdvancedAnalytics";
import CommunicationHub from "./pages/CommunicationHub";
import MonetizationTools from "./pages/MonetizationTools";
import ContentCreatorStudio from "./pages/ContentCreatorStudio";
import CommunityHub from "./pages/CommunityHub";
import { useIsMobile } from "./hooks/use-mobile";
import Index from "./pages/Index";
import PitchDeck from "./pages/PitchDeck";
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
import Website from "./pages/Website";
import Team from "./pages/Team";
import OrganizationPage from "./pages/OrganizationPage";
import TermsConditions from "./pages/TermsConditions";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import PurchaseXP from "./pages/PurchaseXP";
import XPPurchaseSuccess from "./pages/XPPurchaseSuccess";
import ShoutoutGenerator from "./pages/ShoutoutGenerator";
import MessageTemplates from "./pages/MessageTemplates";
import SentimentAnalysis from "./pages/SentimentAnalysis";
import SmartLinkPage from "./pages/SmartLinkPage";
import { NavigationIntegration } from "./components/NavigationIntegration";

const queryClient = new QueryClient();

const App = () => {
  const isMobile = useIsMobile();

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <NavigationIntegration>
              <ErrorBoundary>
                <div className="min-h-screen bg-background">
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/pitch-deck" element={<PitchDeck />} />
                    <Route path="/website" element={<Website />} />
                    <Route path="/auth/signin" element={<SignIn />} />
                    <Route path="/auth/signup" element={<SignUp />} />
                    <Route path="/auth/callback" element={<AuthCallback />} />
                    <Route path="/auth/email-confirmation" element={<EmailConfirmation />} />
                    <Route path="/terms" element={<TermsConditions />} />
                    <Route path="/privacy" element={<PrivacyPolicy />} />
                    <Route path="/team" element={<Team />} />
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
                    <Route path="/marketplace" element={<Marketplace />} />
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
                    <Route path="/feed" element={
                      <ProtectedRoute>
                        <Feed />
                      </ProtectedRoute>
                    } />
                    <Route path="/inbox" element={
                      <ProtectedRoute>
                        <Inbox />
                      </ProtectedRoute>
                    } />
                    <Route path="/organization" element={
                      <ProtectedRoute>
                        <OrganizationPage />
                      </ProtectedRoute>
                    } />
                    <Route path="/purchase-xp" element={
                      <ProtectedRoute>
                        <PurchaseXP />
                      </ProtectedRoute>
                    } />
                    <Route path="/xp-purchase-success" element={
                      <ProtectedRoute>
                        <XPPurchaseSuccess />
                      </ProtectedRoute>
                    } />
                    <Route path="/shoutout-generator" element={
                      <ProtectedRoute>
                        <ShoutoutGenerator />
                      </ProtectedRoute>
                    } />
                    <Route path="/message-templates" element={
                      <ProtectedRoute>
                        <MessageTemplates />
                      </ProtectedRoute>
                    } />
                    <Route path="/sentiment-analysis" element={
                      <ProtectedRoute>
                        <SentimentAnalysis />
                      </ProtectedRoute>
                    } />
                    <Route path="/social-integrations" element={
                      <ProtectedRoute>
                        <SocialIntegrationsPage />
                      </ProtectedRoute>
                    } />
                    <Route path="/security" element={
                      <ProtectedRoute>
                        <SecurityDashboardPage />
                      </ProtectedRoute>
                    } />
                    <Route path="/advanced-analytics" element={
                      <ProtectedRoute>
                        <AdvancedAnalytics />
                      </ProtectedRoute>
                    } />
                    <Route path="/communication-hub" element={
                      <ProtectedRoute>
                        <CommunicationHub />
                      </ProtectedRoute>
                    } />
                    <Route path="/monetization-tools" element={
                      <ProtectedRoute>
                        <MonetizationTools />
                      </ProtectedRoute>
                    } />
                    <Route path="/content-creator-studio" element={
                      <ProtectedRoute>
                        <ContentCreatorStudio />
                      </ProtectedRoute>
                    } />
                    <Route path="/community-hub" element={
                      <ProtectedRoute>
                        <CommunityHub />
                      </ProtectedRoute>
                    } />
                    
                    {/* Smart Link Public Landing */}
                    <Route path="/link/:slug" element={<SmartLinkPage />} />
                    
                    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                  
                  {/* Mobile-only components */}
                  {isMobile && (
                    <>
                      <MobileNavigation />
                      <OfflineIndicator />
                      <PWAInstallPrompt />
                    </>
                  )}
                </div>
              </ErrorBoundary>
            </NavigationIntegration>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;