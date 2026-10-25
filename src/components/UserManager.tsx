import React, { useState, useRef } from "react";
// ...existing imports...

// Group membership modal state
// (hooks are declared after the main import below)
import Toast from "./Toast";
import LoadingOverlay from "./LoadingOverlay";
import { GROUPS_LIST, generateUserData, type UserRecord } from "../utils/userData";
import { getUsers, setUsers, addUser, updateUser, deleteUser } from "../utils/userStore";



import GovUserEditor, { type GovUserForm } from "./GovUserEditor";
import CriticalActionModal from "./CriticalActionModal";
import GroupEditModal from "./GroupEditModal";
import { writeAuditLog, getAuditLog, type AuditEntry } from "../utils/auditLog";
import './UserManager.css';
import './ldapSync.css';



type ManagedUser = UserRecord & {
  role?: string;
  lastLogin?: string;
  lastChangedBy?: string;
  loginAttempts?: number;
  mustChangePassword?: boolean;
  cannotChangePassword?: boolean;
  passwordNeverExpires?: boolean;
  accountDisabled?: boolean;
};

interface ToastState {
  text: string;
  type: string;
}

interface UserManagerProps {
  onRequestClose?: { ref?: React.Ref<{ canClose: () => boolean; dirty: boolean }> };
}

