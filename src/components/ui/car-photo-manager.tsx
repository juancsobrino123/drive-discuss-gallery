import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Upload, X, Plus, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import galleryPreview from '@/assets/gallery-preview.jpg';

interface CarPhoto {
  id: string;
  storage_path: string;
  thumbnail_path: string | null;
  caption: string | null;
}

interface CarPhotoManagerProps {
  carId: string;
  carMake: string;
  carModel: string;
  carYear?: number;
  onPhotosUpdated?: () => void;
  canEdit?: boolean;
}

export default function CarPhotoManager({ 
  carId, 
  carMake, 
  carModel, 
  carYear,
  onPhotosUpdated,
  canEdit = false
}: CarPhotoManagerProps) {
  const { toast } = useToast();
  const [photos, setPhotos] = useState<CarPhoto[]>([]);
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const MAX_PHOTOS = 5;

  useEffect(() => {
    loadCarPhotos();
  }, [carId]);

  const loadCarPhotos = async () => {
    try {
      setLoading(true);
      const { data: photosData, error } = await supabase
        .from('photos')
        .select('id, storage_path, thumbnail_path, caption')
        .eq('user_car_id', carId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setPhotos(photosData || []);

      // Load photo URLs
      const urls: Record<string, string> = {};
      for (const photo of photosData || []) {
        if (photo.thumbnail_path) {
          const { data: urlData } = supabase.storage
            .from('gallery-thumbs')
            .getPublicUrl(photo.thumbnail_path);
          urls[photo.id] = urlData?.publicUrl || galleryPreview;
        } else {
          urls[photo.id] = galleryPreview;
        }
      }
      setPhotoUrls(urls);
    } catch (error: any) {
      console.error('Error loading car photos:', error);
      toast({ description: 'Error cargando fotos', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length + photos.length > MAX_PHOTOS) {
      toast({ 
        description: `Solo puedes tener máximo ${MAX_PHOTOS} fotos por auto`, 
        variant: 'destructive' 
      });
      return;
    }
    setSelectedFiles(files);
  };

  const handleUpload = async () => {
    if (!selectedFiles || selectedFiles.length === 0) return;

    try {
      setUploading(true);
      
      for (const file of Array.from(selectedFiles)) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${crypto.randomUUID()}.${fileExt}`;
        const filePath = `cars/${carId}/${fileName}`;
        const thumbPath = `cars/${carId}/thumb_${fileName}`;

        // Upload original
        const { error: uploadError } = await supabase.storage
          .from('gallery')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // Upload thumbnail (simplified - using same image)
        const { error: thumbError } = await supabase.storage
          .from('gallery-thumbs')
          .upload(thumbPath, file);

        if (thumbError) throw thumbError;

        // Create database record
        const { error: dbError } = await supabase
          .from('photos')
          .insert({
            storage_path: filePath,
            thumbnail_path: thumbPath,
            user_car_id: carId,
            uploaded_by: (await supabase.auth.getUser()).data.user?.id,
            caption: `${carMake} ${carModel} ${carYear || ''}`.trim()
          });

        if (dbError) throw dbError;
      }

      toast({ description: 'Fotos subidas exitosamente' });
      setSelectedFiles(null);
      setDialogOpen(false);
      loadCarPhotos();
      onPhotosUpdated?.();
    } catch (error: any) {
      console.error('Error uploading photos:', error);
      toast({ description: 'Error subiendo fotos', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePhoto = async (photoId: string, storagePath: string, thumbnailPath?: string) => {
    try {
      // Delete from storage
      await supabase.storage.from('gallery').remove([storagePath]);
      if (thumbnailPath) {
        await supabase.storage.from('gallery-thumbs').remove([thumbnailPath]);
      }

      // Delete from database
      const { error } = await supabase
        .from('photos')
        .delete()
        .eq('id', photoId);

      if (error) throw error;

      toast({ description: 'Foto eliminada' });
      loadCarPhotos();
      onPhotosUpdated?.();
    } catch (error: any) {
      console.error('Error deleting photo:', error);
      toast({ description: 'Error eliminando foto', variant: 'destructive' });
    }
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground">Cargando fotos...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Photos Grid */}
      {photos.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {photos.map((photo) => (
            <div key={photo.id} className="relative group">
              <img
                src={photoUrls[photo.id] || galleryPreview}
                alt={photo.caption || 'Car photo'}
                className="w-full h-24 object-cover rounded-lg"
                loading="lazy"
              />
              {canEdit && (
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="h-8 w-8 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar foto?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta acción no se puede deshacer. La foto será eliminada permanentemente.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeletePhoto(photo.id, photo.storage_path, photo.thumbnail_path || undefined)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Eliminar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6">
          <ImageIcon className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">Sin fotos</p>
        </div>
      )}

      {/* Add Photos Button */}
      {canEdit && photos.length < MAX_PHOTOS && (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Agregar fotos ({photos.length}/{MAX_PHOTOS})
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Agregar fotos del auto</DialogTitle>
              <DialogDescription>
                Selecciona hasta {MAX_PHOTOS - photos.length} fotos para agregar a tu {carMake} {carModel}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <Input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                disabled={uploading}
              />
              
              {selectedFiles && (
                <div className="flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  <span className="text-sm">{selectedFiles.length} archivo(s) seleccionado(s)</span>
                </div>
              )}
              
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setDialogOpen(false);
                    setSelectedFiles(null);
                  }}
                  disabled={uploading}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleUpload}
                  disabled={!selectedFiles || selectedFiles.length === 0 || uploading}
                >
                  {uploading ? 'Subiendo...' : 'Subir fotos'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {canEdit && photos.length >= MAX_PHOTOS && (
        <Badge variant="secondary" className="w-full justify-center">
          Máximo de fotos alcanzado ({MAX_PHOTOS}/{MAX_PHOTOS})
        </Badge>
      )}
    </div>
  );
}