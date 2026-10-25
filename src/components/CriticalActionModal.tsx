import React, { useState } from "react";
import "./govUserEditor.css";

export default function CriticalActionModal({ actionLabel, onConfirm, onCancel, requireToken = false }) {
  const [pw, setPw] = useState("");
  const [token, setToken] = useState("");
  const [mode, setMode] = useState("pw");
  const [error, setError] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    if (mode === "pw" && (!pw || pw.length < 4)) {
      setError("Bitte Passwort eingeben.");
      return;
    }
    if (mode === "token" && (!token || token.length < 4)) {
      setError("Bitte Admin-Token eingeben.");
      return;
    }
    setError("");
    onConfirm(mode === "pw" ? { password: pw } : { token });
  }

  return (
    <div className="gov-user-editor-modal">
      <div className="gov-user-editor-window" style={{maxWidth:400}}>
        <div className="gov-user-editor-titlebar">Kritische Aktion bestätigen</div>
        <form className="gov-user-editor-form" onSubmit={handleSubmit}>
          <div style={{marginBottom:'1em',fontWeight:600}}>{actionLabel}</div>
          <div style={{marginBottom:'0.7em'}}>
            <button type="button" onClick={()=>setMode("pw")}
              className={mode==="pw"?"critical-btn-active":""} style={{marginRight:8}}>Mit Passwort</button>
            {requireToken && (
              <button type="button" onClick={()=>setMode("token")}
                className={mode==="token"?"critical-btn-active":""}>Mit Admin-Token</button>
            )}
          </div>
          {mode==="pw" && (
            <label>Eigenes Passwort:
              <input type="password" value={pw} onChange={e=>setPw(e.target.value)} autoFocus />
            </label>
          )}
          {mode==="token" && requireToken && (
            <label>Admin-Token:
              <input type="text" value={token} onChange={e=>setToken(e.target.value)} autoFocus />
            </label>
          )}
          {error && <div style={{color:'#b00',marginTop:8}}>{error}</div>}
          <div className="gov-user-editor-footer">
            <button type="submit">Bestätigen</button>
            <button type="button" onClick={onCancel}>Abbrechen</button>
          </div>
        </form>
      </div>
    </div>
  );
}
