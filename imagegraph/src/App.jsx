import { ReactFlowProvider } from '@xyflow/react';
import FlowCanvas from './components/canvas/FlowCanvas';
import PropertiesPanel from './components/panels/PropertiesPanel';
import OperationMenu from './components/panels/OperationMenu';
import useGraphStore from './store/graphStore';
import './App.css';

export default function App() {
  const { theme, toggleTheme, isRunning, runWorkflow } = useGraphStore();

  return (
    <ReactFlowProvider>
      <div className={`app ${theme}`}>
        <header className="app-header">
          <span className="app-logo">⬡</span>
          <span className="app-title">ImageGraph</span>
          <span className="app-hint">Drag an image onto the canvas to start</span>
          <button
            className={`run-btn ${isRunning ? 'running' : ''}`}
            onClick={runWorkflow}
            disabled={isRunning}
          >
            {isRunning ? '⏳ Running…' : '▶ Run'}
          </button>
          <button className="theme-toggle" onClick={toggleTheme} title="Toggle theme">
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </header>
        <main className="app-main">
          <FlowCanvas />
          <PropertiesPanel />
          <OperationMenu />
        </main>
      </div>
    </ReactFlowProvider>
  );
}
