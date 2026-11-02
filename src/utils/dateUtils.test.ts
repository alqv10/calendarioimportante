import { expect, test } from 'bun:test'
import { todayISO, formatDateSpanish, generateCalendarMonth } from './dateUtils'

test('todayISO usa el reloj local, no UTC', () => {
  const now = new Date()
  const expected = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  expect(todayISO()).toBe(expected)
  // La trampa que tenia la app: toISOString() cambia de dia segun la zona horaria.
  expect(todayISO()).toHaveLength(10)
})

test('formatDateSpanish no corre la fecha un dia', () => {
  expect(formatDateSpanish('2026-01-01')).toBe('1 de Enero, 2026')
  expect(formatDateSpanish('2026-12-31')).toBe('31 de Diciembre, 2026')
})

test('generateCalendarMonth cubre el mes completo en una grilla de semanas', () => {
  const feb2024 = generateCalendarMonth(2024, 1) // bisiesto
  expect(feb2024.length % 7).toBe(0)
  expect(feb2024.filter(d => d.isCurrentMonth)).toHaveLength(29)
  expect(feb2024.find(d => d.isCurrentMonth)?.dateString).toBe('2024-02-01')
  expect(feb2024.filter(d => d.isCurrentMonth).at(-1)?.dateString).toBe('2024-02-29')
})
