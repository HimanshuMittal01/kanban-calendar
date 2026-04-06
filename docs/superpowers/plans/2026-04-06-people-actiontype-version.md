# People Rename, Action Type, Version Title — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rename categories→people throughout (types, store, components), add `actionType: 'Work' | 'Follow up'` to cards (only Follow up cards can have a person), and show the app version in the title bar.

**Architecture:** All changes are in the renderer. Types flow from `types/index.ts` → store → components. Migration v2→v3 handles the data shape change. No new files except `PeopleManager.tsx` (renamed from `CategoryManager.tsx`).

**Tech Stack:** React 19, Zustand 5, TypeScript, Electron-Vite, Tailwind CSS

---

## File Map

| Action | File |
|--------|------|
| Modify | `src/renderer/src/types/index.ts` |
| Modify | `src/renderer/src/lib/constants.ts` |
| Modify | `src/renderer/src/store/index.ts` |
| Create | `src/renderer/src/components/schedule/PeopleManager.tsx` |
| Delete | `src/renderer/src/components/schedule/CategoryManager.tsx` |
| Modify | `src/renderer/src/components/kanban/KanbanCard.tsx` |
| Modify | `src/renderer/src/components/kanban/CardDetailModal.tsx` |
| Modify | `src/renderer/src/components/layout/Toolbar.tsx` |
| Modify | `src/renderer/src/App.tsx` |

---

## Task 1: Update types

**Files:**
- Modify: `src/renderer/src/types/index.ts`

- [ ] **Step 1: Replace the entire file contents**

```typescript
export type DayOfWeek = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'

export type TimeFilterRange = 'today' | 'this-week' | 'next-week'

export type GridInterval = 15 | 30

export type ActionType = 'Work' | 'Follow up'

export interface Person {
  id: string
  name: string
  color: string // hex
}

export interface TimeBlock {
  id: string
  name: string
  startTime: string // HH:mm
  endTime: string // HH:mm
  daysOfWeek: DayOfWeek[]
  color: string // hex
}

export interface Card {
  id: string
  title: string
  description: string
  listId: string

  startDate: string | null // ISO 8601
  durationMinutes: number | null
  personId: string | null
  actionType: ActionType

  allowedDays: DayOfWeek[]
  timeBlockIds: string[]

  createdAt: string
  updatedAt: string
  sortOrder: number
}

export interface KanbanList {
  id: string
  title: string
  color: string
  sortOrder: number
}
```

- [ ] **Step 2: Verify TypeScript reports errors (expected — other files still use old names)**

```bash
cd /Users/himan/Documents/projects/kanban-calendar && npx tsc --noEmit 2>&1 | head -40
```

Expected: Multiple errors referencing `Category`, `categoryId`, etc. — this is correct, we fix them in subsequent tasks.

- [ ] **Step 3: Commit**

```bash
git add src/renderer/src/types/index.ts
git commit -m "refactor(types): rename Category→Person, categoryId→personId, add ActionType"
```

---

## Task 2: Rename constant

**Files:**
- Modify: `src/renderer/src/lib/constants.ts`

- [ ] **Step 1: Rename `CATEGORY_COLORS` to `PERSON_COLORS`**

Replace the entire file:

```typescript
export const LIST_COLORS = [
  '#4f8ff7', // blue
  '#f7794f', // orange
  '#4fc76f', // green
  '#c74f9b', // pink
  '#f7c94f', // yellow
  '#9b4fc7', // purple
  '#4fc7c7', // teal
  '#f74f4f', // red
]

export const TIME_BLOCK_COLORS = [
  '#3b82f6', // blue
  '#f59e0b', // amber
  '#10b981', // emerald
  '#ef4444', // red
  '#8b5cf6', // violet
  '#ec4899', // pink
]

export const PERSON_COLORS = [
  '#4f8ff7', // blue
  '#f7794f', // orange
  '#4fc76f', // green
  '#c74f9b', // pink
  '#f7c94f', // yellow
  '#9b4fc7', // purple
  '#4fc7c7', // teal
  '#f74f4f', // red
]

export const DEFAULT_LISTS = [
  { title: 'To Do', color: LIST_COLORS[0] },
  { title: 'In Progress', color: LIST_COLORS[1] },
  { title: 'Done', color: LIST_COLORS[2] },
]

export const HOURS_START = 6 // Calendar grid starts at 6 AM
export const HOURS_END = 22 // Calendar grid ends at 10 PM
```

