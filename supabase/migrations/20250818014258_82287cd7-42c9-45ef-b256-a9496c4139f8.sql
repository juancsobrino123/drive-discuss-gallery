-- Corregir functions para tener search_path seguro
CREATE OR REPLACE FUNCTION public.calculate_user_level(user_points integer)
RETURNS integer
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
BEGIN
  -- Nivel 1: 0-99 puntos
  -- Nivel 2: 100-299 puntos
  -- Nivel 3: 300-599 puntos
  -- Nivel 4: 600-999 puntos
  -- Nivel 5+: cada 1000 puntos adicionales
  IF user_points < 100 THEN
    RETURN 1;
  ELSIF user_points < 300 THEN
    RETURN 2;
  ELSIF user_points < 600 THEN
    RETURN 3;
  ELSIF user_points < 1000 THEN
    RETURN 4;
  ELSE
    RETURN 5 + ((user_points - 1000) / 1000);
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_user_points(target_user_id uuid, activity_type text, points_to_add integer, related_id uuid DEFAULT NULL, related_type text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_points integer;
  new_level integer;
BEGIN
  -- Registrar la actividad
  INSERT INTO public.user_activity_log (user_id, activity_type, points, related_id, related_type)
  VALUES (target_user_id, activity_type, points_to_add, related_id, related_type);
  
  -- Actualizar puntos en el perfil
  UPDATE public.profiles 
  SET points = points + points_to_add,
      updated_at = now()
  WHERE id = target_user_id
  RETURNING points INTO new_points;
  
  -- Calcular nuevo nivel
  SELECT calculate_user_level(new_points) INTO new_level;
  
  -- Actualizar nivel
  UPDATE public.profiles 
  SET level = new_level
  WHERE id = target_user_id;
END;
$$;