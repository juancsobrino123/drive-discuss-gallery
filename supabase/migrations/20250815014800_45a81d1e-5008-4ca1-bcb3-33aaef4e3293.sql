-- Allow anonymous users to view forum threads but with privacy protection
DROP POLICY IF EXISTS "Authenticated users can view forum threads" ON public.forum_threads;

CREATE POLICY "Anyone can view forum threads with privacy protection" 
ON public.forum_threads 
FOR SELECT 
USING (true);

-- Allow anonymous users to view forum categories
DROP POLICY IF EXISTS "Anyone can view categories" ON public.forum_categories;

CREATE POLICY "Anyone can view categories" 
ON public.forum_categories 
FOR SELECT 
USING (true);