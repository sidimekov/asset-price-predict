'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import AuthBrand from '@/features/auth/AuthBrand';
import AuthTabs from '@/features/auth/AuthTabs';
import { GradientCard } from '@/shared/ui/GradientCard';
import SignUpForm from '@/features/auth/SignUpForm';
import SignInForm from '@/features/auth/SignInForm';

const AuthPageContent: React.FC = () => {
  const searchParams = useSearchParams();
  const urlMode = searchParams.get('mode');

  const [mode, setMode] = useState<'signin' | 'signup'>('signup');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (urlMode === 'signin' || urlMode === 'signup') {
      setMode(urlMode);
    }
  }, [urlMode]);

  const toggleMode = (e: React.MouseEvent<any>) => {
    e.preventDefault();
    setMode((prev) => (prev === 'signup' ? 'signin' : 'signup'));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      alert(
        mode === 'signup' ? 'Зарегистрировано (мок)' : 'Вход выполнен (мок)',
      );
    }, 800);
  };

  return (
    <div className="bg-primary min-h-screen flex flex-col">
      <header className="flex justify-between items-center pt-6 pb-4 px-6 mobile:pt-5 mobile:pb-3 mobile:px-4">
        <AuthBrand />
        <a
          href="#"
          onClick={toggleMode}
          className="text-ink text-sm font-normal underline-hover font-montserrat whitespace-nowrap focus-ring transition-fast"
          aria-label={
            mode === 'signup'
              ? 'Уже есть аккаунт? Войти'
              : 'Нет аккаунта? Зарегистрироваться'
          }
        >
          {mode === 'signup'
            ? 'Already have an account? Sign in'
            : 'No account? Sign up'}
        </a>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 mobile:px-4">
        <div className="w-full max-w-md mobile:w-90 mobile:max-w-md mx-auto">
          <GradientCard className="py-10 mobile:py-8">
            <h2 className="text-ink text-xl font-semibold text-center mb-6 font-montserrat">
              {mode === 'signup' ? 'Sign up for AssetPredict' : 'Welcome back'}
            </h2>

            <AuthTabs mode={mode} setMode={setMode} />

            {mode === 'signup' ? (
              <SignUpForm onSubmit={handleSubmit} isLoading={isLoading} />
            ) : (
              <SignInForm onSubmit={handleSubmit} isLoading={isLoading} />
            )}
          </GradientCard>
        </div>
      </main>
    </div>
  );
};

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-primary min-h-screen flex items-center justify-center text-white text-lg">
          Loading...
        </div>
      }
    >
      <AuthPageContent />
    </Suspense>
  );
}
