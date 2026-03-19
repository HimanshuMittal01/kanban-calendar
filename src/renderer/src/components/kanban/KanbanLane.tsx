import { useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useAppStore } from '@/store'
import { KanbanCard } from './KanbanCard'
import { LIST_COLORS } from '@/lib/constants'
import type { Card, KanbanList } from '@/types'

interface Props {
  list: KanbanList
  cards: Card[]
  isOverlay?: boolean
}

export function KanbanLane({ list, cards, isOverlay }: Props) {
  const updateList = useAppStore((s) => s.updateList)
  const deleteList = useAppStore((s) => s.deleteList)
  const addCard = useAppStore((s) => s.addCard)

  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(list.title)
  const [addingCard, setAddingCard] = useState(false)
  const [newCardTitle, setNewCardTitle] = useState('')
  const [showMenu, setShowMenu] = useState(false)

  const { setNodeRef, isOver } = useDroppable({ id: list.id })

  function handleRename() {
    if (editTitle.trim() && editTitle.trim() !== list.title) {
      updateList(list.id, { title: editTitle.trim() })
    }
    setIsEditing(false)
  }

  function handleAddCard() {
    if (newCardTitle.trim()) {
      addCard(list.id, newCardTitle.trim())
      setNewCardTitle('')
      setAddingCard(false)
    }
  }

  return (
    <div
      ref={setNodeRef}
      className={`shrink-0 w-80 bg-[var(--color-surface)] rounded-xl flex flex-col max-h-full ${
        isOver ? 'ring-2 ring-[var(--color-accent)]/40' : ''
      } ${isOverlay ? 'opacity-80 shadow-2xl' : ''}`}
    >
      {/* Lane header */}
      <div className="flex items-center gap-3 px-4 py-4 shrink-0">
        <div
          className="w-3 h-3 rounded-full shrink-0"
          style={{ backgroundColor: list.color }}
        />

        {isEditing ? (
          <input
            autoFocus
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={handleRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRename()
              if (e.key === 'Escape') {
                setEditTitle(list.title)
                setIsEditing(false)
              }
            }}
            className="flex-1 bg-transparent text-sm font-semibold text-[var(--color-text)] outline-none border-b border-[var(--color-accent)]"
          />
        ) : (
          <span
            className="flex-1 text-sm font-semibold text-[var(--color-text)] cursor-pointer"
            onDoubleClick={() => setIsEditing(true)}
          >
            {list.title}
          </span>
        )}

        <span className="text-xs text-[var(--color-text-muted)]">
          {cards.length}
        </span>

        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] text-sm px-1"
          >
            ...
          </button>
          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 top-7 z-20 bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-xl shadow-xl py-2 min-w-[160px]">
                <button
                  onClick={() => {
                    setIsEditing(true)
                    setShowMenu(false)
                  }}
                  className="w-full text-left px-4 py-2 text-xs text-[var(--color-text)] hover:bg-[var(--color-surface-hover)]"
                >
                  Rename
                </button>

                {/* Color picker */}
                <div className="px-4 py-2">
                  <span className="text-[10px] text-[var(--color-text-muted)] block mb-2">Color</span>
                  <div className="flex flex-wrap gap-1.5">
                    {LIST_COLORS.map((c) => (
                      <button
                        key={c}
                        onClick={() => {
                          updateList(list.id, { color: c })
                        }}
                        className={`w-5 h-5 rounded-full transition-transform hover:scale-110 ${
                          list.color === c ? 'ring-2 ring-white ring-offset-1 ring-offset-[var(--color-surface-elevated)]' : ''
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>

                <div className="border-t border-[var(--color-border)] my-1" />

                <button
                  onClick={() => {
                    deleteList(list.id)
                    setShowMenu(false)
                  }}
                  className="w-full text-left px-4 py-2 text-xs text-red-400 hover:bg-[var(--color-surface-hover)]"
                >
                  Delete List
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Cards */}
      <div className="flex-1 overflow-y-auto px-3 pb-2 min-h-0">
        <SortableContext
          items={cards.map((c) => c.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="flex flex-col" style={{ gap: 8 }}>
            {cards.length === 0 && (
              <p
                className="text-center text-[var(--color-text-muted)]"
                style={{ fontSize: 11, paddingTop: 24, paddingBottom: 24 }}
              >
                No cards yet
              </p>
            )}
            {cards.map((card) => (
              <KanbanCard key={card.id} card={card} />
            ))}
          </div>
        </SortableContext>
      </div>

      {/* Add card */}
      <div className="shrink-0 px-3 pb-3 pt-1">
        {addingCard ? (
          <div className="bg-[var(--color-bg)] rounded-xl p-3">
            <input
              autoFocus
              value={newCardTitle}
              onChange={(e) => setNewCardTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddCard()
                if (e.key === 'Escape') {
                  setAddingCard(false)
                  setNewCardTitle('')
                }
              }}
              placeholder="Card title..."
              className="w-full bg-transparent text-sm text-[var(--color-text)] outline-none"
            />
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleAddCard}
                className="px-4 py-1.5 text-xs bg-[var(--color-accent)] text-white rounded-lg hover:bg-[var(--color-accent-hover)]"
              >
                Add Card
              </button>
              <button
                onClick={() => {
                  setAddingCard(false)
                  setNewCardTitle('')
                }}
                className="px-3 py-1.5 text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setAddingCard(true)}
            className="w-full py-2.5 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] bg-[var(--color-bg)]/50 hover:bg-[var(--color-bg)] rounded-xl border border-dashed border-[var(--color-border)] hover:border-[var(--color-border-hover)] transition-colors"
          >
            + Add Card
          </button>
        )}
      </div>
    </div>
  )
}
