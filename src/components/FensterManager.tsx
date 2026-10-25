import React, { useState, useEffect, useCallback, useRef } from 'react'
import { AnimatePresence } from 'framer-motion'
import SurveillanceCenter from './SurveillanceCenter'
import ArchiveViewer from './ArchiveViewer'
import FileEditor from './FileEditor'
import GovTerminal from './GovTerminal.jsx'
import DraggableWindow from './DraggableWindow'
import UserManager from './UserManager'
import './desktop.css'

function makeId() { return Math.random().toString(36).slice(2, 9) }

// ─── Audio ────────────────────────────────────────────────────────────────────
let _desktopAudioCtx = null
function getDesktopAudioCtx() {
  try {
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return null
    if (!_desktopAudioCtx) _desktopAudioCtx = new AC()
    if (_desktopAudioCtx.state === 'suspended') _desktopAudioCtx.resume().catch(() => {})
    return _desktopAudioCtx
  } catch (e) { return null }
}

function playClickSound() {
  try {
    const ctx = getDesktopAudioCtx(); if (!ctx) return
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'square'
    osc.frequency.value = 600
    gain.gain.value = 0.001
    osc.connect(gain); gain.connect(ctx.destination)
    const now = ctx.currentTime
    gain.gain.exponentialRampToValueAtTime(0.012, now + 0.006)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04)
    osc.start(now); osc.stop(now + 0.06)
  } catch (e) {}
}

// Windows XP Startup-Sound (vereinfachte Nachbildung der ikonischen Melodie)
function playXPStartupSound() {
  try {
    const ctx = getDesktopAudioCtx(); if (!ctx) return
    const now = ctx.currentTime

    // XP-Startup: charakteristische aufsteigende Melodie
    // Noten: E4, G4, A4, E5 (vereinfacht)
    const notes = [
      { freq: 329.63, start: 0.0,  dur: 0.35, type: 'sine',     vol: 0.06  },  // E4
      { freq: 392.00, start: 0.3,  dur: 0.35, type: 'sine',     vol: 0.06  },  // G4
      { freq: 440.00, start: 0.6,  dur: 0.45, type: 'sine',     vol: 0.07  },  // A4
      { freq: 523.25, start: 0.95, dur: 0.6,  type: 'sine',     vol: 0.07  },  // C5
      { freq: 659.25, start: 1.45, dur: 0.9,  type: 'sine',     vol: 0.08  },  // E5 (Hauptton)
      // Akkord-Unterlage
      { freq: 261.63, start: 0.0,  dur: 2.2,  type: 'triangle', vol: 0.025 },  // C4
      { freq: 196.00, start: 0.0,  dur: 2.2,  type: 'triangle', vol: 0.02  },  // G3
    ]

    notes.forEach(n => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = n.type
      osc.frequency.value = n.freq
      gain.gain.value = 0.001
      osc.connect(gain); gain.connect(ctx.destination)
      const t = now + n.start
      gain.gain.exponentialRampToValueAtTime(n.vol, t + 0.02)
      gain.gain.setValueAtTime(n.vol, t + n.dur - 0.08)
      gain.gain.exponentialRampToValueAtTime(0.0001, t + n.dur)
      osc.start(t); osc.stop(t + n.dur + 0.05)
    })
  } catch (e) {}
}

