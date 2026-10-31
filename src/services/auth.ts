import type { UserProfile } from '../types'
import { getSupabaseClient } from './supabase'

const USERS_STORAGE_KEY = 'momentos_app_users'
const CURRENT_USER_KEY = 'momentos_app_current_user'

export function getAllUsersLocal(): UserProfile[] {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw)
  } catch {
    return []
  }
}

export function getCurrentUser(): UserProfile | null {
  try {
    const raw = localStorage.getItem(CURRENT_USER_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function setCurrentUser(user: UserProfile | null): void {
  if (!user) {
    localStorage.removeItem(CURRENT_USER_KEY)
  } else {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user))
  }
}

export async function registerUser(
  name: string,
  username: string,
  password?: string,
  partnerName?: string,
  avatarEmoji: string = '💖'
): Promise<UserProfile> {
  const cleanUsername = username.trim().toLowerCase()
  const newUser: UserProfile = {
    id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    name: name.trim(),
    username: cleanUsername,
    password: password?.trim() || '',
    partnerName: partnerName?.trim() || 'Grace',
    avatarEmoji: avatarEmoji || '💖',
    createdAt: Date.now()
  }

  // 1. If Supabase cloud database is connected, persist to PostgreSQL
  const supabase = getSupabaseClient()
  if (supabase) {
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', cleanUsername)
      .maybeSingle()

    if (existing) {
      throw new Error('Ese nombre de usuario ya está registrado en la nube.')
    }

    const { error } = await supabase.from('profiles').insert([{
      id: newUser.id,
      name: newUser.name,
      username: newUser.username,
      password: newUser.password,
      partner_name: newUser.partnerName,
      avatar_emoji: newUser.avatarEmoji,
      created_at: newUser.createdAt
    }])

    if (error) {
      console.warn('Supabase profile insert error', error)
    }
  }

  // 2. Also save to local storage cache
  const localUsers = getAllUsersLocal()
  const existingLocal = localUsers.find(u => u.username.toLowerCase() === cleanUsername)
  if (!supabase && existingLocal) {
    throw new Error('Ese nombre de usuario ya está registrado en este equipo.')
  }
  localUsers.push(newUser)
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(localUsers))

  setCurrentUser(newUser)
  return newUser
}

export async function loginUser(username: string, password?: string): Promise<UserProfile> {
  const cleanUsername = username.trim().toLowerCase()
  const pass = password?.trim() || ''

  // 1. Try Supabase cloud first
  const supabase = getSupabaseClient()
  if (supabase) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', cleanUsername)
      .maybeSingle()

    if (error) {
      console.warn('Supabase login check error', error)
    }

    if (data) {
      if (data.password && data.password !== pass) {
        throw new Error('Contraseña incorrecta.')
      }
      const cloudUser: UserProfile = {
        id: data.id,
        name: data.name,
        username: data.username,
        password: data.password,
        partnerName: data.partner_name,
        avatarEmoji: data.avatar_emoji || '💖',
        createdAt: data.created_at
      }
      setCurrentUser(cloudUser)
      return cloudUser
    }
  }

  // 2. Fallback to local accounts
  const users = getAllUsersLocal()
  const localUser = users.find(u => u.username.toLowerCase() === cleanUsername)
  if (!localUser) {
    throw new Error('Usuario no encontrado. ¿Deseas crear una cuenta nueva?')
  }

  if (localUser.password && localUser.password !== pass) {
    throw new Error('Contraseña incorrecta.')
  }

  setCurrentUser(localUser)
  return localUser
}

export function logoutUser(): void {
  localStorage.removeItem(CURRENT_USER_KEY)
}
