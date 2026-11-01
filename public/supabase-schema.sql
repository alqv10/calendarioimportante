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

create table if not exists public.calendar_pairings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  partner_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  check (user_id <> partner_id)
);

create table if not exists public.calendar_pair_invites (
  token_hash text primary key check (token_hash ~ '^[0-9a-f]{64}$'),
  inviter_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  accepted_by uuid references auth.users(id) on delete cascade,
  accepted_at timestamptz,
  revoked_at timestamptz,
  check (expires_at > created_at),
  check ((accepted_by is null) = (accepted_at is null))
);

alter table public.calendar_pair_invites
  add column if not exists revoked_at timestamptz;

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

create or replace function public.create_calendar_pair_invite()
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  invite_token text;
begin
  if current_user_id is null then
    raise exception 'Debes iniciar sesión para crear una invitación.';
  end if;

  if exists (
    select 1 from public.calendar_pairings
    where user_id = current_user_id
  ) then
    raise exception 'Esta cuenta ya está emparejada con otro calendario.';
  end if;

  invite_token := replace(
    pg_catalog.gen_random_uuid()::text || pg_catalog.gen_random_uuid()::text,
    '-',
    ''
  );

  insert into public.calendar_pair_invites (token_hash, inviter_id, expires_at)
  values (
    pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(invite_token, 'UTF8')), 'hex'),
    current_user_id,
    now() + interval '48 hours'
  );

  return invite_token;
end;
$$;

create or replace function public.accept_calendar_pair_invite(invite_token text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  token_hash_value text;
  invite public.calendar_pair_invites%rowtype;
begin
  if current_user_id is null then
    raise exception 'Debes iniciar sesión para aceptar una invitación.';
  end if;

  if invite_token is null or invite_token !~ '^[0-9A-Fa-f]{64}$' then
    raise exception 'El código de invitación no es válido.';
  end if;

  token_hash_value := pg_catalog.encode(
    pg_catalog.sha256(pg_catalog.convert_to(pg_catalog.lower(invite_token), 'UTF8')),
    'hex'
  );

  select * into invite
  from public.calendar_pair_invites
  where token_hash = token_hash_value
  for update;

  if not found
    or invite.expires_at <= now()
    or invite.accepted_by is not null
    or invite.revoked_at is not null
  then
    raise exception 'El código venció, ya fue usado o no existe.';
  end if;
  if invite.inviter_id = current_user_id then
    raise exception 'No puedes aceptar tu propia invitación.';
  end if;
  if exists (
    select 1 from public.calendar_pairings
    where user_id in (current_user_id, invite.inviter_id)
  ) then
    raise exception 'Una de estas cuentas ya está emparejada.';
  end if;

  insert into public.calendar_pairings (user_id, partner_id)
  values (current_user_id, invite.inviter_id), (invite.inviter_id, current_user_id);

  update public.calendar_pair_invites
  set accepted_by = current_user_id, accepted_at = now()
  where token_hash = token_hash_value;

  update public.calendar_pair_invites
  set revoked_at = now()
  where inviter_id in (current_user_id, invite.inviter_id)
    and accepted_by is null
    and revoked_at is null
    and token_hash <> token_hash_value;

  return invite.inviter_id;
end;
$$;

create or replace function public.disconnect_calendar_pairing()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  partner_user_id uuid;
begin
  if current_user_id is null then
    raise exception 'Debes iniciar sesión para desvincular un calendario.';
  end if;

  select partner_id into partner_user_id
  from public.calendar_pairings
  where user_id = current_user_id
  for update;

  if partner_user_id is null then
    raise exception 'Esta cuenta no está emparejada.';
  end if;

  delete from public.calendar_pairings
  where user_id in (current_user_id, partner_user_id);

  update public.calendar_pair_invites
  set revoked_at = now()
  where inviter_id in (current_user_id, partner_user_id)
    and accepted_by is null
    and revoked_at is null;
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
alter table public.calendar_pairings enable row level security;
alter table public.calendar_pair_invites enable row level security;

create policy profiles_read_own
  on public.profiles for select to authenticated
  using ((select auth.uid()) = id);

create policy profiles_update_own
  on public.profiles for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create policy memories_read_own_and_paired
  on public.memories for select to authenticated
  using (
    (select auth.uid()) = user_id
    or user_id in (
      select pairing.partner_id
      from public.calendar_pairings as pairing
      where pairing.user_id = (select auth.uid())
    )
  );

create policy memories_insert_own
  on public.memories for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy memories_update_own
  on public.memories for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy memories_delete_own
  on public.memories for delete to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists calendar_pairings_read_own on public.calendar_pairings;
create policy calendar_pairings_read_own
  on public.calendar_pairings for select to authenticated
  using ((select auth.uid()) = user_id);

revoke all on public.profiles, public.memories from anon;
revoke all on public.calendar_pairings, public.calendar_pair_invites from public, anon, authenticated;
grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.memories to authenticated;
grant select on public.calendar_pairings to authenticated;

revoke all on function public.create_calendar_pair_invite() from public, anon;
revoke all on function public.accept_calendar_pair_invite(text) from public, anon;
revoke all on function public.disconnect_calendar_pairing() from public, anon;
grant execute on function public.create_calendar_pair_invite() to authenticated;
grant execute on function public.accept_calendar_pair_invite(text) to authenticated;
grant execute on function public.disconnect_calendar_pairing() to authenticated;

commit;