// ─── Dateistruktur für Explorer und Suche ────────────────────────────────────
const FILE_TREE = [
  // Laufwerke
  { name: 'Lokaler Datenträger (C:)', type: 'drive', path: 'C:\\', icon: '💾' },
  { name: 'Lokaler Datenträger (D:)', type: 'drive', path: 'D:\\', icon: '💽' },
  // Systemordner
  { name: 'ARCHIV',        type: 'folder', path: 'C:\\GOV\\ARCHIV',       icon: '📁' },
  { name: 'PROTOKOLLE',    type: 'folder', path: 'C:\\GOV\\PROTOKOLLE',   icon: '📁' },
  { name: 'BERICHTE',      type: 'folder', path: 'C:\\GOV\\BERICHTE',     icon: '📁' },
  { name: 'PERSONAL',      type: 'folder', path: 'C:\\GOV\\PERSONAL',     icon: '📁' },
  { name: 'NETZWERK',      type: 'folder', path: 'C:\\GOV\\NETZWERK',     icon: '📁' },
  { name: 'TEMP',          type: 'folder', path: 'C:\\TEMP',              icon: '📁' },
  { name: 'SYSTEM32',      type: 'folder', path: 'C:\\WINDOWS\\SYSTEM32', icon: '📁' },
  { name: 'Eigene Dateien',type: 'folder', path: 'C:\\Dokumente und Einstellungen\\%USERNAME%\\Eigene Dateien', icon: '📂' },
  { name: 'Desktop',       type: 'folder', path: 'C:\\Dokumente und Einstellungen\\%USERNAME%\\Desktop', icon: '🖥' },
  // Dateien
  { name: 'bericht_2003.txt',    type: 'file', path: 'C:\\GOV\\BERICHTE\\bericht_2003.txt',   icon: '📄' },
  { name: 'bericht_2004.txt',    type: 'file', path: 'C:\\GOV\\BERICHTE\\bericht_2004.txt',   icon: '📄' },
  { name: 'bericht_2005.txt',    type: 'file', path: 'C:\\GOV\\BERICHTE\\bericht_2005.txt',   icon: '📄' },
  { name: 'protokoll_jan.log',   type: 'file', path: 'C:\\GOV\\PROTOKOLLE\\protokoll_jan.log', icon: '📋' },
  { name: 'protokoll_feb.log',   type: 'file', path: 'C:\\GOV\\PROTOKOLLE\\protokoll_feb.log', icon: '📋' },
  { name: 'protokoll_mrz.log',   type: 'file', path: 'C:\\GOV\\PROTOKOLLE\\protokoll_mrz.log', icon: '📋' },
  { name: 'zugangsliste.dat',    type: 'file', path: 'C:\\GOV\\PERSONAL\\zugangsliste.dat',   icon: '🔐' },
  { name: 'mitarbeiter.xls',     type: 'file', path: 'C:\\GOV\\PERSONAL\\mitarbeiter.xls',    icon: '📊' },
  { name: 'sicherheit_rev7.cfg', type: 'file', path: 'C:\\GOV\\NETZWERK\\sicherheit_rev7.cfg', icon: '⚙' },
  { name: 'netzwerk_topologie.cfg', type: 'file', path: 'C:\\GOV\\NETZWERK\\netzwerk_topologie.cfg', icon: '⚙' },
  { name: 'audit_log_v1.dat',    type: 'file', path: 'C:\\GOV\\ARCHIV\\audit_log_v1.dat',    icon: '📋' },
  { name: 'archiv_index.dat',    type: 'file', path: 'C:\\GOV\\ARCHIV\\archiv_index.dat',    icon: '📋' },
  { name: 'autoexec.bat',        type: 'file', path: 'C:\\autoexec.bat',                     icon: '⚙' },
  { name: 'config.sys',          type: 'file', path: 'C:\\config.sys',                       icon: '⚙' },
  { name: 'ntldr',               type: 'file', path: 'C:\\ntldr',                            icon: '⚙' },
  { name: 'pagefile.sys',        type: 'file', path: 'C:\\pagefile.sys',                     icon: '⚙' },
  { name: 'cmd.exe',             type: 'file', path: 'C:\\WINDOWS\\SYSTEM32\\cmd.exe',       icon: '🖥' },
  { name: 'regedit.exe',         type: 'file', path: 'C:\\WINDOWS\\regedit.exe',             icon: '⚙' },
  { name: 'explorer.exe',        type: 'file', path: 'C:\\WINDOWS\\explorer.exe',            icon: '🗂' },
  { name: 'notepad.exe',         type: 'file', path: 'C:\\WINDOWS\\notepad.exe',             icon: '📝' },
  { name: 'taskmgr.exe',         type: 'file', path: 'C:\\WINDOWS\\SYSTEM32\\taskmgr.exe',   icon: '📊' },
]

// ─── Desktop-Icons (XP-Stil) ──────────────────────────────────────────────────
const DESKTOP_ICONS = [
  { id: 'mycomputer', label: 'Arbeitsplatz',    icon: '🖥️',  type: 'explorer',   title: 'Arbeitsplatz – Explorer', adminOnly: false },
  { id: 'explorer',   label: 'Explorer',        icon: '🗂️',  type: 'explorer',   title: 'Windows Explorer',        adminOnly: false },
  { id: 'terminal',   label: 'Terminal',        icon: '💻',  type: 'terminal',   title: 'GOV-Terminal',            adminOnly: false },
  { id: 'archive',    label: 'Archiv',          icon: '🗄️',  type: 'archive',    title: 'Dokumenten-Archiv',       adminOnly: false },
  { id: 'usermgr',    label: 'Benutzer',        icon: '👥',  type: 'usermgr',    title: 'Benutzerverwaltung',      adminOnly: true  },
  { id: 'trash',      label: 'Papierkorb',      icon: '🗑️',  type: null,         title: null,                      adminOnly: false },
]

