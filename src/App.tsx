import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { RouteGuard } from "@/components/RouteGuard";

const queryClient = new QueryClient();

const LandingPageWithIntro = lazy(async () => ({
  default: (await import("./components/LandingPageWithIntro")).LandingPageWithIntro,
}));
const AuthPage = lazy(() => import("./pages/AuthPage"));
const HowItWorksPage = lazy(() => import("./pages/HowItWorksPage"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const ContactPage = lazy(() => import("./pages/ContactPage"));
const TermsPage = lazy(() => import("./pages/TermsPage"));
const SupportPage = lazy(() => import("./pages/SupportPage"));
const PricingPage = lazy(() => import("./pages/PricingPage"));
const FAQPage = lazy(() => import("./pages/FAQPage"));
const PrivacyPage = lazy(() => import("./pages/PrivacyPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

const FarmerDashboard = lazy(() => import("./pages/farmer/FarmerDashboard"));
const CreateListing = lazy(() => import("./pages/farmer/CreateListing"));
const FarmerListings = lazy(() => import("./pages/farmer/FarmerListings"));
const FarmerOrders = lazy(() => import("./pages/farmer/FarmerOrders"));
const FarmerOrderDetail = lazy(() => import("./pages/farmer/FarmerOrderDetail"));
const FarmerWallet = lazy(() => import("./pages/farmer/FarmerWallet"));
const FarmerKYC = lazy(() => import("./pages/farmer/FarmerKYC"));
const FarmerProfile = lazy(() => import("./pages/farmer/FarmerProfile"));

const BuyerDashboard = lazy(() => import("./pages/buyer/BuyerDashboard"));
const BuyerMarketplace = lazy(() => import("./pages/buyer/BuyerMarketplace"));
const BuyerListingDetail = lazy(() => import("./pages/buyer/BuyerListingDetail"));
const BuyerOrders = lazy(() => import("./pages/buyer/BuyerOrders"));
const BuyerOrderDetail = lazy(() => import("./pages/buyer/BuyerOrderDetail"));
const BuyerWallet = lazy(() => import("./pages/buyer/BuyerWallet"));
const BuyerKYC = lazy(() => import("./pages/buyer/BuyerKYC"));
const BuyerReports = lazy(() => import("./pages/buyer/BuyerReports"));
const BuyerProfile = lazy(() => import("./pages/buyer/BuyerProfile"));

const AgentDashboard = lazy(() => import("./pages/agent/AgentDashboard"));
const AgentFarmers = lazy(() => import("./pages/agent/AgentFarmers"));
const AgentInspections = lazy(() => import("./pages/agent/AgentInspections"));
const AgentInspectionDetail = lazy(() => import("./pages/agent/AgentInspectionDetail"));
const AgentDeliveries = lazy(() => import("./pages/agent/AgentDeliveries"));
const AgentReports = lazy(() => import("./pages/agent/AgentReports"));
const AgentProfile = lazy(() => import("./pages/agent/AgentProfile"));

const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminListings = lazy(() => import("./pages/admin/AdminListings"));
const AdminProductImageLibrary = lazy(() => import("./pages/admin/AdminProductImageLibrary"));
const AdminOrders = lazy(() => import("./pages/admin/AdminOrders"));
const AdminLogistics = lazy(() => import("./pages/admin/AdminLogistics"));
const AdminPayments = lazy(() => import("./pages/admin/AdminPayments"));
const AdminReports = lazy(() => import("./pages/admin/AdminReports"));
const AdminKYCReview = lazy(() => import("./pages/admin/AdminKYCReview"));
const AdminDisputes = lazy(() => import("./pages/admin/AdminDisputes"));
const AdminProfile = lazy(() => import("./pages/admin/AdminProfile"));

const RouteLoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
      <p className="text-muted-foreground">Loading page...</p>
    </div>
  </div>
);

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter basename={import.meta.env.BASE_URL}>
            <Suspense fallback={<RouteLoadingFallback />}>
              <Routes>
                {/* Public */}
                <Route path="/" element={<LandingPageWithIntro />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/how-it-works" element={<HowItWorksPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/terms" element={<TermsPage />} />
                <Route path="/support" element={<SupportPage />} />
                <Route path="/pricing" element={<PricingPage />} />
                <Route path="/faq" element={<FAQPage />} />
                <Route path="/privacy" element={<PrivacyPage />} />
                
                {/* Farmer */}
                <Route path="/farmer/dashboard" element={<RouteGuard allowedRoles={['farmer']}><FarmerDashboard /></RouteGuard>} />
                <Route path="/farmer/create-listing" element={<RouteGuard allowedRoles={['farmer']}><CreateListing /></RouteGuard>} />
                <Route path="/farmer/listings" element={<RouteGuard allowedRoles={['farmer']}><FarmerListings /></RouteGuard>} />
                <Route path="/farmer/orders" element={<RouteGuard allowedRoles={['farmer']}><FarmerOrders /></RouteGuard>} />
                <Route path="/farmer/orders/:orderId" element={<RouteGuard allowedRoles={['farmer']}><FarmerOrderDetail /></RouteGuard>} />
                <Route path="/farmer/wallet" element={<RouteGuard allowedRoles={['farmer']}><FarmerWallet /></RouteGuard>} />
                <Route path="/farmer/profile" element={<RouteGuard allowedRoles={['farmer']}><FarmerProfile /></RouteGuard>} />
                <Route path="/farmer/kyc" element={<RouteGuard allowedRoles={['farmer']}><FarmerKYC /></RouteGuard>} />
                
                {/* Buyer */}
                <Route path="/buyer/dashboard" element={<RouteGuard allowedRoles={['buyer']}><BuyerDashboard /></RouteGuard>} />
                <Route path="/buyer/marketplace" element={<RouteGuard allowedRoles={['buyer']}><BuyerMarketplace /></RouteGuard>} />
                <Route path="/buyer/listings/:listingId" element={<RouteGuard allowedRoles={['buyer']}><BuyerListingDetail /></RouteGuard>} />
                <Route path="/buyer/orders" element={<RouteGuard allowedRoles={['buyer']}><BuyerOrders /></RouteGuard>} />
                <Route path="/buyer/orders/:orderId" element={<RouteGuard allowedRoles={['buyer']}><BuyerOrderDetail /></RouteGuard>} />
                <Route path="/buyer/wallet" element={<RouteGuard allowedRoles={['buyer']}><BuyerWallet /></RouteGuard>} />
                <Route path="/buyer/kyc" element={<RouteGuard allowedRoles={['buyer']}><BuyerKYC /></RouteGuard>} />
                <Route path="/buyer/reports" element={<RouteGuard allowedRoles={['buyer']}><BuyerReports /></RouteGuard>} />
                <Route path="/buyer/profile" element={<RouteGuard allowedRoles={['buyer']}><BuyerProfile /></RouteGuard>} />
                
                {/* Agent - Protected Routes */}
                <Route path="/agent/dashboard" element={
                  <RouteGuard allowedRoles={['agent']}>
                    <AgentDashboard />
                  </RouteGuard>
                } />
                <Route path="/agent/farmers" element={
                  <RouteGuard allowedRoles={['agent']}>
                    <AgentFarmers />
                  </RouteGuard>
                } />
                <Route path="/agent/inspections" element={
                  <RouteGuard allowedRoles={['agent']}>
                    <AgentInspections />
                  </RouteGuard>
                } />
                <Route path="/agent/inspections/:orderId" element={
                  <RouteGuard allowedRoles={['agent']}>
                    <AgentInspectionDetail />
                  </RouteGuard>
                } />
                <Route path="/agent/deliveries" element={
                  <RouteGuard allowedRoles={['agent']}>
                    <AgentDeliveries />
                  </RouteGuard>
                } />
                <Route path="/agent/reports" element={
                  <RouteGuard allowedRoles={['agent']}>
                    <AgentReports />
                  </RouteGuard>
                } />
                <Route path="/agent/profile" element={
                  <RouteGuard allowedRoles={['agent']}>
                    <AgentProfile />
                  </RouteGuard>
                } />
                
                {/* Admin - Protected Routes */}
                <Route path="/admin/dashboard" element={
                  <RouteGuard allowedRoles={['admin']}>
                    <AdminDashboard />
                  </RouteGuard>
                } />
                <Route path="/admin/users" element={
                  <RouteGuard allowedRoles={['admin']}>
                    <AdminUsers />
                  </RouteGuard>
                } />
                <Route path="/admin/users/:userId/kyc" element={
                  <RouteGuard allowedRoles={['admin']}>
                    <AdminKYCReview />
                  </RouteGuard>
                } />
                <Route path="/admin/listings" element={
                  <RouteGuard allowedRoles={['admin']}>
                    <AdminListings />
                  </RouteGuard>
                } />
                <Route path="/admin/create-listing" element={
                  <RouteGuard allowedRoles={['admin']}>
                    <CreateListing />
                  </RouteGuard>
                } />
                <Route path="/admin/media-library" element={
                  <RouteGuard allowedRoles={['admin']}>
                    <AdminProductImageLibrary />
                  </RouteGuard>
                } />
                <Route path="/admin/orders" element={
                  <RouteGuard allowedRoles={['admin']}>
                    <AdminOrders />
                  </RouteGuard>
                } />
                <Route path="/admin/logistics" element={
                  <RouteGuard allowedRoles={['admin']}>
                    <AdminLogistics />
                  </RouteGuard>
                } />
                <Route path="/admin/payments" element={
                  <RouteGuard allowedRoles={['admin']}>
                    <AdminPayments />
                  </RouteGuard>
                } />
                <Route path="/admin/reports" element={
                  <RouteGuard allowedRoles={['admin']}>
                    <AdminReports />
                  </RouteGuard>
                } />
                <Route path="/admin/disputes" element={
                  <RouteGuard allowedRoles={['admin']}>
                    <AdminDisputes />
                  </RouteGuard>
                } />
                <Route path="/admin/profile" element={
                  <RouteGuard allowedRoles={['admin']}>
                    <AdminProfile />
                  </RouteGuard>
                } />
                
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
