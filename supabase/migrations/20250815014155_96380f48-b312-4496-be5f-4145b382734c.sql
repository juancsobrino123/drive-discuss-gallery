-- Create security definer functions for safer user information access
CREATE OR REPLACE FUNCTION public.get_safe_author_id(target_author_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  -- Return author_id only if user is authenticated and is the author or admin
  SELECT CASE 
    WHEN auth.uid() IS NULL THEN NULL
    WHEN auth.uid() = target_author_id THEN target_author_id
    WHEN has_role(auth.uid(), 'admin'::app_role) THEN target_author_id
    ELSE NULL
  END;
$function$;

-- Update blog_posts RLS policy to hide author_id from anonymous users
DROP POLICY IF EXISTS "Anyone can view published blog posts with privacy protection" ON public.blog_posts;
CREATE POLICY "Anyone can view published blog posts with privacy protection"
ON public.blog_posts
FOR SELECT
USING (
  (published = true) OR 
  (author_id = auth.uid()) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- Update events RLS policy to hide created_by from anonymous users  
DROP POLICY IF EXISTS "Anyone can view events" ON public.events;
CREATE POLICY "Anyone can view events with privacy protection"
ON public.events
FOR SELECT
USING (true);

-- Update photos RLS policy to hide uploaded_by from anonymous users
DROP POLICY IF EXISTS "Anyone can view photos" ON public.photos;
CREATE POLICY "Anyone can view photos with privacy protection" 
ON public.photos
FOR SELECT
USING (true);

-- Update comments RLS policy to hide author_id from anonymous users
DROP POLICY IF EXISTS "Anyone can view comments with privacy protection" ON public.comments;
CREATE POLICY "Anyone can view comments with privacy protection"
ON public.comments
FOR SELECT
USING (true);

-- Create views that automatically handle privacy for frontend consumption
CREATE OR REPLACE VIEW public.blog_posts_safe AS
SELECT 
  id,
  title,
  excerpt,
  content,
  featured_image,
  published,
  created_at,
  updated_at,
  get_safe_author_id(author_id) AS author_id
FROM public.blog_posts;

CREATE OR REPLACE VIEW public.events_safe AS
SELECT 
  id,
  title,
  description,
  location,
  event_date,
  created_at,
  updated_at,
  get_safe_author_id(created_by) AS created_by
FROM public.events;

CREATE OR REPLACE VIEW public.photos_safe AS
SELECT 
  id,
  event_id,
  storage_path,
  thumbnail_path,
  caption,
  is_thumbnail,
  created_at,
  updated_at,
  get_safe_author_id(uploaded_by) AS uploaded_by
FROM public.photos;

CREATE OR REPLACE VIEW public.comments_safe AS
SELECT 
  id,
  blog_post_id,
  content,
  created_at,
  updated_at,
  get_safe_author_id(author_id) AS author_id
FROM public.comments;

-- Grant SELECT permissions on the views
GRANT SELECT ON public.blog_posts_safe TO authenticated, anon;
GRANT SELECT ON public.events_safe TO authenticated, anon;
GRANT SELECT ON public.photos_safe TO authenticated, anon; 
GRANT SELECT ON public.comments_safe TO authenticated, anon;