# Kanban Calendar

A personal planning desktop app that combines a kanban board with a time-block calendar grid. Built with Electron + React + TypeScript.

## Features

- **Kanban board** with draggable cards across customizable lists
- **Time range filters** (Today, This Week, Next Week) that show a calendar grid below the board
- **Calendar grid** with 15/30-minute blocks, color-coded by list
- **Schedule blocks** — named time blocks (e.g. "Creative Time" = 9am–12pm on Thu) that cards can reference as constraints
- **Card fields**: title, description, start date + duration, priority, allowed days, time block assignments
- **localStorage persistence** — all data stays on your machine

## Prerequisites

- Node.js 18+
- npm

## Setup

```bash
npm install
```

## Dev loop

| Goal | Command | Speed |
|---|---|---|
| Live dev with hot-reload | `npm run dev` | ~1s reload on save |
| Test as packaged .app | `npm run pack` | ~15–30s |
| Build .dmg installer | `npm run dist` | ~30–60s |

For day-to-day work, just run `npm run dev` — edit any file, save, and the app window updates instantly.

```bash
# Start dev mode
npm run dev

# Build standalone app (unpacked, in dist/mac-arm64/)
npm run pack

# Build distributable .dmg (in dist/)
npm run dist
```

## Tech stack

- **Electron** — desktop shell
- **React 19** — UI
- **TypeScript** — type safety
- **Zustand** — state management with localStorage persistence
- **@dnd-kit** — drag-and-drop
- **Tailwind CSS v4** — styling
- **date-fns** — date utilities
- **electron-vite** — build tooling
- **electron-builder** — packaging

## Project structure

```
src/
  main/           # Electron main process
  preload/        # Context bridge
  renderer/src/
    components/
      kanban/     # KanbanBoard, KanbanLane, KanbanCard, CardDetailModal
      calendar/   # CalendarGrid
      layout/     # Toolbar, FilterBar
      schedule/   # TimeBlockManager
    store/        # Zustand store
    lib/          # Utilities, constants
    types/        # TypeScript types
    styles/       # Global CSS
```
