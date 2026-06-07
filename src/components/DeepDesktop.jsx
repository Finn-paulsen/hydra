import React, { useState } from "react";
import './DeepDesktop.css';
import TerminalIcon from '@mui/icons-material/Terminal';
import FolderIcon from '@mui/icons-material/Folder';
import StorageIcon from '@mui/icons-material/Storage';
import PersonIcon from '@mui/icons-material/Person';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import AssessmentIcon from '@mui/icons-material/Assessment';
import LanIcon from '@mui/icons-material/Lan';
import ReactorControl from './ReactorControl';
import ExploitLab from './ExploitLab';
import SatelliteAccess from './SatelliteAccess';
import SystemSettings from './SystemSettings';
import UserManager from './UserManager';
import FileExplorer from './FileExplorer';

const DEEP_PROGRAMS = [
  { name: "HIVE-MIND Reaktor", icon: <AssessmentIcon fontSize="large" />, type: 'reactor' },
  { name: "Exploit Lab", icon: <TerminalIcon fontSize="large" />, type: 'exploit' },
  { name: "Sateliten-Zugriff", icon: <LanIcon fontSize="large" />, type: 'satellite' },
  { name: "Benutzerkontrolle", icon: <PersonIcon fontSize="large" />, type: 'usermanager' },
  { name: "System Settings", icon: <SupportAgentIcon fontSize="large" />, type: 'settings' },
  { name: "Systemkonsole (BA-III)", icon: <TerminalIcon fontSize="large" />, type: 'console' },
  { name: "Aktenverwaltung", icon: <FolderIcon fontSize="large" />, type: 'files' },
  { name: "Datenbank (BA-DB/INT)", icon: <StorageIcon fontSize="large" />, type: 'database' },
];

function DeepConsole() {
  const [lines, setLines] = useState([
    'BA-III KONSOLE INITIERT',
    'GESICHERTER TERMINALZUGANG VERFÜGBAR',
    "Geben Sie 'help' ein für interne Befehle."
  ]);
  const [input, setInput] = useState('');

  const commands = {
    help: [
      'Verfügbare interne Befehle:',
      'help            - Diese Hilfe',
      'status          - Systemstatus anzeigen',
      'hwcheck         - Hardwarediagnose starten',
      'logout          - Zurück zur DeepDesktop-Ansicht'
    ],
    status: [
      'BA-III SYSTEMSTATUS: OK',
      'SICHERHEITSLEVEL: STRENG GEHEIM',
      'AUTHGATE: AKTIV'
    ],
    hwcheck: [
      'CPU: 18% CORE LOAD',
      'RAM: 61% NUTZUNG',
      'NETWORK: 241MB/s',
      'STORAGE: 73% BELEGT'
    ],
    logout: [
      'Beende interne Konsole...'
    ]
  };

  const handleCommand = () => {
    const command = input.trim().toLowerCase();
    if (!command) return;
    const response = commands[command] || [`Unbekannter Befehl: ${command}`];
    setLines(l => [...l, `> ${command}`, ...response]);
    setInput('');
  };

  return (
    <div className="deep-console-shell">
      <div className="deep-console-header">BA-III Internes Terminal</div>
      <div className="deep-console-output">
        {lines.map((line, idx) => (
          <div key={idx} className="deep-console-line">{line}</div>
        ))}
      </div>
      <div className="deep-console-input-row">
        <span className="deep-console-prompt">BA-III&gt;</span>
        <input
          className="deep-console-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleCommand()}
          placeholder="Geben Sie einen Befehl ein..."
        />
      </div>
    </div>
  );
}

