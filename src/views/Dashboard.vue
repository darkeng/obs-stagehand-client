<template>
  <div class="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
    <header class="bg-slate-800 border-b border-slate-700 px-6 py-4 flex justify-between items-center">
      <div>
        <h1 class="text-2xl font-extrabold text-transparent bg-clip-text bg-linear-to-r from-indigo-400 to-purple-400">StageHand</h1>
        <p class="text-xs text-slate-400 mt-1">Real-time OBS Scene Controller</p>
      </div>

      <div class="flex items-center gap-3 text-sm">
        <template v-if="authStore.isUser">
          <div class="flex items-center gap-2 text-slate-300" :title="authStore.user?.email">
            <div class="w-2 h-2 rounded-full bg-emerald-500"></div>
            <span class="text-xs font-semibold">{{ authStore.displayName }}</span>
          </div>
          <button
            @click="handleLogout"
            class="px-3 py-1.5 rounded-md border border-slate-600 hover:border-slate-400 text-slate-300 hover:text-white transition text-xs font-bold uppercase tracking-wider"
          >
            Log out
          </button>
        </template>
        <template v-else>
          <span class="text-xs text-slate-500 italic mr-2">Guest mode — scenes tied to this browser</span>
          <router-link :to="{ name: 'Login' }" class="px-3 py-1.5 rounded-md border border-slate-600 hover:border-indigo-400 hover:text-indigo-300 transition text-xs font-bold uppercase tracking-wider">
            Sign in
          </router-link>
          <router-link :to="{ name: 'Signup' }" class="px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 transition text-xs font-bold uppercase tracking-wider shadow">
            Sign up
          </router-link>
        </template>
      </div>
    </header>

    <main class="grow max-w-5xl mx-auto w-full px-6 py-10">
      <div class="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h2 class="text-xl font-bold">Your scenes</h2>
          <p class="text-sm text-slate-400 mt-1">
            <template v-if="authStore.isGuest">
              Scenes are stored against this browser. Sign up to keep them across devices.
            </template>
            <template v-else-if="authStore.isUser">
              Available from any device while you're signed in.
            </template>
          </p>
        </div>

        <div v-if="creatingScene" class="flex items-center gap-2">
          <input
            ref="newSceneInputRef"
            v-model="newSceneName"
            placeholder="Scene name"
            maxlength="120"
            @keydown.enter.prevent="confirmCreateScene"
            @keydown.esc.prevent="cancelCreateScene"
            class="bg-slate-900 border border-indigo-500 rounded-md px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 w-56"
          />
          <button
            @click="confirmCreateScene"
            :disabled="sceneStore.loading"
            class="rounded-lg bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-white text-sm font-bold shadow disabled:opacity-50 transition-colors"
          >
            {{ sceneStore.loading ? 'Creating…' : 'Create' }}
          </button>
          <button
            @click="cancelCreateScene"
            class="rounded-lg border border-slate-600 hover:border-slate-400 px-3 py-2 text-slate-300 hover:text-white text-sm font-bold transition"
          >
            Cancel
          </button>
        </div>
        <button
          v-else
          @click="startCreateScene"
          :disabled="sceneStore.loading"
          class="rounded-lg bg-indigo-600 hover:bg-indigo-500 px-5 py-2.5 text-white font-bold shadow-lg disabled:opacity-50 transition-colors focus:ring-4 focus:ring-indigo-500/50"
        >
          + New Scene
        </button>
      </div>

      <p v-if="sceneStore.error" class="mb-4 text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-md px-3 py-2">
        {{ sceneStore.error }}
      </p>

      <div v-if="sceneStore.loading && sceneStore.list.length === 0" class="text-center py-16 text-slate-500">
        Loading…
      </div>

      <div v-else-if="sceneStore.list.length === 0" class="text-center py-16 border-2 border-dashed border-slate-700 rounded-xl text-slate-500">
        <p class="font-semibold mb-1">No scenes yet</p>
        <p class="text-xs uppercase tracking-widest">Create your first one to get started.</p>
      </div>

      <ul v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SceneCard
          v-for="scene in sceneStore.list"
          :key="sceneId(scene)"
          :scene="scene"
          :copied="copied === sceneId(scene)"
          :renaming="rename.isRenaming(scene)"
          :draft-name="rename.state.draft"
          @update:draft-name="(v) => (rename.state.draft = v)"
          @start-rename="rename.start(scene)"
          @cancel-rename="rename.cancel()"
          @confirm-rename="rename.confirm(scene)"
          @copy-link="handleCopy(scene)"
          @delete="handleDelete(scene)"
        />
      </ul>
    </main>
  </div>
</template>

<script setup>
import { onMounted, ref, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/authStore'
import { useSceneStore } from '../stores/sceneStore'
import { useCopyToClipboard } from '../composables/useCopyToClipboard'
import { useInlineRename } from '../composables/useInlineRename'
import SceneCard from '../components/dashboard/SceneCard.vue'

const router = useRouter()
const authStore = useAuthStore()
const sceneStore = useSceneStore()

const sceneId = (s) => s.id || s._id

// ---------- Create scene with name ----------
const creatingScene = ref(false)
const newSceneName = ref('')
const newSceneInputRef = ref(null)

const startCreateScene = async () => {
  creatingScene.value = true
  newSceneName.value = ''
  await nextTick()
  newSceneInputRef.value?.focus()
}

const cancelCreateScene = () => {
  creatingScene.value = false
  newSceneName.value = ''
}

const confirmCreateScene = async () => {
  const name = newSceneName.value.trim() || 'Untitled Scene'
  try {
    const scene = await sceneStore.createScene(name)
    creatingScene.value = false
    newSceneName.value = ''
    router.push(`/control/${scene.shareToken}`)
  } catch {
    // sceneStore.error already populated
  }
}

// ---------- Inline rename ----------
const rename = useInlineRename({
  keyOf: sceneId,
  getName: (s) => s.name,
  onSubmit: async (s, newName) => {
    await sceneStore.updateScene(sceneId(s), { name: newName })
  },
})

// ---------- Copy OBS link ----------
const { copied, copy } = useCopyToClipboard()
const handleCopy = (scene) => {
  const url = `${window.location.origin}/scene/${scene.shareToken}`
  copy(url, sceneId(scene))
}

const handleDelete = async (scene) => {
  if (!confirm(`Delete "${scene.name}"? This cannot be undone.`)) return
  await sceneStore.deleteScene(sceneId(scene))
}

const handleLogout = async () => {
  await authStore.logout()
  await sceneStore.loadMyScenes()
}

onMounted(async () => {
  await authStore.ensureToken()
  await sceneStore.loadMyScenes()
})
</script>
