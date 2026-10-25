/**
 * EncryptionStatusDashboard Component
 * ENIGMA Integration - Zeigt Verschlüsselungsstatus von Laufwerken
 */

import React, { useState, useEffect } from 'react';
import { storageManager } from '../utils/storageManager';
import './EncryptionStatusDashboard.css';

const MOCK_DRIVES = [
  {
    id: 'C:',
    name: 'System',
    sizeGB: 256,
    encryptionStatus: 'encrypted',
    method: 'BitLocker XTS-AES-256',
    percentProtected: 100,
    lastEncrypted: '2026-01-15 14:23:00',
    recoveryKeyStatus: 'backed_up'
  },
  {
    id: 'D:',
    name: 'Archive Data',
    sizeGB: 512,
    encryptionStatus: 'encrypting',
    method: 'BitLocker XTS-AES-256',
    percentProtected: 67,
    lastEncrypted: '2026-02-15 09:00:00',
    recoveryKeyStatus: 'pending'
  },
  {
    id: 'E:',
    name: 'Backup',
    sizeGB: 1024,
    encryptionStatus: 'not_encrypted',
    method: 'None',
    percentProtected: 0,
    lastEncrypted: null,
    recoveryKeyStatus: 'none'
  },
  {
    id: 'USB:',
    name: 'Portable Drive',
    sizeGB: 64,
    encryptionStatus: 'encrypted',
    method: 'BitLocker XTS-AES-256',
    percentProtected: 100,
    lastEncrypted: '2025-12-10 16:45:00',
    recoveryKeyStatus: 'backed_up'
  }
];

