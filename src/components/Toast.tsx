import React, { useEffect } from 'react';
import './Toast.css';

interface ToastProps {
  message: React.ReactNode;
  show: boolean;
  onClose?: () => void;
  type?: string;
}

export default function Toast({ message, show, onClose, type = 'error' }: ToastProps) {
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