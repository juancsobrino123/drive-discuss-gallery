import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Download, Eye, Calendar, MapPin, Plus, Upload, Trash2, Pencil } from "lucide-react";
import galleryPreview from "@/assets/gallery-preview.jpg";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";

interface EventItem {
  id: string;
  title: string;
  description: string | null;
  event_date: string | null;
  location: string | null;
  created_by: string;
}

interface PhotoItem {
  id: string;
  event_id: string;
  storage_path: string;
  thumbnail_path: string | null;
  caption: string | null;
  uploaded_by: string;
  is_thumbnail?: boolean;
}

const GallerySection = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user, canCreateEvent, canUpload, isAdmin, canDownload, loading: authLoading } = useAuth();
  
  const [events, setEvents] = useState<EventItem[]>([]);
  const [photosByEvent, setPhotosByEvent] = useState<Record<string, PhotoItem[]>>({});
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});
  const [previewByEvent, setPreviewByEvent] = useState<Record<string, PhotoItem[]>>({});
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});
  const [creating, setCreating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: "", date: "", location: "", description: "" });
  const [loadingEvents, setLoadingEvents] = useState(true);

  // Load events from Supabase
  useEffect(() => {
    let isMounted = true;
    
    const loadEvents = async () => {
      if (!isMounted) return;
      
      setLoadingEvents(true);
      try {
        const { data, error } = await supabase
          .from("events")
          .select("id, title, description, event_date, location, created_by")
          .order("created_at", { ascending: false });
        
        if (!isMounted) return;
        
        if (error) {
          console.error('Error loading events:', error);
          toast({ description: "Error cargando eventos: " + error.message, variant: "destructive" });
          setEvents([]);
        } else {
          setEvents(data || []);
        }
      } catch (err) {
        if (!isMounted) return;
        console.error('Unexpected error:', err);
        toast({ description: "Error inesperado cargando eventos", variant: "destructive" });
        setEvents([]);
      } finally {
        if (isMounted) {
          setLoadingEvents(false);
        }
      }
    };
    
    loadEvents();
    
    return () => {
      isMounted = false;
    };
  }, [toast]);

  // Load photos for selected event
  const loadPhotos = async (eventId: string) => {
    try {
      const { data, error } = await supabase
        .from("photos")
        .select("id, event_id, storage_path, thumbnail_path, caption, uploaded_by")
        .eq("event_id", eventId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error('Error loading photos:', error);
        toast({ description: "Error cargando fotos" });
        return;
      }

      const items = (data || []) as PhotoItem[];
      setPhotosByEvent((prev) => ({ ...prev, [eventId]: items }));

      // Build URLs (thumbs are public; originals are signed when downloading)
      const newUrls: Record<string, string> = {};
      for (const p of items) {
        if (p.thumbnail_path) {
          const { data: pub } = supabase.storage.from("gallery-thumbs").getPublicUrl(p.thumbnail_path);
          if (pub?.publicUrl) newUrls[p.id] = pub.publicUrl;
        } else {
          newUrls[p.id] = galleryPreview;
        }
      }
      setPhotoUrls((prev) => ({ ...prev, ...newUrls }));
    } catch (err) {
      console.error('Unexpected error loading photos:', err);
      toast({ description: "Error inesperado cargando fotos" });
    }
  };

  // Load preview thumbnails (prioritize is_thumbnail, fallback to first photos)
  const loadPreview = async (eventId: string) => {
    try {
      const { data, error } = await supabase
        .from('photos')
        .select('id, event_id, storage_path, thumbnail_path, caption, uploaded_by, is_thumbnail')
        .eq('event_id', eventId)
        .order('is_thumbnail', { ascending: false })
        .order('created_at', { ascending: true })
        .limit(4);

      if (error) {
        console.error('Error loading preview:', error);
        return;
      }

      const items = (data || []) as PhotoItem[];
      setPreviewByEvent((prev) => ({ ...prev, [eventId]: items }));
      const newUrls: Record<string, string> = {};
      for (const p of items) {
        if (p.thumbnail_path) {
          const { data: pub } = supabase.storage.from('gallery-thumbs').getPublicUrl(p.thumbnail_path);
          if (pub?.publicUrl) newUrls[p.id] = pub.publicUrl;
        } else {
          newUrls[p.id] = galleryPreview;
        }
      }
      setPreviewUrls((prev) => ({ ...prev, ...newUrls }));
    } catch (err) {
      console.error('Unexpected error loading preview:', err);
    }
  };

  // Load previews when events change
  useEffect(() => {
    if (events.length === 0) return;
    
    const loadPreviews = async () => {
      try {
        const promises = events.map(event => loadPreview(event.id));
        await Promise.all(promises);
      } catch (err) {
        console.error('Error loading previews:', err);
      }
    };
    
    loadPreviews();
  }, [events]);

  const handleCreateEvent = async () => {
    if (!user) {
      toast({ description: "Inicia sesión para crear eventos" });
      return;
    }
    
    try {
      setCreating(true);
      const { error } = await supabase.from("events").insert({
        title: newEvent.title,
        description: newEvent.description || null,
        event_date: newEvent.date || null,
        location: newEvent.location || null,
        created_by: user.id,
      });
      if (error) throw error;
      toast({ description: "Evento creado" });
      setNewEvent({ title: "", date: "", location: "", description: "" });
      
      // Reload events
      const { data } = await supabase
        .from("events")
        .select("id, title, description, event_date, location, created_by")
        .order("created_at", { ascending: false });
      setEvents((data || []) as EventItem[]);
    } catch (e: any) {
      console.error('Error creating event:', e);
      toast({ description: e.message || "No se pudo crear el evento" });
    } finally {
      setCreating(false);
    }
  };

  const handleUpload = async (eventId: string, files: FileList | null) => {
    if (!files || files.length === 0) return;
    if (!user) {
      toast({ description: "Inicia sesión para subir fotos" });
      return;
    }
    
    try {
      setUploading(true);
      for (const file of Array.from(files)) {
        const basePath = `${user.id}/${eventId}/${Date.now()}_${file.name}`;
        const { error: upErr } = await supabase.storage.from("gallery").upload(basePath, file, { upsert: false });
        if (upErr) throw upErr;
        
        const { error: thErr } = await supabase.storage.from("gallery-thumbs").upload(basePath, file, { upsert: false });
        if (thErr) {
          console.warn("Thumb upload failed", thErr);
        }
        
        const { error: insErr } = await supabase.from("photos").insert({
          event_id: eventId,
          storage_path: basePath,
          thumbnail_path: basePath,
          caption: null,
          uploaded_by: user.id,
        });
        if (insErr) throw insErr;
      }
      toast({ description: "Fotos subidas" });
      await loadPhotos(eventId);
    } catch (e: any) {
      console.error('Error uploading photos:', e);
      toast({ description: e.message || "Error al subir fotos" });
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadAll = async (eventId: string) => {
    if (!canDownload) {
      toast({ description: 'Inicia sesión para descargar' });
      return;
    }
    try {
      let list = photosByEvent[eventId];
      if (!list) {
        const { data, error } = await supabase
          .from('photos')
          .select('id, storage_path')
          .eq('event_id', eventId);
        if (error) throw error;
        list = data as PhotoItem[];
      }
      for (const p of list) {
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

  // Show loading state while auth is loading
  if (authLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="text-muted-foreground">Cargando...</div>
      </div>
    );
  }

  if (loadingEvents) {
    return (
      <section id="gallery" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              {t('gallery.heading')}
            </h2>
            <p className="text-muted-foreground">Cargando galerías...</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="gallery" className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            {t('gallery.heading')}
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            {t('gallery.subheading')}
          </p>
        </div>

        <div className="flex justify-end mb-6">
          {canCreateEvent && (
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="platform"><Plus className="w-4 h-4 mr-2"/>Crear evento</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nuevo evento</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label>Título</Label>
                    <Input value={newEvent.title} onChange={(e) => setNewEvent((s) => ({ ...s, title: e.target.value }))} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Fecha</Label>
                    <Input type="date" value={newEvent.date} onChange={(e) => setNewEvent((s) => ({ ...s, date: e.target.value }))} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Ubicación</Label>
                    <Input value={newEvent.location} onChange={(e) => setNewEvent((s) => ({ ...s, location: e.target.value }))} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Descripción</Label>
                    <Input value={newEvent.description} onChange={(e) => setNewEvent((s) => ({ ...s, description: e.target.value }))} />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button onClick={handleCreateEvent} disabled={creating || !newEvent.title}>
                      {creating ? 'Creando…' : 'Crear'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {events.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No hay galerías disponibles</p>
            {canCreateEvent && (
              <p className="text-sm text-muted-foreground">Crea tu primera galería usando el botón "Crear evento"</p>
            )}
          </div>
        ) : (
          <>
            {/* Featured Gallery Preview */}
            <div className="mb-12">
              <Card className="overflow-hidden bg-gradient-card shadow-elegant">
                <div className="relative">
                  <img 
                    src={previewUrls[previewByEvent[events[0].id]?.[0]?.id] || galleryPreview} 
                    alt={`Vista previa galería ${events[0].title}`}
                    className="w-full h-64 md:h-96 object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  <div className="absolute bottom-6 left-6 right-6">
                    <div className="flex items-center text-white/90 text-sm mb-2">
                      <Calendar className="w-4 h-4 mr-2" />
                      Galería del evento más reciente
                    </div>
                    <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
                      {events[0].title}
                    </h3>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <Link to={`/galeria/${events[0].id}`}>
                        <Button variant="hero" size="lg">
                          <Eye className="w-5 h-5 mr-2" />
                          Ver galería
                        </Button>
                      </Link>
                      <Button 
                        variant="platform" 
                        size="lg" 
                        disabled={!canDownload} 
                        onClick={() => canDownload ? handleDownloadAll(events[0].id) : toast({ description: 'Inicia sesión para descargar' })}
                      >
                        <Download className="w-5 h-5 mr-2" />
                        Descargar todo ({previewByEvent[events[0].id]?.length || 0} fotos)
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Event Galleries Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {events.map((event) => (
                <Card 
                  key={event.id}
                  className={`p-6 hover:shadow-royal transition-all duration-300 transform hover:-translate-y-2 bg-gradient-card`}
                >
                  <div className="mb-3">
                    <div className="grid grid-cols-2 gap-1 h-40">
                      {(previewByEvent[event.id] || []).slice(0, 4).map((p) => (
                        <img
                          key={p.id}
                          src={previewUrls[p.id] || galleryPreview}
                          alt={p.caption || 'Miniatura de evento'}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ))}
                      {(previewByEvent[event.id] || []).length < 4 && 
                        Array.from({ length: 4 - (previewByEvent[event.id] || []).length }).map((_, idx) => (
                          <div key={`empty-${idx}`} className="w-full h-full bg-muted/20 flex items-center justify-center">
                            <span className="text-muted-foreground/50 text-xs">Sin fotos</span>
                          </div>
                        ))
                      }
                    </div>
                  </div>
                  
                  <h3 className="font-semibold text-foreground mb-2 truncate">
                    {event.title}
                  </h3>
                  
                  <div className="text-sm text-muted-foreground mb-3">
                    <div className="flex items-center mb-1">
                      <Calendar className="w-4 h-4 mr-1" />
                      <span>{event.event_date || 'Fecha por definir'}</span>
                    </div>
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-1" />
                      <span className="truncate">{event.location || 'Ubicación por definir'}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Link to={`/galeria/${event.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        <Eye className="w-4 h-4 mr-2" />
                        Ver
                      </Button>
                    </Link>
                    {canUpload && (
                      <label className="flex-1">
                        <input 
                          type="file" 
                          className="hidden" 
                          multiple 
                          onChange={(e) => handleUpload(event.id, e.target.files)} 
                        />
                        <Button variant="secondary" size="sm" asChild className="w-full">
                          <span>
                            <Upload className="w-4 h-4 mr-2" />
                            Subir
                          </span>
                        </Button>
                      </label>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default GallerySection;