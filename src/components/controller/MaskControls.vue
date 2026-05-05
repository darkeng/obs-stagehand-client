<template>
  <div class="border-t border-slate-700 pt-4 mt-2">
    <div class="flex justify-between items-center mb-3">
      <h3 class="text-xs uppercase tracking-wider text-slate-500 font-bold">Mask</h3>
      <label class="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          v-model="el.mask_enabled"
          @change="$emit('update', el)"
          class="w-4 h-4 bg-slate-900 border-slate-600 rounded text-indigo-600"
        />
        <span class="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Enable</span>
      </label>
    </div>

    <div v-if="el.mask_enabled" class="space-y-3">
      <div>
        <label class="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-widest">Shape</label>
        <div class="grid grid-cols-2 gap-2">
          <button
            @click="setShape('inset')"
            class="px-3 py-1.5 rounded text-xs font-bold uppercase tracking-widest border transition"
            :class="(el.mask_shape || 'inset') === 'inset' ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-900 text-slate-400 border-slate-700 hover:border-slate-500'"
          >Rectangle</button>
          <button
            @click="setShape('ellipse')"
            class="px-3 py-1.5 rounded text-xs font-bold uppercase tracking-widest border transition"
            :class="el.mask_shape === 'ellipse' ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-900 text-slate-400 border-slate-700 hover:border-slate-500'"
          >Ellipse</button>
        </div>
        <p v-if="el.mask_shape === 'ellipse'" class="text-[10px] text-slate-500 mt-1.5 leading-snug">
          Tip: for a perfect circle, set the element's width and height so the cropped area is square.
        </p>
      </div>

      <div class="bg-slate-900/40 border border-slate-700 rounded-lg p-3">
        <div class="grid" style="grid-template-columns: minmax(0,1fr) 2rem minmax(0,1fr);">
          <div></div>
          <div class="flex flex-col items-center gap-1">
            <span class="mask-pct">{{ Math.round(el.mask_top_pc) }}%</span>
            <input
              type="range" min="0" max="99" step="1"
              :value="el.mask_top_pc"
              @input="setField('mask_top_pc', $event.target.value)"
              class="mask-slider-v"
            />
          </div>
          <div></div>

          <div class="flex items-center gap-1 justify-self-end self-center">
            <span class="mask-pct">{{ Math.round(el.mask_left_pc) }}%</span>
            <input
              type="range" min="0" max="99" step="1"
              :value="el.mask_left_pc"
              @input="setField('mask_left_pc', $event.target.value)"
              class="mask-slider-h"
            />
          </div>
          <div></div>
          <div class="flex items-center gap-1 justify-self-start self-center">
            <input
              type="range" min="0" max="99" step="1"
              :value="el.mask_right_pc"
              @input="setField('mask_right_pc', $event.target.value)"
              class="mask-slider-h mask-slider-reverse"
            />
            <span class="mask-pct">{{ Math.round(el.mask_right_pc) }}%</span>
          </div>

          <div></div>
          <div class="flex flex-col items-center gap-1">
            <input
              type="range" min="0" max="99" step="1"
              :value="el.mask_bottom_pc"
              @input="setField('mask_bottom_pc', $event.target.value)"
              class="mask-slider-v mask-slider-reverse"
            />
            <span class="mask-pct">{{ Math.round(el.mask_bottom_pc) }}%</span>
          </div>
          <div></div>
        </div>
      </div>

      <div v-if="(el.mask_shape || 'inset') === 'inset'">
        <label class="flex justify-between text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-widest">
          Round corners
          <span class="text-slate-500">{{ Math.round(el.mask_round_pc) }}%</span>
        </label>
        <input
          type="range" min="0" max="50" step="1"
          :value="el.mask_round_pc"
          @input="setField('mask_round_pc', $event.target.value)"
          class="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
        />
      </div>

      <button
        @click="reset"
        class="w-full text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-200 border border-slate-700 hover:border-slate-500 rounded px-3 py-1.5 transition"
      >
        Reset mask
      </button>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  el: { type: Object, required: true },
})
const emit = defineEmits(['update'])

const setField = (field, value) => {
  props.el[field] = Number(value)
  emit('update', props.el)
}

const setShape = (shape) => {
  props.el.mask_shape = shape
  emit('update', props.el)
}

const reset = () => {
  props.el.mask_top_pc = 0
  props.el.mask_right_pc = 0
  props.el.mask_bottom_pc = 0
  props.el.mask_left_pc = 0
  props.el.mask_round_pc = 0
  props.el.mask_shape = 'inset'
  emit('update', props.el)
}
</script>

<style scoped>
/* Cross-shaped mask sliders. Thumb position represents where the mask edge sits:
   default direction puts value 0 at the "outer" side so the thumb visually marks
   the cropped edge. `mask-slider-reverse` flips this for the bottom and right sliders.
   Length is generous so the user has plenty of travel room. */
.mask-slider-v {
  writing-mode: vertical-lr;
  width: 0.75rem;
  height: 6rem;
  cursor: pointer;
}
.mask-slider-h {
  width: 6rem;
  height: 0.75rem;
  cursor: pointer;
  flex-shrink: 0;
}
.mask-slider-reverse {
  direction: rtl;
}
/* Fixed-width label so the value flipping between "9%" and "99%" doesn't reflow
   the grid (which would shift the surrounding sliders during drag). */
.mask-pct {
  display: inline-block;
  min-width: 1.75rem;
  text-align: center;
  font-size: 9px;
  line-height: 1;
  color: rgb(148 163 184);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-variant-numeric: tabular-nums;
}
</style>
