import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { X, Plus } from "lucide-react";

interface UserCar {
  id: string;
  make: string;
  model: string;
  year: number | null;
}

interface PhotoUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  onUploadComplete: () => void;
}

const PhotoUploadDialog = ({ open, onOpenChange, eventId, onUploadComplete }: PhotoUploadDialogProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [files, setFiles] = useState<FileList | null>(null);
  const [userCars, setUserCars] = useState<UserCar[]>([]);
  const [selectedCarId, setSelectedCarId] = useState<string>("");
  const [caption, setCaption] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [specs, setSpecs] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);

  // Load user's cars
  useEffect(() => {
    if (!user) return;
    
    const loadUserCars = async () => {
      try {
        const { data, error } = await supabase
          .from('user_cars')
          .select('id, make, model, year')
          .eq('user_id', user.id);
        
        if (error) throw error;
        setUserCars(data || []);
      } catch (error) {
        console.error('Error loading user cars:', error);
      }
    };

    loadUserCars();
  }, [user]);

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const addSpec = () => {
    const key = prompt("Nombre de la especificación:");
    const value = prompt("Valor:");
    if (key && value) {
      setSpecs({ ...specs, [key]: value });
    }
  };

  const removeSpec = (key: string) => {
    const newSpecs = { ...specs };
    delete newSpecs[key];
    setSpecs(newSpecs);
  };

  const handleUpload = async () => {
    if (!files || files.length === 0 || !user) return;
    
    try {
      setUploading(true);
      
      for (const file of Array.from(files)) {
        const basePath = `${user.id}/${eventId}/${Date.now()}_${file.name}`;
        
        // Upload to gallery
        const { error: upErr } = await supabase.storage
          .from("gallery")
          .upload(basePath, file, { upsert: false });
        if (upErr) throw upErr;
        
        // Upload thumbnail
        const { error: thErr } = await supabase.storage
          .from("gallery-thumbs")
          .upload(basePath, file, { upsert: false });
        if (thErr) {
          console.warn("Thumbnail upload failed", thErr);
        }
        
        // Insert photo record
        const { error: insErr } = await supabase.from("photos").insert({
          event_id: eventId,
          storage_path: basePath,
          thumbnail_path: basePath,
          caption: caption || null,
          uploaded_by: user.id,
          user_car_id: selectedCarId || null,
          specs: Object.keys(specs).length > 0 ? specs : {},
          tags: tags,
          likes_count: 0,
          favorites_count: 0,
        });
        if (insErr) throw insErr;
      }
      
      toast({ description: "Fotos subidas exitosamente" });
      onUploadComplete();
      onOpenChange(false);
      
      // Reset form
      setFiles(null);
      setSelectedCarId("");
      setCaption("");
      setTags([]);
      setSpecs({});
      
    } catch (error: any) {
      console.error('Error uploading photos:', error);
      toast({ 
        description: error.message || "Error al subir fotos", 
        variant: "destructive" 
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Subir Fotos</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* File Selection */}
          <div>
            <Label htmlFor="files">Seleccionar Fotos</Label>
            <Input
              id="files"
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => setFiles(e.target.files)}
            />
          </div>

          {/* Car Selection */}
          <div>
            <Label>Auto Relacionado (Opcional)</Label>
            <Select value={selectedCarId} onValueChange={setSelectedCarId}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar auto" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Sin auto específico</SelectItem>
                {userCars.map((car) => (
                  <SelectItem key={car.id} value={car.id}>
                    {car.make} {car.model} {car.year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Caption */}
          <div>
            <Label htmlFor="caption">Descripción</Label>
            <Textarea
              id="caption"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Descripción de las fotos..."
              rows={3}
            />
          </div>

          {/* Tags */}
          <div>
            <Label>Etiquetas</Label>
            <div className="flex gap-2 mb-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Agregar etiqueta"
                onKeyPress={(e) => e.key === 'Enter' && addTag()}
              />
              <Button type="button" variant="outline" onClick={addTag}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-1">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="cursor-pointer">
                  {tag}
                  <X 
                    className="w-3 h-3 ml-1" 
                    onClick={() => removeTag(tag)}
                  />
                </Badge>
              ))}
            </div>
          </div>

          {/* Specs */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Especificaciones</Label>
              <Button type="button" variant="outline" size="sm" onClick={addSpec}>
                <Plus className="w-4 h-4 mr-1" />
                Agregar
              </Button>
            </div>
            <div className="space-y-2">
              {Object.entries(specs).map(([key, value]) => (
                <div key={key} className="flex items-center gap-2">
                  <Badge variant="outline" className="cursor-pointer">
                    {key}: {value}
                    <X 
                      className="w-3 h-3 ml-1" 
                      onClick={() => removeSpec(key)}
                    />
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Upload Button */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleUpload} 
              disabled={!files || files.length === 0 || uploading}
            >
              {uploading ? "Subiendo..." : "Subir Fotos"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PhotoUploadDialog;