- [ ] **Step 2: Commit**

```bash
git add src/renderer/src/lib/constants.ts
git commit -m "refactor(constants): rename CATEGORY_COLORS→PERSON_COLORS"
```

---

## Task 3: Update the store

**Files:**
- Modify: `src/renderer/src/store/index.ts`

- [ ] **Step 1: Replace the entire file**

```typescript
import { create } from 'zustand'
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware'
import { nanoid } from 'nanoid'
import type { ActionType, Card, Person, KanbanList, TimeBlock, TimeFilterRange, GridInterval } from '@/types'
import { DEFAULT_LISTS, LIST_COLORS } from '@/lib/constants'

// File-based storage via Electron IPC (synchronous read, async write)
const storeAPI = (window as unknown as { store?: { get: () => string | null; set: (data: string) => void } }).store

const fileStorage: StateStorage = {
  getItem: (name: string): string | null => {
    if (storeAPI) {
      return storeAPI.get()
    }
    return localStorage.getItem(name)
  },
  setItem: (name: string, value: string): void => {
    if (storeAPI) {
      storeAPI.set(value)
    } else {
      localStorage.setItem(name, value)
    }
  },
  removeItem: (name: string): void => {
    localStorage.removeItem(name)
  },
}

export interface AppState {
  // Data
  lists: KanbanList[]
  cards: Card[]
  timeBlocks: TimeBlock[]
  people: Person[]

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

  // Person CRUD
  addPerson: (name: string, color: string) => void
  updatePerson: (id: string, updates: Partial<Omit<Person, 'id'>>) => void
  deletePerson: (id: string) => void

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
      people: [],

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
          durationMinutes: null,
          personId: null,
          actionType: 'Work',
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

        const oldListCards = cards
          .filter((c) => c.listId === card.listId && c.id !== cardId)
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((c, i) => ({ ...c, sortOrder: i }))

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

      // Person CRUD
      addPerson: (name, color) => {
        const newPerson: Person = { id: nanoid(), name, color }
        set({ people: [...get().people, newPerson] })
      },

      updatePerson: (id, updates) => {
        set({
          people: get().people.map((p) => (p.id === id ? { ...p, ...updates } : p)),
        })
      },

      deletePerson: (id) => {
        set({
          people: get().people.filter((p) => p.id !== id),
          // Cards that lose their person revert to Work (Follow up without a person is invalid)
          cards: get().cards.map((c) =>
            c.personId === id ? { ...c, personId: null, actionType: 'Work' as ActionType } : c
          ),
        })
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
      version: 3,
      storage: createJSONStorage(() => fileStorage),
      migrate: (persistedState: unknown, version: number) => {
        let state = persistedState as Record<string, unknown>

        // v1 → v2: removed priority, added categoryId
        if (version <= 1) {
          state = {
            ...state,
            categories: [],
            cards: ((state.cards ?? []) as Record<string, unknown>[]).map(
              ({ priority: _priority, ...rest }) => ({ ...rest, categoryId: null })
            ),
          }
        }

        // v2 → v3: categories→people, categoryId→personId, add actionType
        if (version <= 2) {
          const oldCategories = (state.categories ?? []) as Record<string, unknown>[]
          state = {
            ...state,
            people: oldCategories.map(({ id, name, color }) => ({ id, name, color })),
            categories: undefined,
            cards: ((state.cards ?? []) as Record<string, unknown>[]).map((card) => {
              const categoryId = card.categoryId as string | null
              return {
                ...card,
                personId: categoryId ?? null,
                actionType: categoryId ? 'Follow up' : 'Work',
                categoryId: undefined,
              }
            }),
          }
        }

        return state
      },
    }
  )
)
```

- [ ] **Step 2: Check TypeScript — only component files should still error**

```bash
cd /Users/himan/Documents/projects/kanban-calendar && npx tsc --noEmit 2>&1 | head -40
```

