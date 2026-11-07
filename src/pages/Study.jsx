import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import Practice from "../components/Practice.jsx";
import Quiz from "../components/Quiz.jsx";
import { METHOD } from "../lib/method";

const TABS = [["text", "📖 Texte"], ["analysis", "🧠 Analyse"], ["vocab", "🔤 Vocabulaire"], ["grammar", "✏️ Grammaire"]];

export default function Study() {
  const { id } = useParams();
  const [text, setText] = useState(null);
  const [exos, setExos] = useState([]);
  const [tab, setTab] = useState("text");

  useEffect(() => {
    supabase.from("texts").select("*").eq("id", id).maybeSingle().then(({ data }) => setText(data || false));
    supabase.from("exercises").select("*").eq("text_id", id).then(({ data }) => setExos(data || []));
  }, [id]);

  const analysisText = useMemo(
    () => (text?.analysis || []).map((s) => `${s.title.replace(/^\d+\.\s*/, "")}. ${s.content}`).join(" "), [text]);

  if (text === null) return <p className="muted">Chargement…</p>;
  if (text === false) return <p>Texte introuvable. <Link to="/">Retour</Link></p>;
  const quiz = (kind) => exos.filter((e) => e.kind === kind);

  return (
    <>
      <Link to="/" className="link">← Retour</Link>
      <h2>{text.title}</h2>
      <div className="tabs">{TABS.map(([k, l]) => <button key={k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>{l}</button>)}</div>

      {tab === "text" && <Practice key="text" textId={id} mode="text" content={text.body} />}

      {tab === "analysis" && <details className="card method">
        <summary>📋 Méthode d'analyse en 5 étapes</summary>
        {METHOD.map((m) => <div key={m.title}><h4>{m.title}</h4><ul>{m.items.map((it, k) => <li key={k}>{it}</li>)}</ul></div>)}
      </details>}

      {tab === "analysis" && (text.analysis.length === 0
        ? <p className="muted">{text.owner_id ? "Les textes importés n'ont pas d'analyse : elle est rédigée par votre professeur pour les textes de la classe." : "Pas d'analyse pour ce texte."}</p>
        : <>
            {text.analysis.map((s, i) => <div className="card" key={i}><h4>{s.title}</h4><p>{s.content}</p></div>)}
            <h3>Répéter l'analyse</h3>
            <Practice key="analysis" textId={id} mode="analysis" content={analysisText} />
          </>)}

      {tab === "vocab" && <>
        {text.vocabulary.map((v, i) => <div className="card" key={i}><strong>{v.word}</strong> — {v.meaning}<br /><em className="muted">{v.example}</em></div>)}
        {quiz("vocab").map((e) => <Quiz key={e.id} textId={id} kind="vocab" title={e.title} items={e.items} />)}
        {!text.vocabulary.length && !quiz("vocab").length && <p className="muted">Pas de vocabulaire pour ce texte.</p>}
      </>}

      {tab === "grammar" && <>
        {text.grammar_tips.map((g, i) => <div className="card" key={i}><h4>💡 {g.title}</h4><p>{g.content}</p></div>)}
        {quiz("grammar").map((e) => <Quiz key={e.id} textId={id} kind="grammar" title={e.title} items={e.items} />)}
        {!text.grammar_tips.length && !quiz("grammar").length && <p className="muted">Pas de grammaire pour ce texte.</p>}
      </>}
    </>
  );
}
