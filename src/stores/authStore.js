import { defineStore } from 'pinia';
import api from '../services/api';

const TOKEN_KEY = 'token';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem(TOKEN_KEY) || null,
    kind: null,           // 'user' | 'guest' | null
    user: null,           // { id, email, ... } when kind === 'user'
    guestId: null,        // string when kind === 'guest'
    initializing: false,
    error: null,
  }),

  getters: {
    isAuthenticated: (s) => !!s.token,
    isUser: (s) => s.kind === 'user',
    isGuest: (s) => s.kind === 'guest',
    // Public-safe display label derived from the user's email: local part with
    // first letter uppercased. Hides the @domain so it can be on-camera during
    // a stream without leaking the user's real address.
    displayName: (s) => {
      const email = s.user?.email
      if (!email) return ''
      const local = email.split('@')[0] || ''
      if (!local) return ''
      return local.charAt(0).toUpperCase() + local.slice(1)
    },
  },

  actions: {
    setToken(token) {
      this.token = token;
      if (token) localStorage.setItem(TOKEN_KEY, token);
      else localStorage.removeItem(TOKEN_KEY);
    },

    async ensureToken() {
      if (this.token) {
        await this.fetchMe().catch(() => this.clear());
      }
      if (!this.token) {
        await this.requestGuestToken();
      }
    },

    async requestGuestToken() {
      try {
        const { data } = await api.post('/auth/guest');
        this.setToken(data.token);
        this.kind = 'guest';
        this.guestId = data.id;
        this.user = null;
      } catch (err) {
        console.error('Failed to obtain guest token', err);
        this.error = 'Could not initialize session';
        throw err;
      }
    },

    async fetchMe() {
      const { data } = await api.get('/auth/me');
      this.kind = data.kind;
      if (data.kind === 'user') {
        this.user = data.user;
        this.guestId = null;
      } else {
        this.guestId = data.id;
        this.user = null;
      }
    },

    async signup(email, password) {
      this.error = null;
      try {
        const guestToken = this.kind === 'guest' ? this.token : null;
        const { data } = await api.post('/auth/signup', { email, password, guestToken });
        this.setToken(data.token);
        this.kind = 'user';
        this.user = data.user;
        this.guestId = null;
        return { migratedScenes: data.migratedScenes ?? 0 };
      } catch (err) {
        this.error = err.response?.data?.error || 'Signup failed';
        throw err;
      }
    },

    async login(email, password) {
      this.error = null;
      try {
        const guestToken = this.kind === 'guest' ? this.token : null;
        const { data } = await api.post('/auth/login', { email, password, guestToken });
        this.setToken(data.token);
        this.kind = 'user';
        this.user = data.user;
        this.guestId = null;
        return { migratedScenes: data.migratedScenes ?? 0 };
      } catch (err) {
        this.error = err.response?.data?.error || 'Login failed';
        throw err;
      }
    },

    async logout() {
      this.clear();
      // immediately mint a fresh guest identity so the app stays usable
      await this.requestGuestToken();
    },

    clear() {
      this.setToken(null);
      this.kind = null;
      this.user = null;
      this.guestId = null;
    },
  },
});
