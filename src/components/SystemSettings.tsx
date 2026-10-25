import React, { useState } from 'react';
import './SystemSettings.css';

/**
 * SystemSettings Component
 * Innere Schicht - Systemkonfiguration und Einstellungen
 * Benutzer-Management, Netzwerk-Konfiguration, Sicherheitseinstellungen
 */

export default function SystemSettings() {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([
    { id: 1, username: 'deepagent', role: 'ADMIN', status: 'ACTIVE', lastLogin: '2024-05-03 14:32' },
    { id: 2, username: 'analyst_01', role: 'ANALYST', status: 'ACTIVE', lastLogin: '2024-05-03 10:15' },
    { id: 3, username: 'monitor_sys', role: 'MONITOR', status: 'IDLE', lastLogin: '2024-05-02 23:45' },
    { id: 4, username: 'archive_bot', role: 'SERVICE', status: 'ACTIVE', lastLogin: '2024-05-03 14:28' },
  ]);

  const [networkConfig, setNetworkConfig] = useState({
    hostname: 'GOV-ARCHIVE-TERMINAL-01',
    ipAddress: '192.168.1.50',
    gateway: '192.168.1.1',
    dns1: '8.8.8.8',
    dns2: '8.8.4.4',
    encryption: 'AES-256-GCM',
    firewallStatus: 'ENABLED',
  });

  const [securitySettings, setSecuritySettings] = useState({
    passwordPolicy: 'STRICT',
    mfaRequired: true,
    sessionTimeout: '30 minutes',
    auditLogging: 'ENABLED',
    dataEncryption: 'ENABLED',
    backupSchedule: 'DAILY',
  });

  const [newUser, setNewUser] = useState({ username: '', role: 'ANALYST' });
  const [showAddUser, setShowAddUser] = useState(false);

  const handleAddUser = () => {
    if (newUser.username.trim()) {
      setUsers([...users, {
        id: users.length + 1,
        username: newUser.username,
        role: newUser.role,
        status: 'ACTIVE',
        lastLogin: 'Never',
      }]);
      setNewUser({ username: '', role: 'ANALYST' });
      setShowAddUser(false);
    }
  };

  const handleDeleteUser = (id) => {
    setUsers(users.filter(u => u.id !== id));
  };

  const handleNetworkChange = (field, value) => {
    setNetworkConfig({ ...networkConfig, [field]: value });
  };

  const handleSecurityChange = (field, value) => {
    setSecuritySettings({ ...securitySettings, [field]: value });
  };

  return (
    <div className="system-settings">
      <div className="settings-header">
        <h2>SYSTEM SETTINGS & CONFIGURATION</h2>
        <span className="settings-status">CONFIGURATION MODE: ENABLED</span>
      </div>

      {/* Tab Navigation */}
      <div className="settings-tabs">
        <button
          className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          USER MANAGEMENT
        </button>
        <button
          className={`tab-btn ${activeTab === 'network' ? 'active' : ''}`}
          onClick={() => setActiveTab('network')}
        >
          NETWORK CONFIG
        </button>
        <button
          className={`tab-btn ${activeTab === 'security' ? 'active' : ''}`}
          onClick={() => setActiveTab('security')}
        >
          SECURITY
        </button>
      </div>

      {/* User Management Tab */}
      {activeTab === 'users' && (
        <div className="tab-content">
          <div className="content-header">
            <h3>USER ACCOUNTS</h3>
            <button className="add-btn" onClick={() => setShowAddUser(!showAddUser)}>
              {showAddUser ? '✕ CANCEL' : '+ ADD USER'}
            </button>
          </div>

          {showAddUser && (
            <div className="add-user-form">
              <input
                type="text"
                placeholder="Username"
                value={newUser.username}
                onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
              />
              <select
                value={newUser.role}
                onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
              >
                <option>ADMIN</option>
                <option>ANALYST</option>
                <option>MONITOR</option>
                <option>SERVICE</option>
              </select>
              <button className="create-btn" onClick={handleAddUser}>CREATE</button>
            </div>
          )}

          <table className="users-table">
            <thead>
              <tr>
                <th>USERNAME</th>
                <th>ROLE</th>
                <th>STATUS</th>
                <th>LAST LOGIN</th>
                <th>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td>{user.username}</td>
                  <td><span className="role-badge">{user.role}</span></td>
                  <td><span className={`status-badge ${user.status.toLowerCase()}`}>{user.status}</span></td>
                  <td>{user.lastLogin}</td>
                  <td>
                    <button className="action-btn delete-btn" onClick={() => handleDeleteUser(user.id)}>
                      DELETE
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Network Configuration Tab */}
      {activeTab === 'network' && (
        <div className="tab-content">
          <h3>NETWORK CONFIGURATION</h3>
          <div className="config-grid">
            <div className="config-item">
              <label>HOSTNAME</label>
              <input
                type="text"
                value={networkConfig.hostname}
                onChange={(e) => handleNetworkChange('hostname', e.target.value)}
              />
            </div>
            <div className="config-item">
              <label>IP ADDRESS</label>
              <input
                type="text"
                value={networkConfig.ipAddress}
                onChange={(e) => handleNetworkChange('ipAddress', e.target.value)}
              />
            </div>
            <div className="config-item">
              <label>GATEWAY</label>
              <input
                type="text"
                value={networkConfig.gateway}
                onChange={(e) => handleNetworkChange('gateway', e.target.value)}
              />
            </div>
            <div className="config-item">
              <label>DNS PRIMARY</label>
              <input
                type="text"
                value={networkConfig.dns1}
                onChange={(e) => handleNetworkChange('dns1', e.target.value)}
              />
            </div>
            <div className="config-item">
              <label>DNS SECONDARY</label>
              <input
                type="text"
                value={networkConfig.dns2}
                onChange={(e) => handleNetworkChange('dns2', e.target.value)}
              />
            </div>
            <div className="config-item">
              <label>ENCRYPTION</label>
              <select
                value={networkConfig.encryption}
                onChange={(e) => handleNetworkChange('encryption', e.target.value)}
              >
                <option>AES-256-GCM</option>
                <option>AES-192-GCM</option>
                <option>AES-128-GCM</option>
              </select>
            </div>
            <div className="config-item">
              <label>FIREWALL</label>
              <select
                value={networkConfig.firewallStatus}
                onChange={(e) => handleNetworkChange('firewallStatus', e.target.value)}
              >
                <option>ENABLED</option>
                <option>DISABLED</option>
              </select>
            </div>
          </div>
          <button className="save-btn">APPLY CONFIGURATION</button>
        </div>
      )}

      {/* Security Settings Tab */}
      {activeTab === 'security' && (
        <div className="tab-content">
          <h3>SECURITY SETTINGS</h3>
          <div className="security-grid">
            <div className="security-item">
              <label>PASSWORD POLICY</label>
              <select
                value={securitySettings.passwordPolicy}
                onChange={(e) => handleSecurityChange('passwordPolicy', e.target.value)}
              >
                <option>STRICT</option>
                <option>STANDARD</option>
                <option>RELAXED</option>
              </select>
            </div>
            <div className="security-item">
              <label>MULTI-FACTOR AUTH</label>
              <select
                value={securitySettings.mfaRequired ? 'REQUIRED' : 'OPTIONAL'}
                onChange={(e) => handleSecurityChange('mfaRequired', e.target.value === 'REQUIRED')}
              >
                <option>REQUIRED</option>
                <option>OPTIONAL</option>
              </select>
            </div>
            <div className="security-item">
              <label>SESSION TIMEOUT</label>
              <select
                value={securitySettings.sessionTimeout}
                onChange={(e) => handleSecurityChange('sessionTimeout', e.target.value)}
              >
                <option>15 minutes</option>
                <option>30 minutes</option>
                <option>60 minutes</option>
                <option>NO TIMEOUT</option>
              </select>
            </div>
            <div className="security-item">
              <label>AUDIT LOGGING</label>
              <select
                value={securitySettings.auditLogging}
                onChange={(e) => handleSecurityChange('auditLogging', e.target.value)}
              >
                <option>ENABLED</option>
                <option>DISABLED</option>
              </select>
            </div>
            <div className="security-item">
              <label>DATA ENCRYPTION</label>
              <select
                value={securitySettings.dataEncryption}
                onChange={(e) => handleSecurityChange('dataEncryption', e.target.value)}
              >
                <option>ENABLED</option>
                <option>DISABLED</option>
              </select>
            </div>
            <div className="security-item">
              <label>BACKUP SCHEDULE</label>
              <select
                value={securitySettings.backupSchedule}
                onChange={(e) => handleSecurityChange('backupSchedule', e.target.value)}
              >
                <option>HOURLY</option>
                <option>DAILY</option>
                <option>WEEKLY</option>
                <option>MONTHLY</option>
              </select>
            </div>
          </div>
          <button className="save-btn">SAVE SECURITY SETTINGS</button>
        </div>
      )}
    </div>
  );
}
