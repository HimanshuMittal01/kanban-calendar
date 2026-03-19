export type Priority = 'low' | 'medium' | 'high'

export type DayOfWeek = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'

export type TimeFilterRange = 'today' | 'this-week' | 'next-week'

export type GridInterval = 15 | 30

export interface TimeBlock {
  id: string
  name: string
  startTime: string // HH:mm
  endTime: string // HH:mm
  daysOfWeek: DayOfWeek[]
  color: string // hex
}

export interface Card {
  id: string
  title: string
  description: string
  listId: string

  startDate: string | null // ISO 8601
  durationMinutes: number
  priority: Priority

  allowedDays: DayOfWeek[]
  timeBlockIds: string[]

  createdAt: string
  updatedAt: string
  sortOrder: number
}

export interface KanbanList {
  id: string
  title: string
  color: string
  sortOrder: number
}
