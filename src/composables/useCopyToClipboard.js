import { ref, onBeforeUnmount } from 'vue'

// Wraps `navigator.clipboard.writeText` with a feedback flag that auto-resets
// after `feedbackMs`. Falls back to a temp <textarea> + execCommand for
// non-secure contexts (e.g. plain HTTP on the LAN, where the async API throws).
export function useCopyToClipboard({ feedbackMs = 2000 } = {}) {
  const copied = ref(null)
  let resetTimer = null

  const copy = async (text, key = true) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      try { document.execCommand('copy') } catch { /* give up silently */ }
      document.body.removeChild(ta)
    }
    copied.value = key
    clearTimeout(resetTimer)
    resetTimer = setTimeout(() => { copied.value = null }, feedbackMs)
  }

  onBeforeUnmount(() => clearTimeout(resetTimer))

  return { copied, copy }
}