Expected: Errors only in component files (`KanbanCard.tsx`, `CardDetailModal.tsx`, `CategoryManager.tsx`, `Toolbar.tsx`, `App.tsx`) — store and types should be clean.

- [ ] **Step 3: Commit**

```bash
git add src/renderer/src/store/index.ts
git commit -m "refactor(store): rename categories→people, add actionType, bump migration to v3"
```

---

## Task 4: Create PeopleManager, delete CategoryManager

**Files:**
- Create: `src/renderer/src/components/schedule/PeopleManager.tsx`
- Delete: `src/renderer/src/components/schedule/CategoryManager.tsx`

- [ ] **Step 1: Create `PeopleManager.tsx`**

```typescript
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
```

- [ ] **Step 2: Delete CategoryManager.tsx**

```bash
rm /Users/himan/Documents/projects/kanban-calendar/src/renderer/src/components/schedule/CategoryManager.tsx
```

- [ ] **Step 3: Commit**

```bash
git add src/renderer/src/components/schedule/PeopleManager.tsx
git add -u src/renderer/src/components/schedule/CategoryManager.tsx
git commit -m "refactor(schedule): rename CategoryManager→PeopleManager"
```

---

## Task 5: Update KanbanCard

**Files:**
- Modify: `src/renderer/src/components/kanban/KanbanCard.tsx`

- [ ] **Step 1: Replace the entire file**

```typescript
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useAppStore } from '@/store'
import { formatDuration, format, parseISO } from '@/lib/dateUtils'
import type { Card } from '@/types'

interface Props {
  card: Card
  isOverlay?: boolean
}

export function KanbanCard({ card, isOverlay }: Props) {
  const setSelectedCard = useAppStore((s) => s.setSelectedCard)
  const lists = useAppStore((s) => s.lists)
  const people = useAppStore((s) => s.people)
  const list = lists.find((l) => l.id === card.listId)
  const person = card.personId ? people.find((p) => p.id === card.personId) : null

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  const dayAbbrevs = card.allowedDays.length > 0
    ? card.allowedDays.map((d) => d.charAt(0).toUpperCase() + d.slice(1, 3)).join(', ')
    : null

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={() => setSelectedCard(card.id)}
      className={`group relative cursor-pointer transition-all ${
        isOverlay ? 'shadow-2xl ring-2 ring-[var(--color-accent)]/30' : ''
      }`}
      style={{
        ...style,
        backgroundColor: '#272727',
        border: '1px solid #383838',
        borderRadius: 10,
        overflow: 'hidden',
      }}
    >
      {/* Colored top edge — list identity */}
      <div
        style={{
          height: 3,
          backgroundColor: list?.color || '#555',
        }}
      />

      {/* Card body */}
      <div style={{ padding: '10px 12px 10px 12px' }}>
        {/* Title row */}
        <div className="flex items-start justify-between" style={{ gap: 8 }}>
          <div
            className="text-[var(--color-text)] font-medium"
            style={{ fontSize: 13, lineHeight: '18px', flex: 1 }}
          >
            {card.title}
          </div>
          <span
            className="text-[var(--color-text-muted)] opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
            style={{ fontSize: 14, lineHeight: '18px' }}
          >
            ›
          </span>
        </div>

        {/* Primary metadata row */}
        <div className="flex items-center flex-wrap" style={{ gap: 6, marginTop: 8 }}>
          {/* Action type badge — always shown */}
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              padding: '2px 7px',
              borderRadius: 4,
              letterSpacing: 0.2,
              ...(card.actionType === 'Follow up'
                ? {
                    color: 'var(--color-accent)',
                    backgroundColor: 'rgba(99,102,241,0.12)',
                  }
                : {
                    color: 'var(--color-text-muted)',
                    backgroundColor: 'rgba(255,255,255,0.06)',
                  }),
            }}
          >
            {card.actionType}
          </span>

          {/* Duration pill */}
          {card.durationMinutes !== null && (
            <span
              style={{
                fontSize: 11,
                fontWeight: 500,
                color: 'var(--color-text-secondary)',
                backgroundColor: 'rgba(255,255,255,0.06)',
                padding: '2px 8px',
                borderRadius: 4,
              }}
            >
              {formatDuration(card.durationMinutes)}
            </span>
          )}

          {/* Day constraints */}
          {dayAbbrevs && (
            <span
              style={{
                fontSize: 11,
                fontWeight: 500,
                color: 'var(--color-text-secondary)',
                backgroundColor: 'rgba(255,255,255,0.06)',
                padding: '2px 8px',
                borderRadius: 4,
              }}
            >
              {dayAbbrevs}
            </span>
          )}

          {/* Person tag — only for Follow up cards */}
          {card.actionType === 'Follow up' && person && (
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: person.color,
                backgroundColor: person.color + '1f',
                padding: '2px 7px',
                borderRadius: 4,
                letterSpacing: 0.2,
              }}
            >
              {person.name}
            </span>
          )}
        </div>

        {/* Secondary metadata — date */}
        {card.startDate && (
          <div
            style={{
              fontSize: 10,
              color: 'var(--color-text-muted)',
              marginTop: 6,
            }}
          >
            {format(parseISO(card.startDate), 'MMM d, h:mm a')}
          </div>
        )}
      </div>

      {/* Hover border glow */}
      <div
        className="absolute inset-0 pointer-events-none rounded-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ border: '1px solid var(--color-border-hover)' }}
      />
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/renderer/src/components/kanban/KanbanCard.tsx
git commit -m "feat(card): add actionType badge, rename category→person tag"
```

