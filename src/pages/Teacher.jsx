import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { supabase, callStudentAuth } from "../lib/supabase";
import { useAuth } from "../lib/auth.jsx";

const ago = (d) => {
  if (!d) return "jamais";
  const m = Math.round((Date.now() - new Date(d)) / 60000);
  return m < 1 ? "à l'instant" : m < 60 ? `il y a ${m} min` : m < 1440 ? `il y a ${Math.round(m / 60)} h` : `il y a ${Math.round(m / 1440)} j`;
};
const steady = (r) => r.active_days_14 >= 5 ? ["🔥 Assidu", "good"] : r.active_days_14 >= 2 ? ["👍 Régulier", "mid"]
  : r.last_active ? ["⚠️ Irrégulier", "bad"] : ["💤 Inactif", "bad"];

export default function Teacher() {
  const { session } = useAuth();
  const [classes, setClasses] = useState([]);
  const [cid, setCid] = useState("");
  const [rows, setRows] = useState([]);
  const [credits, setCredits] = useState({});
  const [live, setLive] = useState(false);
  const [sel, setSel] = useState(null);
  const [detail, setDetail] = useState(null);
  const [msg, setMsg] = useState("");
  const timer = useRef();

  const loadClasses = useCallback(async () => {
    const { data } = await supabase.from("classes").select("*").order("created_at");
    setClasses(data || []);
    setCid((c) => c || data?.[0]?.id || "");
  }, []);
  useEffect(() => { loadClasses(); }, [loadClasses]);

  const loadBoard = useCallback(async () => {
    if (!cid) return;
    const [{ data: lb }, { data: pr }] = await Promise.all([
      supabase.rpc("class_leaderboard", { p_class: cid }),
      supabase.from("profiles").select("id, credits").eq("class_id", cid),
    ]);
    setRows(lb || []);
    setCredits(Object.fromEntries((pr || []).map((p) => [p.id, p.credits])));
  }, [cid]);

  // Live updates: any new attempt or quiz result from a student refreshes the ranking.
  useEffect(() => {
    loadBoard();
    const refresh = () => { clearTimeout(timer.current); timer.current = setTimeout(loadBoard, 600); };
    const ch = supabase.channel(`board-${cid}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "attempts" }, refresh)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "exercise_results" }, refresh)
      .subscribe((s) => setLive(s === "SUBSCRIBED"));
    return () => { clearTimeout(timer.current); supabase.removeChannel(ch); };
  }, [cid, loadBoard]);

  async function createClass(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const { error } = await supabase.from("classes").insert({ name: fd.get("name"), series: String(fd.get("series")).trim().toUpperCase(), teacher_id: session.user.id });
    if (!error) { e.target.reset(); loadClasses(); }
  }

  async function open(r) {
    setSel(r); setDetail(null); setMsg("");
    const [{ data: at }, { data: ex }] = await Promise.all([
      supabase.from("attempts").select("text_id, mode, segment, score, passed, created_at, texts(title)").eq("student_id", r.student_id).order("created_at", { ascending: false }).limit(1000),
      supabase.from("exercise_results").select("kind, score, total, created_at, texts(title)").eq("student_id", r.student_id).order("created_at", { ascending: false }),
    ]);
    const by = {};
    for (const a of at || []) {
      const k = `${a.text_id}|${a.mode}`;
      const o = (by[k] ||= { title: a.texts?.title, mode: a.mode, segs: new Set(), n: 0, sum: 0, last: a.created_at });
      o.n++; o.sum += Number(a.score); if (a.passed) o.segs.add(a.segment);
    }
    setDetail({ reading: Object.values(by), exercises: ex || [] });
  }

  async function addCredits() {
    const n = parseInt(prompt(`Crédits à ajouter pour ${sel.display_name} (ex: 1, 5, 10) :`, "1"), 10);
    if (!n) return;
    const { error } = await supabase.rpc("grant_credits", { p_student: sel.student_id, p_amount: n, p_note: "WhatsApp" });
    setMsg(error ? "Erreur : " + error.message : `✅ ${n} crédit(s) ajouté(s).`);
    loadBoard();
  }
  async function resetCode() {
    const code = prompt(`Nouveau code pour ${sel.display_name} (4 à 12 caractères) :`);
    if (!code) return;
    try { await callStudentAuth({ action: "reset", studentId: sel.student_id, newCode: code }, session.access_token); setMsg("✅ Code réinitialisé."); }
    catch (e) { setMsg("Erreur : " + e.message); }
  }

  const cls = classes.find((c) => c.id === cid);
  return (
    <>
      <h2>Tableau de bord {live && <span className="live">● live</span>}</h2>
      <div className="row">
        <Link className="btn ghost" to="/teacher/texts">📚 Gérer les textes</Link>
        <select value={cid} onChange={(e) => { setCid(e.target.value); setSel(null); }}>
          {classes.map((c) => <option key={c.id} value={c.id}>{c.name} · {c.series}</option>)}
        </select>
        {cls && <span className="tag">Code classe : <strong>{cls.join_code}</strong></span>}
      </div>
      <form className="row" onSubmit={createClass}>
        <input name="name" placeholder="Nouvelle classe (ex: Tle A2 – Lycée X)" required />
        <input name="series" placeholder="Série (A1, B, C, D…)" required style={{ maxWidth: 140 }} />
        <button>+ Créer</button>
      </form>

      <div className="card scroll">
        <table>
          <thead><tr><th>#</th><th>Élève</th><th>Phrases validées</th><th>Score moy.</th><th>Quiz</th><th>Assiduité (14 j)</th><th>Dernière activité</th><th>⭐</th></tr></thead>
          <tbody>
            {rows.map((r, i) => { const [label, cls2] = steady(r); return (
              <tr key={r.student_id} className={sel?.student_id === r.student_id ? "sel" : ""} onClick={() => open(r)}>
                <td>{i + 1}</td><td>{r.display_name}</td><td>{r.passed_segments}</td>
                <td>{r.avg_score != null ? Math.round(r.avg_score * 100) + "%" : "–"}</td>
                <td>{r.exercise_avg != null ? Math.round(r.exercise_avg * 100) + "%" : "–"}</td>
                <td><span className={`badge ${cls2}`}>{label}</span> {r.active_days_14} j</td>
                <td>{ago(r.last_active)}</td><td>{credits[r.student_id] ?? 0}</td>
              </tr>); })}
            {rows.length === 0 && <tr><td colSpan="8" className="muted">Aucun élève. Donnez le code de classe à vos élèves.</td></tr>}
          </tbody>
        </table>
      </div>

      {sel && (
        <div className="card">
          <h3>{sel.display_name}</h3>
          <div className="row"><button onClick={addCredits}>➕ Ajouter des crédits</button><button className="ghost" onClick={resetCode}>🔑 Nouveau code</button></div>
          {msg && <p className="small">{msg}</p>}
          {!detail ? <p className="muted">Chargement…</p> : <>
            <h4>Lecture</h4>
            {detail.reading.length === 0 && <p className="muted small">Aucune activité.</p>}
            {detail.reading.map((o, i) => <p key={i} className="small">{o.title} · {o.mode === "text" ? "Texte" : "Analyse"} : {o.segs.size} phrase(s) validée(s), {o.n} essai(s), moy. {Math.round((o.sum / o.n) * 100)}% · {ago(o.last)}</p>)}
            <h4>Exercices</h4>
            {detail.exercises.length === 0 && <p className="muted small">Aucun exercice.</p>}
            {detail.exercises.map((x, i) => <p key={i} className="small">{x.texts?.title} · {x.kind === "vocab" ? "Vocabulaire" : "Grammaire"} : {x.score}/{x.total} · {ago(x.created_at)}</p>)}
          </>}
        </div>
      )}
    </>
  );
}
