import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function Quiz({ textId, kind, title, items }) {
  const [k, setK] = useState(0);
  const [pick, setPick] = useState(null);
  const [score, setScore] = useState(0);
  const [fin, setFin] = useState(false);
  if (!items.length) return null;
  const q = items[k];

  const choose = (idx) => { if (pick !== null) return; setPick(idx); if (idx === q.answer) setScore((s) => s + 1); };
  async function next() {
    if (k + 1 < items.length) { setK(k + 1); setPick(null); return; }
    setFin(true);
    await supabase.from("exercise_results").insert({ text_id: textId, kind, score, total: items.length });
  }
  const restart = () => { setK(0); setPick(null); setScore(0); setFin(false); };

  return (
    <div className="card">
      <h4>{title}</h4>
      {fin ? (
        <><p className="sentence">Score : {score}/{items.length}</p><button onClick={restart}>Recommencer</button></>
      ) : (
        <>
          <p className="muted small">Question {k + 1}/{items.length}</p>
          <p className="sentence">{q.q}</p>
          {q.choices.map((c, idx) => (
            <button key={idx} onClick={() => choose(idx)}
              className={`choice ${pick === null ? "" : idx === q.answer ? "right" : idx === pick ? "wrong" : ""}`}>{c}</button>
          ))}
          {pick !== null && <><p className="small">{q.explain}</p><button onClick={next}>{k + 1 < items.length ? "Suivant" : "Terminer"}</button></>}
        </>
      )}
    </div>
  );
}
