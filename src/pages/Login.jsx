import { useState } from "react";
import { useAuth } from "../lib/auth.jsx";

export default function Login() {
  const { studentAuth, teacherLogin } = useAuth();
  const [mode, setMode] = useState("new"); // new | old | teacher
  const [f, setF] = useState({ firstName: "", lastName: "", phone: "", code: "", email: "", password: "" });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setErr(""); setBusy(true);
    try {
      if (mode === "teacher") await teacherLogin(f.email, f.password);
      else await studentAuth(mode === "new" ? "signup" : "login", { firstName: f.firstName, lastName: f.lastName, phone: f.phone, code: f.code });
    } catch (x) { setErr(x.message); }
    setBusy(false);
  }

  return (
    <div className="login">
      <h1>🎤 Oral241</h1>
      <p className="muted">Préparez votre oral d'anglais au bac</p>
      <form className="card" onSubmit={submit}>
        {mode !== "teacher" ? (
          <>
            <div className="tabs">
              <button type="button" className={mode === "new" ? "on" : ""} onClick={() => setMode("new")}>Nouvel élève</button>
              <button type="button" className={mode === "old" ? "on" : ""} onClick={() => setMode("old")}>Déjà inscrit</button>
            </div>
            {mode === "new" && <>
              <label>Prénom<input value={f.firstName} onChange={set("firstName")} placeholder="Votre prénom" required /></label>
              <label>Nom<input value={f.lastName} onChange={set("lastName")} placeholder="Votre nom" required /></label>
            </>}
            <label>Numéro de téléphone (WhatsApp)<input type="tel" inputMode="tel" value={f.phone} onChange={set("phone")} placeholder="Ex : 076291922" required /></label>
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