export default function EncryptionStatusDashboard() {
  const [drives, setDrives] = useState(MOCK_DRIVES);
  const [selectedDrive, setSelectedDrive] = useState(null);
  const [showRecoveryKey, setShowRecoveryKey] = useState(false);
  const [encryptionProgress, setEncryptionProgress] = useState({});

  useEffect(() => {
    // Simuliere Encryption Progress für D: Laufwerk
    const interval = setInterval(() => {
      setDrives(prevDrives =>
        prevDrives.map(drive => {
          if (drive.id === 'D:' && drive.encryptionStatus === 'encrypting') {
            const newPercent = Math.min(drive.percentProtected + 2, 100);
            return {
              ...drive,
              percentProtected: newPercent,
              encryptionStatus: newPercent === 100 ? 'encrypted' : 'encrypting'
            };
          }
          return drive;
        })
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'encrypted': return '#00ff00';
      case 'encrypting': return '#ffff00';
      case 'not_encrypted': return '#ff0000';
      case 'error': return '#ff00ff';
      default: return '#00ff00';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'encrypted': return 'Verschlüsselt';
      case 'encrypting': return 'Wird verschlüsselt...';
      case 'not_encrypted': return 'Nicht verschlüsselt';
      case 'error': return 'Fehler';
      default: return 'Unbekannt';
    }
  };

  const handleEncryptDrive = async (driveId) => {
    if (confirm(`Sind Sie sicher? Laufwerk ${driveId} wird jetzt verschlüsselt.`)) {
      setDrives(prevDrives =>
        prevDrives.map(drive =>
          drive.id === driveId
            ? { ...drive, encryptionStatus: 'encrypting', percentProtected: 1 }
            : drive
        )
      );

      // Speichere Action im Audit Log
      await storageManager.addAuditLog('encrypt_drive_initiated', {
        driveId,
        severity: 'high'
      });
    }
  };

  const handleExportRecoveryKey = async (driveId) => {
    const drive = drives.find(d => d.id === driveId);
    if (!drive) return;

    const mockKey = `BITLOCKER-RECOVERY-KEY-${driveId}
${Math.random().toString(36).substring(2, 58).toUpperCase()}
${Math.random().toString(36).substring(2, 58).toUpperCase()}
Created: ${new Date().toISOString()}
Drive: ${driveId}
[STRENG GEHEIM]`;

    // Speichere Recovery Key
    await storageManager.setRecoveryKey(driveId, mockKey, {
      exported: new Date().toISOString(),
      driveSize: drive.sizeGB
    });

    // Download
    const blob = new Blob([mockKey], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `recovery-key-${driveId}.txt`;
    a.click();
    URL.revokeObjectURL(url);

    alert('Recovery Key exportiert und lokal gespeichert.');
  };

  return (
    <div className="encryption-dashboard">
      {/* Header */}
      <div className="encryption-header">
        <h2>🔐 ENIGMA - Verschlüsselungs-Management</h2>
        <p className="dashboard-subtitle">
          Systemweit Laufwerk-Verschlüsselung mit BitLocker/LUKS
        </p>
      </div>

      {/* Drives Grid */}
      <div className="drives-grid">
        {drives.map(drive => (
          <div
            key={drive.id}
            className={`drive-card ${drive.encryptionStatus}`}
            onClick={() => setSelectedDrive(drive.id === selectedDrive ? null : drive.id)}
          >
            <div className="drive-header">
              <div className="drive-letter">{drive.id}</div>
              <div className={`status-indicator`} style={{
                backgroundColor: getStatusColor(drive.encryptionStatus)
              }}></div>
            </div>

            <div className="drive-info">
              <h4>{drive.name}</h4>
              <p className="drive-size">{drive.sizeGB} GB</p>
            </div>

            <div className="encryption-status">
              <span style={{ color: getStatusColor(drive.encryptionStatus) }}>
                {getStatusText(drive.encryptionStatus)}
              </span>
            </div>

            {drive.encryptionStatus === 'encrypting' && (
              <div className="progress-bar">
                <div className="progress-fill" style={{
                  width: `${drive.percentProtected}%`
                }}></div>
                <span className="progress-text">{drive.percentProtected}%</span>
              </div>
            )}

            {drive.encryptionStatus !== 'encrypting' && (
              <div className="method-label">
                {drive.method !== 'None' ? drive.method : 'Keine Verschlüsselung'}
              </div>
            )}

            {selectedDrive === drive.id && (
              <div className="drive-actions">
                {drive.encryptionStatus === 'not_encrypted' && (
                  <button 
                    className="action-btn encrypt-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEncryptDrive(drive.id);
                    }}
                  >
                    ▶ Verschlüsseln
                  </button>
                )}
                {(drive.encryptionStatus === 'encrypted' || drive.encryptionStatus === 'encrypting') && (
                  <button 
                    className="action-btn backup-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleExportRecoveryKey(drive.id);
                    }}
                  >
                    💾 Recovery Key
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Detailed View */}
      {selectedDrive && (
        <div className="detailed-view">
          <div className="detailed-header">
            <h3>Laufwerk Details: {selectedDrive}</h3>
            <button 
              className="close-details"
              onClick={() => setSelectedDrive(null)}
            >
              ✕
            </button>
          </div>

          {drives.find(d => d.id === selectedDrive) && (
            <div className="detail-content">
              {(() => {
                const drive = drives.find(d => d.id === selectedDrive);
                return (
                  <>
                    <div className="detail-row">
                      <label>Verschlüsselungs-Methode:</label>
                      <span>{drive.method}</span>
                    </div>
                    <div className="detail-row">
                      <label>Gesamtschutz:</label>
                      <span>{drive.percentProtected}%</span>
                    </div>
                    <div className="detail-row">
                      <label>Recovery-Key Status:</label>
                      <span className={`key-status ${drive.recoveryKeyStatus}`}>
                        {drive.recoveryKeyStatus === 'backed_up' && '✓ Gesichert'}
                        {drive.recoveryKeyStatus === 'pending' && '⏳ Ausstehend'}
                        {drive.recoveryKeyStatus === 'none' && '✗ Nicht vorhanden'}
                      </span>
                    </div>
                    {drive.lastEncrypted && (
                      <div className="detail-row">
                        <label>Zuletzt verschlüsselt:</label>
                        <span>{drive.lastEncrypted}</span>
                      </div>
                    )}
                    <div className="detail-section">
                      <h4>Bitlocker-Spezifikationen</h4>
                      <ul>
                        <li>Verschlüsselungsalgorithmus: AES-256 XTS</li>
                        <li>Schlüsselverwaltung: TPM 2.0</li>
                        <li>Authentifizierung: PIN + Passwort</li>
                        <li>Sicherheitsstufe: Military Grade (DoD 5220.22-M)</li>
                      </ul>
                    </div>
                  </>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {/* System Summary */}
      <div className="system-summary">
        <h3>Systemzusammenfassung</h3>
        <div className="summary-stats">
          <div className="stat">
            <span className="stat-label">Laufwerke gesamt:</span>
            <span className="stat-value">{drives.length}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Verschlüsselt:</span>
            <span className="stat-value" style={{ color: '#00ff00' }}>
              {drives.filter(d => d.encryptionStatus === 'encrypted').length}
            </span>
          </div>
          <div className="stat">
            <span className="stat-label">Wird verschlüsselt:</span>
            <span className="stat-value" style={{ color: '#ffff00' }}>
              {drives.filter(d => d.encryptionStatus === 'encrypting').length}
            </span>
          </div>
          <div className="stat">
            <span className="stat-label">Ungeschützt:</span>
            <span className="stat-value" style={{ color: '#ff0000' }}>
              {drives.filter(d => d.encryptionStatus === 'not_encrypted').length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
