import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/auth.jsx";

const WA = import.meta.env.VITE_WHATSAPP_NUMBER;

export default function Premium() {
  const { profile, refreshProfile } = useAuth();
  const nav = useNavigate();
  const [ledger, setLedger] = useState([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    supabase.from("credit_ledger").select("*").eq("student_id", profile.id)
      .order("created_at", { ascending: false }).limit(10).then(({ data }) => setLedger(data || []));
  }, [profile.id, profile.credits]);

  const waLink = `https://wa.me/${WA}?text=${encodeURIComponent(
    `Bonjour, je souhaite acheter des crédits MIKOLONGO. Élève : ${profile.first_name} ${profile.last_name}`)}`;

  // Free, in-browser OCR (Tesseract.js). The credit is only spent when the text is saved.
  async function onPhoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setErr(""); setBusy("Lecture de la photo… (peut prendre un moment)");
    try {
      const { createWorker } = await import("tesseract.js");
      const worker = await createWorker("eng");
      const { data } = await worker.recognize(file);
      await worker.terminate();
      setBody(data.text.replace(/-\n/g, "").replace(/\n(?!\n)/g, " ").trim());
    } catch { setErr("Lecture impossible. Prenez une photo plus nette, bien éclairée."); }
    setBusy("");
  }

  async function save() {
    setErr(""); setBusy("Enregistrement…");
    const { data, error } = await supabase.rpc("add_uploaded_text", { p_title: title, p_body: body });
    setBusy("");
    if (error) return setErr(/no credit/.test(error.message) ? "Crédit insuffisant. Achetez des crédits via WhatsApp." : "Texte trop court ou erreur. Vérifiez le texte.");
    await refreshProfile();
    nav(`/text/${data}`);
  }

  return (
    <>
      <h2>⭐ Premium</h2>
      <div className="card">
        <p><strong>{profile.credits}</strong> crédit(s). 1 crédit = 1 texte importé, avec écoute et répétition.</p>
        <a className="btn" href={waLink} target="_blank" rel="noreferrer">💬 Acheter des crédits par WhatsApp</a>
        <p className="muted small">Après paiement, votre professeur ajoute vos crédits.</p>
      </div>

      <div className="card">
        <h3>Importer un texte</h3>
        <label className="btn ghost">📷 Photo ou image<input type="file" accept="image/*" capture="environment" hidden onChange={onPhoto} /></label>
        {busy && <p className="muted">{busy}</p>}
        <label>Titre<input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Unit 3 – Climate change" /></label>
        <label>Texte (corrigez les erreurs de lecture avant d'enregistrer)
          <textarea rows={8} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Collez ou photographiez votre texte anglais…" />
        </label>
        {err && <p className="err">{err}</p>}
        <button onClick={save} disabled={!!busy || body.trim().length < 20}>Utiliser 1 crédit et enregistrer</button>
      </div>

      {ledger.length > 0 && <div className="card"><h4>Historique</h4>
        {ledger.map((l) => <p key={l.id} className="small">{new Date(l.created_at).toLocaleDateString("fr-FR")} · {l.delta > 0 ? "+" : ""}{l.delta} · {l.reason === "upload_text" ? "Texte importé" : "Crédit ajouté"}</p>)}
      </div>}
    </>
  );
}
