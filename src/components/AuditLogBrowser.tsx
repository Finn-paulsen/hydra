/**
 * AuditLogBrowser Component
 * Anzeige und Verwaltung von Audit Logs
 */

import React, { useState, useEffect, useRef } from 'react';
import { auditLogger, AuditSeverity } from '../services/AuditLogger';
import './AuditLogBrowser.css';

export default function AuditLogBrowser() {
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Filter State
  const [filters, setFilters] = useState({
    eventType: '',
    severity: '',
    userId: '',
    dateRange: 'all',
    searchTerm: ''
  });

  const [selectedLog, setSelectedLog] = useState(null);
  const [stats, setStats] = useState(null);
  const tableRef = useRef(null);

  // Lade Logs beim Mount
  useEffect(() => {
    loadAuditLogs();
  }, []);

  // Wende Filter an
  useEffect(() => {
    applyFilters();
  }, [filters, logs]);

  const loadAuditLogs = async () => {
    setLoading(true);
    try {
      const allLogs = await auditLogger.getAuditLogs();
      const stats = await auditLogger.getAuditStats();
      setLogs(allLogs);
      setStats(stats);
    } catch (e) {
      console.error('Fehler beim Laden der Logs:', e);
    }
    setLoading(false);
  };

  const applyFilters = () => {
    let filtered = [...logs];

    // Type Filter
    if (filters.eventType) {
      filtered = filtered.filter(l => l.action?.includes(filters.eventType));
    }

    // Severity Filter
    if (filters.severity) {
      filtered = filtered.filter(l => l.severity === filters.severity);
    }

    // User Filter
    if (filters.userId) {
      filtered = filtered.filter(l => l.user?.includes(filters.userId));
    }

    // Date Range Filter
    if (filters.dateRange !== 'all') {
      const now = new Date();
      let startDate;

      switch (filters.dateRange) {
        case '24h':
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = null;
      }

      if (startDate) {
        filtered = filtered.filter(l => new Date(l.ts) >= startDate);
      }
    }

    // Search Term
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(l =>
        l.action?.toLowerCase().includes(term) ||
        l.user?.toLowerCase().includes(term) ||
        l.info?.toLowerCase().includes(term)
      );
    }

    setFilteredLogs(filtered);
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case AuditSeverity.CRITICAL: return '#ff0000';
      case AuditSeverity.HIGH: return '#ff9900';
      case AuditSeverity.MEDIUM: return '#ffff00';
      case AuditSeverity.LOW: return '#00ff00';
      default: return '#00ff00';
    }
  };

  const getSeverityLabel = (severity) => {
    switch (severity) {
      case AuditSeverity.CRITICAL: return 'KRITISCH';
      case AuditSeverity.HIGH: return 'HOCH';
      case AuditSeverity.MEDIUM: return 'MITTEL';
      case AuditSeverity.LOW: return 'NIEDRIG';
      default: return 'UNBEKANNT';
    }
  };

  const handleExportLogs = async () => {
    const csv = [
      ['Datum', 'Benutzer', 'Ereignis', 'Severity', 'Details'].join(','),
      ...filteredLogs.map(l => [
        new Date(l.ts).toLocaleString('de-DE'),
        l.user || 'N/A',
        l.action || 'N/A',
        l.severity || 'N/A',
        (l.info || '').replace(/,/g, ';')
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-log-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleGenerateReport = async () => {
    const report = await auditLogger.generateAuditReport(30);
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-report-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="audit-log-browser">
      {/* Header */}
      <div className="browser-header">
        <h2>📋 Audit Log Browser</h2>
        <p className="browser-subtitle">Durchsuchen und Verwalten von Systemaudit-Einträgen</p>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="stats-bar">
          <div className="stat-item">
            <span className="stat-label">Gesamt:</span>
            <span className="stat-value">{stats.totalEntries}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label" style={{ color: '#ff0000' }}>Kritisch:</span>
            <span className="stat-value">{stats.entriesBySeverity.critical || 0}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label" style={{ color: '#ff9900' }}>Hoch:</span>
            <span className="stat-value">{stats.entriesBySeverity.high || 0}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label" style={{ color: '#ffff00' }}>Mittel:</span>
            <span className="stat-value">{stats.entriesBySeverity.medium || 0}</span>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="browser-controls">
        <div className="filter-group">
          <input
            type="text"
            placeholder="Suchbegriff..."
            value={filters.searchTerm}
            onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
            className="filter-input"
          />
        </div>

        <div className="filter-group">
          <label>Severity:</label>
          <select
            value={filters.severity}
            onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
            className="filter-select"
          >
            <option value="">Alle</option>
            <option value="critical">Kritisch</option>
            <option value="high">Hoch</option>
            <option value="medium">Mittel</option>
            <option value="low">Niedrig</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Zeitraum:</label>
          <select
            value={filters.dateRange}
            onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
            className="filter-select"
          >
            <option value="all">Alle</option>
            <option value="24h">Letzte 24 Stunden</option>
            <option value="7d">Letzte 7 Tage</option>
            <option value="30d">Letzte 30 Tage</option>
          </select>
        </div>

        <div className="action-buttons">
          <button className="action-btn export-btn" onClick={handleExportLogs}>
            📥 Exportieren
          </button>
          <button className="action-btn report-btn" onClick={handleGenerateReport}>
            📊 Report
          </button>
          <button className="action-btn refresh-btn" onClick={loadAuditLogs}>
            🔄 Aktualisieren
          </button>
        </div>
      </div>

      {/* Results Count */}
      <div className="results-info">
        Zeige {filteredLogs.length} von {logs.length} Einträgen
      </div>

      {/* Logs Table */}
      <div className="logs-table-container" ref={tableRef}>
        <table className="logs-table">
          <thead>
            <tr>
              <th>Datum/Zeit</th>
              <th>Benutzer</th>
              <th>Ereignis</th>
              <th>Severity</th>
              <th>Details</th>
              <th style={{ width: '50px' }}>Aktion</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.length === 0 ? (
              <tr className="empty-row">
                <td colSpan="6">Keine Einträge gefunden</td>
              </tr>
            ) : (
              filteredLogs.map(log => (
                <tr 
                  key={log.id} 
                  className={`log-row severity-${log.severity}`}
                  onClick={() => setSelectedLog(log)}
                >
                  <td className="log-date">
                    {new Date(log.ts).toLocaleString('de-DE')}
                  </td>
                  <td className="log-user">{log.user || 'SYSTEM'}</td>
                  <td className="log-action">
                    <span className="action-badge">{log.action || 'UNKNOWN'}</span>
                  </td>
                  <td className="log-severity">
                    <span 
                      className="severity-badge"
                      style={{ backgroundColor: getSeverityColor(log.severity) }}
                    >
                      {getSeverityLabel(log.severity)}
                    </span>
                  </td>
                  <td className="log-info">
                    <span title={log.info}>{(log.info || '').substring(0, 50)}...</span>
                  </td>
                  <td className="log-action-cell">
                    <button className="detail-btn">◀</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Detail Panel */}
      {selectedLog && (
        <div className="detail-panel">
          <div className="detail-header">
            <h3>Log-Details</h3>
            <button 
              className="close-btn"
              onClick={() => setSelectedLog(null)}
            >
              ✕
            </button>
          </div>

          <div className="detail-content">
            <div className="detail-row">
              <label>Zeitstempel:</label>
              <span>{new Date(selectedLog.ts).toLocaleString('de-DE')}</span>
            </div>
            <div className="detail-row">
              <label>Benutzer:</label>
              <span>{selectedLog.user || 'SYSTEM'}</span>
            </div>
            <div className="detail-row">
              <label>Ereignistyp:</label>
              <span>{selectedLog.action}</span>
            </div>
            <div className="detail-row">
              <label>Severity:</label>
              <span style={{ color: getSeverityColor(selectedLog.severity) }}>
                {getSeverityLabel(selectedLog.severity)}
              </span>
            </div>
            <div className="detail-row">
              <label>Details:</label>
              <span className="details-text">{selectedLog.info}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
