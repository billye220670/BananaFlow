import { OPERATIONS } from '../../constants/operations';
import useGraphStore from '../../store/graphStore';
import './OperationMenu.css';

export default function OperationMenu() {
  const { operationMenuNodeId, addChildNode, closeOperationMenu } = useGraphStore();

  if (!operationMenuNodeId) return null;

  return (
    <>
      <div className="op-overlay" onClick={closeOperationMenu} />
      <div className="op-menu">
        <div className="op-menu-header">Choose Operation</div>
        <div className="op-list">
          {OPERATIONS.map((op) => (
            <button
              key={op.id}
              className="op-item"
              onClick={() => addChildNode(operationMenuNodeId, op)}
            >
              <span className="op-icon">{op.icon}</span>
              <div className="op-info">
                <span className="op-name">{op.label}</span>
                <span className="op-desc">{op.description}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
