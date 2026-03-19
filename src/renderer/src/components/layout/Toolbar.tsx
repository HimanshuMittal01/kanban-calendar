import { useAppStore } from '@/store'
import type { GridInterval } from '@/types'

export function Toolbar({ onOpenTimeBlocks }: { onOpenTimeBlocks: () => void }) {
  const activeFilter = useAppStore((s) => s.activeFilter)
  const gridInterval = useAppStore((s) => s.gridInterval)
  const setGridInterval = useAppStore((s) => s.setGridInterval)

  return (
    <div className="no-drag flex items-center" style={{ gap: 10 }}>
      {activeFilter && (
        <div className="flex items-center gap-1 bg-[var(--color-surface)] rounded-lg p-1 shrink-0">
          {([15, 30] as GridInterval[]).map((interval) => (
            <button
              key={interval}
              onClick={() => setGridInterval(interval)}
              className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                gridInterval === interval
                  ? 'bg-[var(--color-accent)] text-white'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
              }`}
            >
              {interval}m
            </button>
          ))}
        </div>
      )}

      <button
        onClick={onOpenTimeBlocks}
        className="px-4 text-xs font-medium text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] bg-[var(--color-accent)]/10 hover:bg-[var(--color-accent)]/20 rounded-lg transition-colors border border-[var(--color-accent)]/25 shrink-0"
        style={{ height: 32 }}
      >
        Schedule Blocks
      </button>
    </div>
  )
}
