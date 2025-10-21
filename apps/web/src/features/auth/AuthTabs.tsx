'use client';

import React from 'react';

interface AuthTabsProps {
    mode: 'signin' | 'signup';
    setMode: (mode: 'signin' | 'signup') => void;
}

const AuthTabs: React.FC<AuthTabsProps> = ({ mode, setMode }) => {
    return (
        <div
            role="tablist"
            style={{
                display: 'flex',
                gap: '8px',
                marginBottom: '24px',
                justifyContent: 'center',
            }}
        >
            <button
                role="tab"
                aria-selected={mode === 'signup'}
                aria-controls="signup-tab"
                id="signup-tab-button"
                onClick={() => setMode('signup')}
                style={{
                    padding: '8px 16px',
                    borderRadius: '16px',
                    background: '#2A265F',
                    color: '#FFFFFF',
                    fontFamily: 'Montserrat, sans-serif',
                    fontSize: '16px',
                    fontWeight: 600,
                    border: 'none',
                    cursor: 'pointer',
                    textDecoration: mode === 'signup' ? 'underline' : 'none',
                    transition: 'text-decoration 0.3s ease',
                    outline: 'none',
                }}
                onFocus={(e) => (e.currentTarget.style.outline = '2px solid #FF409A')}
                onBlur={(e) => (e.currentTarget.style.outline = 'none')}
            >
                Sign up
            </button>
            <button
                role="tab"
                aria-selected={mode === 'signin'}
                aria-controls="signin-tab"
                id="signin-tab-button"
                onClick={() => setMode('signin')}
                style={{
                    padding: '8px 16px',
                    borderRadius: '16px',
                    background: '#2A265F',
                    color: '#FFFFFF',
                    fontFamily: 'Montserrat, sans-serif',
                    fontSize: '16px',
                    fontWeight: 600,
                    border: 'none',
                    cursor: 'pointer',
                    textDecoration: mode === 'signin' ? 'underline' : 'none',
                    transition: 'text-decoration 0.3s ease',
                    outline: 'none',
                }}
                onFocus={(e) => (e.currentTarget.style.outline = '2px solid #FF409A')}
                onBlur={(e) => (e.currentTarget.style.outline = 'none')}
            >
                Sign in
            </button>
        </div>
    );
};

export default AuthTabs;