import React, { useState } from 'react';

import FensterManager from './components/FensterManager';
import LoginModal from './components/LoginModal';
import PolicyScreen from './components/PolicyScreen';
import DeepDesktop from './components/DeepDesktop';

export default function App() {
  // Phasen: 'login' | 'policy' | 'desktop'
  const [phase, setPhase] = useState('login');
  const [deepMode, setDeepMode] = useState(false);

  function handleLogout() {
    setPhase('login');
    setDeepMode(false);
  }

  // Umschalten auf DeepDesktop
  function handleDeepAccess() {
    setDeepMode(true);
  }

  return (
    <div className="app-container">
      {/* Login-Dialog */}
      {phase === 'login' && (
        <LoginModal onSuccess={() => setPhase('policy')} />
      )}

      {/* Group-Policy-Screen – eigenständige Komponente */}
      {phase === 'policy' && (
        <PolicyScreen onDone={() => setPhase('desktop')} />
      )}

      {/* Geheimer Desktop */}
      {phase === 'desktop' && deepMode && (
        <DeepDesktop onLogout={() => setDeepMode(false)} />
      )}

      {/* Normaler Desktop */}
      {phase === 'desktop' && !deepMode && (
        <FensterManager bootComplete={true} onLogout={handleLogout} onDeepAccess={handleDeepAccess} />
      )}
    </div>
  );
}
