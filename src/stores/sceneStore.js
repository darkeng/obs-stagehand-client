import { defineStore } from 'pinia';
import { socketService } from '../services/socket';
import api from '../services/api';

// Per-element throttle window for `update-element` socket emits.
// Leading + trailing edge: first change emits immediately, rapid follow-ups
// coalesce into one emit at the end of the window. ~20Hz upper bound per element.
const EMIT_THROTTLE_MS = 50;

export const useSceneStore = defineStore('scene', {
  state: () => ({
    scene: null,
    elements: [],
    obsStatus: { live: false, recording: false },
    list: [],
    loading: false,
    error: null,
    _socketHandlers: [],
    _emitState: new Map(),
  }),

  actions: {
    // ---------- list ----------
    async loadMyScenes() {
      this.loading = true;
      this.error = null;
      try {
        const { data } = await api.get('/scenes');
        this.list = data;
      } catch (err) {
        console.error('Failed to load scenes', err);
        this.error = err.response?.data?.error || 'Failed to load scenes';
      } finally {
        this.loading = false;
      }
    },

    async createScene(name = 'Untitled Scene') {
      this.loading = true;
      this.error = null;
      try {
        const { data } = await api.post('/scenes', { name });
        this.list.unshift({ ...data, elements: undefined });
        return data;
      } catch (err) {
        this.error = err.response?.data?.error || 'Could not create scene';
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async deleteScene(id) {
      try {
        await api.delete(`/scenes/${id}`);
        this.list = this.list.filter(s => (s.id || s._id) !== id);
      } catch (err) {
        this.error = err.response?.data?.error || 'Could not delete scene';
        throw err;
      }
    },

    async updateScene(id, patch) {
      try {
        const { data } = await api.patch(`/scenes/${id}`, patch);
        const idx = this.list.findIndex(s => (s.id || s._id) === id);
        if (idx !== -1) {
          this.list[idx] = { ...this.list[idx], ...data };
        }
        if (this.scene && (this.scene.id || this.scene._id) === id) {
          this.scene = { ...this.scene, ...data };
        }
        return data;
      } catch (err) {
        this.error = err.response?.data?.error || 'Could not update scene';
        throw err;
      }
    },

    // ---------- single scene ----------
    async loadSceneByToken(shareToken) {
      this.loading = true;
      this.error = null;
      try {
        const { data } = await api.get(`/scenes/by-token/${shareToken}`);
        this.scene = data;
        this.elements = data.elements || [];
        return data;
      } catch (err) {
        this.error = err.response?.data?.error || 'Failed to load scene';
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async loadSceneById(id) {
      this.loading = true;
      this.error = null;
      try {
        const { data } = await api.get(`/scenes/${id}`);
        this.scene = data;
        this.elements = data.elements || [];
        return data;
      } catch (err) {
        this.error = err.response?.data?.error || 'Failed to load scene';
        throw err;
      } finally {
        this.loading = false;
      }
    },

    // ---------- realtime ----------
    initSocketAsEditor(sceneId, token) {
      socketService.connect({ token });
      this._wireSocketEvents();
      socketService.joinScene(sceneId);
    },

    initSocketAsViewer(sceneId, shareToken) {
      socketService.connect({ shareToken });
      this._wireSocketEvents();
      socketService.joinScene(sceneId);
    },

    _wireSocketEvents() {
      this._socketHandlers.forEach(off => off());
      this._socketHandlers = [
        socketService.on('element-updated', (el) => {
          const i = this.elements.findIndex(e => e.id === el.id);
          if (i !== -1) this.elements[i] = el;
        }),
        socketService.on('element-added', (el) => {
          this.elements.push(el);
        }),
        socketService.on('element-removed', (id) => {
          this.elements = this.elements.filter(e => e.id !== id);
        }),
        socketService.on('obs-status', (status) => {
          this.obsStatus = status;
        }),
      ];
    },

    disconnectSocket() {
      this.flushPendingEmits();
      this._socketHandlers.forEach(off => off());
      this._socketHandlers = [];
      socketService.disconnect();
      this._emitState.clear();
      this.scene = null;
      this.elements = [];
      this.obsStatus = { live: false, recording: false };
    },

    // ---------- mutations (editor) ----------
    addElement(element) {
      this.elements.push(element);
      socketService.emit('add-element', { sceneId: this.scene._id, element });
    },

    updateElement(element) {
      const i = this.elements.findIndex(e => e.id === element.id);
      if (i !== -1) this.elements[i] = element;
      this._scheduleEmit(element);
    },

    _scheduleEmit(element) {
      if (!this.scene) return;
      const now = Date.now();
      let entry = this._emitState.get(element.id);
      if (!entry) {
        entry = { lastEmit: 0, pending: null, timer: null };
        this._emitState.set(element.id, entry);
      }
      entry.pending = element;
      const since = now - entry.lastEmit;
      if (since >= EMIT_THROTTLE_MS) {
        this._flushEmit(element.id);
      } else if (!entry.timer) {
        entry.timer = setTimeout(() => this._flushEmit(element.id), EMIT_THROTTLE_MS - since);
      }
    },

    _flushEmit(id) {
      const entry = this._emitState.get(id);
      if (!entry || !entry.pending) return;
      socketService.emit('update-element', { sceneId: this.scene._id, element: entry.pending });
      entry.lastEmit = Date.now();
      entry.pending = null;
      if (entry.timer) {
        clearTimeout(entry.timer);
        entry.timer = null;
      }
    },

    flushPendingEmits() {
      for (const id of [...this._emitState.keys()]) {
        this._flushEmit(id);
      }
    },

    // Bypass throttling for batch ops like reordering layers, where every
    // element's update must reach the server (not just the most recent one).
    updateElementsBatch(elements) {
      elements.forEach(el => {
        const entry = this._emitState.get(el.id);
        if (entry?.timer) clearTimeout(entry.timer);
        this._emitState.delete(el.id);
      });
      elements.forEach(updated => {
        const i = this.elements.findIndex(e => e.id === updated.id);
        if (i !== -1) this.elements[i] = updated;
      });
      elements.forEach(element => {
        socketService.emit('update-element', { sceneId: this.scene._id, element });
      });
    },

    removeElement(elementId) {
      const entry = this._emitState.get(elementId);
      if (entry?.timer) clearTimeout(entry.timer);
      this._emitState.delete(elementId);

      this.elements = this.elements.filter(e => e.id !== elementId);
      socketService.emit('remove-element', { sceneId: this.scene._id, elementId });
    },

    emitObsStatus(status) {
      if (!this.scene) return;
      socketService.emit('obs-status', { sceneId: this.scene._id, status });
    },
  }
});
