# Design: People Rename, Action Type, Version in Title

**Date:** 2026-04-06
**Status:** Approved

---

## Summary

Three changes:
1. Full technical rename of "categories" → "people" (semantic shift: cards track who you need to talk to, not abstract categories)
2. Add `actionType: 'Work' | 'Follow up'` to cards — required, default `'Work'`; only Follow up cards can have a person assigned
3. Show app version in the window title

---

## 1. Data Model Changes

### Card interface

```typescript
interface Card {
  // ...existing fields...
  personId: string | null        // renamed from categoryId
  actionType: 'Work' | 'Follow up'  // new, required, default 'Work'
}
```

**Constraint:** `personId` must be `null` when `actionType === 'Work'`. This is enforced in the UI (person selector hidden for Work cards) and in CardDetailModal logic (switching to Work clears personId).

### Person interface (renamed from Category)

```typescript
interface Person {
  id: string
  name: string
  color: string
}
```

### Store state

```typescript
people: Person[]   // renamed from categories: Category[]
```

### Store actions

| Old | New |
|-----|-----|
| `addCategory(name, color)` | `addPerson(name, color)` |
| `updateCategory(id, updates)` | `updatePerson(id, updates)` |
| `deleteCategory(id)` | `deletePerson(id)` |

**deletePerson cascade:** When a person is deleted, all cards with that `personId` get `personId: null` and `actionType: 'Work'` (since a Follow up without a person is semantically incomplete).

---

## 2. Store Migration (v2 → v3)

Migration logic per card:
- If card had `categoryId` (non-null) → `personId = categoryId`, `actionType = 'Follow up'`
- If card had no `categoryId` (null) → `personId = null`, `actionType = 'Work'`

State key `categories` renamed to `people`.

---

## 3. Technical Rename Scope

| Old | New |
|-----|-----|
| `Category` type | `Person` |
| `categoryId` on Card | `personId` |
| `categories` in store | `people` |
| `addCategory` / `updateCategory` / `deleteCategory` | `addPerson` / `updatePerson` / `deletePerson` |
| `CategoryManager.tsx` | `PeopleManager.tsx` |
| `CATEGORY_COLORS` constant | `PERSON_COLORS` |
| "Categories" toolbar label | "People" |

---

## 4. UI Changes

### KanbanCard

- Person tag: only shown when `actionType === 'Follow up'` and `personId` is set (same colored tag as before)
- Action type badge: always shown — `Work` (neutral gray pill) or `Follow up` (accent-colored pill)

### CardDetailModal

- Action type selector at the top of the form — two-button toggle: `Work` | `Follow up`
- Person dropdown only rendered when `actionType === 'Follow up'`
- Switching from `Follow up` → `Work` automatically clears `personId` in local state

### PeopleManager (renamed from CategoryManager)

- All internal labels updated to "Person" / "People"
- No behavioral changes

### Toolbar

- Button label: "People" (was "Categories")

---

## 5. Version in Title

The window title changes from `"Kanban Calendar"` to `"Kanban Calendar v{version}"`.

- Source: `version` field from `package.json`, imported directly in the renderer (no IPC needed)
- Location: wherever the app title is set — likely `App.tsx` or `index.html`
- Format: `v1.0.0` (semver, as defined in package.json)
