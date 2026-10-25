import React from 'react';
import type { ViewMode } from './types';

export default function ViewModes({ currentMode, onChange }: { currentMode: ViewMode; onChange: (mode: ViewMode) => void }) {
  return (
    <div className="view-modes">
      <button onClick={() => onChange('grid')} className={currentMode === 'grid' ? 'active' : ''}>Grid</button>
      <button onClick={() => onChange('list')} className={currentMode === 'list' ? 'active' : ''}>Liste</button>
      <button onClick={() => onChange('details')} className={currentMode === 'details' ? 'active' : ''}>Details</button>
    </div>
  );
}
