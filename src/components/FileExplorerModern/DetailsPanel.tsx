import React from 'react';
import type { FileEntry } from './types';

export default function DetailsPanel({ item }: { item: FileEntry | null }) {
  if (!item) return null;
  return (
    <div className="details-panel">
      <div className="details-title">{item.name}</div>
      <div className="details-content">Typ: {item.isDirectory ? 'Ordner' : 'Datei'}</div>
    </div>
  );
}
