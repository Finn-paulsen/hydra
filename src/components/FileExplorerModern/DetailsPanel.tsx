import React from 'react';

export default function DetailsPanel({ item }) {
  if (!item) return null;
  return (
    <div className="details-panel">
      <div className="details-title">{item.name}</div>
      <div className="details-content">Typ: {item.isDirectory ? 'Ordner' : 'Datei'}</div>
    </div>
  );
}
