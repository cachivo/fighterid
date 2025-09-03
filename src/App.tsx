import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminLayout from '@/components/AdminLayout';
import { FighterLicense } from '@/pages/FighterLicense';
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Predicciones from "./pages/Predicciones";
import EventoBetting from "./pages/EventoBetting";
import Events from "./pages/Events";
import EventDetail from "./pages/EventDetail";
import Fighters from "./pages/Fighters";
import ImportEvent from "./pages/ImportEvent";
import Dashboard from "./pages/admin/Dashboard";
import EventosDeportivos from "./pages/admin/EventosDeportivos";
import EventosDigitales from "./pages/admin/EventosDigitales";
import Servicios from "./pages/admin/Servicios";
import Ranking from "./pages/admin/Ranking";
import Comunidad from "./pages/admin/Comunidad";
import Configuracion from "./pages/admin/Configuracion";
import Votaciones from "./pages/admin/Votaciones";
import Betting from "./pages/admin/Betting";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/eventos" element={<Events />} />
            <Route path="/evento/:eventId" element={<EventDetail />} />
          <Route path="/fighters" element={
            <ProtectedRoute>
              <Fighters />
            </ProtectedRoute>
          } />
          <Route path="/fighters/license/:id" element={
            <ProtectedRoute>
              <FighterLicense />
            </ProtectedRoute>
          } />
            <Route path="/import-event" element={<ImportEvent />} />
            <Route path="/predicciones" element={<Predicciones />} />
            <Route path="/evento/:eventId/betting" element={<EventoBetting />} />
            <Route path="/admin/*" element={
              <ProtectedRoute>
                <AdminLayout>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/eventos-deportivos" element={<EventosDeportivos />} />
                    <Route path="/eventos-digitales" element={<EventosDigitales />} />
                    <Route path="/servicios" element={<Servicios />} />
                    <Route path="/ranking" element={<Ranking />} />
                    <Route path="/votaciones" element={<Votaciones />} />
                    <Route path="/betting" element={<Betting />} />
                    <Route path="/comunidad" element={<Comunidad />} />
                    <Route path="/configuracion" element={<Configuracion />} />
                  </Routes>
                </AdminLayout>
              </ProtectedRoute>
            } />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
