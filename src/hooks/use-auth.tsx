import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: any;
  roles: string[];
  loading: boolean;
  canCreateEvent: boolean;
  canUpload: boolean;
  isAdmin: boolean;
  canDownload: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const loadProfile = async (userId: string) => {
    console.log('AuthProvider: Loading profile for user:', userId);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('username, avatar_url')
        .eq('id', userId)
        .maybeSingle();
      
      console.log('AuthProvider: Profile query result:', { data, error });
      
      if (!error && data) {
        console.log('AuthProvider: Setting profile data:', data);
        setProfile(data);
      } else {
        console.log('AuthProvider: No profile found, creating default profile');
        const { data: userData } = await supabase.auth.getUser();
        if (userData.user) {
          const displayName = userData.user.user_metadata?.display_name || 
                            userData.user.user_metadata?.full_name || 
                            userData.user.user_metadata?.name ||
                            userData.user.email?.split('@')[0] || 
                            'Usuario';
          
          console.log('AuthProvider: Creating profile with display name:', displayName);
          await supabase
            .from('profiles')
            .upsert({ 
              id: userId, 
              username: displayName 
            });
          setProfile({ username: displayName, avatar_url: data?.avatar_url || null });
        }
      }
    } catch (err) {
      console.error('AuthProvider: Error loading profile:', err);
    }
  };

  const loadRoles = async (userId: string) => {
    console.log('AuthProvider: Loading roles for user:', userId);
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);
      
      console.log('AuthProvider: Roles query result:', { data, error });
      
      if (error) {
        console.error("AuthProvider: Error fetching roles", error);
        setRoles([]);
      } else {
        const userRoles = data?.map((r: any) => r.role) ?? [];
        console.log('AuthProvider: Setting roles:', userRoles);
        setRoles(userRoles);
      }
    } catch (err) {
      console.error('AuthProvider: Error loading roles:', err);
      setRoles([]);
    }
  };

  const signOut = async () => {
    try {
      console.log('AuthProvider: Starting sign out...');
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('AuthProvider: Sign out error:', error);
        throw error;
      }
      
      console.log('AuthProvider: Sign out successful, clearing state...');
      // Clear all state
      setUser(null);
      setSession(null);
      setProfile(null);
      setRoles([]);
      
      return Promise.resolve();
    } catch (error) {
      console.error('AuthProvider: Sign out failed:', error);
      throw error;
    }
  };

  useEffect(() => {
    let mounted = true;
    console.log('AuthProvider: useEffect starting...');

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('AuthProvider: Auth state changed', { event, session: !!session, mounted });
        if (!mounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          console.log('AuthProvider: Loading profile and roles for user:', session.user.id);
          try {
            await Promise.all([
              loadProfile(session.user.id),
              loadRoles(session.user.id)
            ]);
          } catch (error) {
            console.error('AuthProvider: Error loading profile/roles:', error);
          }
        } else {
          console.log('AuthProvider: No session, clearing data');
          setProfile(null);
          setRoles([]);
        }
        
        console.log('AuthProvider: Setting loading to false');
        setLoading(false);
      }
    );

    // Check initial session
    console.log('AuthProvider: Checking initial session...');
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      console.log('AuthProvider: Initial session check', { session: !!session, mounted });
      if (!mounted) return;
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        console.log('AuthProvider: Loading initial profile and roles for user:', session.user.id);
        try {
          await Promise.all([
            loadProfile(session.user.id),
            loadRoles(session.user.id)
          ]);
        } catch (error) {
          console.error('AuthProvider: Error loading initial profile/roles:', error);
        }
      }
      
      console.log('AuthProvider: Setting initial loading to false');
      setLoading(false);
    });

    return () => {
      console.log('AuthProvider: Cleanup');
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const canCreateEvent = roles.includes("copiloto") || roles.includes("admin");
  const canUpload = roles.includes("copiloto") || roles.includes("admin");
  const isAdmin = roles.includes("admin");
  const canDownload = roles.length > 0;

  console.log('AuthProvider: Current state', { 
    user: !!user, 
    profile: !!profile, 
    roles, 
    loading, 
    canCreateEvent, 
    canUpload, 
    isAdmin, 
    canDownload 
  });

  return (
    <AuthContext.Provider value={{
      user,
      session,
      profile,
      roles,
      loading,
      canCreateEvent,
      canUpload,
      isAdmin,
      canDownload,
      signOut
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};