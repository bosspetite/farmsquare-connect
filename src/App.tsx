import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";

// Public pages
import LandingPage from "./pages/LandingPage";
import AuthPage from "./pages/AuthPage";
import HowItWorksPage from "./pages/HowItWorksPage";
import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";
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
              <Route path="/" element={<LandingPage />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/how-it-works" element={<HowItWorksPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/contact" element={<ContactPage />} />
              
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
              
              {/* Agent */}
              <Route path="/agent/dashboard" element={<AgentDashboard />} />
              <Route path="/agent/farmers" element={<AgentFarmers />} />
              <Route path="/agent/inspections" element={<AgentInspections />} />
              <Route path="/agent/inspections/:orderId" element={<AgentInspectionDetail />} />
              <Route path="/agent/reports" element={<AgentReports />} />
              <Route path="/agent/profile" element={<AgentProfile />} />
              
              {/* Admin */}
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/users/:userId/kyc" element={<AdminKYCReview />} />
              <Route path="/admin/listings" element={<AdminListings />} />
              <Route path="/admin/orders" element={<AdminOrders />} />
              <Route path="/admin/logistics" element={<AdminLogistics />} />
              <Route path="/admin/payments" element={<AdminPayments />} />
              <Route path="/admin/reports" element={<AdminReports />} />
              <Route path="/admin/disputes" element={<AdminDisputes />} />
              <Route path="/admin/profile" element={<AdminProfile />} />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
