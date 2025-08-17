-- Expandir tabla profiles con campos adicionales
ALTER TABLE public.profiles 
ADD COLUMN bio text,
ADD COLUMN birth_date date,
ADD COLUMN city text,
ADD COLUMN country text,
ADD COLUMN social_links jsonb DEFAULT '{}',
ADD COLUMN points integer DEFAULT 0,
ADD COLUMN level integer DEFAULT 1,
ADD COLUMN privacy_settings jsonb DEFAULT '{"show_cars": true, "show_location": true, "show_activity": true}';

-- Crear tabla para autos actuales del usuario
CREATE TABLE public.user_cars (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  make text NOT NULL,
  model text NOT NULL,
  year integer,
  description text,
  is_current boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Crear tabla para autos favoritos del usuario
CREATE TABLE public.user_favorite_cars (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  make text NOT NULL,
  model text NOT NULL,
  year integer,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Crear tabla de logros/achievements
CREATE TABLE public.achievements (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL,
  icon text,
  points integer DEFAULT 0,
  type text NOT NULL, -- 'activity', 'content', 'social', 'milestone'
  requirements jsonb, -- criterios para obtener el logro
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Crear tabla para logros obtenidos por usuarios
CREATE TABLE public.user_achievements (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_id uuid NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  earned_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

-- Crear tabla para registrar actividad y puntos
CREATE TABLE public.user_activity_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  activity_type text NOT NULL, -- 'post_created', 'photo_uploaded', 'comment_added', 'like_given'
  points integer DEFAULT 0,
  related_id uuid, -- ID del objeto relacionado (post, foto, etc.)
  related_type text, -- tipo del objeto relacionado
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Habilitar RLS en las nuevas tablas
ALTER TABLE public.user_cars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_favorite_cars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity_log ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para user_cars
CREATE POLICY "Users can view cars based on privacy settings" 
ON public.user_cars 
FOR SELECT 
USING (
  (SELECT privacy_settings->>'show_cars' FROM profiles WHERE id = user_id) = 'true'
  OR user_id = auth.uid()
  OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Users can manage their own cars" 
ON public.user_cars 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Políticas RLS para user_favorite_cars
CREATE POLICY "Users can view favorite cars based on privacy settings" 
ON public.user_favorite_cars 
FOR SELECT 
USING (
  (SELECT privacy_settings->>'show_cars' FROM profiles WHERE id = user_id) = 'true'
  OR user_id = auth.uid()
  OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Users can manage their own favorite cars" 
ON public.user_favorite_cars 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Políticas RLS para achievements
CREATE POLICY "Anyone can view achievements" 
ON public.achievements 
FOR SELECT 
USING (true);

CREATE POLICY "Only admins can manage achievements" 
ON public.achievements 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Políticas RLS para user_achievements
CREATE POLICY "Users can view achievements based on privacy settings" 
ON public.user_achievements 
FOR SELECT 
USING (
  (SELECT privacy_settings->>'show_activity' FROM profiles WHERE id = user_id) = 'true'
  OR user_id = auth.uid()
  OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "System can grant achievements" 
ON public.user_achievements 
FOR INSERT 
WITH CHECK (true); -- Permitir inserción desde funciones del sistema

-- Políticas RLS para user_activity_log
CREATE POLICY "Users can view their own activity" 
ON public.user_activity_log 
FOR SELECT 
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can log activity" 
ON public.user_activity_log 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Crear función para calcular nivel basado en puntos
CREATE OR REPLACE FUNCTION public.calculate_user_level(user_points integer)
RETURNS integer
LANGUAGE plpgsql
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

-- Crear función para actualizar puntos y nivel
CREATE OR REPLACE FUNCTION public.update_user_points(target_user_id uuid, activity_type text, points_to_add integer, related_id uuid DEFAULT NULL, related_type text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Crear triggers para actualizar timestamps
CREATE TRIGGER update_user_cars_updated_at
  BEFORE UPDATE ON public.user_cars
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insertar algunos logros básicos
INSERT INTO public.achievements (name, description, icon, points, type, requirements) VALUES
('Bienvenido', 'Te uniste a la comunidad AUTODEBATE', '🎉', 10, 'milestone', '{"action": "profile_created"}'),
('Primera Foto', 'Subiste tu primera foto a la galería', '📸', 25, 'content', '{"action": "photo_uploaded", "count": 1}'),
('Comentarista', 'Hiciste tu primer comentario en el foro', '💬', 15, 'activity', '{"action": "comment_created", "count": 1}'),
('Fotógrafo', 'Subiste 10 fotos a la galería', '📷', 100, 'content', '{"action": "photo_uploaded", "count": 10}'),
('Activo', 'Conseguiste 100 puntos de actividad', '⭐', 0, 'milestone', '{"points": 100}'),
('Experto', 'Conseguiste 500 puntos de actividad', '🏆', 0, 'milestone', '{"points": 500}');