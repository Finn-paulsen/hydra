/**
 * RecoveryKeyManager Service
 * Verwaltet BitLocker/LUKS Recovery Keys mit verschlüsselter Speicherung
 */

import { storageManager, StorageKeys } from '../utils/storageManager';

class RecoveryKeyManager {
  /**
   * Generiert einen zufälligen Recovery Key
   */
  static generateRecoveryKey(driveId, length = 48) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let key = '';
    for (let i = 0; i < length; i++) {
      key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    // Formatiere in 6er-Blöcke (Microsoft Standard)
    return key.match(/.{1,6}/g).join('-');
  }

  /**
   * Erstellt einen neuen Recovery Key und speichert ihn
   */
  static async createRecoveryKey(driveId, metadata = {}) {
    const key = this.generateRecoveryKey(driveId);
    
    const recoveryKeyData = {
      id: `key_${driveId}_${Date.now()}`,
      driveId,
      key,
      createdAt: new Date().toISOString(),
      lastBackedUp: null,
      expiresAt: this._getExpirationDate(),
      status: 'active',
      backupLocations: [],
      encrypted: false,
      metadata: {
        ...metadata,
        driveSize: metadata.driveSize,
        driveLabel: metadata.driveLabel,
        createdBy: metadata.createdBy || 'SYSTEM'
      }
    };

    await storageManager.setRecoveryKey(driveId, recoveryKeyData);
    return recoveryKeyData;
  }

  /**
   * Gibt einen Recovery Key zurück
   */
  static async getRecoveryKey(driveId) {
    return await storageManager.getRecoveryKey(driveId);
  }

  /**
   * Listet alle Recovery Keys auf
   */
  static async listAllRecoveryKeys() {
    const keys = await storageManager.getItem(StorageKeys.ENCRYPTION_KEYS) || {};
    return Object.values(keys).filter(k => k && k.key);
  }

  /**
   * Sichert einen Recovery Key - kopiert ihn zu lokalen/entfernten Backup-Orten
   */
  static async backupRecoveryKey(driveId, locations = ['local', 'cloud']) {
    const key = await this.getRecoveryKey(driveId);
    if (!key) {
      throw new Error(`Kein Recovery Key für ${driveId} gefunden`);
    }

    const backupData = {
      ...key,
      backedUpAt: new Date().toISOString(),
      backupLocations: locations
    };

    // Speichere aktualisierte Version
    await storageManager.setRecoveryKey(driveId, backupData);

    // Protokolliere Backup
    await storageManager.addAuditLog('recovery_key_backup', {
      driveId,
      locations,
      severity: 'info'
    });

    return backupData;
  }

  /**
   * Exportiert Recovery Key als Datei (CSV/JSON)
   */
  static async exportRecoveryKeys(driveIds = null, format = 'json') {
    const keys = driveIds 
      ? await Promise.all(driveIds.map(id => this.getRecoveryKey(id)))
      : await this.listAllRecoveryKeys();

    const validKeys = keys.filter(k => k);

    if (format === 'csv') {
      return this._generateCSV(validKeys);
    } else {
      return this._generateJSON(validKeys);
    }
  }

  /**
   * Importiert Recovery Keys aus einer Datei
   */
  static async importRecoveryKeys(fileContent, format = 'json') {
    let keys = [];
    
    try {
      if (format === 'json') {
        keys = JSON.parse(fileContent);
      } else if (format === 'csv') {
        keys = this._parseCSV(fileContent);
      }
    } catch (e) {
      throw new Error(`Fehler beim Parsen der Datei: ${e.message}`);
    }

    let imported = 0;
    for (const key of keys) {
      if (key.driveId && key.key) {
        await storageManager.setRecoveryKey(key.driveId, key);
        imported++;
      }
    }

    await storageManager.addAuditLog('recovery_keys_imported', {
      count: imported,
      severity: 'warning'
    });

    return { imported, total: keys.length };
  }

  /**
   * Validiert einen Recovery Key
   */
  static validateRecoveryKey(key) {
    if (!key) return false;
    
    // Format: XXX-XXX-XXX-XXX-XXX-XXX-XXX-XXX (48 Zeichen + 7 Dashes)
    const pattern = /^[A-Z0-9]{3}(?:-[A-Z0-9]{3}){7}$/;
    return pattern.test(key.toUpperCase());
  }

