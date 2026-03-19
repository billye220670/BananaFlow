import { Handle, Position } from '@xyflow/react';
import useGraphStore from '../../store/graphStore';
import './nodes.css';

export default function EmptyNode({ id, data, selected }) {
  const { openOperationMenu, setSelectedNode } = useGraphStore();

  return (
    <div
      className={`image-node empty-node ${selected ? 'selected' : ''}`}
      onClick={() => setSelectedNode(id)}
    >
      <Handle type="target" position={Position.Left} />

      <div className="node-header">
        <span className="node-op-icon">{data.operation?.icon}</span>
        <span className="node-label">{data.label || 'Output'}</span>
      </div>

      <div className="node-image-wrap">
        <div className="node-placeholder pending">
          <div className="spinner" />
          <span>Waiting...</span>
        </div>
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
