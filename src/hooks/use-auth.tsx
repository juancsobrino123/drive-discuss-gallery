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
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
    setSession(null);
    setProfile(null);
    setRoles([]);
    return Promise.resolve();
  };

  useEffect(() => {
    let mounted = true;

    const handleAuth = async (session: Session | null) => {
      if (!mounted) return;
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        // Load profile
        try {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('username, avatar_url')
            .eq('id', session.user.id)
            .single();
          
          if (profileData) {
            setProfile(profileData);
          } else {
            // Create default profile
            const username = session.user.email?.split('@')[0] || 'Usuario';
            await supabase.from('profiles').upsert({ 
              id: session.user.id, 
              username 
            });
            setProfile({ username, avatar_url: null });
          }
        } catch (error) {
          console.error('Profile error:', error);
          // Set fallback profile
          const username = session.user.email?.split('@')[0] || 'Usuario';
          setProfile({ username, avatar_url: null });
        }
        
        // Load roles
        try {
          const { data: rolesData } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", session.user.id);
          
          setRoles(rolesData?.map((r: any) => r.role) ?? []);
        } catch (error) {
          console.error('Roles error:', error);
          setRoles([]);
        }
      } else {
        setProfile(null);
        setRoles([]);
      }
      
      if (mounted) {
        setLoading(false);
      }
    };

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        await handleAuth(session);
      }
    );

    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleAuth(session);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Compute permission flags
  const canCreateEvent = roles.includes("copiloto") || roles.includes("admin");
  const canUpload = roles.includes("copiloto") || roles.includes("admin");
  const isAdmin = roles.includes("admin");
  const canDownload = !!user; // Any authenticated user can download

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