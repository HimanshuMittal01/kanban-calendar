import { useMemo } from 'react'
import { useAppStore } from '@/store'
import {
  generateTimeSlots,
  getDaysForFilter,
  getCardGridPosition,
  isCardInRange,
  format,
  parseISO,
  getDayOfWeek,
} from '@/lib/dateUtils'
import { HOURS_START, HOURS_END } from '@/lib/constants'
import { isSameDay } from 'date-fns'
import type { Card } from '@/types'

export function CalendarGrid() {
  const activeFilter = useAppStore((s) => s.activeFilter)
  const gridInterval = useAppStore((s) => s.gridInterval)
  const cards = useAppStore((s) => s.cards)
  const lists = useAppStore((s) => s.lists)
  const timeBlocks = useAppStore((s) => s.timeBlocks)
  const setSelectedCard = useAppStore((s) => s.setSelectedCard)

  const days = useMemo(
    () => (activeFilter ? getDaysForFilter(activeFilter) : []),
    [activeFilter]
  )

  const timeSlots = useMemo(
    () => generateTimeSlots(gridInterval, HOURS_START, HOURS_END),
    [gridInterval]
  )

  const scheduledCards = useMemo(() => {
    if (!activeFilter) return []
    return cards.filter(
      (c) => c.startDate && isCardInRange(c.startDate, activeFilter)
    )
  }, [cards, activeFilter])

  // Get time block overlays for each day
  const timeBlockOverlays = useMemo(() => {
    const overlays: {
      blockId: string
      color: string
      name: string
      dayIndex: number
      startRow: number
      endRow: number
    }[] = []

    days.forEach((day, dayIndex) => {
      const dayOfWeek = getDayOfWeek(day)
      timeBlocks.forEach((block) => {
        if (block.daysOfWeek.includes(dayOfWeek)) {
          const [startH, startM] = block.startTime.split(':').map(Number)
          const [endH, endM] = block.endTime.split(':').map(Number)
          const startMinutes = (startH - HOURS_START) * 60 + startM
          const endMinutes = (endH - HOURS_START) * 60 + endM
          const startRow = Math.floor(startMinutes / gridInterval) + 1
          const endRow = Math.floor(endMinutes / gridInterval) + 1

          overlays.push({
            blockId: block.id,
            color: block.color,
            name: block.name,
            dayIndex,
            startRow: Math.max(1, startRow),
            endRow: Math.min(timeSlots.length + 1, endRow),
          })
        }
      })
    })

    return overlays
  }, [days, timeBlocks, gridInterval, timeSlots.length])

  if (!activeFilter || days.length === 0) return null

  const totalRows = timeSlots.length
  const totalCols = days.length

  return (
    <div className="h-full flex flex-col bg-[var(--color-bg)]">
      {/* Fixed header */}
      <div
        className="grid shrink-0 border-b border-[var(--color-border)]"
        style={{
          gridTemplateColumns: `76px repeat(${totalCols}, minmax(0, 1fr))`,
        }}
      >
        <div className="px-2 py-2 text-[10px] text-[var(--color-text-muted)]" />
        {days.map((day, i) => (
          <div
            key={i}
            className="px-2 py-2 text-center border-l border-[var(--color-border)]"
          >
            <div className="text-[10px] text-[var(--color-text-muted)] uppercase">
              {format(day, 'EEE')}
            </div>
            <div className="text-sm font-semibold text-[var(--color-text)]">
              {format(day, 'd')}
            </div>
          </div>
        ))}
      </div>

      {/* Scrollable grid body */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div
          className="grid relative overflow-hidden"
          style={{
            gridTemplateColumns: `76px repeat(${totalCols}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${totalRows}, ${gridInterval === 15 ? '20px' : '32px'})`,
          }}
        >
          {/* Time gutter labels */}
          {timeSlots.map((slot) => (
            <div
              key={slot.row}
              className="text-[10px] text-[var(--color-text-muted)] px-2 flex items-start"
              style={{
                gridColumn: 1,
                gridRow: slot.row,
              }}
            >
              {slot.minute === 0 ? slot.time : ''}
            </div>
          ))}

          {/* Grid lines */}
          {timeSlots.map((slot) =>
            days.map((_, dayIndex) => (
              <div
                key={`${slot.row}-${dayIndex}`}
                className={`border-l border-[var(--color-border)] ${
                  slot.minute === 0
                    ? 'border-t border-t-[var(--color-border)]'
                    : 'border-t border-t-[var(--color-border)]/30'
                }`}
                style={{
                  gridColumn: dayIndex + 2,
                  gridRow: slot.row,
                }}
              />
            ))
          )}

          {/* Time block overlays */}
          {timeBlockOverlays.map((overlay, i) => (
            <div
              key={`overlay-${i}`}
              className="rounded-sm pointer-events-none z-0"
              style={{
                gridColumn: overlay.dayIndex + 2,
                gridRowStart: overlay.startRow,
                gridRowEnd: overlay.endRow,
                backgroundColor: overlay.color + '10',
                borderLeft: `2px solid ${overlay.color}30`,
              }}
            >
              <span
                className="text-[9px] px-1 block truncate"
                style={{ color: overlay.color + '60' }}
              >
                {overlay.name}
              </span>
            </div>
          ))}

          {/* Calendar events (cards) */}
          {scheduledCards.map((card) => {
            const cardDate = parseISO(card.startDate!)
            const dayIndex = days.findIndex((d) => isSameDay(d, cardDate))
            if (dayIndex === -1) return null

            const pos = getCardGridPosition(
              card.startDate!,
              card.durationMinutes,
              dayIndex,
              gridInterval,
              HOURS_START
            )

            const list = lists.find((l) => l.id === card.listId)
            const color = list?.color || '#4f8ff7'

            return (
              <div
                key={card.id}
                onClick={() => setSelectedCard(card.id)}
                className="rounded-md mx-0.5 px-1.5 py-0.5 cursor-pointer hover:brightness-125 transition-all overflow-hidden z-10 min-w-0"
                style={{
                  gridColumn: pos.gridColumn,
                  gridRowStart: pos.gridRowStart,
                  gridRowEnd: pos.gridRowEnd,
                  backgroundColor: color + '25',
                  borderLeft: `3px solid ${color}`,
                }}
              >
                <div
                  className="text-[11px] font-medium truncate"
                  style={{ color }}
                >
                  {card.title}
                </div>
                <div className="text-[9px] text-[var(--color-text-muted)] truncate">
                  {format(cardDate, 'h:mm a')}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
