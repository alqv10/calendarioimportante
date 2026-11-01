import { getSupabaseClient } from './supabase'

export interface CalendarPairing {
  partnerId: string
}

async function getAuthenticatedClient() {
  const supabase = getSupabaseClient()
  if (!supabase) {
    throw new Error('Configura Supabase para emparejar calendarios.')
  }

  const { data, error } = await supabase.auth.getUser()
  if (error) throw new Error(`No se pudo validar la sesión: ${error.message}`)
  if (!data.user) throw new Error('Inicia sesión con una cuenta cloud para emparejar calendarios.')
  return supabase
}

export async function getCalendarPairing(): Promise<CalendarPairing | null> {
  const supabase = await getAuthenticatedClient()
  const { data, error } = await supabase
    .from('calendar_pairings')
    .select('partner_id')
    .maybeSingle()

  if (error) throw new Error(`No se pudo consultar el emparejamiento: ${error.message}`)
  return data ? { partnerId: data.partner_id } : null
}

export async function createCalendarPairInvite(): Promise<string> {
  const supabase = await getAuthenticatedClient()
  const { data, error } = await supabase.rpc('create_calendar_pair_invite')

  if (error) throw new Error(`No se pudo crear la invitación: ${error.message}`)
  if (typeof data !== 'string' || !/^[a-f0-9]{64}$/.test(data)) {
    throw new Error('El servidor devolvió un código de invitación inválido.')
  }
  return data
}

export async function acceptCalendarPairInvite(token: string): Promise<void> {
  const supabase = await getAuthenticatedClient()
  const normalizedToken = token.trim().toLowerCase()
  if (!/^[a-f0-9]{64}$/.test(normalizedToken)) {
    throw new Error('El código debe contener los 64 caracteres de la invitación.')
  }

  const { error } = await supabase.rpc('accept_calendar_pair_invite', {
    invite_token: normalizedToken
  })
  if (error) throw new Error(`No se pudo aceptar la invitación: ${error.message}`)
}

export async function disconnectCalendarPairing(): Promise<void> {
  const supabase = await getAuthenticatedClient()
  const { error } = await supabase.rpc('disconnect_calendar_pairing')

  if (error) throw new Error(`No se pudo desvincular el calendario: ${error.message}`)
}
