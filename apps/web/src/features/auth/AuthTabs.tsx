'use client';

import React from 'react';

interface AuthTabsProps {
  mode: 'signin' | 'signup';
  setMode: (mode: 'signin' | 'signup') => void;
}

const AuthTabs: React.FC<AuthTabsProps> = ({ mode, setMode }) => {
  return (
    <div role="tablist" className="auth-tabs">
      <button
        role="tab"
        aria-selected={mode === 'signup'}
        aria-controls="signup-panel"
        id="signup-tab"
        onClick={() => setMode('signup')}
        className="tab-button"
      >
        Sign up
      </button>
      <button
        role="tab"
        aria-selected={mode === 'signin'}
        aria-controls="signin-panel"
        id="signin-tab"
        onClick={() => setMode('signin')}
        className="tab-button"
      >
        Sign in
      </button>
    </div>
  );
};

export default AuthTabs;
