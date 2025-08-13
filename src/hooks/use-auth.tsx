import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: { username: string; avatar_url: string | null } | null;
  roles: string[];
  loading: boolean;
  canCreateEvent: boolean;
  canUpload: boolean;
  isAdmin: boolean;
  canDownload: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<{ username: string; avatar_url: string | null } | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setRoles([]);
  };

  useEffect(() => {
    // Función simple para manejar cambios de autenticación
    const handleAuthChange = (session: Session | null) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        // Crear perfil básico inmediatamente
        const username = session.user.email?.split('@')[0] || 'Usuario';
        setProfile({ username, avatar_url: null });
        
        // Establecer roles básicos
        setRoles(['general']);
      } else {
        setProfile(null);
        setRoles([]);
      }
      
      setLoading(false);
    };

    // Escuchar cambios de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      handleAuthChange(session);
    });

    // Verificar sesión inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleAuthChange(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Calcular permisos
  const canCreateEvent = roles.includes("copiloto") || roles.includes("admin");
  const canUpload = roles.includes("copiloto") || roles.includes("admin");
  const isAdmin = roles.includes("admin");
  const canDownload = !!user;

  const value: AuthContextType = {
    user,
    session,
    profile,
    roles,
    loading,
    canCreateEvent,
    canUpload,
    isAdmin,
    canDownload,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};