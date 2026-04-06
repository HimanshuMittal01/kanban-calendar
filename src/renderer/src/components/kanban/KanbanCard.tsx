import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useAppStore } from '@/store'
import { formatDuration, format, parseISO } from '@/lib/dateUtils'
import type { Card } from '@/types'

interface Props {
  card: Card
  isOverlay?: boolean
}

export function KanbanCard({ card, isOverlay }: Props) {
  const setSelectedCard = useAppStore((s) => s.setSelectedCard)
  const lists = useAppStore((s) => s.lists)
  const people = useAppStore((s) => s.people)
  const list = lists.find((l) => l.id === card.listId)
  const person = card.personId ? people.find((p) => p.id === card.personId) : null

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  const dayAbbrevs = card.allowedDays.length > 0
    ? card.allowedDays.map((d) => d.charAt(0).toUpperCase() + d.slice(1, 3)).join(', ')
    : null

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={() => setSelectedCard(card.id)}
      className={`group relative cursor-pointer transition-all ${
        isOverlay ? 'shadow-2xl ring-2 ring-[var(--color-accent)]/30' : ''
      }`}
      style={{
        ...style,
        backgroundColor: '#272727',
        border: '1px solid #383838',
        borderRadius: 10,
        overflow: 'hidden',
      }}
    >
      {/* Colored top edge — list identity */}
      <div
        style={{
          height: 3,
          backgroundColor: list?.color || '#555',
        }}
      />

      {/* Card body */}
      <div style={{ padding: '10px 12px 10px 12px' }}>
        {/* Title row */}
        <div className="flex items-start justify-between" style={{ gap: 8 }}>
          <div
            className="text-[var(--color-text)] font-medium"
            style={{ fontSize: 13, lineHeight: '18px', flex: 1 }}
          >
            {card.title}
          </div>
          <span
            className="text-[var(--color-text-muted)] opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
            style={{ fontSize: 14, lineHeight: '18px' }}
          >
            ›
          </span>
        </div>

        {/* Primary metadata row */}
        <div className="flex items-center flex-wrap" style={{ gap: 6, marginTop: 8 }}>
          {/* Action type badge — always shown */}
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              padding: '2px 7px',
              borderRadius: 4,
              letterSpacing: 0.2,
              ...(card.actionType === 'Follow up'
                ? {
                    color: 'var(--color-accent)',
                    backgroundColor: 'rgba(99,102,241,0.12)',
                  }
                : {
                    color: 'var(--color-text-muted)',
                    backgroundColor: 'rgba(255,255,255,0.06)',
                  }),
            }}
          >
            {card.actionType}
          </span>

          {/* Duration pill */}
          {card.durationMinutes !== null && (
            <span
              style={{
                fontSize: 11,
                fontWeight: 500,
                color: 'var(--color-text-secondary)',
                backgroundColor: 'rgba(255,255,255,0.06)',
                padding: '2px 8px',
                borderRadius: 4,
              }}
            >
              {formatDuration(card.durationMinutes)}
            </span>
          )}

          {/* Day constraints */}
          {dayAbbrevs && (
            <span
              style={{
                fontSize: 11,
                fontWeight: 500,
                color: 'var(--color-text-secondary)',
                backgroundColor: 'rgba(255,255,255,0.06)',
                padding: '2px 8px',
                borderRadius: 4,
              }}
            >
              {dayAbbrevs}
            </span>
          )}

          {/* Person tag — only for Follow up cards */}
          {card.actionType === 'Follow up' && person && (
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: person.color,
                backgroundColor: person.color + '1f',
                padding: '2px 7px',
                borderRadius: 4,
                letterSpacing: 0.2,
              }}
            >
              {person.name}
            </span>
          )}
        </div>

        {/* Secondary metadata — date */}
        {card.startDate && (
          <div
            style={{
              fontSize: 10,
              color: 'var(--color-text-muted)',
              marginTop: 6,
            }}
          >
            {format(parseISO(card.startDate), 'MMM d, h:mm a')}
          </div>
        )}
      </div>

      {/* Hover border glow */}
      <div
        className="absolute inset-0 pointer-events-none rounded-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ border: '1px solid var(--color-border-hover)' }}
      />
    </div>
  )
}
