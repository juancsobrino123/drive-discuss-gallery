-- Security Fix 1: Restrict profile access to require authentication
DROP POLICY IF EXISTS "Users can view profiles with privacy controls" ON public.profiles;

CREATE POLICY "Authenticated users can view profiles with privacy controls" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL AND (
    (auth.uid() = id) OR 
    has_role(auth.uid(), 'admin'::app_role) OR 
    -- Allow viewing basic info only if privacy allows
    (
      (privacy_settings->>'show_location')::boolean = true OR
      (privacy_settings->>'show_activity')::boolean = true OR  
      (privacy_settings->>'show_cars')::boolean = true
    )
  )
);

-- Security Fix 2: Restrict comments to authenticated users only
DROP POLICY IF EXISTS "Anyone can view comments with privacy protection" ON public.comments;

CREATE POLICY "Authenticated users can view comments" 
ON public.comments 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Security Fix 3: Restrict forum threads to authenticated users only  
DROP POLICY IF EXISTS "Anyone can view forum threads with privacy protection" ON public.forum_threads;

CREATE POLICY "Authenticated users can view forum threads" 
ON public.forum_threads 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Security Fix 4: Ensure role change logs are admin-only (already correct but reinforcing)
DROP POLICY IF EXISTS "Admins can view role change logs" ON public.role_change_log;

CREATE POLICY "Only admins can view role change logs" 
ON public.role_change_log 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Security Fix 5: Strengthen photo access policies
DROP POLICY IF EXISTS "Anyone can view photos with privacy protection" ON public.photos;

CREATE POLICY "Authenticated users can view photos" 
ON public.photos 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL AND (
    -- Users can view their own photos
    uploaded_by = auth.uid() OR
    -- Admins can view all photos
    has_role(auth.uid(), 'admin'::app_role) OR
    -- Event photos are visible to all authenticated users
    event_id IS NOT NULL OR
    -- Car photos respect privacy settings
    (
      event_id IS NULL AND 
      user_car_id IS NOT NULL AND
      EXISTS (
        SELECT 1 FROM public.user_cars uc
        JOIN public.profiles p ON uc.user_id = p.id
        WHERE uc.id = photos.user_car_id
        AND (p.privacy_settings->>'show_cars')::boolean = true
      )
    )
  )
);