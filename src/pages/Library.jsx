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

  if (!texts) return <p className="muted">Chargement…</p>;
  const mine = texts.filter((t) => t.owner_id && t.owner_id === profile.id);
  const official = texts.filter((t) => !t.owner_id && (!series || !t.series.length || t.series.includes(series)));
  const Card = ({ t }) => <Link className="card item" to={`/text/${t.id}`}><h3>{t.title}</h3><span className="tag">{t.owner_id ? "Importé" : "Classe"}</span></Link>;

  return (
    <>
      <h2>Bonjour {profile.first_name} 👋</h2>
      <p className="muted">{profile.classes ? `${profile.classes.name} · Série ${profile.classes.series}` : "Pas de classe"}
        {!isTeacher && <> · ⭐ {profile.credits} crédit(s)</>}</p>
      {mine.length > 0 && <><h3>Mes textes importés</h3><div className="grid">{mine.map((t) => <Card key={t.id} t={t} />)}</div></>}
      <h3>Textes de la classe</h3>
      {official.length === 0 ? <p className="muted">Aucun texte pour le moment.</p> : <div className="grid">{official.map((t) => <Card key={t.id} t={t} />)}</div>}
      {!isTeacher && <Link className="card promo" to="/premium">✨ Importez vos propres textes (photo) et répétez-les</Link>}
    </>
  );
}
