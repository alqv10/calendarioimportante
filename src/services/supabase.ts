import { createClient, SupabaseClient } from '@supabase/supabase-js'

const SUPABASE_URL_KEY = 'momentos_supabase_url'
const SUPABASE_ANON_KEY = 'momentos_supabase_anon_key'

// Default public sandbox or user custom connection
export function getSavedSupabaseConfig(): { url: string; anonKey: string } | null {
  const url = localStorage.getItem(SUPABASE_URL_KEY)
  const anonKey = localStorage.getItem(SUPABASE_ANON_KEY)
  if (url && anonKey) {
    return { url, anonKey }
  }
  return null
}

export function saveSupabaseConfig(url: string, anonKey: string): void {
  localStorage.setItem(SUPABASE_URL_KEY, url.trim())
  localStorage.setItem(SUPABASE_ANON_KEY, anonKey.trim())
}

export function clearSupabaseConfig(): void {
  localStorage.removeItem(SUPABASE_URL_KEY)
  localStorage.removeItem(SUPABASE_ANON_KEY)
}

let supabaseInstance: SupabaseClient | null = null

export function getSupabaseClient(): SupabaseClient | null {
  const config = getSavedSupabaseConfig()
  if (!config) return null

  if (!supabaseInstance) {
    try {
      supabaseInstance = createClient(config.url, config.anonKey)
    } catch (err) {
      console.warn('Failed to initialize Supabase client', err)
      return null
    }
  }
  return supabaseInstance
}

export function isCloudDatabaseConnected(): boolean {
  return !!getSavedSupabaseConfig()
}
