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
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('username, avatar_url')
        .eq('id', userId)
        .maybeSingle();
      
      if (!error && data) {
        setProfile(data);
      } else {
        const { data: userData } = await supabase.auth.getUser();
        if (userData.user) {
          const displayName = userData.user.user_metadata?.display_name || 
                            userData.user.user_metadata?.full_name || 
                            userData.user.user_metadata?.name ||
                            userData.user.email?.split('@')[0] || 
                            'Usuario';
          
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
      console.error('Error loading profile:', err);
    }
  };

  const loadRoles = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);
      
      if (error) {
        console.error("Error fetching roles", error);
        setRoles([]);
      } else {
        setRoles(data?.map((r: any) => r.role) ?? []);
      }
    } catch (err) {
      console.error('Error loading roles:', err);
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

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await Promise.all([
            loadProfile(session.user.id),
            loadRoles(session.user.id)
          ]);
        } else {
          setProfile(null);
          setRoles([]);
        }
        
        setLoading(false);
      }
    );

    // Check initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await Promise.all([
          loadProfile(session.user.id),
          loadRoles(session.user.id)
        ]);
      }
      
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const canCreateEvent = roles.includes("copiloto") || roles.includes("admin");
  const canUpload = roles.includes("copiloto") || roles.includes("admin");
  const isAdmin = roles.includes("admin");
  const canDownload = roles.length > 0;

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