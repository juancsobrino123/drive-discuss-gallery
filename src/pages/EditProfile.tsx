import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, Save, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

interface UserCar {
  id?: string;
  make: string;
  model: string;
  year: number;
  description?: string;
  is_current: boolean;
}

interface FavoriteCar {
  id?: string;
  make: string;
  model: string;
  year: number;
}

const EditProfile = () => {
  const navigate = useNavigate();
  const { user, profile, loading: authLoading, reloadProfile } = useAuth();
  
  // Profile fields
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  
  // Privacy settings
  const [showCars, setShowCars] = useState(true);
  const [showActivity, setShowActivity] = useState(true);
  const [showLocation, setShowLocation] = useState(true);
  
  // Cars
  const [currentCars, setCurrentCars] = useState<UserCar[]>([]);
  const [favoriteCars, setFavoriteCars] = useState<FavoriteCar[]>([]);
  
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = "Editar Perfil | AUTODEBATE";
  }, []);

  useEffect(() => {
    if (profile) {
      setUsername(profile.username || '');
      setBio((profile as any).bio || '');
      setBirthDate((profile as any).birth_date || '');
      setCity((profile as any).city || '');
      setCountry((profile as any).country || '');
      setAvatarUrl(profile.avatar_url || '');
      
      // Privacy settings
      const privacy = (profile as any).privacy_settings || {};
      setShowCars(privacy.show_cars !== false);
      setShowActivity(privacy.show_activity !== false);
      setShowLocation(privacy.show_location !== false);
      
      loadUserCars();
      loadFavoriteCars();
    }
  }, [profile]);

  const loadUserCars = async () => {
    if (!user?.id) return;
    
    const { data } = await supabase
      .from('user_cars')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    setCurrentCars(data || []);
  };

  const loadFavoriteCars = async () => {
    if (!user?.id) return;
    
    const { data } = await supabase
      .from('user_favorite_cars')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    setFavoriteCars(data || []);
  };

  const saveProfile = async () => {
    if (!user?.id || !username.trim()) {
      toast.error("El nombre de usuario es requerido");
      return;
    }
    
    setLoading(true);
    
    try {
      // Update profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ 
          username: username.trim(),
          bio: bio.trim() || null,
          birth_date: birthDate || null,
          city: city.trim() || null,
          country: country || null,
          avatar_url: avatarUrl || null,
          privacy_settings: {
            show_cars: showCars,
            show_activity: showActivity,
            show_location: showLocation
          }
        })
        .eq('id', user.id);
        
      if (profileError) {
        console.error('Profile update error:', profileError);
        toast.error("Error al actualizar perfil: " + profileError.message);
        return;
      }

      // Save current cars
      for (const car of currentCars) {
        if (car.make && car.model && car.year) {
          if (car.id) {
            // Update existing car
            await supabase
              .from('user_cars')
              .update({
                make: car.make,
                model: car.model,
                year: car.year,
                description: car.description || null,
                is_current: car.is_current
              })
              .eq('id', car.id);
          } else {
            // Insert new car
            await supabase
              .from('user_cars')
              .insert({
                user_id: user.id,
                make: car.make,
                model: car.model,
                year: car.year,
                description: car.description || null,
                is_current: car.is_current
              });
          }
        }
      }

      // Save favorite cars
      for (const car of favoriteCars) {
        if (car.make && car.model && car.year) {
          if (car.id) {
            // Update existing favorite car
            await supabase
              .from('user_favorite_cars')
              .update({
                make: car.make,
                model: car.model,
                year: car.year
              })
              .eq('id', car.id);
          } else {
            // Insert new favorite car
            await supabase
              .from('user_favorite_cars')
              .insert({
                user_id: user.id,
                make: car.make,
                model: car.model,
                year: car.year
              });
          }
        }
      }

      toast.success("Perfil actualizado correctamente");
      await reloadProfile();
      navigate("/profile");
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
        toast.error("Error al subir imagen");
        return;
      }

      const { data: publicUrl } = supabase.storage.from("avatars").getPublicUrl(path);
      const url = publicUrl?.publicUrl ?? "";

      setAvatarUrl(url);
      toast.success("Avatar actualizado");
    } catch (error) {
      console.error('Unexpected error:', error);
      toast.error("Error inesperado");
    } finally {
      setLoading(false);
    }
  };

  const addCurrentCar = () => {
    setCurrentCars([...currentCars, { make: '', model: '', year: new Date().getFullYear(), description: '', is_current: true }]);
  };

  const removeCurrentCar = async (index: number) => {
    const car = currentCars[index];
    if (car.id) {
      await supabase.from('user_cars').delete().eq('id', car.id);
    }
    setCurrentCars(currentCars.filter((_, i) => i !== index));
  };

  const updateCurrentCar = (index: number, field: keyof UserCar, value: any) => {
    const updatedCars = [...currentCars];
    updatedCars[index] = { ...updatedCars[index], [field]: value };
    setCurrentCars(updatedCars);
  };

  const addFavoriteCar = () => {
    setFavoriteCars([...favoriteCars, { make: '', model: '', year: new Date().getFullYear() }]);
  };

  const removeFavoriteCar = async (index: number) => {
    const car = favoriteCars[index];
    if (car.id) {
      await supabase.from('user_favorite_cars').delete().eq('id', car.id);
    }
    setFavoriteCars(favoriteCars.filter((_, i) => i !== index));
  };

  const updateFavoriteCar = (index: number, field: keyof FavoriteCar, value: any) => {
    const updatedCars = [...favoriteCars];
    updatedCars[index] = { ...updatedCars[index], [field]: value };
    setFavoriteCars(updatedCars);
  };

  // Redirect if not authenticated
  if (!authLoading && !user) {
    navigate("/auth");
    return null;
  }

  if (authLoading) {
    return (
      <main className="min-h-screen bg-background pt-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center">Cargando...</div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background pt-20">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate("/profile")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
          <h1 className="text-3xl font-bold text-foreground">Editar Perfil</h1>
        </div>

        <div className="space-y-8">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Información Básica</CardTitle>
              <CardDescription>Edita tu información personal y avatar</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={avatarUrl} alt={username} />
                  <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                    {username?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <Label className="block text-sm font-medium mb-2">Avatar</Label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={onFileChange}
                    className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="username">Nombre de usuario *</Label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Tu nombre de usuario"
                    disabled={loading}
                  />
                </div>
                
                <div>
                  <Label htmlFor="birthDate">Fecha de Nacimiento</Label>
                  <Input
                    id="birthDate"
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="bio">Biografía</Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Cuéntanos sobre ti y tu pasión por los autos..."
                  disabled={loading}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="country">País</Label>
                  <Select value={country} onValueChange={setCountry}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar país" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="chile">Chile</SelectItem>
                      <SelectItem value="argentina">Argentina</SelectItem>
                      <SelectItem value="colombia">Colombia</SelectItem>
                      <SelectItem value="mexico">México</SelectItem>
                      <SelectItem value="spain">España</SelectItem>
                      <SelectItem value="peru">Perú</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="city">Ciudad</Label>
                  <Input
                    id="city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Tu ciudad"
                    disabled={loading || !country}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Privacy Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Configuración de Privacidad</CardTitle>
              <CardDescription>Controla qué información es visible para otros usuarios</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Mostrar mis autos</Label>
                  <p className="text-sm text-muted-foreground">Otros usuarios pueden ver tus autos actuales y favoritos</p>
                </div>
                <Switch checked={showCars} onCheckedChange={setShowCars} />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label>Mostrar mi ubicación</Label>
                  <p className="text-sm text-muted-foreground">Otros usuarios pueden ver tu ciudad y país</p>
                </div>
                <Switch checked={showLocation} onCheckedChange={setShowLocation} />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label>Mostrar mi actividad</Label>
                  <p className="text-sm text-muted-foreground">Otros usuarios pueden ver tus logros y actividad</p>
                </div>
                <Switch checked={showActivity} onCheckedChange={setShowActivity} />
              </div>
            </CardContent>
          </Card>

          {/* Current Cars */}
          <Card>
            <CardHeader>
              <CardTitle>Mis Autos Actuales</CardTitle>
              <CardDescription>Los autos que tienes actualmente</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {currentCars.map((car, index) => (
                <div key={index} className="flex gap-4 items-end p-4 border rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 flex-1">
                    <div>
                      <Label>Marca</Label>
                      <Input
                        value={car.make}
                        onChange={(e) => updateCurrentCar(index, 'make', e.target.value)}
                        placeholder="Ford, Honda, BMW..."
                      />
                    </div>
                    <div>
                      <Label>Modelo</Label>
                      <Input
                        value={car.model}
                        onChange={(e) => updateCurrentCar(index, 'model', e.target.value)}
                        placeholder="Mustang, Civic..."
                      />
                    </div>
                    <div>
                      <Label>Año</Label>
                      <Input
                        type="number"
                        value={car.year}
                        onChange={(e) => updateCurrentCar(index, 'year', parseInt(e.target.value))}
                        min="1900"
                        max={new Date().getFullYear() + 1}
                      />
                    </div>
                    <div>
                      <Label>Descripción</Label>
                      <Input
                        value={car.description || ''}
                        onChange={(e) => updateCurrentCar(index, 'description', e.target.value)}
                        placeholder="Opcional..."
                      />
                    </div>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => removeCurrentCar(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              
              <Button
                variant="outline"
                onClick={addCurrentCar}
                className="w-full flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Agregar Auto
              </Button>
            </CardContent>
          </Card>

          {/* Favorite Cars */}
          <Card>
            <CardHeader>
              <CardTitle>Mis Autos Favoritos</CardTitle>
              <CardDescription>Los autos que más te gustan o sueñas tener</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {favoriteCars.map((car, index) => (
                <div key={index} className="flex gap-4 items-end p-4 border rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
                    <div>
                      <Label>Marca</Label>
                      <Input
                        value={car.make}
                        onChange={(e) => updateFavoriteCar(index, 'make', e.target.value)}
                        placeholder="Ford, Honda, BMW..."
                      />
                    </div>
                    <div>
                      <Label>Modelo</Label>
                      <Input
                        value={car.model}
                        onChange={(e) => updateFavoriteCar(index, 'model', e.target.value)}
                        placeholder="Mustang, Civic..."
                      />
                    </div>
                    <div>
                      <Label>Año</Label>
                      <Input
                        type="number"
                        value={car.year}
                        onChange={(e) => updateFavoriteCar(index, 'year', parseInt(e.target.value))}
                        min="1900"
                        max={new Date().getFullYear() + 1}
                      />
                    </div>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => removeFavoriteCar(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              
              <Button
                variant="outline"
                onClick={addFavoriteCar}
                className="w-full flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Agregar Auto Favorito
              </Button>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex gap-4">
            <Button
              onClick={saveProfile}
              disabled={loading || !username.trim()}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {loading ? "Guardando..." : "Guardar Cambios"}
            </Button>
            
            <Button
              variant="outline"
              onClick={() => navigate("/profile")}
              disabled={loading}
            >
              Cancelar
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
};

export default EditProfile;