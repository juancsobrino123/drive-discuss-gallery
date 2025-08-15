-- Drop the problematic SECURITY DEFINER views
DROP VIEW IF EXISTS public.blog_posts_safe;
DROP VIEW IF EXISTS public.events_safe;
DROP VIEW IF EXISTS public.photos_safe;
DROP VIEW IF EXISTS public.comments_safe;

-- Instead, update the existing get_masked_author_info function to be more comprehensive
CREATE OR REPLACE FUNCTION public.get_user_display_info(target_user_id uuid)
RETURNS TABLE(user_id uuid, username text, avatar_url text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  -- Return user display info only if user is authenticated and can see author info
  SELECT 
    CASE 
      WHEN can_see_author_info(target_user_id) THEN target_user_id
      ELSE NULL
    END as user_id,
    CASE 
      WHEN can_see_author_info(target_user_id) THEN p.username
      ELSE 'Usuario Anónimo'
    END as username,
    CASE 
      WHEN can_see_author_info(target_user_id) THEN p.avatar_url
      ELSE NULL
    END as avatar_url
  FROM public.profiles p
  WHERE p.id = target_user_id
  UNION ALL
  SELECT NULL, 'Usuario Anónimo', NULL
  WHERE NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = target_user_id)
  LIMIT 1;
$function$;