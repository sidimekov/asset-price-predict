'use client';

import React, { useState } from 'react';
import AuthBrand from '@/features/auth/AuthBrand';
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    setIsLoading(false);
    alert(mode === 'signup' ? 'Registered' : 'Entry completed');
  };

  return (
    <div
      style={{
        backgroundColor: '#201D47',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '48px' }}>
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
          {mode === 'signup' ? 'Already have an account? sign in' : 'No account? sign up'}
        </a>
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ maxWidth: '400px', margin: '0 auto' }}>
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
              {mode === 'signup' ? 'Sign up for AssetPredict' : 'Sign in for AssetPredict'}
            </h2>
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
};

export default AuthPage;