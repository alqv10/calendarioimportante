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

export interface UserProfile {
  id: string
  name: string
  username: string
  password?: string
  avatarEmoji: string
  partnerName?: string
  createdAt: number
}

export interface MemoryPhoto {
  id: string
  url: string // Base64 data URL or external URL
  caption?: string
}

export interface MemoryMoment {
  id: string
  userId?: string // Associated user account
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
  
  // Music fields
  songTitle?: string
  songArtist?: string
  songUrl?: string // External Spotify/YouTube link
  audioData?: string // Base64 audio file (.mp3, .wav, .m4a)
  
  createdAt: number
  updatedAt: number
}

export interface CategoryMeta {
  key: CategoryType
  label: string
  emoji: string
  color: string
  textColor: string
  borderColor: string
  badgeBg: string
  darkBadgeBg: string
}

export const CATEGORIES: Record<CategoryType, CategoryMeta> = {
  cita: {
    key: 'cita',
    label: 'Primera Cita & Citas',
    emoji: '🌹',
    color: 'bg-rose-500',
    textColor: 'text-rose-700 dark:text-rose-400',
    borderColor: 'border-rose-200 dark:border-rose-900/50',
    badgeBg: 'bg-rose-100/90 text-rose-700',
    darkBadgeBg: 'dark:bg-rose-950/60 dark:text-rose-300'
  },
  aniversario: {
    key: 'aniversario',
    label: 'Aniversario & Hito',
    emoji: '💍',
    color: 'bg-amber-500',
    textColor: 'text-amber-700 dark:text-amber-400',
    borderColor: 'border-amber-200 dark:border-amber-900/50',
    badgeBg: 'bg-amber-100/90 text-amber-800',
    darkBadgeBg: 'dark:bg-amber-950/60 dark:text-amber-300'
  },
  viaje: {
    key: 'viaje',
    label: 'Viaje o Escapada',
    emoji: '✈️',
    color: 'bg-sky-500',
    textColor: 'text-sky-700 dark:text-sky-400',
    borderColor: 'border-sky-200 dark:border-sky-900/50',
    badgeBg: 'bg-sky-100/90 text-sky-700',
    darkBadgeBg: 'dark:bg-sky-950/60 dark:text-sky-300'
  },
  concierto: {
    key: 'concierto',
    label: 'Concierto / Evento',
    emoji: '🎵',
    color: 'bg-purple-500',
    textColor: 'text-purple-700 dark:text-purple-400',
    borderColor: 'border-purple-200 dark:border-purple-900/50',
    badgeBg: 'bg-purple-100/90 text-purple-700',
    darkBadgeBg: 'dark:bg-purple-950/60 dark:text-purple-300'
  },
  salida: {
    key: 'salida',
    label: 'Salida o Comida',
    emoji: '☕',
    color: 'bg-emerald-500',
    textColor: 'text-emerald-700 dark:text-emerald-400',
    borderColor: 'border-emerald-200 dark:border-emerald-900/50',
    badgeBg: 'bg-emerald-100/90 text-emerald-700',
    darkBadgeBg: 'dark:bg-emerald-950/60 dark:text-emerald-300'
  },
  hogar: {
    key: 'hogar',
    label: 'Momento en Casa',
    emoji: '🏡',
    color: 'bg-orange-500',
    textColor: 'text-orange-700 dark:text-orange-400',
    borderColor: 'border-orange-200 dark:border-orange-900/50',
    badgeBg: 'bg-orange-100/90 text-orange-700',
    darkBadgeBg: 'dark:bg-orange-950/60 dark:text-orange-300'
  },
  logro: {
    key: 'logro',
    label: 'Logro Especial',
    emoji: '🎓',
    color: 'bg-indigo-500',
    textColor: 'text-indigo-700 dark:text-indigo-400',
    borderColor: 'border-indigo-200 dark:border-indigo-900/50',
    badgeBg: 'bg-indigo-100/90 text-indigo-700',
    darkBadgeBg: 'dark:bg-indigo-950/60 dark:text-indigo-300'
  },
  sorpresa: {
    key: 'sorpresa',
    label: 'Sorpresa / Regalo',
    emoji: '🎁',
    color: 'bg-pink-500',
    textColor: 'text-pink-700 dark:text-pink-400',
    borderColor: 'border-pink-200 dark:border-pink-900/50',
    badgeBg: 'bg-pink-100/90 text-pink-700',
    darkBadgeBg: 'dark:bg-pink-950/60 dark:text-pink-300'
  },
  otro: {
    key: 'otro',
    label: 'Recuerdo Bonito',
    emoji: '✨',
    color: 'bg-teal-500',
    textColor: 'text-teal-700 dark:text-teal-400',
    borderColor: 'border-teal-200 dark:border-teal-900/50',
    badgeBg: 'bg-teal-100/90 text-teal-700',
    darkBadgeBg: 'dark:bg-teal-950/60 dark:text-teal-300'
  }
}

export type ViewMode = 'calendar' | 'timeline' | 'milestones'
