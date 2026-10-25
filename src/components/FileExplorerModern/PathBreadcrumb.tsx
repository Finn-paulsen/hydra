import React from 'react';

export default function PathBreadcrumb({ path, onNavigate }) {
  const parts = path.split('/').filter(Boolean);
  return (
    <div className="path-breadcrumb">
      {parts.map((part, idx) => (
        <span key={idx} onClick={() => onNavigate(parts.slice(0, idx + 1).join('/'))}>{part}</span>
      ))}
    </div>
  );
}
