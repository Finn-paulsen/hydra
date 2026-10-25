import React, { useState } from 'react';
import type { CreateItemType } from './types';

export default function CreateFileButton({ onCreate }: { onCreate: (type: CreateItemType) => void }) {
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
