import { useState, useEffect } from 'react'
import { X, Database, Check, ExternalLink, Copy, CloudOff } from 'lucide-react'
import { getSavedSupabaseConfig, saveSupabaseConfig, clearSupabaseConfig } from '../services/supabase'

interface CloudConfigModalProps {
  isOpen: boolean
  onClose: () => void
  onConfigChanged: () => void
}

export const CloudConfigModal: React.FC<CloudConfigModalProps> = ({
  isOpen,
  onClose,
  onConfigChanged
}) => {
  const [url, setUrl] = useState('')
  const [anonKey, setAnonKey] = useState('')
  const [copied, setCopied] = useState(false)
  const isConnected = !!getSavedSupabaseConfig()

  useEffect(() => {
    const config = getSavedSupabaseConfig()
    if (config) {
      setUrl(config.url)
      setAnonKey(config.anonKey)
    } else {
      setUrl('')
      setAnonKey('')
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.trim() || !anonKey.trim()) {
      alert('Por favor ingresa la URL y la Anon Key de Supabase.')
      return
    }

    saveSupabaseConfig(url, anonKey)
    onConfigChanged()
    onClose()
  }

  const handleDisconnect = () => {
    if (window.confirm('¿Desconectar la base de datos en la nube y volver al modo local?')) {
      clearSupabaseConfig()
      setUrl('')
      setAnonKey('')
      onConfigChanged()
      onClose()
    }
  }

  const handleCopySQL = () => {
    const sql = `-- Tabla de Perfiles
create table if not exists public.profiles (
  id text primary key,
  name text not null,
  username text not null unique,
  password text,
  partner_name text default 'Grace',
  avatar_emoji text default '💖',
  created_at bigint not null
);

-- Tabla de Recuerdos
create table if not exists public.memories (
  id text primary key,
  user_id text references public.profiles(id) on delete cascade,
  title text not null,
  date text not null,
  category text not null,
  emoji text not null,
  description text default '',
  location text,
  feeling text,
  is_milestone boolean default false,
  song_title text,
  song_artist text,
  song_url text,
  photos jsonb default '[]'::jsonb,
  audio_data text,
  created_at bigint not null,
  updated_at bigint not null
);

alter table public.profiles enable row level security;
alter table public.memories enable row level security;
create policy "acceso_perfiles" on public.profiles for all using (true) with check (true);
create policy "acceso_recuerdos" on public.memories for all using (true) with check (true);`

    navigator.clipboard.writeText(sql)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-lg bg-white dark:bg-[#191720] rounded-2xl border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden my-6">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-500 p-5 sm:p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Database className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold font-sans">
                  Base de Datos en la Nube
                </h3>
                <span className="text-xs text-emerald-100">
                  {isConnected ? '🟢 Conectado con Supabase (PostgreSQL)' : '🟡 Modo Local (IndexedDB)'}
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-white/20 text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-5 sm:p-6 space-y-4">
          <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
            Conecta tu proyecto con <strong>Supabase (gratis)</strong> para que múltiples personas puedan crear cuentas, sincronizar recuerdos en tiempo real y acceder desde cualquier teléfono o computadora.
          </p>

          <form onSubmit={handleSave} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1">
                Project URL (Supabase)
              </label>
              <input
                type="url"
                required
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="https://xyzcompany.supabase.co"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 text-xs sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1">
                Anon Public API Key
              </label>
              <input
                type="password"
                required
                value={anonKey}
                onChange={e => setAnonKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 text-xs sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </div>

            {/* Quick SQL Copy box */}
            <div className="p-3 bg-stone-50 dark:bg-stone-900/60 rounded-xl border border-stone-200 dark:border-stone-800 flex items-center justify-between gap-3">
              <div className="text-xs text-stone-600 dark:text-stone-400">
                <span className="font-bold text-stone-900 dark:text-stone-200 block">Esquema SQL de Tablas</span>
                Copia y pega en el SQL Editor de Supabase
              </div>
              <button
                type="button"
                onClick={handleCopySQL}
                className="px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 text-xs font-bold flex items-center gap-1 hover:bg-emerald-100 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copiado' : 'Copiar SQL'}</span>
              </button>
            </div>

            <div className="pt-2 flex items-center justify-between gap-2">
              {isConnected ? (
                <button
                  type="button"
                  onClick={handleDisconnect}
                  className="px-3 py-2 rounded-xl border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 hover:bg-rose-50 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <CloudOff className="w-3.5 h-3.5" />
                  <span>Desconectar Nube</span>
                </button>
              ) : (
                <a
                  href="https://supabase.com"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-emerald-600 hover:underline flex items-center gap-1"
                >
                  <span>Crear cuenta en Supabase</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}

              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer"
              >
                Guardar Conexión Nube
              </button>
            </div>
          </form>

        </div>

      </div>
    </div>
  )
}
