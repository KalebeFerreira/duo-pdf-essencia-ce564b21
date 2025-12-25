import React, { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { DeviceThemeApplier } from "@/components/DeviceThemeApplier";
import { AuthProvider } from "@/components/AuthProvider";
import { RequireAuth } from "@/components/RequireAuth";
import ErrorBoundary from "@/components/ErrorBoundary";
import { LoadingScreen } from "@/components/LoadingScreen";

// Páginas leves carregadas diretamente
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import Pricing from "./pages/Pricing";
import PublicCatalog from "./pages/PublicCatalog";

// Páginas pesadas carregadas sob demanda (code splitting)
const Dashboard = lazy(() => import("./pages/Dashboard"));
const CreatePdf = lazy(() => import("./pages/CreatePdf"));
const CreateResume = lazy(() => import("./pages/CreateResume"));
const CreateEbook = lazy(() => import("./pages/CreateEbook"));
const CreateDesign = lazy(() => import("./pages/CreateDesign"));
const Automations = lazy(() => import("./pages/Automations"));
const Settings = lazy(() => import("./pages/Settings"));
const Catalogs = lazy(() => import("./pages/Catalogs"));
const CreateCatalog = lazy(() => import("./pages/CreateCatalog"));
const ScanDocument = lazy(() => import("./pages/ScanDocument"));
const ConvertFile = lazy(() => import("./pages/ConvertFile"));
const TestImageApi = lazy(() => import("./pages/TestImageApi"));
const TestEbookApi = lazy(() => import("./pages/TestEbookApi"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 5 minutos de staleTime para evitar refetches constantes em mobile
      staleTime: 5 * 60 * 1000,
      // Cache por 10 minutos
      gcTime: 10 * 60 * 1000,
      retry: (failureCount, error: any) => {
        // NÃO forçar logout automático aqui: em mobile (Safari/in-app) isso pode disparar por erro transitório
        if (
          error?.message?.includes("JWT expired") ||
          error?.code === "PGRST301" ||
          error?.code === "PGRST303"
        ) {
          console.warn("Auth token issue detected; stopping retries.", error);
          return false;
        }
        // Máximo de 1 retry para não congelar UI em conexões instáveis
        return failureCount < 1;
      },
      refetchOnWindowFocus: false,
      // Não refazer fetch ao reconectar - evita loops em mobile com rede instável
      refetchOnReconnect: false,
    },
  },
});

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthProvider>
              <DeviceThemeApplier>
                <Suspense fallback={<LoadingScreen message="Carregando página..." />}>
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
                </Suspense>
              </DeviceThemeApplier>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
