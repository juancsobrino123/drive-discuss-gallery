-- Update photo viewing policy to allow non-authenticated users to see event photos
DROP POLICY IF EXISTS "Authenticated users can view photos" ON photos;

CREATE POLICY "Users can view photos based on context" 
ON photos 
FOR SELECT 
USING (
  -- Event photos are visible to everyone (including non-authenticated users)
  (event_id IS NOT NULL) OR 
  -- For other photos, require authentication
  (
    (auth.uid() IS NOT NULL) AND 
    (
      (uploaded_by = auth.uid()) OR 
      has_role(auth.uid(), 'admin'::app_role) OR 
      (
        (event_id IS NULL) AND 
        (user_car_id IS NOT NULL) AND 
        (EXISTS (
          SELECT 1
          FROM (user_cars uc JOIN profiles p ON ((uc.user_id = p.id)))
          WHERE ((uc.id = photos.user_car_id) AND (((p.privacy_settings ->> 'show_cars'::text))::boolean = true))
        ))
      )
    )
  )
);