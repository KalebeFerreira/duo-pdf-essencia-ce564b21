import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { DeviceThemeApplier } from "@/components/DeviceThemeApplier";
import { AuthProvider } from "@/components/AuthProvider";
import { RequireAuth } from "@/components/RequireAuth";
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
        // NÃO forçar logout automático aqui: em mobile (Safari/in-app) isso pode disparar por erro transitório
        // e derrubar o usuário para /auth, parecendo que “nada funciona”.
        if (
          error?.message?.includes("JWT expired") ||
          error?.code === "PGRST301" ||
          error?.code === "PGRST303"
        ) {
          console.warn("Auth token issue detected; stopping retries.", error);
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

                <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
                <Route path="/create-pdf" element={<RequireAuth><CreatePdf /></RequireAuth>} />
                <Route path="/create-resume" element={<RequireAuth><CreateResume /></RequireAuth>} />
                <Route path="/create-ebook" element={<RequireAuth><CreateEbook /></RequireAuth>} />
                <Route path="/create-design" element={<RequireAuth><CreateDesign /></RequireAuth>} />
                <Route path="/scan-document" element={<RequireAuth><ScanDocument /></RequireAuth>} />
                <Route path="/convert-file" element={<RequireAuth><ConvertFile /></RequireAuth>} />
                <Route path="/automations" element={<RequireAuth><Automations /></RequireAuth>} />
                <Route path="/catalogs" element={<RequireAuth><Catalogs /></RequireAuth>} />
                <Route path="/catalog/new" element={<RequireAuth><CreateCatalog /></RequireAuth>} />
                <Route path="/catalog/:id" element={<RequireAuth><CreateCatalog /></RequireAuth>} />

                <Route path="/c/:id" element={<PublicCatalog />} />

                <Route path="/test-image-api" element={<RequireAuth><TestImageApi /></RequireAuth>} />
                <Route path="/test-ebook-api" element={<RequireAuth><TestEbookApi /></RequireAuth>} />

                <Route path="/pricing" element={<Pricing />} />
                <Route path="/settings" element={<RequireAuth><Settings /></RequireAuth>} />
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

