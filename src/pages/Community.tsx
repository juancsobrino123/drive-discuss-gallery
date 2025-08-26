import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, Users, Car, MapPin, Trophy, Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { Link } from 'react-router-dom';

interface UserProfile {
  id: string;
  username: string;
  avatar_url: string;
  bio: string;
  city: string;
  country: string;
  points: number;
  level: number;
  privacy_settings: any;
}

interface UserCar {
  id: string;
  make: string;
  model: string;
  year: number;
  is_current: boolean;
}

interface SearchFilters {
  location: string;
  country: string;
  carMake: string;
  carModel: string;
  carYear: string;
  minLevel: string;
}

export default function Community() {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [userCars, setUserCars] = useState<Record<string, UserCar[]>>({});
  const [loading, setLoading] = useState(true);
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    location: '',
    country: '',
    carMake: '',
    carModel: '',
    carYear: '',
    minLevel: ''
  });

  // SEO Meta tags
  useEffect(() => {
    document.title = 'Comunidad - AUTODEBATE';
    
    const setMeta = (name: string, content: string) => {
      let meta = document.querySelector(`meta[name="${name}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', name);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    setMeta('description', 'Conecta con otros apasionados por los autos. Encuentra usuarios de tu ciudad, comparte tu pasión y descubre la comunidad AUTODEBATE.');
    
    const setCanonical = (href: string) => {
      let canonical = document.querySelector('link[rel="canonical"]');
      if (!canonical) {
        canonical = document.createElement('link');
        canonical.setAttribute('rel', 'canonical');
        document.head.appendChild(canonical);
      }
      canonical.setAttribute('href', href);
    };
    
    setCanonical(`${window.location.origin}/comunidad`);
  }, []);

  const loadProfiles = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('profiles')
        .select('*')
        .order('points', { ascending: false })
        .limit(50);

      // Apply filters
      if (searchFilters.location && searchFilters.country) {
        query = query.eq('city', searchFilters.location).eq('country', searchFilters.country);
      } else if (searchFilters.country) {
        query = query.eq('country', searchFilters.country);
      }

      if (searchFilters.minLevel) {
        query = query.gte('level', parseInt(searchFilters.minLevel));
      }

      const { data: profilesData, error } = await query;

      if (error) {
        console.error('Error loading profiles:', error);
        return;
      }

      // Load user cars for each profile
      const carPromises = profilesData?.map(async (profile) => {
        const { data: cars } = await supabase
          .from('user_cars')
          .select('*')
          .eq('user_id', profile.id)
          .eq('is_current', true);
        
        return { userId: profile.id, cars: cars || [] };
      }) || [];

      const carsResults = await Promise.all(carPromises);
      const carsMap = carsResults.reduce((acc, result) => {
        acc[result.userId] = result.cars;
        return acc;
      }, {} as Record<string, UserCar[]>);

      // Filter by car if specified
      let filteredProfiles = profilesData || [];
      if (searchFilters.carMake || searchFilters.carModel || searchFilters.carYear) {
        filteredProfiles = profilesData?.filter(profile => {
          const userCarList = carsMap[profile.id] || [];
          return userCarList.some(car => {
            const matchesMake = !searchFilters.carMake || car.make.toLowerCase().includes(searchFilters.carMake.toLowerCase());
            const matchesModel = !searchFilters.carModel || car.model.toLowerCase().includes(searchFilters.carModel.toLowerCase());
            const matchesYear = !searchFilters.carYear || car.year?.toString() === searchFilters.carYear;
            return matchesMake && matchesModel && matchesYear;
          });
        }) || [];
      }

      setProfiles(filteredProfiles);
      setUserCars(carsMap);
    } catch (error) {
      console.error('Error loading community data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfiles();
  }, [searchFilters]);

  const handleFilterChange = (key: keyof SearchFilters, value: string) => {
    setSearchFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setSearchFilters({
      location: '',
      country: '',
      carMake: '',
      carModel: '',
      carYear: '',
      minLevel: ''
    });
  };

  const getLevelBadgeColor = (level: number) => {
    if (level >= 5) return 'bg-gradient-to-r from-yellow-400 to-orange-500';
    if (level >= 3) return 'bg-gradient-to-r from-blue-400 to-purple-500';
    return 'bg-gradient-to-r from-green-400 to-blue-500';
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "Comunidad AUTODEBATE",
    "description": "Conecta con otros apasionados por los autos en la comunidad AUTODEBATE",
    "url": `${window.location.origin}/comunidad`
  };

  return (
    <div className="min-h-screen bg-background">
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Header */}
      <header className="bg-gradient-to-r from-primary/10 to-secondary/10 border-b">
        <div className="container mx-auto px-4 pt-20 pb-12">
          <h1 className="text-4xl font-bold text-center mb-4">Comunidad AUTODEBATE</h1>
          <p className="text-xl text-muted-foreground text-center max-w-2xl mx-auto">
            Conecta con otros apasionados por los autos. Encuentra usuarios de tu ciudad, 
            comparte tu pasión y descubre nuevos amigos automotrices.
          </p>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Filters Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              Buscar Miembros
            </CardTitle>
            <CardDescription>
              Filtra usuarios por ubicación, autos y nivel de actividad
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div>
                <Label htmlFor="country">País</Label>
                <Select value={searchFilters.country} onValueChange={(value) => handleFilterChange('country', value)}>
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
                <Label htmlFor="location">Ciudad</Label>
                <Input
                  id="location"
                  placeholder="Santiago, Buenos Aires..."
                  value={searchFilters.location}
                  onChange={(e) => handleFilterChange('location', e.target.value)}
                  disabled={!searchFilters.country}
                />
              </div>

              <div>
                <Label htmlFor="carMake">Marca de Auto</Label>
                <Input
                  id="carMake"
                  placeholder="Ford, Honda, BMW..."
                  value={searchFilters.carMake}
                  onChange={(e) => handleFilterChange('carMake', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="carModel">Modelo</Label>
                <Input
                  id="carModel"
                  placeholder="Mustang, Civic..."
                  value={searchFilters.carModel}
                  onChange={(e) => handleFilterChange('carModel', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="carYear">Año</Label>
                <Input
                  id="carYear"
                  placeholder="2020"
                  type="number"
                  value={searchFilters.carYear}
                  onChange={(e) => handleFilterChange('carYear', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="minLevel">Nivel Mínimo</Label>
                <Select value={searchFilters.minLevel} onValueChange={(value) => handleFilterChange('minLevel', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Cualquiera" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Nivel 1+</SelectItem>
                    <SelectItem value="2">Nivel 2+</SelectItem>
                    <SelectItem value="3">Nivel 3+</SelectItem>
                    <SelectItem value="4">Nivel 4+</SelectItem>
                    <SelectItem value="5">Nivel 5+</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={loadProfiles} className="flex items-center gap-2">
                <Search className="w-4 h-4" />
                Buscar
              </Button>
              <Button variant="outline" onClick={clearFilters}>
                Limpiar Filtros
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-muted rounded-full"></div>
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : profiles.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No se encontraron usuarios</h3>
              <p className="text-muted-foreground">
                Intenta ajustar los filtros de búsqueda para encontrar más miembros de la comunidad.
              </p>
            </div>
          ) : (
            profiles.map((profile) => {
              const cars = userCars[profile.id] || [];
              const showCars = profile.privacy_settings?.show_cars !== false;
              const showLocation = profile.privacy_settings?.show_location !== false;
              
              return (
                <Card key={profile.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={profile.avatar_url} alt={profile.username} />
                        <AvatarFallback>
                          {profile.username?.charAt(0)?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold truncate">
                            {profile.username || 'Usuario'}
                          </h3>
                          <Badge 
                            className={`text-xs text-white ${getLevelBadgeColor(profile.level)}`}
                          >
                            <Star className="w-3 h-3 mr-1" />
                            Nivel {profile.level}
                          </Badge>
                        </div>

                        {profile.bio && (
                          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                            {profile.bio}
                          </p>
                        )}

                        {showLocation && (profile.city || profile.country) && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                            <MapPin className="w-3 h-3" />
                            {profile.city && profile.country ? `${profile.city}, ${profile.country}` : 
                             profile.city || profile.country}
                          </div>
                        )}

                        {showCars && cars.length > 0 && (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Car className="w-3 h-3" />
                              <span className="font-medium">Autos actuales:</span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {cars.slice(0, 2).map((car) => (
                                <Badge key={car.id} variant="secondary" className="text-xs">
                                  {car.make} {car.model} {car.year}
                                </Badge>
                              ))}
                              {cars.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{cars.length - 2} más
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between mt-4">
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Trophy className="w-3 h-3" />
                            {profile.points} puntos
                          </div>
                          
                          <Link to={`/showroom/${profile.id}`}>
                            <Button size="sm" variant="outline">
                              Ver Perfil
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}