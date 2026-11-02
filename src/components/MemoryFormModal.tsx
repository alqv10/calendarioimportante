import { useState, useEffect, useRef } from 'react'
import type React from 'react'
import { X, Upload, Trash2, MapPin, Sparkles, Heart, Image as ImageIcon, Calendar, Music, Link2, Volume2 } from 'lucide-react'
import { CATEGORIES } from '../types'
import type { MemoryMoment, CategoryType, MemoryPhoto } from '../types'
import { todayISO } from '../utils/dateUtils'
import { Modal } from './Modal'

interface MemoryFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (moment: MemoryMoment) => void | Promise<void>
  initialDate?: string
  initialData?: MemoryMoment | null
}

const FEELINGS: { key: NonNullable<MemoryMoment['feeling']>; label: string; emoji: string }[] = [
  { key: 'amor', label: 'Amor puro', emoji: '💖' },
  { key: 'magico', label: 'Mágico', emoji: '✨' },
  { key: 'feliz', label: 'Súper Feliz', emoji: '🥰' },
  { key: 'divertido', label: 'Divertido & Risas', emoji: '😂' },
  { key: 'emocionante', label: 'Emocionante', emoji: '🥳' },
  { key: 'nostalgico', label: 'Inolvidable', emoji: '🥹' },
]

const MAX_PHOTO_SIZE = 20 * 1024 * 1024
const MAX_RAW_PHOTO_SIZE = 100 * 1024 * 1024
const MAX_PHOTO_DIMENSION = 1920
const RAW_PHOTO_EXTENSIONS = new Set([
  'raw', '3fr', 'ari', 'arw', 'bay', 'cap', 'cr2', 'cr3', 'crw', 'dcs',
  'dcr', 'dng', 'drf', 'eip', 'erf', 'fff', 'gpr', 'iiq', 'k25', 'kdc',
  'mef', 'mos', 'mrw', 'nef', 'nrw', 'obm', 'orf', 'pef', 'ptx', 'pxn',
  'raf', 'rwl', 'rw2', 'rwz', 'sr2', 'srf', 'srw', 'x3f'
])

function canvasToJpegDataUrl(source: HTMLCanvasElement): Promise<string> {
  const scale = Math.min(1, MAX_PHOTO_DIMENSION / Math.max(source.width, source.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(source.width * scale))
  canvas.height = Math.max(1, Math.round(source.height * scale))
  const context = canvas.getContext('2d')
  if (!context) return Promise.reject(new Error('El navegador no pudo procesar la imagen.'))

  context.fillStyle = '#fff'
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.drawImage(source, 0, 0, canvas.width, canvas.height)

  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => {
      if (!blob) {
        reject(new Error('No se pudo comprimir la imagen.'))
        return
      }

      const reader = new FileReader()
      reader.onload = () => {
        if (typeof reader.result !== 'string') {
          reject(new Error('No se pudo leer la imagen procesada.'))
          return
        }
        resolve(reader.result)
      }
      reader.onerror = () => reject(new Error('No se pudo leer la imagen procesada.'))
      reader.readAsDataURL(blob)
    }, 'image/jpeg', 0.82)
  })
}

function compressPhoto(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file)
    const image = new Image()

    image.onload = () => {
      URL.revokeObjectURL(objectUrl)
      if (!image.naturalWidth || !image.naturalHeight) {
        reject(new Error('El archivo no contiene una imagen válida.'))
        return
      }

      const canvas = document.createElement('canvas')
      canvas.width = image.naturalWidth
      canvas.height = image.naturalHeight
      const context = canvas.getContext('2d')
      if (!context) {
        reject(new Error('El navegador no pudo procesar la imagen.'))
        return
      }
      context.drawImage(image, 0, 0)
      canvasToJpegDataUrl(canvas).then(resolve, reject)
    }

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('El navegador no reconoce esta imagen. Si es RAW, verifica que su formato sea compatible.'))
    }
    image.src = objectUrl
  })
}

