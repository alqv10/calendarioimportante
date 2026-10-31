-- =========================================================
-- ESQUEMA SQL PARA BASE DE DATOS SUPABASE (POSTGRESQL)
-- Proyecto: Momentos Especiales (Calendario de Recuerdos)
-- =========================================================

-- 1. Tabla de Perfiles / Cuentas de Usuario
create table if not exists public.profiles (
  id text primary key,
  name text not null,
  username text not null unique,
  password text,
  partner_name text default 'Grace',
  avatar_emoji text default '💖',
  created_at bigint not null
);

-- 2. Tabla de Recuerdos / Momentos Importantes
create table if not exists public.memories (
  id text primary key,
  user_id text references public.profiles(id) on delete cascade,
  title text not null,
  date text not null,
  category text not null,
  emoji text not null,
  description text default '',
  location text,
  feeling text,
  is_milestone boolean default false,
  song_title text,
  song_artist text,
  song_url text,
  photos jsonb default '[]'::jsonb,
  audio_data text,
  created_at bigint not null,
  updated_at bigint not null
);

-- Habilitar permisos de lectura y escritura públicos/autenticados para la app
alter table public.profiles enable row level security;
alter table public.memories enable row level security;

create policy "Permitir acceso a perfiles"
  on public.profiles for all
  using (true)
  with check (true);

create policy "Permitir acceso a recuerdos"
  on public.memories for all
  using (true)
  with check (true);
