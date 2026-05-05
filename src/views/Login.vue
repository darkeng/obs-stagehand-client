<template>
  <div class="min-h-screen flex items-center justify-center bg-slate-900 p-6 border-t-4 border-indigo-500">
    <div class="w-full max-w-md bg-slate-800 rounded-xl shadow-2xl p-8">
      <h1 class="text-3xl font-extrabold text-transparent bg-clip-text bg-linear-to-r from-indigo-400 to-purple-400 mb-2 text-center">
        Sign in
      </h1>
      <p class="text-slate-400 text-center mb-6 text-sm">
        Recover your scenes from any device.
      </p>

      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div>
          <label class="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-widest">Email</label>
          <input
            v-model="email"
            type="email"
            required
            autocomplete="email"
            class="w-full bg-slate-900 border border-slate-600 rounded-md px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label class="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-widest">Password</label>
          <input
            v-model="password"
            type="password"
            required
            autocomplete="current-password"
            class="w-full bg-slate-900 border border-slate-600 rounded-md px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <p v-if="authStore.error" class="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-md px-3 py-2">
          {{ authStore.error }}
        </p>

        <button
          type="submit"
          :disabled="submitting"
          class="w-full rounded-lg bg-indigo-600 px-6 py-3 text-white font-bold shadow-lg hover:bg-indigo-500 disabled:opacity-50 transition-colors focus:ring-4 focus:ring-indigo-500/50"
        >
          {{ submitting ? 'Signing in…' : 'Sign in' }}
        </button>
      </form>

      <div class="mt-6 text-center text-sm text-slate-500">
        Need an account?
        <router-link :to="{ name: 'Signup' }" class="text-indigo-400 hover:text-indigo-300 font-semibold">Sign up</router-link>
        ·
        <router-link :to="{ name: 'Dashboard' }" class="text-slate-400 hover:text-slate-300">Continue as guest</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/authStore'

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const submitting = ref(false)

const handleSubmit = async () => {
  submitting.value = true
  try {
    const { migratedScenes } = await authStore.login(email.value, password.value)
    if (migratedScenes > 0) {
      console.log(`Migrated ${migratedScenes} guest scenes to your account`)
    }
    router.push({ name: 'Dashboard' })
  } catch {
    // error already in authStore.error
  } finally {
    submitting.value = false
  }
}
</script>
