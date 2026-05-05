<template>
  <div class="min-h-screen bg-slate-900 flex flex-col font-sans text-slate-200">
    <ControllerHeader
      :scene="sceneStore.scene"
      :obs-live="sceneStore.obsStatus.live"
      :is-user="authStore.isUser"
      :user-email="authStore.user?.email || ''"
      :display-name="authStore.displayName"
      :link-copied="copied === true"
      :renaming="renamingScene"
      :draft-name="sceneNameDraft"
      @update:draft-name="(v) => (sceneNameDraft = v)"
      @start-rename="startRenameScene"
      @cancel-rename="cancelRenameScene"
      @confirm-rename="confirmRenameScene"
      @copy-link="copyObsLink"
      @logout="handleHeaderLogout"
    />

    <div class="grow flex overflow-hidden" v-if="!sceneStore.loading">
      <LayersPanel
        :layers="sortedLayers"
        :selected-id="selectedElementId"
        :display-name="elementDisplayName"
        @add="handleAddElement"
        @select="(id) => (selectedElementId = id)"
        @toggle-active="toggleActive"
        @remove="handleRemoveElement"
        @reorder="handleReorder"
      />

      <main
        class="grow bg-slate-950 flex flex-col items-center justify-center relative p-8 select-none"
        @click="selectedElementId = null"
      >
        <div class="absolute inset-0 opacity-[0.03] pointer-events-none" style="background-image: radial-gradient(circle, #fff 1px, transparent 1px); background-size: 20px 20px;"></div>
        <p class="absolute top-4 left-4 text-xs font-mono text-slate-600 uppercase font-bold tracking-widest z-0 pointer-events-none">Interactive Preview (16:9 Format)</p>

        <div
          class="aspect-video w-full max-w-7xl bg-slate-900/40 border-2 border-slate-700/50 rounded-md shadow-2xl relative backdrop-blur-sm ring-4 ring-black/20 z-10"
          style="container-type: size;"
          @click.stop
        >
          <DraggableElement
            v-for="el in sceneStore.elements.filter(e => e.type !== 'audio')"
            :key="el.id"
            :el="el"
            :selected="selectedElementId === el.id"
            @select="selectedElementId = el.id"
            @update="(payload) => sceneStore.updateElement(payload)"
          />
        </div>
      </main>

      <PropertiesPanel
        :el="selectedElement"
        :default-name="selectedElement ? elementDisplayName(selectedElement) : ''"
        @update="(el) => sceneStore.updateElement(el)"
        @toggle-active="toggleActive"
        @apply-embed-aspect="applyEmbedAspect"
      />
    </div>

    <AudioPreviewers
      :audio-elements="audioElements"
      @audio-ended="handleAudioEnded"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSceneStore } from '../stores/sceneStore'
import { useAuthStore } from '../stores/authStore'
import { parseMediaSource } from '../utils/mediaSource'
import { sizeForAspect } from '../utils/elementSize'
import {
  buildNewElement,
  elementDisplayName,
  isElementModified,
  reorderByIds,
} from '../utils/elementFactory'
import { useCopyToClipboard } from '../composables/useCopyToClipboard'
import DraggableElement from '../components/DraggableElement.vue'
import ControllerHeader from '../components/controller/ControllerHeader.vue'
import LayersPanel from '../components/controller/LayersPanel.vue'
import PropertiesPanel from '../components/controller/PropertiesPanel.vue'
import AudioPreviewers from '../components/controller/AudioPreviewers.vue'

const route = useRoute()
const router = useRouter()
const shareToken = route.params.id
const sceneStore = useSceneStore()
const authStore = useAuthStore()

const selectedElementId = ref(null)
const selectedElement = computed(() =>
  sceneStore.elements.find(e => e.id === selectedElementId.value)
)
const audioElements = computed(() =>
  sceneStore.elements.filter(e => e.type === 'audio')
)
const sortedLayers = computed(() =>
  [...sceneStore.elements].sort((a, b) => (b.zIndex ?? 0) - (a.zIndex ?? 0))
)

// ---------- mutations ----------
const handleAddElement = (type) => {
  const el = buildNewElement(type, sceneStore.elements)
  sceneStore.addElement(el)
  selectedElementId.value = el.id
}

const handleRemoveElement = (el) => {
  if (isElementModified(el)) {
    const label = el.name || elementDisplayName(el)
    if (!confirm(`Delete "${label}"? This element has been modified — its content will be lost.`)) {
      return
    }
  }
  sceneStore.removeElement(el.id)
  if (selectedElementId.value === el.id) selectedElementId.value = null
}

const handleReorder = ({ sourceId, targetId }) => {
  const order = sortedLayers.value.map(e => e.id)
  const fromIdx = order.indexOf(sourceId)
  const toIdx = order.indexOf(targetId)
  if (fromIdx === -1 || toIdx === -1) return
  order.splice(fromIdx, 1)
  order.splice(toIdx, 0, sourceId)
  const updates = reorderByIds(sceneStore.elements, order)
  if (updates.length) sceneStore.updateElementsBatch(updates)
}

const toggleActive = (el) => {
  el.visible = !el.visible
  if (!el.visible) el.playing = false
  sceneStore.updateElement(el)
}

const applyEmbedAspect = (el) => {
  const ratio = parseMediaSource(el.content).aspectRatio
  if (!ratio) return
  const size = sizeForAspect(ratio)
  el.width_pc = size.width_pc
  el.height_pc = size.height_pc
  sceneStore.updateElement(el)
}

const handleAudioEnded = (id) => {
  const el = sceneStore.elements.find(e => e.id === id)
  if (!el || el.loop) return
  el.playing = false
  sceneStore.updateElement(el)
}

// ---------- header bits ----------
const { copied, copy } = useCopyToClipboard()
const copyObsLink = () => {
  const token = sceneStore.scene?.shareToken
  if (!token) return
  copy(`${window.location.origin}/scene/${token}`)
}

// Inline scene-name rename. ControllerHeader handles its own focus on flip.
const renamingScene = ref(false)
const sceneNameDraft = ref('')
let sceneRenameInFlight = false

const startRenameScene = () => {
  if (!sceneStore.scene) return
  sceneNameDraft.value = sceneStore.scene.name || ''
  renamingScene.value = true
}

const cancelRenameScene = () => {
  renamingScene.value = false
  sceneNameDraft.value = ''
}

const confirmRenameScene = async () => {
  if (sceneRenameInFlight) return
  if (!renamingScene.value || !sceneStore.scene) return
  const proposed = sceneNameDraft.value.trim()
  const current = sceneStore.scene.name
  if (!proposed || proposed === current) {
    cancelRenameScene()
    return
  }
  sceneRenameInFlight = true
  try {
    const id = sceneStore.scene._id || sceneStore.scene.id
    await sceneStore.updateScene(id, { name: proposed })
  } catch {
    // sceneStore.error already populated
  } finally {
    sceneRenameInFlight = false
    cancelRenameScene()
  }
}

const handleHeaderLogout = async () => {
  await authStore.logout()
}

// ---------- lifecycle ----------
onMounted(async () => {
  if (!authStore.token) {
    await authStore.ensureToken()
  }
  try {
    const scene = await sceneStore.loadSceneByToken(shareToken)
    sceneStore.initSocketAsEditor(scene._id, authStore.token)
  } catch {
    router.replace({ name: 'Dashboard' })
  }
})

onUnmounted(() => {
  sceneStore.disconnectSocket()
})
</script>
