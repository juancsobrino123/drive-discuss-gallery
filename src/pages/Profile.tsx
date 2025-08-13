import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

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
  const { user, profile, loading: authLoading, signOut: authSignOut } = useAuth();
  const [username, setUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [loading, setLoading] = useState(false);

  // SEO
  useEffect(() => {
    document.title = "Perfil | AUTODEBATE";
    setMeta("description", "Gestiona tu perfil de usuario en AUTODEBATE");
    setCanonical(`${window.location.origin}/profile`);
  }, []);

  useEffect(() => {
    if (profile) {
      setUsername(profile.username || '');
      setAvatarUrl(profile.avatar_url || '');
    }
  }, [profile]);

  const saveProfile = async () => {
    if (!user?.id || !username.trim()) return;
    
    setLoading(true);
    
    try {
      console.log('Saving profile for user:', user.id, 'with username:', username.trim());
      
      // Primero intentar actualizar, si no existe, crear
      const { data, error } = await supabase
        .from("profiles")
        .upsert({ 
          id: user.id,
          username: username.trim(),
          avatar_url: avatarUrl || null
        }, {
          onConflict: 'id'
        })
        .select();
        
      console.log('Upsert result:', { data, error });
        
      if (error) {
        console.error('Profile upsert error:', error);
        toast.error("Error al actualizar perfil: " + error.message);
        return;
      }

      // Update display name in auth
      await supabase.auth.updateUser({
        data: { display_name: username.trim() }
      });

      toast.success("Perfil actualizado correctamente");
    } catch (error) {
      console.error('Unexpected error:', error);
      toast.error("Error inesperado al guardar");
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
        console.error('Profile update error:', updateError);
        toast.error("Failed to update avatar");
        return;
      }

      setAvatarUrl(url || "");
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
          <h1 className="text-2xl font-bold text-foreground">Mi Perfil</h1>
        </div>

        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={avatarUrl} alt={username} />
              <AvatarFallback className="text-lg bg-primary text-primary-foreground">
                {username?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-lg font-semibold text-foreground">{username || user?.email}</h2>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Nombre de usuario
              </label>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ingresa tu nombre de usuario"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Avatar
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={onFileChange}
                className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                disabled={loading}
              />
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                onClick={saveProfile}
                disabled={loading || !username.trim()}
                className="flex-1"
              >
                {loading ? "Guardando..." : "Guardar cambios"}
              </Button>
              <Button
                variant="destructive"
                onClick={handleSignOut}
                disabled={loading}
              >
                Cerrar sesión
              </Button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Profile;