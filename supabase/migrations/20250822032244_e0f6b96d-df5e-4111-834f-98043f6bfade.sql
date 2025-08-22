-- Drop the foreign key constraint for event_id in photos table to allow car photos
ALTER TABLE public.photos DROP CONSTRAINT IF EXISTS photos_event_id_fkey;

-- Make event_id nullable for car photos (keeping it required through RLS policies for event photos)
ALTER TABLE public.photos ALTER COLUMN event_id DROP NOT NULL;