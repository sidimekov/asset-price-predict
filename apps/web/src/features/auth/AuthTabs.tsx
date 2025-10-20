import React from 'react';

interface AuthTabsProps {
    mode: 'signin' | 'signup';
    setMode: (mode: 'signin' | 'signup') => void;
}

const AuthTabs: React.FC<AuthTabsProps> = ({ mode, setMode }) => {
    return (
        <div role="tablist" className="flex justify-around mb-4">
            <button
                role="tab"
                aria-selected={mode === 'signin'}
                aria-controls="signin-tab"
                className={`tab-${mode === 'signin' ? 'active' : 'inactive'}`}
                onClick={() => setMode('signin')}
            >
                Вход
            </button>
            <button
                role="tab"
                aria-selected={mode === 'signup'}
                aria-controls="signup-tab"
                className={`tab-${mode === 'signup' ? 'active' : 'inactive'}`}
                onClick={() => setMode('signup')}
            >
                Регистрация
            </button>
        </div>
    );
};

export default AuthTabs;

<style jsx>{`
  .tab-active { @apply underline font-bold; }
  .tab-inactive { @apply hover:underline; }
`}</style>