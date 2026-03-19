import { useState } from 'react';
import './SettingsPanel.css';

export default function SettingsPanel({ onClose }) {
  const [key, setKey] = useState(() => localStorage.getItem('banana_api_key') || '');
  const [show, setShow] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    localStorage.setItem('banana_api_key', key.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <span>Settings</span>
          <button className="props-close" onClick={onClose}>✕</button>
        </div>

        <div className="settings-body">
          <div className="props-section">
            <label className="props-label">BananaAnything API Key</label>
            <div className="key-input-wrap">
              <input
                className="props-input key-input"
                type={show ? 'text' : 'password'}
                value={key}
                onChange={(e) => { setKey(e.target.value); setSaved(false); }}
                placeholder="Paste your API key here"
                spellCheck={false}
              />
              <button className="key-toggle" onClick={() => setShow((s) => !s)} title={show ? 'Hide' : 'Show'}>
                {show ? '🙈' : '👁️'}
              </button>
            </div>
            <span className="settings-hint">Stored in browser localStorage, never sent anywhere except the API.</span>
          </div>

          <button className={`settings-save ${saved ? 'saved' : ''}`} onClick={handleSave}>
            {saved ? '✓ Saved' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
