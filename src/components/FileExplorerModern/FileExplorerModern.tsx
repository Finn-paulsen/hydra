import React, { useState } from 'react';
import { FileList, EmptyState, ViewModes, PathBreadcrumb, CreateFileButton, DetailsPanel } from './index';
import './fileList.css';
import './fileItem.css';
import './detailsPanel.css';
import './createFileButton.css';
import './emptyState.css';
import './viewModes.css';
import './pathBreadcrumb.css';
import TextFileEditor from './TextFileEditor';

// Dummy-Daten für Demo
const initialFiles = [
  { name: 'Dokumente', path: 'Dokumente', isDirectory: true },
  { name: 'Testdatei.txt', path: 'Dokumente/Testdatei.txt', isDirectory: false },
  { name: 'Bilder', path: 'Bilder', isDirectory: true },
  { name: 'bild1.png', path: 'Bilder/bild1.png', isDirectory: false },
];

export default function FileExplorerModern() {
  const [files, setFiles] = useState(initialFiles);
  const [selectedPath, setSelectedPath] = useState(null);
  const [focusedPath, setFocusedPath] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [currentPath, setCurrentPath] = useState('');
  const [detailsItem, setDetailsItem] = useState(null);
  const [editorFile, setEditorFile] = useState(null);

  const handleItemClick = (item) => {
    setSelectedPath(item.path);
    setFocusedPath(item.path);
    setDetailsItem(item);
  };

  const handleItemDoubleClick = (item) => {
    if (item.isDirectory) {
      setCurrentPath(item.path);
      // Filter files für neuen Ordner
      setFiles(files.filter(f => f.path.startsWith(item.path)));
      setSelectedPath(null);
      setFocusedPath(null);
      setDetailsItem(null);
      setEditorFile(null);
    } else {
      setSelectedPath(item.path);
      setDetailsItem(item);
      setEditorFile(item);
    }
  };

  const handleCreate = (type) => {
    // Dummy-Logik für neue Datei/Ordner
    const name = type === 'file' ? 'NeueDatei.txt' : 'NeuerOrdner';
    const newPath = currentPath ? currentPath + '/' + name : name;
    setFiles([...files, { name, path: newPath, isDirectory: type === 'folder' }]);
  };

  const handleSave = (content) => {
    setFiles(files.map(f =>
      f.path === editorFile.path ? { ...f, content } : f
    ));
    setEditorFile(null);
  };

  const handleNavigate = (path) => {
    setCurrentPath(path);
    setFiles(initialFiles.filter(f => f.path.startsWith(path)));
    setSelectedPath(null);
    setFocusedPath(null);
    setDetailsItem(null);
  };

  return (
    <div className="file-explorer-modern" style={{
      maxWidth: 700,
      margin: '32px auto',
      background: '#23272e',
      borderRadius: 18,
      boxShadow: '0 4px 24px #0005',
      padding: 32,
      minHeight: 480,
      border: '2px solid #ffbf47',
      position: 'relative',
    }}>
      <PathBreadcrumb path={currentPath} onNavigate={handleNavigate} />
      <ViewModes currentMode={viewMode} onChange={setViewMode} />
      <CreateFileButton onCreate={handleCreate} />
      {editorFile ? (
        <TextFileEditor file={editorFile} onSave={handleSave} />
      ) : files.length === 0 ? (
        <EmptyState message="Keine Dateien oder Ordner gefunden." />
      ) : (
        <FileList
          files={files}
          onItemClick={handleItemClick}
          onItemDoubleClick={handleItemDoubleClick}
          selectedPath={selectedPath}
          focusedPath={focusedPath}
        />
      )}
      <DetailsPanel item={detailsItem} />
    </div>
  );
}
