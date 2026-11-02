-- Almacenamiento de fotos y audio en Supabase Storage.
--
-- Hasta ahora las fotos y el audio se guardaban como base64 dentro de la fila
-- del recuerdo. Eso infla la base de datos (una foto de 1920 px ocupa ~400-800 kB
-- ya convertida a base64) y obliga a descargar TODOS los archivos de TODOS los
-- recuerdos cada vez que se abre la aplicación, porque van en el mismo SELECT.
--
-- Este archivo es ADITIVO: no toca datos existentes y se puede ejecutar sobre un
-- proyecto que ya tiene aplicado `supabase-schema.sql`. Los recuerdos antiguos
-- con base64 siguen funcionando; la aplicación los lee igual.
--
-- Ejecutar en el SQL Editor de Supabase DESPUÉS de `supabase-schema.sql`.

begin;

-- El esquema base tiene que existir: si no, este archivo no aplica.
do $$
begin
  if to_regclass('public.memories') is null
     or to_regclass('public.calendar_pairings') is null then
    raise exception 'Ejecuta primero public/supabase-schema.sql: faltan las tablas base.';
  end if;
end;
$$;

-- Ruta de cada archivo: <uuid del propietario>/<id del recuerdo>/<id del archivo>
-- El primer segmento es la identidad, y es lo que miran las políticas de abajo.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'memorias',
  'memorias',
  false, -- privado: estas fotos no deben ser legibles por quien adivine la URL
  26214400, -- 25 MB por archivo
  array[
    'image/jpeg', 'image/png', 'image/webp',
    'audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/ogg', 'audio/webm', 'audio/x-m4a'
  ]
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Dónde se guarda la ruta del audio. Las fotos ya viven en la columna jsonb
-- `photos`, así que ahí basta con añadir una clave a cada objeto.
alter table public.memories add column if not exists audio_path text;

-- Las políticas replican exactamente la regla de `memories_read_own_and_paired`:
-- se lee lo propio y lo de la cuenta emparejada; se escribe solo lo propio.
drop policy if exists memorias_read_own_and_paired on storage.objects;
create policy memorias_read_own_and_paired
  on storage.objects for select to authenticated
  using (
    bucket_id = 'memorias'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or (storage.foldername(name))[1] in (
        select pairing.partner_id::text
        from public.calendar_pairings as pairing
        where pairing.user_id = (select auth.uid())
      )
    )
  );

drop policy if exists memorias_insert_own on storage.objects;
create policy memorias_insert_own
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'memorias'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists memorias_update_own on storage.objects;
create policy memorias_update_own
  on storage.objects for update to authenticated
  using (
    bucket_id = 'memorias'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'memorias'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists memorias_delete_own on storage.objects;
create policy memorias_delete_own
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'memorias'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

commit;

-- Comprobación rápida tras ejecutarlo:
--   select id, public, file_size_limit from storage.buckets where id = 'memorias';
--   select policyname from pg_policies
--     where schemaname = 'storage' and tablename = 'objects'
--       and policyname like 'memorias_%';
-- Deben aparecer el bucket (public = false) y las cuatro políticas.
