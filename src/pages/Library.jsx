import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/auth.jsx";

export default function Library() {
  const { profile, isTeacher } = useAuth();
  const [texts, setTexts] = useState(null);
  const series = profile?.classes?.series;

  useEffect(() => {
    supabase.from("texts").select("id, title, series, owner_id").order("created_at", { ascending: false })
      .then(({ data }) => setTexts(data || []));
  }, []);

  if (!texts) return <p className="muted center">Chargement…</p>;
  const mine = texts.filter((t) => t.owner_id && t.owner_id === profile.id);
  const official = texts.filter((t) => !t.owner_id && (!series || !t.series.length || t.series.includes(series)));
  const Card = ({ t }) => (
    <Link className="card item" to={`/text/${t.id}`}>
      <h3>{t.title}</h3>
      <span className="tag">{t.owner_id ? "Mon texte" : "Cours"}</span>
    </Link>
  );
  const credits = profile.credits;

  return (
    <>
      <div className="hello">
        <h2>Bonjour {profile.first_name} 👋</h2>
        {!isTeacher && <Link to="/premium" className="pill">⭐ {credits} crédit{credits > 1 ? "s" : ""}</Link>}
      </div>

      <Link className="btn big" to={isTeacher ? "/teacher/texts" : "/premium"}>
        {isTeacher ? "➕ Ajouter un texte" : "➕ Importer un texte"}
      </Link>

      {mine.length === 0 && official.length === 0 ? (
        <div className="card empty">
          <strong>Comment ça marche</strong>
          <ol className="steps">
            <li><span className="num">1</span><span>📷 Importez une photo, un PDF ou un fichier Word</span></li>
            <li><span className="num">2</span><span>🧠 Analyse, vocabulaire et quiz sont créés pour vous</span></li>
            <li><span className="num">3</span><span>🎤 Écoutez, répétez, progressez</span></li>
          </ol>
        </div>
      ) : (
        <>
          {mine.length > 0 && <><h3>Mes textes</h3><div className="grid">{mine.map((t) => <Card key={t.id} t={t} />)}</div></>}
          {official.length > 0 && <><h3>Textes du cours</h3><div className="grid">{official.map((t) => <Card key={t.id} t={t} />)}</div></>}
        </>
      )}
    </>
  );
}
