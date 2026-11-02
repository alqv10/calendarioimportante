import { expect, test } from 'bun:test'
import { attachSignedUrls, collectMediaPaths, inlineMediaForExport, memoryToRow, rowToMemory } from './storage'
import type { MemoryMoment } from '../types'

const base: MemoryMoment = {
  id: 'm1', userId: 'u1', title: 'Primera cita', date: '2026-01-02',
  category: 'cita', emoji: '🌹', description: '', photos: [],
  createdAt: 1, updatedAt: 2
}

const SIGNED = 'https://proyecto.supabase.co/storage/v1/object/sign/memorias/u1/m1/p1.jpg?token=abc'

test('una URL firmada nunca se escribe en la base de datos', () => {
  const moment: MemoryMoment = {
    ...base,
    photos: [{ id: 'p1', url: SIGNED, path: 'u1/m1/p1.jpg' }],
    audioPath: 'u1/m1/audio.mp3',
    audioData: SIGNED
  }
  const row = memoryToRow(moment, 'u1')

  expect(row.photos).toEqual([{ id: 'p1', path: 'u1/m1/p1.jpg', caption: undefined }])
  expect(JSON.stringify(row)).not.toContain('token=abc')
  expect(row.audio_data).toBeNull()
  expect(row.audio_path).toBe('u1/m1/audio.mp3')
})

test('los recuerdos antiguos en base64 se siguen guardando tal cual', () => {
  const dataUrl = 'data:image/jpeg;base64,AAAA'
  const row = memoryToRow({
    ...base,
    photos: [{ id: 'p1', url: dataUrl }],
    audioData: 'data:audio/mpeg;base64,BBBB'
  }, 'u1')

  expect(row.photos).toEqual([{ id: 'p1', url: dataUrl, caption: undefined }])
  expect(row.audio_data).toBe('data:audio/mpeg;base64,BBBB')
  expect(row.audio_path).toBeNull()
})

test('el propietario sale siempre de la sesión, no del recuerdo', () => {
  expect(memoryToRow({ ...base, userId: 'otro' }, 'u1').user_id).toBe('u1')
})

test('rowToMemory no inventa una URL para las fotos en Storage', () => {
  const memory = rowToMemory({
    ...base, user_id: 'u1', is_milestone: false, created_at: 1, updated_at: 2,
    photos: [{ id: 'p1', path: 'u1/m1/p1.jpg' }, { id: 'p2', url: 'data:image/png;base64,CCCC' }],
    audio_path: 'u1/m1/audio.mp3',
    audio_data: 'data:audio/mpeg;base64,viejo'
  })

  expect(memory.photos[0]).toEqual({ id: 'p1', url: '', path: 'u1/m1/p1.jpg', caption: undefined })
  expect(memory.photos[1].url).toBe('data:image/png;base64,CCCC')
  // Con audio_path, el audio_data heredado se ignora: la ruta manda.
  expect(memory.audioData).toBeUndefined()
  expect(memory.audioPath).toBe('u1/m1/audio.mp3')
})

test('collectMediaPaths junta fotos y audio de todos los recuerdos', () => {
  const paths = collectMediaPaths([
    { ...base, photos: [{ id: 'p1', url: '', path: 'a.jpg' }], audioPath: 'a.mp3' },
    { ...base, id: 'm2', photos: [{ id: 'p2', url: 'data:image/png;base64,X' }] }
  ])
  expect(paths).toEqual(['a.jpg', 'a.mp3'])
})

test('attachSignedUrls rellena las URLs y deja intacto el base64', () => {
  const memories: MemoryMoment[] = [{
    ...base,
    photos: [{ id: 'p1', url: '', path: 'a.jpg' }, { id: 'p2', url: 'data:image/png;base64,X' }],
    audioPath: 'a.mp3'
  }]
  const out = attachSignedUrls(memories, new Map([['a.jpg', SIGNED], ['a.mp3', 'firmado-audio']]))

  expect(out[0].photos[0].url).toBe(SIGNED)
  expect(out[0].photos[0].path).toBe('a.jpg')
  expect(out[0].photos[1].url).toBe('data:image/png;base64,X')
  expect(out[0].audioData).toBe('firmado-audio')
})

test('si una ruta no se puede firmar, la foto conserva su path y no se pierde', () => {
  const out = attachSignedUrls(
    [{ ...base, photos: [{ id: 'p1', url: '', path: 'desaparecida.jpg' }] }],
    new Map()
  )
  expect(out[0].photos[0].url).toBe('')
  expect(out[0].photos[0].path).toBe('desaparecida.jpg')
  // Y al volver a guardar, la ruta sigue ahí: no se borra por no haberse visto.
  expect(memoryToRow(out[0], 'u1').photos[0].path).toBe('desaparecida.jpg')
})

test('ida y vuelta: guardar un recuerdo cargado no cambia lo almacenado', () => {
  // Una fila tal cual la devuelve Postgres: solo snake_case, sin campos de más.
  const row = {
    id: 'm1', user_id: 'u1', title: 'Primera cita', date: '2026-01-02',
    category: 'cita', emoji: '🌹', description: '', location: null, feeling: null,
    is_milestone: false, song_title: null, song_artist: null, song_url: null,
    photos: [{ id: 'p1', path: 'u1/m1/p1.jpg', caption: 'playa' }],
    audio_path: 'u1/m1/audio.mp3', audio_data: null,
    created_at: 1, updated_at: 2
  }
  const signed = attachSignedUrls([rowToMemory(row)], new Map([
    ['u1/m1/p1.jpg', SIGNED], ['u1/m1/audio.mp3', 'firmado']
  ]))[0]

  expect(memoryToRow(signed, 'u1')).toEqual(row)
})

test('la copia de seguridad incrusta los archivos y descarta las rutas', async () => {
  const exported = await inlineMediaForExport({
    ...base,
    photos: [
      { id: 'p1', url: SIGNED, path: 'u1/m1/p1.jpg', caption: 'playa' },
      { id: 'p2', url: 'data:image/png;base64,YA', caption: undefined }
    ],
    audioPath: 'u1/m1/audio.mp3',
    audioData: 'https://firmada/audio'
  }, async url => `data:descargado-de/${url}`)

  expect(exported.photos[0]).toEqual({
    id: 'p1', url: `data:descargado-de/${SIGNED}`, caption: 'playa'
  })
  expect(exported.photos[0].path).toBeUndefined()
  // Lo que ya era base64 no se vuelve a descargar.
  expect(exported.photos[1].url).toBe('data:image/png;base64,YA')
  expect(exported.audioData).toBe('data:descargado-de/https://firmada/audio')
  expect(exported.audioPath).toBeUndefined()

  // Y al restaurarla, se vuelve a subir en vez de apuntar a un proyecto ajeno.
  const row = memoryToRow(exported, 'u2')
  expect(row.photos[0].url).toStartWith('data:')
  expect(row.photos[0].path).toBeUndefined()
})

test('una foto que no se puede descargar aborta la copia en vez de perderla', () => {
  expect(inlineMediaForExport({
    ...base,
    photos: [{ id: 'p1', url: SIGNED, path: 'u1/m1/p1.jpg' }]
  }, async () => { throw new Error('404') })).rejects.toThrow(/No se pudo incluir una foto/)
})