// ─── Startmenü-Einträge ───────────────────────────────────────────────────────
const START_PROGRAMS = [
  { label: 'Explorer',            icon: '🗂️',  type: 'explorer',    title: 'Windows Explorer',       adminOnly: false },
  { label: 'Dokumenten-Archiv',   icon: '🗄️',  type: 'archive',     title: 'Dokumenten-Archiv',      adminOnly: false },
  { label: 'GOV-Terminal',        icon: '💻',  type: 'terminal',    title: 'GOV-Terminal',           adminOnly: false },
  { label: 'Benutzerverwaltung',  icon: '👥',  type: 'usermgr',     title: 'Benutzerverwaltung',     adminOnly: true  },
]

// ─── Windows XP Explorer ──────────────────────────────────────────────────────
function ExplorerWindow({ onOpenFile }) {
  const [currentPath, setCurrentPath] = useState('C:\\')
  const [selectedItem, setSelectedItem] = useState(null)
  const [history, setHistory] = useState(['C:\\'])
  const [historyIdx, setHistoryIdx] = useState(0)
  const [viewMode, setViewMode] = useState('list') // 'icons' | 'list' | 'details'

  // Ordnerstruktur aufbauen
  const getDrives = () => [
    { name: 'Lokaler Datenträger (C:)', type: 'drive', path: 'C:\\', icon: '💾', size: '40 GB' },
    { name: 'Lokaler Datenträger (D:)', type: 'drive', path: 'D:\\', icon: '💽', size: '80 GB' },
    { name: 'Netzlaufwerk (H:)',        type: 'drive', path: 'H:\\', icon: '🌐', size: '100 GB' },
  ]

  const getItemsForPath = (path) => {
    if (path === 'C:\\' || path === '') {
      return [
        { name: 'GOV', type: 'folder', path: 'C:\\GOV', icon: '📁', modified: '14.03.2003' },
        { name: 'WINDOWS', type: 'folder', path: 'C:\\WINDOWS', icon: '📁', modified: '14.03.2003' },
        { name: 'TEMP', type: 'folder', path: 'C:\\TEMP', icon: '📁', modified: '01.01.2004' },
        { name: 'Dokumente und Einstellungen', type: 'folder', path: 'C:\\Dokumente und Einstellungen', icon: '📂', modified: '14.03.2003' },
        { name: 'autoexec.bat', type: 'file', path: 'C:\\autoexec.bat', icon: '⚙', size: '1 KB', modified: '14.03.2003' },
        { name: 'config.sys', type: 'file', path: 'C:\\config.sys', icon: '⚙', size: '1 KB', modified: '14.03.2003' },
        { name: 'ntldr', type: 'file', path: 'C:\\ntldr', icon: '⚙', size: '250 KB', modified: '14.03.2003' },
      ]
    }
    if (path === 'C:\\GOV') {
      return [
        { name: 'ARCHIV', type: 'folder', path: 'C:\\GOV\\ARCHIV', icon: '📁', modified: '12.06.2003' },
        { name: 'PROTOKOLLE', type: 'folder', path: 'C:\\GOV\\PROTOKOLLE', icon: '📁', modified: '01.03.2004' },
        { name: 'BERICHTE', type: 'folder', path: 'C:\\GOV\\BERICHTE', icon: '📁', modified: '15.04.2004' },
        { name: 'PERSONAL', type: 'folder', path: 'C:\\GOV\\PERSONAL', icon: '📁', modified: '20.01.2004' },
        { name: 'NETZWERK', type: 'folder', path: 'C:\\GOV\\NETZWERK', icon: '📁', modified: '08.02.2004' },
      ]
    }
    if (path === 'C:\\GOV\\ARCHIV') {
      return [
        { name: 'audit_log_v1.dat', type: 'file', path: 'C:\\GOV\\ARCHIV\\audit_log_v1.dat', icon: '📋', size: '48 KB', modified: '12.06.2003' },
        { name: 'archiv_index.dat', type: 'file', path: 'C:\\GOV\\ARCHIV\\archiv_index.dat', icon: '📋', size: '12 KB', modified: '12.06.2003' },
        { name: 'backup_2003.zip', type: 'file', path: 'C:\\GOV\\ARCHIV\\backup_2003.zip', icon: '🗜', size: '1.2 MB', modified: '31.12.2003' },
      ]
    }
    if (path === 'C:\\GOV\\PROTOKOLLE') {
      return [
        { name: 'protokoll_jan.log', type: 'file', path: 'C:\\GOV\\PROTOKOLLE\\protokoll_jan.log', icon: '📋', size: '24 KB', modified: '31.01.2004' },
        { name: 'protokoll_feb.log', type: 'file', path: 'C:\\GOV\\PROTOKOLLE\\protokoll_feb.log', icon: '📋', size: '18 KB', modified: '29.02.2004' },
        { name: 'protokoll_mrz.log', type: 'file', path: 'C:\\GOV\\PROTOKOLLE\\protokoll_mrz.log', icon: '📋', size: '31 KB', modified: '31.03.2004' },
      ]
    }
    if (path === 'C:\\GOV\\BERICHTE') {
      return [
        { name: 'bericht_2003.txt', type: 'file', path: 'C:\\GOV\\BERICHTE\\bericht_2003.txt', icon: '📄', size: '8 KB', modified: '15.12.2003' },
        { name: 'bericht_2004.txt', type: 'file', path: 'C:\\GOV\\BERICHTE\\bericht_2004.txt', icon: '📄', size: '11 KB', modified: '15.04.2004' },
        { name: 'bericht_2005.txt', type: 'file', path: 'C:\\GOV\\BERICHTE\\bericht_2005.txt', icon: '📄', size: '9 KB', modified: '10.01.2005' },
      ]
    }
    if (path === 'C:\\GOV\\PERSONAL') {
      return [
        { name: 'zugangsliste.dat', type: 'file', path: 'C:\\GOV\\PERSONAL\\zugangsliste.dat', icon: '🔐', size: '4 KB', modified: '20.01.2004' },
        { name: 'mitarbeiter.xls', type: 'file', path: 'C:\\GOV\\PERSONAL\\mitarbeiter.xls', icon: '📊', size: '28 KB', modified: '20.01.2004' },
      ]
    }
    if (path === 'C:\\GOV\\NETZWERK') {
      return [
        { name: 'sicherheit_rev7.cfg', type: 'file', path: 'C:\\GOV\\NETZWERK\\sicherheit_rev7.cfg', icon: '⚙', size: '3 KB', modified: '08.02.2004' },
        { name: 'netzwerk_topologie.cfg', type: 'file', path: 'C:\\GOV\\NETZWERK\\netzwerk_topologie.cfg', icon: '⚙', size: '6 KB', modified: '08.02.2004' },
      ]
    }
    if (path === 'C:\\WINDOWS') {
      return [
        { name: 'SYSTEM32', type: 'folder', path: 'C:\\WINDOWS\\SYSTEM32', icon: '📁', modified: '14.03.2003' },
        { name: 'explorer.exe', type: 'file', path: 'C:\\WINDOWS\\explorer.exe', icon: '🗂', size: '1.0 MB', modified: '14.03.2003' },
        { name: 'notepad.exe', type: 'file', path: 'C:\\WINDOWS\\notepad.exe', icon: '📝', size: '69 KB', modified: '14.03.2003' },
        { name: 'regedit.exe', type: 'file', path: 'C:\\WINDOWS\\regedit.exe', icon: '⚙', size: '146 KB', modified: '14.03.2003' },
      ]
    }
    if (path === 'C:\\WINDOWS\\SYSTEM32') {
      return [
        { name: 'cmd.exe', type: 'file', path: 'C:\\WINDOWS\\SYSTEM32\\cmd.exe', icon: '🖥', size: '388 KB', modified: '14.03.2003' },
        { name: 'taskmgr.exe', type: 'file', path: 'C:\\WINDOWS\\SYSTEM32\\taskmgr.exe', icon: '📊', size: '141 KB', modified: '14.03.2003' },
        { name: 'mmc.exe', type: 'file', path: 'C:\\WINDOWS\\SYSTEM32\\mmc.exe', icon: '⚙', size: '1.5 MB', modified: '14.03.2003' },
      ]
    }
    if (path === 'D:\\') {
      return [
        { name: 'Eigene Dateien', type: 'folder', path: 'D:\\Eigene Dateien', icon: '📂', modified: '01.01.2004' },
        { name: 'Backup', type: 'folder', path: 'D:\\Backup', icon: '📁', modified: '31.12.2003' },
      ]
    }
    if (path === 'H:\\') {
      return [
        { name: 'users$', type: 'folder', path: 'H:\\users$', icon: '🌐', modified: '14.03.2003' },
        { name: 'profiles$', type: 'folder', path: 'H:\\profiles$', icon: '🌐', modified: '14.03.2003' },
      ]
    }
    // Leerer Ordner als Fallback
    return []
  }

  const isRoot = currentPath === '' || currentPath === 'Arbeitsplatz'
  const items = isRoot ? getDrives() : getItemsForPath(currentPath)

  function navigate(path) {
    const newHistory = history.slice(0, historyIdx + 1)
    newHistory.push(path)
    setHistory(newHistory)
    setHistoryIdx(newHistory.length - 1)
    setCurrentPath(path)
    setSelectedItem(null)
    playClickSound()
  }

  function goBack() {
    if (historyIdx > 0) {
      const newIdx = historyIdx - 1
      setHistoryIdx(newIdx)
      setCurrentPath(history[newIdx])
      setSelectedItem(null)
    }
  }

  function goForward() {
    if (historyIdx < history.length - 1) {
      const newIdx = historyIdx + 1
      setHistoryIdx(newIdx)
      setCurrentPath(history[newIdx])
      setSelectedItem(null)
    }
  }

  function goUp() {
    if (!currentPath || currentPath === 'Arbeitsplatz') return
    const parts = currentPath.replace(/\\$/, '').split('\\')
    if (parts.length <= 1) {
      navigate('Arbeitsplatz')
    } else {
      parts.pop()
      const parent = parts.join('\\') + (parts.length === 1 ? '\\' : '')
      navigate(parent)
    }
  }

  const displayPath = isRoot ? 'Arbeitsplatz' : currentPath

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 400, background: '#ece9d8', fontFamily: 'Tahoma, Arial, sans-serif', fontSize: 11 }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 4px', background: '#ece9d8', borderBottom: '1px solid #aca899' }}>
        <button
          onClick={goBack}
          disabled={historyIdx === 0}
          style={{ height: 22, padding: '0 8px', background: 'linear-gradient(to bottom, #f5f4ea, #ece9d8)', border: '1px solid #aca899', borderRadius: 3, cursor: historyIdx === 0 ? 'default' : 'pointer', opacity: historyIdx === 0 ? 0.5 : 1, fontSize: 12 }}
          title="Zurück"
        >◀</button>
        <button
          onClick={goForward}
          disabled={historyIdx >= history.length - 1}
          style={{ height: 22, padding: '0 8px', background: 'linear-gradient(to bottom, #f5f4ea, #ece9d8)', border: '1px solid #aca899', borderRadius: 3, cursor: historyIdx >= history.length - 1 ? 'default' : 'pointer', opacity: historyIdx >= history.length - 1 ? 0.5 : 1, fontSize: 12 }}
          title="Vorwärts"
        >▶</button>
        <button
          onClick={goUp}
          disabled={isRoot}
          style={{ height: 22, padding: '0 8px', background: 'linear-gradient(to bottom, #f5f4ea, #ece9d8)', border: '1px solid #aca899', borderRadius: 3, cursor: isRoot ? 'default' : 'pointer', opacity: isRoot ? 0.5 : 1, fontSize: 12 }}
          title="Eine Ebene nach oben"
        >▲</button>
        <div style={{ flex: 1, height: 21, background: '#fff', border: '1px solid #7f9db9', padding: '0 4px', display: 'flex', alignItems: 'center', fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {displayPath}
        </div>
        <div style={{ display: 'flex', gap: 2 }}>
          {['icons', 'list', 'details'].map(mode => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              style={{ height: 22, padding: '0 6px', background: viewMode === mode ? 'linear-gradient(to bottom, #d8e8ff, #c8d8ef)' : 'linear-gradient(to bottom, #f5f4ea, #ece9d8)', border: '1px solid #aca899', borderRadius: 2, cursor: 'pointer', fontSize: 10, color: '#000' }}
              title={mode === 'icons' ? 'Große Symbole' : mode === 'list' ? 'Liste' : 'Details'}
            >
              {mode === 'icons' ? '⊞' : mode === 'list' ? '≡' : '▤'}
            </button>
          ))}
        </div>
      </div>

      {/* Breadcrumb */}
      <div style={{ padding: '2px 8px', background: '#f0ede0', borderBottom: '1px solid #aca899', fontSize: 10, color: '#555', display: 'flex', alignItems: 'center', gap: 4 }}>
        <span style={{ cursor: 'pointer', color: '#0000cc' }} onClick={() => navigate('Arbeitsplatz')}>Arbeitsplatz</span>
        {!isRoot && currentPath.split('\\').filter(Boolean).map((part, i, arr) => {
          const path = arr.slice(0, i + 1).join('\\') + (i === 0 ? '\\' : '')
          return (
            <React.Fragment key={i}>
              <span style={{ color: '#888' }}>›</span>
              <span
                style={{ cursor: i < arr.length - 1 ? 'pointer' : 'default', color: i < arr.length - 1 ? '#0000cc' : '#000' }}
                onClick={() => i < arr.length - 1 && navigate(path)}
              >{part}</span>
            </React.Fragment>
          )
        })}
      </div>

      {/* Hauptbereich */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Seitenleiste */}
        <div style={{ width: 140, background: '#d4e8ff', borderRight: '1px solid #aca899', padding: 8, display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto', flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 'bold', color: '#0a246a', marginBottom: 4, borderBottom: '1px solid #aca899', paddingBottom: 2 }}>Datei und Ordner</div>
            <div style={{ fontSize: 11, color: '#0000cc', cursor: 'pointer', padding: '2px 0' }} onClick={() => navigate('C:\\')}>Lokaler Datenträger (C:)</div>
            <div style={{ fontSize: 11, color: '#0000cc', cursor: 'pointer', padding: '2px 0' }} onClick={() => navigate('D:\\')}>Lokaler Datenträger (D:)</div>
            <div style={{ fontSize: 11, color: '#0000cc', cursor: 'pointer', padding: '2px 0' }} onClick={() => navigate('H:\\')}>Netzlaufwerk (H:)</div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 'bold', color: '#0a246a', marginBottom: 4, borderBottom: '1px solid #aca899', paddingBottom: 2 }}>Andere Orte</div>
            <div style={{ fontSize: 11, color: '#0000cc', cursor: 'pointer', padding: '2px 0' }} onClick={() => navigate('Arbeitsplatz')}>Arbeitsplatz</div>
            <div style={{ fontSize: 11, color: '#0000cc', cursor: 'pointer', padding: '2px 0' }} onClick={() => navigate('C:\\GOV')}>GOV-Daten</div>
          </div>
        </div>

        {/* Dateiliste */}
        <div style={{ flex: 1, background: '#ffffff', overflowY: 'auto', padding: 4 }}>
          {viewMode === 'details' ? (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr style={{ background: '#ece9d8', borderBottom: '1px solid #aca899' }}>
                  <th style={{ textAlign: 'left', padding: '3px 8px', fontWeight: 'bold', cursor: 'pointer' }}>Name</th>
                  <th style={{ textAlign: 'left', padding: '3px 8px', fontWeight: 'bold', cursor: 'pointer' }}>Größe</th>
                  <th style={{ textAlign: 'left', padding: '3px 8px', fontWeight: 'bold', cursor: 'pointer' }}>Typ</th>
                  <th style={{ textAlign: 'left', padding: '3px 8px', fontWeight: 'bold', cursor: 'pointer' }}>Geändert</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr
                    key={i}
                    style={{ background: selectedItem === i ? '#316ac5' : i % 2 === 0 ? '#ffffff' : '#f8f8f8', color: selectedItem === i ? '#fff' : '#000', cursor: 'pointer' }}
                    onClick={() => { setSelectedItem(i); playClickSound() }}
                    onDoubleClick={() => {
                      if (item.type === 'folder' || item.type === 'drive') navigate(item.path)
                    }}
                  >
                    <td style={{ padding: '2px 8px', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 14 }}>{item.icon}</span>
                      <span>{item.name}</span>
                    </td>
                    <td style={{ padding: '2px 8px' }}>{item.size || (item.type === 'folder' || item.type === 'drive' ? '' : '–')}</td>
                    <td style={{ padding: '2px 8px' }}>{item.type === 'folder' ? 'Dateiordner' : item.type === 'drive' ? 'Lokaler Datenträger' : 'Datei'}</td>
                    <td style={{ padding: '2px 8px' }}>{item.modified || '–'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : viewMode === 'list' ? (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {items.map((item, i) => (
                <div
                  key={i}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '2px 8px', background: selectedItem === i ? '#316ac5' : 'transparent', color: selectedItem === i ? '#fff' : '#000', cursor: 'pointer', borderRadius: 2 }}
                  onClick={() => { setSelectedItem(i); playClickSound() }}
                  onDoubleClick={() => {
                    if (item.type === 'folder' || item.type === 'drive') navigate(item.path)
                  }}
                >
                  <span style={{ fontSize: 16 }}>{item.icon}</span>
                  <span style={{ fontSize: 11 }}>{item.name}</span>
                </div>
              ))}
            </div>
          ) : (
            // Icons-Ansicht
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: 8 }}>
              {items.map((item, i) => (
                <div
                  key={i}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 72, padding: '4px 2px', background: selectedItem === i ? 'rgba(49,106,197,0.3)' : 'transparent', border: selectedItem === i ? '1px dotted #316ac5' : '1px solid transparent', borderRadius: 3, cursor: 'pointer' }}
                  onClick={() => { setSelectedItem(i); playClickSound() }}
                  onDoubleClick={() => {
                    if (item.type === 'folder' || item.type === 'drive') navigate(item.path)
                  }}
                >
                  <span style={{ fontSize: 28, marginBottom: 3 }}>{item.icon}</span>
                  <span style={{ fontSize: 10, textAlign: 'center', wordBreak: 'break-word', lineHeight: 1.2 }}>{item.name}</span>
                </div>
              ))}
            </div>
          )}
          {items.length === 0 && (
            <div style={{ padding: 20, color: '#888', fontSize: 11, textAlign: 'center' }}>
              Dieser Ordner ist leer.
            </div>
          )}
        </div>
      </div>

      {/* Statusleiste */}
      <div style={{ padding: '2px 8px', background: '#ece9d8', borderTop: '1px solid #aca899', fontSize: 10, color: '#555', display: 'flex', justifyContent: 'space-between' }}>
        <span>{items.length} Objekt(e)</span>
        {selectedItem !== null && items[selectedItem] && (
          <span>{items[selectedItem].name}</span>
        )}
      </div>
    </div>
  )
}

