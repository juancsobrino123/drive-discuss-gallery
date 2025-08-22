-- Allow authenticated users to upload car photos to storage
CREATE POLICY "Users can upload car photos to gallery" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'gallery' 
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND (storage.foldername(name))[2] = 'cars'
);

CREATE POLICY "Users can upload car thumbnails to gallery-thumbs" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'gallery-thumbs' 
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND (storage.foldername(name))[2] = 'cars'
);

-- Allow users to view their own car photos
CREATE POLICY "Users can view their car photos" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id IN ('gallery', 'gallery-thumbs') 
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND (storage.foldername(name))[2] = 'cars'
);

-- Update photos table policy to allow car photo uploads for all authenticated users
DROP POLICY IF EXISTS "Copiloto/Admin can upload photos" ON public.photos;

CREATE POLICY "Copiloto/Admin can upload event photos" 
ON public.photos 
FOR INSERT 
WITH CHECK (
  (uploaded_by = auth.uid()) 
  AND (
    event_id != '00000000-0000-0000-0000-000000000000' 
    AND (has_role(auth.uid(), 'copiloto'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
  )
);

CREATE POLICY "Authenticated users can upload car photos" 
ON public.photos 
FOR INSERT 
WITH CHECK (
  (uploaded_by = auth.uid()) 
  AND event_id = '00000000-0000-0000-0000-000000000000'
  AND user_car_id IS NOT NULL
);