function DatabasePanel() {
  return (
    <div className="deep-db-shell">
      <div className="deep-db-header">BA-DB/INT Datenbankkonsole</div>
      <div className="deep-db-grid">
        <div className="deep-db-card">
          <div className="deep-db-card-title">Aktive Datenbanken</div>
          <ul>
            <li>VS-NfD_Akten (online)</li>
            <li>Geheimprojekte (online)</li>
            <li>Archiv.Index (read-only)</li>
          </ul>
        </div>
        <div className="deep-db-card">
          <div className="deep-db-card-title">Sicherheitsstatus</div>
          <p>Authentifizierung: aktiv</p>
          <p>Verschlüsselung: AES-256</p>
          <p>Zugriffsprotokoll: aktiviert</p>
        </div>
        <div className="deep-db-card">
          <div className="deep-db-card-title">Letzte Abfragen</div>
          <ul>
            <li>SELECT * FROM user_access WHERE level='VS-NfD';</li>
            <li>UPDATE archive SET status='ARCHIVED' WHERE id=4711;</li>
            <li>DELETE FROM temp WHERE created&lt;=DATE_SUB(NOW(), INTERVAL 30 DAY);</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

const DEEP_VALID_CREDENTIALS = [
  { user: 'deepagent', pass: 'strengeheim' },
  { user: 'test', pass: 'test' },
];

function isDeepValidCredential(user, pass) {
  return DEEP_VALID_CREDENTIALS.some(entry => entry.user === user && entry.pass === pass);
}

export default function DeepDesktop({ onLogout }) {
  const [loggedIn, setLoggedIn] = useState(false);
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");
  const [activeProgram, setActiveProgram] = useState(null);

  function handleLogin(e) {
    e.preventDefault();
    // Simulierter Zugang
      if (isDeepValidCredential(user, pass)) {
      setLoggedIn(true);
      setError("");
    } else {
      setError("Access Denied: Invalid credentials.");
    }
  }

  if (!loggedIn) {
    return (
      <div className="deep-login-bg">
          <form className="deep-login-form" onSubmit={handleLogin}>
            <pre className="deep-login-banner">
  {`
  ------------------------------------------------------------
    Internes Anmeldemodul (AuthGate/BA-III)  [Build 2.14.7]
    Referenz: BA-INT-SEC-2003/17
    Terminalzugriff wird nicht aktiv unterstützt.
    Protokollierung aktiviert. [VS-NfD]
  ------------------------------------------------------------
  `}
            </pre>
            <div className="deep-login-title">Dienstkontenverwaltung – Anmeldung erforderlich</div>
            <input
              type="text"
              placeholder="Benutzername"
              value={user}
              onChange={e => setUser(e.target.value)}
              autoFocus
            />
            <input
              type="password"
              placeholder="Zugangscode"
              value={pass}
              onChange={e => setPass(e.target.value)}
            />
            <button type="submit">Anmelden</button>
            {error && <div className="deep-login-error">{error}</div>}
          </form>
        </div>
    );
  }

  if (activeProgram) {
    return (
      <div className="deep-program-view">
        <div className="deep-program-header">
          <h2>{activeProgram.name}</h2>
          <button className="back-btn" onClick={() => setActiveProgram(null)}>← BACK</button>
        </div>
        <div className="deep-program-content">
          {activeProgram.type === 'reactor' && <ReactorControl />}
          {activeProgram.type === 'exploit' && <ExploitLab />}
          {activeProgram.type === 'satellite' && <SatelliteAccess />}
          {activeProgram.type === 'usermanager' && <UserManager />}
          {activeProgram.type === 'settings' && <SystemSettings />}
          {activeProgram.type === 'files' && <FileExplorer />}
          {activeProgram.type === 'console' && <DeepConsole />}
          {activeProgram.type === 'database' && <DatabasePanel />}
        </div>
      </div>
    );
  }

  return (
    <div className="deep-desktop-bg">
      <div className="deep-desktop-header">STRIKT GEHEIME SCHICHT - Bundesarchiv</div>
      <div className="deep-desktop-icons">
        {DEEP_PROGRAMS.map(p => (
          <div className="deep-desktop-icon" key={p.name} onClick={() => setActiveProgram(p)}>
            <span className="deep-icon-symbol" style={{ color: '#00ff00' }}>{p.icon}</span>
            <span className="deep-icon-label">{p.name}</span>
          </div>
        ))}
      </div>
      <div className="deep-taskbar">
        <button className="deep-taskbar-logout" onClick={onLogout}>Logout</button>
        <span className="deep-taskbar-label">Clearance: STRENG GEHEIM</span>
      </div>
    </div>
  );
}
