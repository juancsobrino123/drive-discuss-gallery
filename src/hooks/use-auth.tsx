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
  reloadProfile: () => Promise<void>;
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

  // Función para recargar el perfil desde la base de datos
  const reloadProfile = async () => {
    if (!user?.id) return;
    
    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('username, avatar_url')
        .eq('id', user.id)
        .maybeSingle();
      
      if (profileData) {
        setProfile(profileData);
      }
    } catch (error) {
      console.error('Error reloading profile:', error);
    }
  };

  useEffect(() => {
    // Función simple para manejar cambios de autenticación
    const handleAuthChange = async (session: Session | null) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        // Intentar cargar perfil real de la base de datos
        try {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('username, avatar_url')
            .eq('id', session.user.id)
            .maybeSingle();
          
          if (profileData) {
            setProfile(profileData);
          } else {
            // Crear perfil básico si no existe
            const username = session.user.email?.split('@')[0] || 'Usuario';
            setProfile({ username, avatar_url: null });
          }
        } catch (error) {
          console.error('Error loading profile:', error);
          // Fallback perfil básico
          const username = session.user.email?.split('@')[0] || 'Usuario';
          setProfile({ username, avatar_url: null });
        }
        
        // Cargar roles reales
        try {
          const { data: rolesData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', session.user.id);
          
          setRoles(rolesData?.map((r: any) => r.role) ?? ['general']);
        } catch (error) {
          console.error('Error loading roles:', error);
          setRoles(['general']);
        }
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
    reloadProfile,
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