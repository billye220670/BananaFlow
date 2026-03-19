import { Handle, Position } from '@xyflow/react';
import useGraphStore from '../../store/graphStore';
import './nodes.css';

export default function BananaNode({ id, data, selected }) {
  const { openOperationMenu, setSelectedNode } = useGraphStore();
  const { status, elapsed, errorMsg, imageUrl } = data;

  return (
    <div
      className={`image-node ${selected ? 'selected' : ''} ${status || ''}`}
      onClick={() => setSelectedNode(id)}
    >
      <Handle type="target" position={Position.Left} />

      <div className="node-header">
        <span className="node-op-icon">🍌</span>
        <span className="node-label">{data.label || 'Banana Wash'}</span>
      </div>

      <div className="node-image-wrap">
        {status === 'done' && imageUrl ? (
          <img src={imageUrl} alt="result" className="node-img" />
        ) : (
          <div className={`node-placeholder ${status === 'running' ? 'pending' : status === 'error' ? 'error' : ''}`}>
            {status === 'running' ? (
              <><div className="spinner" /><span>Processing… {elapsed}s</span></>
            ) : status === 'error' ? (
              <><span className="status-icon">❌</span><span>{errorMsg || 'Error'}</span></>
            ) : (
              <><span className="status-icon">🍌</span><span>Ready</span></>
            )}
          </div>
        )}
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
