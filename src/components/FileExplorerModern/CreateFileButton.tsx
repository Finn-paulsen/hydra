import React, { useState } from 'react';

export default function CreateFileButton({ onCreate }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="create-file-container">
      <button onClick={() => setOpen(!open)}>Neu</button>
      {open && (
        <div className="create-options">
          <button onClick={() => { onCreate('file'); setOpen(false); }}>Datei</button>
          <button onClick={() => { onCreate('folder'); setOpen(false); }}>Ordner</button>
        </div>
      )}
    </div>
  );
}
