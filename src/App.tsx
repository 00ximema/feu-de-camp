import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
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

const App = () => {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000,
        retry: (failureCount) => {
          if (!navigator.onLine) return false;
          return failureCount < 3;
        },
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <BrowserRouter>
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
          <OfflineIndicator />
        </BrowserRouter>
        <Toaster />
        <Sonner />
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;