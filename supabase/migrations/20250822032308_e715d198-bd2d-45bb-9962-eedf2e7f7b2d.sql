-- Update RLS policies to handle nullable event_id for car photos
DROP POLICY IF EXISTS "Copiloto/Admin can upload event photos" ON public.photos;
DROP POLICY IF EXISTS "Authenticated users can upload car photos" ON public.photos;

-- Event photos policy (requires event_id and copiloto/admin role)
CREATE POLICY "Copiloto/Admin can upload event photos" 
ON public.photos 
FOR INSERT 
WITH CHECK (
  uploaded_by = auth.uid() 
  AND event_id IS NOT NULL
  AND (has_role(auth.uid(), 'copiloto'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
);

-- Car photos policy (requires user_car_id and null event_id)
CREATE POLICY "Authenticated users can upload car photos" 
ON public.photos 
FOR INSERT 
WITH CHECK (
  uploaded_by = auth.uid() 
  AND event_id IS NULL
  AND user_car_id IS NOT NULL
);