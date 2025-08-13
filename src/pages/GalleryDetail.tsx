import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Navbar from "@/components/ui/navbar";
import Footer from "@/components/ui/footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Download, Eye, Calendar, MapPin, Upload, Trash2, Pencil, Star } from "lucide-react";
import galleryPreview from "@/assets/gallery-preview.jpg";
import { useTranslation } from "react-i18next";

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
  is_thumbnail: boolean;
}

const useRoles = () => {
  const [roles, setRoles] = useState<string[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const uid = sessionData.session?.user?.id ?? null;
      if (mounted) setUserId(uid);
      if (!uid) {
        if (mounted) setRoles([]);
        return;
      }
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", uid);
      if (mounted) setRoles(data?.map((r: any) => r.role) ?? []);
    };
    load();
    const { data: sub } = supabase.auth.onAuthStateChange(() => load());
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const canUpload = roles.includes("copiloto") || roles.includes("admin");
  const isAdmin = roles.includes("admin");
  const canDownload = roles.length > 0;

  return { userId, canUpload, isAdmin, canDownload };
};

const GalleryDetail = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { eventId } = useParams();
  const { userId, canUpload, isAdmin, canDownload } = useRoles();

  const [event, setEvent] = useState<EventItem | null>(null);
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [thumbUrls, setThumbUrls] = useState<Record<string, string>>({});
  const [creating, setCreating] = useState(false);

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
    const { data, error } = await supabase
      .from('events')
      .select('id, title, description, event_date, location, created_by')
      .eq('id', eventId)
      .maybeSingle();
    if (!error) setEvent(data as EventItem);
  };

  const loadPhotos = async () => {
    if (!eventId) return;
    const { data, error } = await supabase
      .from('photos')
      .select('id, event_id, storage_path, thumbnail_path, caption, uploaded_by, is_thumbnail')
      .eq('event_id', eventId)
      .order('created_at', { ascending: true });
    if (error) {
      console.error(error);
      toast({ description: 'Error cargando fotos' });
      return;
    }
    const items = (data || []) as PhotoItem[];
    setPhotos(items);
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
  };

  useEffect(() => {
    loadEvent();
    loadPhotos();
  }, [eventId]);

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0 || !eventId) return;
    try {
      setCreating(true);
      const { data: session } = await supabase.auth.getSession();
      const uid = session.session?.user?.id;
      if (!uid) {
        toast({ description: 'Inicia sesión para subir fotos' });
        return;
      }
      for (const file of Array.from(files)) {
        const basePath = `${uid}/${eventId}/${Date.now()}_${file.name}`;
        const { error: upErr } = await supabase.storage.from('gallery').upload(basePath, file, { upsert: false });
        if (upErr) throw upErr;
        const { error: thErr } = await supabase.storage.from('gallery-thumbs').upload(basePath, file, { upsert: false });
        if (thErr) console.warn('Thumb upload failed', thErr);
        const { error: insErr } = await supabase.from('photos').insert({
          event_id: eventId,
          storage_path: basePath,
          thumbnail_path: basePath,
          caption: null,
          uploaded_by: uid,
        });
        if (insErr) throw insErr;
      }
      toast({ description: 'Fotos subidas' });
      await loadPhotos();
    } catch (e: any) {
      console.error(e);
      toast({ description: e.message || 'Error al subir fotos' });
    } finally {
      setCreating(false);
    }
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
      console.error(e);
      toast({ description: e.message || 'No se pudo descargar' });
    }
  };

  const handleDownloadAll = async () => {
    try {
      if (!canDownload) {
        toast({ description: 'Inicia sesión para descargar' });
        return;
      }
      for (const p of photos) {
        const { data, error } = await supabase.storage.from('gallery').createSignedUrl(p.storage_path, 60);
        if (!error && data?.signedUrl) {
          window.open(data.signedUrl, '_blank');
          await new Promise((r) => setTimeout(r, 300));
        }
      }
    } catch (e: any) {
      console.error(e);
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
      console.error(e);
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
      console.error(e);
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
      console.error(e);
      toast({ description: e.message || 'No se pudo actualizar miniatura' });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
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
                <Download className="w-4 h-4 mr-2" /> Descargar todo
              </Button>
              {canUpload && (
                <label className="inline-flex items-center">
                  <input type="file" className="hidden" multiple onChange={(e) => handleUpload(e.target.files)} />
                  <Button variant="secondary" asChild>
                    <span><Upload className="w-4 h-4 mr-2" /> Subir fotos</span>
                  </Button>
                </label>
              )}
            </div>
          </div>
        </header>

        {/* Structured data for SEO */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

        <section className="py-8">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {photos.map((p) => (
                <Card key={p.id} className="overflow-hidden">
                  <img
                    src={thumbUrls[p.id] || galleryPreview}
                    alt={p.caption || 'Foto de evento'}
                    className="w-full h-48 object-cover"
                    loading="lazy"
                  />
                  <div className="p-2 flex items-center justify-between">
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleDownload(p)} disabled={!canDownload} aria-label="Descargar">
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleEditCaption(p)} disabled={!(isAdmin || p.uploaded_by === userId)} aria-label="Editar">
                        <Pencil className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <Button variant={p.is_thumbnail ? 'default' : 'ghost'} size="icon" onClick={() => toggleThumbnail(p)} aria-label="Marcar como miniatura">
                        <Star className={p.is_thumbnail ? 'text-primary' : ''} />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeletePhoto(p)} disabled={!(isAdmin || p.uploaded_by === userId)} aria-label="Eliminar">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default GalleryDetail;
