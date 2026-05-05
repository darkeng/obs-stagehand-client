import { io } from 'socket.io-client';

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3000';

class SocketService {
  constructor() {
    this.socket = null;
    this.currentSceneId = null;
  }

  connect({ token, shareToken } = {}) {
    if (this.socket) return;
    const auth = {};
    if (token) auth.token = token;
    if (shareToken) auth.shareToken = shareToken;
    this.socket = io(WS_URL, { auth });
    this.socket.on('connect', () => {
      if (this.currentSceneId) {
        this.socket.emit('join-scene', this.currentSceneId);
      }
    });
    this.socket.on('connect_error', (err) => {
      console.warn('Socket connect_error:', err.message);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.currentSceneId = null;
    }
  }

  joinScene(sceneId) {
    this.currentSceneId = sceneId;
    if (this.socket) {
      this.socket.emit('join-scene', sceneId);
    }
  }

  emit(event, payload) {
    this.socket?.emit(event, payload);
  }

  on(event, handler) {
    if (!this.socket) return () => {};
    this.socket.on(event, handler);
    return () => this.socket?.off(event, handler);
  }

  off(event, handler) {
    this.socket?.off(event, handler);
  }
}

export const socketService = new SocketService();
