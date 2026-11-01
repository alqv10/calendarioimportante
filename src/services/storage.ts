import type { MemoryMoment } from '../types'
import { getSupabaseClient } from './supabase'

const DB_NAME = 'MomentosImportantesDB'
const STORE_NAME = 'memories'
const DB_VERSION = 1
const LOCAL_STORAGE_BACKUP_KEY = 'momentos_importantes_backup'

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error('IndexedDB not supported'))
      return
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = (event: any) => {
      const db = event.target.result as IDBDatabase
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function getAllMemories(userId?: string): Promise<MemoryMoment[]> {
  const supabase = getSupabaseClient()
  if (supabase) {
    const { data: authData, error: authError } = await supabase.auth.getUser()
    if (authError) throw new Error(`No se pudo validar la sesión: ${authError.message}`)
    if (!authData.user) throw new Error('Inicia sesión para consultar tus recuerdos en la nube.')
    if (!userId || userId !== authData.user.id) {
      throw new Error('La sesión no coincide con el perfil seleccionado.')
    }

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

  if (!userId) return []

  try {
    const db = await openDB()
    return new Promise((resolve) => {
      const transaction = db.transaction(STORE_NAME, 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.getAll()

      request.onsuccess = () => {
        let results = request.result as MemoryMoment[]
        if (!results || results.length === 0) {
          resolve([])
        } else {
          results = results.filter(m => m.userId === userId)
          results.sort((a, b) => b.date.localeCompare(a.date))
          resolve(results)
        }
      }

      request.onerror = () => {
        const stored = localStorage.getItem(LOCAL_STORAGE_BACKUP_KEY)
        const list: MemoryMoment[] = stored ? JSON.parse(stored) : []
        const ownMemories = list.filter(m => m.userId === userId)
        ownMemories.sort((a, b) => b.date.localeCompare(a.date))
        resolve(ownMemories)
      }
    })
  } catch (err) {
    console.warn('IndexedDB error, using localStorage fallback', err)
    const stored = localStorage.getItem(LOCAL_STORAGE_BACKUP_KEY)
    const list: MemoryMoment[] = stored ? JSON.parse(stored) : []
    return list.filter(m => m.userId === userId).sort((a, b) => b.date.localeCompare(a.date))
  }
}

export async function saveMemory(moment: MemoryMoment, userId?: string): Promise<void> {
  const supabase = getSupabaseClient()
  if (!userId) {
    throw new Error('Inicia sesión antes de guardar recuerdos.')
  }
  if (moment.userId && moment.userId !== userId) {
    throw new Error('No puedes guardar recuerdos en el perfil de otra cuenta.')
  }

  const itemToSave: MemoryMoment = {
    ...moment,
    userId
  }

  if (supabase) {
    const { data: authData, error: authError } = await supabase.auth.getUser()
    if (authError) throw new Error(`No se pudo validar la sesión: ${authError.message}`)
    if (!authData.user) throw new Error('Inicia sesión para guardar recuerdos en la nube.')
    if (itemToSave.userId && itemToSave.userId !== authData.user.id) {
      throw new Error('No puedes guardar recuerdos en el perfil de otra cuenta.')
    }

    const { error } = await supabase.from('memories').upsert({
      id: itemToSave.id,
      user_id: authData.user.id,
      title: itemToSave.title,
      date: itemToSave.date,
      category: itemToSave.category,
      emoji: itemToSave.emoji,
      description: itemToSave.description,
      location: itemToSave.location || null,
      feeling: itemToSave.feeling || null,
      is_milestone: !!itemToSave.isMilestone,
      song_title: itemToSave.songTitle || null,
      song_artist: itemToSave.songArtist || null,
      song_url: itemToSave.songUrl || null,
      photos: itemToSave.photos || [],
      audio_data: itemToSave.audioData || null,
      created_at: itemToSave.createdAt,
      updated_at: itemToSave.updatedAt
    })
    if (error) throw new Error(`No se pudo guardar el recuerdo: ${error.message}`)
    return
  }

  let ownershipError: Error | null = null
  try {
    const db = await openDB()
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.get(itemToSave.id)

      request.onsuccess = () => {
        const existing = request.result as MemoryMoment | undefined
        if (existing && existing.userId !== userId) {
          ownershipError = new Error('No puedes editar recuerdos de otra cuenta.')
          transaction.abort()
          return
        }
        store.put(itemToSave)
      }
      request.onerror = () => reject(request.error || new Error('No se pudo revisar el recuerdo.'))
      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error || new Error('No se pudo guardar el recuerdo.'))
      transaction.onabort = () => reject(ownershipError || transaction.error || new Error('No se pudo guardar el recuerdo.'))
    })
  } catch {
    if (ownershipError) throw ownershipError
    const stored = localStorage.getItem(LOCAL_STORAGE_BACKUP_KEY)
    const list: MemoryMoment[] = stored ? JSON.parse(stored) : []
    const index = list.findIndex(m => m.id === itemToSave.id)
    if (index >= 0 && list[index].userId !== userId) {
      throw new Error('No puedes editar recuerdos de otra cuenta.')
    }
    if (index >= 0) {
      list[index] = itemToSave
    } else {
      list.push(itemToSave)
    }
    localStorage.setItem(LOCAL_STORAGE_BACKUP_KEY, JSON.stringify(list))
  }
}

export async function deleteMemory(id: string, userId?: string): Promise<void> {
  if (!userId) throw new Error('Inicia sesión antes de borrar recuerdos.')

  const supabase = getSupabaseClient()
  if (supabase) {
    const { data: authData, error: authError } = await supabase.auth.getUser()
    if (authError) throw new Error(`No se pudo validar la sesión: ${authError.message}`)
    if (!authData.user) throw new Error('Inicia sesión para borrar recuerdos en la nube.')
    if (userId !== authData.user.id) {
      throw new Error('La sesión no coincide con el perfil seleccionado.')
    }

    const { error } = await supabase.from('memories').delete().eq('id', id)
    if (error) throw new Error(`No se pudo borrar el recuerdo: ${error.message}`)
    return
  }

  let ownershipError: Error | null = null
  try {
    const db = await openDB()
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.get(id)
      request.onsuccess = () => {
        const existing = request.result as MemoryMoment | undefined
        if (!existing || existing.userId !== userId) {
          ownershipError = new Error('Solo puedes borrar recuerdos de tu propia cuenta.')
          transaction.abort()
          return
        }
        store.delete(id)
      }
      request.onerror = () => reject(request.error || new Error('No se pudo revisar el recuerdo.'))
      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error || new Error('No se pudo borrar el recuerdo.'))
      transaction.onabort = () => reject(ownershipError || transaction.error || new Error('No se pudo borrar el recuerdo.'))
    })
  } catch {
    if (ownershipError) throw ownershipError
    const stored = localStorage.getItem(LOCAL_STORAGE_BACKUP_KEY)
    const list: MemoryMoment[] = stored ? JSON.parse(stored) : []
    const filtered = list.filter(m => m.id !== id)
    if (filtered.length === list.length) {
      throw new Error('No existe un recuerdo propio con ese identificador.')
    }
    if (list.find(m => m.id === id)?.userId !== userId) {
      throw new Error('Solo puedes borrar recuerdos de tu propia cuenta.')
    }
    localStorage.setItem(LOCAL_STORAGE_BACKUP_KEY, JSON.stringify(filtered))
  }
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
