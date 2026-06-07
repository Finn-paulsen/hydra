// React und Hooks nur einmal importieren!
import { motion, AnimatePresence } from 'framer-motion';
// Zustand-Store entfernt
import SurveillanceCenter from './SurveillanceCenter';
import ArchiveViewer from './ArchiveViewer';
import FileEditor from './FileEditor';
import FileExplorer from './FileExplorer';
import GovTerminal from './GovTerminal.jsx';
import HiveMindArchive from './HiveMindArchive';
import React, { useState, useRef, useEffect } from 'react';
import DraggableWindow from './DraggableWindow';
// terminalIcon removed
// motion nur einmal importieren!

function makeId() { return Math.random().toString(36).slice(2, 9); }

export default function FensterManager({ bootComplete, onLogout, onDeepAccess }) {
  const [windows, setWindows] = useState([]);
  const [zCounter, setZCounter] = useState(10);
  const [clock, setClock] = useState(new Date());
  const [showStart, setShowStart] = useState(false);
  const [modal, setModal] = useState(null);

  const [explorerData, setExplorerData] = useState(null);

  // Wrapper für setExplorerData, der auch localStorage aktualisiert
  const updateExplorerData = (newData) => {
    setExplorerData(newData);
    if (newData) {
    }
  };

  // Datei in Papierkorb verschieben
  // moveToTrash jetzt lokal

  useEffect(() => {
    const timer = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  function openWindow(opts) {
    setWindows(ws => {
      // Prüfe, ob Fenster dieses Typs schon existiert
      const existing = ws.find(w => w.type === (opts.type ?? 'custom'));
      if (existing) {
        // Fenster in den Vordergrund holen und ggf. wiederherstellen
        return ws.map(w =>
          w.id === existing.id
            ? { ...w, minimized: false, z: zCounter }
            : w
        );
      }
      // Neues Fenster erzeugen
      return [
        ...ws,
        {
          id: makeId(),
          title: opts.title,
          type: opts.type ?? 'custom',
          content: opts.content,
          pos: { x: 100, y: 100 },
          z: zCounter,
          minimized: false,
        }
      ];
    });
    setZCounter(zCounter + 1);
  }

  function getWindowContent(w) {
    if (w.type === 'explorer') return <FileExplorer />;
    if (w.type === 'surveillance') return <SurveillanceCenter />;
    if (w.type === 'archive') return <ArchiveViewer />;
    if (w.type === 'terminal') return <GovTerminal onDeepAccess={onDeepAccess} />;
    if (w.type === 'hivemind') return <HiveMindArchive />;
    return typeof w.content === 'function' ? w.content() : w.content;
  }

  function closeWindow(id) {
    setWindows(ws => ws.filter(w => w.id !== id));
  }

  function focusWindow(id) {
    setWindows(ws => ws.map(w => w.id === id ? { ...w, z: zCounter } : w));
    setZCounter(zCounter + 1);
  }

  function toggleMinimize(id) {
    setWindows(ws => ws.map(w => w.id === id ? { ...w, minimized: !w.minimized } : w));
  }

  // Dateiinhalt im Explorer-State aktualisieren
  function updateFileContent(file, newContent) {
    function updateNode(node, path = 'root') {
      const currentPath = path;
      if (node.name === file.name && currentPath === file.path) {
        return { ...node, content: newContent };
      }
      if (node.type === 'folder' && node.children) {
        return { ...node, children: node.children.map((child, i) => updateNode(child, currentPath + '/' + child.name)) };
      }
      return node;
    }
    const newData = updateNode(explorerData);
    updateExplorerData(newData);
  }

  function handleOpenFile(file) {
    openWindow({
      title: `Datei: ${file.name}`,
      content: <FileEditor name={file.name} content={file.content || ''} onSave={content => updateFileContent(file, content)} />
    });
  }

  function handleLogout() { onLogout(); }
  function handleRestart() { setModal({ type: 'restart' }); }
  function handleShutdown() { setModal({ type: 'shutdown' }); }
  function confirmRestart() { setModal(null); window.location.reload(); }
  function confirmShutdown() {
    setModal(null);
    if (window.close) window.close();
    document.body.innerHTML = '<div style="background:#181818;color:#ffbf47;display:flex;align-items:center;justify-content:center;height:100vh;font-size:2rem;font-family:monospace;">System wurde heruntergefahren.</div>';
  }

  if (!bootComplete) return null;

  return (
    <div className="gov-desktop-bg">
      <div className="gov-desktop-icons">
        <div className="gov-desktop-icon" onDoubleClick={() => openWindow({ title: 'Überwachungszentrale', type: 'surveillance' })}>
          <span className="gov-icon-symbol">📷</span>
          <span className="gov-icon-label">Überwachung</span>
        </div>
        <div className="gov-desktop-icon" onDoubleClick={() => openWindow({ title: 'Videoarchiv', type: 'archive' })}>
          <span className="gov-icon-symbol">🗄️</span>
          <span className="gov-icon-label">Archiv</span>
        </div>
        <div className="gov-desktop-icon" onDoubleClick={() => openWindow({ title: 'Datei-Explorer', type: 'explorer' })}>
          <span className="gov-icon-symbol">📁</span>
          <span className="gov-icon-label">Dateien</span>
        </div>
        <div className="gov-desktop-icon" onDoubleClick={() => openWindow({ title: 'GOV-Terminal', type: 'terminal' })}>
          <span className="gov-icon-symbol">⌨️</span>
          <span className="gov-icon-label">Terminal</span>
        </div>
      </div>
      <AnimatePresence>
        {windows.map(w => !w.minimized && (
          <DraggableWindow
            key={w.id}
            window={w}
            getWindowContent={getWindowContent}
            onFocus={() => focusWindow(w.id)}
            onMove={pos => setWindows(ws => ws.map(win => win.id === w.id ? { ...win, pos: { x: Math.round(pos.x), y: Math.round(pos.y) } } : win))}
            onClose={() => closeWindow(w.id)}
            onMinimize={() => toggleMinimize(w.id)}
            z={w.z}
          />
        ))}



        
      </AnimatePresence>
      {showStart && (
        <div className="gov-startmenu">
          <button onClick={handleLogout}>Abmelden</button>
          <button onClick={handleRestart}>Neustarten</button>
          <button onClick={handleShutdown}>Herunterfahren</button>
        </div>
      )}
      {modal?.type === 'restart' && (
        <div className="gov-modal-bg">
          <div className="gov-modal">
            <div className="gov-modal-title">Systemneustart</div>
            <div className="gov-modal-content">Das System wird neu gestartet. Nicht gespeicherte Daten gehen verloren.<br />Fortfahren?</div>
            <div className="gov-modal-actions">
              <button onClick={confirmRestart}>Neustart</button>
              <button onClick={() => setModal(null)}>Abbrechen</button>
            </div>
          </div>
        </div>
      )}
      {modal?.type === 'shutdown' && (
        <div className="gov-modal-bg">
          <div className="gov-modal">
            <div className="gov-modal-title">System herunterfahren</div>
            <div className="gov-modal-content">Das System wird heruntergefahren.<br />Fortfahren?</div>
            <div className="gov-modal-actions">
              <button onClick={confirmShutdown}>Herunterfahren</button>
              <button onClick={() => setModal(null)}>Abbrechen</button>
            </div>
          </div>
        </div>
      )}
      <div className="gov-taskbar">
        <div className="gov-taskbar-left">
          <button className="gov-taskbar-menu" onClick={() => setShowStart(s => !s)}>Start</button>
        </div>
        <div className="gov-taskbar-windows">
          {windows.map(w => (
            <button
              key={w.id}
              className={`gov-taskbar-window-btn${w.minimized ? ' minimized' : ''}`}
              onClick={() => toggleMinimize(w.id)}
            >{w.title}</button>
          ))}
        </div>
        <div className="gov-taskbar-clock">
          {clock.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </div>
      </div>
    </div>
  );
}



