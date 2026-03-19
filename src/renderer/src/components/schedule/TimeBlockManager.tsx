import { useState } from 'react'
import { useAppStore } from '@/store'
import { TIME_BLOCK_COLORS } from '@/lib/constants'
import type { DayOfWeek } from '@/types'

const DAYS: { label: string; value: DayOfWeek }[] = [
  { label: 'Mon', value: 'mon' },
  { label: 'Tue', value: 'tue' },
  { label: 'Wed', value: 'wed' },
  { label: 'Thu', value: 'thu' },
  { label: 'Fri', value: 'fri' },
  { label: 'Sat', value: 'sat' },
  { label: 'Sun', value: 'sun' },
]

export function TimeBlockManager({ onClose }: { onClose: () => void }) {
  const timeBlocks = useAppStore((s) => s.timeBlocks)
  const addTimeBlock = useAppStore((s) => s.addTimeBlock)
  const updateTimeBlock = useAppStore((s) => s.updateTimeBlock)
  const deleteTimeBlock = useAppStore((s) => s.deleteTimeBlock)

  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('12:00')
  const [daysOfWeek, setDaysOfWeek] = useState<DayOfWeek[]>(['mon', 'tue', 'wed', 'thu', 'fri'])
  const [color, setColor] = useState(TIME_BLOCK_COLORS[0])

  function toggleDay(day: DayOfWeek) {
    setDaysOfWeek((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    )
  }

  function handleAdd() {
    if (name.trim() && daysOfWeek.length > 0) {
      addTimeBlock({
        name: name.trim(),
        startTime,
        endTime,
        daysOfWeek,
        color,
      })
      setName('')
      setStartTime('09:00')
      setEndTime('12:00')
      setDaysOfWeek(['mon', 'tue', 'wed', 'thu', 'fri'])
      setColor(TIME_BLOCK_COLORS[(timeBlocks.length + 1) % TIME_BLOCK_COLORS.length])
      setAdding(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      <div className="relative bg-[var(--color-surface-elevated)] rounded-2xl shadow-2xl w-[520px] max-h-[80vh] overflow-y-auto border border-[var(--color-border)]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)]">
          <h2 className="text-sm font-semibold text-[var(--color-text)]">
            Working Schedule Blocks
          </h2>
          <button
            onClick={onClose}
            className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] text-lg"
          >
            &times;
          </button>
        </div>

        <div className="px-6 py-4 space-y-3">
          {timeBlocks.length === 0 && !adding && (
            <p className="text-sm text-[var(--color-text-muted)] text-center py-6">
              No schedule blocks defined yet.
              <br />
              Create blocks like "Creative Time" or "Admin Time" to constrain when cards can be scheduled.
            </p>
          )}

          {/* Existing blocks */}
          {timeBlocks.map((block) => (
            <div
              key={block.id}
              className="bg-[var(--color-bg)] rounded-lg p-3 border border-[var(--color-border)]"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: block.color }}
                  />
                  <span className="text-sm font-medium text-[var(--color-text)]">
                    {block.name}
                  </span>
                </div>
                <button
                  onClick={() => deleteTimeBlock(block.id)}
                  className="text-xs text-red-400 hover:text-red-300"
                >
                  Remove
                </button>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs text-[var(--color-text-secondary)]">
                  {block.startTime} - {block.endTime}
                </span>
                <span className="text-xs text-[var(--color-text-muted)]">
                  {block.daysOfWeek
                    .map((d) => d.charAt(0).toUpperCase() + d.slice(1, 3))
                    .join(', ')}
                </span>
              </div>
            </div>
          ))}

          {/* Add form */}
          {adding ? (
            <div className="bg-[var(--color-bg)] rounded-lg p-4 border border-[var(--color-accent)]/30 space-y-3">
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Block name (e.g., Creative Time)"
                className="w-full bg-[var(--color-surface)] text-sm text-[var(--color-text)] px-3 py-2 rounded-lg border border-[var(--color-border)] outline-none focus:border-[var(--color-accent)]"
              />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-[var(--color-text-muted)] mb-1 block">
                    Start
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full bg-[var(--color-surface)] text-sm text-[var(--color-text)] px-3 py-2 rounded-lg border border-[var(--color-border)] outline-none [color-scheme:dark]"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-[var(--color-text-muted)] mb-1 block">
                    End
                  </label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full bg-[var(--color-surface)] text-sm text-[var(--color-text)] px-3 py-2 rounded-lg border border-[var(--color-border)] outline-none [color-scheme:dark]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-[var(--color-text-muted)] mb-1 block">
                  Days
                </label>
                <div className="flex gap-1.5">
                  {DAYS.map((d) => (
                    <button
                      key={d.value}
                      onClick={() => toggleDay(d.value)}
                      className={`w-9 h-8 text-[10px] rounded-md border transition-colors ${
                        daysOfWeek.includes(d.value)
                          ? 'bg-[var(--color-accent)] border-[var(--color-accent)] text-white'
                          : 'border-[var(--color-border)] text-[var(--color-text-muted)]'
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] text-[var(--color-text-muted)] mb-1 block">
                  Color
                </label>
                <div className="flex gap-2">
                  {TIME_BLOCK_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setColor(c)}
                      className={`w-6 h-6 rounded-full border-2 transition-transform ${
                        color === c
                          ? 'border-white scale-110'
                          : 'border-transparent hover:scale-105'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleAdd}
                  className="px-4 py-1.5 text-xs bg-[var(--color-accent)] text-white rounded-lg hover:bg-[var(--color-accent-hover)]"
                >
                  Add Block
                </button>
                <button
                  onClick={() => setAdding(false)}
                  className="px-4 py-1.5 text-xs text-[var(--color-text-secondary)]"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setAdding(true)}
              className="w-full py-2.5 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] bg-[var(--color-bg)] hover:bg-[var(--color-surface)] rounded-lg border border-dashed border-[var(--color-border)] hover:border-[var(--color-border-hover)] transition-colors"
            >
              + Add Schedule Block
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
