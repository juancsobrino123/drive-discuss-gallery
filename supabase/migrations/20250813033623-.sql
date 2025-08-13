-- Add is_thumbnail to photos and enforce max 4 per event
ALTER TABLE public.photos
ADD COLUMN IF NOT EXISTS is_thumbnail boolean NOT NULL DEFAULT false;

-- Helpful index for preview queries
CREATE INDEX IF NOT EXISTS idx_photos_event_thumb ON public.photos (event_id, is_thumbnail, created_at);

-- Validation function to limit to 4 thumbnails per event
CREATE OR REPLACE FUNCTION public.ensure_max_four_thumbs()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Only enforce when toggling from false to true or on insert with true
  IF TG_OP = 'INSERT' THEN
    IF NEW.is_thumbnail IS TRUE THEN
      IF (SELECT count(*) FROM public.photos WHERE event_id = NEW.event_id AND is_thumbnail) >= 4 THEN
        RAISE EXCEPTION 'No puedes seleccionar más de 4 thumbnails para este evento';
      END IF;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF COALESCE(OLD.is_thumbnail, false) = false AND NEW.is_thumbnail IS TRUE THEN
      IF (SELECT count(*) FROM public.photos WHERE event_id = NEW.event_id AND is_thumbnail) >= 4 THEN
        RAISE EXCEPTION 'No puedes seleccionar más de 4 thumbnails para este evento';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger to call the function
DROP TRIGGER IF EXISTS photos_limit_thumbs ON public.photos;
CREATE TRIGGER photos_limit_thumbs
BEFORE INSERT OR UPDATE ON public.photos
FOR EACH ROW
EXECUTE FUNCTION public.ensure_max_four_thumbs();