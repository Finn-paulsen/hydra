import React, { useState } from "react";

export default function GroupEditModal({ group, members, allUsers, onSave, onCancel }) {
  const [selected, setSelected] = useState(members.map(u => u.id));
  function toggleUser(id) {
    setSelected(sel => sel.includes(id) ? sel.filter(x => x !== id) : [...sel, id]);
  }
  function handleSave() {
    onSave(selected);
  }
  return (
    <div className="gov-user-editor-modal">
      <div className="gov-user-editor-window" style={{maxWidth:420}}>
        <div className="gov-user-editor-titlebar">Mitglieder verwalten: {group?.name}</div>
        <div style={{maxHeight:260,overflowY:'auto',marginBottom:12}}>
          {allUsers.map(u => (
            <label key={u.id} style={{display:'block',marginBottom:4}}>
              <input type="checkbox" checked={selected.includes(u.id)} onChange={()=>toggleUser(u.id)} />
              {u.name} <span style={{color:'#888',fontSize:'0.9em'}}>({u.username})</span>
            </label>
          ))}
        </div>
        <div className="gov-user-editor-footer">
          <button onClick={handleSave}>Speichern</button>
          <button onClick={onCancel}>Abbrechen</button>
        </div>
      </div>
    </div>
  );
}