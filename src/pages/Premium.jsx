import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/auth.jsx";
import { readPhoto, readPhotoAI } from "../lib/ocr.js";

// Seller WhatsApp number in international format (Gabon +241, no leading 0). Can be overridden with VITE_WHATSAPP_NUMBER.
const WA = (import.meta.env.VITE_WHATSAPP_NUMBER || "24176291922").replace(/\D/g, "");
const PRICE = 500; // F CFA per credit

export default function Premium() {
  const { profile, refreshProfile, session } = useAuth();
  const nav = useNavigate();
  const [ledger, setLedger] = useState([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");
  const [qty, setQty] = useState(1);

  useEffect(() => {
    supabase.from("credit_ledger").select("*").eq("student_id", profile.id)
      .order("created_at", { ascending: false }).limit(10).then(({ data }) => setLedger(data || []));
  }, [profile.id, profile.credits]);

  const waLink = `https://wa.me/${WA}?text=${encodeURIComponent(
    `Bonjour, je souhaite acheter ${qty} crédit${qty > 1 ? "s" : ""} Oral241 (${(qty * PRICE).toLocaleString("fr-FR")} F). ` +
    `Nom : ${profile.first_name} ${profile.last_name}. Téléphone : 0${profile.phone || ""}.`)}`;

  // Photo -> text. First choice: AI vision on the server. If it is unavailable, fall back to in-browser OCR.
  // The credit is only spent when the text is saved.
  async function onPhoto(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setErr(""); setBusy("Lecture du texte par l'IA… (10 à 30 secondes)");
    let text = "";
    try { text = await readPhotoAI(file, session.access_token); }
    catch (aiErr) {
      if (/Crédit/i.test(aiErr.message)) { setErr("Crédit insuffisant. Achetez des crédits via WhatsApp."); setBusy(""); return; }
      try { text = await readPhoto(file, (pct) => setBusy(`Lecture simplifiée… ${pct}%`)); }
      catch { setErr("Lecture impossible. Prenez une photo plus nette, bien éclairée."); setBusy(""); return; }
    }
    if (text.length < 20) setErr("Peu de texte détecté. Reprenez la photo plus près, bien à plat et bien éclairée.");
    setBody(text);
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
        <p><strong>{profile.credits}</strong> crédit(s). 1 crédit = 1 texte importé, avec analyse automatique, vocabulaire, grammaire, quiz, écoute et répétition.</p>
        <p className="small"><strong>1 crédit = {PRICE} F.</strong> Combien en voulez-vous ?</p>
        <div className="row">
          {[1, 2, 3, 5, 10].map((n) => <button key={n} className={qty === n ? "" : "ghost"} onClick={() => setQty(n)}>{n}</button>)}
        </div>
        <p className="small" style={{ textAlign: "center" }}>Total : <strong>{(qty * PRICE).toLocaleString("fr-FR")} F</strong></p>
        <a className="btn" href={waLink} target="_blank" rel="noreferrer">💬 Commander sur WhatsApp</a>
        <p className="muted small">Après votre paiement, vos crédits sont ajoutés à votre compte.</p>
      </div>

      <div className="card">
        <h3>Importer un texte</h3>
        <label className="btn ghost">📷 Photo ou image<input type="file" accept="image/*" capture="environment" hidden onChange={onPhoto} /></label>
        <p className="muted small">Conseil : photographiez la page bien à plat, de face, en pleine lumière, sans ombre, en cadrant seulement le texte anglais.</p>
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
