<template>
  <div
    class="absolute box-border group"
    :class="{
      'ring-2 ring-indigo-500 shadow-xl cursor-move bg-white/5': selected,
      'hover:ring-1 hover:ring-slate-500/50 cursor-pointer': !selected,
      'opacity-30 grayscale': isOutOfBounds,
      'z-10': !isOutOfBounds
    }"
    :style="{
      left: `${el.x_pc}%`,
      top: `${el.y_pc}%`,
      width: `${el.width_pc}%`,
      height: `${el.height_pc}%`,
      zIndex: el.zIndex
    }"
    @mousedown.stop="startDrag"
  >
    <div
      class="w-full h-full pointer-events-none relative flex items-center justify-center overflow-hidden"
      :style="{ clipPath }"
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
          v-if="parsedSrc.kind === 'iframe'"
          :key="`iframe-${el.id}-${el.playing}-${el.loop}`"
          :src="parseMediaSource(el.content, { autoplay: el.playing, loop: el.loop, mute: true }).src"
          :allow="parsedSrc.allow"
          class="w-full h-full border-0"
        ></iframe>
        <video
          v-else
          :id="`preview-${el.id}`"
          :src="el.content"
          :loop="el.loop"
          muted
          playsinline
          class="w-full h-full object-cover rounded-xl shadow-2xl"
          @ended="handleVideoEnded"
        ></video>
      </template>

      <div
        v-else-if="el.type === 'audio'"
        class="w-full h-full flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-500 rounded-xl bg-slate-800/80"
      >
        <svg class="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
        </svg>
        <p class="font-mono text-xs">Audio Clip</p>
      </div>
    </div>

    <div
      v-if="!el.visible"
      class="absolute top-1 left-1 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest rounded bg-slate-900/80 text-amber-400 border border-amber-500/40 pointer-events-none"
    >
      Inactive
    </div>

    <div v-if="selected">
      <div class="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border border-indigo-500 rounded-full cursor-nwse-resize" @mousedown.stop="startResize('nw')"></div>
      <div class="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border border-indigo-500 rounded-full cursor-nesw-resize" @mousedown.stop="startResize('ne')"></div>
      <div class="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border border-indigo-500 rounded-full cursor-nesw-resize" @mousedown.stop="startResize('sw')"></div>
      <div class="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border border-indigo-500 rounded-full cursor-nwse-resize" @mousedown.stop="startResize('se')"></div>
      <div class="absolute top-0 bottom-0 -right-1 w-2 cursor-ew-resize" @mousedown.stop="startResize('e')"></div>
      <div class="absolute top-0 bottom-0 -left-1 w-2 cursor-ew-resize" @mousedown.stop="startResize('w')"></div>
      <div class="absolute left-0 right-0 -bottom-1 h-2 cursor-ns-resize" @mousedown.stop="startResize('s')"></div>
      <div class="absolute left-0 right-0 -top-1 h-2 cursor-ns-resize" @mousedown.stop="startResize('n')"></div>
    </div>
  </div>
</template>

<script setup>
import { computed, watch, nextTick } from 'vue'
import { parseMediaSource } from '../utils/mediaSource'
import { textOutline } from '../utils/textOutline'
import { buildClipPath } from '../utils/clipPath'

const props = defineProps({
  el: { type: Object, required: true },
  selected: { type: Boolean, default: false }
})

const emit = defineEmits(['update', 'select'])

const parsedSrc = computed(() => parseMediaSource(props.el.content, { loop: props.el.loop }))
const clipPath = computed(() => buildClipPath(props.el))

const isOutOfBounds = computed(() => {
  const right = props.el.x_pc + props.el.width_pc
  const bottom = props.el.y_pc + props.el.height_pc
  return props.el.x_pc >= 100 || props.el.y_pc >= 100 || right <= 0 || bottom <= 0
})

// Mirror playing state into the native <video> preview node so the operator
// sees the video play locally when they hit play in the sidebar.
watch(
  () => ({ playing: props.el.playing, content: props.el.content, type: props.el.type }),
  async (s) => {
    await nextTick()
    if (s.type !== 'video') return
    if (parsedSrc.value.kind === 'iframe') return
    const node = document.getElementById(`preview-${props.el.id}`)
    if (!node) return
    if (s.playing && node.paused) {
      node.play().catch(() => {})
    } else if (!s.playing && !node.paused) {
      node.pause()
      // Match iframe behaviour: next play starts from the beginning.
      node.currentTime = 0
    }
  },
  { immediate: true, deep: true }
)

let isDragging = false
let isResizing = false
let resizeDir = ''
let startX = 0, startY = 0
let initialX = 0, initialY = 0, initialW = 0, initialH = 0
let containerW = 0, containerH = 0

const getContainerDimensions = (elNode) => {
  const container = elNode.parentElement
  return { w: container.clientWidth, h: container.clientHeight }
}

const startDrag = (e) => {
  emit('select')
  isDragging = true
  startX = e.clientX
  startY = e.clientY
  initialX = props.el.x_pc
  initialY = props.el.y_pc

  const dim = getContainerDimensions(e.target)
  containerW = dim.w
  containerH = dim.h

  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', stopAll)
}

const startResize = (dir) => {
  isResizing = true
  resizeDir = dir
  initialX = props.el.x_pc
  initialY = props.el.y_pc
  initialW = props.el.width_pc
  initialH = props.el.height_pc

  const evt = window.event
  startX = evt.clientX
  startY = evt.clientY

  const container = document.querySelector('.aspect-video')
  containerW = container.clientWidth
  containerH = container.clientHeight

  document.addEventListener('mousemove', onResize)
  document.addEventListener('mouseup', stopAll)
}

const onDrag = (e) => {
  if (!isDragging) return
  const dxPc = ((e.clientX - startX) / containerW) * 100
  const dyPc = ((e.clientY - startY) / containerH) * 100

  emit('update', {
    ...props.el,
    x_pc: initialX + dxPc,
    y_pc: initialY + dyPc
  })
}

const onResize = (e) => {
  if (!isResizing) return
  const dxPc = ((e.clientX - startX) / containerW) * 100
  const dyPc = ((e.clientY - startY) / containerH) * 100

  let newX = initialX
  let newY = initialY
  let newW = initialW
  let newH = initialH

  if (resizeDir.includes('e')) newW = Math.max(1, initialW + dxPc)
  if (resizeDir.includes('s')) newH = Math.max(1, initialH + dyPc)
  if (resizeDir.includes('w')) {
    const change = Math.min(initialW - 1, dxPc)
    newX = initialX + change
    newW = initialW - change
  }
  if (resizeDir.includes('n')) {
    const change = Math.min(initialH - 1, dyPc)
    newY = initialY + change
    newH = initialH - change
  }

  emit('update', {
    ...props.el,
    x_pc: newX,
    y_pc: newY,
    width_pc: newW,
    height_pc: newH
  })
}

// Native videos don't carry their state back to the store on their own; if we
// don't clear `playing` when the clip ends naturally, the deep watch on the
// elements array (in Scene.vue) will replay them on any unrelated update.
const handleVideoEnded = () => {
  if (props.el.loop) return
  emit('update', { ...props.el, playing: false })
}

const stopAll = () => {
  isDragging = false
  isResizing = false
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mousemove', onResize)
  document.removeEventListener('mouseup', stopAll)
}
</script>
