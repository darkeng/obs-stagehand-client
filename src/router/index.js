import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '../views/Dashboard.vue'
import Scene from '../views/Scene.vue'
import Controller from '../views/Controller.vue'
import Login from '../views/Login.vue'
import Signup from '../views/Signup.vue'

const routes = [
  { path: '/', name: 'Dashboard', component: Dashboard },
  { path: '/login', name: 'Login', component: Login, meta: { hideForAuthenticatedUser: true } },
  { path: '/signup', name: 'Signup', component: Signup, meta: { hideForAuthenticatedUser: true } },
  { path: '/scene/:id', name: 'Scene', component: Scene, meta: { public: true } },
  { path: '/control/:id', name: 'Controller', component: Controller },
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to) => {
  // Hide login/signup once the user is authenticated as a real user.
  if (to.meta.hideForAuthenticatedUser) {
    const token = localStorage.getItem('token')
    // We can't import the store here without circular deps; rely on token presence
    // and let the store sort out kind. Login/Signup are always reachable for guests.
    if (!token) return true
  }
  return true
})

export default router