export default function UserManager({ onRequestClose }: UserManagerProps) {
      // Group membership modal state
      const [showGroupEditModal, setShowGroupEditModal] = useState(false);
      const [editingGroupId, setEditingGroupId] = useState<string | null>(null);

      function handleEditGroup(groupId: string) {
        setEditingGroupId(groupId);
        setShowGroupEditModal(true);
      }

      function handleSaveGroupMembers(selectedUserIds: string[]) {
        // Remove group from all users, then add to selected
        const groupId = editingGroupId as string;
        const updated = users.map(u =>
          selectedUserIds.includes(u.id)
            ? { ...u, group: groupId, groupName: GROUPS_LIST.find(g => g.id === groupId)?.name as string }
            : (u.group === groupId ? { ...u, group: '', groupName: '' } : u)
        );
        setUsers(updated);
        setUsersState(updated);
        setShowGroupEditModal(false);
        setEditingGroupId(null);
        setToast({ text: 'Mitglieder aktualisiert.', type: 'success' });
        setTimeout(() => setToast(null), 1800);
      }
    // Export/Import
    const fileInputRef = useRef<HTMLInputElement>(null);

    function exportUsersCSV() {
      const replacer = (key: string, value: unknown) => value === null ? '' : value;
      const header = ["name","username","groupName","status","permissions","lastLogin","loginAttempts"];
      const csv = [header.join(",")].concat(
        users.map(u => header.map(field => {
          let val = (u as unknown as Record<string, unknown>)[field];
          if (Array.isArray(val)) return '"' + val.join(';') + '"';
          if (typeof val === 'string' && val.includes(',')) return '"' + val + '"';
          return val ?? '';
        }).join(","))
      ).join("\r\n");
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'benutzerliste.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    function handleImportClick() {
      fileInputRef.current?.click();
    }

    function importUsersCSV(e: React.ChangeEvent<HTMLInputElement>) {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = function(evt) {
        const text = evt.target?.result as string;
        const lines = text.split(/\r?\n/).filter(Boolean);
        const [header, ...rows] = lines;
        const fields = header.split(',');
        const imported = rows.map((row): ManagedUser => {
          const vals = row.split(',');
          const obj: Record<string, string | string[]> = {};
          fields.forEach((f, i) => {
            let v: string | string[] = vals[i] || '';
            if (f === 'permissions') v = v.replace(/"/g, '').split(';').filter(Boolean);
            obj[f] = v;
          });
          obj.id = Math.random().toString(36).slice(2, 10);
          obj.created = new Date().toISOString().split('T')[0];
          return obj as unknown as ManagedUser;
        });
        setUsersState(prev => [...prev, ...imported]);
        setUsers([...users, ...imported]);
        setToast({ text: `Import erfolgreich: ${imported.length} Benutzer.`, type: 'success' });
        setTimeout(() => setToast(null), 1800);
      };
      reader.readAsText(file);
      e.target.value = '';
    }
  const [users, setUsersState] = useState<ManagedUser[]>([]);
  const [tab, setTab] = useState('users');
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [ldapSyncing, setLdapSyncing] = useState(false);
  const [ldapProgress, setLdapProgress] = useState(0);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [editing, setEditing] = useState<ManagedUser | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showNewUserModal, setShowNewUserModal] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [showCriticalModal, setShowCriticalModal] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  React.useEffect(() => {
    let active = true;
    getUsers().then(list => { if (active) setUsersState(list as ManagedUser[]); });
    return () => { active = false; };
  }, []);

  React.useEffect(() => {
    if (tab === 'audit') {
      setAuditLog(getAuditLog().slice().reverse());
    }
  }, [tab, users]);

  function handleEdit(user: ManagedUser) {
    setEditing({ ...user });
    setShowEditModal(true);
  }
  const [showCriticalRightsModal, setShowCriticalRightsModal] = useState(false);
  const [pendingRightsEdit, setPendingRightsEdit] = useState<ManagedUser | null>(null);

  function handleSaveEdit(form: GovUserForm) {
    const editedUser = form as ManagedUser;
    // If rights or role changed, require confirmation
    const original = users.find(u => u.id === editedUser.id);
    if (original && (original.role !== editedUser.role || JSON.stringify(original.permissions) !== JSON.stringify(editedUser.permissions))) {
      setPendingRightsEdit(editedUser);
      setShowCriticalRightsModal(true);
      return;
    }
    doSaveEdit(editedUser);
  }

  function doSaveEdit(editedUser: ManagedUser) {
    const updated = users.map(u => u.id === editedUser.id ? editedUser : u);
    setUsers(updated);
    setUsersState(updated);
    void updateUser(editedUser);
    writeAuditLog({ action: 'edit', user: 'admin', targetUser: editedUser.username });
    setEditing(null);
    setShowEditModal(false);
    setDirty(true);
  }

  function handleConfirmRightsEdit() {
    if (pendingRightsEdit) {
      doSaveEdit(pendingRightsEdit);
      setPendingRightsEdit(null);
      setShowCriticalRightsModal(false);
    }
  }

  function handleCancelRightsCritical() {
    setPendingRightsEdit(null);
    setShowCriticalRightsModal(false);
  }

  const [showCriticalPwModal, setShowCriticalPwModal] = useState(false);
  const [pendingPwUser, setPendingPwUser] = useState<ManagedUser | null>(null);

  function handlePasswordReset(user: ManagedUser) {
    setPendingPwUser(user);
    setShowCriticalPwModal(true);
  }

  function handleConfirmPwReset() {
    // Optionally: validate password/token here
    const user = pendingPwUser!;
    setToast({ text: `Passwort für ${user.username} wurde zurückgesetzt.`, type: 'success' });
    writeAuditLog({ action: 'reset-password', user: 'admin', targetUser: user.username });
    setTimeout(() => setToast(null), 1800);
    setShowCriticalPwModal(false);
    setPendingPwUser(null);
  }

  function handleCancelPwCritical() {
    setShowCriticalPwModal(false);
    setPendingPwUser(null);
  }
  function handleDelete(id: string) {
    setPendingDeleteId(id);
    setShowCriticalModal(true);
  }

  function handleConfirmDelete() {
    // Optionally: validate password/token here
    const id = pendingDeleteId;
    const userToDelete = users.find(u => u.id === id);
    const updated = users.filter(u => u.id !== id);
    setUsers(updated);
    setUsersState(updated);
    void deleteUser(id as string);
    writeAuditLog({ action: 'delete', user: 'admin', targetUser: userToDelete?.username });
    setDirty(true);
    setShowCriticalModal(false);
    setPendingDeleteId(null);
    setToast({ text: `Benutzer ${userToDelete?.username} gelöscht.`, type: 'success' });
    setTimeout(() => setToast(null), 1800);
  }

  function handleCancelCritical() {
    setShowCriticalModal(false);
    setPendingDeleteId(null);
  }
  async function handleNewUser(formData: GovUserForm) {
    const newUserData = formData as GovUserForm & { group?: string };
    const user = {
      ...newUserData,
      id: Math.random().toString(36).slice(2, 10),
      groupName: GROUPS_LIST.find(g => g.id === newUserData.group)?.name,
      permissions: newUserData.role === 'Admin' ? ['read', 'write', 'delete', 'manage'] : ['read', 'write'],
      created: new Date().toISOString().split('T')[0],
    } as UserRecord;
    await addUser(user);
    setUsersState((await getUsers()) as ManagedUser[]);
    writeAuditLog({ action: 'create', user: 'admin', targetUser: user.username });
    setShowNewUserModal(false);
    setDirty(true);
  }

  const [showCriticalLdapModal, setShowCriticalLdapModal] = useState(false);
  const [pendingLdap, setPendingLdap] = useState(false);

  function handleLdapSync() {
    setPendingLdap(true);
    setShowCriticalLdapModal(true);
  }

  async function handleConfirmLdapSync() {
    setShowCriticalLdapModal(false);
    setPendingLdap(false);
    writeAuditLog({ action: 'ldap-sync', user: 'admin' });
    // Simuliere: Immer Sync durchführen, unabhängig von Änderungen
    const synced = await generateUserData(10);
    const all: ManagedUser[] = [...synced];
    users.forEach(u => {
      if (!all.some(su => su.username === u.username)) all.push(u);
    });
    setLdapSyncing(true);
    setLdapProgress(0);
    // Simulierter Fortschritt
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 18 + 7;
      setLdapProgress(Math.min(progress, 100));
      if (progress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          setUsersState(all);
          setUsers(all);
          setLdapSyncing(false);
          setDirty(false);
          setLdapProgress(0);
        }, 400);
      }
    }, 220);
  }

  function handleCancelLdapCritical() {
    setShowCriticalLdapModal(false);
    setPendingLdap(false);
  }

  // Callback für FensterManager, um zu prüfen, ob geschlossen werden darf
  React.useImperativeHandle(onRequestClose?.ref, () => ({
    canClose: () => !dirty,
    dirty,
  }), [dirty]);

  // Hilfsfunktion: Browser/OS aus User-Agent extrahieren
  function parseUserAgent(ua?: string | null) {
    if (!ua) return "-";
    // Einfache Extraktion: Browser und OS
    let browser = "";
    let os = "";
    if (ua.includes("Chrome")) browser = "Chrome";
    else if (ua.includes("Firefox")) browser = "Firefox";
    else if (ua.includes("Safari") && !ua.includes("Chrome")) browser = "Safari";
    else if (ua.includes("Edge")) browser = "Edge";
    else if (ua.includes("Trident") || ua.includes("MSIE")) browser = "IE";
    else browser = ua.split("/")[0];
    if (ua.includes("Windows NT 10")) os = "Windows 10";
    else if (ua.includes("Windows NT 6.1")) os = "Windows 7";
    else if (ua.includes("Mac OS X")) os = "macOS";
    else if (ua.includes("Linux")) os = "Linux";
    else os = "?";
    return `${browser} (${os})`;
  }

  return (
    <div className="user-manager user-manager-vertical">
      <div className="user-tabs-classic user-tabs-classic-fullwidth">
        <div className={tab==='users' ? "user-tab-classic user-tab-classic-active" : "user-tab-classic"} onClick={()=>setTab('users')}>Benutzer</div>
        <div className={tab==='teams' ? "user-tab-classic user-tab-classic-active" : "user-tab-classic"} onClick={()=>setTab('teams')}>Abteilungen/Teams</div>
        <div className={tab==='devices' ? "user-tab-classic user-tab-classic-active" : "user-tab-classic"} onClick={()=>setTab('devices')}>Geräte/Logins</div>
        <div className={tab==='audit' ? "user-tab-classic user-tab-classic-active" : "user-tab-classic"} onClick={()=>setTab('audit')}>Audit-Log</div>
      </div>
      <div className="user-manager-content">
        {tab === 'teams' && (
          <div className="user-teams-tab">
            <h2 style={{marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: 10}}>
              <span role="img" aria-label="Teams">👥</span> Abteilungen & Teams
            </h2>
            <div className="teams-table-wrapper">
              <table className="teams-table">
                <thead>
                  <tr>
                    <th>Abteilung</th>
                    <th>Beschreibung</th>
                    <th>Mitglieder</th>
                    <th>Verantwortliche(r)</th>
                    <th>Aktionen</th>
                  </tr>
                </thead>
                <tbody>
                  {GROUPS_LIST.map(group => {
                    const members = users.filter(u => u.group === group.id);
                    const responsible = members.find(u => u.role === 'Admin') || members[0];
                    return (
                      <tr key={group.id} className={members.length === 0 ? 'team-row-empty' : ''}>
                        <td style={{fontWeight:'bold', color:'#2a6baf'}}>{group.name}</td>
                        <td style={{maxWidth:220, whiteSpace:'pre-line', opacity:0.92}}>{group.description}</td>
                        <td>
                          {members.length === 0 ? <span style={{color:'#bbb'}}>–</span> :
                            <div className="team-members-list">
                              {members.map(u => (
                                <span key={u.id} className="team-member-chip">{u.name}</span>
                              ))}
                            </div>
                          }
                        </td>
                        <td>
                          {responsible ? (
                            <span style={{
                              fontWeight: 'bold',
                              color: '#1761a0',
                              background: 'none',
                              padding: 0,
                              fontSize: '1.04em',
                              whiteSpace: 'nowrap',
                              display: 'inline-block',
                              verticalAlign: 'middle',
                              letterSpacing: '0.01em'
                            }}>{responsible.name}</span>
                          ) : <span style={{color:'#bbb'}}>–</span>}
                        </td>
                        <td>
                          <button className="team-action-btn" title="Mitglieder verwalten" onClick={() => handleEditGroup(group.id)}>
                            <span role="img" aria-label="Verwalten">⚙️</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {showGroupEditModal && (
              <GroupEditModal
                group={GROUPS_LIST.find(g => g.id === editingGroupId)}
                members={users.filter(u => u.group === editingGroupId)}
                allUsers={users}
                onSave={handleSaveGroupMembers}
                onCancel={() => { setShowGroupEditModal(false); setEditingGroupId(null); }}
              />
            )}
          </div>
        )}
        {tab === 'users' && (
          <div className="user-list">
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <h2>Benutzerverwaltung</h2>
              <div style={{display:'flex',gap:'0.5em',alignItems:'center'}}>
                <button onClick={() => setShowNewUserModal(true)}>Neuen Benutzer anlegen</button>
                <button style={{background:'#2a6baf',color:'#fff'}} onClick={handleLdapSync}>LDAP Sync</button>
                <button onClick={exportUsersCSV}>Export (CSV)</button>
                <button onClick={handleImportClick}>Import (CSV)</button>
                <input type="file" accept=".csv" ref={fileInputRef} style={{display:'none'}} onChange={importUsersCSV} />
              </div>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Benutzername</th>
                  <th>Gruppe</th>
                  <th>Status</th>
                  <th>Berechtigungen</th>
                  <th>Letzte Anmeldung</th>
                  <th>Anmeldeversuche</th>
                  <th>Optionen</th>
                  <th>Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id}
                    className={
                      user.accountDisabled ? 'user-row-disabled' :
                      user.status === 'gesperrt' ? 'user-row-locked' : ''
                    }
                  >
                    <td>{user.name}</td>
                    <td>
                      {user.username}
                      {user.accountDisabled && <span title="Deaktiviert" style={{marginLeft:4}}>⛔</span>}
                      {user.status === 'gesperrt' && <span title="Gesperrt" style={{marginLeft:2}}>🔒</span>}
                      {user.mustChangePassword && <span title="Passwort muss geändert werden" style={{marginLeft:2}}>🔑</span>}
                    </td>
                    <td>
                      {user.groupName}
                      {user.role === 'Admin' && <span title="Administrator" style={{marginLeft:4,background:'#2a6baf',color:'#fff',borderRadius:3,padding:'0 4px',fontSize:'0.85em'}}>Admin</span>}
                    </td>
                    <td>{user.status}</td>
                    <td>{(user.permissions || []).join(", ")}</td>
                    <td>{user.lastLogin ? new Date(user.lastLogin).toLocaleString() : '-'}</td>
                    <td>{user.loginAttempts || 0}</td>
                    <td>
                      <ul style={{margin:0,padding:0,listStyle:'none',fontSize:'0.95em'}}>
                        {user.mustChangePassword && <li>🔑 Passwort ändern</li>}
                        {user.cannotChangePassword && <li>🚫 Kein Passwortwechsel</li>}
                        {user.passwordNeverExpires && <li>♾️ Nie ablaufend</li>}
                        {user.accountDisabled && <li>⛔ Deaktiviert</li>}
                        {!(user.mustChangePassword||user.cannotChangePassword||user.passwordNeverExpires||user.accountDisabled) && <li>–</li>}
                      </ul>
                    </td>
                    <td>
                      <>
                        <button onClick={() => handleEdit(user)}>Bearbeiten</button>
                        <button onClick={() => handleDelete(user.id)}>Löschen</button>
                      </>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {tab === 'audit' && (
          <div className="user-auditlog">
            <h2>Audit-Log</h2>
            <table className="auditlog-table">
              <thead>
                <tr>
                  <th>Zeit</th>
                  <th>Aktion</th>
                  <th>Benutzer</th>
                  <th>Ziel</th>
                  <th>Info</th>
                </tr>
              </thead>
              <tbody>
                {auditLog.length === 0 ? (
                  <tr><td colSpan={5} style={{textAlign:'center',color:'#888'}}>Keine Einträge vorhanden</td></tr>
                ) : auditLog.map((log,i) => (
                  <tr key={i} className={i%2===0 ? 'auditlog-row-even' : 'auditlog-row-odd'}>
                    <td>{new Date(log.ts).toLocaleString()}</td>
                    <td>{log.action}</td>
                    <td>{log.user}</td>
                    <td>{log.targetUser||"-"}</td>
                    <td>{parseUserAgent(log.info)||"-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {ldapSyncing && (
        <div className="ldap-overlay">
          <div className="ldap-progress-window">
            <div className="ldap-progress-title">LDAP Sync läuft...</div>
            <div className="ldap-progress-bar-bg">
              <div className="ldap-progress-bar" style={{width: ldapProgress + '%'}}></div>
            </div>
            <div className="ldap-progress-label">{Math.round(ldapProgress)}%</div>
          </div>
        </div>
      )}
      {toast && <Toast message={toast.text} show type={toast.type} />}
      {showEditModal && editing && (
        <GovUserEditor
          user={editing}
          onSave={handleSaveEdit}
          onCancel={() => { setShowEditModal(false); setEditing(null); }}
          lastLogin={editing.lastLogin}
          lastChangedBy={editing.lastChangedBy}
        />
      )}
      {showNewUserModal && (
        <GovUserEditor
          onSave={handleNewUser}
          onCancel={() => setShowNewUserModal(false)}
        />
      )}
      {showCriticalModal && (
        <CriticalActionModal
          actionLabel="Löschen dieses Benutzers bestätigen"
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelCritical}
          requireToken={true}
        />
      )}
      {showCriticalPwModal && (
        <CriticalActionModal
          actionLabel="Passwort-Reset für Benutzer bestätigen"
          onConfirm={handleConfirmPwReset}
          onCancel={handleCancelPwCritical}
          requireToken={true}
        />
      )}
      {showCriticalRightsModal && (
        <CriticalActionModal
          actionLabel="Rechte-/Rollenänderung bestätigen"
          onConfirm={handleConfirmRightsEdit}
          onCancel={handleCancelRightsCritical}
          requireToken={true}
        />
      )}
      {showCriticalLdapModal && (
        <CriticalActionModal
          actionLabel="LDAP Sync bestätigen"
          onConfirm={handleConfirmLdapSync}
          onCancel={handleCancelLdapCritical}
          requireToken={true}
        />
      )}
    </div>
  );
}
