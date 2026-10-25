import React from 'react';

export default function EmptyState({ message }) {
  return <div className="empty-state">{message || 'Keine Dateien oder Ordner gefunden.'}</div>;
}
