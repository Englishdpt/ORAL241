import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/auth.jsx";
import { segment, speak, listen, compare, speechSupported, PASS } from "../lib/speech";

const ERRORS = { "no-speech": "Aucun son détecté. Parlez plus fort.", "not-allowed": "Autorisez le microphone dans le navigateur.", "audio-capture": "Microphone introuvable." };

// Read-and-repeat loop: listen -> speak -> score -> save attempt -> next sentence.
export default function Practice({ textId, mode, content }) {
  const { session } = useAuth();
  const segs = useMemo(() => segment(content), [content]);
  const [i, setI] = useState(0);
  const [done, setDone] = useState(new Set());
  const [res, setRes] = useState(null);
  const [state, setState] = useState("idle"); // idle | speaking | listening
  const cancel = useRef(null);

  useEffect(() => { // resume where the student stopped
    supabase.from("attempts").select("segment").eq("text_id", textId).eq("mode", mode)
      .eq("passed", true).eq("student_id", session.user.id)
      .then(({ data }) => {
        const s = new Set((data || []).map((r) => r.segment));
        setDone(s);
        const first = segs.findIndex((_, k) => !s.has(k));
        setI(first === -1 ? 0 : first);
      });
    return () => { cancel.current?.(); window.speechSynthesis?.cancel(); };
  }, [textId, mode, segs, session.user.id]);

  const target = segs[i];
  const pct = segs.length ? Math.round((done.size / segs.length) * 100) : 0;

  function hear() { cancel.current?.(); setState("speaking"); speak(target, { onend: () => setState("idle") }); }

  function say() {
    if (!speechSupported) return;
    setRes(null); setState("speaking");
    speak(target, {
      onend: () => {
        setState("listening");
        cancel.current = listen({
          onresult: async (heard) => {
            const r = compare(heard, target);
            setRes({ ...r, heard }); setState("idle");
            const passed = r.score >= PASS;
            await supabase.from("attempts").insert({ text_id: textId, mode, segment: i, transcript: heard.slice(0, 300), score: r.score.toFixed(3), passed });
            if (passed) setDone((d) => new Set(d).add(i));
          },
          onerror: (e) => { setRes({ error: ERRORS[e] || `Erreur: ${e}` }); setState("idle"); },
          onend: () => setState((s) => (s === "listening" ? "idle" : s)),
        });
      },
    });
  }

  const go = (d) => { cancel.current?.(); setRes(null); setState("idle"); setI((k) => Math.max(0, Math.min(segs.length - 1, k + d))); };
  if (!segs.length) return <p className="muted">Texte vide.</p>;

  return (
    <div className="card">
      {!speechSupported && <p className="warn">La reconnaissance vocale n'est pas disponible sur ce navigateur. Utilisez Chrome ou Edge.</p>}
      <div className="progress"><div style={{ width: `${pct}%` }} /></div>
      <p className="muted small">Phrase {i + 1}/{segs.length} · {done.size} validée(s) · {pct}%</p>
      <p className="sentence">{target}</p>
      <div className="row">
        <button className="ghost" onClick={() => go(-1)} disabled={i === 0}>◀</button>
        <button onClick={hear} disabled={state !== "idle"}>🔊 Écouter</button>
        <button className={state === "listening" ? "rec" : "accent"} onClick={say} disabled={state === "speaking" || !speechSupported}>
          {state === "listening" ? "🎤 Parlez…" : "🎤 Répéter"}
        </button>
        <button className="ghost" onClick={() => go(1)} disabled={i === segs.length - 1}>▶</button>
      </div>
      {res?.error && <p className="err">{res.error}</p>}
      {res?.words && (
        <div className={res.score >= PASS ? "fb good" : "fb bad"}>
          <strong>{Math.round(res.score * 100)}%</strong> {res.score >= PASS ? "✅ Validée !" : "Réessayez."}
          <p>{res.words.map((w, k) => <span key={k} className={w.ok ? "w ok" : "w ko"}>{w.w} </span>)}</p>
          {res.score >= PASS && i < segs.length - 1 && <button onClick={() => go(1)}>Phrase suivante →</button>}
          {res.score >= PASS && i === segs.length - 1 && done.size === segs.length && <p>🏆 Texte terminé !</p>}
        </div>
      )}
    </div>
  );
}
