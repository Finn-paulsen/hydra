// Audit-Log für Benutzeraktionen (verbessert)
// Speichert Log-Einträge im localStorage mit Rotation & Metadaten

const AUDIT_KEY = 'gov_auditlog_v1';
const MAX_LOG_ENTRIES = 500; // Log-Rotation wie in XP-Ereignisanzeige

export const AuditActions = {
  CREATE: 'create',
  EDIT: 'edit',
  DELETE: 'delete',
  LOGIN: 'login',
  LOGOUT: 'logout',
  RESET_PASSWORD: 'reset-password',
  CHANGE_CLEARANCE: 'change-clearance',
  DISABLE_ACCOUNT: 'disable-account'
};

export function writeAuditLog({ action, user, targetUser = null, info = null, severity = "info" }) {
  const entry = {
    ts: new Date().toISOString(),
    action,
    user,
    targetUser,
    info,
    severity,
    module: "UserManagement",
    ip: getClientIP(),
    ua: navigator.userAgent
  };

  const cur = getAuditLog();
  cur.push(entry);

  // Log-Rotation
  if (cur.length > MAX_LOG_ENTRIES) {
    cur.splice(0, cur.length - MAX_LOG_ENTRIES);
  }

  try {
    localStorage.setItem(AUDIT_KEY, JSON.stringify(cur));
  } catch (e) {
    console.warn("Audit-Log konnte nicht gespeichert werden:", e);
  }
}

export function getAuditLog() {
  try {
    return JSON.parse(localStorage.getItem(AUDIT_KEY)) || [];
  } catch {
    return [];
  }
}

export function clearAuditLog() {
  localStorage.removeItem(AUDIT_KEY);
}

// Dummy-IP (kannst du später ersetzen)
function getClientIP() {
  return "127.0.0.1";
}