async function compressRawPhoto(file: File): Promise<string> {
  const [rawModule, coreUrl, wasmUrl, workerUrl] = await Promise.all([
    import('rawconvert-wasm/dist/worker-client.js'),
    import('rawconvert-wasm/dist/rawconvert-core.js?url'),
    import('rawconvert-wasm/dist/rawconvert-core.wasm?url'),
    import('rawconvert-wasm/dist/worker.js?url')
  ])
  const worker = await rawModule.RawConvertWorker.init({
    workerUrl: workerUrl.default,
    coreUrl: coreUrl.default,
    wasmUrl: wasmUrl.default
  })

  try {
    await worker.load(await file.arrayBuffer(), file.name)
    const image = await worker.process({ halfSize: true, outputBps: 8 })
    if (image.colors < 1 || image.colors > 4) {
      throw new Error('El decodificador devolvió un formato de color no compatible.')
    }

    const source = image.data
    const rgba = new Uint8ClampedArray(image.width * image.height * 4)
    for (let sourceIndex = 0, targetIndex = 0; targetIndex < rgba.length; sourceIndex += image.colors, targetIndex += 4) {
      if (image.colors === 1) {
        rgba[targetIndex] = source[sourceIndex]
        rgba[targetIndex + 1] = source[sourceIndex]
        rgba[targetIndex + 2] = source[sourceIndex]
      } else {
        rgba[targetIndex] = source[sourceIndex]
        rgba[targetIndex + 1] = source[sourceIndex + 1]
        rgba[targetIndex + 2] = source[sourceIndex + 2]
      }
      rgba[targetIndex + 3] = image.colors === 4 ? source[sourceIndex + 3] : 255
    }

    const canvas = document.createElement('canvas')
    canvas.width = image.width
    canvas.height = image.height
    const context = canvas.getContext('2d')
    if (!context) throw new Error('El navegador no pudo procesar la imagen RAW.')
    context.putImageData(new ImageData(rgba, image.width, image.height), 0, 0)
    return await canvasToJpegDataUrl(canvas)
  } finally {
    worker.dispose()
  }
}

