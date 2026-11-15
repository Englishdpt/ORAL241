// Reads the English text from a photo of a book page (OCR with a vision model, much more accurate than in-browser OCR).
// Needs the secret GEMINI_API_KEY. Only signed-in users with a credit (or teachers) can call it.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false, autoRefreshToken: false } });
const GEMINI_KEY = Deno.env.get("GEMINI_API_KEY");
const MODELS = [Deno.env.get("GEMINI_MODEL"), "gemini-3.5-flash-lite", "gemini-3.8-flash", "gemini-3.6-flash"].filter(Boolean) as string[];

const SYSTEM = `You are a precise OCR engine for photos of school textbook pages.
Transcribe the English text visible in the image exactly as written.
- Keep paragraph breaks as blank lines; join the lines of one paragraph into a single line.
- Remove hyphenation at line ends and rebuild the whole words.
- Do not translate, correct, summarise, explain or add anything.
- If a title is clearly present, write it first on its own line.
- Skip page numbers, running headers and footers, line numbers, margin notes, and instructions or exercises written in French.
- If a word is unreadable, make the most likely reading from context rather than inventing text.
- If there is no readable English text, return an empty string.
Output ONLY the transcribed text, with no comments and no markdown.`;

async function ocr(image: string, mime: string) {
  const started = Date.now();
  let status = 0;
  for (const model of MODELS) {
    const left = 110_000 - (Date.now() - started);
    if (left < 15_000) break;
    try {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: "POST",
        headers: { "x-goog-api-key": GEMINI_KEY!, "content-type": "application/json" },
        signal: AbortSignal.timeout(Math.min(40_000, left)),
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM }] },
          contents: [{ role: "user", parts: [{ inlineData: { mimeType: mime, data: image } }, { text: "Transcribe the text of this page." }] }],
          generationConfig: { temperature: 0, maxOutputTokens: 4000 },
        }),
      });
      if (r.ok) {
        const j = await r.json();
        const parts = j.candidates?.[0]?.content?.parts ?? [];
        const text = parts.filter((p: any) => typeof p.text === "string" && !p.thought).map((p: any) => p.text).join("").trim();
        console.log(`ocr ok ${model} ${Date.now() - started}ms ${text.length} chars`);
        return { text, status: 200 };
      }
      status = r.status;
      console.log(`ocr fail ${model} ${r.status} ${(await r.text()).slice(0, 160)}`);
      if (r.status === 429 || r.status === 401 || r.status === 403) break;
    } catch (e) {
      status = 504;
      console.log(`ocr timeout/error ${model} ${String(e)}`);
    }
  }
  return { text: "", status: status || 502 };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Méthode non autorisée." }, 405);
  if (!GEMINI_KEY) return json({ error: "Lecture de photo non activée (clé GEMINI_API_KEY manquante)." }, 503);

  const token = (req.headers.get("Authorization") ?? "").replace("Bearer ", "");
  const { data: u } = await admin.auth.getUser(token);
  if (!u?.user) return json({ error: "Non autorisé." }, 401);
  const { data: me } = await admin.from("profiles").select("role, credits").eq("id", u.user.id).maybeSingle();
  if (!me || (me.role !== "teacher" && me.credits < 1)) return json({ error: "Crédit insuffisant." }, 402);

  let b: any;
  try { b = await req.json(); } catch { return json({ error: "Requête invalide." }, 400); }
  const image = String(b.image ?? "");
  const mime = ["image/jpeg", "image/png", "image/webp"].includes(b.mime) ? b.mime : "image/jpeg";
  if (image.length < 1000 || image.length > 6_000_000) return json({ error: "Image trop petite ou trop lourde." }, 400);

  const { text, status } = await ocr(image, mime);
  if (status === 429) return json({ error: "Beaucoup de demandes en même temps. Réessayez dans une minute." }, 429);
  if (status !== 200) return json({ error: "La lecture de la photo a échoué. Réessayez." }, 502);
  return json({ text });
});