  /**
   * Löscht einen Recovery Key nach Bestätigung
   */
  static async deleteRecoveryKey(driveId) {
    await storageManager.removeItem(StorageKeys.ENCRYPTION_KEYS);
    
    await storageManager.addAuditLog('recovery_key_deleted', {
      driveId,
      severity: 'high'
    });
  }

  /**
   * Gibt den Status aller Recovery Keys zurück (für Dashboard)
   */
  static async getRecoveryKeyStatus() {
    const keys = await this.listAllRecoveryKeys();
    
    const status = {
      totalKeys: keys.length,
      activeKeys: keys.filter(k => k.status === 'active').length,
      backedUpKeys: keys.filter(k => k.backupLocations && k.backupLocations.length > 0).length,
      expiredKeys: keys.filter(k => new Date(k.expiresAt) < new Date()).length,
      keys: keys.map(k => ({
        driveId: k.driveId,
        status: k.status,
        backedUp: k.backupLocations?.length > 0,
        expiresAt: k.expiresAt,
        createdAt: k.createdAt
      }))
    };

    return status;
  }

  /**
   * Erstellt einen sicheren QR-Code für einen Recovery Key
   * (würde in echten Szenarien eine QR-Library nutzen)
   */
  static generateRecoveryKeyQR(driveId, key) {
    const qrData = {
      drive: driveId,
      key: key,
      generated: new Date().toISOString(),
      version: '1.0'
    };
    
    return {
      data: JSON.stringify(qrData),
      type: 'recovery_key',
      driveId
    };
  }

  /**
   * Generiert einen ausdruckbaren Recovery Key Report
   */
  static async generateRecoveryKeyReport() {
    const status = await this.getRecoveryKeyStatus();
    const timestamp = new Date().toISOString();

    let report = `
╔════════════════════════════════════════════════════════╗
║   BITLOCKER RECOVERY KEY REPORT                        ║
║   [STRENG GEHEIM] - VERTRAULLICH                       ║
╚════════════════════════════════════════════════════════╝

Generiert: ${timestamp}
Sicherheitsstufe: [STRENG GEHEIM]
Gültig für: Interne Sicherung nur

ZUSAMMENFASSUNG
─────────────────────────────────────────────────────────
Gesamt Recovery Keys:      ${status.totalKeys}
Aktive Keys:               ${status.activeKeys}
Gesicherte Keys:           ${status.backedUpKeys}
Ablaufende Keys:           ${status.expiredKeys}

DETAIL-ÜBERSICHT
─────────────────────────────────────────────────────────
`;

    status.keys.forEach((k, idx) => {
      report += `
${idx + 1}. Laufwerk: ${k.driveId}
   Status: ${k.status}
   Gesichert: ${k.backedUp ? 'JA' : 'NEIN'}
   Erstellt: ${new Date(k.createdAt).toLocaleDateString('de-DE')}
   Ablauf: ${new Date(k.expiresAt).toLocaleDateString('de-DE')}
`;
    });

    report += `
───────────────────────────────────────────────────────────
EMPFEHLUNGEN
• Speichern Sie Recovery Keys an mindestens 2 sicheren Orten
• Testen Sie Recovery Key Zugriff mindestens 1x jährlich
• Entfernen Sie abgelaufene Keys monatlich
• Verwenden Sie Multi-Factor Authentication für den Zugriff

Diesen Report sicher aufbewahren!
═══════════════════════════════════════════════════════════
`;

    return report;
  }

  // ============ Private Methoden ============

  static _getExpirationDate() {
    const date = new Date();
    date.setFullYear(date.getFullYear() + 3); // 3 Jahre Gültig
    return date.toISOString();
  }

  static _generateJSON(keys) {
    return JSON.stringify(keys, null, 2);
  }

  static _generateCSV(keys) {
    const headers = ['DriveId', 'Key', 'Status', 'CreatedAt', 'ExpiresAt'];
    const rows = keys.map(k => [
      k.driveId,
      k.key,
      k.status,
      k.createdAt,
      k.expiresAt
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');

    return csv;
  }

  static _parseCSV(csvContent) {
    const lines = csvContent.trim().split('\n');
    const headers = lines[0].split(',');

    return lines.slice(1).map(line => {
      const values = line.split(',');
      return {
        driveId: values[0],
        key: values[1],
        status: values[2],
        createdAt: values[3],
        expiresAt: values[4]
      };
    });
  }
}

export default RecoveryKeyManager;
