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

const DEEP_PROGRAMS = [
  { name: "HIVE-MIND Reaktor", icon: <AssessmentIcon fontSize="large" />, type: 'reactor' },
  { name: "Exploit Lab", icon: <TerminalIcon fontSize="large" />, type: 'exploit' },
  { name: "Sateliten-Zugriff", icon: <LanIcon fontSize="large" />, type: 'satellite' },
  { name: "System Settings", icon: <PersonIcon fontSize="large" />, type: 'settings' },
  { name: "Systemkonsole (BA-III)", icon: <TerminalIcon fontSize="large" />, type: 'console' },
  { name: "Aktenverwaltung", icon: <FolderIcon fontSize="large" />, type: 'files' },
  { name: "Datenbank (BA-DB/INT)", icon: <StorageIcon fontSize="large" />, type: 'database' },
];

export default function DeepDesktop({ onLogout }) {
  const [loggedIn, setLoggedIn] = useState(false);
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");
  const [activeProgram, setActiveProgram] = useState(null);

  function handleLogin(e) {
    e.preventDefault();
    // Simulierter Zugang
      if (user === "deepagent" && pass === "strengeheim") {
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
          {activeProgram.type === 'settings' && <SystemSettings />}
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
