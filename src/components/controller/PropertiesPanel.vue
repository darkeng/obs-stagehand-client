<template>
  <aside class="w-80 bg-slate-800 border-l border-slate-700 flex flex-col overflow-y-auto z-20 shadow-xl">
    <template v-if="el">
      <div class="p-6">
        <h2 class="text-lg font-bold mb-4 text-slate-100 flex items-center gap-2 border-b border-slate-700 pb-4">
          <svg class="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path></svg>
          Element Properties
        </h2>

        <div class="mb-4">
          <label class="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-widest">Name</label>
          <input
            v-model="el.name"
            @input="emitUpdate"
            :placeholder="defaultName"
            class="w-full bg-slate-900 border border-slate-600 rounded-md px-3 py-2 text-slate-100 font-bold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <button
          @click="$emit('toggle-active', el)"
          class="w-full mb-6 flex items-center justify-between px-4 py-3 rounded-lg border-2 transition-all"
          :class="el.visible
            ? 'bg-emerald-500/10 border-emerald-500/60 hover:bg-emerald-500/20'
            : 'bg-slate-900/40 border-slate-700 hover:border-slate-500'"
        >
          <span class="text-xs font-black uppercase tracking-widest" :class="el.visible ? 'text-emerald-300' : 'text-slate-400'">
            {{ el.visible ? 'Active in scene' : 'Inactive — preview only' }}
          </span>
          <span
            class="relative w-11 h-6 rounded-full transition-colors"
            :class="el.visible ? 'bg-emerald-500' : 'bg-slate-600'"
          >
            <span
              class="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all"
              :class="el.visible ? 'left-5' : 'left-0.5'"
            ></span>
          </span>
        </button>

        <div class="space-y-6">
          <div>
            <label class="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-widest">Content / Source URL</label>
            <textarea
              v-model="el.content"
              @input="emitUpdate"
              rows="3"
              class="w-full bg-slate-900 border border-slate-600 rounded-md px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition shadow-inner font-mono text-sm leading-relaxed"
              placeholder="Write text or paste URL"
            ></textarea>
            <p
              v-if="el.type === 'video' && embedAspect"
              class="mt-2 text-[11px] text-indigo-300/80 flex items-center justify-between gap-2"
            >
              <span>Detected: <strong class="font-bold uppercase tracking-wider">{{ embedAspect }}</strong></span>
              <button
                @click="$emit('apply-embed-aspect', el)"
                class="px-2 py-0.5 rounded border border-indigo-500/50 hover:bg-indigo-500/10 text-[10px] font-bold uppercase tracking-widest transition"
              >
                Match aspect
              </button>
            </p>
          </div>

          <div v-if="el.type === 'text'" class="grid grid-cols-2 gap-4 border-t border-slate-700 pt-4 pb-4 border-b">
            <div class="col-span-2">
              <label class="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-widest">Font Family</label>
              <select v-model="el.fontFamily" @change="emitUpdate" class="w-full bg-slate-900 border border-slate-600 rounded-md px-3 py-1.5 text-sm text-slate-200">
                <option value="Inter">Inter</option>
                <option value="Roboto">Roboto</option>
                <option value="Impact">Impact</option>
                <option value="'Courier New', Courier, monospace">Courier New</option>
                <option value="'Comic Sans MS', cursive, sans-serif">Comic Sans</option>
              </select>
            </div>
            <div>
              <label class="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-widest">Text Color</label>
              <div class="flex gap-2">
                <input type="color" v-model="el.fontColor" @input="emitUpdate" class="w-8 h-8 rounded shrink-0 bg-transparent border-0 p-0 cursor-pointer" />
                <input type="text" v-model="el.fontColor" @input="emitUpdate" class="w-full bg-slate-900 border border-slate-600 rounded-md px-2 py-1 text-xs" />
              </div>
            </div>
            <div>
              <label class="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-widest">Stroke Color</label>
              <div class="flex gap-2">
                <input type="color" v-model="el.strokeColor" @input="emitUpdate" class="w-8 h-8 rounded shrink-0 bg-transparent border-0 p-0 cursor-pointer" />
                <input type="text" v-model="el.strokeColor" @input="emitUpdate" class="w-full bg-slate-900 border border-slate-600 rounded-md px-2 py-1 text-xs" />
              </div>
            </div>
            <div>
              <label class="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-widest">Stroke Width</label>
              <input type="number" v-model.number="el.strokeWidth" @input="emitUpdate" class="w-full bg-slate-900 border border-slate-600 rounded-md px-3 py-1.5 text-sm" min="0" max="8" />
            </div>
          </div>

          <div v-if="el.type !== 'audio'" class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-widest">Pos X (%)</label>
              <input type="number" v-model.number="el.x_pc" @input="emitUpdate" class="w-full bg-slate-900 border border-slate-600 rounded-md px-3 py-1.5 text-sm" />
            </div>
            <div>
              <label class="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-widest">Pos Y (%)</label>
              <input type="number" v-model.number="el.y_pc" @input="emitUpdate" class="w-full bg-slate-900 border border-slate-600 rounded-md px-3 py-1.5 text-sm" />
            </div>
            <div>
              <label class="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-widest">Width (%)</label>
              <input type="number" v-model.number="el.width_pc" @input="emitUpdate" class="w-full bg-slate-900 border border-slate-600 rounded-md px-3 py-1.5 text-sm" />
            </div>
            <div>
              <label class="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-widest">Height (%)</label>
              <input type="number" v-model.number="el.height_pc" @input="emitUpdate" class="w-full bg-slate-900 border border-slate-600 rounded-md px-3 py-1.5 text-sm" />
            </div>
          </div>

          <MaskControls
            v-if="['video', 'image'].includes(el.type)"
            :el="el"
            @update="emitUpdate"
          />

          <MediaControls
            v-if="['audio', 'video'].includes(el.type)"
            :el="el"
            @update="emitUpdate"
          />
        </div>
      </div>
    </template>
    <div v-else class="grow flex flex-col items-center justify-center p-6 text-slate-500 opacity-50">
      <svg class="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"></path></svg>
      <p class="text-sm font-semibold tracking-wider uppercase text-center">Select an element to edit its properties</p>
    </div>
  </aside>
</template>

<script setup>
import { computed } from 'vue'
import { parseMediaSource } from '../../utils/mediaSource'
import MaskControls from './MaskControls.vue'
import MediaControls from './MediaControls.vue'

const props = defineProps({
  el: { type: Object, default: null },
  defaultName: { type: String, default: '' },
})
const emit = defineEmits(['update', 'toggle-active', 'apply-embed-aspect'])

const emitUpdate = () => emit('update', props.el)

const embedAspect = computed(() => {
  if (!props.el || props.el.type !== 'video') return null
  return parseMediaSource(props.el.content).aspectRatio || null
})
</script>
