import React from "react";

export default function HiveMindIcon({ style = {}, ...props }) {
  // Platzhalter: neuronales Netz / Gehirn
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" style={style} {...props}>
      <circle cx="20" cy="20" r="18" stroke="#3aff3a" strokeWidth="2" fill="#142d14" />
      <circle cx="13" cy="15" r="2.5" fill="#3aff3a" />
      <circle cx="27" cy="15" r="2.5" fill="#3aff3a" />
      <circle cx="20" cy="25" r="3" fill="#3aff3a" />
      <line x1="13" y1="15" x2="20" y2="25" stroke="#3aff3a" strokeWidth="1.2" />
      <line x1="27" y1="15" x2="20" y2="25" stroke="#3aff3a" strokeWidth="1.2" />
      <line x1="13" y1="15" x2="27" y2="15" stroke="#3aff3a" strokeWidth="1.2" />
    </svg>
  );
}
