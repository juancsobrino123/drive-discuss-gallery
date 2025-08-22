import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Camera, Upload } from "lucide-react";

interface CarPhotoUploadProps {
  carId: string;
  carMake: string;
  carModel: string;
  carYear?: number;
  carDescription?: string;
  onUploadComplete?: () => void;
}

export default function CarPhotoUpload({ 
  carId, 
  carMake, 
  carModel, 
  carYear, 
  carDescription, 
  onUploadComplete 
}: CarPhotoUploadProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      setSelectedFiles(Array.from(files));
    }
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast({ description: "Selecciona al menos una foto", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error("Usuario no autenticado");

      for (const file of selectedFiles) {
        // Upload full image
        const fileName = `${user.id}/cars/${carId}/${Date.now()}_${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from("gallery")
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        // Upload thumbnail
        const { error: thumbError } = await supabase.storage
          .from("gallery-thumbs")
          .upload(fileName, file);

        if (thumbError) console.warn("Thumbnail upload failed:", thumbError);

        // Create automatic caption from car data
        const autoCaption = `${carMake} ${carModel} ${carYear ? carYear : ''}${carDescription ? ' - ' + carDescription : ''}`.trim();

        // Insert photo record (car showroom photos with null event_id)
        const { error: insertError } = await supabase.from("photos").insert({
          event_id: null, // Car photos don't belong to events
          storage_path: fileName,
          thumbnail_path: fileName,
          caption: autoCaption,
          uploaded_by: user.id,
          user_car_id: carId,
          tags: [], // Empty tags array
          specs: {}, // Empty specs object
        });

        if (insertError) throw insertError;
      }

      toast({ description: "Fotos subidas exitosamente" });
      setIsOpen(false);
      resetForm();
      onUploadComplete?.();
    } catch (error: any) {
      console.error("Error uploading photos:", error);
      toast({ description: error.message || "Error al subir fotos", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setSelectedFiles([]);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Camera className="w-4 h-4 mr-2" />
          Subir fotos
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Subir fotos de {carMake} {carModel} {carYear}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="photos">Seleccionar fotos</Label>
            <Input
              id="photos"
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              className="mt-1"
            />
            {selectedFiles.length > 0 && (
              <p className="text-sm text-muted-foreground mt-2">
                {selectedFiles.length} archivo(s) seleccionado(s)
              </p>
            )}
          </div>

          <div className="text-sm text-muted-foreground">
            Las fotos se subirán automáticamente con la información de tu auto: {carMake} {carModel} {carYear}
            {carDescription && ` - ${carDescription}`}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpload} disabled={uploading || selectedFiles.length === 0}>
              {uploading ? "Subiendo..." : "Subir fotos"}
              <Upload className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}