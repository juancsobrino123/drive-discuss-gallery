-- Simplify the get_user_display_info function to show usernames to all authenticated users
CREATE OR REPLACE FUNCTION public.get_user_display_info(target_user_id uuid)
RETURNS TABLE(user_id uuid, username text, avatar_url text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  -- Return user display info to authenticated users, hide from anonymous
  SELECT 
    CASE 
      WHEN auth.uid() IS NOT NULL THEN target_user_id
      ELSE NULL
    END as user_id,
    CASE 
      WHEN auth.uid() IS NOT NULL THEN COALESCE(p.username, 'Usuario')
      ELSE 'Usuario Anónimo'
    END as username,
    CASE 
      WHEN auth.uid() IS NOT NULL THEN p.avatar_url
      ELSE NULL
    END as avatar_url
  FROM public.profiles p
  WHERE p.id = target_user_id
  UNION ALL
  SELECT 
    NULL, 
    CASE 
      WHEN auth.uid() IS NOT NULL THEN 'Usuario'
      ELSE 'Usuario Anónimo'
    END, 
    NULL
  WHERE NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = target_user_id)
  LIMIT 1;
$function$;