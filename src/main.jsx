import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./lib/auth.jsx";
import { configured } from "./lib/supabase.js";
import App from "./App.jsx";
import "./styles.css";

// Shows the real error on screen instead of a blank page.
class ErrorBoundary extends React.Component {
  state = { error: null };
  static getDerivedStateFromError(error) { return { error }; }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="center">
        <h2>Une erreur est survenue</h2>
        <p className="muted small">{String(this.state.error?.message || this.state.error)}</p>
        <button onClick={() => location.reload()}>Recharger</button>
      </div>
    );
  }
}

function NotConfigured() {
  return (
    <div className="login">
      <h1>🎤 MIKOLONGO</h1>
      <div className="card">
        <h3>Configuration manquante</h3>
        <p className="small">
          Le site est en ligne, mais il n'a pas reçu <code>VITE_SUPABASE_URL</code> et{" "}
          <code>VITE_SUPABASE_ANON_KEY</code> lors de la compilation. Ajoutez-les
          (GitHub : Settings → Secrets → Actions, ou Netlify : Environment variables), puis relancez le déploiement.
        </p>
      </div>
    </div>
  );
}

createRoot(document.getElementById("root")).render(
  <ErrorBoundary>
    {configured ? (
      <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    ) : (
      <NotConfigured />
    )}
  </ErrorBoundary>
);
