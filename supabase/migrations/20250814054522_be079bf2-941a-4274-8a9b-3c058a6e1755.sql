-- Create categories table
CREATE TABLE public.forum_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  description text,
  color text DEFAULT '#3b82f6',
  icon text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on forum_categories
ALTER TABLE public.forum_categories ENABLE ROW LEVEL SECURITY;

-- Add category_id to forum_threads
ALTER TABLE public.forum_threads 
ADD COLUMN category_id uuid REFERENCES public.forum_categories(id);

-- Create policies for forum_categories
CREATE POLICY "Anyone can view categories" 
ON public.forum_categories 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage categories" 
ON public.forum_categories 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for categories updated_at
CREATE TRIGGER update_forum_categories_updated_at
  BEFORE UPDATE ON public.forum_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default categories
INSERT INTO public.forum_categories (name, description, color, icon) VALUES
  ('General', 'Discusiones generales sobre automóviles', '#3b82f6', 'MessageCircle'),
  ('Electric Vehicles', 'Todo sobre vehículos eléctricos', '#22c55e', 'Zap'),
  ('JDM', 'Cultura y autos japoneses', '#ef4444', 'Car'),
  ('Track Racing', 'Carreras y competencias en pista', '#f59e0b', 'Trophy'),
  ('Restoration', 'Restauración de vehículos clásicos', '#8b5cf6', 'Wrench'),
  ('Supercars', 'Superautos y autos de lujo', '#ec4899', 'Star'),
  ('Tuning', 'Modificaciones y personalización', '#06b6d4', 'Settings'),
  ('Reviews', 'Reseñas y opiniones de autos', '#84cc16', 'MessageSquare');

-- Create index for better performance
CREATE INDEX idx_forum_threads_category_id ON public.forum_threads(category_id);