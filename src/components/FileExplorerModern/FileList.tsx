import React from 'react';
import FileItem from './FileItem';
import './fileList.css';
import type { FileEntry } from './types';

interface FileListProps { files: FileEntry[]; onItemClick: (item: FileEntry) => void; onItemDoubleClick: (item: FileEntry) => void; selectedPath: string | null; focusedPath: string | null; }

export default function FileList({ files, onItemClick, onItemDoubleClick, selectedPath, focusedPath }: FileListProps) {
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
