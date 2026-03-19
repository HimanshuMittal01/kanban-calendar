import { useState, useMemo, useRef, useEffect } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
} from '@dnd-kit/core'
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable'
import { useAppStore } from '@/store'
import { KanbanLane } from './KanbanLane'
import { KanbanCard } from './KanbanCard'
import { isCardInRange } from '@/lib/dateUtils'
import type { Card } from '@/types'

export function KanbanBoard() {
  const lists = useAppStore((s) => s.lists)
  const cards = useAppStore((s) => s.cards)
  const activeFilter = useAppStore((s) => s.activeFilter)
  const moveCard = useAppStore((s) => s.moveCard)
  const addList = useAppStore((s) => s.addList)

  const [activeCard, setActiveCard] = useState<Card | null>(null)
  const [showAddPopover, setShowAddPopover] = useState(false)
  const [newListTitle, setNewListTitle] = useState('')
  const addBtnRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const sortedLists = useMemo(
    () => [...lists].sort((a, b) => a.sortOrder - b.sortOrder),
    [lists]
  )

  const filteredCards = useMemo(() => {
    if (!activeFilter) return cards
    return cards.filter(
      (c) => c.startDate && isCardInRange(c.startDate, activeFilter)
    )
  }, [cards, activeFilter])

  const cardsByList = useMemo(() => {
    const map: Record<string, Card[]> = {}
    for (const list of sortedLists) {
      map[list.id] = filteredCards
        .filter((c) => c.listId === list.id)
        .sort((a, b) => a.sortOrder - b.sortOrder)
    }
    return map
  }, [filteredCards, sortedLists])

  // Close popover on outside click
  useEffect(() => {
    if (!showAddPopover) return
    function handleClick(e: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        addBtnRef.current &&
        !addBtnRef.current.contains(e.target as Node)
      ) {
        setShowAddPopover(false)
        setNewListTitle('')
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showAddPopover])

  function handleDragStart(event: DragStartEvent) {
    const card = cards.find((c) => c.id === event.active.id)
    if (card) setActiveCard(card)
  }

  function handleDragOver(_event: DragOverEvent) {
    // Handled in drag end for simplicity
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveCard(null)
    const { active, over } = event
    if (!over) return

    const cardId = active.id as string
    const card = cards.find((c) => c.id === cardId)
    if (!card) return

    const overId = over.id as string
    const overCard = cards.find((c) => c.id === overId)
    const overList = lists.find((l) => l.id === overId)

    let toListId: string
    let newIndex: number

    if (overCard) {
      toListId = overCard.listId
      const listCards = cards
        .filter((c) => c.listId === toListId && c.id !== cardId)
        .sort((a, b) => a.sortOrder - b.sortOrder)
      newIndex = listCards.findIndex((c) => c.id === overCard.id)
      if (newIndex === -1) newIndex = listCards.length
    } else if (overList) {
      toListId = overList.id
      newIndex = cards.filter((c) => c.listId === toListId).length
    } else {
      return
    }

    moveCard(cardId, toListId, newIndex)
  }

  function handleAddList() {
    if (newListTitle.trim()) {
      addList(newListTitle.trim())
      setNewListTitle('')
      setShowAddPopover(false)
    }
  }

  return (
    <div className="h-full flex overflow-x-auto" style={{ padding: 20, gap: 10 }}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={sortedLists.map((l) => l.id)}
          strategy={horizontalListSortingStrategy}
        >
          {sortedLists.map((list) => (
            <KanbanLane
              key={list.id}
              list={list}
              cards={cardsByList[list.id] || []}
            />
          ))}
        </SortableContext>

        <DragOverlay>
          {activeCard ? <KanbanCard card={activeCard} isOverlay /> : null}
        </DragOverlay>
      </DndContext>

      {/* Add list button + popover */}
      <div className="shrink-0 relative" style={{ width: 80 }}>
        <button
          ref={addBtnRef}
          onClick={() => setShowAddPopover(!showAddPopover)}
          className="text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)] rounded-xl transition-colors flex items-center justify-center"
          style={{ width: 44, height: 44, fontSize: 20 }}
          title="Add list"
        >
          +
        </button>

        {showAddPopover && (
          <div
            ref={popoverRef}
            className="absolute top-12 left-0 z-30 bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-xl shadow-xl"
            style={{ width: 260, padding: 12 }}
          >
            <label
              className="block text-[var(--color-text-muted)]"
              style={{ fontSize: 11, marginBottom: 6 }}
            >
              New list
            </label>
            <input
              autoFocus
              value={newListTitle}
              onChange={(e) => setNewListTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddList()
                if (e.key === 'Escape') {
                  setShowAddPopover(false)
                  setNewListTitle('')
                }
              }}
              placeholder="List name..."
              className="w-full bg-[var(--color-bg)] text-sm text-[var(--color-text)] rounded-lg border border-[var(--color-border)] focus:border-[var(--color-accent)] outline-none"
              style={{ padding: '8px 12px' }}
            />
            <div className="flex" style={{ gap: 8, marginTop: 10 }}>
              <button
                onClick={handleAddList}
                className="bg-[var(--color-accent)] text-white rounded-lg hover:bg-[var(--color-accent-hover)] transition-colors"
                style={{ height: 28, paddingLeft: 14, paddingRight: 14, fontSize: 12 }}
              >
                Add
              </button>
              <button
                onClick={() => {
                  setShowAddPopover(false)
                  setNewListTitle('')
                }}
                className="text-[var(--color-text-secondary)] hover:text-[var(--color-text)] rounded-lg border border-[var(--color-border)] hover:border-[var(--color-border-hover)] transition-colors"
                style={{ height: 28, paddingLeft: 14, paddingRight: 14, fontSize: 12 }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
