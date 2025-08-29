import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Car, Heart, Eye, User, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import galleryPreview from "@/assets/gallery-preview.jpg";

interface CarWithPhotos {
  id: string;
  make: string;
  model: string;
  year: number | null;
  description: string | null;
  user_id: string;
  photos: {
    id: string;
    storage_path: string;
    thumbnail_path: string | null;
    caption: string | null;
    tags: string[];
    specs: Record<string, string>;
    likes_count: number;
    favorites_count: number;
  }[];
  owner: {
    id: string;
    username: string | null;
    avatar_url: string | null;
    level: number | null;
  } | null;
}

export default function CarShowroomSection() {
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const [cars, setCars] = useState<CarWithPhotos[]>([]);
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const loadShowroomCars = async () => {
    try {
      setLoading(true);

      // Get cars with photos
      const { data: carsData, error: carsError } = await supabase
        .from("user_cars")
        .select(`
          id,
          make,
          model,
          year,
          description,
          user_id
        `)
        .order("created_at", { ascending: false });

      if (carsError) throw carsError;

      if (!carsData || carsData.length === 0) {
        setCars([]);
        return;
      }

      // Get photos for all cars
      const carIds = carsData.map(car => car.id);
      const { data: photosData, error: photosError } = await supabase
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
          user_car_id
        `)
        .in("user_car_id", carIds)
        .order("created_at", { ascending: false });

      if (photosError) throw photosError;

      // Get user profiles for car owners
      const userIds = [...new Set(carsData.map(car => car.user_id))];
      const { data: profilesData } = await supabase
        .from("profiles")
        .select(`
          id,
          username,
          avatar_url,
          level,
          privacy_settings
        `)
        .in('id', userIds);

      // Create profiles map
      const profilesMap = new Map();
      (profilesData || []).forEach(profile => {
        profilesMap.set(profile.id, profile);
      });

      // Group photos by car ID
      const photosByCarId = new Map();
      (photosData || []).forEach(photo => {
        if (!photosByCarId.has(photo.user_car_id)) {
          photosByCarId.set(photo.user_car_id, []);
        }
        photosByCarId.get(photo.user_car_id).push({
          ...photo,
          specs: (photo.specs as Record<string, string>) || {},
        });
      });

      // Filter cars that have photos and respect privacy settings
      const carsWithPhotos = carsData
        .filter(car => {
          const userProfile = profilesMap.get(car.user_id);
          const privacySettings = userProfile?.privacy_settings || {};
          const hasPhotos = photosByCarId.has(car.id) && photosByCarId.get(car.id).length > 0;
          
          return hasPhotos && privacySettings.show_cars !== false;
        })
        .map(car => ({
          ...car,
          photos: photosByCarId.get(car.id) || [],
          owner: profilesMap.get(car.user_id) || null
        }));

      setCars(carsWithPhotos);

      // Initialize current photo index for each car
      const initialIndices: Record<string, number> = {};
      carsWithPhotos.forEach(car => {
        initialIndices[car.id] = 0;
      });
      setCurrentPhotoIndex(initialIndices);

      // Load photo URLs
      const newUrls: Record<string, string> = {};
      for (const car of carsWithPhotos) {
        for (const photo of car.photos) {
          if (photo.thumbnail_path) {
            const { data: urlData } = supabase.storage
              .from("gallery-thumbs")
              .getPublicUrl(photo.thumbnail_path);
            newUrls[photo.id] = urlData?.publicUrl || galleryPreview;
          } else {
            newUrls[photo.id] = galleryPreview;
          }
        }
      }
      setPhotoUrls(newUrls);

    } catch (error: any) {
      console.error("Error loading showroom cars:", error);
      toast({ description: "Error cargando el showroom", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShowroomCars();
  }, []);

  // Show login message for non-authenticated users
  if (!authLoading && !user) {
    return (
      <div className="text-center py-12">
        <Car className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-xl font-semibold text-foreground mb-2">
          Inicia sesión para ver el showroom
        </h3>
        <p className="text-muted-foreground mb-4">
          Necesitas una cuenta para explorar el showroom de la comunidad.
        </p>
        <Link to="/auth">
          <Button variant="default">
            Iniciar sesión
          </Button>
        </Link>
      </div>
    );
  }

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

      // Refresh cars to update counts
      await loadShowroomCars();
    } catch (error: any) {
      console.error("Error toggling like:", error);
      toast({ description: "Error al dar like", variant: "destructive" });
    }
  };

  const nextPhoto = (carId: string, maxIndex: number) => {
    setCurrentPhotoIndex(prev => ({
      ...prev,
      [carId]: (prev[carId] + 1) % maxIndex
    }));
  };

  const prevPhoto = (carId: string, maxIndex: number) => {
    setCurrentPhotoIndex(prev => ({
      ...prev,
      [carId]: prev[carId] === 0 ? maxIndex - 1 : prev[carId] - 1
    }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="text-muted-foreground">Cargando showroom...</div>
      </div>
    );
  }

  if (cars.length === 0) {
    return (
      <div className="text-center py-12">
        <Car className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-xl font-semibold text-foreground mb-2">
          Showroom vacío
        </h3>
        <p className="text-muted-foreground">
          Aún no hay autos con fotos en el showroom. ¡Sé el primero en compartir tu auto!
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
        {cars.map((car) => {
          const currentIndex = currentPhotoIndex[car.id] || 0;
          const currentPhoto = car.photos[currentIndex];
          
          // Safety check - skip if no photos or currentPhoto is undefined
          if (!car.photos.length || !currentPhoto) {
            return null;
          }
          
          return (
            <Card key={car.id} className="overflow-hidden hover:shadow-royal transition-all duration-300">
              <div className="relative">
                {/* Main Photo */}
                <img
                  src={photoUrls[currentPhoto.id] || galleryPreview}
                  alt={`${car.make} ${car.model}`}
                  className="w-full h-48 object-cover"
                  loading="lazy"
                />
                
                {/* Photo Navigation */}
                {car.photos.length > 1 && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white hover:bg-black/70 h-8 w-8 p-0"
                      onClick={() => prevPhoto(car.id, car.photos.length)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white hover:bg-black/70 h-8 w-8 p-0"
                      onClick={() => nextPhoto(car.id, car.photos.length)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    
                    {/* Photo Counter */}
                    <div className="absolute top-2 right-2">
                      <Badge variant="secondary" className="bg-black/50 text-white border-0">
                        {currentIndex + 1}/{car.photos.length}
                      </Badge>
                    </div>
                  </>
                )}

                {/* Car Badge */}
                <div className="absolute top-2 left-2">
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
                    {car.make} {car.model}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    {car.year && (
                      <div className="flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        {car.year}
                      </div>
                    )}
                  </div>
                </div>

                {/* Owner Info */}
                <div className="flex items-center gap-2 mb-3">
                  <Avatar className="w-6 h-6">
                    <AvatarImage src={car.owner?.avatar_url || ""} />
                    <AvatarFallback>
                      <User className="w-3 h-3" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex items-center gap-2">
                    <Link 
                      to={`/showroom/${car.user_id}`}
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      {car.owner?.username || "Usuario"}
                    </Link>
                    {car.owner?.level && (
                      <Badge variant="outline" className="text-xs">
                        Nivel {car.owner.level}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Car Description */}
                {car.description && (
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {car.description}
                  </p>
                )}

                {/* Current Photo Caption */}
                {currentPhoto.caption && (
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {currentPhoto.caption}
                  </p>
                )}

                {/* Tags */}
                {currentPhoto.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {currentPhoto.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {currentPhoto.tags.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{currentPhoto.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                )}

                {/* Specs Preview */}
                {Object.keys(currentPhoto.specs).length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs text-muted-foreground mb-1">Especificaciones:</p>
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(currentPhoto.specs).slice(0, 2).map(([key, value]) => (
                        <Badge key={key} variant="outline" className="text-xs">
                          {key}: {value}
                        </Badge>
                      ))}
                      {Object.keys(currentPhoto.specs).length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{Object.keys(currentPhoto.specs).length - 2}
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
                      onClick={() => toggleLike(currentPhoto.id)}
                      className="p-0 h-auto text-muted-foreground hover:text-red-500"
                    >
                      <Heart className="w-4 h-4 mr-1" />
                      {currentPhoto.likes_count || 0}
                    </Button>
                    <div className="flex items-center text-muted-foreground">
                      <Eye className="w-4 h-4 mr-1" />
                      <span className="text-sm">{currentPhoto.favorites_count || 0}</span>
                    </div>
                  </div>
                  
                  <Link to={`/showroom/${car.user_id}`}>
                    <Button variant="outline" size="sm">
                      Ver perfil
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}