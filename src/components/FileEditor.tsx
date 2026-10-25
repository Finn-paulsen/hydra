// Echter Editor für Dateiinhalt mit Speichern
import React, { useState } from 'react';

interface FileEditorProps {
  name?: string;
  content?: string | null;
  onSave?: (value: string) => void;
  onBack?: () => void;
}

export default function FileEditor({ name, content, onSave, onBack }: FileEditorProps) {
  const [value, setValue] = useState(content || '');

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
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
