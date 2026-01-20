'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AuthBrand from '@/features/auth/AuthBrand';
import AuthTabs from '@/features/auth/AuthTabs';
import { GradientCard } from '@/shared/ui/GradientCard';
import SignUpForm from '@/features/auth/SignUpForm';
import SignInForm from '@/features/auth/SignInForm';
import { useLoginMutation, useRegisterMutation } from '@/shared/api/auth.api';
import type { HttpError } from '@/shared/networking/types';

type FieldErrors = {
  email?: string;
  password?: string;
  username?: string;
  confirm?: string;
};

const extractFieldErrors = (detail?: unknown): FieldErrors => {
  if (!detail || typeof detail !== 'object') {
    return {};
  }

  const details = (detail as { details?: unknown }).details;
  if (!Array.isArray(details)) {
    return {};
  }

  const fieldErrors: FieldErrors = {};
  details.forEach((entry) => {
    if (typeof entry !== 'string') {
      return;
    }
    const [rawField, ...rest] = entry.split(':');
    const field = rawField?.trim();
    const message = rest.join(':').trim();
    if (!field || !message) {
      return;
    }
    if (field === 'email' || field === 'password' || field === 'username') {
      fieldErrors[field] = message;
    }
  });

  return fieldErrors;
};

const AuthPageContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlMode = searchParams.get('mode');
  const [mode, setMode] = useState<'signin' | 'signup'>('signup');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formMessage, setFormMessage] = useState('');
  const [login, { isLoading: isLoginLoading }] = useLoginMutation();
  const [register, { isLoading: isRegisterLoading }] = useRegisterMutation();

  useEffect(() => {
    if (urlMode === 'signin' || urlMode === 'signup') {
      setMode(urlMode);
    }
  }, [urlMode]);

  useEffect(() => {
    setFieldErrors({});
    setFormMessage('');
  }, [mode]);

  const toggleMode = (e: React.MouseEvent<any>) => {
    e.preventDefault();
    setMode((prev) => (prev === 'signup' ? 'signin' : 'signup'));
  };

  const applyError = (error: unknown) => {
    if (
      !error ||
      typeof error !== 'object' ||
      typeof (error as HttpError).status !== 'number'
    ) {
      setFormMessage('Не удалось выполнить запрос');
      return;
    }

    const normalized = error as HttpError;

    if (normalized.status === 401) {
      setFormMessage('Неверный email или пароль');
      return;
    }

    if (normalized.status === 409) {
      setFormMessage('Этот email уже зарегистрирован');
      return;
    }

    if (normalized.status === 400) {
      const extracted = extractFieldErrors(normalized.detail);
      if (Object.keys(extracted).length > 0) {
        setFieldErrors(extracted);
        return;
      }
      setFormMessage('Проверьте корректность введенных данных');
      return;
    }

    setFormMessage(normalized.message || 'Не удалось выполнить запрос');
  };

  const handleSignIn = async (payload: { email: string; password: string }) => {
    setFieldErrors({});
    setFormMessage('');
    try {
      await login(payload).unwrap();
      router.push('/dashboard');
    } catch (err) {
      applyError(err);
    }
  };

  const handleSignUp = async (payload: {
    email: string;
    password: string;
    username?: string;
  }) => {
    setFieldErrors({});
    setFormMessage('');
    try {
      await register(payload).unwrap();
      router.push('/dashboard');
    } catch (err) {
      applyError(err);
    }
  };

  const errorMessage = formMessage;

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
              <SignUpForm
                onSubmit={handleSignUp}
                isLoading={isRegisterLoading}
                serverErrors={fieldErrors}
                serverMessage={formMessage}
              />
            ) : (
              <SignInForm
                onSubmit={handleSignIn}
                isLoading={isLoginLoading}
                serverErrors={fieldErrors}
                serverMessage={formMessage}
              />
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
