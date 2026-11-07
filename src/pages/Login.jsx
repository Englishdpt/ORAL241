import { useState } from "react";
import { useAuth } from "../lib/auth.jsx";

export default function Login() {
  const { studentAuth, teacherLogin } = useAuth();
  const [mode, setMode] = useState("new"); // new | old | teacher
  const [f, setF] = useState({ firstName: "", lastName: "", code: "", classCode: localStorage.getItem("rr_class") || "", email: "", password: "" });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setErr(""); setBusy(true);
    try {
      if (mode === "teacher") await teacherLogin(f.email, f.password);
      else {
        await studentAuth(mode === "new" ? "signup" : "login", f);
        localStorage.setItem("rr_class", f.classCode.toUpperCase());
      }
    } catch (x) { setErr(x.message); }
    setBusy(false);
  }

  return (
    <div className="login">
      <h1>MIKOLONGO Voice Trainer</h1>
      <p className="muted">Suivez vos progrès en lecture</p>
      <form className="card" onSubmit={submit}>
        {mode !== "teacher" ? (
          <>
            <div className="tabs">
              <button type="button" className={mode === "new" ? "on" : ""} onClick={() => setMode("new")}>Nouvel élève</button>
              <button type="button" className={mode === "old" ? "on" : ""} onClick={() => setMode("old")}>Déjà inscrit</button>
            </div>
            <label>Prénom<input value={f.firstName} onChange={set("firstName")} placeholder="Votre prénom" required /></label>
            <label>Nom<input value={f.lastName} onChange={set("lastName")} placeholder="Votre nom" required /></label>
            <label>Code de la classe<input value={f.classCode} onChange={set("classCode")} placeholder="Donné par votre professeur" required /></label>
            <label>{mode === "new" ? "Code (choisissez un code, 4 à 12 caractères)" : "Votre code"}
              <input type="password" value={f.code} onChange={set("code")} placeholder="••••" minLength={4} maxLength={12} required />
            </label>
          </>
        ) : (
          <>
            <label>Email<input type="email" value={f.email} onChange={set("email")} required /></label>
            <label>Mot de passe<input type="password" value={f.password} onChange={set("password")} required /></label>
          </>
        )}
        {err && <p className="err">{err}</p>}
        <button disabled={busy}>{busy ? "…" : mode === "new" ? "Créer mon compte" : "Se connecter"}</button>
      </form>
      <button className="link" onClick={() => setMode(mode === "teacher" ? "old" : "teacher")}>
        {mode === "teacher" ? "← Espace élève" : "Espace enseignant →"}
      </button>
    </div>
  );
}
