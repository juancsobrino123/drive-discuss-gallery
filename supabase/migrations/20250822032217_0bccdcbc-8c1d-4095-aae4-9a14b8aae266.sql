-- Create a special event for car photos to satisfy foreign key constraint
INSERT INTO public.events (id, title, description, created_by, location) 
VALUES (
  '00000000-0000-0000-0000-000000000000'::uuid,
  'Car Photos',
  'Special event for user car photos in showroom',
  '00000000-0000-0000-0000-000000000000'::uuid,
  'Showroom'
) ON CONFLICT (id) DO NOTHING;