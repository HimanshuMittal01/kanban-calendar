import { useState } from 'react'
import { useAppStore } from '@/store'
import { PERSON_COLORS } from '@/lib/constants'

export function PeopleManager({ onClose }: { onClose: () => void }) {
  const people = useAppStore((s) => s.people)
  const addPerson = useAppStore((s) => s.addPerson)
  const deletePerson = useAppStore((s) => s.deletePerson)

  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [color, setColor] = useState(PERSON_COLORS[0])

  function handleAdd() {
    if (name.trim()) {
      addPerson(name.trim(), color)
      setName('')
      setColor(PERSON_COLORS[(people.length + 1) % PERSON_COLORS.length])
      setAdding(false)
    }
  }

  function handleCancel() {
    setName('')
    setColor(PERSON_COLORS[0])
    setAdding(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div
        className="relative flex flex-col border border-[var(--color-border)]"
        style={{
          backgroundColor: 'var(--color-surface-elevated)',
          borderRadius: 16,
          width: 360,
          maxHeight: '70vh',
          boxShadow: '0 24px 48px rgba(0,0,0,0.4)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between shrink-0"
          style={{ padding: '18px 20px 14px' }}
        >
          <span className="text-sm font-semibold text-[var(--color-text)]">People</span>
          <button
            onClick={onClose}
            className="flex items-center justify-center rounded-md text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-hover)] transition-colors"
            style={{ width: 26, height: 26, fontSize: 16 }}
          >
            &times;
          </button>
        </div>

        {/* People list */}
        <div className="overflow-y-auto min-h-0" style={{ padding: '0 20px' }}>
          {people.length === 0 && !adding && (
            <p
              className="text-center text-[var(--color-text-muted)]"
              style={{ fontSize: 12, padding: '24px 0 20px' }}
            >
              No people yet
            </p>
          )}

          {people.length > 0 && (
            <div style={{ paddingBottom: 8 }}>
              {people.map((person) => (
                <div
                  key={person.id}
                  className="group flex items-center"
                  style={{ height: 36, gap: 10 }}
                >
                  <div
                    className="rounded-full shrink-0"
                    style={{ width: 8, height: 8, backgroundColor: person.color }}
                  />
                  <span
                    className="flex-1 text-[var(--color-text)]"
                    style={{ fontSize: 13 }}
                  >
                    {person.name}
                  </span>
                  <button
                    onClick={() => deletePerson(person.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-[var(--color-text-muted)] hover:text-red-400"
                    style={{ fontSize: 16, lineHeight: 1, padding: '2px 4px' }}
                    title="Remove"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add form */}
        {adding ? (
          <div
            className="shrink-0 border-t border-[var(--color-border)]"
            style={{ padding: '14px 20px 18px' }}
          >
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAdd()
                if (e.key === 'Escape') handleCancel()
              }}
              placeholder="Person name"
              className="w-full bg-transparent text-[var(--color-text)] outline-none"
              style={{ fontSize: 13, marginBottom: 12 }}
            />

            {/* Color picker */}
            <div className="flex items-center" style={{ gap: 6, marginBottom: 14 }}>
              {PERSON_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className="transition-transform"
                  style={{
                    width: color === c ? 18 : 14,
                    height: color === c ? 18 : 14,
                    borderRadius: '50%',
                    backgroundColor: c,
                    outline: color === c ? `2px solid ${c}` : 'none',
                    outlineOffset: 2,
                    flexShrink: 0,
                  }}
                />
              ))}
            </div>

            <div className="flex items-center" style={{ gap: 8 }}>
              <button
                onClick={handleAdd}
                className="bg-[var(--color-accent)] text-white rounded-lg hover:bg-[var(--color-accent-hover)] transition-colors"
                style={{ padding: '6px 14px', fontSize: 12 }}
              >
                Add
              </button>
              <button
                onClick={handleCancel}
                className="text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors"
                style={{ fontSize: 12 }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div
            className="shrink-0 border-t border-[var(--color-border)]"
            style={{ padding: '12px 20px' }}
          >
            <button
              onClick={() => setAdding(true)}
              className="text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors"
              style={{ fontSize: 12 }}
            >
              + New person
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
