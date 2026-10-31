export type CategoryType = 
  | 'cita'
  | 'aniversario'
  | 'viaje'
  | 'concierto'
  | 'salida'
  | 'hogar'
  | 'logro'
  | 'sorpresa'
  | 'otro'

export interface MemoryPhoto {
  id: string
  url: string // Base64 data URL or external URL
  caption?: string
}

export interface MemoryMoment {
  id: string
  title: string
  date: string // ISO format YYYY-MM-DD
  time?: string // HH:mm optional
  category: CategoryType
  emoji: string
  description: string
  location?: string
  photos: MemoryPhoto[]
  feeling?: 'amor' | 'feliz' | 'divertido' | 'emocionante' | 'nostalgico' | 'magico'
  isMilestone?: boolean
  createdAt: number
  updatedAt: number
}

export interface CategoryMeta {
  key: CategoryType
  label: string
  emoji: string
  color: string // Tailwind bg class
  textColor: string // Tailwind text class
  borderColor: string
  badgeBg: string
}

export const CATEGORIES: Record<CategoryType, CategoryMeta> = {
  cita: {
    key: 'cita',
    label: 'Primera Cita & Citas',
    emoji: '🌹',
    color: 'bg-rose-500',
    textColor: 'text-rose-700',
    borderColor: 'border-rose-200',
    badgeBg: 'bg-rose-100/90 text-rose-700'
  },
  aniversario: {
    key: 'aniversario',
    label: 'Aniversario & Hito',
    emoji: '💍',
    color: 'bg-amber-500',
    textColor: 'text-amber-700',
    borderColor: 'border-amber-200',
    badgeBg: 'bg-amber-100/90 text-amber-800'
  },
  viaje: {
    key: 'viaje',
    label: 'Viaje o Escapada',
    emoji: '✈️',
    color: 'bg-sky-500',
    textColor: 'text-sky-700',
    borderColor: 'border-sky-200',
    badgeBg: 'bg-sky-100/90 text-sky-700'
  },
  concierto: {
    key: 'concierto',
    label: 'Concierto / Evento',
    emoji: '🎵',
    color: 'bg-purple-500',
    textColor: 'text-purple-700',
    borderColor: 'border-purple-200',
    badgeBg: 'bg-purple-100/90 text-purple-700'
  },
  salida: {
    key: 'salida',
    label: 'Salida o Comida',
    emoji: '☕',
    color: 'bg-emerald-500',
    textColor: 'text-emerald-700',
    borderColor: 'border-emerald-200',
    badgeBg: 'bg-emerald-100/90 text-emerald-700'
  },
  hogar: {
    key: 'hogar',
    label: 'Momento en Casa',
    emoji: '🏡',
    color: 'bg-orange-500',
    textColor: 'text-orange-700',
    borderColor: 'border-orange-200',
    badgeBg: 'bg-orange-100/90 text-orange-700'
  },
  logro: {
    key: 'logro',
    label: 'Logro Especial',
    emoji: '🎓',
    color: 'bg-indigo-500',
    textColor: 'text-indigo-700',
    borderColor: 'border-indigo-200',
    badgeBg: 'bg-indigo-100/90 text-indigo-700'
  },
  sorpresa: {
    key: 'sorpresa',
    label: 'Sorpresa / Regalo',
    emoji: '🎁',
    color: 'bg-pink-500',
    textColor: 'text-pink-700',
    borderColor: 'border-pink-200',
    badgeBg: 'bg-pink-100/90 text-pink-700'
  },
  otro: {
    key: 'otro',
    label: 'Recuerdo Bonito',
    emoji: '✨',
    color: 'bg-teal-500',
    textColor: 'text-teal-700',
    borderColor: 'border-teal-200',
    badgeBg: 'bg-teal-100/90 text-teal-700'
  }
}

export type ViewMode = 'calendar' | 'timeline' | 'milestones'
