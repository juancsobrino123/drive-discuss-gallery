import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Car } from "lucide-react";
import CarPhotoManager from "@/components/ui/car-photo-manager";
import galleryPreview from "@/assets/gallery-preview.jpg";

interface UserCar {
  id: string;
  make: string;
  model: string;
  year: number | null;
  description: string | null;
  is_current: boolean;
}


interface ProfileCarsSectionProps {
  userId: string;
  canEdit?: boolean;
}

export default function ProfileCarsSection({ userId, canEdit = false }: ProfileCarsSectionProps) {
  const [cars, setCars] = useState<UserCar[]>([]);
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
              
              {/* Car Photos Management */}
              <CarPhotoManager
                carId={car.id}
                carMake={car.make}
                carModel={car.model}
                carYear={car.year || undefined}
                onPhotosUpdated={loadUserCars}
                canEdit={canEdit}
              />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}