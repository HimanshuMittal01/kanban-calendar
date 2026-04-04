import { useState } from 'react'

interface GhostCardProps {
  onAdd: (title: string) => void
}

export function GhostCard({ onAdd }: GhostCardProps) {
  const [active, setActive] = useState(false)
  const [value, setValue] = useState('')

  function commit() {
    if (value.trim()) {
      onAdd(value.trim())
    }
    setValue('')
    setActive(false)
  }

  function cancel() {
    setValue('')
    setActive(false)
  }

  if (active) {
    return (
      <div
        style={{
          backgroundColor: '#272727',
          border: '1px solid #383838',
          borderRadius: 10,
          padding: '10px 12px',
        }}
      >
        <input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit()
            if (e.key === 'Escape') cancel()
          }}
          onBlur={cancel}
          placeholder="Card title..."
          className="w-full bg-transparent text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] outline-none"
          style={{ fontSize: 13 }}
        />
      </div>
    )
  }

  return (
    <button
      onClick={() => setActive(true)}
      className="w-full text-left text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
      style={{ paddingLeft: 12, paddingTop: 6, paddingBottom: 6 }}
    >
      + New card
    </button>
  )
}
