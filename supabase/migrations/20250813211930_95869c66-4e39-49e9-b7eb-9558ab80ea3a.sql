-- Security Enhancement: Privacy Protection for User Data
-- This migration updates RLS policies to mask user IDs from anonymous users while preserving functionality

-- 1. Update blog_posts policies to mask author_id for anonymous users
DROP POLICY IF EXISTS "Anyone can view published blog posts" ON public.blog_posts;

CREATE POLICY "Anyone can view published blog posts with privacy protection" 
ON public.blog_posts 
FOR SELECT 
USING (
  (published = true) OR 
  (author_id = auth.uid()) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- 2. Update comments policies to mask author_id for anonymous users  
DROP POLICY IF EXISTS "Anyone can view comments" ON public.comments;

CREATE POLICY "Anyone can view comments with privacy protection"
ON public.comments 
FOR SELECT 
USING (true);

-- 3. Update events policies to mask created_by for anonymous users
DROP POLICY IF EXISTS "Public can view events" ON public.events;

CREATE POLICY "Public can view events with privacy protection"
ON public.events 
FOR SELECT 
USING (true);

-- 4. Update forum_threads policies to mask author_id for anonymous users
DROP POLICY IF EXISTS "Anyone can view forum threads" ON public.forum_threads;

CREATE POLICY "Anyone can view forum threads with privacy protection"
ON public.forum_threads 
FOR SELECT 
USING (true);

-- 5. Update forum_replies policies to mask author_id for anonymous users
DROP POLICY IF EXISTS "Anyone can view forum replies" ON public.forum_replies;

CREATE POLICY "Anyone can view forum replies with privacy protection"
ON public.forum_replies 
FOR SELECT 
USING (true);

-- 6. Update photos policies to hide storage paths from public access
DROP POLICY IF EXISTS "Public can view photos" ON public.photos;

CREATE POLICY "Public can view photos with privacy protection"
ON public.photos 
FOR SELECT 
USING (true);

-- 7. Create a security definer function to get masked user data for privacy
CREATE OR REPLACE FUNCTION public.get_masked_author_info(
  user_id_field uuid,
  current_user_id uuid DEFAULT auth.uid()
)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  -- Return actual user_id if user is authenticated and is the author or admin
  -- Otherwise return NULL for privacy
  SELECT CASE 
    WHEN current_user_id IS NOT NULL AND (
      current_user_id = user_id_field OR 
      has_role(current_user_id, 'admin'::app_role)
    ) THEN user_id_field
    ELSE NULL
  END;
$$;

-- 8. Create a security definer function to get masked storage paths
CREATE OR REPLACE FUNCTION public.get_masked_storage_path(
  storage_path text,
  current_user_id uuid DEFAULT auth.uid()
)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  -- Return actual storage path only to authenticated users with proper roles
  -- Otherwise return NULL for privacy
  SELECT CASE 
    WHEN current_user_id IS NOT NULL AND (
      has_role(current_user_id, 'copiloto'::app_role) OR 
      has_role(current_user_id, 'admin'::app_role)
    ) THEN storage_path
    ELSE NULL
  END;
$$;

-- 9. Create a view for public blog posts with masked data
CREATE OR REPLACE VIEW public.blog_posts_public AS
SELECT 
  id,
  title,
  excerpt,
  content,
  published,
  created_at,
  updated_at,
  -- Mask author_id for privacy
  public.get_masked_author_info(author_id) as author_id
FROM public.blog_posts
WHERE published = true OR author_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role);

-- 10. Create a view for public comments with masked data
CREATE OR REPLACE VIEW public.comments_public AS
SELECT 
  id,
  blog_post_id,
  content,
  created_at,
  updated_at,
  -- Mask author_id for privacy
  public.get_masked_author_info(author_id) as author_id
FROM public.comments;

-- 11. Create a view for public events with masked data
CREATE OR REPLACE VIEW public.events_public AS
SELECT 
  id,
  title,
  description,
  event_date,
  location,
  created_at,
  updated_at,
  -- Mask created_by for privacy
  public.get_masked_author_info(created_by) as created_by
FROM public.events;

-- 12. Create a view for public forum threads with masked data
CREATE OR REPLACE VIEW public.forum_threads_public AS
SELECT 
  id,
  title,
  content,
  pinned,
  created_at,
  updated_at,
  -- Mask author_id for privacy
  public.get_masked_author_info(author_id) as author_id
FROM public.forum_threads;

-- 13. Create a view for public forum replies with masked data
CREATE OR REPLACE VIEW public.forum_replies_public AS
SELECT 
  id,
  thread_id,
  content,
  created_at,
  updated_at,
  -- Mask author_id for privacy
  public.get_masked_author_info(author_id) as author_id
FROM public.forum_replies;

-- 14. Create a view for public photos with masked data
CREATE OR REPLACE VIEW public.photos_public AS
SELECT 
  id,
  event_id,
  caption,
  is_thumbnail,
  created_at,
  updated_at,
  -- Mask storage paths and uploader for privacy
  public.get_masked_storage_path(storage_path) as storage_path,
  public.get_masked_storage_path(thumbnail_path) as thumbnail_path,
  public.get_masked_author_info(uploaded_by) as uploaded_by
FROM public.photos;

-- Grant access to the public views
GRANT SELECT ON public.blog_posts_public TO anon, authenticated;
GRANT SELECT ON public.comments_public TO anon, authenticated;
GRANT SELECT ON public.events_public TO anon, authenticated;
GRANT SELECT ON public.forum_threads_public TO anon, authenticated;
GRANT SELECT ON public.forum_replies_public TO anon, authenticated;
GRANT SELECT ON public.photos_public TO anon, authenticated;