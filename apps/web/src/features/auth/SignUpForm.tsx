'use client';

import React, { useState } from 'react';
import { Input } from '@/shared/ui/Input';

interface SignUpFormProps {
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
}

const SignUpForm: React.FC<SignUpFormProps> = ({ onSubmit, isLoading }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({ email: '', password: '', confirm: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({ email: '', password: '', confirm: '' });

    let hasError = false;
    if (!email.match(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/)) {
      setErrors((prev) => ({ ...prev, email: 'Please enter the correct email address' }));
      hasError = true;
    }
    if (!password) {
      setErrors((prev) => ({ ...prev, password: 'The password cann\'t be empty' }));
      hasError = true;
    }
    if (confirmPassword !== password) {
      setErrors((prev) => ({ ...prev, confirm: 'Passwords don\'t match' }));
      hasError = true;
    }

    if (!hasError) {
      onSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}>
      <Input
        placeholder="Your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={errors.email}
        ariaDescribedby="email-error"
      />
      <Input
        placeholder="Your password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={errors.password}
        ariaDescribedby="password-error"
      />
      <Input
        placeholder="Your password again"
        type="password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        error={errors.confirm}
        ariaDescribedby="confirm-error"
      />
      <button
        type="submit"
        disabled={isLoading}
        style={{
          color: '#FFFFFF',
          fontFamily: 'Montserrat, sans-serif',
          fontSize: '16px',
          fontWeight: 600,
          background: 'none',
          border: 'none',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          opacity: isLoading ? 0.5 : 1,
          padding: 0,
          marginTop: '16px',
        }}
      >
          Confirm
      </button>
    </form>
  );
};

export default SignUpForm;
