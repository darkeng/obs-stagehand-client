<template>
  <div class="col-span-2 border-t border-slate-700 pt-4 mt-2">
    <h3 class="text-xs uppercase tracking-wider text-slate-500 font-bold mb-4">Media Controls</h3>

    <div class="flex items-center gap-5 mb-5">
      <button
        @click="togglePlay"
        :title="el.playing ? 'Pause' : 'Play'"
        :aria-label="el.playing ? 'Pause' : 'Play'"
        class="relative shrink-0 w-16 h-16 rounded-full flex items-center justify-center transition-all duration-150 shadow-lg hover:shadow-indigo-500/40 hover:scale-105 active:scale-95 focus:outline-none focus:ring-4 focus:ring-indigo-500/30 bg-linear-to-br"
        :class="el.playing
          ? 'from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500'
          : 'from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600'"
      >
        <span
          v-if="el.playing"
          class="absolute inset-0 rounded-full bg-indigo-400/40 animate-ping"
          aria-hidden="true"
        ></span>
        <svg v-if="!el.playing" class="relative w-7 h-7 ml-1 text-white drop-shadow" fill="currentColor" viewBox="0 0 24 24">
          <path d="M8 5v14l11-7L8 5z" />
        </svg>
        <svg v-else class="relative w-7 h-7 text-white drop-shadow" fill="currentColor" viewBox="0 0 24 24">
          <path d="M6 5h4v14H6V5zm8 0h4v14h-4V5z" />
        </svg>
      </button>

      <label class="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          v-model="el.loop"
          @change="$emit('update', el)"
          class="w-4 h-4 bg-slate-900 border-slate-600 rounded text-indigo-600 focus:ring-indigo-500"
        />
        <span class="text-xs font-bold text-slate-300 uppercase tracking-widest">Loop</span>
      </label>
    </div>

    <div v-if="!isVideoEmbed">
      <label class="flex justify-between text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-widest">
        Volume ({{ Math.round(el.volume * 100) }}%)
      </label>
      <input
        type="range" min="0" max="1" step="0.05"
        v-model.number="el.volume"
        @input="$emit('update', el)"
        class="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
      />
    </div>
    <p
      v-else
      class="text-[10px] text-slate-500 italic"
    >
      Volume is controlled by the {{ embedProvider }} player.
    </p>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { parseMediaSource } from '../../utils/mediaSource'

const props = defineProps({
  el: { type: Object, required: true },
})
const emit = defineEmits(['update'])

const parsed = computed(() => parseMediaSource(props.el.content))
const isVideoEmbed = computed(() =>
  props.el.type === 'video' && parsed.value.kind === 'iframe'
)
const embedProvider = computed(() => parsed.value.provider)

const togglePlay = () => {
  props.el.playing = !props.el.playing
  emit('update', props.el)
}
</script>
