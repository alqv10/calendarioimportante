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

export const INITIAL_MEMORIES: MemoryMoment[] = [
  {
    id: 'demo-1',
    title: 'Nuestra Primera Cita ☕✨',
    date: '2024-02-14',
    category: 'cita',
    emoji: '🌹',
    description: 'Nos vimos en la cafetería del centro. Platicamos durante horas hasta que cerraron el lugar. ¡Los dos estábamos súper nerviosos pero felices!',
    location: 'Café & Libros del Centro',
    photos: [
      {
        id: 'p-1',
        url: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&w=800&q=80',
        caption: 'Las tazas de café y las risas nerviosas del inicio'
      }
    ],
    feeling: 'magico',
    isMilestone: true,
    songTitle: 'Perfect',
    songArtist: 'Ed Sheeran',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 300,
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 300
  },
  {
    id: 'demo-2',
    title: 'Primer Aniversario Juntos 🥂💖',
    date: '2025-02-14',
    category: 'aniversario',
    emoji: '💍',
    description: '¡Un año entero lleno de risas, apoyo incondicional y momentos inolvidables! Fuimos a cenar a la terraza con vista a la ciudad.',
    location: 'Mirador La Terraza',
    photos: [
      {
        id: 'p-2',
        url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=800&q=80',
        caption: 'Celebrando nuestro primer año'
      }
    ],
    feeling: 'amor',
    isMilestone: true,
    songTitle: 'Yellow',
    songArtist: 'Coldplay',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 60,
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 60
  },
  {
    id: 'demo-3',
    title: 'Escapada a la Playa al Atardecer 🌅🌊',
    date: '2024-08-10',
    category: 'viaje',
    emoji: '✈️',
    description: 'Manejamos hasta la costa sin planearlo mucho. Caminamos por la orilla comiendo helado mientras el cielo se pintaba de color naranja y morado.',
    location: 'Playa Costa Dorada',
    photos: [
      {
        id: 'p-3',
        url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
        caption: 'El atardecer más bonito del año'
      }
    ],
    feeling: 'feliz',
    isMilestone: false,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 150,
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 150
  }
]

export async function getAllMemories(userId?: string): Promise<MemoryMoment[]> {
  // 1. Try Supabase cloud first if connected
  const supabase = getSupabaseClient()
  if (supabase) {
    try {
      let query = supabase.from('memories').select('*')
      if (userId) {
        query = query.or(`user_id.eq.${userId},user_id.is.null`)
      }
      const { data, error } = await query.order('date', { ascending: false })

      if (!error && data && data.length > 0) {
        const cloudMemories: MemoryMoment[] = data.map(item => ({
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
        return cloudMemories
      }
    } catch (err) {
      console.warn('Supabase fetch error, fallback to IndexedDB', err)
    }
  }

  // 2. Local IndexedDB fallback
  try {
    const db = await openDB()
    return new Promise((resolve) => {
      const transaction = db.transaction(STORE_NAME, 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.getAll()

      request.onsuccess = () => {
        let results = request.result as MemoryMoment[]
        if (!results || results.length === 0) {
          const initialized = localStorage.getItem('momentos_initialized')
          if (!initialized) {
            seedInitialMemories(userId).then(seeded => resolve(seeded))
            return
          }
          resolve([])
        } else {
          if (userId) {
            results = results.filter(m => !m.userId || m.userId === userId)
          }
          results.sort((a, b) => b.date.localeCompare(a.date))
          resolve(results)
        }
      }

      request.onerror = () => {
        const stored = localStorage.getItem(LOCAL_STORAGE_BACKUP_KEY)
        let list: MemoryMoment[] = stored ? JSON.parse(stored) : INITIAL_MEMORIES
        if (userId) {
          list = list.filter(m => !m.userId || m.userId === userId)
        }
        resolve(list)
      }
    })
  } catch (err) {
    console.warn('IndexedDB error, using localStorage fallback', err)
    const stored = localStorage.getItem(LOCAL_STORAGE_BACKUP_KEY)
    if (!stored) {
      localStorage.setItem(LOCAL_STORAGE_BACKUP_KEY, JSON.stringify(INITIAL_MEMORIES))
      return INITIAL_MEMORIES
    }
    let list: MemoryMoment[] = JSON.parse(stored)
    if (userId) {
      list = list.filter(m => !m.userId || m.userId === userId)
    }
    return list
  }
}

export async function seedInitialMemories(userId?: string): Promise<MemoryMoment[]> {
  const seeded = INITIAL_MEMORIES.map(m => ({ ...m, userId }))
  try {
    const db = await openDB()
    const transaction = db.transaction(STORE_NAME, 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    for (const item of seeded) {
      store.put(item)
    }
    localStorage.setItem('momentos_initialized', 'true')
  } catch {
    localStorage.setItem(LOCAL_STORAGE_BACKUP_KEY, JSON.stringify(seeded))
  }
  return seeded
}

export async function saveMemory(moment: MemoryMoment, userId?: string): Promise<void> {
  const itemToSave: MemoryMoment = {
    ...moment,
    userId: moment.userId || userId
  }

  // 1. Supabase Cloud Sync
  const supabase = getSupabaseClient()
  if (supabase) {
    try {
      await supabase.from('memories').upsert({
        id: itemToSave.id,
        user_id: itemToSave.userId || null,
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
    } catch (err) {
      console.warn('Supabase upsert error', err)
    }
  }

  // 2. Local IndexedDB Cache
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.put(itemToSave)

      request.onsuccess = () => {
        localStorage.setItem('momentos_initialized', 'true')
        resolve()
      }
      request.onerror = () => reject(request.error)
    })
  } catch {
    const list = await getAllMemories(userId)
    const index = list.findIndex(m => m.id === itemToSave.id)
    if (index >= 0) {
      list[index] = itemToSave
    } else {
      list.unshift(itemToSave)
    }
    localStorage.setItem(LOCAL_STORAGE_BACKUP_KEY, JSON.stringify(list))
  }
}

export async function deleteMemory(id: string): Promise<void> {
  const supabase = getSupabaseClient()
  if (supabase) {
    try {
      await supabase.from('memories').delete().eq('id', id)
    } catch (err) {
      console.warn('Supabase delete error', err)
    }
  }

  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.delete(id)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  } catch {
    const list = await getAllMemories()
    const filtered = list.filter(m => m.id !== id)
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
  try {
    const parsed = JSON.parse(jsonString)
    const items: MemoryMoment[] = Array.isArray(parsed) ? parsed : (parsed.memories || [])
    if (!Array.isArray(items)) throw new Error('Formato inválido')

    for (const item of items) {
      if (item.id && item.title && item.date) {
        await saveMemory({ ...item, userId: userId || item.userId }, userId)
      }
    }
    return items.length
  } catch {
    throw new Error('El archivo no tiene un formato válido de recuerdos.')
  }
}
