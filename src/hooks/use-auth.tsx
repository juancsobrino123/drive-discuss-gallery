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
      console.log('🔧 AUTH HANDLER - Start:', { 
        mounted, 
        hasSession: !!session, 
        userId: session?.user?.id,
        userEmail: session?.user?.email 
      });
      
      if (!mounted) {
        console.log('🔧 AUTH HANDLER - Not mounted, returning');
        return;
      }
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        console.log('🔧 AUTH HANDLER - User found, loading profile and roles');
        
        // Load profile
        try {
          console.log('🔧 PROFILE QUERY - Starting for user:', session.user.id);
          
          const profileQuery = supabase
            .from('profiles')
            .select('username, avatar_url')
            .eq('id', session.user.id);
          
          console.log('🔧 PROFILE QUERY - Query built');
          
          const { data: profileData, error: profileError } = await profileQuery.maybeSingle();
          
          console.log('🔧 PROFILE QUERY - Result:', { 
            data: profileData, 
            error: profileError 
          });
          
          if (profileError) {
            console.error('🔧 PROFILE ERROR:', profileError);
            throw profileError;
          }
          
          if (profileData) {
            console.log('🔧 PROFILE - Found profile:', profileData);
            setProfile(profileData);
          } else {
            console.log('🔧 PROFILE - No profile found, creating one');
            // Create default profile
            const username = session.user.email?.split('@')[0] || 'Usuario';
            
            const { error: upsertError } = await supabase.from('profiles').upsert({ 
              id: session.user.id, 
              username 
            });
            
            if (upsertError) {
              console.error('🔧 PROFILE UPSERT ERROR:', upsertError);
            } else {
              console.log('🔧 PROFILE - Created successfully');
            }
            
            setProfile({ username, avatar_url: null });
          }
        } catch (error) {
          console.error('🔧 PROFILE - Catch error:', error);
          // Set fallback profile
          const username = session.user.email?.split('@')[0] || 'Usuario';
          setProfile({ username, avatar_url: null });
        }
        
        // Load roles
        try {
          console.log('🔧 ROLES QUERY - Starting for user:', session.user.id);
          
          const rolesQuery = supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", session.user.id);
          
          console.log('🔧 ROLES QUERY - Query built');
          
          const { data: rolesData, error: rolesError } = await rolesQuery;
          
          console.log('🔧 ROLES QUERY - Result:', { 
            data: rolesData, 
            error: rolesError 
          });
          
          if (rolesError) {
            console.error('🔧 ROLES ERROR:', rolesError);
            throw rolesError;
          }
          
          const rolesList = rolesData?.map((r: any) => r.role) ?? [];
          console.log('🔧 ROLES - Final roles list:', rolesList);
          setRoles(rolesList);
        } catch (error) {
          console.error('🔧 ROLES - Catch error:', error);
          setRoles([]);
        }
      } else {
        console.log('🔧 AUTH HANDLER - No user, clearing profile and roles');
        setProfile(null);
        setRoles([]);
      }
      
      if (mounted) {
        console.log('🔧 AUTH HANDLER - Setting loading to false');
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