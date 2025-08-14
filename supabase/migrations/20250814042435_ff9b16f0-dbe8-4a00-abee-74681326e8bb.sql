-- Update RLS policies to allow public viewing of events and photos

-- Drop existing events policies that require authentication
DROP POLICY IF EXISTS "Public can view events with privacy protection" ON public.events;

-- Create new policy for public viewing of events
CREATE POLICY "Anyone can view events" 
ON public.events 
FOR SELECT 
USING (true);

-- Drop existing photos policies that require authentication  
DROP POLICY IF EXISTS "Authenticated users can view photos" ON public.photos;

-- Create new policy for public viewing of photos
CREATE POLICY "Anyone can view photos" 
ON public.photos 
FOR SELECT 
USING (true);