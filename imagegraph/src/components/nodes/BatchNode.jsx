import { Handle, Position } from '@xyflow/react';
import useGraphStore from '../../store/graphStore';
import './nodes.css';

export default function BatchNode({ id, data, selected }) {
  const { openOperationMenu, setSelectedNode } = useGraphStore();
  const images = data.images || [];

  return (
    <div
      className={`image-node batch-node ${selected ? 'selected' : ''}`}
      onClick={() => setSelectedNode(id)}
    >
      <Handle type="target" position={Position.Left} />

      <div className="node-header">
        <span className="node-op-icon">📦</span>
        <span className="node-label">{data.label || 'Batch Import'}</span>
        <span className="batch-count">{images.length}</span>
      </div>

      <div className="node-image-wrap batch-grid-wrap">
        {images.length === 0 ? (
          <div className="node-placeholder">
            <span className="status-icon">📂</span>
            <span>Drop folder or images</span>
          </div>
        ) : (
          <div className="batch-grid">
            {images.slice(0, 6).map((url, i) => (
              <div key={i} className="batch-thumb">
                <img src={url} alt={`img-${i}`} />
                {i === 5 && images.length > 6 && (
                  <div className="batch-more">+{images.length - 6}</div>
                )}
              </div>
            ))}
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
