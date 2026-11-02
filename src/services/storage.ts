import type { SupabaseClient } from '@supabase/supabase-js'
import type { MemoryMoment, MemoryPhoto } from '../types'
import { getSupabaseClient } from './supabase'
import {
  removeMemoryFolder,
  removePaths,
  signPaths,
  uploadDataUrl
} from './mediaStorage'

/**
 * Los recuerdos viven solo en Supabase: la aplicación exige una sesión cloud
 * antes de mostrarlos, así que no hay modo local. Cada operación revalida la
 * sesión contra el servidor; RLS es la defensa real, esto solo evita pedirle
 * al servidor algo que ya sabemos que no corresponde.
 */
async function requireSession(userId?: string) {
  const supabase = getSupabaseClient()
  if (!supabase) throw new Error('Configura Supabase para acceder a tus recuerdos.')
  if (!userId) throw new Error('Inicia sesión para acceder a tus recuerdos.')

  const { data, error } = await supabase.auth.getUser()
  if (error) throw new Error(`No se pudo validar la sesión: ${error.message}`)
  if (!data.user) throw new Error('Inicia sesión para acceder a tus recuerdos.')
  if (data.user.id !== userId) {
    throw new Error('La sesión no coincide con el perfil seleccionado.')
  }

  return { supabase, userId: data.user.id }
}

type MemoryRow = Record<string, any>

/** Fila de la base de datos -> recuerdo. Las URLs de Storage se firman aparte. */
export function rowToMemory(item: MemoryRow): MemoryMoment {
  return {
    id: item.id,
    userId: item.user_id,
    title: item.title,
    date: item.date,
    category: item.category,
    emoji: item.emoji,
    description: item.description,
    location: item.location,
    feeling: item.feeling,
    isMilestone: item.is_milestone,
    songTitle: item.song_title,
    songArtist: item.song_artist,
    songUrl: item.song_url,
    photos: ((item.photos || []) as MemoryPhoto[]).map(photo => ({
      id: photo.id,
      // Si la foto vive en Storage, `url` se rellena al firmar; si es un
      // recuerdo antiguo, `url` ya trae el base64 y se usa tal cual.
      url: photo.path ? '' : (photo.url || ''),
      path: photo.path,
      caption: photo.caption
    })),
    audioData: item.audio_path ? undefined : (item.audio_data || undefined),
    audioPath: item.audio_path || undefined,
    createdAt: item.created_at,
    updatedAt: item.updated_at
  }
}

/**
 * Recuerdo -> fila. Es el punto peligroso: `url` y `audioData` contienen URLs
 * firmadas que caducan en una hora, así que escribirlas en la base de datos
 * dejaría recuerdos con fotos rotas de forma permanente. Cuando hay `path`,
 * la URL no se guarda.
 */
export function memoryToRow(moment: MemoryMoment, ownerId: string): MemoryRow {
  return {
    id: moment.id,
    user_id: ownerId,
    title: moment.title,
    date: moment.date,
    category: moment.category,
    emoji: moment.emoji,
    description: moment.description,
    location: moment.location || null,
    feeling: moment.feeling || null,
    is_milestone: !!moment.isMilestone,
    song_title: moment.songTitle || null,
    song_artist: moment.songArtist || null,
    song_url: moment.songUrl || null,
    photos: (moment.photos || []).map(photo => photo.path
      ? { id: photo.id, path: photo.path, caption: photo.caption }
      : { id: photo.id, url: photo.url, caption: photo.caption }),
    audio_path: moment.audioPath || null,
    audio_data: moment.audioPath ? null : (moment.audioData || null),
    created_at: moment.createdAt,
    updated_at: moment.updatedAt
  }
}

/** Todas las rutas de Storage que hacen falta para mostrar estos recuerdos. */
export function collectMediaPaths(memories: MemoryMoment[]): string[] {
  const paths: string[] = []
  for (const memory of memories) {
    for (const photo of memory.photos || []) {
      if (photo.path) paths.push(photo.path)
    }
    if (memory.audioPath) paths.push(memory.audioPath)
  }
  return paths
}

/**
 * Rellena las URLs mostrables con las firmadas. Una ruta sin firmar (archivo
 * borrado fuera de la aplicación) deja la foto sin URL pero conserva su `path`:
 * se ve rota, pero guardar el recuerdo no la pierde.
 */
export function attachSignedUrls(
  memories: MemoryMoment[],
  signed: Map<string, string>
): MemoryMoment[] {
  return memories.map(memory => ({
    ...memory,
    photos: (memory.photos || []).map(photo =>
      photo.path ? { ...photo, url: signed.get(photo.path) || '' } : photo
    ),
    audioData: memory.audioPath ? signed.get(memory.audioPath) : memory.audioData
  }))
}

export async function getAllMemories(userId?: string): Promise<MemoryMoment[]> {
  const { supabase } = await requireSession(userId)

  const { data, error } = await supabase
    .from('memories')
    .select('*')
    .order('date', { ascending: false })
  if (error) throw new Error(`No se pudieron cargar los recuerdos: ${error.message}`)

  const memories = (data || []).map(rowToMemory)
  const signed = await signPaths(supabase, collectMediaPaths(memories))
  return attachSignedUrls(memories, signed)
}

