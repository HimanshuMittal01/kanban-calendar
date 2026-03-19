import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { nanoid } from 'nanoid'
import type { Card, KanbanList, TimeBlock, TimeFilterRange, GridInterval } from '@/types'
import { DEFAULT_LISTS, LIST_COLORS } from '@/lib/constants'

export interface AppState {
  // Data
  lists: KanbanList[]
  cards: Card[]
  timeBlocks: TimeBlock[]

  // UI State
  activeFilter: TimeFilterRange | null
  gridInterval: GridInterval
  selectedCardId: string | null

  // List CRUD
  addList: (title: string) => void
  updateList: (id: string, updates: Partial<KanbanList>) => void
  deleteList: (id: string) => void
  reorderLists: (fromIndex: number, toIndex: number) => void

  // Card CRUD
  addCard: (listId: string, title: string) => void
  updateCard: (id: string, updates: Partial<Card>) => void
  deleteCard: (id: string) => void
  moveCard: (cardId: string, toListId: string, newIndex: number) => void

  // Time Block CRUD
  addTimeBlock: (block: Omit<TimeBlock, 'id'>) => void
  updateTimeBlock: (id: string, updates: Partial<TimeBlock>) => void
  deleteTimeBlock: (id: string) => void

  // UI Actions
  setActiveFilter: (filter: TimeFilterRange | null) => void
  setGridInterval: (interval: GridInterval) => void
  setSelectedCard: (cardId: string | null) => void
}

function createDefaultLists(): KanbanList[] {
  return DEFAULT_LISTS.map((l, i) => ({
    id: nanoid(),
    title: l.title,
    color: l.color,
    sortOrder: i,
  }))
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial data
      lists: createDefaultLists(),
      cards: [],
      timeBlocks: [],

      // UI state
      activeFilter: null,
      gridInterval: 30,
      selectedCardId: null,

      // List CRUD
      addList: (title: string) => {
        const { lists } = get()
        const colorIndex = lists.length % LIST_COLORS.length
        const newList: KanbanList = {
          id: nanoid(),
          title,
          color: LIST_COLORS[colorIndex],
          sortOrder: lists.length,
        }
        set({ lists: [...lists, newList] })
      },

      updateList: (id, updates) => {
        set({
          lists: get().lists.map((l) => (l.id === id ? { ...l, ...updates } : l)),
        })
      },

      deleteList: (id) => {
        set({
          lists: get()
            .lists.filter((l) => l.id !== id)
            .map((l, i) => ({ ...l, sortOrder: i })),
          cards: get().cards.filter((c) => c.listId !== id),
        })
      },

      reorderLists: (fromIndex, toIndex) => {
        const lists = [...get().lists].sort((a, b) => a.sortOrder - b.sortOrder)
        const [moved] = lists.splice(fromIndex, 1)
        lists.splice(toIndex, 0, moved)
        set({ lists: lists.map((l, i) => ({ ...l, sortOrder: i })) })
      },

      // Card CRUD
      addCard: (listId, title) => {
        const cardsInList = get().cards.filter((c) => c.listId === listId)
        const now = new Date().toISOString()
        const newCard: Card = {
          id: nanoid(),
          title,
          description: '',
          listId,
          startDate: null,
          durationMinutes: 60,
          priority: 'medium',
          allowedDays: [],
          timeBlockIds: [],
          createdAt: now,
          updatedAt: now,
          sortOrder: cardsInList.length,
        }
        set({ cards: [...get().cards, newCard] })
      },

      updateCard: (id, updates) => {
        set({
          cards: get().cards.map((c) =>
            c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c
          ),
        })
      },

      deleteCard: (id) => {
        const card = get().cards.find((c) => c.id === id)
        if (!card) return
        set({
          cards: get()
            .cards.filter((c) => c.id !== id)
            .map((c) =>
              c.listId === card.listId && c.sortOrder > card.sortOrder
                ? { ...c, sortOrder: c.sortOrder - 1 }
                : c
            ),
          selectedCardId: get().selectedCardId === id ? null : get().selectedCardId,
        })
      },

      moveCard: (cardId, toListId, newIndex) => {
        const cards = get().cards
        const card = cards.find((c) => c.id === cardId)
        if (!card) return

        // Remove from old list and fix sort orders
        const oldListCards = cards
          .filter((c) => c.listId === card.listId && c.id !== cardId)
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((c, i) => ({ ...c, sortOrder: i }))

        // If moving within same list
        if (card.listId === toListId) {
          oldListCards.splice(newIndex, 0, {
            ...card,
            sortOrder: newIndex,
            updatedAt: new Date().toISOString(),
          })
          const reindexed = oldListCards.map((c, i) => ({ ...c, sortOrder: i }))
          const otherCards = cards.filter((c) => c.listId !== card.listId)
          set({ cards: [...otherCards, ...reindexed] })
        } else {
          // Insert into new list
          const newListCards = cards
            .filter((c) => c.listId === toListId)
            .sort((a, b) => a.sortOrder - b.sortOrder)
          newListCards.splice(newIndex, 0, {
            ...card,
            listId: toListId,
            sortOrder: newIndex,
            updatedAt: new Date().toISOString(),
          })
          const reindexedNew = newListCards.map((c, i) => ({ ...c, sortOrder: i }))
          const otherCards = cards.filter(
            (c) => c.listId !== card.listId && c.listId !== toListId
          )
          set({ cards: [...otherCards, ...oldListCards, ...reindexedNew] })
        }
      },

      // Time Block CRUD
      addTimeBlock: (block) => {
        const newBlock: TimeBlock = { ...block, id: nanoid() }
        set({ timeBlocks: [...get().timeBlocks, newBlock] })
      },

      updateTimeBlock: (id, updates) => {
        set({
          timeBlocks: get().timeBlocks.map((b) => (b.id === id ? { ...b, ...updates } : b)),
        })
      },

      deleteTimeBlock: (id) => {
        set({
          timeBlocks: get().timeBlocks.filter((b) => b.id !== id),
          // Remove references from cards
          cards: get().cards.map((c) => ({
            ...c,
            timeBlockIds: c.timeBlockIds.filter((tbId) => tbId !== id),
          })),
        })
      },

      // UI Actions
      setActiveFilter: (filter) => set({ activeFilter: filter }),
      setGridInterval: (interval) => set({ gridInterval: interval }),
      setSelectedCard: (cardId) => set({ selectedCardId: cardId }),
    }),
    {
      name: 'kanban-calendar-storage',
      version: 1,
    }
  )
)
