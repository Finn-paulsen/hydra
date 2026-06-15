import React, { useState, useRef, useEffect, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import SurveillanceCenter from './SurveillanceCenter';
import ArchiveViewer from './ArchiveViewer';
import FileEditor from './FileEditor';
import FileExplorer from './FileExplorer';
import GovTerminal from './GovTerminal.jsx';
import HiveMindArchive from './HiveMindArchive';
import DraggableWindow from './DraggableWindow';
import './desktop.css';

function makeId() { return Math.random().toString(36).slice(2, 9); }

// ─── Dateistruktur für Suche ──────────────────────────────────────────────────
const FILE_TREE = [
  { name: 'ARCHIV',        type: 'folder', path: 'C:\\GOV\\ARCHIV' },
  { name: 'PROTOKOLLE',    type: 'folder', path: 'C:\\GOV\\PROTOKOLLE' },
  { name: 'BERICHTE',      type: 'folder', path: 'C:\\GOV\\BERICHTE' },
  { name: 'PERSONAL',      type: 'folder', path: 'C:\\GOV\\PERSONAL' },
  { name: 'NETZWERK',      type: 'folder', path: 'C:\\GOV\\NETZWERK' },
  { name: 'TEMP',          type: 'folder', path: 'C:\\TEMP' },
  { name: 'SYSTEM32',      type: 'folder', path: 'C:\\WINNT\\SYSTEM32' },
  { name: 'bericht_2003.txt',    type: 'file', path: 'C:\\GOV\\BERICHTE\\bericht_2003.txt' },
  { name: 'bericht_2004.txt',    type: 'file', path: 'C:\\GOV\\BERICHTE\\bericht_2004.txt' },
  { name: 'protokoll_jan.log',   type: 'file', path: 'C:\\GOV\\PROTOKOLLE\\protokoll_jan.log' },
  { name: 'protokoll_feb.log',   type: 'file', path: 'C:\\GOV\\PROTOKOLLE\\protokoll_feb.log' },
  { name: 'zugangsliste.dat',    type: 'file', path: 'C:\\GOV\\PERSONAL\\zugangsliste.dat' },
  { name: 'sicherheit_rev7.cfg', type: 'file', path: 'C:\\GOV\\NETZWERK\\sicherheit_rev7.cfg' },
  { name: 'audit_log_v1.dat',    type: 'file', path: 'C:\\GOV\\ARCHIV\\audit_log_v1.dat' },
  { name: 'autoexec.bat',        type: 'file', path: 'C:\\autoexec.bat' },
  { name: 'config.sys',          type: 'file', path: 'C:\\config.sys' },
  { name: 'ntldr',               type: 'file', path: 'C:\\ntldr' },
  { name: 'pagefile.sys',        type: 'file', path: 'C:\\pagefile.sys' },
  { name: 'cmd.exe',             type: 'file', path: 'C:\\WINNT\\SYSTEM32\\cmd.exe' },
  { name: 'regedit.exe',         type: 'file', path: 'C:\\WINNT\\regedit.exe' },
]

// ─── Desktop-Icons ────────────────────────────────────────────────────────────
const DESKTOP_ICONS = [
  { id: 'surveillance', label: 'Überwachung',   icon: '📷', type: 'surveillance', title: 'Überwachungszentrale' },
  { id: 'archive',      label: 'Archiv',         icon: '🗄', type: 'archive',      title: 'Videoarchiv'          },
  { id: 'explorer',     label: 'Dateien',        icon: '📁', type: 'explorer',     title: 'Datei-Explorer'       },
  { id: 'terminal',     label: 'Terminal',       icon: '⌨',  type: 'terminal',     title: 'GOV-Terminal'         },
  { id: 'hivemind',     label: 'HiveMind',       icon: '🕸',  type: 'hivemind',     title: 'HiveMind-Archiv'      },
  { id: 'trash',        label: 'Papierkorb',     icon: '🗑',  type: null,           title: null                   },
]

// ─── Startmenü-Einträge ───────────────────────────────────────────────────────
const START_PROGRAMS = [
  { label: 'Überwachungszentrale', icon: '📷', type: 'surveillance', title: 'Überwachungszentrale' },
  { label: 'Videoarchiv',          icon: '🗄', type: 'archive',      title: 'Videoarchiv'          },
  { label: 'Datei-Explorer',       icon: '📁', type: 'explorer',     title: 'Datei-Explorer'       },
  { label: 'GOV-Terminal',         icon: '⌨',  type: 'terminal',     title: 'GOV-Terminal'         },
  { label: 'HiveMind-Archiv',      icon: '🕸',  type: 'hivemind',     title: 'HiveMind-Archiv'      },
]

// ─── Suche-Fenster ────────────────────────────────────────────────────────────
function SearchWindow({ onClose }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searched, setSearched] = useState(false)
  const [searching, setSearching] = useState(false)

  function doSearch() {
    if (!query.trim()) return
    setSearching(true)
    setSearched(false)
    // Simuliere kurze Suchverzögerung
    setTimeout(() => {
      const q = query.trim().toLowerCase()
      const found = FILE_TREE.filter(f =>
        f.name.toLowerCase().includes(q) || f.path.toLowerCase().includes(q)
      )
      setResults(found)
      setSearched(true)
      setSearching(false)
    }, 600 + Math.random() * 400)
  }

  return (
    <div className="search-window">
      <div className="search-header">
        <span className="search-icon-big">🔍</span>
        <div className="search-header-text">
          <div className="search-title">Suchen</div>
          <div className="search-subtitle">Dateien und Ordner</div>
        </div>
      </div>
      <div className="search-divider" />
      <div className="search-form">
        <label className="search-label">Name (Teile des Dateinamens):</label>
        <div className="search-input-row">
          <input
            className="search-input"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && doSearch()}
            placeholder="z.B. protokoll"
            autoFocus
          />
          <button className="search-btn" onClick={doSearch} disabled={searching}>
            {searching ? 'Suche...' : 'Suchen'}
          </button>
        </div>
        <label className="search-label" style={{ marginTop: 8 }}>Suchen in:</label>
        <input className="search-input" defaultValue="C:\\" readOnly style={{ opacity: 0.7 }} />
      </div>
      <div className="search-divider" />
      <div className="search-results-area">
        {searching && (
          <div className="search-status">Suche läuft<span className="search-dots">...</span></div>
        )}
        {searched && !searching && results.length === 0 && (
          <div className="search-status">Keine Dateien gefunden.</div>
        )}
        {searched && !searching && results.length > 0 && (
          <>
            <div className="search-results-header">
              <span className="search-col-name">Name</span>
              <span className="search-col-type">Typ</span>
              <span className="search-col-path">Pfad</span>
            </div>
            <div className="search-results-list">
              {results.map((r, i) => (
                <div key={i} className="search-result-row">
                  <span className="search-result-icon">{r.type === 'folder' ? '📁' : '📄'}</span>
                  <span className="search-col-name">{r.name}</span>
                  <span className="search-col-type">{r.type === 'folder' ? 'Ordner' : 'Datei'}</span>
                  <span className="search-col-path">{r.path}</span>
                </div>
              ))}
            </div>
            <div className="search-count">{results.length} Objekt(e) gefunden.</div>
          </>
        )}
        {!searched && !searching && (
          <div className="search-hint">Geben Sie einen Suchbegriff ein und klicken Sie auf "Suchen".</div>
        )}
      </div>
    </div>
  )
}

