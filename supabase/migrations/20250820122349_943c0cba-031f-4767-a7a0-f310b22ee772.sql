-- Expand photos table with new fields
ALTER TABLE public.photos 
ADD COLUMN user_car_id uuid REFERENCES public.user_cars(id),
ADD COLUMN specs jsonb DEFAULT '{}',
ADD COLUMN tags text[] DEFAULT '{}',
ADD COLUMN likes_count integer DEFAULT 0,
ADD COLUMN favorites_count integer DEFAULT 0;

-- Create photo_likes table for voting system
CREATE TABLE public.photo_likes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  photo_id uuid NOT NULL REFERENCES public.photos(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(photo_id, user_id)
);

-- Enable RLS on photo_likes
ALTER TABLE public.photo_likes ENABLE ROW LEVEL SECURITY;

-- Create photo_favorites table
CREATE TABLE public.photo_favorites (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  photo_id uuid NOT NULL REFERENCES public.photos(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(photo_id, user_id)
);

-- Enable RLS on photo_favorites
ALTER TABLE public.photo_favorites ENABLE ROW LEVEL SECURITY;

-- RLS policies for photo_likes
CREATE POLICY "Authenticated users can view photo likes" 
ON public.photo_likes 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can like photos" 
ON public.photo_likes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own likes" 
ON public.photo_likes 
FOR DELETE 
USING (auth.uid() = user_id);

-- RLS policies for photo_favorites
CREATE POLICY "Authenticated users can view photo favorites" 
ON public.photo_favorites 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can favorite photos" 
ON public.photo_favorites 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own favorites" 
ON public.photo_favorites 
FOR DELETE 
USING (auth.uid() = user_id);

-- Function to update likes count
CREATE OR REPLACE FUNCTION public.update_photo_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.photos 
    SET likes_count = likes_count + 1 
    WHERE id = NEW.photo_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.photos 
    SET likes_count = likes_count - 1 
    WHERE id = OLD.photo_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to update favorites count
CREATE OR REPLACE FUNCTION public.update_photo_favorites_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.photos 
    SET favorites_count = favorites_count + 1 
    WHERE id = NEW.photo_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.photos 
    SET favorites_count = favorites_count - 1 
    WHERE id = OLD.photo_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Triggers for automatic count updates
CREATE TRIGGER update_photo_likes_count_trigger
  AFTER INSERT OR DELETE ON public.photo_likes
  FOR EACH ROW EXECUTE FUNCTION public.update_photo_likes_count();

CREATE TRIGGER update_photo_favorites_count_trigger
  AFTER INSERT OR DELETE ON public.photo_favorites
  FOR EACH ROW EXECUTE FUNCTION public.update_photo_favorites_count();

-- Create indexes for better performance
CREATE INDEX idx_photos_user_car_id ON public.photos(user_car_id);
CREATE INDEX idx_photos_tags ON public.photos USING GIN(tags);
CREATE INDEX idx_photo_likes_photo_id ON public.photo_likes(photo_id);
CREATE INDEX idx_photo_favorites_photo_id ON public.photo_favorites(photo_id);