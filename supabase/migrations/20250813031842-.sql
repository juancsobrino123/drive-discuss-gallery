-- 1) Ensure default role 'general' on signup by extending handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  _display_name text;
BEGIN
  _display_name := coalesce(
    new.raw_user_meta_data ->> 'display_name',
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'name',
    split_part(new.email, '@', 1)
  );

  INSERT INTO public.profiles (id, username, avatar_url)
  VALUES (new.id, nullif(_display_name, ''), new.raw_user_meta_data ->> 'avatar_url')
  ON CONFLICT (id) DO NOTHING;

  -- Assign default role 'general' to every new user
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'general'::public.app_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN new;
END;
$function$;

-- 2) Promote existing user to admin by email
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role
FROM auth.users
WHERE email = 'juancsobrino123@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;