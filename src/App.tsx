import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { StoreContextProvider } from "@/context/StoreContext";
import { AuthProvider } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LoginPopup from "@/components/LoginPopup";
import Home from "@/pages/Home";
import Cart from "@/pages/Cart";
import PlaceOrder from "@/pages/PlaceOrder";
import NotFound from "@/pages/NotFound";
import AdminDashboard from "@/pages/AdminDashboard";
import OrderHistory from "@/pages/OrderHistory";
import Profile from "@/pages/Profile";
import StaffDashboard from "@/pages/StaffDashboard";
import DeliveryDashboard from "@/pages/DeliveryDashboard";
import ProductManagement from "@/pages/ProductManagement";

const queryClient = new QueryClient();

const App = () => {
  const [showLogin, setShowLogin] = useState(false);

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <StoreContextProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                {showLogin && <LoginPopup setShowLogin={setShowLogin} />}
                <div className="min-h-screen flex flex-col">
                  <Navbar setShowLogin={setShowLogin} />
                  <div className="flex-1">
                    <Routes>
                      <Route path="/" element={<Home />} />
                      <Route path="/cart" element={<Cart />} />
                      <Route path="/order" element={<PlaceOrder />} />
                      <Route path="/admin" element={<AdminDashboard />} />
                      <Route path="/admin/products" element={<ProductManagement />} />
                      <Route path="/staff" element={<StaffDashboard />} />
                      <Route path="/delivery" element={<DeliveryDashboard />} />
                      <Route path="/orders" element={<OrderHistory />} />
                      <Route path="/profile" element={<Profile />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </div>
                  <Footer />
                </div>
              </BrowserRouter>
            </TooltipProvider>
          </StoreContextProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
};

export default App;
