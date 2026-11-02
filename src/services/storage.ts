import type { MemoryMoment } from '../types'
import { getSupabaseClient } from './supabase'

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

export async function getAllMemories(userId?: string): Promise<MemoryMoment[]> {
  const { supabase } = await requireSession(userId)

  const { data, error } = await supabase
    .from('memories')
    .select('*')
    .order('date', { ascending: false })
  if (error) throw new Error(`No se pudieron cargar los recuerdos: ${error.message}`)

  return (data || []).map(item => ({
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
    photos: item.photos || [],
    audioData: item.audio_data,
    createdAt: item.created_at,
    updatedAt: item.updated_at
  }))
}

export async function saveMemory(moment: MemoryMoment, userId?: string): Promise<void> {
  if (moment.userId && moment.userId !== userId) {
    throw new Error('No puedes guardar recuerdos en el perfil de otra cuenta.')
  }
  const { supabase, userId: ownerId } = await requireSession(userId)

  const { error } = await supabase.from('memories').upsert({
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
    photos: moment.photos || [],
    audio_data: moment.audioData || null,
    created_at: moment.createdAt,
    updated_at: moment.updatedAt
  })
  if (error) throw new Error(`No se pudo guardar el recuerdo: ${error.message}`)
}

export async function deleteMemory(id: string, userId?: string): Promise<void> {
  const { supabase, userId: ownerId } = await requireSession(userId)

  // El filtro por propietario es redundante con RLS, y es justamente por eso
  // que conviene: un borrado nunca debe depender de una sola capa.
  const { error } = await supabase.from('memories').delete().eq('id', id).eq('user_id', ownerId)
  if (error) throw new Error(`No se pudo borrar el recuerdo: ${error.message}`)
}

export async function exportMemoriesJSON(userId?: string): Promise<string> {
  const memories = await getAllMemories(userId)
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
