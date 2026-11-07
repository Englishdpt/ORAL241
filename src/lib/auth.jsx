import { createContext, useContext, useEffect, useState } from "react";
import { supabase, callStudentAuth } from "./supabase";

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(undefined); // undefined = loading, null = none
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setBooting(false); });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) { setProfile(null); return; }
    supabase.from("profiles").select("*, classes(name, series, join_code)")
      .eq("id", session.user.id).maybeSingle()
      .then(({ data }) => setProfile(data ?? null));
  }, [session]);

  const refreshProfile = async () => {
    if (!session) return;
    const { data } = await supabase.from("profiles").select("*, classes(name, series, join_code)")
      .eq("id", session.user.id).maybeSingle();
    setProfile(data ?? null);
  };

  async function studentAuth(action, fields) {
    const t = await callStudentAuth({ action, ...fields });
    await supabase.auth.setSession({ access_token: t.access_token, refresh_token: t.refresh_token });
  }
  async function teacherLogin(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error("Email ou mot de passe incorrect.");
  }

  const value = {
    session, profile, refreshProfile, studentAuth, teacherLogin,
    signOut: () => supabase.auth.signOut(),
    isTeacher: profile?.role === "teacher",
    ready: !booting && (!session || profile !== undefined),
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
