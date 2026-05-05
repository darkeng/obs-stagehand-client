import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/authStore'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// Ensure we always have at least a guest identity before the first render.
// If the existing token is valid we keep it; otherwise mint a fresh guest token.
const auth = useAuthStore()
auth.ensureToken().finally(() => {
  app.mount('#app')
})
