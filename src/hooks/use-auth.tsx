import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

console.log('Auth hook loading...');

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

  const loadProfile = async (userId: string) => {
    console.log('Auth Provider: loadProfile started for user:', userId);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('username, avatar_url')
        .eq('id', userId)
        .maybeSingle();
      
      console.log('Auth Provider: loadProfile query result:', { data, error });
      
      if (error) {
        console.error('Auth Provider: Error loading profile:', error);
        return;
      }
      
      if (data) {
        console.log('Auth Provider: Profile found, setting profile:', data);
        setProfile(data);
      } else {
        console.log('Auth Provider: No profile found, creating default...');
        // Create default profile
        const { data: userData } = await supabase.auth.getUser();
        if (userData.user) {
          const displayName = userData.user.user_metadata?.display_name || 
                            userData.user.user_metadata?.full_name || 
                            userData.user.user_metadata?.name ||
                            userData.user.email?.split('@')[0] || 
                            'Usuario';
          
          console.log('Auth Provider: Creating profile with name:', displayName);
          await supabase
            .from('profiles')
            .upsert({ 
              id: userId, 
              username: displayName 
            });
          setProfile({ username: displayName, avatar_url: null });
          console.log('Auth Provider: Default profile created');
        }
      }
      console.log('Auth Provider: loadProfile completed successfully');
    } catch (err) {
      console.error('Auth Provider: Error in loadProfile:', err);
    }
  };

  const loadRoles = async (userId: string) => {
    console.log('Auth Provider: loadRoles started for user:', userId);
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);
      
      console.log('Auth Provider: loadRoles query result:', { data, error });
      
      if (error) {
        console.error("Auth Provider: Error fetching roles", error);
        setRoles([]);
      } else {
        const userRoles = data?.map((r: any) => r.role) ?? [];
        console.log('Auth Provider: Setting roles:', userRoles);
        setRoles(userRoles);
      }
      console.log('Auth Provider: loadRoles completed successfully');
    } catch (err) {
      console.error('Auth Provider: Error in loadRoles:', err);
      setRoles([]);
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Clear all state
      setUser(null);
      setSession(null);
      setProfile(null);
      setRoles([]);
      
      return Promise.resolve();
    } catch (error) {
      console.error('Sign out failed:', error);
      throw error;
    }
  };

  useEffect(() => {
    let mounted = true;
    console.log('Auth Provider: useEffect starting...');

    const handleAuthChange = async (event: string, session: Session | null) => {
      console.log('Auth Provider: handleAuthChange called', { event, session: !!session, mounted });
      if (!mounted) return;
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        console.log('Auth Provider: User found, loading data...');
        try {
          await loadProfile(session.user.id);
          await loadRoles(session.user.id);
          console.log('Auth Provider: User data loaded successfully');
        } catch (error) {
          console.error('Error loading user data:', error);
        }
      } else {
        console.log('Auth Provider: No user, clearing data...');
        setProfile(null);
        setRoles([]);
      }
      
      if (mounted) {
        console.log('Auth Provider: Setting loading to false');
        setLoading(false);
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthChange);

    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted) {
        handleAuthChange('INITIAL_SESSION', session);
      }
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
  const canDownload = roles.length > 0; // Any authenticated user with roles can download

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