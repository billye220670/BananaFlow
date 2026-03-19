import useGraphStore from '../../store/graphStore';
import './PropertiesPanel.css';

export default function PropertiesPanel() {
  const { nodes, selectedNodeId, updateNodeData, setSelectedNode } = useGraphStore();
  const node = nodes.find((n) => n.id === selectedNodeId);

  if (!node) return null;

  return (
    <div className="props-panel">
      <div className="props-header">
        <span>Properties</span>
        <button className="props-close" onClick={() => setSelectedNode(null)}>✕</button>
      </div>

      <div className="props-body">
        <div className="props-section">
          <label className="props-label">Node ID</label>
          <div className="props-value mono">{node.id.slice(0, 8)}…</div>
        </div>

        <div className="props-section">
          <label className="props-label">Type</label>
          <div className="props-value">{node.type === 'imageNode' ? 'Source Image' : 'Operation'}</div>
        </div>

        {node.data.operation && (
          <div className="props-section">
            <label className="props-label">Operation</label>
            <div className="props-value">
              {node.data.operation.icon} {node.data.operation.label}
            </div>
          </div>
        )}

        <div className="props-section">
          <label className="props-label">Label</label>
          <input
            className="props-input"
            value={node.data.label || ''}
            onChange={(e) => updateNodeData(node.id, { label: e.target.value })}
          />
        </div>

        {node.data.imageUrl && (
          <div className="props-section">
            <label className="props-label">Preview</label>
            <img src={node.data.imageUrl} alt="preview" className="props-preview" />
          </div>
        )}

        {node.data.operation?.id === 'banana' && (
          <>
            <div className="props-section">
              <label className="props-label">Prompt</label>
              <textarea
                className="props-input"
                rows={3}
                value={node.data.prompt || ''}
                onChange={(e) => updateNodeData(node.id, { prompt: e.target.value })}
              />
            </div>
            <div className="props-section">
              <label className="props-label">Size</label>
              <select
                className="props-input"
                value={node.data.size || '1K'}
                onChange={(e) => updateNodeData(node.id, { size: e.target.value })}
              >
                <option value="1K">1K</option>
                <option value="2K">2K</option>
                <option value="4K">4K</option>
              </select>
            </div>
            <div className="props-section">
              <label className="props-label">Aspect Ratio</label>
              <select
                className="props-input"
                value={node.data.aspectRatio || 'auto'}
                onChange={(e) => updateNodeData(node.id, { aspectRatio: e.target.value })}
              >
                {['auto','1:1','16:9','4:3','3:2','9:16','2:3','5:4','4:5','21:9'].map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            {node.data.status === 'done' && node.data.imageUrl && (
              <div className="props-section">
                <label className="props-label">Result Preview</label>
                <img src={node.data.imageUrl} alt="result" className="props-preview" />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
