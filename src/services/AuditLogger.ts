/**
 * Advanced Audit Logger Service
 * Umfassendes Audit Logging System für GOV-ARCHIVE
 * Tracking: Benutzeraktionen, Datenzugriffe, Systemevents
 */

import { storageManager, StorageKeys } from '../utils/storageManager';

export const AuditEventTypes = {
  // User Events
  USER_LOGIN: 'user_login',
  USER_LOGOUT: 'user_logout',
  USER_AUTH_FAILED: 'user_auth_failed',
  USER_CREATED: 'user_created',
  USER_MODIFIED: 'user_modified',
  USER_DELETED: 'user_deleted',
  USER_PASSWORD_CHANGED: 'user_password_changed',
  
  // Data Access Events
  DATA_VIEW: 'data_view',
  DATA_EXPORT: 'data_export',
  DATA_SEARCH: 'data_search',
  DATA_FILTER: 'data_filter',
  CASE_OPENED: 'case_opened',
  DOCUMENT_VIEWED: 'document_viewed',
  
  // Encryption Events
  ENCRYPTION_STARTED: 'encryption_started',
  ENCRYPTION_COMPLETED: 'encryption_completed',
  ENCRYPTION_FAILED: 'encryption_failed',
  RECOVERY_KEY_ACCESSED: 'recovery_key_accessed',
  RECOVERY_KEY_EXPORTED: 'recovery_key_exported',
  
  // System Events
  SYSTEM_STARTUP: 'system_startup',
  SYSTEM_SHUTDOWN: 'system_shutdown',
  SYSTEM_ERROR: 'system_error',
  CONFIG_CHANGED: 'config_changed',
  
  // Security Events
  SECURITY_ALERT: 'security_alert',
  UNAUTHORIZED_ACCESS_ATTEMPT: 'unauthorized_access_attempt',
  DATA_DELETION: 'data_deletion',
  BACKUP_INITIATED: 'backup_initiated',
  BACKUP_COMPLETED: 'backup_completed'
};

export const AuditSeverity = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

class AuditLogger {
  constructor() {
    this.sessionId = this._generateSessionId();
    this.userId = null;
  }

  /**
   * Protokolliert ein Audit-Event
   */
  async log(eventType, data = {}) {
    const auditEntry = {
      id: this._generateId(),
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      userId: this.userId || 'SYSTEM',
      eventType,
      severity: data.severity || AuditSeverity.LOW,
      source: data.source || 'web',
      description: data.description || '',
      targetResource: data.targetResource || null,
      metadata: {
        userAgent: navigator.userAgent,
        ipAddress: await this._getClientIP(),
        ...data.metadata
      },
      status: data.status || 'success',
      details: data.details || {}
    };

    await storageManager.addAuditLog(eventType, {
      ...auditEntry,
      severity: auditEntry.severity
    });

    // Log kritische Events auch auf der Konsole
    if (auditEntry.severity === AuditSeverity.CRITICAL || 
        auditEntry.severity === AuditSeverity.HIGH) {
      this._logToConsole(auditEntry);
    }

    return auditEntry;
  }

  /**
   * Protokolliert Login
   */
  async logLogin(userId, details = {}) {
    this.userId = userId;
    return this.log(AuditEventTypes.USER_LOGIN, {
      severity: AuditSeverity.MEDIUM,
      description: `Benutzer ${userId} angemeldet`,
      details: {
        userId,
        ...details
      }
    });
  }

  /**
   * Protokolliert Logout
   */
  async logLogout(details = {}) {
    const result = this.log(AuditEventTypes.USER_LOGOUT, {
      severity: AuditSeverity.MEDIUM,
      description: `Benutzer ${this.userId} abgemeldet`,
      details: {
        userId: this.userId,
        ...details
      }
    });
    this.userId = null;
    return result;
  }

  /**
   * Protokolliert Datenzugriff
   */
  async logDataAccess(resourceId, resourceType, details = {}) {
    return this.log(AuditEventTypes.DATA_VIEW, {
      severity: AuditSeverity.MEDIUM,
      description: `${resourceType} ${resourceId} zugegriffen`,
      targetResource: resourceId,
      details: {
        resourceType,
        ...details
      }
    });
  }

  /**
   * Protokolliert Datenfernexport
   */
  async logDataExport(resourceIds = [], format = 'json', details = {}) {
    return this.log(AuditEventTypes.DATA_EXPORT, {
      severity: AuditSeverity.HIGH,
      description: `${resourceIds.length} Ressourcen als ${format} exportiert`,
      details: {
        resourceCount: resourceIds.length,
        format,
        ...details
      }
    });
  }

  /**
   * Protokolliert Suchen
   */
  async logSearch(query, resultCount, details = {}) {
    return this.log(AuditEventTypes.DATA_SEARCH, {
      severity: AuditSeverity.LOW,
      description: `Suche durchgeführt: "${query}" (${resultCount} Ergebnisse)`,
      details: {
        query,
        resultCount,
        ...details
      }
    });
  }

