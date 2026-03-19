import { create } from 'zustand';
import { addEdge, applyNodeChanges, applyEdgeChanges } from '@xyflow/react';
import { nanoid } from 'nanoid';

const useGraphStore = create((set, get) => ({
  nodes: [],
  edges: [],
  selectedNodeId: null,
  operationMenuNodeId: null,
  theme: 'dark',
  isRunning: false,
  toggleTheme: () => set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),

  onNodesChange: (changes) =>
    set({ nodes: applyNodeChanges(changes, get().nodes) }),

  onEdgesChange: (changes) =>
    set({ edges: applyEdgeChanges(changes, get().edges) }),

  onConnect: (connection) =>
    set({ edges: addEdge({ ...connection, type: 'smoothstep' }, get().edges) }),

  setSelectedNode: (id) => set({ selectedNodeId: id }),

  openOperationMenu: (nodeId) => set({ operationMenuNodeId: nodeId }),
  closeOperationMenu: () => set({ operationMenuNodeId: null }),

  addImageNode: (imageUrl, position) => {
    const id = nanoid();
    set((state) => ({
      nodes: [...state.nodes, {
        id,
        type: 'imageNode',
        position,
        data: { imageUrl, operation: null, label: 'Source' },
      }],
    }));
    return id;
  },

  addBatchNode: (images, position) => {
    const id = nanoid();
    set((state) => ({
      nodes: [...state.nodes, {
        id,
        type: 'batchNode',
        position,
        data: { images, label: `Batch Import` },
      }],
    }));
    return id;
  },

  addChildNode: (parentId, operation) => {
    const { nodes } = get();
    const parent = nodes.find((n) => n.id === parentId);
    if (!parent) return;

    const siblings = nodes.filter((n) =>
      get().edges.some((e) => e.source === parentId && e.target === n.id)
    );

    const newId = nanoid();
    const newNode = {
      id: newId,
      type: operation.id === 'download' ? 'downloadNode'
          : operation.id === 'banana' ? 'bananaNode'
          : 'emptyNode',
      position: {
        x: parent.position.x + 300,
        y: parent.position.y + siblings.length * 160,
      },
      data: operation.id === 'banana' ? {
        imageUrl: null,
        operation,
        label: operation.label,
        status: 'idle',
        elapsed: 0,
        errorMsg: '',
        prompt: 'realistic render scene',
        size: '1K',
        aspectRatio: 'auto',
      } : { imageUrl: null, operation, label: operation.label },
    };

    const newEdge = {
      id: `e-${parentId}-${newId}`,
      source: parentId,
      target: newId,
      type: 'bezier',
      style: { stroke: '#6366f1', strokeWidth: 2 },
    };

    set((state) => ({
      nodes: [...state.nodes, newNode],
      edges: [...state.edges, newEdge],
      operationMenuNodeId: null,
    }));
  },

  updateNodeData: (nodeId, data) =>
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, ...data } } : n
      ),
    })),

  runWorkflow: async () => {
    if (get().isRunning) return;
    set({ isRunning: true });

    const { nodes, edges, updateNodeData } = get();

    // Build adjacency: parentId -> [childId, ...]
    const childrenMap = {};
    const parentMap = {};
    edges.forEach((e) => {
      if (!childrenMap[e.source]) childrenMap[e.source] = [];
      childrenMap[e.source].push(e.target);
      parentMap[e.target] = e.source;
    });

    // Topological sort (Kahn's algorithm)
    const inDegree = {};
    nodes.forEach((n) => { inDegree[n.id] = 0; });
    edges.forEach((e) => { inDegree[e.target] = (inDegree[e.target] || 0) + 1; });
    const queue = nodes.filter((n) => inDegree[n.id] === 0).map((n) => n.id);
    const topoOrder = [];
    const visited = new Set(queue);
    while (queue.length) {
      const id = queue.shift();
      topoOrder.push(id);
      (childrenMap[id] || []).forEach((cid) => {
        if (!visited.has(cid)) { visited.add(cid); queue.push(cid); }
      });
    }

    // Execute a single chain pass with one image URL
    // Returns the resolved imageUrl at each node (by nodeId)
    const executePass = async (imageUrl, batchIndex, batchTotal) => {
      // Map nodeId -> resolved imageUrl for this pass
      const resolved = {};

      for (const nodeId of topoOrder) {
        const node = nodes.find((n) => n.id === nodeId);
        if (!node) continue;

        if (node.type === 'batchNode') {
          // batchNode is the source — resolved value is the current imageUrl passed in
          resolved[nodeId] = imageUrl;
          continue;
        }

        if (node.type === 'imageNode') {
          resolved[nodeId] = node.data.imageUrl;
          continue;
        }

        // For all other nodes, inherit from parent
        const parentId = parentMap[nodeId];
        const parentImage = parentId ? resolved[parentId] : null;
        resolved[nodeId] = parentImage;

        if (node.type === 'downloadNode') {
          const label = batchTotal > 1
            ? `${batchIndex + 1}/${batchTotal}`
            : '';
          updateNodeData(nodeId, { status: 'running', batchLabel: label });
          await new Promise((r) => setTimeout(r, 300));

          if (parentImage) {
            const a = document.createElement('a');
            a.href = parentImage;
            const ext = parentImage.startsWith('data:image/png') ? 'png' : 'jpg';
            a.download = `imagegraph-${nodeId.slice(0, 6)}-${batchIndex}.${ext}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            updateNodeData(nodeId, {
              status: batchIndex === batchTotal - 1 ? 'done' : 'running',
              batchLabel: label,
            });
          } else {
            updateNodeData(nodeId, { status: 'error', batchLabel: '' });
          }
        }
        // Other operation nodes: just pass through for now (no-op placeholder)
        if (node.type === 'bananaNode') {
          if (!parentImage) {
            updateNodeData(nodeId, { status: 'error', errorMsg: 'No input image' });
            continue;
          }
          updateNodeData(nodeId, { status: 'running', elapsed: 0 });
          try {
            const { compressImage, render } = await import('../api/banana.js');
            const compressed = await compressImage(parentImage);
            const startTime = Date.now();
            const { resultUrls } = await render(compressed, {
              prompt: node.data.prompt,
              size: node.data.size,
              aspectRatio: node.data.aspectRatio,
              onProgress: () => {
                const elapsed = Math.round((Date.now() - startTime) / 1000);
                updateNodeData(nodeId, { elapsed });
              },
            });
            const resultUrl = resultUrls[0];
            resolved[nodeId] = resultUrl;
            updateNodeData(nodeId, { status: 'done', imageUrl: resultUrl });
          } catch (err) {
            updateNodeData(nodeId, { status: 'error', errorMsg: err.message });
            resolved[nodeId] = null;
          }
          continue;
        }
      }
    };

    // Find root nodes (no incoming edges)
    const roots = nodes.filter((n) => !parentMap[n.id]);

    for (const root of roots) {
      if (root.type === 'batchNode') {
        const images = root.data.images || [];
        for (let i = 0; i < images.length; i++) {
          await executePass(images[i], i, images.length);
          // Small gap between items so browser doesn't block multiple downloads
          if (i < images.length - 1) await new Promise((r) => setTimeout(r, 200));
        }
      } else if (root.type === 'imageNode') {
        await executePass(root.data.imageUrl, 0, 1);
      }
    }

    set({ isRunning: false });
  },
}));

export default useGraphStore;
