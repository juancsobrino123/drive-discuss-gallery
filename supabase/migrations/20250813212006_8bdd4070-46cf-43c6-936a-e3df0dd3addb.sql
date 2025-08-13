-- Fix Security Issues: Remove security definer views and fix function search paths
-- This migration addresses the security linter warnings

-- 1. Drop the problematic views first
DROP VIEW IF EXISTS public.blog_posts_public;
DROP VIEW IF EXISTS public.comments_public;
DROP VIEW IF EXISTS public.events_public;
DROP VIEW IF EXISTS public.forum_threads_public;
DROP VIEW IF EXISTS public.forum_replies_public;
DROP VIEW IF EXISTS public.photos_public;

-- 2. Fix function search paths to be secure
DROP FUNCTION IF EXISTS public.get_masked_author_info(uuid, uuid);
DROP FUNCTION IF EXISTS public.get_masked_storage_path(text, uuid);

CREATE OR REPLACE FUNCTION public.get_masked_author_info(
  user_id_field uuid,
  current_user_id uuid DEFAULT auth.uid()
)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
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

CREATE OR REPLACE FUNCTION public.get_masked_storage_path(
  storage_path text,
  current_user_id uuid DEFAULT auth.uid()
)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
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

-- 3. Instead of views, we'll update the application code to use the masking functions
-- The RLS policies remain the same for access control, but data masking will be handled in queries

-- 4. Create a secure function to check if user can see author info
CREATE OR REPLACE FUNCTION public.can_see_author_info(target_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT CASE 
    WHEN auth.uid() IS NULL THEN false
    WHEN auth.uid() = target_user_id THEN true
    WHEN has_role(auth.uid(), 'admin'::app_role) THEN true
    ELSE false
  END;
$$;

-- 5. Create a secure function to check if user can see storage paths
CREATE OR REPLACE FUNCTION public.can_see_storage_info()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT CASE 
    WHEN auth.uid() IS NULL THEN false
    WHEN has_role(auth.uid(), 'copiloto'::app_role) THEN true
    WHEN has_role(auth.uid(), 'admin'::app_role) THEN true
    ELSE false
  END;
$$;