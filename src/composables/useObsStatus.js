import { onMounted, onUnmounted } from 'vue'

// OBS Browser Source events we listen to. We re-query getStatus on any of
// these rather than flipping flags from the event names, because:
//   1. Events can be missed (page loads after stream start, or OBS doesn't
//      fire them on some versions / with limited permissions).
//   2. getStatus returns the absolute truth of the moment.
const OBS_EVENTS = [
  'obsStreamingStarted', 'obsStreamingStopped',
  'obsStreamingStarting', 'obsStreamingStopping',
  'obsRecordingStarted', 'obsRecordingStopped',
  'obsRecordingStarting', 'obsRecordingStopping',
]

const POLL_MS = 5000

// Polls window.obsstudio.getStatus() and invokes `onChange({ live, recording })`
// on every result. We deliberately do NOT dedupe identical statuses: the
// server caches the last value and the controller relies on periodic refreshes
// to keep the cache alive (otherwise a stable LIVE state for >TTL would let
// the cache expire and a late-joining controller would see OFFLINE).
//
// Returns { refresh } — call this after the underlying socket is connected
// and joined; the on-mount auto-fire is best-effort and may be dropped because
// the consumer's socket isn't ready yet.
export function useObsStatus(onChange) {
  let pollInterval = null

  const apply = (status) => {
    onChange({
      live: !!status?.streaming,
      recording: !!status?.recording,
    })
  }

  const queryStatus = () => {
    if (typeof window === 'undefined') return
    const obs = window.obsstudio
    if (!obs?.getStatus) return
    try {
      obs.getStatus(apply)
    } catch (err) {
      console.warn('[obs] getStatus failed', err)
    }
  }

  onMounted(() => {
    queryStatus()
    OBS_EVENTS.forEach(evt => window.addEventListener(evt, queryStatus))
    pollInterval = setInterval(queryStatus, POLL_MS)
  })

  onUnmounted(() => {
    OBS_EVENTS.forEach(evt => window.removeEventListener(evt, queryStatus))
    if (pollInterval) clearInterval(pollInterval)
    pollInterval = null
  })

  return { refresh: queryStatus }
}
