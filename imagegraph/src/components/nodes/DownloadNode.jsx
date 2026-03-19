import { Handle, Position } from '@xyflow/react';
import useGraphStore from '../../store/graphStore';
import './nodes.css';

export default function DownloadNode({ id, data, selected }) {
  const { openOperationMenu, setSelectedNode } = useGraphStore();
  const status = data.status; // idle | running | done | error
  const batchLabel = data.batchLabel;

  return (
    <div
      className={`image-node download-node ${selected ? 'selected' : ''} ${status || ''}`}
      onClick={() => setSelectedNode(id)}
    >
      <Handle type="target" position={Position.Left} />

      <div className="node-header">
        <span className="node-op-icon">⬇️</span>
        <span className="node-label">{data.label || 'Download'}</span>
        {batchLabel && <span className="batch-count">{batchLabel}</span>}
      </div>

      <div className="node-image-wrap">
        <div className={`node-placeholder ${status === 'done' ? 'done' : status === 'running' ? 'pending' : status === 'error' ? 'error' : ''}`}>
          {status === 'done' ? (
            <><span className="status-icon">✅</span><span>Downloaded!</span></>
          ) : status === 'running' ? (
            <><div className="spinner" /><span>Downloading… {batchLabel}</span></>
          ) : status === 'error' ? (
            <><span className="status-icon">❌</span><span>No image source</span></>
          ) : (
            <><span className="status-icon">⬇️</span><span>Ready to download</span></>
          )}
        </div>
      </div>

      <Handle type="source" position={Position.Right} id="out" />

      <button
        className="add-btn"
        onClick={(e) => { e.stopPropagation(); openOperationMenu(id); }}
        title="Add operation"
      >
        +
      </button>
    </div>
  );
}
