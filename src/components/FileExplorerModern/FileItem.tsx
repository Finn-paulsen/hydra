import React from 'react';
import FileIcon from './FileIcon';
import './fileItem.css';

export default function FileItem({ item, isSelected, isFocused, onClick, onDoubleClick }) {
  return (
    <div
      className={`file-item${isSelected ? ' selected' : ''}${isFocused ? ' focused' : ''}`}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      tabIndex={0}
    >
      <FileIcon filename={item.name} isDirectory={item.isDirectory} />
      <span className="file-name">{item.name}</span>
    </div>
  );
}
