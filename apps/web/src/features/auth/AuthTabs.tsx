import React from 'react';

interface AuthTabsProps {
  mode: 'signin' | 'signup';
  setMode: (mode: 'signin' | 'signup') => void;
  style?: React.CSSProperties;
}

const AuthTabs: React.FC<AuthTabsProps> = ({ mode, setMode, style }) => {
  return (
    <div style={{ display: 'flex', gap: '16px', alignItems: 'center', ...style }}>
      <button
        onClick={() => setMode('signin')}
        style={{
          padding: '8px 16px',
          borderRadius: '8px',
          backgroundColor: mode === 'signin' ? 'transparent' : '#2D2D2D',
          color: mode === 'signin' ? '#FFFFFF' : '#A0A0A0',
          fontFamily: 'Montserrat, sans-serif',
          fontSize: '14px',
          fontWeight: 600,
          border: 'none',
          cursor: 'pointer',
          ...(mode === 'signin' && {
            background: 'linear-gradient(to right, #FF409A, #C438EF)',
          }),
        }}
      >
        Вход
      </button>
      <button
        onClick={() => setMode('signup')}
        style={{
          padding: '8px 16px',
          borderRadius: '8px',
          backgroundColor: mode === 'signup' ? 'transparent' : '#2D2D2D',
          color: mode === 'signup' ? '#FFFFFF' : '#A0A0A0',
          fontFamily: 'Montserrat, sans-serif',
          fontSize: '14px',
          fontWeight: 600,
          border: 'none',
          cursor: 'pointer',
          ...(mode === 'signup' && {
            background: 'linear-gradient(to right, #FF409A, #C438EF)',
          }),
        }}
      >
        Регистрация
      </button>
    </div>
  );
};

export default AuthTabs;
