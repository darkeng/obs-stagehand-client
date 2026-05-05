# StageHand · Client

Web UI for **StageHand**, a remote OBS scene controller. Dashboard, real-time
controller, and a transparent 16:9 renderer for OBS Browser Source — all in one
SPA.

Companion backend: [`obs-stagehand-server`](https://github.com/darkeng/obs-stagehand-server).

## Stack

- **Vue 3** (Composition API, `<script setup>`)
- **vue-router** + **Pinia**
- **axios** (with JWT interceptor) + **socket.io-client**
- **Tailwind CSS 4** + **Vite**

## Quick start

```bash
cp .env.example .env          # point at your backend
npm install
npm run dev                   # http://localhost:5173
```

### Docker (dev)

```bash
docker build -t stagehand-client .
docker run -p 5173:5173 --env-file .env stagehand-client
```

For production, run `npm run build` and serve `dist/` via a static-file server
(nginx, Caddy, etc.). `VITE_*` variables are baked at build time.

## Environment variables

| Variable        | Description                              |
| --------------- | ---------------------------------------- |
| `VITE_API_URL`  | Backend REST base (e.g. `/api` suffix)   |
| `VITE_WS_URL`   | Backend WebSocket origin                 |

## Routes

| Path             | View         | Purpose                                                |
| ---------------- | ------------ | ------------------------------------------------------ |
| `/`              | Dashboard    | List, create, rename, delete scenes                    |
| `/login`, `/signup` | Auth      | User login / signup; guest token always available      |
| `/control/:token` | Controller  | Editor — sidebar layers, canvas, properties panel      |
| `/scene/:token`   | Scene       | OBS Browser Source target — transparent 16:9 renderer  |

The **Scene** view is the public renderer. Add it as a Browser Source in OBS
with the URL `https://stagehand.darkeng.dev/scene/<shareToken>`. Element
mutations from the controller propagate via Socket.io in real time.

## Layout

```
src/
├── views/                 ← Dashboard, Scene, Controller, Login, Signup
├── components/
│   ├── DraggableElement.vue   ← canvas element with resize handles
│   ├── controller/        ← Header, LayersPanel, PropertiesPanel,
│   │                        MaskControls, MediaControls, AudioPreviewers
│   └── dashboard/SceneCard.vue
├── composables/           ← useCopyToClipboard, useInlineRename, useObsStatus
├── constants/elements.js  ← per-type labels, colors, defaults
├── stores/                ← authStore, sceneStore (with socket emit throttling)
├── services/              ← api (axios), socket (io singleton)
└── utils/                 ← clipPath, mediaSource, textOutline,
                              elementSize, elementFactory
```

## Real-time model

The single `sceneStore` Pinia module orchestrates REST + Socket.io. Every
element mutation fans out through the same room, with **per-element throttling
(50 ms, leading + trailing edge)** on `update-element` so drag/resize doesn't
saturate the socket. `updateElementsBatch` bypasses throttle for
reorderings, where every element's update must reach the server.

## OBS integration

The controller's LIVE/OFFLINE indicator is driven by `window.obsstudio.getStatus()`
re-queried on OBS DOM events plus a 5s polling fallback. The viewer (Scene.vue)
forwards status to the editor via socket; the server caches the last value
per scene so a controller opened mid-stream isn't stuck on OFFLINE.

## Production

Deployed at **stagehand.darkeng.dev** as a static SPA behind a reverse proxy
that also fronts the API.
