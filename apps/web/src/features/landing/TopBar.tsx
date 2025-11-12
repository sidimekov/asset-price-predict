'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/shared/ui/Button';

export const TopBar: React.FC = () => {
  const router = useRouter();

  const handleAuthNavigate = (mode: 'signin' | 'signup') => {
    router.push(`/auth?mode=${mode}`);
  };

  return (
    <header className="w-full flex justify-between items-center py-6 bg-transparent">
      <h1
        className="text-4xl font-semibold cursor-pointer font-montserrat select-none"
        onClick={() => router.push('/')}
      >
        <span className="brand-gradient">Asset</span>
        <span className="text-white">Predict</span>
      </h1>

      <div className="flex gap-4">
        <button
          onClick={() => handleAuthNavigate('signin')}
          className="btn border min-w-24 text-sm text-white hover:opacity-90 transition"
          style={{ padding: '10px 16px' }}
        >
          Sign in
        </button>
        <Button onClick={() => handleAuthNavigate('signup')}>Sign up</Button>
      </div>
    </header>
  );
};
