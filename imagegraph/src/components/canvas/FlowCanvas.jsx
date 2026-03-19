import React, { useCallback, useState } from 'react';
import { ReactFlow, Background, Controls, MiniMap, useReactFlow } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import useGraphStore from '../../store/graphStore';
import ImageNode from '../nodes/ImageNode';
import EmptyNode from '../nodes/EmptyNode';
import DownloadNode from '../nodes/DownloadNode';
import BatchNode from '../nodes/BatchNode';
import BananaNode from '../nodes/BananaNode';
import './FlowCanvas.css';

const nodeTypes = {
  imageNode: ImageNode,
  emptyNode: EmptyNode,
  downloadNode: DownloadNode,
  batchNode: BatchNode,
  bananaNode: BananaNode,
};

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif', 'image/bmp', 'image/tiff'];

const readAsDataURL = (file) =>
  new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.readAsDataURL(file);
  });

// Recursively collect image Files from a FileSystemEntry
const collectFromEntry = (entry) =>
  new Promise((resolve) => {
    if (entry.isFile) {
      entry.file((f) => {
        resolve(IMAGE_TYPES.includes(f.type) ? [f] : []);
      });
    } else if (entry.isDirectory) {
      const reader = entry.createReader();
      const all = [];
      const readBatch = () => {
        reader.readEntries(async (entries) => {
          if (!entries.length) { resolve(all.flat()); return; }
          const nested = await Promise.all(entries.map(collectFromEntry));
          all.push(...nested);
          readBatch();
        });
      };
      readBatch();
    } else {
      resolve([]);
    }
  });

function CanvasInner() {
  const {
    nodes, edges, theme,
    onNodesChange, onEdgesChange, onConnect,
    addImageNode, addBatchNode, setSelectedNode,
  } = useGraphStore();

  const { screenToFlowPosition } = useReactFlow();
  const isLight = theme === 'light';
  const [isDragActive, setIsDragActive] = useState(false);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    // Only clear if leaving the canvas entirely
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(async (e) => {
    e.preventDefault();
    setIsDragActive(false);
    const pos = screenToFlowPosition({ x: e.clientX, y: e.clientY });
    const items = Array.from(e.dataTransfer.items || []);

    const hasDirectory = items.some((item) => item.webkitGetAsEntry?.()?.isDirectory);

    if (hasDirectory) {
      const entries = items.map((item) => item.webkitGetAsEntry()).filter(Boolean);
      const fileLists = await Promise.all(entries.map(collectFromEntry));
      const allFiles = fileLists.flat();
      if (!allFiles.length) return;
      const urls = await Promise.all(allFiles.map(readAsDataURL));
      addBatchNode(urls, pos);
      return;
    }

    const files = Array.from(e.dataTransfer.files).filter((f) => IMAGE_TYPES.includes(f.type));
    if (!files.length) return;

    if (files.length === 1) {
      const url = await readAsDataURL(files[0]);
      addImageNode(url, pos);
    } else {
      const urls = await Promise.all(files.map(readAsDataURL));
      addBatchNode(urls, pos);
    }
  }, [screenToFlowPosition, addImageNode, addBatchNode]);

  return (
    <div
      className={`canvas-wrap ${isDragActive ? 'drag-over' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isDragActive && <div className="drop-hint">Drop images or folder</div>}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        onPaneClick={() => setSelectedNode(null)}
        fitView
        defaultEdgeOptions={{
          type: 'bezier',
          style: { stroke: '#6366f1', strokeWidth: 2 },
        }}
      >
        <Background color={isLight ? '#d1d5db' : '#313244'} gap={24} size={1} />
        <Controls />
        <MiniMap
          nodeColor={isLight ? '#d1d5db' : '#313244'}
          maskColor={isLight ? 'rgba(245,245,247,0.7)' : 'rgba(17,17,27,0.7)'}
          style={{
            background: isLight ? '#ebebef' : '#181825',
            border: `1px solid ${isLight ? '#d1d5db' : '#313244'}`,
          }}
        />
      </ReactFlow>
    </div>
  );
}

export default function FlowCanvas() {
  return <CanvasInner />;
}