// ─── Haupt-Komponente ─────────────────────────────────────────────────────────
export default function FensterManager({ bootComplete, onLogout, onDeepAccess }) {
  const [windows, setWindows]     = useState([])
  const [zCounter, setZCounter]   = useState(10)
  const [clock, setClock]         = useState(new Date())
  const [showStart, setShowStart] = useState(false)
  const [modal, setModal]         = useState(null)
  const [selectedIcon, setSelectedIcon] = useState(null)
  const startRef = useRef(null)

  useEffect(() => {
    const timer = setInterval(() => setClock(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Startmenü schließen bei Klick außerhalb
  useEffect(() => {
    if (!showStart) return
    function handleClick(e) {
      if (startRef.current && !startRef.current.contains(e.target)) {
        setShowStart(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showStart])

  const openWindow = useCallback((opts) => {
    setZCounter(z => {
      const newZ = z + 1
      setWindows(ws => {
        const existing = ws.find(w => w.type === (opts.type ?? 'custom'))
        if (existing) {
          return ws.map(w =>
            w.id === existing.id ? { ...w, minimized: false, z: newZ } : w
          )
        }
        return [
          ...ws,
          {
            id: makeId(),
            title: opts.title,
            type: opts.type ?? 'custom',
            content: opts.content,
            pos: { x: 80 + ws.length * 24, y: 60 + ws.length * 20 },
            z: newZ,
            minimized: false,
          }
        ]
      })
      return newZ
    })
    setShowStart(false)
  }, [])

  function getWindowContent(w) {
    if (w.type === 'explorer')    return <FileExplorer />
    if (w.type === 'surveillance') return <SurveillanceCenter />
    if (w.type === 'archive')     return <ArchiveViewer />
    if (w.type === 'terminal')    return <GovTerminal onDeepAccess={onDeepAccess} />
    if (w.type === 'hivemind')    return <HiveMindArchive />
    if (w.type === 'search')      return <SearchWindow onClose={() => closeWindow(w.id)} />
    return typeof w.content === 'function' ? w.content() : w.content
  }

  function closeWindow(id)  { setWindows(ws => ws.filter(w => w.id !== id)) }
  function focusWindow(id)  {
    setZCounter(z => {
      const newZ = z + 1
      setWindows(ws => ws.map(w => w.id === id ? { ...w, z: newZ } : w))
      return newZ
    })
  }
  function toggleMinimize(id) {
    setWindows(ws => ws.map(w => w.id === id ? { ...w, minimized: !w.minimized } : w))
  }

  function handleLogout()   { onLogout() }
  function handleRestart()  { setModal({ type: 'restart' }); setShowStart(false) }
  function handleShutdown() { setModal({ type: 'shutdown' }); setShowStart(false) }
  function confirmRestart() { setModal(null); window.location.reload() }
  function confirmShutdown() {
    setModal(null)
    document.body.innerHTML = '<div style="background:#000;color:#c8c8c8;display:flex;align-items:center;justify-content:center;height:100vh;font-size:1.1rem;font-family:\'Courier New\',monospace;flex-direction:column;gap:16px;"><div>Es ist jetzt sicher, den Computer auszuschalten.</div><div style="font-size:0.85rem;opacity:0.5;">SIEMENS NIXDORF PCD-4H  •  BUND.INT</div></div>'
  }

  if (!bootComplete) return null

  const clockStr = clock.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
  const dateStr  = clock.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })

  return (
    <div
      className="win95-desktop"
      onClick={() => { setSelectedIcon(null) }}
    >
      {/* ── Hintergrund-Textur ── */}
      <div className="win95-wallpaper" />

      {/* ── Desktop-Icons ── */}
      <div className="win95-icons-area">
        {DESKTOP_ICONS.map(icon => (
          <div
            key={icon.id}
            className={'win95-icon' + (selectedIcon === icon.id ? ' win95-icon-selected' : '')}
            onClick={e => { e.stopPropagation(); setSelectedIcon(icon.id) }}
            onDoubleClick={e => {
              e.stopPropagation()
              if (icon.type) openWindow({ title: icon.title, type: icon.type })
            }}
          >
            <div className="win95-icon-img">{icon.icon}</div>
            <div className="win95-icon-label">{icon.label}</div>
          </div>
        ))}
      </div>

      {/* ── Fenster ── */}
      <AnimatePresence>
        {windows.map(w => !w.minimized && (
          <DraggableWindow
            key={w.id}
            window={w}
            getWindowContent={getWindowContent}
            onFocus={() => focusWindow(w.id)}
            onMove={pos => setWindows(ws => ws.map(win =>
              win.id === w.id ? { ...win, pos: { x: Math.round(pos.x), y: Math.round(pos.y) } } : win
            ))}
            onClose={() => closeWindow(w.id)}
            onMinimize={() => toggleMinimize(w.id)}
            z={w.z}
          />
        ))}
      </AnimatePresence>

      {/* ── Startmenü ── */}
      {showStart && (
        <div className="win95-startmenu" ref={startRef}>
          {/* Linke Leiste */}
          <div className="win95-startmenu-sidebar">
            <span className="win95-startmenu-sidebar-text">BUND.INT</span>
          </div>
          {/* Menüeinträge */}
          <div className="win95-startmenu-items">
            <div className="win95-startmenu-section">
              {START_PROGRAMS.map(p => (
                <div
                  key={p.type}
                  className="win95-startmenu-item"
                  onClick={() => openWindow({ title: p.title, type: p.type })}
                >
                  <span className="win95-startmenu-item-icon">{p.icon}</span>
                  <span className="win95-startmenu-item-label">{p.label}</span>
                </div>
              ))}
              <div
                className="win95-startmenu-item"
                onClick={() => openWindow({ title: 'Suchen', type: 'search' })}
              >
                <span className="win95-startmenu-item-icon">🔍</span>
                <span className="win95-startmenu-item-label">Suchen...</span>
              </div>
            </div>
            <div className="win95-startmenu-divider" />
            <div className="win95-startmenu-section">
              <div className="win95-startmenu-item" onClick={handleLogout}>
                <span className="win95-startmenu-item-icon">🚪</span>
                <span className="win95-startmenu-item-label">Abmelden...</span>
              </div>
              <div className="win95-startmenu-item" onClick={handleRestart}>
                <span className="win95-startmenu-item-icon">🔄</span>
                <span className="win95-startmenu-item-label">Neu starten...</span>
              </div>
              <div className="win95-startmenu-item" onClick={handleShutdown}>
                <span className="win95-startmenu-item-icon">⏻</span>
                <span className="win95-startmenu-item-label">Herunterfahren...</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modals ── */}
      {modal?.type === 'restart' && (
        <div className="win95-modal-bg">
          <div className="win95-modal">
            <div className="win95-modal-titlebar">
              <span>Systemneustart</span>
              <button onClick={() => setModal(null)}>✕</button>
            </div>
            <div className="win95-modal-body">
              <span className="win95-modal-icon">⚠</span>
              <div>
                <div className="win95-modal-text">Das System wird neu gestartet.</div>
                <div className="win95-modal-text">Nicht gespeicherte Daten gehen verloren.</div>
              </div>
            </div>
            <div className="win95-modal-actions">
              <button className="win95-btn" onClick={confirmRestart}>Neustart</button>
              <button className="win95-btn" onClick={() => setModal(null)}>Abbrechen</button>
            </div>
          </div>
        </div>
      )}
      {modal?.type === 'shutdown' && (
        <div className="win95-modal-bg">
          <div className="win95-modal">
            <div className="win95-modal-titlebar">
              <span>System herunterfahren</span>
              <button onClick={() => setModal(null)}>✕</button>
            </div>
            <div className="win95-modal-body">
              <span className="win95-modal-icon">⏻</span>
              <div>
                <div className="win95-modal-text">Das System wird heruntergefahren.</div>
                <div className="win95-modal-text">Alle Verbindungen werden getrennt.</div>
              </div>
            </div>
            <div className="win95-modal-actions">
              <button className="win95-btn" onClick={confirmShutdown}>Herunterfahren</button>
              <button className="win95-btn" onClick={() => setModal(null)}>Abbrechen</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Taskleiste ── */}
      <div className="win95-taskbar">
        {/* Start-Button */}
        <button
          className={'win95-start-btn' + (showStart ? ' win95-start-btn-active' : '')}
          onClick={e => { e.stopPropagation(); setShowStart(s => !s) }}
        >
          <span className="win95-start-logo">⊞</span>
          <span className="win95-start-text">Start</span>
        </button>

        {/* Trennlinie */}
        <div className="win95-taskbar-sep" />

        {/* Offene Fenster */}
        <div className="win95-taskbar-windows">
          {windows.map(w => (
            <button
              key={w.id}
              className={'win95-taskbar-btn' + (w.minimized ? ' win95-taskbar-btn-min' : ' win95-taskbar-btn-active')}
              onClick={() => toggleMinimize(w.id)}
              title={w.title}
            >
              <span className="win95-taskbar-btn-icon">
                {DESKTOP_ICONS.find(i => i.type === w.type)?.icon ||
                 START_PROGRAMS.find(i => i.type === w.type)?.icon || '🖥'}
              </span>
              <span className="win95-taskbar-btn-label">{w.title}</span>
            </button>
          ))}
        </div>

        {/* System-Tray */}
        <div className="win95-tray">
          <div className="win95-tray-sep" />
          <div className="win95-tray-icons">
            <span title="Netzwerk verbunden">🌐</span>
            <span title="Sicherheitsmodul aktiv">🔒</span>
          </div>
          <div className="win95-tray-clock" title={dateStr}>
            {clockStr}
          </div>
        </div>
      </div>
    </div>
  )
}
