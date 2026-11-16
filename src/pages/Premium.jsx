import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/auth.jsx";
import { readFileToText, fitLimit } from "../lib/importers.js";

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
  const [note, setNote] = useState("");

  useEffect(() => {
    supabase.from("credit_ledger").select("*").eq("student_id", profile.id)
      .order("created_at", { ascending: false }).limit(10).then(({ data }) => setLedger(data || []));
  }, [profile.id, profile.credits]);

  const waLink = `https://wa.me/${WA}?text=${encodeURIComponent(
    `Bonjour, je souhaite acheter ${qty} crédit${qty > 1 ? "s" : ""} Oral241 (${(qty * PRICE).toLocaleString("fr-FR")} F). ` +
    `Nom : ${profile.first_name} ${profile.last_name}. Téléphone : 0${profile.phone || ""}.`)}`;

  // File(s) -> text: photos, PDFs (text or scanned) and .txt files, in the order chosen.
  // The credit is only spent when the text is saved.
  async function onFiles(e) {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (!files.length) return;
    setErr(""); setNote("");
    const notes = [], parts = [];
    try {
      for (const f of files) {
        const t = await readFileToText(f, { token: session.access_token, onProgress: setBusy, notes });
        if (t) parts.push(t.trim());
      }
    } catch (x) {
      setBusy("");
      setErr(/Crédit/i.test(x.message) ? "Crédit insuffisant. Achetez des crédits via WhatsApp." : x.message);
      return;
    }
    const { text, cut } = fitLimit(parts.join("\n\n"));
    if (cut) notes.push("Le texte était trop long : il a été raccourci à environ 8 000 caractères.");
    if (!title && files[0]) setTitle(files[0].name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").slice(0, 80));
    if (text.length < 20) setErr("Peu de texte détecté. Essayez une photo plus nette, ou un autre fichier.");
    setBody(text); setNote(notes.join(" ")); setBusy("");
  }

  async function save() {
    setErr(""); setBusy("Enregistrement…");
    const { data, error } = await supabase.rpc("add_uploaded_text", { p_title: title, p_body: body });
    setBusy("");
    if (error) return setErr(/no credit/.test(error.message) ? "Crédit insuffisant. Achetez des crédits via WhatsApp." : "Texte trop court ou erreur. Vérifiez le texte.");
    await refreshProfile();
    nav(`/text/${data}`);
  }

  const credits = profile.credits;
  const total = (qty * PRICE).toLocaleString("fr-FR");
  const canSave = !busy && body.trim().length >= 20 && credits >= 1;

  return (
    <>
      <h2>Importer un texte</h2>

      <div className="card">
        <p><span className="pill">⭐ {credits} crédit{credits > 1 ? "s" : ""}</span> <span className="muted small">1 texte = 1 crédit</span></p>
        <details className="fold" open={credits < 1}>
          <summary>Acheter des crédits · {PRICE} F l'unité</summary>
          <p className="small">Combien de crédits ?</p>
          <div className="chips">
            {[1, 2, 3, 5, 10].map((n) => <button key={n} className={qty === n ? "" : "ghost"} aria-pressed={qty === n} onClick={() => setQty(n)}>{n}</button>)}
          </div>
          <a className="btn big" href={waLink} target="_blank" rel="noreferrer">💬 Commander · {total} F</a>
          <p className="hint">Vos crédits sont ajoutés après vérification du paiement.</p>
        </details>
      </div>

      <div className="card">
        <section className="step">
          <h3><span className="num">1</span>Choisissez un fichier</h3>
          <div className="row actions">
            <label className="btn">📎 Fichier<input type="file" accept="image/*,application/pdf,.pdf,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,.txt" multiple hidden onChange={onFiles} /></label>
            <label className="btn ghost">📷 Photo<input type="file" accept="image/*" capture="environment" hidden onChange={onFiles} /></label>
          </div>
          <p className="hint">Photo, PDF ou Word. Plusieurs fichiers possibles. Page bien à plat et bien éclairée.</p>
          {busy && <p className="busy" role="status"><span className="spinner" />{busy}</p>}
        </section>

        <section className="step">
          <h3><span className="num">2</span>Vérifiez le texte</h3>
          <label>Titre<input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex : Unit 3 – Climate change" /></label>
          <label>Texte
            <textarea rows={8} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Le texte apparaît ici. Vous pouvez aussi le coller ou le taper." />
          </label>
          {body && <p className="hint">{body.length.toLocaleString("fr-FR")} / 8 000 caractères · corrigez les fautes de lecture.</p>}
          {note && <p className="warn">{note}</p>}
          {err && <p className="err" role="alert">{err}</p>}
        </section>

        <section className="step">
          <h3><span className="num">3</span>Enregistrez</h3>
          <button onClick={save} disabled={!canSave} style={{ width: "100%" }}>
            {credits < 1 ? "1 crédit nécessaire" : "Enregistrer · 1 crédit"}
          </button>
          <p className="hint">{credits < 1 ? "Achetez un crédit ci-dessus pour continuer." : "L'analyse, le vocabulaire et les quiz sont créés automatiquement."}</p>
        </section>
      </div>

      {ledger.length > 0 && (
        <details className="card fold">
          <summary>Historique</summary>
          {ledger.map((l) => <p key={l.id} className="small">{new Date(l.created_at).toLocaleDateString("fr-FR")} · {l.delta > 0 ? "+" : ""}{l.delta} · {l.reason === "upload_text" ? "Texte importé" : "Crédit ajouté"}</p>)}
        </details>
      )}
    </>
  );
}
