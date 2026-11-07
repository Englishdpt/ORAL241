import { Routes, Route, Navigate, NavLink } from "react-router-dom";
import { useAuth } from "./lib/auth.jsx";
import Login from "./pages/Login.jsx";
import Library from "./pages/Library.jsx";
import Study from "./pages/Study.jsx";
import Premium from "./pages/Premium.jsx";
import Teacher from "./pages/Teacher.jsx";
import TextEditor from "./pages/TextEditor.jsx";

export default function App() {
  const { session, profile, ready, isTeacher, signOut } = useAuth();
  if (!ready) return <p className="center muted">Chargement…</p>;
  if (!session) return <Login />;
  if (!profile) return (
    <div className="center"><p>Profil introuvable. Contactez votre professeur.</p><button onClick={signOut}>Déconnexion</button></div>
  );
  return (
    <>
      <header className="top">
        <strong>🎤 MIKOLONGO</strong>
        <nav>
          <NavLink to="/">Textes</NavLink>
          {!isTeacher && <NavLink to="/premium">⭐ Premium</NavLink>}
          {isTeacher && <NavLink to="/teacher">Enseignant</NavLink>}
          <button className="link" onClick={signOut}>Sortir</button>
        </nav>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<Library />} />
          <Route path="/text/:id" element={<Study />} />
          <Route path="/premium" element={<Premium />} />
          <Route path="/teacher" element={isTeacher ? <Teacher /> : <Navigate to="/" />} />
          <Route path="/teacher/texts" element={isTeacher ? <TextEditor /> : <Navigate to="/" />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </>
  );
}
