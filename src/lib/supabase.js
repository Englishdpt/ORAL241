import { createClient } from "@supabase/supabase-js";

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
export const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const supabase = createClient(SUPABASE_URL, ANON_KEY);

// Calls the student-auth Edge Function (sign-up, login, teacher code reset).
export async function callStudentAuth(body, accessToken = ANON_KEY) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/student-auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: ANON_KEY, Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || "Erreur réseau");
  return json;
}