export const MemoryFormModal: React.FC<MemoryFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialDate,
  initialData
}) => {
  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const [category, setCategory] = useState<CategoryType>('cita')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [feeling, setFeeling] = useState<MemoryMoment['feeling']>('amor')
  const [isMilestone, setIsMilestone] = useState(false)
  const [photos, setPhotos] = useState<MemoryPhoto[]>([])
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false)
  const [saveError, setSaveError] = useState('')

  // Music state
  const [songTitle, setSongTitle] = useState('')
  const [songArtist, setSongArtist] = useState('')
  const [songUrl, setSongUrl] = useState('')
  const [audioData, setAudioData] = useState<string | undefined>()
  const [audioFileName, setAudioFileName] = useState<string>('')
  const [audioPath, setAudioPath] = useState<string | undefined>()

  const fileInputRef = useRef<HTMLInputElement>(null)
  const audioInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title)
      setDate(initialData.date)
      setCategory(initialData.category)
      setDescription(initialData.description)
      setLocation(initialData.location || '')
      setFeeling(initialData.feeling || 'amor')
      setIsMilestone(!!initialData.isMilestone)
      setPhotos(initialData.photos || [])
      setSongTitle(initialData.songTitle || '')
      setSongArtist(initialData.songArtist || '')
      setSongUrl(initialData.songUrl || '')
      setAudioData(initialData.audioData)
      setAudioPath(initialData.audioPath)
      setAudioFileName(initialData.audioData ? 'Archivo de audio guardado' : '')
    } else {
      const defaultDate = initialDate || todayISO()
      setDate(defaultDate)
      setTitle('')
      setCategory('cita')
      setDescription('')
      setLocation('')
      setFeeling('amor')
      setIsMilestone(false)
      setPhotos([])
      setSongTitle('')
      setSongArtist('')
      setSongUrl('')
      setAudioData(undefined)
      setAudioPath(undefined)
      setAudioFileName('')
    }
  }, [initialData, initialDate, isOpen])

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.currentTarget
    const files = Array.from(input.files || [])
    if (files.length === 0) return

    setIsUploadingPhotos(true)
    setSaveError('')
    const newPhotos: MemoryPhoto[] = []
    const failedFiles: string[] = []

    for (const file of files) {
      try {
        const extension = file.name.split('.').pop()?.toLowerCase() || ''
        const isRaw = RAW_PHOTO_EXTENSIONS.has(extension)
        if (!isRaw && !file.type.startsWith('image/') && !['jpg', 'jpeg', 'jfif', 'png'].includes(extension)) {
          throw new Error('El archivo no es una imagen.')
        }
        const maxSize = isRaw ? MAX_RAW_PHOTO_SIZE : MAX_PHOTO_SIZE
        if (file.size > maxSize) {
          throw new Error(`La imagen supera el límite de ${isRaw ? '100' : '20'} MB.`)
        }

        const url = isRaw ? await compressRawPhoto(file) : await compressPhoto(file)
        newPhotos.push({
          id: `photo-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          url,
          caption: ''
        })
      } catch (error) {
        const reason = error instanceof Error ? error.message : 'No se pudo procesar.'
        failedFiles.push(`${file.name}: ${reason}`)
      }
    }

    try {
      setPhotos(prev => [...prev, ...newPhotos])
      if (failedFiles.length) {
        setSaveError(`No se pudieron cargar algunas fotos: ${failedFiles.join(' ')}`)
      }
    } finally {
      setIsUploadingPhotos(false)
      input.value = ''
    }
  }

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setAudioFileName(file.name)
    setAudioPath(undefined) // el archivo nuevo reemplaza al que hubiera en Storage
    const reader = new FileReader()
    reader.onload = (event) => {
      const base64 = event.target?.result as string
      setAudioData(base64)
      if (!songTitle) {
        // Auto-fill song title from file name
        const cleanName = file.name.replace(/\.[^/.]+$/, '')
        setSongTitle(cleanName)
      }
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const handleRemovePhoto = (id: string) => {
    setPhotos(prev => prev.filter(p => p.id !== id))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isUploadingPhotos) return
    setSaveError('')
    if (!title.trim() || !date) {
      alert('Por favor escribe un título y selecciona la fecha.')
      return
    }

    const selectedCategoryMeta = CATEGORIES[category]

    const moment: MemoryMoment = {
      id: initialData?.id || `moment-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title: title.trim(),
      date,
      category,
      emoji: selectedCategoryMeta.emoji,
      description: description.trim(),
      location: location.trim() || undefined,
      photos,
      feeling,
      isMilestone,
      songTitle: songTitle.trim() || undefined,
      songArtist: songArtist.trim() || undefined,
      songUrl: songUrl.trim() || undefined,
      audioData: audioData || undefined,
      audioPath,
      createdAt: initialData?.createdAt || Date.now(),
      updatedAt: Date.now()
    }

    try {
      await onSave(moment)
      onClose()
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'No se pudo guardar el recuerdo.')
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} label={initialData ? 'Editar recuerdo' : 'Nuevo recuerdo'}>
      
        {/* Header */}
        <div className="relative bg-gradient-to-r from-rose-500 via-rose-600 to-amber-500 p-5 sm:p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">✨</span>
              <h2 className="text-xl sm:text-2xl font-bold font-sans">
                {initialData ? 'Editar Recuerdo' : 'Nuevo Momento Especial'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-white/20 text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-rose-100 text-xs sm:text-sm mt-1">
            Guarda fecha, fotos, música, lugar y lo que sintieron ese día
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-5">
          {saveError && (
            <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-200">
              {saveError}
            </div>
          )}
          
          {/* Title & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                ¿Qué momento celebramos? *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Ej. Nuestra primera cita, Cena especial..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-rose-400 font-medium text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-rose-500" />
                Fecha *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-rose-400 font-medium text-sm"
              />
            </div>
          </div>

          {/* Category Selector */}
          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-2">
              Categoría
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {Object.values(CATEGORIES).map(cat => {
                const isSelected = category === cat.key
                return (
                  <button
                    type="button"
                    key={cat.key}
                    onClick={() => setCategory(cat.key)}
                    className={`flex items-center gap-2 p-2 rounded-xl text-xs font-semibold border transition-all text-left cursor-pointer ${
                      isSelected
                        ? `${cat.badgeBg} ${cat.darkBadgeBg} border-rose-400 dark:border-rose-600 shadow-xs ring-1 ring-rose-300 dark:ring-rose-800`
                        : 'bg-stone-50 dark:bg-stone-900/60 border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
                    }`}
                  >
                    <span className="text-base">{cat.emoji}</span>
                    <span className="truncate">{cat.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Feeling / Mood */}
          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-2">
              ¿Cómo se sintió ese día?
            </label>
            <div className="flex flex-wrap gap-2">
              {FEELINGS.map(f => (
                <button
                  type="button"
                  key={f.key}
                  onClick={() => setFeeling(f.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-all cursor-pointer ${
                    feeling === f.key
                      ? 'bg-rose-50 dark:bg-rose-950/80 border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 font-bold shadow-xs'
                      : 'bg-stone-50 dark:bg-stone-900/60 border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
                  }`}
                >
                  <span>{f.emoji}</span>
                  <span>{f.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-rose-500" />
              Lugar / Ubicación
            </label>
            <input
              type="text"
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="Ej. Café La Estación, Mirador, Restaurante..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-rose-400 font-medium text-sm"
            />
          </div>

          {/* Music / Audio Section */}
          <div className="p-3.5 bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900/40 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-stone-800 dark:text-stone-200 uppercase tracking-wider flex items-center gap-1.5">
                <Music className="w-3.5 h-3.5 text-rose-500" />
                <span>Música o Canción de ese momento</span>
              </label>
              <span className="text-[11px] text-stone-400">Opcional</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <input
                type="text"
                value={songTitle}
                onChange={e => setSongTitle(e.target.value)}
                placeholder="Nombre de la canción (ej. Perfect)"
                className="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 text-xs focus:outline-none focus:ring-2 focus:ring-rose-400"
              />
              <input
                type="text"
                value={songArtist}
                onChange={e => setSongArtist(e.target.value)}
                placeholder="Artista (ej. Ed Sheeran)"
                className="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 text-xs focus:outline-none focus:ring-2 focus:ring-rose-400"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2">
              <div className="relative flex-1 w-full">
                <Link2 className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="url"
                  value={songUrl}
                  onChange={e => setSongUrl(e.target.value)}
                  placeholder="Enlace de Spotify, YouTube o web"
                  className="w-full pl-8 pr-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 text-xs focus:outline-none focus:ring-2 focus:ring-rose-400"
                />
              </div>

              {/* Upload audio file button */}
              <div className="w-full sm:w-auto flex items-center gap-1">
                <input
                  type="file"
                  ref={audioInputRef}
                  onChange={handleAudioUpload}
                  accept="audio/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => audioInputRef.current?.click()}
                  className="w-full sm:w-auto px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 hover:bg-stone-50 dark:hover:bg-stone-700 text-xs font-semibold text-stone-700 dark:text-stone-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Volume2 className="w-3.5 h-3.5 text-rose-500" />
                  <span>{audioFileName ? 'Cambiar audio' : 'Subir audio/voz'}</span>
                </button>
                {audioData && (
                  <button
                    type="button"
                    onClick={() => { setAudioData(undefined); setAudioPath(undefined); setAudioFileName('') }}
                    title="Eliminar archivo de audio"
                    className="p-2 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-950 text-rose-500 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {audioFileName && (
              <p className="text-[11px] text-rose-600 dark:text-rose-400 font-medium">
                🎵 Audio cargado: {audioFileName}
              </p>
            )}
          </div>

          {/* Description / Story */}
          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
              Pequeña historia: ¿Qué pasó ese día?
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Cuéntanos un detalle bonito, lo que comieron, lo que te hizo reír, las palabras que dijeron..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-rose-400 font-sans text-sm resize-none"
            />
          </div>

          {/* Photos Upload */}
          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <ImageIcon className="w-3.5 h-3.5 text-rose-500" />
                Fotos del recuerdo ({photos.length})
              </span>
              <span className="text-[11px] text-stone-400 font-normal">Puedes subir varias fotos</span>
            </label>

            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-2">
              {photos.map((photo, index) => (
                <div key={photo.id} className="relative group aspect-square rounded-xl overflow-hidden border border-stone-200 dark:border-stone-700 bg-stone-100 dark:bg-stone-800">
                  <img src={photo.url} alt={`Foto ${index + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(photo.id)}
                    className="absolute top-1 right-1 p-1 bg-black/60 hover:bg-rose-600 text-white rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}

              <div
                role="button"
                tabIndex={0}
                aria-label={isUploadingPhotos ? 'Cargando fotos' : 'Subir fotos'}
                aria-disabled={isUploadingPhotos}
                onClick={() => {
                  if (!isUploadingPhotos) fileInputRef.current?.click()
                }}
                onKeyDown={event => {
                  if (!isUploadingPhotos && (event.key === 'Enter' || event.key === ' ')) {
                    event.preventDefault()
                    fileInputRef.current?.click()
                  }
                }}
                className="aspect-square rounded-xl border-2 border-dashed border-stone-200 dark:border-stone-700 hover:border-rose-400 dark:hover:border-rose-500 bg-stone-50 dark:bg-stone-900 hover:bg-rose-50/50 dark:hover:bg-rose-950/30 flex flex-col items-center justify-center p-2 text-center cursor-pointer transition-colors"
              >
                <Upload className="w-5 h-5 text-stone-400 mb-1" />
                <span className="text-[11px] font-semibold text-stone-500 dark:text-stone-400">
                  {isUploadingPhotos ? 'Cargando...' : '+ Subir foto'}
                </span>
              </div>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handlePhotoUpload}
              disabled={isUploadingPhotos}
              multiple
              accept="image/*,.raw,.3fr,.ari,.arw,.bay,.cap,.cr2,.cr3,.crw,.dcs,.dcr,.dng,.drf,.eip,.erf,.fff,.gpr,.iiq,.k25,.kdc,.mef,.mos,.mrw,.nef,.nrw,.obm,.orf,.pef,.ptx,.pxn,.raf,.rwl,.rw2,.rwz,.sr2,.srf,.srw,.x3f,.jfif,.jpg,.jpeg,.png"
              className="hidden"
            />
            {isUploadingPhotos && (
              <p role="status" className="text-xs text-stone-500 dark:text-stone-400">
                Procesando fotos… No cierres este formulario todavía.
              </p>
            )}
          </div>

          {/* Milestone Checkbox */}
          <div className="p-3.5 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-5 h-5 text-amber-500 flex-shrink-0" />
              <div>
                <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200">
                  Marcar como Hito Principal
                </h4>
                <p className="text-[11px] text-amber-700 dark:text-amber-400">
                  Aparecerá destacado en la sección de hitos y días de amor
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              id="isMilestone"
              checked={isMilestone}
              onChange={e => setIsMilestone(e.target.checked)}
              className="w-4 h-4 text-amber-600 rounded-md focus:ring-amber-500 cursor-pointer"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 font-semibold text-xs sm:text-sm hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isUploadingPhotos}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-bold text-xs sm:text-sm shadow-md shadow-rose-500/25 transition-all transform hover:-translate-y-0.5 cursor-pointer flex items-center gap-2 disabled:opacity-50 disabled:cursor-wait"
            >
              <Heart className="w-4 h-4 fill-white" />
              <span>{isUploadingPhotos ? 'Procesando fotos…' : 'Guardar Recuerdo'}</span>
            </button>
          </div>

      </form>
    </Modal>
  )
}
