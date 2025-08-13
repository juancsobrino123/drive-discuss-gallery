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
    let mounted = true;

    // Función para cargar datos del usuario
    const loadUserData = async (userId: string) => {
      try {
        // Cargar perfil
        const { data: profileData } = await supabase
          .from('profiles')
          .select('username, avatar_url')
          .eq('id', userId)
          .maybeSingle();

        if (mounted) {
          if (profileData) {
            setProfile(profileData);
          } else {
            // Crear perfil si no existe
            const username = user?.email?.split('@')[0] || 'Usuario';
            setProfile({ username, avatar_url: null });
          }
        }

        // Cargar roles
        const { data: rolesData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId);

        if (mounted) {
          setRoles(rolesData?.map((r: any) => r.role) || []);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        if (mounted) {
          setProfile(null);
          setRoles([]);
        }
      }
    };

    // Manejar cambios de autenticación
    const handleAuthChange = (event: string, session: Session | null) => {
      if (!mounted) return;

      setSession(session);
      setUser(session?.user || null);

      if (session?.user) {
        loadUserData(session.user.id);
      } else {
        setProfile(null);
        setRoles([]);
      }
      
      setLoading(false);
    };

    // Configurar listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthChange);

    // Verificar sesión inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleAuthChange('INITIAL_SESSION', session);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [user?.email]);

  // Permisos calculados
  const canCreateEvent = roles.includes('copiloto') || roles.includes('admin');
  const canUpload = roles.includes('copiloto') || roles.includes('admin');
  const isAdmin = roles.includes('admin');
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