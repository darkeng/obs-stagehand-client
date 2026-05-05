<template>
  <!-- Muted preview nodes used to detect end-of-playback; user hears audio in
       the OBS view, so these are only useful for the `ended` event firing on
       non-looping clips. -->
  <div class="sr-only" aria-hidden="true">
    <audio
      v-for="el in audioElements"
      :key="el.id"
      :ref="(node) => setRef(el.id, node)"
      :src="el.content"
      :loop="el.loop"
      muted
      preload="metadata"
      @ended="$emit('audio-ended', el.id)"
    ></audio>
  </div>
</template>

<script setup>
import { watch, nextTick } from 'vue'

const props = defineProps({
  audioElements: { type: Array, required: true },
})
defineEmits(['audio-ended'])

const refs = new Map()
const setRef = (id, node) => {
  if (node) refs.set(id, node)
  else refs.delete(id)
}

// Mirror each audio element's playing state into its hidden preview node. Mute
// when the scene is also playing it (visible+playing) to avoid double audio
// for the operator; unmute for solo preview (playing without active in scene).
watch(
  () => props.audioElements.map(e => ({
    id: e.id, content: e.content, playing: e.playing,
    loop: e.loop, visible: e.visible, volume: e.volume,
  })),
  async (snapshots) => {
    await nextTick()
    snapshots.forEach(s => {
      const node = refs.get(s.id)
      if (!node) return
      node.muted = s.visible
      node.volume = s.volume ?? 1
      if (s.playing && node.paused) {
        node.play().catch(() => {})
      } else if (!s.playing && !node.paused) {
        node.pause()
      }
    })
  },
  { deep: true }
)
</script>
