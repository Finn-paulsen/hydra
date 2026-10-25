import React, { useState, lazy, Suspense } from 'react';

import FensterManager from './components/FensterManager';
import LoginModal from './components/LoginModal';
import PolicyScreen from './components/PolicyScreen';

const DeepDesktop = lazy(() => import('./components/DeepDesktop'));

export default function App() {
  // Phasen: 'login' | 'policy' | 'desktop'
  const [phase, setPhase] = useState<'login' | 'policy' | 'desktop'>('login');
  const [deepMode, setDeepMode] = useState<boolean>(false);

  function handleLogout() {
    setPhase('login');
    setDeepMode(false);
  }

  // Umschalten auf DeepDesktop
  function handleDeepAccess() {
    setDeepMode(true);
  }

  const PolicyScreenWithDone = PolicyScreen as React.ComponentType<{ onDone?: () => void }>;

  return (
    <div className="app-container">
      {/* Login-Dialog */}
      {phase === 'login' && (
        <LoginModal onSuccess={() => setPhase('policy')} />
      )}

      {/* Group-Policy-Screen – eigenständige Komponente */}
      {phase === 'policy' && (
        <PolicyScreenWithDone onDone={() => setPhase('desktop')} />
      )}

      {/* Geheimer Desktop */}
      {phase === 'desktop' && deepMode && (
        <Suspense fallback={null}>
          <DeepDesktop onLogout={() => setDeepMode(false)} />
        </Suspense>
      )}

      {/* Normaler Desktop */}
      {phase === 'desktop' && !deepMode && (
        <FensterManager bootComplete={true} onLogout={handleLogout} onDeepAccess={handleDeepAccess} />
      )}
    </div>
  );
}
