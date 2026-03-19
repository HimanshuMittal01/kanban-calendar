import { useAppStore } from '@/store'
import { FilterBar } from '@/components/layout/FilterBar'
import { Toolbar } from '@/components/layout/Toolbar'
import { KanbanBoard } from '@/components/kanban/KanbanBoard'
import { CalendarGrid } from '@/components/calendar/CalendarGrid'
import { CardDetailModal } from '@/components/kanban/CardDetailModal'
import { TimeBlockManager } from '@/components/schedule/TimeBlockManager'
import { useState } from 'react'

export default function App() {
  const activeFilter = useAppStore((s) => s.activeFilter)
  const selectedCardId = useAppStore((s) => s.selectedCardId)
  const setSelectedCard = useAppStore((s) => s.setSelectedCard)
  const [showTimeBlocks, setShowTimeBlocks] = useState(false)

  return (
    <div className="flex flex-col h-screen bg-[var(--color-bg)]">
      {/* Drag region for macOS title bar — minimal, just app name */}
      <div
        className="drag-region flex items-center shrink-0 border-b border-[var(--color-border)]"
        style={{ height: 52, paddingLeft: 80, paddingRight: 20 }}
      >
        <span className="no-drag text-sm font-semibold text-[var(--color-text)] shrink-0">
          Kanban Calendar
        </span>
        <div className="flex-1" />
        <Toolbar onOpenTimeBlocks={() => setShowTimeBlocks(true)} />
      </div>

      {/* Filter tab bar */}
      <FilterBar />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Kanban board - takes remaining space or shares with calendar */}
        <div className={`${activeFilter ? 'h-1/2' : 'flex-1'} min-h-0 overflow-hidden`}>
          <KanbanBoard />
        </div>

        {/* Calendar grid - shown when filter is active */}
        {activeFilter && (
          <div className="h-1/2 border-t border-[var(--color-border)] min-h-0 overflow-hidden">
            <CalendarGrid />
          </div>
        )}
      </div>

      {/* Card detail modal */}
      {selectedCardId && (
        <CardDetailModal
          cardId={selectedCardId}
          onClose={() => setSelectedCard(null)}
        />
      )}

      {/* Time block manager */}
      {showTimeBlocks && (
        <TimeBlockManager onClose={() => setShowTimeBlocks(false)} />
      )}
    </div>
  )
}
