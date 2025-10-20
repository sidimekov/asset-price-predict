'use client';

import React, { useState } from 'react';
import AuthBrand from '@/features/auth/AuthBrand';
import { GradientCard } from '@/shared/ui/GradientCard';
import AuthTabs from '@/features/auth/AuthTabs';
import SignUpForm from '@/features/auth/SignUpForm';
import SignInForm from '@/features/auth/SignInForm';

const AuthPage: React.FC = () => {
    const [mode, setMode] = useState<'signin' | 'signup'>('signup');

    const toggleMode = () => {
        setMode(mode === 'signup' ? 'signin' : 'signup');
    };

    return (
        <div className="bg-surface-dark flex items-center justify-center min-h-screen">
            <div className="container mx-auto p-4">
                <div className="flex flex-col md:flex-row justify-between items-center mb-8">
                    <AuthBrand />
                    <a href="#" className="text-ink hover:underline" onClick={toggleMode}>
                        {mode === 'signup' ? 'У вас уже есть аккаунт? Войти' : 'У вас уже есть аккаунт? Зарегистрироваться'}
                    </a>
                </div>
                <div className="max-w-md w-full mx-auto">
                    <GradientCard>
                        <h2 className="text-2xl font-semibold text-center mb-4">
                            {mode === 'signup' ? 'Регистрация в AssetPredict' : 'Добро пожаловать обратно'}
                        </h2>
                        <AuthTabs mode={mode} setMode={setMode} />
                        <div role="tabpanel" id={mode === 'signup' ? 'signup-tab' : 'signin-tab'}>
                            {mode === 'signup' ? <SignUpForm /> : <SignInForm />}
                        </div>
                    </GradientCard>
                </div>
            </div>
        </div>
    );
};

export default AuthPage;