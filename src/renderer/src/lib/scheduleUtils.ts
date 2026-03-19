import { parseISO, getHours, getMinutes } from 'date-fns'
import { getDayOfWeek, parseTimeToMinutes } from './dateUtils'
import type { Card, TimeBlock } from '@/types'

export function isCardScheduleValid(card: Card, timeBlocks: TimeBlock[]): boolean {
  if (!card.startDate) return true

  const start = parseISO(card.startDate)
  const dayName = getDayOfWeek(start)

  // Check day-of-week constraint
  if (card.allowedDays.length > 0 && !card.allowedDays.includes(dayName)) {
    return false
  }

  // Check time block constraints
  if (card.timeBlockIds.length > 0) {
    const startMinutes = getHours(start) * 60 + getMinutes(start)
    const endMinutes = startMinutes + card.durationMinutes

    return card.timeBlockIds.some((blockId) => {
      const block = timeBlocks.find((b) => b.id === blockId)
      if (!block) return false
      const blockStart = parseTimeToMinutes(block.startTime)
      const blockEnd = parseTimeToMinutes(block.endTime)
      return (
        block.daysOfWeek.includes(dayName) &&
        startMinutes >= blockStart &&
        endMinutes <= blockEnd
      )
    })
  }

  return true
}