---

## Task 6: Update CardDetailModal

**Files:**
- Modify: `src/renderer/src/components/kanban/CardDetailModal.tsx`

- [ ] **Step 1: Replace the entire file**

```typescript
import { useState, useEffect } from 'react'
import { useAppStore } from '@/store'
import { formatDuration } from '@/lib/dateUtils'
import type { ActionType, DayOfWeek } from '@/types'

const DAYS: { label: string; value: DayOfWeek }[] = [
  { label: 'Mon', value: 'mon' },
  { label: 'Tue', value: 'tue' },
  { label: 'Wed', value: 'wed' },
  { label: 'Thu', value: 'thu' },
  { label: 'Fri', value: 'fri' },
  { label: 'Sat', value: 'sat' },
  { label: 'Sun', value: 'sun' },
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
  const people = useAppStore((s) => s.people)
  const timeBlocks = useAppStore((s) => s.timeBlocks)
  const updateCard = useAppStore((s) => s.updateCard)
  const deleteCard = useAppStore((s) => s.deleteCard)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [startDate, setStartDate] = useState('')
  const [durationMinutes, setDurationMinutes] = useState<number | null>(null)
  const [personId, setPersonId] = useState<string | null>(null)
  const [actionType, setActionType] = useState<ActionType>('Work')
  const [allowedDays, setAllowedDays] = useState<DayOfWeek[]>([])
  const [selectedTimeBlockIds, setSelectedTimeBlockIds] = useState<string[]>([])

  useEffect(() => {
    if (card) {
      setTitle(card.title)
      setDescription(card.description)
      setStartDate(card.startDate ? card.startDate.slice(0, 16) : '')
      setDurationMinutes(card.durationMinutes ?? null)
      setPersonId(card.personId)
      setActionType(card.actionType)
      setAllowedDays([...card.allowedDays])
      setSelectedTimeBlockIds([...card.timeBlockIds])
    }
  }, [card])

  if (!card) return null

  const currentList = lists.find((l) => l.id === card.listId)

  function handleActionTypeChange(type: ActionType) {
    setActionType(type)
    // Work cards cannot have a person
    if (type === 'Work') setPersonId(null)
  }

  function handleSave() {
    updateCard(cardId, {
      title: title.trim() || 'Untitled',
      description,
      startDate: startDate ? new Date(startDate).toISOString() : null,
      durationMinutes: durationMinutes !== null ? Math.max(5, durationMinutes) : null,
      personId: actionType === 'Follow up' ? personId : null,
      actionType,
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

          {/* Description */}
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add a description..."
            rows={2}
            className="w-full bg-[var(--color-bg)] text-[var(--color-text)] rounded-xl border border-[var(--color-border)] outline-none resize-none focus:border-[var(--color-accent)]"
            style={{ fontSize: 13, padding: '10px 14px', marginTop: 8 }}
          />

          {/* ── Action type section ── */}
          <div className="border-t border-[var(--color-border)]" style={{ marginTop: 20 }} />
          <p className="font-semibold text-[var(--color-text-secondary)]" style={{ fontSize: 11, marginTop: 16 }}>
            Action type
          </p>

          <div className="flex" style={{ gap: 6, marginTop: 10 }}>
            {(['Work', 'Follow up'] as ActionType[]).map((type) => (
              <button
                key={type}
                onClick={() => handleActionTypeChange(type)}
                className={`rounded-lg border transition-colors ${
                  actionType === type
                    ? 'bg-[var(--color-accent)] border-[var(--color-accent)] text-white'
                    : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-border-hover)] hover:text-[var(--color-text-secondary)]'
                }`}
                style={{ padding: '6px 16px', fontSize: 12 }}
              >
                {type}
              </button>
            ))}
          </div>

          {/* Person dropdown — only for Follow up */}
          {actionType === 'Follow up' && (
            <div style={{ marginTop: 14 }}>
              <label className="block text-[var(--color-text-muted)]" style={{ fontSize: 11, marginBottom: 6 }}>
                Person
              </label>
              <select
                value={personId ?? ''}
                onChange={(e) => setPersonId(e.target.value || null)}
                className="w-full bg-[var(--color-bg)] text-[var(--color-text)] rounded-xl border border-[var(--color-border)] outline-none focus:border-[var(--color-accent)] [color-scheme:dark]"
                style={{ fontSize: 13, padding: '8px 12px' }}
              >
                <option value="">None</option>
                {people.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              {people.length === 0 && (
                <p className="text-[var(--color-text-muted)] leading-relaxed" style={{ fontSize: 11, marginTop: 4 }}>
                  No people yet. Use <strong className="text-[var(--color-text-secondary)]">People</strong> in the toolbar to add them.
                </p>
              )}
            </div>
          )}

          {/* ── Scheduling section ── */}
          <div className="border-t border-[var(--color-border)]" style={{ marginTop: 20 }} />
          <p className="font-semibold text-[var(--color-text-secondary)]" style={{ fontSize: 11, marginTop: 16 }}>
            Scheduling
          </p>

          {/* Date & Duration */}
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
                Duration {durationMinutes !== null && `(${formatDuration(durationMinutes)})`}
              </label>
              <div className="flex" style={{ gap: 4 }}>
                {DURATION_PRESETS.map((d) => (
                  <button
                    key={d.value}
                    onClick={() => setDurationMinutes(durationMinutes === d.value ? null : d.value)}
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
              <div className="relative" style={{ marginTop: 6 }}>
                <input
                  type="number"
                  min={5}
                  step={5}
                  value={durationMinutes ?? ''}
                  placeholder="Custom (min)"
                  onChange={(e) => {
                    const v = parseInt(e.target.value)
                    setDurationMinutes(isNaN(v) ? null : Math.max(5, v))
                  }}
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
              {durationMinutes === null && (
                <p className="text-[var(--color-text-muted)]" style={{ fontSize: 11, marginTop: 4 }}>
                  No duration — card won't be auto-scheduled
                </p>
              )}
            </div>
          </div>

          {/* ── Constraints section ── */}
          <div className="border-t border-[var(--color-border)]" style={{ marginTop: 20 }} />
          <p className="font-semibold text-[var(--color-text-secondary)]" style={{ fontSize: 11, marginTop: 16 }}>
            Constraints
          </p>

          {/* Allowed Days */}
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

          {/* Time Blocks */}
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
```

