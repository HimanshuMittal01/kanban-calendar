import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  addWeeks,
  parseISO,
  format,
  getHours,
  getMinutes,
  getDay,
  addMinutes,
  eachDayOfInterval,
  isWithinInterval,
  set,
} from 'date-fns'
import type { DayOfWeek, TimeFilterRange, GridInterval } from '@/types'

const DAY_MAP: Record<number, DayOfWeek> = {
  0: 'sun',
  1: 'mon',
  2: 'tue',
  3: 'wed',
  4: 'thu',
  5: 'fri',
  6: 'sat',
}

export function getDayOfWeek(date: Date): DayOfWeek {
  return DAY_MAP[getDay(date)]
}

export function getDateRangeForFilter(filter: TimeFilterRange): { start: Date; end: Date } {
  const now = new Date()
  switch (filter) {
    case 'today':
      return { start: startOfDay(now), end: endOfDay(now) }
    case 'this-week':
      return {
        start: startOfWeek(now, { weekStartsOn: 1 }),
        end: endOfWeek(now, { weekStartsOn: 1 }),
      }
    case 'next-week': {
      const nextWeek = addWeeks(now, 1)
      return {
        start: startOfWeek(nextWeek, { weekStartsOn: 1 }),
        end: endOfWeek(nextWeek, { weekStartsOn: 1 }),
      }
    }
  }
}

export function getDaysForFilter(filter: TimeFilterRange): Date[] {
  const { start, end } = getDateRangeForFilter(filter)
  return eachDayOfInterval({ start, end })
}

export function isCardInRange(startDate: string, filter: TimeFilterRange): boolean {
  const date = parseISO(startDate)
  const { start, end } = getDateRangeForFilter(filter)
  return isWithinInterval(date, { start, end })
}

export function parseTimeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

export interface TimeSlot {
  time: string
  row: number
  hour: number
  minute: number
}

export function generateTimeSlots(interval: GridInterval, hoursStart: number, hoursEnd: number): TimeSlot[] {
  const slots: TimeSlot[] = []
  const base = set(new Date(), { hours: hoursStart, minutes: 0, seconds: 0, milliseconds: 0 })
  const end = set(new Date(), { hours: hoursEnd, minutes: 0, seconds: 0, milliseconds: 0 })
  let current = base
  let row = 1
  while (current < end) {
    slots.push({
      time: format(current, 'h:mm a'),
      row,
      hour: getHours(current),
      minute: getMinutes(current),
    })
    current = addMinutes(current, interval)
    row++
  }
  return slots
}

export function getCardGridPosition(
  startDate: string,
  durationMinutes: number,
  dayColumnIndex: number,
  interval: GridInterval,
  hoursStart: number
) {
  const date = parseISO(startDate)
  const minutesFromStart = (getHours(date) - hoursStart) * 60 + getMinutes(date)
  const startRow = Math.floor(minutesFromStart / interval) + 1
  const spanRows = Math.max(1, Math.ceil(durationMinutes / interval))

  return {
    gridColumn: dayColumnIndex + 2,
    gridRowStart: startRow,
    gridRowEnd: startRow + spanRows,
  }
}

export { format, parseISO }
