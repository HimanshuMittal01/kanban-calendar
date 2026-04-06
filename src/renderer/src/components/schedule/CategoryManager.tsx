import { useState } from 'react'
import { useAppStore } from '@/store'
import { CATEGORY_COLORS } from '@/lib/constants'

export function CategoryManager({ onClose }: { onClose: () => void }) {
  const categories = useAppStore((s) => s.categories)
  const addCategory = useAppStore((s) => s.addCategory)
  const deleteCategory = useAppStore((s) => s.deleteCategory)

  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [color, setColor] = useState(CATEGORY_COLORS[0])

  function handleAdd() {
    if (name.trim()) {
      addCategory(name.trim(), color)
      setName('')
      setColor(CATEGORY_COLORS[(categories.length + 1) % CATEGORY_COLORS.length])
      setAdding(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      <div className="relative bg-[var(--color-surface-elevated)] rounded-2xl shadow-2xl w-[400px] max-h-[80vh] overflow-y-auto border border-[var(--color-border)]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)]">
          <h2 className="text-sm font-semibold text-[var(--color-text)]">Categories</h2>
          <button
            onClick={onClose}
            className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] text-lg"
          >
            &times;
          </button>
        </div>

        <div className="px-6 py-4 space-y-3">
          {categories.length === 0 && !adding && (
            <p className="text-sm text-[var(--color-text-muted)] text-center py-6">
              No categories yet.
              <br />
              Create categories like "Design" or "Backend" to tag cards.
            </p>
          )}

          {/* Existing categories */}
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="bg-[var(--color-bg)] rounded-lg px-3 py-2.5 border border-[var(--color-border)] flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: cat.color }}
                />
                <span className="text-sm font-medium text-[var(--color-text)]">{cat.name}</span>
              </div>
              <button
                onClick={() => deleteCategory(cat.id)}
                className="text-xs text-red-400 hover:text-red-300"
              >
                Remove
              </button>
            </div>
          ))}

          {/* Add form */}
          {adding ? (
            <div className="bg-[var(--color-bg)] rounded-lg p-4 border border-[var(--color-accent)]/30 space-y-3">
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                placeholder="Category name (e.g., Design)"
                className="w-full bg-[var(--color-surface)] text-sm text-[var(--color-text)] px-3 py-2 rounded-lg border border-[var(--color-border)] outline-none focus:border-[var(--color-accent)]"
              />
              <div>
                <label className="text-[10px] text-[var(--color-text-muted)] mb-1 block">
                  Color
                </label>
                <div className="flex gap-2 flex-wrap">
                  {CATEGORY_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setColor(c)}
                      className={`w-6 h-6 rounded-full border-2 transition-transform ${
                        color === c
                          ? 'border-white scale-110'
                          : 'border-transparent hover:scale-105'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleAdd}
                  className="px-4 py-1.5 text-xs bg-[var(--color-accent)] text-white rounded-lg hover:bg-[var(--color-accent-hover)]"
                >
                  Add Category
                </button>
                <button
                  onClick={() => setAdding(false)}
                  className="px-4 py-1.5 text-xs text-[var(--color-text-secondary)]"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setAdding(true)}
              className="w-full py-2.5 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] bg-[var(--color-bg)] hover:bg-[var(--color-surface)] rounded-lg border border-dashed border-[var(--color-border)] hover:border-[var(--color-border-hover)] transition-colors"
            >
              + Add Category
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
