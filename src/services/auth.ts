import type { UserProfile } from '../types'
import { getSupabaseClient } from './supabase'

const USERS_STORAGE_KEY = 'momentos_app_users'
const CURRENT_USER_KEY = 'momentos_app_current_user'

function withoutStoredPassword(user: UserProfile): UserProfile {
  const legacyUser = user as UserProfile & { password?: string }
  const { password: _password, ...profile } = legacyUser
  return profile
}

export function getAllUsersLocal(): UserProfile[] {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY)
    if (!raw) return []

    const storedUsers = JSON.parse(raw) as UserProfile[]
    const users = storedUsers.map(withoutStoredPassword)
    if (JSON.stringify(storedUsers) !== JSON.stringify(users)) {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users))
    }
    return users
  } catch {
    return []
  }
}

export function getCurrentUser(): UserProfile | null {
  try {
    const raw = localStorage.getItem(CURRENT_USER_KEY)
    if (!raw) return null
    const user = withoutStoredPassword(JSON.parse(raw) as UserProfile)
    if (!getAllUsersLocal().some(localUser => localUser.id === user.id)) {
      localStorage.removeItem(CURRENT_USER_KEY)
      return null
    }
    if (JSON.stringify(JSON.parse(raw)) !== JSON.stringify(user)) {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user))
    }
    return user
  } catch {
    return null
  }
}

export function setCurrentUser(user: UserProfile | null): void {
  if (!user) {
    localStorage.removeItem(CURRENT_USER_KEY)
  } else {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(withoutStoredPassword(user)))
  }
}

async function getCloudProfile(userId: string): Promise<UserProfile> {
  const supabase = getSupabaseClient()
  if (!supabase) throw new Error('La conexión con la nube no está configurada.')

  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, username, partner_name, avatar_emoji, created_at')
    .eq('id', userId)
    .single()

  if (error) throw new Error(`No se pudo cargar tu perfil: ${error.message}`)
  if (!data) throw new Error('No existe el perfil de esta cuenta en la base de datos.')

  const profile: UserProfile = {
    id: data.id,
    name: data.name,
    username: data.username,
    partnerName: data.partner_name,
    avatarEmoji: data.avatar_emoji || '💖',
    createdAt: data.created_at
  }
  setCurrentUser(profile)
  return profile
}

export async function restoreCurrentUser(): Promise<UserProfile | null> {
  const supabase = getSupabaseClient()
  if (!supabase) return getCurrentUser()

  const { data, error } = await supabase.auth.getSession()
  if (error) throw new Error(`No se pudo restaurar la sesión: ${error.message}`)
  if (!data.session) {
    setCurrentUser(null)
    return null
  }

  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError) throw new Error(`No se pudo validar la sesión: ${userError.message}`)
  if (!userData.user) {
    setCurrentUser(null)
    return null
  }
  return getCloudProfile(userData.user.id)
}

export async function registerUser(
  name: string,
  username: string,
  partnerName: string | undefined,
  avatarEmoji: string,
  email?: string,
  password?: string
): Promise<{ user: UserProfile | null; message?: string }> {
  const cleanUsername = username.trim().toLowerCase()
  const supabase = getSupabaseClient()

  if (supabase) {
    if (!email?.trim() || !password) {
      throw new Error('Ingresa un correo y una contraseña para crear una cuenta en la nube.')
    }

    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: {
          name: name.trim(),
          username: cleanUsername,
          partner_name: partnerName?.trim() || '',
          avatar_emoji: avatarEmoji || '💖'
        }
      }
    })

    if (error) throw new Error(error.message)
    if (!data.user) throw new Error('Supabase no devolvió la cuenta creada.')
    if (!data.session) {
      return {
        user: null,
        message: 'Revisa tu correo y confirma la cuenta antes de iniciar sesión.'
      }
    }

    return { user: await getCloudProfile(data.user.id) }
  }

  const localUsers = getAllUsersLocal()
  if (localUsers.some(user => user.username === cleanUsername)) {
    throw new Error('Ese nombre de usuario ya está registrado en este equipo.')
  }

  const newUser: UserProfile = {
    id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    name: name.trim(),
    username: cleanUsername,
    partnerName: partnerName?.trim() || '',
    avatarEmoji: avatarEmoji || '💖',
    createdAt: Date.now()
  }
  localUsers.push(newUser)
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(localUsers))
  setCurrentUser(newUser)
  return { user: newUser }
}

export async function loginUser(
  usernameOrEmail: string,
  password?: string
): Promise<UserProfile> {
  const supabase = getSupabaseClient()

  if (supabase) {
    if (!password) throw new Error('Ingresa tu contraseña.')

    const { data, error } = await supabase.auth.signInWithPassword({
      email: usernameOrEmail.trim().toLowerCase(),
      password
    })
    if (error) throw new Error(error.message)
    if (!data.user) throw new Error('Supabase no devolvió la cuenta iniciada.')
    return getCloudProfile(data.user.id)
  }

  const cleanUsername = usernameOrEmail.trim().toLowerCase()
  const localUser = getAllUsersLocal().find(user => user.username === cleanUsername)
  if (!localUser) {
    throw new Error('Usuario local no encontrado. ¿Deseas crear un perfil en este equipo?')
  }

  setCurrentUser(localUser)
  return localUser
}

export async function logoutUser(): Promise<void> {
  const supabase = getSupabaseClient()
  if (supabase) {
    const { error } = await supabase.auth.signOut()
    if (error) throw new Error(`No se pudo cerrar la sesión: ${error.message}`)
  }
  setCurrentUser(null)
}
