import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Heart, Star, Download, Pencil, Trash2, Car, Tags } from "lucide-react";

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

interface PhotoCardProps {
  photo: PhotoItem;
  imageUrl: string;
  userCar?: UserCar;
  isLiked?: boolean;
  isFavorited?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  canDownload?: boolean;
  onLike?: (photoId: string) => void;
  onFavorite?: (photoId: string) => void;
  onDownload?: (photo: PhotoItem) => void;
  onEdit?: (photo: PhotoItem) => void;
  onDelete?: (photo: PhotoItem) => void;
  onToggleThumbnail?: (photo: PhotoItem) => void;
}

const PhotoCard = ({
  photo,
  imageUrl,
  userCar,
  isLiked = false,
  isFavorited = false,
  canEdit = false,
  canDelete = false,
  canDownload = false,
  onLike,
  onFavorite,
  onDownload,
  onEdit,
  onDelete,
  onToggleThumbnail
}: PhotoCardProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleLike = async () => {
    if (!user || !onLike) return;
    setActionLoading('like');
    try {
      if (isLiked) {
        const { error } = await supabase
          .from('photo_likes')
          .delete()
          .eq('photo_id', photo.id)
          .eq('user_id', user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('photo_likes')
          .insert({ photo_id: photo.id, user_id: user.id });
        if (error) throw error;
      }
      onLike(photo.id);
    } catch (error: any) {
      console.error('Error toggling like:', error);
      toast({ description: 'Error al dar like', variant: 'destructive' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleFavorite = async () => {
    if (!user || !onFavorite) return;
    setActionLoading('favorite');
    try {
      if (isFavorited) {
        const { error } = await supabase
          .from('photo_favorites')
          .delete()
          .eq('photo_id', photo.id)
          .eq('user_id', user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('photo_favorites')
          .insert({ photo_id: photo.id, user_id: user.id });
        if (error) throw error;
      }
      onFavorite(photo.id);
    } catch (error: any) {
      console.error('Error toggling favorite:', error);
      toast({ description: 'Error al agregar a favoritos', variant: 'destructive' });
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <Card className="overflow-hidden group hover:shadow-royal transition-all duration-300">
      <div className="relative">
        <img
          src={imageUrl}
          alt={photo.caption || 'Foto del evento'}
          className="w-full h-48 md:h-64 object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        {photo.is_thumbnail && (
          <Badge className="absolute top-2 left-2 bg-primary/90 text-primary-foreground">
            <Star className="w-3 h-3 mr-1" />
            Destacada
          </Badge>
        )}
      </div>

      <div className="p-4">
        {/* Car Info */}
        {userCar && (
          <div className="flex items-center text-sm text-muted-foreground mb-2">
            <Car className="w-4 h-4 mr-2" />
            <span>{userCar.make} {userCar.model} {userCar.year}</span>
          </div>
        )}

        {/* Caption */}
        {photo.caption && (
          <p className="text-sm text-foreground mb-3 line-clamp-2">{photo.caption}</p>
        )}

        {/* Tags */}
        {photo.tags && photo.tags.length > 0 && (
          <div className="flex items-center gap-1 mb-3 flex-wrap">
            <Tags className="w-3 h-3 text-muted-foreground" />
            {photo.tags.slice(0, 3).map((tag, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {photo.tags.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{photo.tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Specs */}
        {photo.specs && Object.keys(photo.specs).length > 0 && (
          <div className="text-xs text-muted-foreground mb-3">
            <span className="font-medium">Specs:</span>
            {Object.entries(photo.specs).slice(0, 2).map(([key, value]) => (
              <span key={key} className="ml-2">{key}: {String(value)}</span>
            ))}
          </div>
        )}

        {/* Interactions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {user && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLike}
                  disabled={actionLoading === 'like'}
                  className={isLiked ? 'text-red-500 hover:text-red-600' : ''}
                >
                  <Heart className={`w-4 h-4 mr-1 ${isLiked ? 'fill-current' : ''}`} />
                  {photo.likes_count}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleFavorite}
                  disabled={actionLoading === 'favorite'}
                  className={isFavorited ? 'text-yellow-500 hover:text-yellow-600' : ''}
                >
                  <Star className={`w-4 h-4 mr-1 ${isFavorited ? 'fill-current' : ''}`} />
                  {photo.favorites_count}
                </Button>
              </>
            )}
          </div>

          <div className="flex items-center gap-1">
            {canDownload && onDownload && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDownload(photo)}
                title="Descargar"
              >
                <Download className="w-4 h-4" />
              </Button>
            )}
            {canEdit && onEdit && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit(photo)}
                title="Editar"
              >
                <Pencil className="w-4 h-4" />
              </Button>
            )}
            {onToggleThumbnail && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onToggleThumbnail(photo)}
                title="Marcar como destacada"
              >
                <Star className={`w-4 h-4 ${photo.is_thumbnail ? 'fill-current text-yellow-500' : ''}`} />
              </Button>
            )}
            {canDelete && onDelete && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(photo)}
                title="Eliminar"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default PhotoCard;