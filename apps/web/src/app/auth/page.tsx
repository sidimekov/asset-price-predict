'use client';

import React, { useState } from 'react';
import AuthBrand from '@/features/auth/AuthBrand';
import AuthTabs from '@/features/auth/AuthTabs';
import { GradientCard } from '@/shared/ui/GradientCard';
import SignUpForm from '@/features/auth/SignUpForm';
import SignInForm from '@/features/auth/SignInForm';

const AuthPage: React.FC = () => {
    const [mode, setMode] = useState<'signin' | 'signup'>('signup');
    const [isLoading, setIsLoading] = useState(false);

    const toggleMode = (e: React.MouseEvent) => {
        e.preventDefault();
        setMode(mode === 'signup' ? 'signin' : 'signup');
    };

    const isMobile = typeof window !== 'undefined' && window.innerWidth >= 360 && window.innerWidth <= 390;

    return (
        <div
            style={{
                backgroundColor: '#201D47',
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                padding: isMobile ? '16px' : '24px',
            }}
        >
            <div
                style={{
                    display: 'flex',
                    flexDirection: isMobile ? 'column' : 'row',
                    justifyContent: isMobile ? 'flex-start' : 'space-between',
                    alignItems: isMobile ? 'flex-start' : 'center',
                    marginBottom: isMobile ? '24px' : '48px',
                    gap: isMobile ? '16px' : '0',
                }}
            >
                <AuthBrand />
                <a
                    href="#"
                    onClick={toggleMode}
                    style={{
                        color: '#FFFFFF',
                        fontFamily: 'Montserrat, sans-serif',
                        fontSize: '14px',
                        fontWeight: 400,
                        textDecoration: 'none',
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                    onMouseOut={(e) => (e.currentTarget.style.textDecoration = 'none')}
                >
                    {mode === 'signup' ? 'Already have an account? Sign in' : 'No account? Sign up'}
                </a>
            </div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div
                    style={{
                        width: isMobile ? '90%' : '100%',
                        maxWidth: isMobile ? '420px' : '400px',
                        margin: '0 auto',
                    }}
                >
                    <GradientCard>
                        <h2
                            style={{
                                color: '#FFFFFF',
                                fontFamily: 'Montserrat, sans-serif',
                                fontSize: '20px',
                                fontWeight: 600,
                                textAlign: 'center',
                                marginBottom: '24px',
                            }}
                        >
                            {mode === 'signup' ? 'Sign up for AssetPredict' : 'Welcome back'}
                        </h2>
                        <AuthTabs mode={mode} setMode={setMode} />
                        <div style={{ position: 'relative' }}>
                            <div role="tabpanel" id={mode === 'signup' ? 'signup-tab' : 'signin-tab'}>
                                {mode === 'signup' ? (
                                    <SignUpForm onSubmit={handleSubmit} isLoading={isLoading} />
                                ) : (
                                    <SignInForm onSubmit={handleSubmit} isLoading={isLoading} />
                                )}
                            </div>
                            <div
                                style={{
                                    position: 'absolute',
                                    bottom: '24px',
                                    right: '24px',
                                    color: '#A0A0A0',
                                    fontFamily: 'Montserrat, sans-serif',
                                    fontSize: '12px',
                                    fontWeight: 400,
                                }}
                            >
                            </div>
                        </div>
                    </GradientCard>
                </div>
            </div>
        </div>
    );

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setIsLoading(true);

        // ДОБАВИТЬ data-testid
        const timer = setTimeout(() => {
            setIsLoading(false);
            alert(mode === 'signup' ? 'Зарегистрировано (мок)' : 'Вход выполнен (мок)');
        }, 800);

        // Позволить мокать
        (globalThis as any).__AUTH_TIMER = timer;
    }
};

export default AuthPage;