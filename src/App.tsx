import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { DeviceThemeApplier } from "@/components/DeviceThemeApplier";
import { AuthProvider } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import CreatePdf from "./pages/CreatePdf";
import CreateResume from "./pages/CreateResume";
import CreateEbook from "./pages/CreateEbook";
import CreateDesign from "./pages/CreateDesign";
import Pricing from "./pages/Pricing";
import NotFound from "./pages/NotFound";
import Automations from "./pages/Automations";
import Settings from "./pages/Settings";
import Catalogs from "./pages/Catalogs";
import CreateCatalog from "./pages/CreateCatalog";
import PublicCatalog from "./pages/PublicCatalog";
import ScanDocument from "./pages/ScanDocument";
import ConvertFile from "./pages/ConvertFile";
import TestImageApi from "./pages/TestImageApi";
import TestEbookApi from "./pages/TestEbookApi";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        if (
          error?.message?.includes("JWT expired") ||
          error?.code === "PGRST301" ||
          error?.code === "PGRST303"
        ) {
          console.error("JWT expired detected, forcing logout");
          supabase.auth.signOut();
          // Navigation will be handled by the auth state listener in AuthProvider
          return false;
        }
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <DeviceThemeApplier>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/create-pdf" element={<CreatePdf />} />
                <Route path="/create-resume" element={<CreateResume />} />
                <Route path="/create-ebook" element={<CreateEbook />} />
                <Route path="/create-design" element={<CreateDesign />} />
                <Route path="/scan-document" element={<ScanDocument />} />
                <Route path="/convert-file" element={<ConvertFile />} />
                <Route path="/automations" element={<Automations />} />
                <Route path="/catalogs" element={<Catalogs />} />
                <Route path="/catalog/new" element={<CreateCatalog />} />
                <Route path="/catalog/:id" element={<CreateCatalog />} />
                <Route path="/c/:id" element={<PublicCatalog />} />
                <Route path="/test-image-api" element={<TestImageApi />} />
                <Route path="/test-ebook-api" element={<TestEbookApi />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </DeviceThemeApplier>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;

