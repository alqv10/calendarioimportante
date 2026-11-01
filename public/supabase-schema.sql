-- Fresh-project schema for Momentos Especiales.
-- Do not apply this over the earlier prototype database: its profiles table
-- stored passwords and its public RLS policies exposed user data. Back up
-- existing data and migrate it separately before connecting that database.

begin;

do $$
begin
  if to_regclass('public.profiles') is not null and exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'id'
      and data_type <> 'uuid'
  ) then
    raise exception 'Legacy profiles table detected. Use a fresh Supabase project or migrate the old database before applying this schema.';
  end if;

  if to_regclass('public.memories') is not null and exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'memories'
      and column_name = 'user_id'
      and data_type <> 'uuid'
  ) then
    raise exception 'Legacy memories table detected. Use a fresh Supabase project or migrate the old database before applying this schema.';
  end if;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  username text not null unique
    check (username ~ '^[a-z0-9_]{3,30}$'),
  partner_name text not null default '',
  avatar_emoji text not null default '💖',
  created_at bigint not null
);

create table if not exists public.memories (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  date text not null,
  category text not null,
  emoji text not null,
  description text not null default '',
  location text,
  feeling text,
  is_milestone boolean not null default false,
  song_title text,
  song_artist text,
  song_url text,
  photos jsonb not null default '[]'::jsonb,
  audio_data text,
  created_at bigint not null,
  updated_at bigint not null
);

create or replace function public.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  profile_metadata jsonb := new.raw_user_meta_data;
  fallback_username text := 'user_' || substr(replace(new.id::text, '-', ''), 1, 12);
begin
  insert into public.profiles (id, name, username, partner_name, avatar_emoji, created_at)
  values (
    new.id,
    coalesce(nullif(btrim(profile_metadata ->> 'name'), ''), 'Usuario'),
    coalesce(nullif(lower(btrim(profile_metadata ->> 'username')), ''), fallback_username),
    coalesce(nullif(btrim(profile_metadata ->> 'partner_name'), ''), ''),
    coalesce(nullif(profile_metadata ->> 'avatar_emoji', ''), '💖'),
    (extract(epoch from now()) * 1000)::bigint
  );
  return new;
end;
$$;

drop trigger if exists create_profile_after_signup on auth.users;
create trigger create_profile_after_signup
  after insert on auth.users
  for each row execute function public.create_profile_for_new_user();

do $$
declare
  existing_policy record;
begin
  for existing_policy in
    select policy.polname, relation.relname
    from pg_policy as policy
    join pg_class as relation on relation.oid = policy.polrelid
    join pg_namespace as namespace on namespace.oid = relation.relnamespace
    where namespace.nspname = 'public'
      and relation.relname in ('profiles', 'memories')
  loop
    execute format('drop policy %I on public.%I', existing_policy.polname, existing_policy.relname);
  end loop;
end;
$$;

alter table public.profiles enable row level security;
alter table public.memories enable row level security;

create policy profiles_read_own
  on public.profiles for select to authenticated
  using ((select auth.uid()) = id);

create policy profiles_update_own
  on public.profiles for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create policy memories_manage_own
  on public.memories for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

revoke all on public.profiles, public.memories from anon;
grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.memories to authenticated;

commit;
