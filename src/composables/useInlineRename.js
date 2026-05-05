import { reactive } from 'vue'

// Inline-rename pattern shared by the dashboard scene cards (one input per row)
// and any other multi-row rename use case: click a label, type, Enter/blur to
// confirm, Esc to cancel.
//   - keyOf(item)   → unique key (used to identify which row is being renamed
//                     when multiple inputs are rendered)
//   - getName(item) → current name to seed the draft and short-circuit no-ops
//   - onSubmit(item, newName) → async callback that persists the change
//
// Returns a reactive object so consumers can use `.draft` and `.renamingKey`
// directly in templates without `.value`.
export function useInlineRename({ keyOf, getName, onSubmit } = {}) {
  const state = reactive({
    renamingKey: null,
    draft: '',
  })
  let inFlight = false

  const isRenaming = (item) => state.renamingKey === keyOf(item)

  const start = (item) => {
    if (!item) return
    state.renamingKey = keyOf(item)
    state.draft = getName(item) ?? ''
  }

  const cancel = () => {
    state.renamingKey = null
    state.draft = ''
  }

  const confirm = async (item) => {
    if (inFlight) return
    if (!item) return cancel()
    if (state.renamingKey !== keyOf(item)) return
    const proposed = (state.draft ?? '').trim()
    const current = getName(item)
    if (!proposed || proposed === current) {
      cancel()
      return
    }
    inFlight = true
    try {
      await onSubmit(item, proposed)
    } catch {
      // caller is expected to surface errors via its own store/state
    } finally {
      inFlight = false
      cancel()
    }
  }

  return { state, isRenaming, start, cancel, confirm }
}
