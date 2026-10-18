import { useEffect, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { AuthContext } from './auth-context';
import { isSupabaseConfigured, supabase, type UserRole } from '../lib/supabase';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);

  const refreshRole = async () => {
    if (!supabase) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setRole(null); return; }
    const { data, error } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
    if (error) { console.error('Could not load account role', error); setRole(null); return; }
    setRole((data?.role as UserRole | undefined) ?? 'participant');
  };

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      setSession(data.session);
      if (data.session) await refreshRole();
      if (active) setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (!nextSession) setRole(null);
      else window.setTimeout(() => { void refreshRole(); }, 0);
      setLoading(false);
    });
    return () => { active = false; subscription.unsubscribe(); };
  }, []);

  return <AuthContext.Provider value={{ configured: isSupabaseConfigured, loading, session, user: session?.user ?? null, role, refreshRole }}>{children}</AuthContext.Provider>;
}
