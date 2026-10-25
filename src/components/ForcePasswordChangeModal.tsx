import React, { useState } from "react";
import './terminal.css';

export default function ForcePasswordChangeModal({ user, onChangePassword }) {
  const [newPass, setNewPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    if (!newPass || newPass.length < 6) {
      setError("Das neue Passwort muss mindestens 6 Zeichen lang sein.");
      return;
    }
    if (newPass !== confirm) {
      setError("Die Passwörter stimmen nicht überein.");
      return;
    }
    setError("");
    onChangePassword(newPass);
  }

  return (
    <div className="login-overlay" role="dialog" aria-modal="true">
      <div className="terminal-login-box">
        <div className="terminal-header">
          <div className="terminal-title">Passwort ändern erforderlich</div>
          <div className="terminal-subtitle">Für Benutzer: {user.username}</div>
        </div>
        <form onSubmit={handleSubmit} className="terminal-login-form" style={{ alignItems: 'center' }}>
          <label style={{ width: '100%', textAlign: 'left', marginBottom: '8px' }}>Neues Passwort:
            <input
              type="password"
              className="terminal-input"
              value={newPass}
              onChange={e => setNewPass(e.target.value)}
              autoComplete="new-password"
              style={{ width: '100%', marginTop: '4px' }}
            />
          </label>
          <label style={{ width: '100%', textAlign: 'left', marginBottom: '8px' }}>Neues Passwort bestätigen:
            <input
              type="password"
              className="terminal-input"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              autoComplete="new-password"
              style={{ width: '100%', marginTop: '4px' }}
            />
          </label>
          {error && <div className="terminal-message" style={{color:'#b00',marginBottom:'8px'}}>{error}</div>}
          <button className="terminal-btn" type="submit" style={{ width: '100%', marginTop: '16px' }}>Passwort setzen</button>
        </form>
      </div>
    </div>
  );
}
