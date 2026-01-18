'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import AuthBrand from '@/features/auth/AuthBrand';
import AuthTabs from '@/features/auth/AuthTabs';
import { GradientCard } from '@/shared/ui/GradientCard';
import SignUpForm from '@/features/auth/SignUpForm';
import SignInForm from '@/features/auth/SignInForm';
import type { AuthFormValues } from '@/features/auth/types';
import { useLoginMutation, useRegisterMutation } from '@/shared/api/auth.api';

const AuthPageContent = () => {
  const searchParams = useSearchParams();
  const urlMode = searchParams.get('mode');
  const [mode, setMode] = useState<'signin' | 'signup'>('signup');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const router = useRouter();

  const [login, { isLoading: loginLoading }] = useLoginMutation();
  const [register, { isLoading: registerLoading }] = useRegisterMutation();

  useEffect(() => {
    if (urlMode === 'signin' || urlMode === 'signup') {
      setMode(urlMode);
    }
  }, [urlMode]);

  useEffect(() => {
    setStatusMessage(null);
  }, [mode]);

  const toggleMode = (e: React.MouseEvent<any>) => {
    e.preventDefault();
    setMode((prev) => (prev === 'signup' ? 'signin' : 'signup'));
  };

  const handleSuccess = () => {
    setStatusMessage(null);
    router.push('/dashboard');
  };

  const handleLogin = async (values: AuthFormValues) => {
    try {
      await login(values).unwrap();
      handleSuccess();
    } catch (err: any) {
      setStatusMessage(
        err?.data?.message ||
          err?.message ||
          'Не удалось войти. Попробуйте ещё раз.',
      );
    }
  };

  const handleRegister = async (values: AuthFormValues) => {
    try {
      await register(values).unwrap();
      handleSuccess();
    } catch (err: any) {
      setStatusMessage(
        err?.data?.message ||
          err?.message ||
          'Не удалось зарегистрироваться. Попробуйте ещё раз.',
      );
    }
  };

  const isSubmitting = mode === 'signin' ? loginLoading : registerLoading;
  const errorMessage = statusMessage;

  return (
    <div className="bg-primary min-h-screen flex flex-col">
      <header className="flex justify-between items-center pt-6 pb-4 px-6 mobile:pt-5 mobile:pb-3 mobile:px-4">
        <AuthBrand />
        <a
          href="#"
          onClick={toggleMode}
          className="text-ink text-sm font-normal underline-hover font-montserrat whitespace-nowrap transition-fast"
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
            {errorMessage ? (
              <div className="text-red-400 text-sm mb-3" role="alert">
                {errorMessage}
              </div>
            ) : null}
            {mode === 'signup' ? (
              <SignUpForm onSubmit={handleRegister} isLoading={isSubmitting} />
            ) : (
              <SignInForm onSubmit={handleLogin} isLoading={isSubmitting} />
            )}
          </GradientCard>
        </div>
      </main>
    </div>
  );
};

const AuthPage = () => {
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
};

export default AuthPage;
