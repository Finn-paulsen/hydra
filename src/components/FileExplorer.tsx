import React, { useState, useEffect } from "react";
import GovContextMenu from "./GovContextMenu";
import "./govContextMenu.css";
import "./govExplorer.css";

interface FsNode {
  id: string;
  name: string;
  isFolder: boolean;
  items: FsNode[];
  content?: string;
}

interface ContextMenuState {
  x: number;
  y: number;
  target: FsNode;
}

interface FolderProps {
  explorer: FsNode;
  onAdd: (folderId: string, name: string, isFolder: boolean) => void;
  onOpenFile?: (file: FsNode) => void;
  onContextMenu?: (e: React.MouseEvent, target: FsNode) => void;
  renderLabel?: (item: FsNode, defaultLabel: React.ReactNode) => React.ReactNode;
  selectedIds?: string[];
  handleSelect?: (fileId: string, folder: FsNode) => (e: React.MouseEvent) => void;
  handleKeyDownSelect?: (folder: FsNode) => (e: React.KeyboardEvent) => void;
}

// Beispiel-Datenstruktur (kann später dynamisch geladen werden)
const initialData: FsNode = {
  id: "root",
  name: "GOV-ARCHIVE",
  isFolder: true,
  items: [
    {
      id: "1",
      name: "public",
      isFolder: true,
      items: [
        { id: "2", name: "index.html", isFolder: false, items: [] },
        { id: "3", name: "hello.txt", isFolder: false, items: [] }
      ]
    },
    {
      id: "4",
      name: "src",
      isFolder: true,
      items: [
        { id: "5", name: "main.jsx", isFolder: false, items: [] }
      ]
    }
  ]
};

function Folder({ explorer, onAdd, onOpenFile, onContextMenu, renderLabel, selectedIds = [], handleSelect, handleKeyDownSelect }: FolderProps) {
  const [expanded, setExpanded] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [isFolder, setIsFolder] = useState(true);

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowInput(true);
    setIsFolder(true);
  };
  const handleAddFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowInput(true);
    setIsFolder(false);
  };
  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && inputValue) {
      onAdd(explorer.id, inputValue, isFolder);
      setShowInput(false);
      setInputValue("");
    }
    if (e.key === "Escape") {
      setShowInput(false);
      setInputValue("");
    }
  };

  // Doppelklick auf Ordner: öffnen/schließen
  const handleFolderDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded((prev) => !prev);
  };

  // Doppelklick auf Datei: Editor öffnen, wenn .txt oder .html
  const handleFileDoubleClick = (item: FsNode) => {
    if (!item.isFolder && /\.(txt|html?)$/i.test(item.name)) {
      onOpenFile && onOpenFile(item);
    }
  };

  return (
    <>
      <div className="gov-folder">
        <div
          className="gov-folder-label"
          onDoubleClick={handleFolderDoubleClick}
          onContextMenu={onContextMenu ? (e) => { e.stopPropagation(); onContextMenu(e, explorer); } : undefined}
        >
          {renderLabel ? renderLabel(explorer, <span>{expanded ? "📂" : "📁"} {explorer.name}</span>) : <span>{expanded ? "📂" : "📁"} {explorer.name}</span>}
        </div>
        {showInput && (
          <div className="gov-input-row">
            <label htmlFor="file-search">Suche:
              <input id="file-search" />
            </label>
            <input
              className="gov-input"
              name="newItem"
              autoFocus
              value={inputValue}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder={isFolder ? "Neuer Ordner" : "Neue Datei"}
            />
          </div>
        )}
        {expanded && (
          <div className="gov-folder-children">
            {explorer.items.map((item) =>
              item.isFolder ? (
                <Folder key={item.id} explorer={item} onAdd={onAdd} onOpenFile={onOpenFile} onContextMenu={onContextMenu} renderLabel={renderLabel} selectedIds={selectedIds} handleSelect={handleSelect} handleKeyDownSelect={handleKeyDownSelect} />
              ) : (
                <div
                  className={`gov-file${selectedIds.includes(item.id) ? ' gov-file-selected' : ''}`}
                  key={item.id}
                  tabIndex={0}
                  onDoubleClick={() => handleFileDoubleClick(item)}
                  title={/\.(txt|html?)$/i.test(item.name) ? 'Bearbeiten' : ''}
                  style={{ cursor: /\.(txt|html?)$/i.test(item.name) ? 'pointer' : 'default' }}
                  onContextMenu={onContextMenu ? (e) => { e.stopPropagation(); onContextMenu(e, item); } : undefined}
                  onClick={handleSelect ? handleSelect(item.id, explorer) : undefined}
                  onKeyDown={handleKeyDownSelect ? handleKeyDownSelect(explorer) : undefined}
                >
                  {renderLabel ? renderLabel(item, <><span className="gov-file-icon">📄</span>{item.name}</>) : <><span className="gov-file-icon">📄</span>{item.name}</>}
                </div>
              )
            )}
          </div>
        )}
      </div>
    </>
  );
}

