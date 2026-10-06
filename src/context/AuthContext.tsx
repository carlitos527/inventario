import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase, type Perfil } from '@/lib/supabase';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  perfil: Perfil | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshPerfil: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [loading, setLoading] = useState(true);

  async function ensurePerfil(u: User) {
    const { data: existing } = await supabase
      .from('perfiles')
      .select('id')
      .eq('id', u.id)
      .maybeSingle();

    if (!existing) {
      const nombre = (u.user_metadata?.nombre as string) || '';
      const apellido = (u.user_metadata?.apellido as string) || '';
      const correo = u.email || '';
      const usuario = correo.split('@')[0];

      await supabase.from('perfiles').insert({
        id: u.id,
        nombre,
        apellido,
        correo,
        usuario,
        rol: 'usuario',
        estado: 'activo',
      });
    }

    const { data: perfilData } = await supabase
      .from('perfiles')
      .select('*')
      .eq('id', u.id)
      .maybeSingle();
    setPerfil(perfilData as Perfil | null);
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      if (data.session?.user) {
        ensurePerfil(data.session.user).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, newSession) => {
      (async () => {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        if (newSession?.user) {
          await ensurePerfil(newSession.user);
        } else {
          setPerfil(null);
        }
        setLoading(false);
      })();
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  async function refreshPerfil() {
    if (user) await ensurePerfil(user);
  }

  async function signOut() {
    await supabase.auth.signOut();
    setPerfil(null);
  }

  return (
    <AuthContext.Provider value={{ session, user, perfil, loading, signOut, refreshPerfil }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
