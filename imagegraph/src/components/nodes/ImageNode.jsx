import { Handle, Position } from '@xyflow/react';
import useGraphStore from '../../store/graphStore';
import './nodes.css';

export default function ImageNode({ id, data, selected }) {
  const { openOperationMenu, setSelectedNode } = useGraphStore();

  return (
    <div
      className={`image-node ${selected ? 'selected' : ''}`}
      onClick={() => setSelectedNode(id)}
    >
      <Handle type="target" position={Position.Left} />

      <div className="node-header">
        <span className="node-label">{data.label || 'Image'}</span>
      </div>

      <div className="node-image-wrap">
        {data.imageUrl ? (
          <img src={data.imageUrl} alt="node" className="node-img" />
        ) : (
          <div className="node-placeholder">Drop image here</div>
        )}
      </div>

      <Handle type="source" position={Position.Right} id="out" />

      <button
        className="add-btn"
        onClick={(e) => {
          e.stopPropagation();
          openOperationMenu(id);
        }}
        title="Add operation"
      >
        +
      </button>
    </div>
  );
}
