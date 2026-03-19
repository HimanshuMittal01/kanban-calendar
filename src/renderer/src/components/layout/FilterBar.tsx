import { useAppStore } from '@/store'
import type { TimeFilterRange } from '@/types'

const FILTERS: { label: string; value: TimeFilterRange }[] = [
  { label: 'Today', value: 'today' },
  { label: 'This Week', value: 'this-week' },
  { label: 'Next Week', value: 'next-week' },
]

export function FilterBar() {
  const activeFilter = useAppStore((s) => s.activeFilter)
  const setActiveFilter = useAppStore((s) => s.setActiveFilter)

  return (
    <div
      className="shrink-0 flex items-center border-b border-[var(--color-border)] bg-[var(--color-bg)]"
      style={{ height: 36, paddingLeft: 20, paddingRight: 20, gap: 0 }}
    >
      {FILTERS.map((f) => {
        const isActive = activeFilter === f.value
        return (
          <button
            key={f.value}
            onClick={() => setActiveFilter(isActive ? null : f.value)}
            className="relative transition-colors"
            style={{
              height: 36,
              padding: '0 16px',
              fontSize: 12,
              fontWeight: isActive ? 600 : 400,
              color: isActive ? 'var(--color-accent)' : 'var(--color-text-secondary)',
            }}
          >
            {f.label}
            {/* Active indicator bar */}
            {isActive && (
              <div
                className="absolute bottom-0 left-4 right-4 rounded-t-sm"
                style={{ height: 2, backgroundColor: 'var(--color-accent)' }}
              />
            )}
          </button>
        )
      })}
    </div>
  )
}
