import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Car, Heart, Eye, User, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import galleryPreview from "@/assets/gallery-preview.jpg";

interface ShowroomPhoto {
  id: string;
  storage_path: string;
  thumbnail_path: string | null;
  caption: string | null;
  tags: string[];
  specs: Record<string, string>;
  likes_count: number;
  favorites_count: number;
  uploaded_by: string;
  user_car: {
    id: string;
    make: string;
    model: string;
    year: number | null;
    description: string | null;
  } | null;
  uploader: {
    id: string;
    username: string | null;
    avatar_url: string | null;
    level: number | null;
  } | null;
}

export default function ShowroomSection() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [photos, setPhotos] = useState<ShowroomPhoto[]>([]);
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadShowroomPhotos();
  }, []);

  const loadShowroomPhotos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("photos")
        .select(`
          id,
          storage_path,
          thumbnail_path,
          caption,
          tags,
          specs,
          likes_count,
          favorites_count,
          uploaded_by,
          user_car:user_cars (
            id,
            make,
            model,
            year,
            description
          ),
          uploader:profiles!uploaded_by (
            id,
            username,
            avatar_url,
            level,
            privacy_settings
          )
        `)
        .eq("event_id", "00000000-0000-0000-0000-000000000000")
        .not("user_car_id", "is", null)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Filter photos based on privacy settings
      const filteredData = (data || []).filter((photo: any) => {
        const privacySettings = photo.uploader?.privacy_settings || {};
        return privacySettings.show_cars !== false; // Show if setting is true or undefined
      });

      setPhotos(filteredData.map((photo: any) => ({
        ...photo,
        specs: (photo.specs as Record<string, string>) || {},
        uploader: photo.uploader ? {
          id: photo.uploader.id,
          username: photo.uploader.username,
          avatar_url: photo.uploader.avatar_url,
          level: photo.uploader.level,
        } : null
      })));

      // Load thumbnail URLs
      const newUrls: Record<string, string> = {};
      for (const photo of filteredData) {
        if (photo.thumbnail_path) {
          const { data: urlData } = supabase.storage
            .from("gallery-thumbs")
            .getPublicUrl(photo.thumbnail_path);
          
          if (urlData?.publicUrl) {
            newUrls[photo.id] = urlData.publicUrl;
          }
        } else {
          newUrls[photo.id] = galleryPreview;
        }
      }
      setPhotoUrls(newUrls);
    } catch (error: any) {
      console.error("Error loading showroom photos:", error);
      toast({ description: "Error cargando el showroom", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const toggleLike = async (photoId: string) => {
    if (!user) {
      toast({ description: "Inicia sesión para dar like", variant: "destructive" });
      return;
    }

    try {
      // Check if already liked
      const { data: existingLike } = await supabase
        .from("photo_likes")
        .select("id")
        .eq("photo_id", photoId)
        .eq("user_id", user.id)
        .single();

      if (existingLike) {
        // Unlike
        await supabase
          .from("photo_likes")
          .delete()
          .eq("photo_id", photoId)
          .eq("user_id", user.id);
      } else {
        // Like
        await supabase
          .from("photo_likes")
          .insert({ photo_id: photoId, user_id: user.id });
      }

      // Refresh photos to update counts
      await loadShowroomPhotos();
    } catch (error: any) {
      console.error("Error toggling like:", error);
      toast({ description: "Error al dar like", variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="text-muted-foreground">Cargando showroom...</div>
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className="text-center py-12">
        <Car className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-xl font-semibold text-foreground mb-2">
          Showroom vacío
        </h3>
        <p className="text-muted-foreground">
          Aún no hay fotos de autos en el showroom. ¡Sé el primero en compartir tu auto!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
          Showroom de la Comunidad
        </h2>
        <p className="text-muted-foreground">
          Descubre los increíbles autos de nuestra comunidad
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {photos.map((photo) => (
          <Card key={photo.id} className="overflow-hidden hover:shadow-royal transition-all duration-300">
            <div className="relative">
              <img
                src={photoUrls[photo.id] || galleryPreview}
                alt={`${photo.user_car?.make} ${photo.user_car?.model}`}
                className="w-full h-48 object-cover"
                loading="lazy"
              />
              <div className="absolute top-2 right-2">
                <Badge variant="secondary" className="bg-black/50 text-white border-0">
                  <Car className="w-3 h-3 mr-1" />
                  Showroom
                </Badge>
              </div>
            </div>
            
            <div className="p-4">
              {/* Car Info */}
              <div className="mb-3">
                <h3 className="font-semibold text-lg text-foreground">
                  {photo.user_car?.make} {photo.user_car?.model}
                </h3>
                {photo.user_car?.year && (
                  <p className="text-sm text-muted-foreground flex items-center">
                    <Calendar className="w-3 h-3 mr-1" />
                    {photo.user_car.year}
                  </p>
                )}
              </div>

              {/* Owner Info */}
              <div className="flex items-center gap-2 mb-3">
                <Avatar className="w-6 h-6">
                  <AvatarImage src={photo.uploader?.avatar_url || ""} />
                  <AvatarFallback>
                    <User className="w-3 h-3" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex items-center gap-2">
                  <Link 
                    to={`/showroom/${photo.uploaded_by}`}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    {photo.uploader?.username || "Usuario"}
                  </Link>
                  {photo.uploader?.level && (
                    <Badge variant="outline" className="text-xs">
                      Nivel {photo.uploader.level}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Caption */}
              {photo.caption && (
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {photo.caption}
                </p>
              )}

              {/* Tags */}
              {photo.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {photo.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {photo.tags.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{photo.tags.length - 3}
                    </Badge>
                  )}
                </div>
              )}

              {/* Specs Preview */}
              {Object.keys(photo.specs).length > 0 && (
                <div className="mb-3">
                  <p className="text-xs text-muted-foreground mb-1">Especificaciones:</p>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(photo.specs).slice(0, 2).map(([key, value]) => (
                      <Badge key={key} variant="outline" className="text-xs">
                        {key}: {value}
                      </Badge>
                    ))}
                    {Object.keys(photo.specs).length > 2 && (
                      <Badge variant="outline" className="text-xs">
                        +{Object.keys(photo.specs).length - 2}
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleLike(photo.id)}
                    className="p-0 h-auto text-muted-foreground hover:text-red-500"
                  >
                    <Heart className="w-4 h-4 mr-1" />
                    {photo.likes_count || 0}
                  </Button>
                  <div className="flex items-center text-muted-foreground">
                    <Eye className="w-4 h-4 mr-1" />
                    <span className="text-sm">{photo.favorites_count || 0}</span>
                  </div>
                </div>
                
                <Link to={`/showroom/${photo.uploaded_by}`}>
                  <Button variant="outline" size="sm">
                    Ver perfil
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}