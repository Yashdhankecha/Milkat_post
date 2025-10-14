import { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import ProtectedRoute from "@/components/ProtectedRoute";
import RoleSelection from "@/components/RoleSelection";

// Pages
import Index from "./pages/Index";
import About from "./pages/About";
import Properties from "./pages/Properties";
import PropertyDetails from "./pages/PropertyDetails";
import Projects from "./pages/Projects";
import ProjectDetails from "./pages/ProjectDetails";
import Blog from "./pages/Blog";
import PostProperty from "./pages/PostProperty";
import EditProperty from "./pages/EditProperty";
import SubmitRequirement from "./pages/SubmitRequirement";
import Contact from "./pages/Contact";
import Profile from "./pages/Profile";
import Auth from "./pages/Auth";
import Rent from "./pages/Rent";
import Brokers from "./pages/Brokers";
import FAQ from "./pages/FAQ";
import NotFound from "./pages/NotFound";
import MemberRegistration from "./pages/MemberRegistration";

// Dashboards
import AdminDashboard from "./pages/dashboards/AdminDashboard";
import BuyerSellerDashboard from "./pages/dashboards/BuyerSellerDashboard";
import BrokerDashboard from "./pages/dashboards/BrokerDashboard";
import DeveloperDashboard from "./pages/dashboards/DeveloperDashboard";
import SocietyOwnerDashboard from "./pages/dashboards/SocietyOwnerDashboard";
import SocietyMemberDashboard from "./pages/dashboards/SocietyMemberDashboard";

// Lazy load additional pages
const Careers = lazy(() => import("./pages/Careers"));
const NRIBrokerRegistration = lazy(() => import("./pages/NRIBrokerRegistration"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/properties" element={<Properties />} />
            <Route path="/property/:id" element={<PropertyDetails />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/project/:id" element={<ProjectDetails />} />
            <Route path="/rent" element={<Rent />} />
            <Route path="/brokers" element={<Brokers />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/post-property" element={<PostProperty />} />
            <Route path="/edit-property/:id" element={<EditProperty />} />
            <Route path="/submit-requirement" element={<SubmitRequirement />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/member-registration" element={<MemberRegistration />} />
            <Route path="/role-selection" element={<RoleSelection />} />
            <Route path="/careers" element={<Careers />} />
            <Route path="/nri-broker-registration" element={<NRIBrokerRegistration />} />
            
            {/* Protected Dashboards */}
            <Route path="/admin/dashboard" element={
              <ProtectedRoute requiredRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/buyer-seller/dashboard" element={
              <ProtectedRoute requiredRole="buyer_seller">
                <BuyerSellerDashboard />
              </ProtectedRoute>
            } />
            <Route path="/broker/dashboard" element={
              <ProtectedRoute requiredRole="broker">
                <BrokerDashboard />
              </ProtectedRoute>
            } />
            <Route path="/developer/dashboard" element={
              <ProtectedRoute requiredRole="developer">
                <DeveloperDashboard />
              </ProtectedRoute>
            } />
            <Route path="/society-owner/dashboard" element={
              <ProtectedRoute requiredRole="society_owner">
                <SocietyOwnerDashboard />
              </ProtectedRoute>
            } />
          <Route path="/society-member/dashboard" element={
            <ProtectedRoute requiredRole="society_member">
              <SocietyMemberDashboard />
            </ProtectedRoute>
          } />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;