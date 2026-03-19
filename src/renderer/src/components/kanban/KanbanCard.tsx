import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useAppStore } from '@/store'
import { formatDuration, format, parseISO } from '@/lib/dateUtils'
import type { Card } from '@/types'

const PRIORITY_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  low: { label: 'Low', color: '#4ade80', bg: 'rgba(74,222,128,0.12)' },
  medium: { label: 'Med', color: '#fbbf24', bg: 'rgba(251,191,36,0.12)' },
  high: { label: 'High', color: '#f87171', bg: 'rgba(248,113,113,0.12)' },
}

interface Props {
  card: Card
  isOverlay?: boolean
}

export function KanbanCard({ card, isOverlay }: Props) {
  const setSelectedCard = useAppStore((s) => s.setSelectedCard)
  const lists = useAppStore((s) => s.lists)
  const list = lists.find((l) => l.id === card.listId)
  const pri = PRIORITY_LABELS[card.priority]

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
        {/* Title row — title + chevron */}
        <div className="flex items-start justify-between" style={{ gap: 8 }}>
          <div
            className="text-[var(--color-text)] font-medium"
            style={{ fontSize: 13, lineHeight: '18px', flex: 1 }}
          >
            {card.title}
          </div>
          {/* Chevron affordance — visible on hover */}
          <span
            className="text-[var(--color-text-muted)] opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
            style={{ fontSize: 14, lineHeight: '18px' }}
          >
            ›
          </span>
        </div>

        {/* Primary metadata row — duration + day constraints */}
        <div className="flex items-center flex-wrap" style={{ gap: 6, marginTop: 8 }}>
          {/* Duration pill */}
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

          {/* Priority badge */}
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: pri.color,
              backgroundColor: pri.bg,
              padding: '2px 7px',
              borderRadius: 4,
              letterSpacing: 0.2,
            }}
          >
            {pri.label}
          </span>
        </div>

        {/* Secondary metadata — date, smaller and muted */}
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
