import React, { Suspense, lazy } from "react";
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
import { useIsMobile } from "./hooks/use-mobile";
const YouTubeCallback = lazy(() => import("./pages/YouTubeCallback"));
const YouTubeActionConfiguratorPage = lazy(() => import("./pages/YouTubeActionConfiguratorPage"));
const SocialIntegrationsPage = lazy(() => import("./pages/SocialIntegrationsPage"));
const SecurityDashboardPage = lazy(() => import("./pages/SecurityDashboardPage"));
const AdvancedAnalytics = lazy(() => import("./pages/AdvancedAnalytics"));
const CommunicationHub = lazy(() => import("./pages/CommunicationHub"));
const MonetizationTools = lazy(() => import("./pages/MonetizationTools"));
const ContentCreatorStudio = lazy(() => import("./pages/ContentCreatorStudio"));
const CommunityHub = lazy(() => import("./pages/CommunityHub"));
const Index = lazy(() => import("./pages/Index"));
const PitchDeck = lazy(() => import("./pages/PitchDeck"));
const Inbox = lazy(() => import("./pages/Inbox"));
const NotFound = lazy(() => import("./pages/NotFound"));
const SignIn = lazy(() => import("./pages/auth/SignIn"));
const SignUp = lazy(() => import("./pages/auth/SignUp"));
const SponsorSignUp = lazy(() => import("./pages/auth/SponsorSignUp"));
const AuthCallback = lazy(() => import("./pages/auth/AuthCallback"));
const EmailConfirmation = lazy(() => import("./pages/auth/EmailConfirmation"));
const UniversalProfile = lazy(() => import("./pages/UniversalProfile"));
const EditProfile = lazy(() => import("./pages/EditProfile"));
const BillingPayments = lazy(() => import("./pages/BillingPayments"));
const FanDashboard = lazy(() => import("./pages/FanDashboard"));
const FanCampaigns = lazy(() => import("./pages/FanCampaigns"));
const CreatorDashboard = lazy(() => import("./pages/CreatorDashboard"));
const SponsorDashboard = lazy(() => import("./pages/SponsorDashboard"));
const SponsorProfileView = lazy(() => import("./pages/SponsorProfileView"));
const BrandProfile = lazy(() => import("./pages/BrandProfile"));
const Campaigns = lazy(() => import("./pages/Campaigns"));
const Marketplace = lazy(() => import("./pages/Marketplace"));
const Leaderboards = lazy(() => import("./pages/Leaderboards"));
const ManageRewards = lazy(() => import("./pages/ManageRewards"));
const RoleSelection = lazy(() => import("./pages/RoleSelection"));
const ProfileSetup = lazy(() => import("./pages/ProfileSetup"));
const Feed = lazy(() => import("./pages/Feed"));
const Website = lazy(() => import("./pages/Website"));
const Team = lazy(() => import("./pages/Team"));
const OrganizationPage = lazy(() => import("./pages/OrganizationPage"));
const TermsConditions = lazy(() => import("./pages/TermsConditions"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const PurchaseXP = lazy(() => import("./pages/PurchaseXP"));
const XPPurchaseSuccess = lazy(() => import("./pages/XPPurchaseSuccess"));
const ShoutoutGenerator = lazy(() => import("./pages/ShoutoutGenerator"));
const MessageTemplates = lazy(() => import("./pages/MessageTemplates"));
const SentimentAnalysis = lazy(() => import("./pages/SentimentAnalysis"));
const SmartLinkPage = lazy(() => import("./pages/SmartLinkPage"));
const SponsorOnboarding = lazy(() => import("./components/SponsorOnboarding"));
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
                  <Suspense fallback={<div className="p-6 text-muted-foreground">Loading...</div>}>
                    <Routes>
                      <Route path="/" element={<Index />} />
                      <Route path="/pitch-deck" element={<PitchDeck />} />
                      <Route path="/pitch" element={<PitchDeck />} />
                      <Route path="/website" element={<Website />} />
                      <Route path="/auth/signin" element={<SignIn />} />
                      <Route path="/auth/signup" element={<SignUp />} />
                      <Route path="/auth/sponsor-signup" element={<SponsorSignUp />} />
                        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/youtube/callback" element={<YouTubeCallback />} />
        <Route path="/youtube-configurator" element={
          <ProtectedRoute>
            <YouTubeActionConfiguratorPage />
          </ProtectedRoute>
        } />
                       <Route path="/auth/email-confirmation" element={<EmailConfirmation />} />
                      <Route path="/terms" element={<TermsConditions />} />
                      <Route path="/privacy" element={<PrivacyPolicy />} />
                      <Route path="/team" element={<Team />} />
                      <Route path="/role-selection" element={
                        <ProtectedRoute>
                          <RoleSelection />
                        </ProtectedRoute>
                      } />
                      <Route path="/sponsor-onboarding" element={
                        <ProtectedRoute>
                          <SponsorOnboarding />
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
                       <Route path="/sponsor-dashboard" element={
                         <ProtectedRoute>
                           <SponsorDashboard />
                         </ProtectedRoute>
                       } />
                        <Route path="/sponsor-profile" element={
                          <ProtectedRoute>
                            <SponsorProfileView />
                          </ProtectedRoute>
                        } />
                        <Route path="/brand-profile" element={<BrandProfile />} />
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
                  </Suspense>
                  
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