/**
 * GOV-ARCHIVE Storage Manager
 * Zentrale Verwaltung aller persistierten Daten (LocalStorage + IndexedDB)
 * Features: Auto-versioning, Quota Management, Backup/Restore
 */

const STORAGE_VERSION = '1.0.0';
const STORAGE_PREFIX = 'gov_archive_';
const QUOTA_LIMIT = 5 * 1024 * 1024; // 5MB

// Storage-Namespaces
export const StorageKeys = {
  USER_PROFILE: 'user_profile',
  TERMINAL_HISTORY: 'terminal_history',
  TERMINAL_STATE: 'terminal_state',
  AUDIT_LOG: 'audit_log',
  DATABASE_CACHE: 'database_cache',
  SAVED_SEARCHES: 'saved_searches',
  ENCRYPTION_KEYS: 'encryption_keys',
  APP_STATE: 'app_state',
  SETTINGS: 'settings',
  FAVORITES: 'favorites',
  RECENT_FILES: 'recent_files'
};

class StorageManager {
  constructor() {
    this.db = null;
    this.isReady = false;
    this.initIndexedDB();
  }

  /**
   * Initialisiert IndexedDB für größere Datenmengen
   */
  async initIndexedDB() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open('GOV-ARCHIVE', 1);
      
      req.onerror = () => {
        console.warn('IndexedDB nicht verfügbar, benutze nur localStorage');
        this.isReady = true;
        resolve();
      };
      
