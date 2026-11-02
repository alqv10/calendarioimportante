export const MONTH_NAMES_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

export const DAY_NAMES_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

/** Fecha de hoy en YYYY-MM-DD según el reloj local (no UTC). */
export function todayISO(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

export function formatDateSpanish(dateString: string): string {
  if (!dateString) return ''
  const [year, month, day] = dateString.split('-').map(Number)
  if (!year || !month || !day) return dateString
  return `${day} de ${MONTH_NAMES_ES[month - 1]}, ${year}`
}

export function formatShortDateSpanish(dateString: string): string {
  if (!dateString) return ''
  const [year, month, day] = dateString.split('-').map(Number)
  return `${day} ${MONTH_NAMES_ES[month - 1]?.slice(0, 3)} ${year}`
}

export function getTimeAgoSpanish(dateString: string): string {
  const [year, month, day] = dateString.split('-').map(Number)
  const targetDate = new Date(year, month - 1, day)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  targetDate.setHours(0, 0, 0, 0)

  const diffTime = today.getTime() - targetDate.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return '¡Hoy!'
  if (diffDays === 1) return 'Ayer'
  if (diffDays < 0) {
    const futureDays = Math.abs(diffDays)
    return futureDays === 1 ? 'Mañana' : `En ${futureDays} días`
  }

  const years = Math.floor(diffDays / 365)
  const remainingDays = diffDays % 365
  const months = Math.floor(remainingDays / 30)

  if (years > 0) {
    if (months > 0) {
      return `Hace ${years} ${years === 1 ? 'año' : 'años'} y ${months} ${months === 1 ? 'mes' : 'meses'}`
    }
    return `Hace ${years} ${years === 1 ? 'año' : 'años'}`
  }

  if (months > 0) {
    return `Hace ${months} ${months === 1 ? 'mes' : 'meses'}`
  }

  return `Hace ${diffDays} ${diffDays === 1 ? 'día' : 'días'}`
}

export function getDaysTogether(firstDateStr: string): number {
  if (!firstDateStr) return 0
  const [year, month, day] = firstDateStr.split('-').map(Number)
  const start = new Date(year, month - 1, day)
  const today = new Date()
  start.setHours(0, 0, 0, 0)
  today.setHours(0, 0, 0, 0)
  const diff = today.getTime() - start.getTime()
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)))
}

export interface CalendarDay {
  dateString: string // YYYY-MM-DD
  dayNumber: number
  isCurrentMonth: boolean
  isToday: boolean
}

export function generateCalendarMonth(year: number, month: number): CalendarDay[] {
  // month is 0-indexed (0 = Jan, 11 = Dec)
  const firstDayOfMonth = new Date(year, month, 1)
  const lastDayOfMonth = new Date(year, month + 1, 0)
  
  const startWeekday = firstDayOfMonth.getDay() // 0 = Sun
  const totalDays = lastDayOfMonth.getDate()

  const todayStr = todayISO()

  const days: CalendarDay[] = []

  // Days from previous month
  const prevMonthLastDay = new Date(year, month, 0).getDate()
  for (let i = startWeekday - 1; i >= 0; i--) {
    const dayNum = prevMonthLastDay - i
    const prevDate = new Date(year, month - 1, dayNum)
    const y = prevDate.getFullYear()
    const m = String(prevDate.getMonth() + 1).padStart(2, '0')
    const d = String(dayNum).padStart(2, '0')
    const dStr = `${y}-${m}-${d}`

    days.push({
      dateString: dStr,
      dayNumber: dayNum,
      isCurrentMonth: false,
      isToday: dStr === todayStr
    })
  }

  // Current month days
  for (let day = 1; day <= totalDays; day++) {
    const m = String(month + 1).padStart(2, '0')
    const d = String(day).padStart(2, '0')
    const dStr = `${year}-${m}-${d}`

    days.push({
      dateString: dStr,
      dayNumber: day,
      isCurrentMonth: true,
      isToday: dStr === todayStr
    })
  }

  // Days from next month to complete grid (6 rows = 42 cells or 5 rows = 35)
  const targetTotal = days.length > 35 ? 42 : 35
  const remaining = targetTotal - days.length
  for (let day = 1; day <= remaining; day++) {
    const nextDate = new Date(year, month + 1, day)
    const y = nextDate.getFullYear()
    const m = String(nextDate.getMonth() + 1).padStart(2, '0')
    const d = String(day).padStart(2, '0')
    const dStr = `${y}-${m}-${d}`

    days.push({
      dateString: dStr,
      dayNumber: day,
      isCurrentMonth: false,
      isToday: dStr === todayStr
    })
  }

  return days
}
