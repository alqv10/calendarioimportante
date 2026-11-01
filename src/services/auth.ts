import type { UserProfile } from '../types'
import { getSupabaseClient } from './supabase'

const CURRENT_USER_KEY = 'momentos_app_current_user'

function clearStoredUser(): void {
  localStorage.removeItem(CURRENT_USER_KEY)
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
  return profile
}

export async function restoreCurrentUser(): Promise<UserProfile | null> {
  clearStoredUser()
  const supabase = getSupabaseClient()
  if (!supabase) {
    return null
  }

  const { data, error } = await supabase.auth.getSession()
  if (error) throw new Error(`No se pudo restaurar la sesión: ${error.message}`)
  if (!data.session) {
    clearStoredUser()
    return null
  }

  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError) throw new Error(`No se pudo validar la sesión: ${userError.message}`)
  if (!userData.user) {
    clearStoredUser()
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

  if (!supabase) {
    throw new Error('Configura Supabase para crear una cuenta protegida.')
  }
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

export async function loginUser(
  usernameOrEmail: string,
  password?: string
): Promise<UserProfile> {
  const supabase = getSupabaseClient()

  if (!supabase) throw new Error('Configura Supabase para iniciar sesión.')
  if (!password) throw new Error('Ingresa tu contraseña.')

  const { data, error } = await supabase.auth.signInWithPassword({
    email: usernameOrEmail.trim().toLowerCase(),
    password
  })
  if (error) throw new Error(error.message)
  if (!data.user) throw new Error('Supabase no devolvió la cuenta iniciada.')
  return getCloudProfile(data.user.id)
}

export async function logoutUser(): Promise<void> {
  const supabase = getSupabaseClient()
  if (supabase) {
    const { error } = await supabase.auth.signOut()
    if (error) throw new Error(`No se pudo cerrar la sesión: ${error.message}`)
  }
  clearStoredUser()
}
