import React from 'react';

// Dummy-Icon-Logik, kann mit eigenen SVGs erweitert werden
export default function FileIcon({ filename, isDirectory, size = 'medium' }) {
  const iconType = isDirectory ? 'folder' : 'file';
  return (
    <span className={`file-icon file-icon-${iconType} file-icon-${size}`}>{iconType === 'folder' ? '📁' : '📄'}</span>
  );
}
