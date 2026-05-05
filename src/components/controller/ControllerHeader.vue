<template>
  <header class="bg-slate-800 border-b border-slate-700 px-6 py-3 grid grid-cols-3 items-center gap-4 shadow-md z-20">
    <div class="min-w-0 flex items-center gap-3">
      <router-link
        :to="{ name: 'Dashboard' }"
        class="shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-slate-600 hover:border-indigo-400 hover:text-indigo-300 text-slate-300 text-xs font-bold uppercase tracking-wider transition"
        title="Back to scenes"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Scenes
      </router-link>
      <div class="min-w-0">
        <div class="flex items-center gap-3">
          <h1 class="text-xl font-bold text-indigo-400 truncate">StageHand Controller</h1>
          <div
            class="flex items-center gap-2 px-2 py-0.5 rounded-full border shrink-0"
            :class="obsLive ? 'bg-red-500/10 border-red-500/50 text-red-500' : 'bg-slate-700 border-slate-600 text-slate-400'"
          >
            <div class="w-2 h-2 rounded-full shadow-inner" :class="obsLive ? 'bg-red-500 animate-pulse shadow-red-500/50' : 'bg-slate-500'"></div>
            <span class="text-[10px] font-black uppercase tracking-wider">{{ obsLive ? 'LIVE' : 'OFFLINE' }}</span>
          </div>
        </div>
        <p class="text-xs text-slate-400 mt-1 flex items-center gap-1.5 min-w-0">
          <span class="shrink-0">Editing:</span>
          <input
            v-if="renaming"
            ref="inputEl"
            :value="draftName"
            @input="$emit('update:draft-name', $event.target.value)"
            maxlength="120"
            @keydown.enter.prevent="$emit('confirm-rename')"
            @keydown.esc.prevent="$emit('cancel-rename')"
            @blur="$emit('confirm-rename')"
            class="font-mono text-indigo-300 bg-slate-900 border border-indigo-500 rounded px-1.5 py-0.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50 min-w-0 max-w-xs"
          />
          <button
            v-else
            @click="$emit('start-rename')"
            class="group/sn flex items-center gap-1.5 min-w-0 hover:text-indigo-200 transition"
            :title="`${scene?.name} — click to rename`"
          >
            <span class="font-mono text-indigo-300 truncate">{{ scene?.name || scene?._id }}</span>
            <svg class="w-3 h-3 text-slate-500 group-hover/sn:text-indigo-300 shrink-0 opacity-0 group-hover/sn:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487a2.06 2.06 0 0 1 2.915 2.915L7.5 19.679 3 21l1.321-4.5L16.862 4.487z" />
            </svg>
          </button>
        </p>
      </div>
    </div>

    <div class="flex justify-center min-w-0">
      <div
        v-if="!isUser"
        class="flex items-center gap-3 max-w-full bg-amber-500/10 border border-amber-500/40 rounded-lg px-3 py-1.5"
      >
        <svg class="w-4 h-4 text-amber-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m0 3.75h.008v.008H12v-.008zM10.5 4.5h3l8.5 15h-20l8.5-15z" />
        </svg>
        <p class="text-[11px] text-amber-100/90 leading-tight min-w-0">
          <span class="font-bold">Guest mode.</span> Your scenes live in this browser only — clearing site data will lose them.
        </p>
        <router-link
          :to="{ name: 'Signup' }"
          class="shrink-0 px-3 py-1 rounded-md bg-amber-500 hover:bg-amber-400 text-slate-900 text-[10px] font-black uppercase tracking-widest transition shadow"
        >
          Sign up
        </router-link>
      </div>
      <div
        v-else
        class="flex items-center gap-2 text-xs text-slate-300"
        :title="userEmail"
      >
        <div class="w-2 h-2 rounded-full bg-emerald-400"></div>
        <span class="font-semibold truncate">{{ displayName }}</span>
      </div>
    </div>

    <div class="flex items-center gap-2 justify-end">
      <button
        @click="$emit('copy-link')"
        :disabled="!scene?.shareToken"
        class="px-3 py-2 rounded-md text-sm font-bold transition-colors shadow-sm flex items-center gap-2 disabled:opacity-40"
        :class="linkCopied
          ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
          : 'bg-indigo-600 hover:bg-indigo-500 text-white'"
      >
        <svg v-if="!linkCopied" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M8 16H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2m-6 12h8a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-8a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2z" />
        </svg>
        <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="m5 13 4 4L19 7" />
        </svg>
        {{ linkCopied ? 'Copied!' : 'Copy OBS link' }}
      </button>

      <button
        v-if="isUser"
        @click="$emit('logout')"
        class="px-3 py-2 rounded-md border border-slate-600 hover:border-slate-400 text-slate-300 hover:text-white text-xs font-bold uppercase tracking-wider transition"
      >
        Log out
      </button>
      <router-link
        v-else
        :to="{ name: 'Login' }"
        class="px-3 py-2 rounded-md border border-slate-600 hover:border-slate-400 text-slate-300 hover:text-white text-xs font-bold uppercase tracking-wider transition"
      >
        Sign in
      </router-link>
    </div>
  </header>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'

const props = defineProps({
  scene: { type: Object, default: null },
  obsLive: { type: Boolean, default: false },
  isUser: { type: Boolean, default: false },
  userEmail: { type: String, default: '' },
  displayName: { type: String, default: '' },
  linkCopied: { type: Boolean, default: false },
  renaming: { type: Boolean, default: false },
  draftName: { type: String, default: '' },
})
defineEmits(['copy-link', 'logout', 'start-rename', 'confirm-rename', 'cancel-rename', 'update:draft-name'])

const inputEl = ref(null)
// Auto-focus + select when the parent flips into renaming mode.
watch(() => props.renaming, async (active) => {
  if (!active) return
  await nextTick()
  inputEl.value?.focus()
  inputEl.value?.select?.()
})
</script>
