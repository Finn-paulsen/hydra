import React from 'react';
import FileItem from './FileItem';
import './fileList.css';

export default function FileList({ files, onItemClick, onItemDoubleClick, selectedPath, focusedPath }) {
  return (
    <div className="file-list">
      {files.map((item) => (
        <FileItem
          key={item.path}
          item={item}
          isSelected={selectedPath === item.path}
          isFocused={focusedPath === item.path}
          onClick={() => onItemClick(item)}
          onDoubleClick={() => onItemDoubleClick(item)}
        />
      ))}
    </div>
  );
}