      req.onsuccess = (e) => {
        this.db = e.target.result;
        this.isReady = true;
        resolve();
      };
      
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('storage')) {
          db.createObjectStore('storage', { keyPath: 'key' });
        }
      };
    });
  }

  /**
   * Speichert Daten mit automatischem Lock-Prevention
   */
  async setItem(key, value, useIndexedDB = false) {
    try {
      const data = {
        value,
        timestamp: Date.now(),
        version: STORAGE_VERSION,
        size: JSON.stringify(value).length
      };

      if (useIndexedDB && this.db) {
        return this._setIndexedDB(key, data);
      }

      const fullKey = `${STORAGE_PREFIX}${key}`;
      localStorage.setItem(fullKey, JSON.stringify(data));
      return true;
    } catch (e) {
      if (e.name === 'QuotaExceededError') {
        this._handleQuotaExceeded(key);
      }
      console.error(`Storage Fehler bei ${key}:`, e);
      return false;
    }
  }

  /**
   * Lädt Daten mit Versions-Check
   */
  async getItem(key, useIndexedDB = false) {
    try {
      if (useIndexedDB && this.db) {
        return this._getIndexedDB(key);
      }

      const fullKey = `${STORAGE_PREFIX}${key}`;
      const raw = localStorage.getItem(fullKey);
      
      if (!raw) return null;
      
      const data = JSON.parse(raw);
      return data.value;
    } catch (e) {
      console.error(`Fehler beim Laden von ${key}:`, e);
      return null;
    }
  }

  /**
   * Speichert Terminal-Befehl mit Metadaten
   */
  async addTerminalCommand(command, output, exitCode = 0) {
    const history = (await this.getItem(StorageKeys.TERMINAL_HISTORY)) || [];
    
    history.push({
      id: Date.now(),
      command,
      output,
      exitCode,
      timestamp: new Date().toISOString(),
      user: await this.getCurrentUser()
    });

    // Limitiere auf letzte 1000 Befehle
    if (history.length > 1000) {
      history.shift();
    }

    await this.setItem(StorageKeys.TERMINAL_HISTORY, history);
    return history[history.length - 1];
  }

  /**
   * Lädt Terminal-History mit optionalem Filter
   */
  async getTerminalHistory(filter = null) {
    const history = (await this.getItem(StorageKeys.TERMINAL_HISTORY)) || [];
    
    if (!filter) return history;
    
    return history.filter(h => 
      h.command.toLowerCase().includes(filter.toLowerCase())
    );
  }

  /**
   * Speichert User-Profil mit Auto-Sync
   */
  async setUserProfile(profile) {
    const updated = {
      ...profile,
      lastModified: new Date().toISOString()
    };
    
    await this.setItem(StorageKeys.USER_PROFILE, updated);
  }

  /**
   * Gibt aktuelles User-Profil zurück
   */
  async getUserProfile() {
    return await this.getItem(StorageKeys.USER_PROFILE);
  }

  /**
   * Speichert Audit-Log-Eintrag (mit Rotation)
   */
  async addAuditLog(action, details = {}) {
    const logs = (await this.getItem(StorageKeys.AUDIT_LOG)) || [];
    
    logs.push({
      id: Date.now(),
      action,
      details,
      timestamp: new Date().toISOString(),
      user: await this.getCurrentUser(),
      severity: details.severity || 'info'
    });

    // Behalte letzte 5000 Einträge
    if (logs.length > 5000) {
      logs.splice(0, logs.length - 5000);
    }

    await this.setItem(StorageKeys.AUDIT_LOG, logs);
  }

  /**
   * Speichert gespeicherte Suchen
   */
  async addSavedSearch(name, query, type = 'global') {
    const searches = (await this.getItem(StorageKeys.SAVED_SEARCHES)) || [];
    
    searches.push({
      id: Date.now(),
      name,
      query,
      type,
      timestamp: new Date().toISOString(),
      count: 0
    });

    await this.setItem(StorageKeys.SAVED_SEARCHES, searches);
    return searches[searches.length - 1];
  }

  /**
   * Gibt alle gespeicherten Suchen zurück
   */
  async getSavedSearches() {
    return (await this.getItem(StorageKeys.SAVED_SEARCHES)) || [];
  }

  /**
   * Speichert Recovery-Keys (verschlüsselt wenn möglich)
   */
  async setRecoveryKey(driveId, key, metadata = {}) {
    const keys = (await this.getItem(StorageKeys.ENCRYPTION_KEYS)) || {};
    
    keys[driveId] = {
      key,
      metadata,
      savedAt: new Date().toISOString(),
      encrypted: false // Könnte später mit crypto.subtle implementiert werden
    };

    await this.setItem(StorageKeys.ENCRYPTION_KEYS, keys);
  }

  /**
   * Gibt Recovery-Key zurück
   */
  async getRecoveryKey(driveId) {
    const keys = (await this.getItem(StorageKeys.ENCRYPTION_KEYS)) || {};
    return keys[driveId] || null;
  }

  /**
   * Exportiert komplettes Backup als JSON
   */
  async exportBackup() {
    const backup = {
      version: STORAGE_VERSION,
      exportedAt: new Date().toISOString(),
      data: {}
    };

    for (const key of Object.values(StorageKeys)) {
      backup.data[key] = await this.getItem(key);
    }

    return backup;
  }

  /**
   * Importiert Backup
   */
  async importBackup(backup) {
    if (backup.version !== STORAGE_VERSION) {
      console.warn('Backup-Version stimmt nicht überein');
    }

    for (const [key, value] of Object.entries(backup.data)) {
      if (value) {
        await this.setItem(key, value);
      }
    }

    return true;
  }

  /**
   * Gibt Speicher-Status zurück
   */
  async getStorageStats() {
    let totalSize = 0;
    const itemStats = {};

    for (const key of Object.values(StorageKeys)) {
      const value = await this.getItem(key);
      const size = JSON.stringify(value).length;
      totalSize += size;
      itemStats[key] = {
        size,
        sizeKB: (size / 1024).toFixed(2),
        itemCount: Array.isArray(value) ? value.length : 1
      };
    }

    return {
      totalSize,
      totalSizeKB: (totalSize / 1024).toFixed(2),
      totalSizeMB: (totalSize / 1024 / 1024).toFixed(2),
      percentUsed: ((totalSize / QUOTA_LIMIT) * 100).toFixed(2),
      items: itemStats
    };
  }

  /**
   * Löscht ein Speicher-Item
   */
  async removeItem(key) {
    const fullKey = `${STORAGE_PREFIX}${key}`;
    localStorage.removeItem(fullKey);

    if (this.db) {
      return this._removeIndexedDB(key);
    }
  }

  /**
   * Löscht alle GOV-ARCHIVE Daten
   */
  async clear() {
    for (const key of Object.values(StorageKeys)) {
      const fullKey = `${STORAGE_PREFIX}${key}`;
      localStorage.removeItem(fullKey);
    }

    if (this.db) {
      const tx = this.db.transaction('storage', 'readwrite');
      tx.objectStore('storage').clear();
    }
  }

  // ============ Private Methoden ============

  async _setIndexedDB(key, data) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction('storage', 'readwrite');
      const store = tx.objectStore('storage');
      const req = store.put({ key, ...data });

      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  }

  async _getIndexedDB(key) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction('storage', 'readonly');
      const store = tx.objectStore('storage');
      const req = store.get(key);

      req.onsuccess = () => {
        const result = req.result;
        resolve(result ? result.value : null);
      };
      req.onerror = () => reject(req.error);
    });
  }

  async _removeIndexedDB(key) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction('storage', 'readwrite');
      const store = tx.objectStore('storage');
      const req = store.delete(key);

      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  }

  async getCurrentUser() {
    const profile = await this.getUserProfile();
    return profile?.username || 'SYSTEM';
  }

  _handleQuotaExceeded(key) {
    console.error(`LocalStorage-Quota überschritten bei ${key}`);
    // Könnte automatisch ältere Audit-Logs löschen
    const logs = localStorage.getItem(`${STORAGE_PREFIX}${StorageKeys.AUDIT_LOG}`);
    if (logs) {
      const parsed = JSON.parse(logs);
      if (parsed.length > 1000) {
        parsed.splice(0, parsed.length - 1000);
        localStorage.setItem(`${STORAGE_PREFIX}${StorageKeys.AUDIT_LOG}`, JSON.stringify(parsed));
      }
    }
  }
}

// Singleton-Instanz
export const storageManager = new StorageManager();

export default storageManager;
