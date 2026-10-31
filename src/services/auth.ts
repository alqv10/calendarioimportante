import type { UserProfile } from '../types'

const USERS_STORAGE_KEY = 'momentos_app_users'
const CURRENT_USER_KEY = 'momentos_app_current_user'

export function getAllUsers(): UserProfile[] {
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

export function registerUser(
  name: string,
  username: string,
  password?: string,
  partnerName?: string,
  avatarEmoji: string = '💖'
): UserProfile {
  const users = getAllUsers()
  const cleanUsername = username.trim().toLowerCase()

  const existing = users.find(u => u.username.toLowerCase() === cleanUsername)
  if (existing) {
    throw new Error('Ese nombre de usuario ya está registrado.')
  }

  const newUser: UserProfile = {
    id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    name: name.trim(),
    username: cleanUsername,
    password: password?.trim() || '',
    partnerName: partnerName?.trim() || 'Grace',
    avatarEmoji: avatarEmoji || '💖',
    createdAt: Date.now()
  }

  users.push(newUser)
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users))
  setCurrentUser(newUser)
  return newUser
}

export function loginUser(username: string, password?: string): UserProfile {
  const users = getAllUsers()
  const cleanUsername = username.trim().toLowerCase()

  const user = users.find(u => u.username.toLowerCase() === cleanUsername)
  if (!user) {
    throw new Error('Usuario no encontrado. ¿Deseas crear una cuenta nueva?')
  }

  if (user.password && user.password !== (password?.trim() || '')) {
    throw new Error('Contraseña incorrecta.')
  }

  setCurrentUser(user)
  return user
}

export function logoutUser(): void {
  localStorage.removeItem(CURRENT_USER_KEY)
}
