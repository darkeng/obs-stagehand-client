<template>
  <div class="scene-renderer w-full h-screen overflow-hidden flex items-center justify-center bg-transparent">
    <div
      v-if="sceneStore.error"
      class="text-red-300 bg-red-500/10 border border-red-500/40 rounded-md px-4 py-2 font-mono text-sm"
    >
      {{ sceneStore.error }}
    </div>

    <div
      v-else
      class="relative bg-transparent shadow-2xl overflow-hidden aspect-video w-full max-w-480 max-h-270"
      style="container-type: size;"
    >
      <template v-for="el in sceneStore.elements">
        <div
          v-if="el.visible"
          :key="el.id"
          class="absolute box-border"
          :style="{
            left: `${el.x_pc}%`,
            top: `${el.y_pc}%`,
            width: `${el.width_pc}%`,
            height: `${el.height_pc}%`,
            zIndex: el.zIndex,
            clipPath: buildClipPath(el)
          }"
        >
          <div
            v-if="el.type === 'text'"
            class="w-full h-full flex items-center justify-center font-extrabold"
            :style="{
              fontSize: `${el.height_pc}cqh`,
              color: el.fontColor || '#ffffff',
              fontFamily: el.fontFamily || 'Inter',
              textShadow: textOutline(el.strokeWidth, el.strokeColor),
              filter: 'drop-shadow(0 6px 10px rgba(0,0,0,0.5))',
              lineHeight: 1,
              overflow: 'hidden',
              textAlign: 'center'
            }"
          >
            {{ el.content }}
          </div>

          <img
            v-else-if="el.type === 'image'"
            :src="el.content"
            class="w-full h-full object-contain drop-shadow-2xl"
          />

          <template v-else-if="el.type === 'video'">
            <iframe
              v-if="parseMediaSource(el.content).kind === 'iframe'"
              :key="`iframe-${el.id}-${el.playing}-${el.loop}`"
              :src="parseMediaSource(el.content, { autoplay: el.playing, loop: el.loop }).src"
              :allow="parseMediaSource(el.content).allow"
              class="w-full h-full border-0"
              allowfullscreen
            ></iframe>
            <video
              v-else
              :id="`media-${el.id}`"
              :src="el.content"
              :loop="el.loop"
              playsinline
              class="w-full h-full object-cover rounded-xl shadow-2xl"
            ></video>
          </template>

          <audio
            v-else-if="el.type === 'audio'"
            :id="`media-${el.id}`"
            :src="el.content"
            :loop="el.loop"
            class="hidden"
          ></audio>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { useSceneStore } from '../stores/sceneStore'
import { parseMediaSource } from '../utils/mediaSource'
import { textOutline } from '../utils/textOutline'
import { buildClipPath } from '../utils/clipPath'
import { useObsStatus } from '../composables/useObsStatus'

const route = useRoute()
const sceneStore = useSceneStore()
const shareToken = route.params.id

// Drive native <audio>/<video> playback from `playing`. Iframes are remounted
// via :key when playing flips, so they're handled implicitly.
watch(() => sceneStore.elements, async (elements) => {
  await nextTick()
  elements.forEach(el => {
    if (!el.visible) return
    if (!['audio', 'video'].includes(el.type)) return
    if (el.type === 'video' && parseMediaSource(el.content).kind === 'iframe') return
    const node = document.getElementById(`media-${el.id}`)
    if (!node) return
    node.volume = el.volume ?? 1
    if (el.playing) {
      // The deep watch fires for every element on any change to any element.
      // If a video ended naturally without loop, its `playing` flag may still
      // be true until the controller catches up; replaying it here causes
      // double audio when an unrelated element gets toggled.
      if (node.ended && !el.loop) return
      node.play().catch(e => console.warn('OBS Autoplay restricted:', e))
    } else {
      node.pause()
      // Match iframe behaviour: pausing resets to the start so the next play
      // begins from frame 0 instead of resuming where the user stopped.
      if (el.type === 'video') node.currentTime = 0
    }
  })
}, { deep: true })

// Forward OBS streaming/recording state to the editor via socket. The
// composable handles event listening and 5s polling fallback for missed events.
const { refresh: refreshObsStatus } = useObsStatus(
  (status) => sceneStore.emitObsStatus(status)
)

onMounted(async () => {
  document.documentElement.style.backgroundColor = 'transparent'
  document.body.style.backgroundColor = 'transparent'

  try {
    const scene = await sceneStore.loadSceneByToken(shareToken)
    sceneStore.initSocketAsViewer(scene._id, shareToken)
    // The composable auto-fires on mount, but at that point the socket isn't
    // connected yet so the emit is dropped. Re-query now that we've joined
    // the room, otherwise a controller opened against an already-streaming
    // OBS would stay on OFFLINE until the next 5s poll.
    refreshObsStatus()
  } catch {
    // sceneStore.error is set; template renders the error block
  }
})

onUnmounted(() => {
  sceneStore.disconnectSocket()
})
</script>
