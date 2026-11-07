// Student sign-up / login WITHOUT email, plus teacher reset of a forgotten code.
// Each student gets a hidden synthetic auth user, so Row Level Security (auth.uid()) works as usual.
// The student's code is never stored as-is: password = HMAC-SHA256(secret pepper, email:code).
// Secrets: STUDENT_PEPPER (required), STUDENT_EMAIL_DOMAIN (optional).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

const URL_ = Deno.env.get("SUPABASE_URL")!;
const admin = createClient(URL_, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false, autoRefreshToken: false } });
const anon = createClient(URL_, Deno.env.get("SUPABASE_ANON_KEY")!, { auth: { persistSession: false, autoRefreshToken: false } });
const PEPPER = Deno.env.get("STUDENT_PEPPER")!;
const DOMAIN = Deno.env.get("STUDENT_EMAIL_DOMAIN") ?? "students.realrecorder.app"; // never mailed
const MAX_FAILS = 5;
const WINDOW_MIN = 15;

const slug = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

async function derive(email: string, code: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(PEPPER),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${email}:${code}`));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

const validCode = (c: string) => c.length >= 4 && c.length <= 12;

async function resetCode(req: Request, b: any) {
  const token = (req.headers.get("Authorization") ?? "").replace("Bearer ", "");
  const { data: u } = await admin.auth.getUser(token);
  if (!u?.user) return json({ error: "Non autorisé." }, 401);
  const { data: me } = await admin.from("profiles").select("role").eq("id", u.user.id).maybeSingle();
  const { data: stu } = await admin.from("profiles").select("class_id").eq("id", b.studentId).maybeSingle();
  const { data: cls } = stu?.class_id
    ? await admin.from("classes").select("teacher_id").eq("id", stu.class_id).maybeSingle()
    : { data: null };
  if (me?.role !== "teacher" || cls?.teacher_id !== u.user.id) return json({ error: "Non autorisé." }, 403);
  const newCode = String(b.newCode ?? "").trim();
  if (!validCode(newCode)) return json({ error: "Le code doit avoir 4 à 12 caractères." }, 400);
  const { data: target } = await admin.auth.admin.getUserById(b.studentId);
  if (!target?.user?.email) return json({ error: "Élève introuvable." }, 404);
  const { error } = await admin.auth.admin.updateUserById(b.studentId, {
    password: await derive(target.user.email, newCode),
  });
  if (error) return json({ error: "Échec de la réinitialisation." }, 500);
  await admin.from("login_attempts").delete().eq("email", target.user.email);
  return json({ ok: true });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Méthode non autorisée." }, 405);
  let b: any;
  try { b = await req.json(); } catch { return json({ error: "Requête invalide." }, 400); }

  if (b.action === "reset") return resetCode(req, b);
  if (b.action !== "signup" && b.action !== "login") return json({ error: "Action inconnue." }, 400);

  const first = String(b.firstName ?? "").trim();
  const last = String(b.lastName ?? "").trim();
  const code = String(b.code ?? "").trim();
  const classCode = String(b.classCode ?? "").trim().toUpperCase();
  if (first.length < 2 || last.length < 2 || first.length > 40 || last.length > 40)
    return json({ error: "Prénom et nom requis (2 à 40 caractères)." }, 400);
  if (!validCode(code)) return json({ error: "Le code doit avoir 4 à 12 caractères." }, 400);

  const { data: cls } = await admin.from("classes").select("id").eq("join_code", classCode).maybeSingle();
  if (!cls) return json({ error: "Code de classe inconnu. Demandez-le à votre professeur." }, 404);

  const email = `${slug(first)}.${slug(last)}.${cls.id.slice(0, 8)}@${DOMAIN}`;
  const password = await derive(email, code);

  if (b.action === "signup") {
    const { data: created, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
    if (error || !created.user) return json({ error: "Ce nom existe déjà dans cette classe. Utilisez « Déjà inscrit »." }, 409);
    const { error: pe } = await admin.from("profiles").insert({
      id: created.user.id, role: "student", first_name: first, last_name: last, class_id: cls.id,
    });
    if (pe) {
      await admin.auth.admin.deleteUser(created.user.id);
      return json({ error: "Création du profil impossible." }, 500);
    }
  } else {
    const since = new Date(Date.now() - WINDOW_MIN * 60_000).toISOString();
    const { count } = await admin.from("login_attempts")
      .select("*", { count: "exact", head: true }).eq("email", email).gte("at", since);
    if ((count ?? 0) >= MAX_FAILS) return json({ error: "Trop d'essais. Réessayez dans 15 minutes." }, 429);
  }

  const { data, error } = await anon.auth.signInWithPassword({ email, password });
  if (error || !data.session) {
    if (b.action === "login") await admin.from("login_attempts").insert({ email });
    return json({ error: "Nom, code ou code de classe incorrect." }, 401);
  }
  if (b.action === "login") await admin.from("login_attempts").delete().eq("email", email);
  return json({ access_token: data.session.access_token, refresh_token: data.session.refresh_token });
});
