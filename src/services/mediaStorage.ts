import type { SupabaseClient } from '@supabase/supabase-js'

export const MEDIA_BUCKET = 'memorias'

/** Una hora: suficiente para una sesión de uso y corto si la URL se filtra. */
const SIGNED_URL_TTL_SECONDS = 60 * 60

/** Las rutas son `<propietario>/<recuerdo>/<archivo>`; el primer segmento manda en las políticas. */
export function mediaPath(ownerId: string, memoryId: string, fileId: string, extension: string): string {
  return `${ownerId}/${memoryId}/${fileId}.${extension}`
}

export function isStoredInBucket(value: string | undefined): boolean {
  return !!value && !value.startsWith('data:') && !/^https?:/.test(value)
}

/** Extensión y tipo MIME a partir de la cabecera de un data URL. */
function describeDataUrl(dataUrl: string): { contentType: string; extension: string } {
  const contentType = dataUrl.slice(5, dataUrl.indexOf(';')) || 'application/octet-stream'
  const subtype = contentType.split('/')[1] || 'bin'
  const extension = ({ jpeg: 'jpg', mpeg: 'mp3', 'x-m4a': 'm4a', 'quicktime': 'mov' } as Record<string, string>)[subtype]
    ?? subtype.replace(/[^a-z0-9]/g, '')
  return { contentType, extension: extension || 'bin' }
}

/** `fetch` sobre un data URL es la vía nativa de pasar de base64 a Blob. */
async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const response = await fetch(dataUrl)
  return response.blob()
}

/**
 * Sube un data URL al bucket y devuelve su ruta. No comprime: eso ya ocurrió
 * en el formulario, donde se conoce el origen del archivo.
 */
export async function uploadDataUrl(
  supabase: SupabaseClient,
  ownerId: string,
  memoryId: string,
  fileId: string,
  dataUrl: string
): Promise<string> {
  const { contentType, extension } = describeDataUrl(dataUrl)
  const blob = await dataUrlToBlob(dataUrl)
  const path = mediaPath(ownerId, memoryId, fileId, extension)

  const { error } = await supabase.storage
    .from(MEDIA_BUCKET)
    .upload(path, blob, { contentType, upsert: true })
  if (error) throw new Error(`No se pudo subir el archivo: ${error.message}`)

  return path
}

/**
 * Firma varias rutas de una sola vez. El bucket es privado, así que cada
 * lectura necesita una URL temporal; hacerlo en lote evita una petición por foto.
 */
export async function signPaths(
  supabase: SupabaseClient,
  paths: string[]
): Promise<Map<string, string>> {
  const signed = new Map<string, string>()
  const unique = [...new Set(paths)]
  if (unique.length === 0) return signed

  const { data, error } = await supabase.storage
    .from(MEDIA_BUCKET)
    .createSignedUrls(unique, SIGNED_URL_TTL_SECONDS)
  if (error) throw new Error(`No se pudieron abrir las fotos guardadas: ${error.message}`)

  for (const item of data || []) {
    if (item.signedUrl && item.path) signed.set(item.path, item.signedUrl)
  }
  return signed
}

/**
 * Borra archivos. Nunca hace fallar la operación que la llama: un archivo
 * huérfano cuesta unos kilobytes, pero un borrado que revienta a mitad deja
 * al usuario sin saber si su recuerdo se borró.
 */
export async function removePaths(supabase: SupabaseClient, paths: string[]): Promise<void> {
  const unique = [...new Set(paths.filter(Boolean))]
  if (unique.length === 0) return
  const { error } = await supabase.storage.from(MEDIA_BUCKET).remove(unique)
  if (error) console.warn('No se pudieron borrar archivos del recuerdo:', error.message)
}

/** Borra todo lo que cuelgue de un recuerdo, para cuando se elimina entero. */
export async function removeMemoryFolder(
  supabase: SupabaseClient,
  ownerId: string,
  memoryId: string
): Promise<void> {
  const prefix = `${ownerId}/${memoryId}`
  const { data, error } = await supabase.storage.from(MEDIA_BUCKET).list(prefix)
  if (error) {
    console.warn('No se pudo listar el contenido del recuerdo:', error.message)
    return
  }
  await removePaths(supabase, (data || []).map(entry => `${prefix}/${entry.name}`))
}
