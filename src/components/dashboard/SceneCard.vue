<template>
  <li class="bg-slate-800 border border-slate-700 rounded-xl p-5 flex flex-col gap-3 hover:border-indigo-500 transition-colors group">
    <div class="flex justify-between items-start gap-3">
      <div class="min-w-0 flex-1">
        <input
          v-if="renaming"
          ref="inputEl"
          :value="draftName"
          @input="$emit('update:draft-name', $event.target.value)"
          maxlength="120"
          @keydown.enter.prevent="$emit('confirm-rename')"
          @keydown.esc.prevent="$emit('cancel-rename')"
          @blur="$emit('confirm-rename')"
          class="w-full text-base font-bold bg-slate-900 border border-indigo-500 rounded px-2 py-1 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
        />
        <h3
          v-else
          @click="$emit('start-rename')"
          class="text-base font-bold truncate cursor-text hover:bg-slate-700/50 rounded px-1 -mx-1 transition"
          :title="`${scene.name} — click to rename`"
        >
          {{ scene.name }}
        </h3>
        <p class="text-[11px] font-mono text-slate-500 mt-1 truncate">{{ scene.shareToken }}</p>
        <p class="text-[10px] text-slate-600 mt-1">{{ formattedDate }}</p>
      </div>
      <button
        @click="$emit('delete')"
        class="text-slate-500 hover:text-red-400 transition opacity-0 group-hover:opacity-100 shrink-0"
        title="Delete scene"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
        </svg>
      </button>
    </div>

    <div class="flex flex-wrap gap-1.5 min-h-6">
      <span
        v-for="tag in tags"
        :key="tag.type"
        class="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border"
        :class="tag.classes"
        :title="`${tag.count} ${tag.label}${tag.count === 1 ? '' : 's'}`"
      >
        <span>{{ tag.label }}</span>
        <span class="opacity-90">×{{ tag.count }}</span>
      </span>
      <span
        v-if="totalCount === 0"
        class="text-[10px] text-slate-600 italic"
      >
        empty scene
      </span>
    </div>

    <div class="flex gap-2 mt-1">
      <router-link
        :to="`/control/${scene.shareToken}`"
        class="grow flex items-center justify-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-md text-sm font-bold transition shadow-sm"
        title="Open scene controller"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 0 0-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 0 0-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 0 0-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 0 0-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 0 0 1.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />
        </svg>
        Edit
      </router-link>
      <a
        :href="`/scene/${scene.shareToken}`"
        target="_blank"
        class="shrink-0 flex items-center justify-center px-3 py-2 border border-slate-600 hover:border-indigo-400 hover:text-indigo-300 text-slate-300 rounded-md transition"
        title="Open OBS preview in new tab"
        aria-label="Open OBS preview in new tab"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M14 3h7v7m0-7L10 14m-3-7H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2" />
        </svg>
      </a>
      <button
        @click="$emit('copy-link')"
        class="shrink-0 flex items-center justify-center px-3 py-2 border rounded-md transition"
        :class="copied
          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
          : 'border-slate-600 hover:border-indigo-400 hover:text-indigo-300 text-slate-300'"
        :title="copied ? 'Copied!' : 'Copy OBS link'"
        :aria-label="copied ? 'Copied' : 'Copy OBS link'"
      >
        <svg v-if="!copied" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M8 16H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2m-6 12h8a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-8a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2z" />
        </svg>
        <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="m5 13 4 4L19 7" />
        </svg>
      </button>
    </div>
  </li>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { ELEMENT_TYPES, TYPE_LABELS, TYPE_TAG_CLASSES } from '../../constants/elements'

const props = defineProps({
  scene: { type: Object, required: true },
  copied: { type: Boolean, default: false },
  renaming: { type: Boolean, default: false },
  draftName: { type: String, default: '' },
})
defineEmits([
  'delete', 'copy-link',
  'start-rename', 'cancel-rename', 'confirm-rename', 'update:draft-name',
])

const tags = computed(() => {
  const counts = props.scene.elementCounts || {}
  return ELEMENT_TYPES
    .filter((t) => (counts[t] || 0) > 0)
    .map((t) => ({
      type: t,
      label: TYPE_LABELS[t],
      count: counts[t],
      classes: TYPE_TAG_CLASSES[t],
    }))
})

const totalCount = computed(() =>
  Number.isFinite(props.scene.totalElements)
    ? props.scene.totalElements
    : Object.values(props.scene.elementCounts || {}).reduce((a, b) => a + (b || 0), 0)
)

const formattedDate = computed(() => {
  const iso = props.scene.createdAt
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
    + ' · ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
})

const inputEl = ref(null)
watch(() => props.renaming, async (active) => {
  if (!active) return
  await nextTick()
  inputEl.value?.focus()
  inputEl.value?.select?.()
})
</script>
