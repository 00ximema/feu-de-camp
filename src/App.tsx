
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Administratif from "./pages/Administratif";
import NotFound from "./pages/NotFound";
import Comptabilite from "./pages/Comptabilite";
import Equipe from "./pages/Equipe";
import Infirmerie from "./pages/Infirmerie";
import Jeunes from "./pages/Jeunes";
import Planning from "./pages/Planning";
import OfflineIndicator from "./components/OfflineIndicator";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: (failureCount, error) => {
        // Ne pas réessayer si hors ligne
        if (!navigator.onLine) return false;
        return failureCount < 3;
      },
    },
  },
});

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <OfflineIndicator />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/administratif" element={<Administratif />} />
            <Route path="/comptabilite" element={<Comptabilite />} />
            <Route path="/equipe" element={<Equipe />} />
            <Route path="/infirmerie" element={<Infirmerie />} />
            <Route path="/jeunes" element={<Jeunes />} />
            <Route path="/planning" element={<Planning />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
