import React, { useState } from 'react';

export default function TextFileEditor({ file, onSave }) {
  const [value, setValue] = useState(file.content || '');

  const handleChange = (e) => {
    setValue(e.target.value);
  };

  const handleSave = () => {
    if (onSave) onSave(value);
  };

  return (
    <div className="text-file-editor">
      <div className="editor-head">{file.name}</div>
      <textarea
        style={{ width: '100%', minHeight: 180, background: '#181a1f', color: '#ffbf47', border: '1px solid #ffbf47', fontFamily: 'monospace', fontSize: '1.05rem', padding: 8 }}
        value={value}
        onChange={handleChange}
      />
      <button className="gov-btn" onClick={handleSave}>Speichern</button>
    </div>
  );
}
