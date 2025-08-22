import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Car } from "lucide-react";
import galleryPreview from "@/assets/gallery-preview.jpg";

interface UserCar {
  id: string;
  make: string;
  model: string;
  year: number | null;
  description: string | null;
  is_current: boolean;
}

interface CarPhoto {
  id: string;
  storage_path: string;
  thumbnail_path: string | null;
  caption: string | null;
}

interface ProfileCarsSectionProps {
  userId: string;
}

export default function ProfileCarsSection({ userId }: ProfileCarsSectionProps) {
  const [cars, setCars] = useState<UserCar[]>([]);
  const [carPhotos, setCarPhotos] = useState<Record<string, CarPhoto[]>>({});
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      loadUserCars();
    }
  }, [userId]);

  const loadUserCars = async () => {
    try {
      setLoading(true);
      
      // Load user cars
      const { data: carsData, error: carsError } = await supabase
        .from("user_cars")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (carsError) throw carsError;

      setCars(carsData || []);

      // Load photos for each car
      if (carsData && carsData.length > 0) {
        const carIds = carsData.map(car => car.id);
        
        const { data: photosData, error: photosError } = await supabase
          .from("photos")
          .select("id, storage_path, thumbnail_path, caption, user_car_id")
          .in("user_car_id", carIds)
          .order("created_at", { ascending: false });

        if (photosError) throw photosError;

        // Group photos by car ID
        const photosByCarId: Record<string, CarPhoto[]> = {};
        (photosData || []).forEach(photo => {
          if (!photosByCarId[photo.user_car_id]) {
            photosByCarId[photo.user_car_id] = [];
          }
          photosByCarId[photo.user_car_id].push(photo);
        });

        setCarPhotos(photosByCarId);

        // Load thumbnail URLs
        const newUrls: Record<string, string> = {};
        for (const photo of photosData || []) {
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
      }
    } catch (error: any) {
      console.error("Error loading user cars:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Mis Autos</h3>
        <div className="text-muted-foreground">Cargando...</div>
      </div>
    );
  }

  if (cars.length === 0) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Mis Autos</h3>
        <div className="text-center py-8">
          <Car className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
          <p className="text-muted-foreground">
            Aún no has agregado ningún auto. ¡Ve a editar perfil para agregar tus autos!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-foreground">Mis Autos</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cars.map((car) => (
          <Card key={car.id} className="overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">
                {car.make} {car.model} {car.year}
              </CardTitle>
              {car.is_current && (
                <Badge variant="secondary" className="w-fit">
                  Auto actual
                </Badge>
              )}
            </CardHeader>
            <CardContent>
              {car.description && (
                <p className="text-sm text-muted-foreground mb-3">
                  {car.description}
                </p>
              )}
              
              {/* Car Photos */}
              {carPhotos[car.id] && carPhotos[car.id].length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {carPhotos[car.id].slice(0, 4).map((photo) => (
                    <div key={photo.id} className="relative">
                      <img
                        src={photoUrls[photo.id] || galleryPreview}
                        alt={photo.caption || `${car.make} ${car.model}`}
                        className="w-full h-24 object-cover rounded"
                        loading="lazy"
                      />
                    </div>
                  ))}
                  {carPhotos[car.id].length > 4 && (
                    <div className="absolute top-2 right-2">
                      <Badge variant="secondary" className="bg-black/50 text-white border-0">
                        +{carPhotos[car.id].length - 4}
                      </Badge>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center h-24 bg-muted rounded">
                  <div className="text-center">
                    <Car className="w-8 h-8 mx-auto text-muted-foreground mb-1" />
                    <p className="text-xs text-muted-foreground">Sin fotos</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}