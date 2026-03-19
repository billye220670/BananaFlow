# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

All commands run from `imagegraph/`:

```bash
npm run dev      # start dev server at localhost:5173
npm run build    # production build
npm run lint     # ESLint check
npm run preview  # preview production build
```

No test suite is configured.

## Architecture

The app is a node-graph image processing tool built with React Flow. The user drags images onto a canvas, chains operations as nodes, then clicks **Run** to execute the pipeline.

### State — `src/store/graphStore.js`
Single Zustand store. All canvas state (nodes, edges, selection, operation menu) lives here. Key actions:
- `addChildNode(parentId, operation)` — creates a typed node and an edge from the parent. The `operation.id` determines the node type (`download` → `downloadNode`, `banana` → `bananaNode`, else `emptyNode`).
- `runWorkflow()` — topologically sorts nodes (Kahn's algorithm), then calls `executePass()` for each root. `executePass` walks the sorted order and resolves an image URL at each node; `bananaNode` and `downloadNode` have real async logic; other types are pass-through placeholders.
- `updateNodeData(nodeId, data)` — partial-merge update used by nodes to report status.

### Node types — `src/components/nodes/`
Each node type is a React Flow custom node registered in `FlowCanvas.jsx` under `nodeTypes`. Adding a new node type requires:
1. Create `XxxNode.jsx` (model after `DownloadNode.jsx` or `BananaNode.jsx`)
2. Register in `FlowCanvas.jsx` `nodeTypes`
3. Add type condition in `addChildNode` in `graphStore.js`
4. Add execution logic in `executePass` in `graphStore.js`
5. Add entry to `src/constants/operations.js`

Node CSS lives in `nodes.css` (shared). Status classes (`pending`, `done`, `error`) are applied directly to `.node-placeholder`.

### API integration — `src/api/banana.js`
BananaAnything (wuyinkeji.com) async render pipeline:
1. `compressImage(dataURI)` — canvas resize to ≤1024px + JPEG re-encode
2. `uploadImage(dataURI)` → tmpfiles.org → returns a public CDN URL
3. `submitTask(imageUrl, params)` → POST `/api/async/image_nanoBanana_pro` → returns `task_id`
4. `pollUntilDone(taskId)` → GET `/api/async/detail?key=&id=` every 3 s; resolves when `status === 2`, `result[]` contains CDN URLs
5. `render(dataURI, options)` — convenience wrapper combining all steps

API key is `VITE_BANANA_API_KEY` in `imagegraph/.env.local` (gitignored via `*.local`).

### Vite proxy — `vite.config.js`
Two proxies avoid CORS:
- `/banana-api/*` → `https://api.wuyinkeji.com/*`
- `/upload-proxy/*` → `https://tmpfiles.org/*`

Dev server must be restarted when proxy config changes.

### Properties Panel — `src/components/panels/PropertiesPanel.jsx`
Renders on right side when a node is selected. Add per-operation fields by checking `node.data.operation?.id === 'your-id'` and calling `updateNodeData` on change. BananaNode exposes prompt, size, and aspectRatio this way.
