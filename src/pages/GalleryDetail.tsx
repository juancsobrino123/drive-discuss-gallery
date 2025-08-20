import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Download, Calendar, MapPin, Upload, Plus } from "lucide-react";
import galleryPreview from "@/assets/gallery-preview.jpg";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";
import PhotoCard from "@/components/ui/photo-card";
import PhotoUploadDialog from "@/components/ui/photo-upload-dialog";
import PhotoSearch from "@/components/ui/photo-search";

interface EventItem {
  id: string;
  title: string;
  description: string | null;
  event_date: string | null;
  location: string | null;
  created_by: string;
}

interface UserCar {
  id: string;
  make: string;
  model: string;
  year: number | null;
}

interface PhotoItem {
  id: string;
  event_id: string;
  storage_path: string;
  thumbnail_path: string | null;
  caption: string | null;
  uploaded_by: string;
  is_thumbnail: boolean;
  user_car_id: string | null;
  specs: any;
  tags: string[];
  likes_count: number;
  favorites_count: number;
}

const GalleryDetail = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { eventId } = useParams();
  const { user, canUpload, isAdmin, canDownload } = useAuth();

  const [event, setEvent] = useState<EventItem | null>(null);
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [filteredPhotos, setFilteredPhotos] = useState<PhotoItem[]>([]);
  const [thumbUrls, setThumbUrls] = useState<Record<string, string>>({});
  const [userCars, setUserCars] = useState<Record<string, UserCar>>({});
  const [userLikes, setUserLikes] = useState<Set<string>>(new Set());
  const [userFavorites, setUserFavorites] = useState<Set<string>>(new Set());
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

  // SEO tags
  useEffect(() => {
    const title = event ? `${event.title} | AUTODEBATE` : "Galería | AUTODEBATE";
    const description = event?.description || t('gallery.subheading');
    const canonicalUrl = typeof window !== 'undefined' && eventId ? `${window.location.origin}/galeria/${eventId}` : '/galeria';

    document.title = title;

    const setMeta = (name: string, content: string) => {
      let tag = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute('name', name);
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', content);
    };

    setMeta('description', description);

    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link');
      link.setAttribute('rel', 'canonical');
      document.head.appendChild(link);
    }
    link.setAttribute('href', canonicalUrl);
  }, [event, eventId, t]);

  const jsonLd = useMemo(() => ({
    "@context": "https://schema.org",
    "@type": "ImageGallery",
    name: event?.title || 'Galería de Eventos AUTODEBATE',
    description: event?.description || t('gallery.subheading'),
    url: typeof window !== 'undefined' && eventId ? `${window.location.origin}/galeria/${eventId}` : '/galeria',
  }), [event, eventId, t]);

  const loadEvent = async () => {
    if (!eventId) return;
    try {
      const { data, error } = await supabase
        .from('events')
        .select('id, title, description, event_date, location, created_by')
        .eq('id', eventId)
        .maybeSingle();
      
      if (error) {
        console.error('Error loading event:', error);
        toast({ description: 'Error cargando evento' });
        return;
      }
      
      setEvent(data as EventItem);
    } catch (err) {
      console.error('Unexpected error loading event:', err);
      toast({ description: 'Error inesperado cargando evento' });
    }
  };

  const loadPhotos = async () => {
    if (!eventId) return;
    try {
      const { data, error } = await supabase
        .from('photos')
        .select(`
          id, event_id, storage_path, thumbnail_path, caption, uploaded_by, is_thumbnail,
          user_car_id, specs, tags, likes_count, favorites_count
        `)
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error loading photos:', error);
        toast({ description: 'Error cargando fotos' });
        return;
      }
      
      const items = (data || []) as PhotoItem[];
      setPhotos(items);
      setFilteredPhotos(items);

      // Load thumbnail URLs
      const urls: Record<string, string> = {};
      for (const p of items) {
        if (p.thumbnail_path) {
          const { data: pub } = supabase.storage.from('gallery-thumbs').getPublicUrl(p.thumbnail_path);
          if (pub?.publicUrl) urls[p.id] = pub.publicUrl;
        } else {
          urls[p.id] = galleryPreview;
        }
      }
      setThumbUrls(urls);

      // Load associated car data
      const carIds = [...new Set(items.map(p => p.user_car_id).filter(Boolean))];
      if (carIds.length > 0) {
        const { data: carsData } = await supabase
          .from('user_cars')
          .select('id, make, model, year')
          .in('id', carIds);
        
        const carsMap: Record<string, UserCar> = {};
        carsData?.forEach(car => {
          carsMap[car.id] = car;
        });
        setUserCars(carsMap);
      }

      // Load user likes and favorites if authenticated
      if (user) {
        const photoIds = items.map(p => p.id);
        
        const { data: likesData } = await supabase
          .from('photo_likes')
          .select('photo_id')
          .eq('user_id', user.id)
          .in('photo_id', photoIds);
        
        const { data: favoritesData } = await supabase
          .from('photo_favorites')
          .select('photo_id')
          .eq('user_id', user.id)
          .in('photo_id', photoIds);
        
        setUserLikes(new Set(likesData?.map(l => l.photo_id) || []));
        setUserFavorites(new Set(favoritesData?.map(f => f.photo_id) || []));
      }

    } catch (err) {
      console.error('Unexpected error loading photos:', err);
      toast({ description: 'Error inesperado cargando fotos' });
    }
  };

  useEffect(() => {
    loadEvent();
    loadPhotos();
  }, [eventId, user]);

  // Handle search/filter
  const handleSearch = (filters: any) => {
    let filtered = [...photos];

    if (filters.query) {
      const query = filters.query.toLowerCase();
      filtered = filtered.filter(photo => 
        photo.caption?.toLowerCase().includes(query) ||
        photo.tags?.some(tag => tag.toLowerCase().includes(query)) ||
        (photo.user_car_id && userCars[photo.user_car_id] && 
         `${userCars[photo.user_car_id].make} ${userCars[photo.user_car_id].model}`.toLowerCase().includes(query))
      );
    }

    if (filters.make && filters.make !== "") {
      filtered = filtered.filter(photo => 
        photo.user_car_id && userCars[photo.user_car_id]?.make === filters.make
      );
    }

    if (filters.model && filters.model !== "") {
      filtered = filtered.filter(photo => 
        photo.user_car_id && userCars[photo.user_car_id]?.model === filters.model
      );
    }

    if (filters.year && filters.year !== "") {
      filtered = filtered.filter(photo => 
        photo.user_car_id && userCars[photo.user_car_id]?.year === parseInt(filters.year)
      );
    }

    if (filters.tags && filters.tags.length > 0) {
      filtered = filtered.filter(photo => 
        photo.tags?.some(tag => filters.tags.includes(tag))
      );
    }

    if (filters.hasLikes) {
      filtered = filtered.filter(photo => photo.likes_count > 0);
    }

    if (filters.hasFavorites) {
      filtered = filtered.filter(photo => photo.favorites_count > 0);
    }

    setFilteredPhotos(filtered);
  };

  const handleLike = async (photoId: string) => {
    await loadPhotos(); // Refresh to get updated counts and user interactions
  };

  const handleFavorite = async (photoId: string) => {
    await loadPhotos(); // Refresh to get updated counts and user interactions
  };

  const handleDownload = async (photo: PhotoItem) => {
    try {
      if (!canDownload) {
        toast({ description: 'Inicia sesión para descargar' });
        return;
      }
      const { data, error } = await supabase.storage.from('gallery').createSignedUrl(photo.storage_path, 60);
      if (error || !data?.signedUrl) throw error || new Error('No URL');
      window.open(data.signedUrl, '_blank');
    } catch (e: any) {
      console.error('Error downloading:', e);
      toast({ description: e.message || 'No se pudo descargar' });
    }
  };

  const handleDownloadAll = async () => {
    try {
      if (!canDownload) {
        toast({ description: 'Inicia sesión para descargar' });
        return;
      }
      for (const p of filteredPhotos) {
        const { data, error } = await supabase.storage.from('gallery').createSignedUrl(p.storage_path, 60);
        if (!error && data?.signedUrl) {
          window.open(data.signedUrl, '_blank');
          await new Promise((r) => setTimeout(r, 300));
        }
      }
    } catch (e: any) {
      console.error('Error downloading all:', e);
      toast({ description: e.message || 'No se pudo descargar todo' });
    }
  };

  const handleEditCaption = async (photo: PhotoItem) => {
    const value = window.prompt('Editar descripción', photo.caption || '')?.trim();
    if (value === undefined) return;
    try {
      const { error } = await supabase.from('photos').update({ caption: value || null }).eq('id', photo.id);
      if (error) throw error;
      toast({ description: 'Descripción actualizada' });
      await loadPhotos();
    } catch (e: any) {
      console.error('Error updating caption:', e);
      toast({ description: e.message || 'No se pudo actualizar' });
    }
  };

  const handleDeletePhoto = async (photo: PhotoItem) => {
    try {
      const { error } = await supabase.from('photos').delete().eq('id', photo.id);
      if (error) throw error;
      await supabase.storage.from('gallery').remove([photo.storage_path]);
      if (photo.thumbnail_path) await supabase.storage.from('gallery-thumbs').remove([photo.thumbnail_path]);
      toast({ description: 'Foto eliminada' });
      await loadPhotos();
    } catch (e: any) {
      console.error('Error deleting photo:', e);
      toast({ description: e.message || 'No se pudo eliminar' });
    }
  };

  const toggleThumbnail = async (photo: PhotoItem) => {
    try {
      const selectedCount = photos.filter(p => p.is_thumbnail).length;
      if (!photo.is_thumbnail && selectedCount >= 4) {
        toast({ description: 'Máximo 4 miniaturas por evento' });
        return;
      }
      const { error } = await supabase.from('photos')
        .update({ is_thumbnail: !photo.is_thumbnail })
        .eq('id', photo.id);
      if (error) throw error;
      await loadPhotos();
    } catch (e: any) {
      console.error('Error toggling thumbnail:', e);
      toast({ description: e.message || 'No se pudo actualizar miniatura' });
    }
  };

  return (
    <main>
      <header className="pt-28 pb-6 border-b border-border bg-gradient-to-b from-background/50 to-background">
        <div className="container mx-auto px-4">
          <nav className="text-sm text-muted-foreground mb-3" aria-label="breadcrumbs">
            <Link to="/galeria" className="hover:text-foreground">Galería</Link>
            <span className="mx-2">/</span>
            <span className="text-foreground">{event?.title || 'Evento'}</span>
          </nav>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground font-brand">
            {event?.title || 'Galería de Evento'}
          </h1>
          <p className="mt-2 text-muted-foreground max-w-3xl">
            {event?.description || t('gallery.subheading')}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span className="inline-flex items-center"><Calendar className="w-4 h-4 mr-2" />{event?.event_date || '-'}</span>
            <span className="inline-flex items-center"><MapPin className="w-4 h-4 mr-2" />{event?.location || '-'}</span>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button variant="platform" onClick={handleDownloadAll} disabled={!canDownload}>
              <Download className="w-4 h-4 mr-2" /> Descargar todo ({filteredPhotos.length})
            </Button>
            {canUpload && (
              <Button variant="secondary" onClick={() => setUploadDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" /> Subir fotos
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Structured data for SEO */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <section className="py-8">
        <div className="container mx-auto px-4">
          {/* Search and Filters */}
          <PhotoSearch onSearch={handleSearch} className="mb-6" />

          {/* Photos Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredPhotos.map((photo) => (
              <PhotoCard
                key={photo.id}
                photo={photo}
                imageUrl={thumbUrls[photo.id] || galleryPreview}
                userCar={photo.user_car_id ? userCars[photo.user_car_id] : undefined}
                isLiked={userLikes.has(photo.id)}
                isFavorited={userFavorites.has(photo.id)}
                canEdit={isAdmin || photo.uploaded_by === user?.id}
                canDelete={isAdmin || photo.uploaded_by === user?.id}
                canDownload={canDownload}
                onLike={handleLike}
                onFavorite={handleFavorite}
                onDownload={handleDownload}
                onEdit={handleEditCaption}
                onDelete={handleDeletePhoto}
                onToggleThumbnail={toggleThumbnail}
              />
            ))}
          </div>

          {filteredPhotos.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No se encontraron fotos</p>
            </div>
          )}
        </div>
      </section>

      {/* Upload Dialog */}
      <PhotoUploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        eventId={eventId || ""}
        onUploadComplete={loadPhotos}
      />
    </main>
  );
};

export default GalleryDetail;