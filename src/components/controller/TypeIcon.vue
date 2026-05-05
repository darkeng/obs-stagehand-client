<template>
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.8">
    <template v-if="type === 'text'">
      <path stroke-linecap="round" stroke-linejoin="round" d="M5 7V5h14v2M9 5v14m6-14v14m-3-9h6m-12 0h6" />
    </template>
    <template v-else-if="type === 'image'">
      <path stroke-linecap="round" stroke-linejoin="round" d="M4 5.25A1.5 1.5 0 0 1 5.5 3.75h13a1.5 1.5 0 0 1 1.5 1.5v13.5a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.75V5.25z" />
      <path stroke-linecap="round" stroke-linejoin="round" d="m4 16 4.5-4.5a2 2 0 0 1 2.83 0L16 16m-2.5-2.5 1.46-1.46a2 2 0 0 1 2.83 0L20 14M14.5 8.5h.01" />
    </template>
    <template v-else-if="type === 'video'">
      <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 6A1.5 1.5 0 0 1 6 4.5h12A1.5 1.5 0 0 1 19.5 6v12a1.5 1.5 0 0 1-1.5 1.5H6A1.5 1.5 0 0 1 4.5 18V6z" />
      <path stroke-linecap="round" stroke-linejoin="round" d="M10 9.5v5l4.5-2.5L10 9.5z" fill="currentColor" />
    </template>
    <template v-else-if="type === 'audio'">
      <path stroke-linecap="round" stroke-linejoin="round" d="M9 18V7l11-3v11" />
      <circle cx="6.5" cy="18" r="2.5" stroke-linejoin="round" />
      <circle cx="17.5" cy="15" r="2.5" stroke-linejoin="round" />
    </template>
  </svg>
</template>

<script setup>
defineProps({
  type: { type: String, required: true },
})
</script>
