import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { METHOD } from "../lib/method";
import { vocabToText, vocabFromText, tipsToText, tipsFromText, quizToText, quizFromText } from "../lib/textFormat";

const blank = () => ({ id: null, title: "", series: "", body: "", steps: METHOD.map(() => ""), vocab: "", tips: "", quizVocab: "", quizGrammar: "" });

export default function TextEditor() {
  const [list, setList] = useState([]);
  const [form, setForm] = useState(null);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    const { data } = await supabase.from("texts").select("id, title, series, analysis").is("owner_id", null).order("created_at", { ascending: false });
    setList(data || []);
  }, []);
  useEffect(() => { load(); }, [load]);

  async function edit(id) {
    const [{ data: t }, { data: ex }] = await Promise.all([
      supabase.from("texts").select("*").eq("id", id).single(),
      supabase.from("exercises").select("*").eq("text_id", id),
    ]);
    const items = (k) => ex?.find((e) => e.kind === k)?.items || [];
    setMsg("");
    setForm({
      id, title: t.title, series: t.series.join(", "), body: t.body,
      steps: METHOD.map((_, i) => t.analysis[i]?.content || ""),
      vocab: vocabToText(t.vocabulary), tips: tipsToText(t.grammar_tips),
      quizVocab: quizToText(items("vocab")), quizGrammar: quizToText(items("grammar")),
    });
  }

  async function save(e) {
    e.preventDefault();
    setMsg("Enregistrement…");
    const row = {
      title: form.title.trim(), body: form.body.trim(),
      series: form.series.split(",").map((s) => s.trim().toUpperCase()).filter(Boolean),
      analysis: METHOD.map((m, i) => ({ title: m.title, content: form.steps[i].trim() })).filter((s) => s.content),
      vocabulary: vocabFromText(form.vocab), grammar_tips: tipsFromText(form.tips),
    };
    const q = form.id ? supabase.from("texts").update(row).eq("id", form.id) : supabase.from("texts").insert(row);
    const { data, error } = await q.select("id").single();
    if (error) return setMsg("Erreur : " + error.message);
    for (const [kind, title, src] of [["vocab", "Vocabulary quiz", form.quizVocab], ["grammar", "Grammar quiz", form.quizGrammar]]) {
      await supabase.from("exercises").delete().eq("text_id", data.id).eq("kind", kind);
      const items = quizFromText(src);
      if (items.length) await supabase.from("exercises").insert({ text_id: data.id, kind, title, items });
    }
    setForm(null); setMsg("✅ Texte enregistré."); load();
  }

  async function remove(id, title) {
    if (!confirm(`Supprimer « ${title} » et tous les résultats associés ?`)) return;
    const { error } = await supabase.from("texts").delete().eq("id", id);
    setMsg(error ? "Erreur : " + error.message : "Texte supprimé."); load();
  }

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  if (form) return (
    <form onSubmit={save}>
      <button type="button" className="link" onClick={() => setForm(null)}>← Annuler</button>
      <h2>{form.id ? "Modifier le texte" : "Nouveau texte"}</h2>
      <div className="card">
        <label>Titre<input value={form.title} onChange={set("title")} required /></label>
        <label>Séries concernées (séparées par des virgules, vide = toutes)<input value={form.series} onChange={set("series")} placeholder="A1, A2, B" /></label>
        <label>Texte anglais<textarea rows={10} value={form.body} onChange={set("body")} required /></label>
      </div>
      <div className="card">
        <h3>Analyse (méthode en 5 étapes)</h3>
        {METHOD.map((m, i) => (
          <label key={m.title}>{m.title}
            <textarea rows={4} value={form.steps[i]} onChange={(e) => setForm({ ...form, steps: form.steps.map((s, k) => (k === i ? e.target.value : s)) })} />
          </label>
        ))}
      </div>
      <div className="card">
        <h3>Vocabulaire et grammaire</h3>
        <label>Mots (une ligne par mot : mot | sens | exemple)<textarea rows={4} value={form.vocab} onChange={set("vocab")} /></label>
        <label>Conseils de grammaire (une ligne : titre | explication)<textarea rows={3} value={form.tips} onChange={set("tips")} /></label>
        <p className="muted small">Quiz, une ligne par question : question | choix A ; choix B ; choix C | numéro de la bonne réponse | explication. N'utilisez pas le caractère | dans le texte.</p>
        <label>Quiz de vocabulaire<textarea rows={4} value={form.quizVocab} onChange={set("quizVocab")} /></label>
        <label>Quiz de grammaire<textarea rows={4} value={form.quizGrammar} onChange={set("quizGrammar")} /></label>
      </div>
      {msg && <p className="err">{msg}</p>}
      <button>💾 Enregistrer</button>
    </form>
  );

  return (
    <>
      <Link to="/teacher" className="link">← Tableau de bord</Link>
      <h2>Mes textes</h2>
      <button onClick={() => { setMsg(""); setForm(blank()); }}>+ Nouveau texte</button>
      {msg && <p className="small">{msg}</p>}
      {list.map((t) => (
        <div className="card row spread" key={t.id}>
          <div><strong>{t.title}</strong><br /><span className="muted small">{t.series.length ? t.series.join(", ") : "Toutes séries"} · {t.analysis.length === 5 ? "✅ analyse complète" : `analyse ${t.analysis.length}/5`}</span></div>
          <div><button className="ghost" onClick={() => edit(t.id)}>Modifier</button> <button className="ghost" onClick={() => remove(t.id, t.title)}>🗑</button></div>
        </div>
      ))}
      {list.length === 0 && <p className="muted">Aucun texte. Créez le premier.</p>}
    </>
  );
}
