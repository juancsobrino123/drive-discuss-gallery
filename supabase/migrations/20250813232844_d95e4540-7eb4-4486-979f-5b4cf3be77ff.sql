-- Fix audit logging to handle bootstrap scenario
CREATE OR REPLACE FUNCTION public.log_role_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.role_change_log (user_id, role, action, performed_by)
    VALUES (NEW.user_id, NEW.role, 'granted', COALESCE(auth.uid(), NEW.user_id));
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.role_change_log (user_id, role, action, performed_by)
    VALUES (OLD.user_id, OLD.role, 'revoked', COALESCE(auth.uid(), OLD.user_id));
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Now create the first admin user
SELECT public.bootstrap_first_admin('autodebate@gmail.com');