/** Sube a Storage lo que todavía llega como base64 y devuelve el recuerdo con rutas. */
async function uploadPendingMedia(
  supabase: SupabaseClient,
  moment: MemoryMoment,
  ownerId: string
): Promise<MemoryMoment> {
  const photos = await Promise.all((moment.photos || []).map(async photo => {
    // Ya está en Storage, o es un enlace externo que no nos toca alojar.
    if (photo.path || !photo.url.startsWith('data:')) return photo
    const path = await uploadDataUrl(supabase, ownerId, moment.id, photo.id, photo.url)
    return { ...photo, path }
  }))

  let audioPath = moment.audioPath
  if (!audioPath && moment.audioData?.startsWith('data:')) {
    audioPath = await uploadDataUrl(supabase, ownerId, moment.id, 'audio', moment.audioData)
  }

  return { ...moment, photos, audioPath }
}

/** Archivos que estaban guardados y ya no forman parte del recuerdo. */
async function pathsNoLongerUsed(
  supabase: SupabaseClient,
  moment: MemoryMoment
): Promise<string[]> {
  const { data, error } = await supabase
    .from('memories')
    .select('photos, audio_path')
    .eq('id', moment.id)
    .maybeSingle()
  if (error || !data) return []

  const previous = collectMediaPaths([rowToMemory({ ...data, photos: data.photos })])
  const current = new Set(collectMediaPaths([moment]))
  return previous.filter(path => !current.has(path))
}

export async function saveMemory(moment: MemoryMoment, userId?: string): Promise<void> {
  if (moment.userId && moment.userId !== userId) {
    throw new Error('No puedes guardar recuerdos en el perfil de otra cuenta.')
  }
  const { supabase, userId: ownerId } = await requireSession(userId)

  const stale = await pathsNoLongerUsed(supabase, moment)
  const stored = await uploadPendingMedia(supabase, moment, ownerId)

  const { error } = await supabase.from('memories').upsert(memoryToRow(stored, ownerId))
  if (error) throw new Error(`No se pudo guardar el recuerdo: ${error.message}`)

  // Solo después de que el recuerdo quedó guardado: si falla el upsert, los
  // archivos viejos siguen siendo los buenos.
  await removePaths(supabase, stale)
}

export async function deleteMemory(id: string, userId?: string): Promise<void> {
  const { supabase, userId: ownerId } = await requireSession(userId)

  // El filtro por propietario es redundante con RLS, y es justamente por eso
  // que conviene: un borrado nunca debe depender de una sola capa.
  const { error } = await supabase.from('memories').delete().eq('id', id).eq('user_id', ownerId)
  if (error) throw new Error(`No se pudo borrar el recuerdo: ${error.message}`)

  await removeMemoryFolder(supabase, ownerId, id)
}

async function dataUrlFromUrl(url: string): Promise<string> {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`no se pudo descargar (${response.status})`)
  const blob = await response.blob()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('no se pudo leer el archivo descargado'))
    reader.readAsDataURL(blob)
  })
}

/**
 * Deja el recuerdo autocontenido para la copia de seguridad: incrusta los
 * archivos en base64 y quita las rutas, que solo significan algo dentro de este
 * proyecto de Supabase. Sin esto el export guardaría URLs firmadas que caducan
 * en una hora, es decir, una copia sin fotos.
 */
export async function inlineMediaForExport(
  memory: MemoryMoment,
  toDataUrl: (url: string) => Promise<string> = dataUrlFromUrl
): Promise<MemoryMoment> {
  const photos = await Promise.all(memory.photos.map(async photo => {
    if (!photo.path) return photo
    try {
      return { id: photo.id, url: await toDataUrl(photo.url), caption: photo.caption }
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'error desconocido'
      throw new Error(`No se pudo incluir una foto de "${memory.title}": ${reason}`)
    }
  }))

  let audioData = memory.audioData
  if (memory.audioPath && audioData) {
    try {
      audioData = await toDataUrl(audioData)
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'error desconocido'
      throw new Error(`No se pudo incluir el audio de "${memory.title}": ${reason}`)
    }
  }

  return { ...memory, photos, audioData, audioPath: undefined }
}

export async function exportMemoriesJSON(userId?: string): Promise<string> {
  const loaded = await getAllMemories(userId)
  const memories = await Promise.all(loaded.map(memory => inlineMediaForExport(memory)))
  return JSON.stringify({
    version: '2.0',
    exportDate: new Date().toISOString(),
    userId,
    total: memories.length,
    memories
  }, null, 2)
}

export async function importMemoriesJSON(jsonString: string, userId?: string): Promise<number> {
  let parsed: unknown
  try {
    parsed = JSON.parse(jsonString)
  } catch {
    throw new Error('El archivo no tiene un formato válido de recuerdos.')
  }

  const items = Array.isArray(parsed)
    ? parsed
    : parsed && typeof parsed === 'object' && 'memories' in parsed
      ? parsed.memories
      : null
  if (!Array.isArray(items)) {
    throw new Error('El archivo no tiene un formato válido de recuerdos.')
  }

  const validItems = items.filter((item): item is MemoryMoment =>
    !!item &&
    typeof item === 'object' &&
    'id' in item && typeof item.id === 'string' &&
    'title' in item && typeof item.title === 'string' &&
    'date' in item && typeof item.date === 'string'
  )
  if (validItems.length !== items.length) {
    throw new Error('El archivo contiene recuerdos con datos incompletos.')
  }

  let imported = 0
  for (const item of validItems) {
    try {
      await saveMemory({ ...item, userId: userId || item.userId }, userId)
      imported++
    } catch (error) {
      const message = error instanceof Error ? error.message : 'error desconocido'
      throw new Error(`Se importaron ${imported} recuerdos antes de un error: ${message}`)
    }
  }
  return imported
}
