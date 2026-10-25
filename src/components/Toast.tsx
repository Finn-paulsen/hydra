import React, { useEffect } from 'react';
import './Toast.css';

export default function Toast({ message, show, onClose, type = 'error' }) {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => onClose && onClose(), 2500);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);
  if (!show) return null;
  return (
    <div className={`toast toast-${type}`}>{message}</div>
  );
}