import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { RouteGuard } from "@/components/RouteGuard";

// Public pages
import { LandingPageWithIntro } from "./components/LandingPageWithIntro";
import AuthPage from "./pages/AuthPage";
import HowItWorksPage from "./pages/HowItWorksPage";
import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";
import TermsPage from "./pages/TermsPage";
import SupportPage from "./pages/SupportPage";
import PricingPage from "./pages/PricingPage";
import FAQPage from "./pages/FAQPage";
import PrivacyPage from "./pages/PrivacyPage";
import NotFound from "./pages/NotFound";

// Farmer pages
import FarmerDashboard from "./pages/farmer/FarmerDashboard";
import CreateListing from "./pages/farmer/CreateListing";
import FarmerListings from "./pages/farmer/FarmerListings";
import FarmerOrders from "./pages/farmer/FarmerOrders";
import FarmerOrderDetail from "./pages/farmer/FarmerOrderDetail";
import FarmerWallet from "./pages/farmer/FarmerWallet";
import FarmerKYC from "./pages/farmer/FarmerKYC";
import FarmerProfile from "./pages/farmer/FarmerProfile";
import BuyerProfile from "./pages/buyer/BuyerProfile";
import AgentProfile from "./pages/agent/AgentProfile";
import AdminProfile from "./pages/admin/AdminProfile";

// Buyer pages
import BuyerDashboard from "./pages/buyer/BuyerDashboard";
import BuyerMarketplace from "./pages/buyer/BuyerMarketplace";
import BuyerListingDetail from "./pages/buyer/BuyerListingDetail";
import BuyerOrders from "./pages/buyer/BuyerOrders";
import BuyerOrderDetail from "./pages/buyer/BuyerOrderDetail";
import BuyerWallet from "./pages/buyer/BuyerWallet";
import BuyerKYC from "./pages/buyer/BuyerKYC";
import BuyerReports from "./pages/buyer/BuyerReports";

// Agent pages
import AgentDashboard from "./pages/agent/AgentDashboard";
import AgentFarmers from "./pages/agent/AgentFarmers";
import AgentInspections from "./pages/agent/AgentInspections";
import AgentInspectionDetail from "./pages/agent/AgentInspectionDetail";
import AgentDeliveries from "./pages/agent/AgentDeliveries";
import AgentReports from "./pages/agent/AgentReports";

// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminListings from "./pages/admin/AdminListings";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminLogistics from "./pages/admin/AdminLogistics";
import AdminPayments from "./pages/admin/AdminPayments";
import AdminReports from "./pages/admin/AdminReports";
import AdminKYCReview from "./pages/admin/AdminKYCReview";
import AdminDisputes from "./pages/admin/AdminDisputes";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter basename={import.meta.env.BASE_URL}>
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
              <Route path="/farmer/dashboard" element={<FarmerDashboard />} />
              <Route path="/farmer/create-listing" element={<CreateListing />} />
              <Route path="/farmer/listings" element={<FarmerListings />} />
              <Route path="/farmer/orders" element={<FarmerOrders />} />
              <Route path="/farmer/orders/:orderId" element={<FarmerOrderDetail />} />
              <Route path="/farmer/wallet" element={<FarmerWallet />} />
              <Route path="/farmer/profile" element={<FarmerProfile />} />
              <Route path="/farmer/kyc" element={<FarmerKYC />} />
              
              {/* Buyer */}
              <Route path="/buyer/dashboard" element={<BuyerDashboard />} />
              <Route path="/buyer/marketplace" element={<BuyerMarketplace />} />
              <Route path="/buyer/listings/:listingId" element={<BuyerListingDetail />} />
              <Route path="/buyer/orders" element={<BuyerOrders />} />
              <Route path="/buyer/orders/:orderId" element={<BuyerOrderDetail />} />
              <Route path="/buyer/wallet" element={<BuyerWallet />} />
              <Route path="/buyer/kyc" element={<BuyerKYC />} />
              <Route path="/buyer/reports" element={<BuyerReports />} />
              <Route path="/buyer/profile" element={<BuyerProfile />} />
              
              {/* Agent - Protected Routes */}
              <Route path="/agent/dashboard" element={
                <RouteGuard allowedRoles={['agent']} routeType="agent">
                  <AgentDashboard />
                </RouteGuard>
              } />
              <Route path="/agent/farmers" element={
                <RouteGuard allowedRoles={['agent']} routeType="agent">
                  <AgentFarmers />
                </RouteGuard>
              } />
              <Route path="/agent/inspections" element={
                <RouteGuard allowedRoles={['agent']} routeType="agent">
                  <AgentInspections />
                </RouteGuard>
              } />
              <Route path="/agent/inspections/:orderId" element={
                <RouteGuard allowedRoles={['agent']} routeType="agent">
                  <AgentInspectionDetail />
                </RouteGuard>
              } />
              <Route path="/agent/deliveries" element={
                <RouteGuard allowedRoles={['agent']} routeType="agent">
                  <AgentDeliveries />
                </RouteGuard>
              } />
              <Route path="/agent/reports" element={
                <RouteGuard allowedRoles={['agent']} routeType="agent">
                  <AgentReports />
                </RouteGuard>
              } />
              <Route path="/agent/profile" element={
                <RouteGuard allowedRoles={['agent']} routeType="agent">
                  <AgentProfile />
                </RouteGuard>
              } />
              
              {/* Admin - Protected Routes */}
              <Route path="/admin/dashboard" element={
                <RouteGuard allowedRoles={['admin']} routeType="admin">
                  <AdminDashboard />
                </RouteGuard>
              } />
              <Route path="/admin/users" element={
                <RouteGuard allowedRoles={['admin']} routeType="admin">
                  <AdminUsers />
                </RouteGuard>
              } />
              <Route path="/admin/users/:userId/kyc" element={
                <RouteGuard allowedRoles={['admin']} routeType="admin">
                  <AdminKYCReview />
                </RouteGuard>
              } />
              <Route path="/admin/listings" element={
                <RouteGuard allowedRoles={['admin']} routeType="admin">
                  <AdminListings />
                </RouteGuard>
              } />
              <Route path="/admin/orders" element={
                <RouteGuard allowedRoles={['admin']} routeType="admin">
                  <AdminOrders />
                </RouteGuard>
              } />
              <Route path="/admin/logistics" element={
                <RouteGuard allowedRoles={['admin']} routeType="admin">
                  <AdminLogistics />
                </RouteGuard>
              } />
              <Route path="/admin/payments" element={
                <RouteGuard allowedRoles={['admin']} routeType="admin">
                  <AdminPayments />
                </RouteGuard>
              } />
              <Route path="/admin/reports" element={
                <RouteGuard allowedRoles={['admin']} routeType="admin">
                  <AdminReports />
                </RouteGuard>
              } />
              <Route path="/admin/disputes" element={
                <RouteGuard allowedRoles={['admin']} routeType="admin">
                  <AdminDisputes />
                </RouteGuard>
              } />
              <Route path="/admin/profile" element={
                <RouteGuard allowedRoles={['admin']} routeType="admin">
                  <AdminProfile />
                </RouteGuard>
              } />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
