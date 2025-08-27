import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Car, MapPin, Trophy, Star, Calendar, Heart, Eye, ArrowLeft, MessageCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import ProfileCarsSection from '@/components/ui/profile-cars-section';

interface UserProfile {
  id: string;
  username: string;
  avatar_url: string;
  bio: string;
  city: string;
  country: string;
  birth_date: string;
  social_links: any;
  points: number;
  level: number;
  privacy_settings: any;
  created_at: string;
}

interface UserCar {
  id: string;
  make: string;
  model: string;
  year: number;
  description?: string;
  is_current?: boolean;
  created_at: string;
}

interface UserAchievement {
  id: string;
  earned_at: string;
  achievement: {
    name: string;
    description: string;
    icon: string;
    points: number;
  };
}

interface Photo {
  id: string;
  storage_path: string;
  thumbnail_path: string;
  caption: string;
  created_at: string;
  event: {
    title: string;
  } | null;
}

export default function Showroom() {
  const { userId } = useParams<{ userId: string }>();
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [currentCars, setCurrentCars] = useState<UserCar[]>([]);
  const [favoriteCars, setFavoriteCars] = useState<UserCar[]>([]);
  const [achievements, setAchievements] = useState<UserAchievement[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [thumbnailUrls, setThumbnailUrls] = useState<Record<string, string>>({});

  const isOwnProfile = user?.id === userId;

  // Show login message for non-authenticated users
  if (!authLoading && !user) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-20">
          <div className="text-center max-w-md mx-auto">
            <h1 className="text-3xl font-bold text-foreground mb-4">
              Inicia sesión para ver el showroom
            </h1>
            <p className="text-muted-foreground mb-6">
              Necesitas una cuenta para explorar los showrooms de la comunidad.
            </p>
            <Link to="/auth">
              <Button size="lg" className="w-full">
                Iniciar sesión
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  useEffect(() => {
    if (userId) {
      loadUserData();
    }
  }, [userId]);

  const loadUserData = async () => {
    if (!userId) return;

    try {
      setLoading(true);

      // Load profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error('Error loading profile:', profileError);
        return;
      }

      setProfile(profileData);

      // Set SEO
      document.title = `${profileData.username || 'Usuario'} - Showroom - AUTODEBATE`;

      // Load current cars
      const { data: currentCarsData } = await supabase
        .from('user_cars')
        .select('*')
        .eq('user_id', userId)
        .eq('is_current', true)
        .order('created_at', { ascending: false });

      setCurrentCars(currentCarsData || []);

      // Load favorite cars
      const { data: favoriteCarsData } = await supabase
        .from('user_favorite_cars')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      setFavoriteCars(favoriteCarsData || []);

      // Load achievements
      const { data: achievementsData } = await supabase
        .from('user_achievements')
        .select(`
          *,
          achievement:achievements(*)
        `)
        .eq('user_id', userId)
        .order('earned_at', { ascending: false });

      setAchievements(achievementsData || []);

      // Load user photos (excluding car photos which have null event_id)
      const { data: photosData } = await supabase
        .from('photos')
        .select(`
          *,
          event:events!left(title)
        `)
        .eq('uploaded_by', userId)
        .not('event_id', 'is', null)
        .order('created_at', { ascending: false })
        .limit(12);

      setPhotos((photosData || []).map((photo: any) => ({
        ...photo,
        event: photo.event && typeof photo.event === 'object' && !photo.event.error ? photo.event : null
      })));

      // Generate thumbnail URLs
      if (photosData && photosData.length > 0) {
        const urlPromises = photosData.map(async (photo) => {
          const path = photo.thumbnail_path || photo.storage_path;
          if (path) {
            const { data } = await supabase.storage
              .from('gallery')
              .createSignedUrl(path, 3600);
            return { id: photo.id, url: data?.signedUrl || '' };
          }
          return { id: photo.id, url: '' };
        });

        const urls = await Promise.all(urlPromises);
        const urlMap = urls.reduce((acc, { id, url }) => {
          acc[id] = url;
          return acc;
        }, {} as Record<string, string>);

        setThumbnailUrls(urlMap);
      }

    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getLevelBadgeColor = (level: number) => {
    if (level >= 5) return 'bg-gradient-to-r from-yellow-400 to-orange-500';
    if (level >= 3) return 'bg-gradient-to-r from-blue-400 to-purple-500';
    return 'bg-gradient-to-r from-green-400 to-blue-500';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/4"></div>
            <div className="h-32 bg-muted rounded"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-40 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Usuario no encontrado</h2>
          <p className="text-muted-foreground mb-4">
            El perfil que buscas no existe o no está disponible.
          </p>
          <Link to="/comunidad">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a la Comunidad
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const showCars = profile.privacy_settings?.show_cars !== false;
  const showLocation = profile.privacy_settings?.show_location !== false;
  const showActivity = profile.privacy_settings?.show_activity !== false;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Navigation */}
        <div className="mb-6">
          <Link to="/comunidad">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a la Comunidad
            </Button>
          </Link>
        </div>

        {/* Profile Header */}
        <Card className="mb-8">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-start gap-6">
              <Avatar className="w-24 h-24">
                <AvatarImage src={profile.avatar_url} alt={profile.username} />
                <AvatarFallback className="text-2xl">
                  {profile.username?.charAt(0)?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
                  <h1 className="text-3xl font-bold">{profile.username || 'Usuario'}</h1>
                  <div className="flex items-center gap-2">
                    <Badge className={`text-white ${getLevelBadgeColor(profile.level)}`}>
                      <Star className="w-3 h-3 mr-1" />
                      Nivel {profile.level}
                    </Badge>
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Trophy className="w-3 h-3" />
                      {profile.points} puntos
                    </Badge>
                  </div>
                </div>

                {profile.bio && (
                  <p className="text-lg text-muted-foreground mb-4">{profile.bio}</p>
                )}

                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  {showLocation && (profile.city || profile.country) && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {profile.city && profile.country ? `${profile.city}, ${profile.country}` : 
                       profile.city || profile.country}
                    </div>
                  )}
                  
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Miembro desde {formatDate(profile.created_at)}
                  </div>
                </div>

                {!isOwnProfile && (
                  <div className="flex gap-2 mt-4">
                    <Button className="flex items-center gap-2">
                      <MessageCircle className="w-4 h-4" />
                      Enviar Mensaje
                    </Button>
                    <Button variant="outline" className="flex items-center gap-2">
                      <Heart className="w-4 h-4" />
                      Seguir
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs Content */}
        <Tabs defaultValue="garage" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="garage">Garage</TabsTrigger>
            <TabsTrigger value="photos">Fotos</TabsTrigger>
            <TabsTrigger value="achievements">Logros</TabsTrigger>
            <TabsTrigger value="activity">Actividad</TabsTrigger>
          </TabsList>

          {/* Garage Tab */}
          <TabsContent value="garage" className="space-y-6">
            {showCars ? (
              <>
                {/* Current Cars with Photos */}
                <ProfileCarsSection userId={userId!} canEdit={isOwnProfile} />

                {/* Favorite Cars */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Heart className="w-5 h-5" />
                      Autos Favoritos
                    </CardTitle>
                    <CardDescription>
                      Los autos que {isOwnProfile ? 'te gustan' : 'le gustan'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {favoriteCars.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">
                        {isOwnProfile ? 'No has agregado autos favoritos' : 'No ha agregado autos favoritos'}
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {favoriteCars.map((car) => (
                          <Badge key={car.id} variant="secondary" className="text-sm p-2">
                            {car.make} {car.model} {car.year}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Car className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Información Privada</h3>
                  <p className="text-muted-foreground">
                    Este usuario ha configurado su información de autos como privada.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Photos Tab */}
          <TabsContent value="photos">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Galería de Fotos
                </CardTitle>
                <CardDescription>
                  Fotos subidas por {isOwnProfile ? 'ti' : profile.username}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {photos.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    {isOwnProfile ? 'No has subido fotos aún' : 'No ha subido fotos aún'}
                  </p>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {photos.map((photo) => (
                      <div key={photo.id} className="aspect-square relative group">
                        <img
                          src={thumbnailUrls[photo.id] || '/placeholder.svg'}
                          alt={photo.caption || 'Foto'}
                          className="w-full h-full object-cover rounded-lg"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-end p-2">
                          <div className="text-white text-xs">
                            <p className="font-medium">{photo.event?.title}</p>
                            {photo.caption && <p>{photo.caption}</p>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Achievements Tab */}
          <TabsContent value="achievements">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5" />
                  Logros Obtenidos
                </CardTitle>
                <CardDescription>
                  Los logros que ha conseguido {isOwnProfile ? '' : profile.username}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {achievements.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    {isOwnProfile ? 'No has obtenido logros aún' : 'No ha obtenido logros aún'}
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {achievements.map((userAchievement) => (
                      <Card key={userAchievement.id} className="bg-muted/50">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="text-2xl">{userAchievement.achievement.icon}</div>
                            <div className="flex-1">
                              <h3 className="font-semibold">{userAchievement.achievement.name}</h3>
                              <p className="text-sm text-muted-foreground">
                                {userAchievement.achievement.description}
                              </p>
                              <div className="flex items-center justify-between mt-2">
                                <Badge variant="outline" className="text-xs">
                                  +{userAchievement.achievement.points} puntos
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {formatDate(userAchievement.earned_at)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle>Actividad Reciente</CardTitle>
                <CardDescription>
                  {showActivity ? 
                    `Actividad reciente de ${isOwnProfile ? 'tu' : profile.username} perfil` :
                    'Esta información es privada'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                {showActivity ? (
                  <p className="text-muted-foreground text-center py-8">
                    Próximamente: registro de actividad detallado
                  </p>
                ) : (
                  <div className="text-center py-8">
                    <Trophy className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Información Privada</h3>
                    <p className="text-muted-foreground">
                      Este usuario ha configurado su actividad como privada.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}