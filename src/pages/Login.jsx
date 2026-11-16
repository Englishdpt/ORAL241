import { useState } from "react";
import { useAuth } from "../lib/auth.jsx";

export default function Login() {
  const { studentAuth, teacherLogin } = useAuth();
  const [mode, setMode] = useState("new"); // new | old | teacher
  const [f, setF] = useState({ firstName: "", lastName: "", phone: "", code: "", email: "", password: "" });
  const [show, setShow] = useState(false);
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
            <div className="tabs" role="tablist">
              <button type="button" role="tab" aria-selected={mode === "new"} className={mode === "new" ? "on" : ""} onClick={() => setMode("new")}>Créer un compte</button>
              <button type="button" role="tab" aria-selected={mode === "old"} className={mode === "old" ? "on" : ""} onClick={() => setMode("old")}>Me connecter</button>
            </div>
            {mode === "new" && <>
              <label>Prénom<input value={f.firstName} onChange={set("firstName")} autoComplete="given-name" required /></label>
              <label>Nom<input value={f.lastName} onChange={set("lastName")} autoComplete="family-name" required /></label>
            </>}
            <label>Téléphone (WhatsApp)<input type="tel" inputMode="tel" value={f.phone} onChange={set("phone")} placeholder="Ex : 076291922" autoComplete="tel" required /></label>
            <label>{mode === "new" ? "Code secret (4 à 12 caractères)" : "Code secret"}
              <input type={show ? "text" : "password"} value={f.code} onChange={set("code")} minLength={4} maxLength={12}
                autoComplete={mode === "new" ? "new-password" : "current-password"} required />
            </label>
            <label style={{ display: "flex", gap: 8, alignItems: "center", fontWeight: 400 }}>
              <input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} style={{ width: "auto" }} /> Afficher le code
            </label>
            {mode === "new" && <p className="hint">Notez votre code : il sert à vous reconnecter.</p>}
          </>
        ) : (
          <>
            <label>Email<input type="email" value={f.email} onChange={set("email")} autoComplete="username" required /></label>
            <label>Mot de passe<input type="password" value={f.password} onChange={set("password")} autoComplete="current-password" required /></label>
          </>
        )}
        {err && <p className="err" role="alert">{err}</p>}
        <button disabled={busy}>{busy ? "…" : mode === "new" ? "Créer mon compte" : "Me connecter"}</button>
      </form>
      <button className="link" onClick={() => setMode(mode === "teacher" ? "old" : "teacher")}>
        {mode === "teacher" ? "← Espace élève" : "Espace enseignant →"}
      </button>
    </div>
  );
}