// ─── Suche-Fenster (XP-Stil) ──────────────────────────────────────────────────
function SearchWindow({ onClose }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searched, setSearched] = useState(false)
  const [searching, setSearching] = useState(false)
  const [searchIn, setSearchIn] = useState('C:\\')

  function doSearch() {
    if (!query.trim()) return
    setSearching(true)
    setSearched(false)
    setTimeout(() => {
      const q = query.trim().toLowerCase()
      const found = FILE_TREE.filter(f =>
        (f.name.toLowerCase().includes(q) || f.path.toLowerCase().includes(q)) &&
        f.path.toLowerCase().startsWith(searchIn.toLowerCase())
      )
      setResults(found)
      setSearched(true)
      setSearching(false)
    }, 400 + Math.random() * 600)
  }

  return (
    <div className="search-window">
      <div className="search-header">
        <span className="search-icon-big">🔍</span>
        <div className="search-header-text">
          <div className="search-title">Suchen</div>
          <div className="search-subtitle">Dateien, Ordner und Programme</div>
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
            placeholder="z.B. protokoll, bericht, exe..."
            autoFocus
          />
          <button className="search-btn" onClick={doSearch} disabled={searching || !query.trim()}>
            {searching ? 'Suche...' : 'Suchen'}
          </button>
        </div>
        <label className="search-label" style={{ marginTop: 8 }}>Suchen in:</label>
        <select
          className="search-input"
          value={searchIn}
          onChange={e => setSearchIn(e.target.value)}
          style={{ height: 21 }}
        >
          <option value="C:\\">Lokaler Datenträger (C:)</option>
          <option value="D:\\">Lokaler Datenträger (D:)</option>
          <option value="C:\\GOV">C:\GOV (Behördendaten)</option>
          <option value="C:\\WINDOWS">C:\WINDOWS (System)</option>
        </select>
      </div>
      <div className="search-divider" />
      <div className="search-results-area">
        {searching && (
          <div className="search-status">Suche läuft<span className="search-dots">...</span></div>
        )}
        {searched && !searching && results.length === 0 && (
          <div className="search-status">Keine Dateien oder Ordner gefunden.</div>
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
                  <span className="search-result-icon">{r.icon || (r.type === 'folder' ? '📁' : '📄')}</span>
                  <span className="search-col-name">{r.name}</span>
                  <span className="search-col-type">{r.type === 'folder' ? 'Ordner' : r.type === 'drive' ? 'Laufwerk' : 'Datei'}</span>
                  <span className="search-col-path">{r.path}</span>
                </div>
              ))}
            </div>
            <div className="search-count">{results.length} Objekt(e) gefunden.</div>
          </>
        )}
        {!searched && !searching && (
          <div className="search-hint">
            Geben Sie einen Suchbegriff ein und klicken Sie auf "Suchen".<br />
            Sie können nach Dateinamen, Ordnern oder Programmen suchen.
          </div>
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
  const [contextMenu, setContextMenu] = useState(null)
  const startRef = useRef(null)

  // Aktuell eingeloggter Benutzer (aus localStorage)
  const currentUser = React.useMemo(() => {
    try {
      const raw = localStorage.getItem('gov_current_user')
      return raw ? JSON.parse(raw) : null
    } catch { return null }
  }, [])
  const isAdmin = currentUser?.role === 'admin'
  const userPermissions = currentUser?.permissions || ['read']
  const hasPermission = (perm) => userPermissions.includes(perm)

  useEffect(() => {
    const timer = setInterval(() => setClock(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // XP Startup-Sound beim ersten Laden des Desktops
  useEffect(() => {
    if (!bootComplete) return
    const t = setTimeout(() => {
      playXPStartupSound()
    }, 400)
    return () => clearTimeout(t)
  }, [bootComplete])

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

  // Kontextmenü schließen
  useEffect(() => {
    if (!contextMenu) return
    function handleClick() { setContextMenu(null) }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [contextMenu])

  const openWindow = useCallback((opts) => {
    playClickSound()
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
            pos: { x: 80 + ws.length * 28, y: 50 + ws.length * 22 },
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
    if (w.type === 'explorer')    return <ExplorerWindow />
    if (w.type === 'archive')     return <ArchiveViewer />
    if (w.type === 'terminal')    return <GovTerminal onDeepAccess={onDeepAccess} />
    if (w.type === 'usermgr')     return <UserManager />
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

  function handleLogoutClick()   { onLogout() }
  function handleRestart()  { setModal({ type: 'restart' }); setShowStart(false) }
  function handleShutdown() { setModal({ type: 'shutdown' }); setShowStart(false) }
  function confirmRestart() { setModal(null); window.location.reload() }
  function confirmShutdown() {
    setModal(null)
    document.body.innerHTML = '<div style="background:#000;color:#c8c8c8;display:flex;align-items:center;justify-content:center;height:100vh;font-size:1.1rem;font-family:Tahoma,Arial,sans-serif;flex-direction:column;gap:16px;"><div>Es ist jetzt sicher, den Computer auszuschalten.</div><div style="font-size:0.85rem;opacity:0.5;">ZENTRALRECHNER  •  Bundesbehörde</div></div>'
  }

  function handleDesktopRightClick(e) {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY })
  }

  if (!bootComplete) return null

  const clockStr = clock.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
  const dateStr  = clock.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })

  return (
    <div
      className="win95-desktop"
      onClick={() => { setSelectedIcon(null); setContextMenu(null) }}
      onContextMenu={handleDesktopRightClick}
    >
      {/* ── Hintergrund ── */}
      <div className="win95-wallpaper" />

      {/* ── Desktop-Icons ── */}
      <div className="win95-icons-area">
        {DESKTOP_ICONS.filter(icon => !icon.adminOnly || isAdmin).map(icon => (
          <div
            key={icon.id}
            className={'win95-icon' + (selectedIcon === icon.id ? ' win95-icon-selected' : '')}
            onClick={e => { e.stopPropagation(); setSelectedIcon(icon.id); playClickSound() }}
            onDoubleClick={e => {
              e.stopPropagation()
              if (!icon.type) return
              // Zugriffsprüfung
              if (icon.type === 'usermgr' && !isAdmin) {
                setModal({ type: 'access_denied', title: 'Zugriff verweigert', msg: 'Benutzerverwaltung erfordert Administrator-Rechte.' })
                return
              }
              openWindow({ title: icon.title, type: icon.type })
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

      {/* ── Desktop-Kontextmenü ── */}
      {contextMenu && (
        <div
          className="context-menu"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={e => e.stopPropagation()}
        >
          <div className="context-menu-item" onClick={() => { openWindow({ title: 'Suchen', type: 'search' }); setContextMenu(null) }}>
            🔍 Suchen...
          </div>
          <div className="context-menu-separator" />
          <div className="context-menu-item" onClick={() => { openWindow({ title: 'Windows Explorer', type: 'explorer' }); setContextMenu(null) }}>
            🗂 Explorer öffnen
          </div>
          <div className="context-menu-separator" />
          <div className="context-menu-item" style={{ opacity: 0.6, cursor: 'default' }}>
            Eigenschaften
          </div>
        </div>
      )}

      {/* ── Startmenü ── */}
      {showStart && (
        <div className="win95-startmenu" ref={startRef}>
          {/* Linke Leiste */}
          <div className="win95-startmenu-sidebar">
            <span className="win95-startmenu-sidebar-text">ZENTRALRECHNER</span>
          </div>
          {/* Menüeinträge */}
          <div className="win95-startmenu-items">
            <div className="win95-startmenu-section">
              {START_PROGRAMS.filter(p => !p.adminOnly || isAdmin).map(p => (
                <div
                  key={p.type}
                  className="win95-startmenu-item"
                  onClick={() => {
                    setShowStart(false)
                    if (p.type === 'usermgr' && !isAdmin) {
                      setModal({ type: 'access_denied', title: 'Zugriff verweigert', msg: 'Benutzerverwaltung erfordert Administrator-Rechte.' })
                      return
                    }
                    openWindow({ title: p.title, type: p.type })
                  }}
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
              <div className="win95-startmenu-item" onClick={handleLogoutClick}>
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
      {modal?.type === 'access_denied' && (
        <div className="win95-modal-bg">
          <div className="win95-modal">
            <div className="win95-modal-titlebar">
              <span>⛔ Zugriff verweigert</span>
              <button onClick={() => setModal(null)}>✕</button>
            </div>
            <div className="win95-modal-body">
              <span className="win95-modal-icon">🔒</span>
              <div>
                <div className="win95-modal-text" style={{fontWeight:'bold',marginBottom:6}}>Zugriff verweigert</div>
                <div className="win95-modal-text">{modal.msg}</div>
                <div className="win95-modal-text" style={{marginTop:8,color:'#666',fontSize:'10px'}}>Wenden Sie sich an Ihren Systemadministrator.</div>
              </div>
            </div>
            <div className="win95-modal-actions">
              <button className="win95-btn" onClick={() => setModal(null)}>OK</button>
            </div>
          </div>
        </div>
      )}
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
          onClick={e => { e.stopPropagation(); setShowStart(s => !s); playClickSound() }}
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
              onClick={() => { toggleMinimize(w.id); playClickSound() }}
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