- [ ] **Step 2: Commit**

```bash
git add src/renderer/src/components/kanban/CardDetailModal.tsx
git commit -m "feat(modal): add actionType toggle, gate person selector to Follow up cards"
```

---

## Task 7: Update Toolbar

**Files:**
- Modify: `src/renderer/src/components/layout/Toolbar.tsx`

- [ ] **Step 1: Replace the entire file**

```typescript
import { useAppStore } from '@/store'
import type { GridInterval } from '@/types'

export function Toolbar({
  onOpenTimeBlocks,
  onOpenPeople,
}: {
  onOpenTimeBlocks: () => void
  onOpenPeople: () => void
}) {
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
        onClick={onOpenPeople}
        className="px-4 text-xs font-medium text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] bg-[var(--color-accent)]/10 hover:bg-[var(--color-accent)]/20 rounded-lg transition-colors border border-[var(--color-accent)]/25 shrink-0"
        style={{ height: 32 }}
      >
        People
      </button>

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
```

- [ ] **Step 2: Commit**

```bash
git add src/renderer/src/components/layout/Toolbar.tsx
git commit -m "refactor(toolbar): rename Categories→People, onOpenCategories→onOpenPeople"
```

---

## Task 8: Update App.tsx — wire PeopleManager and add version to title

**Files:**
- Modify: `src/renderer/src/App.tsx`

