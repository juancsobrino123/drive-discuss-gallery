import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import ProfileCarsSection from "@/components/ui/profile-cars-section";

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
  const navigate = useNavigate();
  const { user, profile, loading: authLoading, signOut: authSignOut, reloadProfile } = useAuth();
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
      
      // Recargar el perfil desde la base de datos
      await reloadProfile();
      
      // Navegar al home después de guardar
      navigate("/");
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
      toast.success("Avatar actualizado");
      
      // Recargar el perfil desde la base de datos
      await reloadProfile();
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
      toast.success("Sesión cerrada");
      navigate("/");
    } catch (error) {
      console.error('Logout error:', error);
      toast.error("Error signing out");
    }
  };

  // Redirect if not authenticated
  if (!authLoading && !user) {
    navigate("/auth");
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
            onClick={() => navigate("/")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
          <h1 className="text-2xl font-bold text-foreground">Mi Perfil</h1>
        </div>

        <div className="space-y-6">
          {/* Profile Header */}
          <div className="flex items-center gap-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={profile?.avatar_url} alt={profile?.username} />
              <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                {profile?.username?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-foreground">{profile?.username || user?.email}</h2>
              <p className="text-muted-foreground">{user?.email}</p>
              {profile?.bio && (
                <p className="mt-2 text-foreground">{profile.bio}</p>
              )}
            </div>
          </div>

          {/* Profile Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Personal Info */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Información Personal</h3>
              <div className="space-y-3">
                {profile?.birth_date && (
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Fecha de nacimiento:</span>
                    <p className="text-foreground">
                      {(() => {
                        const birthDate = profile.birth_date;
                        if (typeof birthDate === 'string' && birthDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
                          // Format YYYY-MM-DD directly to avoid timezone issues
                          const [year, month, day] = birthDate.split('-');
                          return `${day}/${month}/${year}`;
                        }
                        return new Date(birthDate).toLocaleDateString();
                      })()}
                    </p>
                  </div>
                )}
                {(profile?.city || profile?.country) && (
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Ubicación:</span>
                    <p className="text-foreground">
                      {[profile?.city, profile?.country].filter(Boolean).join(", ")}
                    </p>
                  </div>
                )}
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Miembro desde:</span>
                  <p className="text-foreground">{new Date(profile?.created_at || '').toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            {/* Gamification */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Actividad</h3>
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Puntos:</span>
                  <p className="text-foreground font-semibold">{profile?.points || 0}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Nivel:</span>
                  <p className="text-foreground font-semibold">{profile?.level || 1}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Social Links */}
          {profile?.social_links && Object.keys(profile.social_links).length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Redes Sociales</h3>
              <div className="flex flex-wrap gap-2">
                {Object.entries(profile.social_links).map(([platform, url]) => (
                  <a
                    key={platform}
                    href={url as string}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm hover:bg-secondary/80 transition-colors"
                  >
                    {platform.charAt(0).toUpperCase() + platform.slice(1)}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* My Cars */}
          <ProfileCarsSection userId={user?.id || ''} />

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            <Button
              onClick={() => navigate("/edit-profile")}
              className="flex-1"
            >
              Editar Perfil
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
      </section>
    </main>
  );
};

export default Profile;