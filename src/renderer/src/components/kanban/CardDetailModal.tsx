import { useState, useEffect } from 'react'
import { useAppStore } from '@/store'
import { formatDuration } from '@/lib/dateUtils'
import type { DayOfWeek, Priority } from '@/types'

const DAYS: { label: string; value: DayOfWeek }[] = [
  { label: 'Mon', value: 'mon' },
  { label: 'Tue', value: 'tue' },
  { label: 'Wed', value: 'wed' },
  { label: 'Thu', value: 'thu' },
  { label: 'Fri', value: 'fri' },
  { label: 'Sat', value: 'sat' },
  { label: 'Sun', value: 'sun' },
]

const PRIORITIES: { label: string; value: Priority; color: string }[] = [
  { label: 'Low', value: 'low', color: '#4ade80' },
  { label: 'Medium', value: 'medium', color: '#fbbf24' },
  { label: 'High', value: 'high', color: '#f87171' },
]

const DURATION_PRESETS = [
  { label: '30m', value: 30 },
  { label: '1h', value: 60 },
  { label: '2h', value: 120 },
  { label: '4h', value: 240 },
]

interface Props {
  cardId: string
  onClose: () => void
}

export function CardDetailModal({ cardId, onClose }: Props) {
  const card = useAppStore((s) => s.cards.find((c) => c.id === cardId))
  const lists = useAppStore((s) => s.lists)
  const timeBlocks = useAppStore((s) => s.timeBlocks)
  const updateCard = useAppStore((s) => s.updateCard)
  const deleteCard = useAppStore((s) => s.deleteCard)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [startDate, setStartDate] = useState('')
  const [durationMinutes, setDurationMinutes] = useState(60)
  const [priority, setPriority] = useState<Priority>('medium')
  const [allowedDays, setAllowedDays] = useState<DayOfWeek[]>([])
  const [selectedTimeBlockIds, setSelectedTimeBlockIds] = useState<string[]>([])

  useEffect(() => {
    if (card) {
      setTitle(card.title)
      setDescription(card.description)
      setStartDate(card.startDate ? card.startDate.slice(0, 16) : '')
      setDurationMinutes(card.durationMinutes)
      setPriority(card.priority)
      setAllowedDays([...card.allowedDays])
      setSelectedTimeBlockIds([...card.timeBlockIds])
    }
  }, [card])

  if (!card) return null

  const currentList = lists.find((l) => l.id === card.listId)

  function handleSave() {
    updateCard(cardId, {
      title: title.trim() || 'Untitled',
      description,
      startDate: startDate ? new Date(startDate).toISOString() : null,
      durationMinutes: Math.max(5, durationMinutes),
      priority,
      allowedDays,
      timeBlockIds: selectedTimeBlockIds,
    })
    onClose()
  }

  function toggleDay(day: DayOfWeek) {
    setAllowedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    )
  }

  function toggleTimeBlock(id: string) {
    setSelectedTimeBlockIds((prev) =>
      prev.includes(id) ? prev.filter((tb) => tb !== id) : [...prev, id]
    )
  }

  function handleDelete() {
    deleteCard(cardId)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ padding: 32 }}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div
        className="relative bg-[var(--color-surface-elevated)] rounded-2xl shadow-2xl flex flex-col border border-[var(--color-border)]"
        style={{ width: 540, maxHeight: '100%' }}
      >
        {/* ── Header ── */}
        <div
          className="flex items-center justify-between shrink-0 border-b border-[var(--color-border)]"
          style={{ padding: '16px 24px' }}
        >
          <div className="flex items-center" style={{ gap: 10 }}>
            <div
              className="rounded-full"
              style={{ width: 14, height: 14, backgroundColor: currentList?.color }}
            />
            <span style={{ fontSize: 13 }} className="text-[var(--color-text-secondary)]">
              {currentList?.title}
            </span>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center rounded-md text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-hover)] transition-colors"
            style={{ width: 28, height: 28, fontSize: 18 }}
          >
            &times;
          </button>
        </div>

        {/* ── Scrollable body ── */}
        <div className="overflow-y-auto min-h-0" style={{ padding: 24 }}>

          {/* Title */}
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Card title"
            className="w-full bg-transparent font-semibold text-[var(--color-text)] outline-none"
            style={{ fontSize: 20, marginTop: 12 }}
          />

          {/* Description — 8px below title */}
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add a description..."
            rows={2}
            className="w-full bg-[var(--color-bg)] text-[var(--color-text)] rounded-xl border border-[var(--color-border)] outline-none resize-none focus:border-[var(--color-accent)]"
            style={{ fontSize: 13, padding: '10px 14px', marginTop: 8 }}
          />

          {/* ── Scheduling section ── */}
          <div className="border-t border-[var(--color-border)]" style={{ marginTop: 20 }} />
          <p className="font-semibold text-[var(--color-text-secondary)]" style={{ fontSize: 11, marginTop: 16 }}>
            Scheduling
          </p>

          {/* Priority — 16px below section label */}
          <div style={{ marginTop: 16 }}>
            <label className="block text-[var(--color-text-muted)]" style={{ fontSize: 11, marginBottom: 6 }}>
              Priority
            </label>
            <div className="flex" style={{ gap: 8 }}>
              {PRIORITIES.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setPriority(p.value)}
                  className="rounded-lg border transition-colors"
                  style={{
                    padding: '7px 16px',
                    fontSize: 12,
                    ...(priority === p.value
                      ? { backgroundColor: p.color + '25', borderColor: p.color, color: p.color }
                      : { borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }),
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Date & Duration — 16px below priority */}
          <div className="grid grid-cols-2" style={{ gap: 16, marginTop: 16 }}>
            <div>
              <label className="block text-[var(--color-text-muted)]" style={{ fontSize: 11, marginBottom: 6 }}>
                Start date & time
              </label>
              <input
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-[var(--color-bg)] text-[var(--color-text)] rounded-xl border border-[var(--color-border)] outline-none focus:border-[var(--color-accent)] [color-scheme:dark]"
                style={{ fontSize: 13, padding: '8px 12px' }}
              />
            </div>
            <div>
              <label className="block text-[var(--color-text-muted)]" style={{ fontSize: 11, marginBottom: 6 }}>
                Duration ({formatDuration(durationMinutes)})
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={5}
                  step={5}
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Math.max(5, parseInt(e.target.value) || 5))}
                  className="w-full bg-[var(--color-bg)] text-[var(--color-text)] rounded-xl border border-[var(--color-border)] outline-none focus:border-[var(--color-accent)] [color-scheme:dark]"
                  style={{ fontSize: 13, padding: '8px 40px 8px 12px' }}
                />
                <span
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none"
                  style={{ fontSize: 11 }}
                >
                  min
                </span>
              </div>
              <div className="flex" style={{ gap: 4, marginTop: 6 }}>
                {DURATION_PRESETS.map((d) => (
                  <button
                    key={d.value}
                    onClick={() => setDurationMinutes(d.value)}
                    className={`rounded-md transition-colors ${
                      durationMinutes === d.value
                        ? 'bg-[var(--color-accent)] text-white'
                        : 'bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
                    }`}
                    style={{ height: 28, paddingLeft: 10, paddingRight: 10, fontSize: 11 }}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── Constraints section ── */}
          <div className="border-t border-[var(--color-border)]" style={{ marginTop: 20 }} />
          <p className="font-semibold text-[var(--color-text-secondary)]" style={{ fontSize: 11, marginTop: 16 }}>
            Constraints
          </p>

          {/* Allowed Days — 16px below section label */}
          <div style={{ marginTop: 16 }}>
            <label className="block text-[var(--color-text-muted)]" style={{ fontSize: 11, marginBottom: 6 }}>
              Schedule only on
            </label>
            <div className="flex" style={{ gap: 6 }}>
              {DAYS.map((d) => (
                <button
                  key={d.value}
                  onClick={() => toggleDay(d.value)}
                  className={`flex items-center justify-center rounded-lg border transition-colors ${
                    allowedDays.includes(d.value)
                      ? 'bg-[var(--color-accent)] border-[var(--color-accent)] text-white'
                      : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-border-hover)] hover:text-[var(--color-text-secondary)]'
                  }`}
                  style={{ width: 34, height: 34, fontSize: 11 }}
                >
                  {d.label}
                </button>
              ))}
            </div>
            {allowedDays.length === 0 && (
              <p className="text-[var(--color-text-muted)]" style={{ fontSize: 11, marginTop: 4 }}>
                Any day
              </p>
            )}
          </div>

          {/* Time Blocks — 16px below days */}
          <div style={{ marginTop: 16 }}>
            <label className="block text-[var(--color-text-muted)]" style={{ fontSize: 11, marginBottom: 6 }}>
              Schedule during
            </label>
            {timeBlocks.length > 0 ? (
              <>
                <div className="flex flex-wrap" style={{ gap: 8 }}>
                  {timeBlocks.map((tb) => {
                    const isSelected = selectedTimeBlockIds.includes(tb.id)
                    return (
                      <button
                        key={tb.id}
                        onClick={() => toggleTimeBlock(tb.id)}
                        className="flex items-center rounded-xl border transition-colors"
                        style={{
                          gap: 8,
                          padding: '8px 14px',
                          fontSize: 12,
                          ...(isSelected
                            ? { backgroundColor: tb.color + '20', borderColor: tb.color + '60', color: tb.color }
                            : { borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }),
                        }}
                      >
                        <div
                          className="rounded-full shrink-0"
                          style={{ width: 10, height: 10, backgroundColor: tb.color }}
                        />
                        <span>{tb.name}</span>
                        <span style={{ fontSize: 10, opacity: 0.6 }}>
                          {tb.startTime}–{tb.endTime}
                        </span>
                      </button>
                    )
                  })}
                </div>
                {selectedTimeBlockIds.length === 0 && (
                  <p className="text-[var(--color-text-muted)]" style={{ fontSize: 11, marginTop: 4 }}>
                    Any time
                  </p>
                )}
              </>
            ) : (
              <p className="text-[var(--color-text-muted)] leading-relaxed" style={{ fontSize: 11 }}>
                No schedule blocks defined yet. Use <strong className="text-[var(--color-text-secondary)]">Schedule Blocks</strong> in the toolbar to create them.
              </p>
            )}
          </div>
        </div>

        {/* ── Footer ── */}
        <div
          className="flex items-center justify-between shrink-0 border-t border-[var(--color-border)]"
          style={{ padding: '14px 24px' }}
        >
          <button
            onClick={handleDelete}
            className="text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-colors"
            style={{ padding: '6px 12px', fontSize: 12 }}
          >
            Delete
          </button>
          <div className="flex" style={{ gap: 8 }}>
            <button
              onClick={onClose}
              className="text-[var(--color-text-secondary)] hover:text-[var(--color-text)] rounded-lg transition-colors"
              style={{ padding: '6px 16px', fontSize: 12 }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="bg-[var(--color-accent)] text-white rounded-lg hover:bg-[var(--color-accent-hover)] transition-colors"
              style={{ padding: '6px 20px', fontSize: 12 }}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