- [ ] **Step 1: Replace the entire file**

```typescript
import { useAppStore } from '@/store'
import { FilterBar } from '@/components/layout/FilterBar'
import { Toolbar } from '@/components/layout/Toolbar'
import { KanbanBoard } from '@/components/kanban/KanbanBoard'
import { CalendarGrid } from '@/components/calendar/CalendarGrid'
import { CardDetailModal } from '@/components/kanban/CardDetailModal'
import { TimeBlockManager } from '@/components/schedule/TimeBlockManager'
import { PeopleManager } from '@/components/schedule/PeopleManager'
import { useState } from 'react'
import pkg from '../../../../package.json'

export default function App() {
  const activeFilter = useAppStore((s) => s.activeFilter)
  const selectedCardId = useAppStore((s) => s.selectedCardId)
  const setSelectedCard = useAppStore((s) => s.setSelectedCard)
  const [showTimeBlocks, setShowTimeBlocks] = useState(false)
  const [showPeople, setShowPeople] = useState(false)

  return (
    <div className="flex flex-col h-screen bg-[var(--color-bg)]">
      {/* Drag region for macOS title bar */}
      <div
        className="drag-region flex items-center shrink-0 border-b border-[var(--color-border)]"
        style={{ height: 52, paddingLeft: 80, paddingRight: 20 }}
      >
        <span className="no-drag text-sm font-semibold text-[var(--color-text)] shrink-0">
          Kanban Calendar <span className="font-normal text-[var(--color-text-muted)]">v{pkg.version}</span>
        </span>
        <div className="flex-1" />
        <Toolbar
          onOpenTimeBlocks={() => setShowTimeBlocks(true)}
          onOpenPeople={() => setShowPeople(true)}
        />
      </div>

      {/* Filter tab bar */}
      <FilterBar />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className={`${activeFilter ? 'h-1/2' : 'flex-1'} min-h-0 overflow-hidden`}>
          <KanbanBoard />
        </div>

        {activeFilter && (
          <div className="h-1/2 border-t border-[var(--color-border)] min-h-0 overflow-hidden">
            <CalendarGrid />
          </div>
        )}
      </div>

      {selectedCardId && (
        <CardDetailModal
          cardId={selectedCardId}
          onClose={() => setSelectedCard(null)}
        />
      )}

      {showTimeBlocks && (
        <TimeBlockManager onClose={() => setShowTimeBlocks(false)} />
      )}

      {showPeople && (
        <PeopleManager onClose={() => setShowPeople(false)} />
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript is clean**

```bash
cd /Users/himan/Documents/projects/kanban-calendar && npx tsc --noEmit 2>&1
```

Expected: No errors. If you get `Cannot find module '../../../../package.json'`, add `"resolveJsonModule": true` to `tsconfig.json` under `compilerOptions`, then re-run.

- [ ] **Step 3: Run the app and verify**

```bash
cd /Users/himan/Documents/projects/kanban-calendar && npm run dev
```

Verify:
- Title shows "Kanban Calendar v1.0.0"
- Toolbar shows "People" button (not "Categories")
- New cards default to "Work" action type badge
- Opening a card shows the Work/Follow up toggle
- Switching to "Follow up" reveals the Person dropdown
- Switching back to "Work" hides the Person dropdown
- People manager opens from toolbar, lets you add/remove people

- [ ] **Step 4: Commit**

```bash
git add src/renderer/src/App.tsx
git commit -m "feat(app): wire PeopleManager, show version in title bar"
```
