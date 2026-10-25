// Echter Editor für Dateiinhalt mit Speichern
import React, { useState } from 'react';

export default function FileEditor({ name, content, onSave, onBack }) {
  const [value, setValue] = useState(content || '');

  function handleChange(e) {
    setValue(e.target.value);
  }

  function handleSave() {
    if (onSave) onSave(value);
  }

  return (
    <div className="file-editor">
      <div className="file-editor-head">{name || 'Neue Datei'}</div>
      <textarea
        style={{ width: '100%', minHeight: 220, background: '#181818', color: '#ffbf47', border: '1px solid #ffbf47', fontFamily: 'monospace', fontSize: '1.05rem', padding: 8 }}
        value={value}
        onChange={handleChange}
      />
      <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
        <button className="btn btn-primary" onClick={handleSave}>
          Speichern
        </button>
        <button className="btn btn-secondary" onClick={onBack}>
          Zurück
        </button>
      </div>
    </div>
  );
}
