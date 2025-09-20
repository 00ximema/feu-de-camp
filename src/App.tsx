import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
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
import MainCourante from "./pages/MainCourante";
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
  // Gestionnaire d'erreur pour capturer les erreurs de React
  useEffect(() => {
    const handleError = (error: ErrorEvent) => {
      if (error.message.includes('dispatcher is null') || 
          error.message.includes("can't access property")) {
        console.warn('React dispatcher error détecté, rechargement de la page...');
        window.location.reload();
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (event.reason?.message?.includes('dispatcher is null') ||
          event.reason?.message?.includes("can't access property")) {
        console.warn('React dispatcher error détecté dans une promesse, rechargement de la page...');
        window.location.reload();
      }
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Toaster />
        <Sonner />
        <OfflineIndicator />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/administratif" element={<Administratif />} />
          <Route path="/comptabilite" element={<Comptabilite />} />
          <Route path="/equipe" element={<Equipe />} />
          <Route path="/infirmerie" element={<Infirmerie />} />
          <Route path="/jeunes" element={<Jeunes />} />
          <Route path="/planning" element={<Planning />} />
          <Route path="/main-courante" element={<MainCourante />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;