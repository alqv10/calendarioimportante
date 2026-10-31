import type { MemoryMoment } from '../types'

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

export async function getAllMemories(): Promise<MemoryMoment[]> {
  try {
    const db = await openDB()
    return new Promise((resolve) => {
      const transaction = db.transaction(STORE_NAME, 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.getAll()

      request.onsuccess = () => {
        let results = request.result as MemoryMoment[]
        if (!results || results.length === 0) {
          // Check if initialized before
          const initialized = localStorage.getItem('momentos_initialized')
          if (!initialized) {
            // Seed with sample moments
            seedInitialMemories().then(seeded => resolve(seeded))
            return
          }
          resolve([])
        } else {
          // Sort descending by date
          results.sort((a, b) => b.date.localeCompare(a.date))
          resolve(results)
        }
      }

      request.onerror = () => {
        // Fallback to localStorage
        const stored = localStorage.getItem(LOCAL_STORAGE_BACKUP_KEY)
        resolve(stored ? JSON.parse(stored) : INITIAL_MEMORIES)
      }
    })
  } catch (err) {
    console.warn('IndexedDB error, using localStorage fallback', err)
    const stored = localStorage.getItem(LOCAL_STORAGE_BACKUP_KEY)
    if (!stored) {
      localStorage.setItem(LOCAL_STORAGE_BACKUP_KEY, JSON.stringify(INITIAL_MEMORIES))
      return INITIAL_MEMORIES
    }
    return JSON.parse(stored)
  }
}

export async function seedInitialMemories(): Promise<MemoryMoment[]> {
  try {
    const db = await openDB()
    const transaction = db.transaction(STORE_NAME, 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    for (const item of INITIAL_MEMORIES) {
      store.put(item)
    }
    localStorage.setItem('momentos_initialized', 'true')
  } catch (e) {
    localStorage.setItem(LOCAL_STORAGE_BACKUP_KEY, JSON.stringify(INITIAL_MEMORIES))
  }
  return INITIAL_MEMORIES
}

export async function saveMemory(moment: MemoryMoment): Promise<void> {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.put(moment)

      request.onsuccess = () => {
        localStorage.setItem('momentos_initialized', 'true')
        resolve()
      }
      request.onerror = () => reject(request.error)
    })
  } catch (e) {
    const list = await getAllMemories()
    const index = list.findIndex(m => m.id === moment.id)
    if (index >= 0) {
      list[index] = moment
    } else {
      list.unshift(moment)
    }
    localStorage.setItem(LOCAL_STORAGE_BACKUP_KEY, JSON.stringify(list))
  }
}

export async function deleteMemory(id: string): Promise<void> {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.delete(id)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  } catch (e) {
    const list = await getAllMemories()
    const filtered = list.filter(m => m.id !== id)
    localStorage.setItem(LOCAL_STORAGE_BACKUP_KEY, JSON.stringify(filtered))
  }
}

export async function exportMemoriesJSON(): Promise<string> {
  const memories = await getAllMemories()
  return JSON.stringify({
    version: '1.0',
    exportDate: new Date().toISOString(),
    total: memories.length,
    memories
  }, null, 2)
}

export async function importMemoriesJSON(jsonString: string): Promise<number> {
  try {
    const parsed = JSON.parse(jsonString)
    const items: MemoryMoment[] = Array.isArray(parsed) ? parsed : (parsed.memories || [])
    if (!Array.isArray(items)) throw new Error('Formato inválido')

    for (const item of items) {
      if (item.id && item.title && item.date) {
        await saveMemory(item)
      }
    }
    return items.length
  } catch (err) {
    throw new Error('El archivo no tiene un formato válido de recuerdos.')
  }
}
