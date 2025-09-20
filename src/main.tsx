
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { register as registerSW } from "./services/serviceWorker";

// Force un rechargement complet en cas d'erreur de dispatcher
if (typeof window !== 'undefined') {
  window.addEventListener('error', (e) => {
    if (e.message.includes('dispatcher is null')) {
      window.location.reload();
    }
  });
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

// Enregistrer le service worker pour le mode hors ligne
registerSW();
