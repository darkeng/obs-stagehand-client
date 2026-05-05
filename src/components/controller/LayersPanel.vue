<template>
  <aside class="w-72 bg-slate-800 border-r border-slate-700 p-4 flex flex-col gap-4 overflow-y-auto z-20 shadow-xl">
    <div class="grid grid-cols-2 gap-2">
      <button
        v-for="type in ELEMENT_TYPES"
        :key="type"
        @click="$emit('add', type)"
        class="py-2 rounded-lg transition border font-semibold shadow-sm"
        :class="addButtonClass(type)"
      >+ {{ TYPE_LABELS[type] }}</button>
    </div>

    <div class="space-y-2">
      <h3 class="text-xs uppercase tracking-wider text-slate-500 font-bold mb-2">
        Layers ({{ layers.length }})
        <span class="text-slate-600 font-normal normal-case tracking-normal">— drag to reorder</span>
      </h3>
      <div
        v-for="el in layers"
        :key="el.id"
        draggable="true"
        @dragstart="onDragStart($event, el.id)"
        @dragover.prevent="onDragOver(el.id)"
        @dragleave="onDragLeave(el.id)"
        @dragend="onDragEnd"
        @drop.prevent="onDrop(el.id)"
        class="rounded-xl border transition-all duration-150 shadow-sm group select-none flex overflow-hidden"
        :class="[
          selectedId === el.id ? 'bg-slate-700 border-indigo-500 shadow-indigo-500/20' : 'bg-slate-800/50 border-slate-700 hover:border-slate-500',
          dragSourceId === el.id ? 'opacity-40' : '',
          dragOverId === el.id && dragSourceId !== el.id ? 'ring-2 ring-indigo-400 ring-offset-2 ring-offset-slate-800' : ''
        ]"
      >
        <div
          @click="$emit('select', el.id)"
          class="flex-1 min-w-0 p-3 cursor-pointer flex items-start gap-3"
        >
          <div
            class="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center border relative"
            :class="TYPE_ICON_BG[el.type] || 'bg-slate-700 border-slate-600'"
          >
            <TypeIcon :type="el.type" class="w-5 h-5" :class="TYPE_ICON_FG[el.type] || 'text-slate-300'" />
            <span
              v-if="el.visible"
              class="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-slate-800 animate-pulse"
              title="Active in scene"
            ></span>
          </div>

          <div class="flex-1 min-w-0">
            <div class="font-bold text-sm text-slate-100 truncate">{{ el.name || displayName(el) }}</div>
            <div class="flex items-center gap-1.5 mt-1">
              <span class="text-[10px] text-slate-500 truncate flex-1 min-w-0">{{ el.content || 'Empty' }}</span>
              <button
                @click.stop="$emit('toggle-active', el)"
                class="shrink-0 p-1 transition rounded hover:bg-slate-700/60"
                :class="el.visible ? 'text-emerald-400 hover:text-emerald-300' : 'text-slate-500 hover:text-slate-300'"
                :title="el.visible ? 'Deactivate' : 'Activate in scene'"
              >
                <svg v-if="el.visible" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"></path></svg>
              </button>
              <button
                @click.stop="$emit('remove', el)"
                class="shrink-0 p-1 text-slate-500 hover:text-red-400 transition rounded hover:bg-slate-700/60"
                title="Delete Layer"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
              </button>
            </div>
          </div>
        </div>
        <div
          @mousedown="armDrag"
          class="w-6 shrink-0 self-stretch flex flex-col items-center justify-center gap-1 cursor-grab active:cursor-grabbing bg-slate-900/40 hover:bg-indigo-500/40 transition border-l border-slate-700"
          title="Drag to reorder"
        >
          <span class="w-1 h-1 rounded-full bg-slate-400"></span>
          <span class="w-1 h-1 rounded-full bg-slate-400"></span>
          <span class="w-1 h-1 rounded-full bg-slate-400"></span>
          <span class="w-1 h-1 rounded-full bg-slate-400"></span>
          <span class="w-1 h-1 rounded-full bg-slate-400"></span>
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup>
import { ref } from 'vue'
import {
  ELEMENT_TYPES,
  TYPE_LABELS,
  TYPE_ICON_BG,
  TYPE_ICON_FG,
} from '../../constants/elements'
import TypeIcon from './TypeIcon.vue'

const props = defineProps({
  layers: { type: Array, required: true },
  selectedId: { type: String, default: null },
  displayName: { type: Function, required: true },
})
const emit = defineEmits(['add', 'select', 'toggle-active', 'remove', 'reorder'])

const ADD_BUTTON_CLASSES = {
  text: 'bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30 border-indigo-500/30',
  image: 'bg-purple-600/20 text-purple-400 hover:bg-purple-600/30 border-purple-500/30',
  video: 'bg-pink-600/20 text-pink-400 hover:bg-pink-600/30 border-pink-500/30',
  audio: 'bg-amber-600/20 text-amber-400 hover:bg-amber-600/30 border-amber-500/30',
}
const addButtonClass = (type) => ADD_BUTTON_CLASSES[type] || ''

// Drag state. `dragArmed` is true only while the user is mousing-down on the
// grip column — without it, browsers also start a native drag from the row body
// (image previews, text selection), which is annoying. Cleared on mouseup so a
// click without movement (or release outside the grip) doesn't leave it stuck.
const dragSourceId = ref(null)
const dragOverId = ref(null)
let dragArmed = false

const armDrag = () => {
  dragArmed = true
  const release = () => {
    dragArmed = false
    window.removeEventListener('mouseup', release)
  }
  window.addEventListener('mouseup', release)
}

const onDragStart = (e, id) => {
  if (!dragArmed) {
    e.preventDefault()
    return
  }
  dragArmed = false
  dragSourceId.value = id
  e.dataTransfer.effectAllowed = 'move'
  e.dataTransfer.setData('text/plain', id)
}

const onDragOver = (id) => {
  if (dragSourceId.value && dragSourceId.value !== id) dragOverId.value = id
}

const onDragLeave = (id) => {
  if (dragOverId.value === id) dragOverId.value = null
}

const onDragEnd = () => {
  dragSourceId.value = null
  dragOverId.value = null
}

const onDrop = (targetId) => {
  const sourceId = dragSourceId.value
  dragSourceId.value = null
  dragOverId.value = null
  if (!sourceId || sourceId === targetId) return
  emit('reorder', { sourceId, targetId })
}
</script>
