# Design: Subtle Action Type Indicator (Corner Dot)

**Date:** 2026-04-06
**Status:** Approved

---

## Summary

Replace the action type text badge on KanbanCard with a subtle corner dot. Work cards show no indicator. Follow up cards show a small filled circle in the top-right corner of the card body.

---

## Change

**File:** `src/renderer/src/components/kanban/KanbanCard.tsx`

**Remove:** The `<span>` element that renders the action type badge (`Work` / `Follow up` text pill) in the primary metadata row.

**Add:** For Follow up cards only, a small absolutely-positioned dot in the top-right corner of the card body:

```
position: absolute
top: 10px
right: 10px
width: 7px
height: 7px
border-radius: 50%
background: #6366f1   (accent color)
opacity: 0.85
pointer-events: none
```

The card's outer `<div>` already has `position: relative` via the hover border glow — no structural change needed.

**Unchanged:** Person tag (still only shown on Follow up cards when a person is assigned).

---

## Result

- Work card: no indicator, identical to before
- Follow up card: small accent dot in top-right corner, person tag in metadata row if a person is assigned
- No text badge anywhere