function insertNode(tree: FsNode, folderId: string, name: string, isFolder: boolean): FsNode {
  if (tree.id === folderId && tree.isFolder) {
    return {
      ...tree,
      items: [
        ...tree.items,
        {
          id: Date.now().toString(),
          name,
          isFolder,
          items: []
        }
      ]
    };
  }
  return {
    ...tree,
    items: tree.items.map((item) =>
      item.isFolder ? insertNode(item, folderId, name, isFolder) : item
    )
  };
}

import FileEditor from './FileEditor';

export default function FileExplorer() {
  // Initialisierung: versuche aus localStorage zu laden
  const [explorerData, setExplorerData] = useState<FsNode>(() => {
    const saved = localStorage.getItem('gov-archive-explorer');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return initialData;
      }
    }
    return initialData;
  });
  // Bei jeder Änderung explorerData in localStorage speichern
  useEffect(() => {
    localStorage.setItem('gov-archive-explorer', JSON.stringify(explorerData));
  }, [explorerData]);
  const [editorFile, setEditorFile] = useState<FsNode | null>(null);
  const [editorContent, setEditorContent] = useState("");

  const handleAdd = (folderId: string, name: string, isFolder: boolean) => {
    setExplorerData((prev) => insertNode(prev, folderId, name, isFolder));
  };

  const handleOpenFile = (file: FsNode) => {
    setEditorFile(file);
    setEditorContent(file.content || "");
  };

  const handleSaveFile = (newContent: string) => {
    function updateContent(node: FsNode): FsNode {
      if (node.id === editorFile?.id) {
        return { ...node, content: newContent };
      }
      if (node.isFolder && node.items) {
        return { ...node, items: node.items.map(updateContent) };
      }
      return node;
    }
    setExplorerData((prev) => updateContent(prev));
    setEditorContent(newContent);
  };

  const handleBack = () => {
    setEditorFile(null);
    setEditorContent("");
  };

  // Kontextmenü-Logik
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  const handleContextMenu = (e: React.MouseEvent, target: FsNode) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      target,
    });
  };

  const closeContextMenu = () => setContextMenu(null);

  // Umbenennen-Status
  const [renameTarget, setRenameTarget] = useState<FsNode | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const startRename = (target: FsNode) => {
    setRenameTarget(target);
    setRenameValue(target.name);
    closeContextMenu();
  };

  const handleRenameChange = (e: React.ChangeEvent<HTMLInputElement>) => setRenameValue(e.target.value);

  const handleRenameSubmit = () => {
    if (!renameTarget || !renameValue.trim()) {
      setRenameTarget(null);
      setRenameValue("");
      return;
    }
    // Rekursiv im Explorer-Baum umbenennen
    const updateName = (node: FsNode): FsNode => {
      if (node.id === renameTarget.id) {
        return { ...node, name: renameValue };
      }
      if (node.items) {
        return { ...node, items: node.items.map(updateName) };
      }
      return node;
    };
    setExplorerData((prev) => updateName(prev));
    setRenameTarget(null);
    setRenameValue("");
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleRenameSubmit();
    if (e.key === "Escape") {
      setRenameTarget(null);
      setRenameValue("");
    }
  };

  // Hilfsfunktion: Knoten rekursiv entfernen
  function removeNode(tree: FsNode, id: string): FsNode {
    if (!tree.items) return tree;
    return {
      ...tree,
      items: tree.items
        .filter((item) => item.id !== id)
        .map((item) => item.isFolder ? removeNode(item, id) : item)
    };
  }

  // Kopieren/Einfügen-Logik für Mehrfachauswahl
  // clipboard: Array von Knoten (Dateien/Ordner)
  const [clipboard, setClipboard] = useState<FsNode[]>([]);
  // Neu-Funktion: Status für Zielordner, Typ und Input
  const [newTarget, setNewTarget] = useState<FsNode | null>(null);
  const [newType, setNewType] = useState<'file' | 'folder' | null>(null);
  const [newInputValue, setNewInputValue] = useState("");

  // Hilfsfunktion: Knoten im Baum suchen
  function findNode(tree: FsNode, id: string): FsNode | null {
    if (tree.id === id) return tree;
    if (!tree.items) return null;
    for (const item of tree.items) {
      const found = item.isFolder ? findNode(item, id) : (item.id === id ? item : null);
      if (found) return found;
    }
    return null;
  }

  // Hilfsfunktion: Tiefe Kopie mit neuem ID
  function deepCopyWithNewIds(node: FsNode): FsNode {
    const newId = Date.now().toString() + Math.random().toString(36).slice(2, 7);
    if (node.isFolder) {
      return {
        ...node,
        id: newId,
        name: node.name + '_copy',
        items: node.items ? node.items.map(deepCopyWithNewIds) : []
      };
    } else {
      return { ...node, id: newId, name: node.name + '_copy' };
    }
  }

  // Hilfsfunktion: Einfügen in Ordner
  function insertNodeCopy(tree: FsNode, folderId: string, nodeCopy: FsNode): FsNode {
    if (tree.id === folderId && tree.isFolder) {
      return {
        ...tree,
        items: [...tree.items, nodeCopy]
      };
    }
    return {
      ...tree,
      items: tree.items.map((item) =>
        item.isFolder ? insertNodeCopy(item, folderId, nodeCopy) : item
      )
    };
  }

  const contextOptions = contextMenu && contextMenu.target ? [
    {
      label: 'Umbenennen',
      onClick: () => startRename(contextMenu.target),
      disabled: false,
    },
    {
      label: 'Löschen',
      onClick: () => {
        setExplorerData((prev) => removeNode(prev, contextMenu.target.id));
        closeContextMenu();
      },
      disabled: false,
    },
    {
      label: 'Kopieren',
      onClick: () => {
        // Wenn Mehrfachauswahl, alle ausgewählten Knoten kopieren, sonst nur das Target
        let nodesToCopy: FsNode[] = [];
        if (selectedIds.length > 1) {
          // Alle ausgewählten Knoten suchen (nur Dateien/Folders auf dieser Ebene)
          function collectNodesByIds(tree: FsNode, ids: string[], acc: FsNode[] = []): FsNode[] {
            if (ids.includes(tree.id)) acc.push(tree);
            if (tree.items) tree.items.forEach(item => collectNodesByIds(item, ids, acc));
            return acc;
          }
          nodesToCopy = collectNodesByIds(explorerData, selectedIds, []);
        } else {
          const node = findNode(explorerData, contextMenu.target.id);
          if (node) nodesToCopy = [node];
        }
        setClipboard(nodesToCopy);
        closeContextMenu();
      },
      disabled: false,
    },
    {
      label: 'Einfügen',
      onClick: () => {
        if (clipboard.length && contextMenu.target.isFolder) {
          let updated = explorerData;
          clipboard.forEach(node => {
            const nodeCopy = deepCopyWithNewIds(node);
            updated = insertNodeCopy(updated, contextMenu.target.id, nodeCopy);
          });
          setExplorerData(updated);
        }
        closeContextMenu();
      },
      disabled: !(clipboard.length && contextMenu.target && contextMenu.target.isFolder),
    },
    {
      label: 'Neu',
      onClick: () => {
        // Auswahl: Datei oder Ordner
        setNewTarget(contextMenu.target);
        closeContextMenu();
      },
      disabled: !(contextMenu.target && contextMenu.target.isFolder),
    },
  ] : [];

  // Label-Renderer für Umbenennen- und Neu-Input überall
  const renderLabel = (item: FsNode, defaultLabel: React.ReactNode): React.ReactNode => {
    // Umbenennen
    if (renameTarget && renameTarget.id === item.id) {
      return (
        <label htmlFor="file-new">Neue Datei:
          <input
            id="file-new"
            className="gov-input gov-rename-input"
            name="renameItem"
            autoFocus
            value={renameValue}
            onChange={handleRenameChange}
            onBlur={handleRenameSubmit}
            onKeyDown={handleRenameKeyDown}
            style={{ width: Math.max(80, renameValue.length * 8) }}
          />
        </label>
      );
    }
    // Neu
    if (newTarget && newTarget.id === item.id && item.isFolder) {
      if (newType) {
        return (
          <label htmlFor="file-rename">Umbenennen:
            <input
              id="file-rename"
              className="gov-input gov-rename-input"
              name="newType"
              autoFocus
              placeholder={newType === 'folder' ? 'Neuer Ordner' : 'Neue Datei.txt'}
              value={newInputValue}
              onChange={e => setNewInputValue(e.target.value)}
              onBlur={() => {
                if (newInputValue.trim()) {
                  handleAdd(item.id, newInputValue, newType === 'folder');
                }
                setNewInputValue("");
                setNewTarget(null);
                setNewType(null);
              }}
              onKeyDown={e => {
                if (e.key === 'Enter' && newInputValue.trim()) {
                  handleAdd(item.id, newInputValue, newType === 'folder');
                  setNewInputValue("");
                  setNewTarget(null);
                  setNewType(null);
                }
                if (e.key === 'Escape') {
                  setNewInputValue("");
                  setNewTarget(null);
                  setNewType(null);
                }
              }}
              style={{ width: Math.max(80, newInputValue.length * 8) }}
            />
          </label>
        );
      }
      // Auswahl Buttons
      return (
        <span>
          <button className="gov-btn" onClick={e => { e.stopPropagation(); setNewType('file'); setNewInputValue(""); }}>+ Datei</button>
          <button className="gov-btn" onClick={e => { e.stopPropagation(); setNewType('folder'); setNewInputValue(""); }}>+ Ordner</button>
        </span>
      );
    }
    return defaultLabel;
  };

  // Mehrfachauswahl-Logik
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [lastSelectedId, setLastSelectedId] = useState<string | null>(null);

  function getFlatFileList(folder: FsNode) {
    return folder.items.filter(item => !item.isFolder);
  }

  // Handler für Auswahl mit Shift+Pfeiltasten und Klick
  const handleSelect = (fileId: string, folder: FsNode) => (e: React.MouseEvent) => {
    if (e.shiftKey && lastSelectedId) {
      const files = getFlatFileList(folder);
      const idx1 = files.findIndex(f => f.id === lastSelectedId);
      const idx2 = files.findIndex(f => f.id === fileId);
      if (idx1 !== -1 && idx2 !== -1) {
        const [start, end] = [Math.min(idx1, idx2), Math.max(idx1, idx2)];
        const rangeIds = files.slice(start, end + 1).map(f => f.id);
        setSelectedIds(rangeIds);
      }
    } else {
      setSelectedIds([fileId]);
      setLastSelectedId(fileId);
    }
  };

  const handleKeyDownSelect = (folder: FsNode) => (e: React.KeyboardEvent) => {
    if (!selectedIds.length) return;
    const files = getFlatFileList(folder);
    const currentIdx = files.findIndex(f => f.id === selectedIds[selectedIds.length - 1]);
    let nextIdx = currentIdx;
    if (e.key === "ArrowDown") nextIdx = Math.min(files.length - 1, currentIdx + 1);
    if (e.key === "ArrowUp") nextIdx = Math.max(0, currentIdx - 1);
    if (nextIdx !== currentIdx) {
      if (e.shiftKey) {
        const [start, end] = [Math.min(currentIdx, nextIdx), Math.max(currentIdx, nextIdx)];
        const rangeIds = files.slice(start, end + 1).map(f => f.id);
        setSelectedIds(rangeIds);
      } else {
        setSelectedIds([files[nextIdx].id]);
        setLastSelectedId(files[nextIdx].id);
      }
    }
  };

  const currentPath = explorerData?.name || 'GOV-ARCHIVE';

  return (
    <div className="gov-explorer-shell">
      <div className="gov-explorer-toolbar">
        <div className="gov-explorer-title">Datei-Explorer</div>
        <div className="gov-explorer-actions">
          <button className="toolbar-btn" onClick={() => handleAdd(explorerData.id, 'Neuer Ordner', true)}>Neuer Ordner</button>
          <button className="toolbar-btn" onClick={() => handleAdd(explorerData.id, 'Neue Datei.txt', false)}>Neue Datei</button>
          <button className="toolbar-btn" onClick={() => setSelectedIds([])}>Auswahl aufheben</button>
        </div>
      </div>
      <div className="gov-explorer-breadcrumbs">Pfad: {currentPath}</div>
      <div className="gov-explorer-container">
        {editorFile ? (
          <FileEditor
            name={editorFile.name}
            content={editorContent}
            onSave={handleSaveFile}
            onBack={handleBack}
          />
        ) : (
          <Folder
            explorer={explorerData}
            onAdd={handleAdd}
            onOpenFile={handleOpenFile}
            onContextMenu={handleContextMenu}
            renderLabel={renderLabel}
            selectedIds={selectedIds}
            handleSelect={handleSelect}
            handleKeyDownSelect={handleKeyDownSelect}
          />
        )}
        {contextMenu && (
          <GovContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            options={contextOptions}
            onClose={closeContextMenu}
          />
        )}
      </div>
      <div className="gov-explorer-statusbar">{selectedIds.length ? `${selectedIds.length} Element(e) ausgewählt` : 'Bereit'} - Speichern in LocalStorage</div>
    </div>
  );
}
