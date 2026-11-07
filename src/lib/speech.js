// Browser speech helpers (free, no API key): text-to-speech, speech recognition, scoring.
const LANG = import.meta.env?.VITE_SPEECH_LANG || "en-US";
const SR = typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);

export const PASS = 0.7; // share of words that must be matched to validate a sentence
export const speechSupported = !!SR;

// Cut a text into short, speakable segments (sentences, then clauses if too long).
export function segment(text, max = 70) {
  const clean = String(text || "").replace(/\s+/g, " ").trim();
  const sentences = clean.match(/[^.!?]+[.!?]+["')\]]*|[^.!?]+$/g) || [];
  const out = [];
  for (const raw of sentences) {
    const s = raw.trim();
    if (s.length <= max) { out.push(s); continue; }
    let cur = "";
    for (const part of s.match(/[^,;:]+[,;:]?\s*/g) || [s]) {
      if (cur.length >= 20 && (cur + part).length > max) { out.push(cur.trim()); cur = part; } else cur += part;
    }
    if (cur.trim()) out.push(cur.trim());
  }
  return out.filter((s) => /[a-z]/i.test(s));
}

const norm = (s) => s.toLowerCase().replace(/[^a-z0-9']/g, "");

function lev(a, b) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}
const same = (a, b) => a === b || (a.length > 4 && b.length > 4 && lev(a, b) <= 1);

// Word-by-word comparison (longest common subsequence). Returns score 0..1 and per-word result.
export function compare(spoken, target) {
  const t = target.split(/\s+/).map((w) => ({ w, n: norm(w) })).filter((x) => x.n);
  const s = spoken.split(/\s+/).map(norm).filter(Boolean);
  const m = t.length, n = s.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = same(t[i - 1].n, s[j - 1]) ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
  const ok = new Array(m).fill(false);
  for (let i = m, j = n; i > 0 && j > 0; ) {
    if (same(t[i - 1].n, s[j - 1])) { ok[i - 1] = true; i--; j--; }
    else if (dp[i - 1][j] >= dp[i][j - 1]) i--;
    else j--;
  }
  const matched = ok.filter(Boolean).length;
  return { score: m ? matched / m : 0, words: t.map((x, k) => ({ w: x.w, ok: ok[k] })) };
}

export function speak(text, { rate = 0.85, onend } = {}) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) { onend?.(); return; }
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = LANG; u.rate = rate;
  u.onend = u.onerror = () => onend?.();
  window.speechSynthesis.speak(u);
}

// Starts one recognition round. Returns a function that cancels it.
export function listen({ onresult, onerror, onend }) {
  const r = new SR();
  r.lang = LANG; r.interimResults = false; r.maxAlternatives = 1; r.continuous = false;
  r.onresult = (e) => onresult(e.results[0][0].transcript);
  r.onerror = (e) => onerror?.(e.error);
  r.onend = () => onend?.();
  r.start();
  return () => { try { r.abort(); } catch { /* already stopped */ } };
}
