-- Sync profiles.username from Auth display name on user creation
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  _display_name text;
begin
  _display_name := coalesce(
    new.raw_user_meta_data ->> 'display_name',
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'name',
    split_part(new.email, '@', 1)
  );

  insert into public.profiles (id, username, avatar_url)
  values (new.id, nullif(_display_name, ''), new.raw_user_meta_data ->> 'avatar_url')
  on conflict (id) do nothing;

  return new;
end;
$$;