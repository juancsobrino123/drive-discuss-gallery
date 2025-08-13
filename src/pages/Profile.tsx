import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

// Simple SEO helpers without extra deps
function setMeta(name: string, content: string) {
  let tag = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute("name", name);
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", content);
}

function setCanonical(href: string) {
  let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement("link");
    link.setAttribute("rel", "canonical");
    document.head.appendChild(link);
  }
  link.setAttribute("href", href);
}

const Profile = () => {
  const { user, profile, signOut: authSignOut, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // SEO
  useEffect(() => {
    document.title = "Profile | AUTODEBATE";
    setMeta("description", "Manage your AUTODEBATE profile: update username and avatar.");
    setCanonical(`${window.location.origin}/profile`);
  }, []);

  // Load profile data when user/profile changes
  useEffect(() => {
    if (profile) {
      setUsername(profile.username || "");
      setAvatarUrl(profile.avatar_url || null);
    }
  }, [profile]);

  const saveProfile = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ username })
        .eq("id", user.id);
        
      if (error) {
        console.error('Profile update error:', error);
        toast.error("Could not save username");
        return;
      }

      const { error: authErr } = await supabase.auth.updateUser({
        data: { display_name: username },
      });
      
      if (authErr) {
        console.error('Auth metadata update error:', authErr);
        toast.error("Saved, but failed to sync auth display name");
        return;
      }

      toast.success("Profile updated");
    } catch (error) {
      console.error('Unexpected error:', error);
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };
  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;
    
    setLoading(true);
    
    try {
      const path = `${user.id}/avatar-${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true });
        
      if (uploadError) {
        console.error('Upload error:', uploadError);
        toast.error("Upload failed");
        return;
      }

      const { data: publicUrl } = supabase.storage.from("avatars").getPublicUrl(path);
      const url = publicUrl?.publicUrl ?? null;

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: url })
        .eq("id", user.id);
        
      if (updateError) {
        console.error('Avatar update error:', updateError);
        toast.error("Could not save avatar");
        return;
      }

      setAvatarUrl(url);
      toast.success("Avatar updated");
    } catch (error) {
      console.error('Unexpected error:', error);
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await authSignOut();
      toast.success("Signed out");
      window.location.href = "/";
    } catch (error) {
      console.error('Logout error:', error);
      toast.error("Error signing out");
    }
  };

  // Redirect if not authenticated
  if (!authLoading && !user) {
    window.location.href = "/auth";
    return null;
  }

  // Show loading while auth is loading
  if (authLoading) {
    return (
      <main className="min-h-screen bg-background pt-20">
        <section className="container mx-auto px-4 max-w-2xl">
          <div className="text-center">Cargando...</div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background pt-20">
      <section className="container mx-auto px-4 max-w-2xl">
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => window.history.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
          <h1 className="text-2xl font-bold text-foreground">Profile</h1>
        </div>

        <article className="bg-card border border-border rounded-lg p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              {avatarUrl ? (
                <AvatarImage src={avatarUrl} alt="Profile avatar" />
              ) : (
                <AvatarFallback>U</AvatarFallback>
              )}
            </Avatar>
            <div>
              <label className="block text-sm text-muted-foreground mb-2" htmlFor="avatar">Avatar</label>
              <Input id="avatar" type="file" accept="image/*" onChange={onFileChange} />
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-sm text-muted-foreground mb-2" htmlFor="username">Username</label>
            <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Your username" />
            <div className="mt-4 flex gap-3">
              <Button onClick={saveProfile} disabled={loading}>
                Save Changes
              </Button>
              <Button variant="outline" onClick={handleSignOut}>Log out</Button>
            </div>
          </div>
        </article>
      </section>
    </main>
  );
};

export default Profile;