  /**
   ProtokollIert Verschlüsslung
   */
  async logEncryption(driveId, action, details = {}) {
    const eventType = action === 'start' ? 
      AuditEventTypes.ENCRYPTION_STARTED : 
      action === 'complete' ?
      AuditEventTypes.ENCRYPTION_COMPLETED :
      AuditEventTypes.ENCRYPTION_FAILED;

    return this.log(eventType, {
      severity: AuditSeverity.HIGH,
      description: `Verschlüsselung auf ${driveId}: ${action}`,
      targetResource: driveId,
      details: {
        driveId,
        action,
        ...details
      }
    });
  }

  /**
   * Protokolliert Sicherheitsvorfälle
   */
  async logSecurityEvent(eventType, description, severity = AuditSeverity.HIGH, details = {}) {
    return this.log(eventType, {
      severity,
      description,
      details
    });
  }

  /**
   * Gibt alle Audit Logs zurück mit optionalem Filter
   */
  async getAuditLogs(filter = {}) {
    const logs = await storageManager.getItem(StorageKeys.AUDIT_LOG) || [];

    let filtered = logs;

    if (filter.userId) {
      filtered = filtered.filter(l => l.user === filter.userId);
    }

    if (filter.eventType) {
      filtered = filtered.filter(l => l.action === filter.eventType);
    }

    if (filter.severity) {
      filtered = filtered.filter(l => l.severity === filter.severity);
    }

    if (filter.startDate) {
      filtered = filtered.filter(l => new Date(l.ts) >= new Date(filter.startDate));
    }

    if (filter.endDate) {
      filtered = filtered.filter(l => new Date(l.ts) <= new Date(filter.endDate));
    }

    return filtered;
  }

  /**
   * Gibt Audit-Statistiken zurück
   */
  async getAuditStats() {
    const logs = await storageManager.getItem(StorageKeys.AUDIT_LOG) || [];

    const stats = {
      totalEntries: logs.length,
      entriesByType: {},
      entriesBySeverity: {},
      entriesByUser: {},
      lastEntry: logs[logs.length - 1] || null,
      dateRange: {
        from: logs.length > 0 ? logs[0].ts : null,
        to: logs.length > 0 ? logs[logs.length - 1].ts : null
      }
    };

    logs.forEach(log => {
      // By Type
      stats.entriesByType[log.action] = (stats.entriesByType[log.action] || 0) + 1;
      
      // By Severity
      stats.entriesBySeverity[log.severity] = (stats.entriesBySeverity[log.severity] || 0) + 1;
      
      // By User
      stats.entriesByUser[log.user] = (stats.entriesByUser[log.user] || 0) + 1;
    });

    return stats;
  }

  /**
   * Löscht alte Audit-Logs (älter als X Tage)
   */
  async deleteOldLogs(daysOld = 90) {
    const logs = await storageManager.getItem(StorageKeys.AUDIT_LOG) || [];
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const filteredLogs = logs.filter(l => new Date(l.ts) > cutoffDate);
    const deletedCount = logs.length - filteredLogs.length;

    await storageManager.setItem(StorageKeys.AUDIT_LOG, filteredLogs);

    return deletedCount;
  }

  /**
   * Generiert einen Audit-Report
   */
  async generateAuditReport(days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const logs = await this.getAuditLogs({ startDate });
    const stats = await this.getAuditStats();

    let report = `
╔════════════════════════════════════════════════════════╗
║   AUDIT LOG REPORT - ${days} TAGE                         ║
║   [STRENG GEHEIM] - NUR FÜR BEHÖRDEN                  ║
╚════════════════════════════════════════════════════════╝

Datum: ${new Date().toLocaleString('de-DE')}
Zeitraum: Letzte ${days} Tage

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ZUSAMMENFASSUNG
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Gesamt Log-Einträge:        ${logs.length}
Zeitraum Anfang:            ${startDate.toLocaleDateString('de-DE')}
Zeitraum Ende:              ${new Date().toLocaleDateString('de-DE')}

── KRITISCHE EVENTS ──
Kritische Ereignisse:       ${stats.entriesBySeverity.critical || 0}
Hochpriorit-Events:         ${stats.entriesBySeverity.high || 0}

── BENUTZERAKTIVITÄTEN ──
`;

    Object.entries(stats.entriesByUser).forEach(([user, count]) => {
      report += `${user.padEnd(30)} ${count} Aktionen\n`;
    });

    report += `
── EREIGNISTYPEN ──
`;

    Object.entries(stats.entriesByType)
      .sort((a, b) => b[1] - a[1])
      .forEach(([type, count]) => {
        report += `${type.padEnd(40)} ${count} mal\n`;
      });

    report += `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EMPFEHLUNGEN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✓ Überprüfen Sie regelmäßig kritische Events
✓ Überwachen Sie ungewöhnliche Zugriffsmuster
✓ Archivieren Sie Logs monatlich
✓ Sichern Sie diese Berichte verschlüsselt

Bericht erstellt: ${new Date().toISOString()}
═════════════════════════════════════════════════════════
`;

    return report;
  }

  // ============ Private Methoden ============

  _generateId() {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  _generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async _getClientIP() {
    // In echter Umgebung würde dies von Server kommen
    return 'CLIENT_IP';
  }

  _logToConsole(entry) {
    const color = entry.severity === AuditSeverity.CRITICAL ? 'color: red' : 'color: orange';
    console.warn(`%c[AUDIT] ${entry.eventType}`, color, entry);
  }
}

// Singleton
export const auditLogger = new AuditLogger();

export default AuditLogger;
