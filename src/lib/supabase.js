import { createClient } from "@supabase/supabase-js";

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
export const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// True only when the build received both variables. When false the app shows a
// clear setup message (see main.jsx) instead of crashing into a blank page.
export const configured = Boolean(SUPABASE_URL && ANON_KEY);

// Placeholder values keep createClient from throwing at import time.
export const supabase = createClient(
  configured ? SUPABASE_URL : "https://not-configured.invalid",
  configured ? ANON_KEY : "not-configured"
);

// Calls the student-auth Edge Function (sign-up, login, teacher code reset).
export async function callStudentAuth(body, accessToken = ANON_KEY) {
  if (!configured) throw new Error("Application non configurée (variables VITE_SUPABASE_*).");
  const res = await fetch(`${SUPABASE_URL}/functions/v1/student-auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: ANON_KEY, Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || "Erreur réseau");
  return json;
}
