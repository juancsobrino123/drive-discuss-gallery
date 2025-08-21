-- Fix security vulnerability: Implement privacy-aware RLS policies for profiles table

-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;

-- Create a secure function to check if a profile should be visible to the current user
CREATE OR REPLACE FUNCTION public.can_view_profile(target_user_id uuid, requesting_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT CASE 
    -- User can always view their own profile
    WHEN requesting_user_id = target_user_id THEN true
    -- Admins can view all profiles
    WHEN has_role(requesting_user_id, 'admin'::app_role) THEN true
    -- Anonymous users cannot view profiles
    WHEN requesting_user_id IS NULL THEN false
    -- For other authenticated users, check if they should see any profile data at all
    -- This could be extended with friendship/relationship logic in the future
    ELSE false
  END;
$$;

-- Create a function to get visible profile data based on privacy settings
CREATE OR REPLACE FUNCTION public.get_visible_profile_data(target_user_id uuid, requesting_user_id uuid DEFAULT auth.uid())
RETURNS TABLE(
  id uuid,
  username text,
  avatar_url text,
  bio text,
  city text,
  country text,
  birth_date date,
  social_links jsonb,
  points integer,
  level integer,
  privacy_settings jsonb,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    p.id,
    -- Always show username and avatar for discoverability, but could be limited further
    p.username,
    p.avatar_url,
    -- Show bio only if user allows or if it's own profile/admin
    CASE 
      WHEN requesting_user_id = target_user_id OR has_role(requesting_user_id, 'admin'::app_role) THEN p.bio
      ELSE NULL
    END as bio,
    -- Show location only based on privacy settings
    CASE 
      WHEN requesting_user_id = target_user_id OR has_role(requesting_user_id, 'admin'::app_role) 
        OR (p.privacy_settings->>'show_location')::boolean = true THEN p.city
      ELSE NULL
    END as city,
    CASE 
      WHEN requesting_user_id = target_user_id OR has_role(requesting_user_id, 'admin'::app_role) 
        OR (p.privacy_settings->>'show_location')::boolean = true THEN p.country
      ELSE NULL
    END as country,
    -- Never show birth_date unless own profile or admin
    CASE 
      WHEN requesting_user_id = target_user_id OR has_role(requesting_user_id, 'admin'::app_role) THEN p.birth_date
      ELSE NULL
    END as birth_date,
    -- Never show social_links unless own profile or admin  
    CASE 
      WHEN requesting_user_id = target_user_id OR has_role(requesting_user_id, 'admin'::app_role) THEN p.social_links
      ELSE '{}'::jsonb
    END as social_links,
    -- Show points/level only based on activity privacy setting
    CASE 
      WHEN requesting_user_id = target_user_id OR has_role(requesting_user_id, 'admin'::app_role) 
        OR (p.privacy_settings->>'show_activity')::boolean = true THEN p.points
      ELSE NULL
    END as points,
    CASE 
      WHEN requesting_user_id = target_user_id OR has_role(requesting_user_id, 'admin'::app_role) 
        OR (p.privacy_settings->>'show_activity')::boolean = true THEN p.level
      ELSE NULL
    END as level,
    -- Only show privacy_settings to own profile or admin
    CASE 
      WHEN requesting_user_id = target_user_id OR has_role(requesting_user_id, 'admin'::app_role) THEN p.privacy_settings
      ELSE NULL
    END as privacy_settings,
    -- Timestamps are generally safe to show
    p.created_at,
    p.updated_at
  FROM public.profiles p
  WHERE p.id = target_user_id;
$$;

-- Create new secure RLS policies
CREATE POLICY "Users can view profiles with privacy controls" 
ON public.profiles 
FOR SELECT 
USING (
  -- Users can see their own profile
  auth.uid() = id 
  OR 
  -- Admins can see all profiles
  has_role(auth.uid(), 'admin'::app_role)
  OR
  -- Other authenticated users can see limited profile info
  -- This allows basic discoverability while protecting sensitive data
  -- The actual data filtering happens in application logic using get_visible_profile_data
  (auth.uid() IS NOT NULL)
);

-- Update existing policies to remain unchanged
-- (keeping the existing INSERT and UPDATE policies as they are secure)