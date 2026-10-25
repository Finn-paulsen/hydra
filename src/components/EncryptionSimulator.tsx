/**
 * EncryptionSimulator
 * Simuliert BitLocker (Windows) und LUKS (Linux) Verschlüsselungsprozesse
 */

import React, { useState, useRef, useEffect } from 'react';
import './EncryptionSimulator.css';

export default function EncryptionSimulator({ driveId = 'C:', driveSize = 256 }) {
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState([]);
  const logsRef = useRef(null);
  const simulationRef = useRef(null);

  const encryptionSteps = [
    { percent: 0, message: 'Initialisiere BitLocker-Treiber...', duration: 1000 },
    { percent: 5, message: 'TPM 2.0 Modul aktiviert', duration: 800 },
    { percent: 10, message: 'Schlüsselerzeugung gestartet...', duration: 1500 },
    { percent: 15, message: 'AES-256 Verschlüsselungsschlüssel generiert', duration: 1000 },
    { percent: 20, message: 'Recovery-Key wird erstellt...', duration: 1200 },
    { percent: 25, message: 'Recovery-Key in Active Directory registriert', duration: 1000 },
    { percent: 30, message: 'Dateisystem wird gescannt...', duration: 2000 },
    { percent: 40, message: 'Master Boot Record wird verschlüsselt', duration: 1500 },
    { percent: 50, message: 'Systemdateien werden verschlüsselt (50%)...', duration: 2000 },
    { percent: 60, message: 'Benutzerdaten werden verschlüsselt (60%)...', duration: 2000 },
    { percent: 70, message: 'Temp-Dateien werden verschlüsselt (70%)...', duration: 1500 },
    { percent: 80, message: 'Integritätsprüfung läuft...', duration: 1500 },
    { percent: 90, message: 'Metadaten werden finalisiert...', duration: 1200 },
    { percent: 95, message: 'Verschlüsselung abgeschlossen, verifying...', duration: 1000 },
    { percent: 100, message: 'BitLocker-Verschlüsselung erfolgreich abgeschlossen', duration: 500 }
  ];

  const addLog = (message, type = 'info') => {
    setLogs(prevLogs => [
      ...prevLogs,
      {
        id: Date.now(),
        message,
        type,
        timestamp: new Date().toLocaleTimeString('de-DE')
      }
    ]);
  };

  useEffect(() => {
    if (logsRef.current) {
      logsRef.current.scrollTop = logsRef.current.scrollHeight;
    }
  }, [logs]);

  const startEncryption = () => {
    setIsEncrypting(true);
    setProgress(0);
    setLogs([]);
    addLog(`Starte BitLocker-Verschlüsselung auf Laufwerk ${driveId}`, 'info');
    addLog(`Größe: ${driveSize} GB | Methode: XTS-AES-256`, 'info');
    addLog('═══════════════════════════════════════════════', 'system');

    let stepIndex = 0;

    const runNextStep = () => {
      if (stepIndex >= encryptionSteps.length) {
        setIsEncrypting(false);
        addLog(`Zeitstempel: ${new Date().toISOString()}`, 'success');
        return;
      }

      const step = encryptionSteps[stepIndex];
      
      setTimeout(() => {
        setProgress(step.percent);
        addLog(step.message, step.percent === 100 ? 'success' : 'info');
        
        stepIndex++;
        runNextStep();
      }, step.duration);
    };

    runNextStep();
  };

  const cancelEncryption = () => {
    setIsEncrypting(false);
    addLog('Verschlüsselung durch Benutzer abgebrochen', 'warning');
    setProgress(0);
  };

  const getLogColor = (type) => {
    switch (type) {
      case 'success': return '#00ff00';
      case 'warning': return '#ffff00';
      case 'error': return '#ff0000';
      case 'system': return '#00ccff';
      default: return '#00ff00';
    }
  };

  return (
    <div className="encryption-simulator">
      <div className="simulator-header">
        <h3>🔒 Laufwerk-Verschlüsselung Simulator</h3>
        <p className="simulator-info">
          Laufwerk: <strong>{driveId}</strong> | Größe: <strong>{driveSize} GB</strong> | 
          Methode: <strong>BitLocker XTS-AES-256</strong>
        </p>
      </div>

      {/* Control Panel */}
      <div className="control-panel">
        <button
          className="control-btn start-btn"
          onClick={startEncryption}
          disabled={isEncrypting}
        >
          ▶ Verschlüsselung starten
        </button>
        <button
          className="control-btn cancel-btn"
          onClick={cancelEncryption}
          disabled={!isEncrypting}
        >
          ⏹ Abbrechen
        </button>
      </div>

      {/* Progress Section */}
      {(isEncrypting || progress > 0) && (
        <div className="progress-section">
          <div className="progress-label">
            <span className="label-text">Gesamtfortschritt:</span>
            <span className="label-percent">{progress}%</span>
          </div>
          
          <div className="progress-bar large">
            <div 
              className="progress-fill" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>

          {progress < 100 && (
            <div className="progress-info">
              <span className="time-remaining">
                Geschätzte Zeit: {Math.max(0, Math.ceil((100 - progress) * 0.3))} Sekunden
              </span>
            </div>
          )}

          {progress === 100 && (
            <div className="progress-info success">
              ✓ Verschlüsselung abgeschlossen
            </div>
          )}
        </div>
      )}

      {/* Logs */}
      <div className="logs-container">
        <div className="logs-header">
          <h4>BitLocker-Protokoll</h4>
          <span className="log-count">{logs.length} Einträge</span>
        </div>
        <div className="logs-area" ref={logsRef}>
          {logs.length === 0 ? (
            <div className="logs-empty">Klicken Sie auf "Verschlüsselung starten" um zu beginnen...</div>
          ) : (
            logs.map(log => (
              <div 
                key={log.id} 
                className={`log-entry log-${log.type}`}
              >
                <span className="log-time">[{log.timestamp}]</span>
                <span 
                  className="log-message" 
                  style={{ color: getLogColor(log.type) }}
                >
                  {log.message}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* System Info */}
      <div className="system-info">
        <h4>BitLocker-Systeminfo</h4>
        <div className="info-grid">
          <div className="info-item">
            <label>Windows-Version:</label>
            <span>Windows 10 Pro Enterprise LTSC</span>
          </div>
          <div className="info-item">
            <label>TPM Version:</label>
            <span>2.0 (Firmware 7.50)</span>
          </div>
          <div className="info-item">
            <label>Bootsektor Schutz:</label>
            <span>MBR + UEFI Secure Boot</span>
          </div>
          <div className="info-item">
            <label>Verschlüsselungs-Hardware:</label>
            <span>Intel Volume Management Engine</span>
          </div>
        </div>
      </div>

      {/* Recovery Key Info */}
      {progress >= 25 && (
        <div className="recovery-info">
          <h4>🔑 Recovery-Key Information</h4>
          <div className="recovery-content">
            <p>
              Ein Recovery-Key wurde generiert und in  Microsoft Azure und im Active Directory 
              gespeichert. Im Falle einer Blockade oder eines Fehlers können Sie diesen Key 
              verwenden, um auf das Laufwerk zuzugreifen.
            </p>
            <button className="btn-export">
              💾 Recovery-Key exportieren
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
