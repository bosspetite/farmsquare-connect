import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";

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

// Buyer pages
import BuyerDashboard from "./pages/buyer/BuyerDashboard";
import BuyerMarketplace from "./pages/buyer/BuyerMarketplace";
import BuyerListingDetail from "./pages/buyer/BuyerListingDetail";
import BuyerOrders from "./pages/buyer/BuyerOrders";
import BuyerOrderDetail from "./pages/buyer/BuyerOrderDetail";
import BuyerReports from "./pages/buyer/BuyerReports";

// Agent & Admin placeholders
import AgentDashboard from "./pages/agent/AgentDashboard";
import AdminDashboard from "./pages/admin/AdminDashboard";

const queryClient = new QueryClient();

const App = () => (
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
            <Route path="/buyer/reports" element={<BuyerReports />} />
            
            {/* Agent */}
            <Route path="/agent/*" element={<AgentDashboard />} />
            
            {/* Admin */}
            <Route path="/admin/*" element={<AdminDashboard />} />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
