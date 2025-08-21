import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Camera, Upload, X, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CarPhotoUploadProps {
  carId: string;
  carMake: string;
  carModel: string;
  carYear?: number;
  onUploadComplete?: () => void;
}

export default function CarPhotoUpload({ carId, carMake, carModel, carYear, onUploadComplete }: CarPhotoUploadProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [caption, setCaption] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [specs, setSpecs] = useState<Array<{ key: string; value: string }>>([]);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      setSelectedFiles(Array.from(files));
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const addSpec = () => {
    setSpecs([...specs, { key: "", value: "" }]);
  };

  const updateSpec = (index: number, key: string, value: string) => {
    const newSpecs = [...specs];
    newSpecs[index] = { key, value };
    setSpecs(newSpecs);
  };

  const removeSpec = (index: number) => {
    setSpecs(specs.filter((_, i) => i !== index));
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

        // Convert specs to object
        const specsObject = specs.reduce((acc, spec) => {
          if (spec.key && spec.value) {
            acc[spec.key] = spec.value;
          }
          return acc;
        }, {} as Record<string, string>);

        // Insert photo record without event_id (car showroom photos)
        const { error: insertError } = await supabase.from("photos").insert({
          event_id: '00000000-0000-0000-0000-000000000000', // Special UUID for showroom photos
          storage_path: fileName,
          thumbnail_path: fileName,
          caption: caption || null,
          uploaded_by: user.id,
          user_car_id: carId,
          tags: tags,
          specs: specsObject,
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
    setCaption("");
    setTags([]);
    setTagInput("");
    setSpecs([]);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Camera className="w-4 h-4 mr-2" />
          Subir fotos
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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

          <div>
            <Label htmlFor="caption">Descripción</Label>
            <Textarea
              id="caption"
              placeholder="Describe tu auto o la foto..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label>Tags</Label>
            <div className="flex gap-2 mt-1">
              <Input
                placeholder="Agregar tag..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
              />
              <Button type="button" variant="outline" onClick={addTag}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
                    {tag}
                    <X className="w-3 h-3 ml-1" />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="flex justify-between items-center">
              <Label>Especificaciones</Label>
              <Button type="button" variant="outline" size="sm" onClick={addSpec}>
                <Plus className="w-4 h-4 mr-1" />
                Agregar spec
              </Button>
            </div>
            {specs.map((spec, index) => (
              <div key={index} className="flex gap-2 mt-2">
                <Input
                  placeholder="Nombre (ej: Motor)"
                  value={spec.key}
                  onChange={(e) => updateSpec(index, e.target.value, spec.value)}
                />
                <Input
                  placeholder="Valor (ej: V8 5.0L)"
                  value={spec.value}
                  onChange={(e) => updateSpec(index, spec.key, e.target.value)}
                />
                <Button type="button" variant="outline" size="sm" onClick={() => removeSpec(index)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
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