function GovUserEditor({ user = defaultUser, onSave, onCancel, lastLogin, lastChangedBy }) {
  const [form, setForm] = useState(user);
  const [pwError, setPwError] = useState("");

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    if (name === 'role') {
      setForm(f => ({
        ...f,
        role: value,
        permissions: [...ROLE_PRESETS[value]]
      }));
    } else if (name.startsWith('perm_')) {
      const perm = name.replace('perm_', '');
      setForm(f => {
        const perms = new Set(f.permissions || []);
        if (checked) perms.add(perm); else perms.delete(perm);
        return { ...f, permissions: Array.from(perms) };
      });
    } else {
      setForm(f => ({
        ...f,
        [name]: type === "checkbox" ? checked : value
      }));
    }
  }

  function validatePassword(pw) {
    if (!pw) return "";
    if (pw.length < 8) return "Mindestens 8 Zeichen erforderlich.";
    if (!/[A-Z]/.test(pw)) return "Mindestens 1 Großbuchstabe erforderlich.";
    if (!/[a-z]/.test(pw)) return "Mindestens 1 Kleinbuchstabe erforderlich.";
    if (!/[0-9]/.test(pw)) return "Mindestens 1 Zahl erforderlich.";
    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pw)) return "Mindestens 1 Sonderzeichen erforderlich.";
    return "";
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setPwError("Passwörter stimmen nicht überein.");
      return;
    }
    const policyMsg = validatePassword(form.password);
    if (form.password && policyMsg) {
      setPwError(policyMsg);
      return;
    }
    setPwError("");
    onSave && onSave(form);
  }

  return (
    <div className="gov-user-editor-modal">
      <div className="gov-user-editor-window">
        <div className="gov-user-editor-titlebar">Benutzerkonto verwalten</div>
        <form className="gov-user-editor-form" onSubmit={handleSubmit}>
          <div className="gov-user-editor-fields">
            <label>
              Benutzername:
              <input name="username" value={form.username} onChange={handleChange} required autoComplete="username" />
            </label>
            <label>
              Name:
              <input name="fullName" value={form.fullName} onChange={handleChange} />
            </label>
            <label>
              Beschreibung:
              <input name="description" value={form.description} onChange={handleChange} />
            </label>
            <label>
              Passwort:
              <input name="password" type="password" value={form.password} onChange={handleChange} autoComplete="new-password" />
            </label>
            <label>
              Passwort bestätigen:
              <input name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange} autoComplete="new-password" />
            </label>
            <div style={{fontSize:'0.97em',color:'#444',marginBottom:'0.5em'}}>
              <b>Passwort-Regeln:</b> Mind. 8 Zeichen, Groß- & Kleinbuchstaben, Zahl, Sonderzeichen
            </div>
            {pwError && <div style={{color:'#b00',marginBottom:'0.5em'}}>{pwError}</div>}
            <label>
              Rolle:
              <select name="role" value={form.role} onChange={handleChange}>
                {roles.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <span style={{fontSize:'0.93em',marginLeft:'0.7em',color:'#666'}}>
                (Rechte können nach Auswahl beliebig angepasst werden)
              </span>
            </label>
            <div style={{marginBottom:'0.7em'}}>
              <div style={{fontWeight:600,marginBottom:'0.2em'}}>Rechte:</div>
              {ALL_PERMISSIONS.map(p => (
                <label key={p.key} style={{marginRight:'1.2em',fontWeight:400}}>
                  <input
                    type="checkbox"
                    name={`perm_${p.key}`}
                    checked={form.permissions?.includes(p.key) || false}
                    onChange={handleChange}
                  /> {p.label}
                </label>
              ))}
            </div>
            <label>
              Abteilung/Unit:
              <select name="department" value={form.department} onChange={handleChange} required>
                <option value="">Bitte wählen…</option>
                {require("../utils/userData").GROUPS_LIST.map(g => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </label>
            <label>
              Clearance Level:
              <select name="clearance" value={form.clearance} onChange={handleChange}>
                {clearanceLevels.map(lvl => <option key={lvl} value={lvl}>{lvl}</option>)}
              </select>
            </label>
            <label>
              Ablaufdatum Account:
              <input name="expires" type="date" value={form.expires} onChange={handleChange} />
            </label>
            <div className="gov-user-editor-checkboxes">
              <label>
                <input type="checkbox" name="mustChangePassword" checked={form.mustChangePassword} onChange={handleChange} />
                Passwort muss beim nächsten Login geändert werden
              </label>
              <label>
                <input type="checkbox" name="neverExpires" checked={form.neverExpires} onChange={handleChange} />
                Passwort läuft nie ab
              </label>
              <label>
                <input type="checkbox" name="disabled" checked={form.disabled} onChange={handleChange} />
                Account ist deaktiviert
              </label>
            </div>
          </div>
          <div className="gov-user-editor-footer">
            <button type="submit">Speichern</button>
            <button type="button" onClick={onCancel}>Abbrechen</button>
          </div>
          <div className="gov-user-editor-meta">
            {lastLogin && <div>Letzter Login: {lastLogin}</div>}
            {lastChangedBy && <div>Letzte Änderung durch: {lastChangedBy}</div>}
          </div>
        </form>
      </div>
    </div>
  );
}

export default GovUserEditor;
