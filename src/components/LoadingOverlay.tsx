import React from 'react';
import './LoadingOverlay.css';

export default function LoadingOverlay({ text = 'Bitte warten...', show = false }) {
  if (!show) return null;
  return (
    <div className="loading-overlay">
      <div className="loading-spinner" />
      <div className="loading-text">{text}</div>
    </div>
  );
}