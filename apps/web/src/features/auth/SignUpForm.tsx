'use client';

import React, { useState } from 'react';
import { Input } from '@/shared/ui/Input';
import PasswordInput from '@/shared/ui/PasswordInput';
import { Button } from '@/shared/ui/Button';
import Skeleton from '@/shared/ui/Skeleton';

interface SignUpFormProps {
  onSubmit: (payload: {
    email: string;
    password: string;
    username?: string;
  }) => void;
  isLoading: boolean;
  serverErrors?: {
    email?: string;
    password?: string;
    username?: string;
  };
  serverMessage?: string;
}

const SignUpForm: React.FC<SignUpFormProps> = ({
  onSubmit,
  isLoading,
  serverErrors,
  serverMessage,
}) => {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({
    email: '',
    username: '',
    password: '',
    confirm: '',
  });

  const mergedErrors = {
    email: errors.email || serverErrors?.email || '',
    username: errors.username || serverErrors?.username || '',
    password: errors.password || serverErrors?.password || '',
    confirm: errors.confirm,
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({ email: '', username: '', password: '', confirm: '' });

    let hasError = false;
    if (!email.match(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/)) {
      setErrors((prev) => ({
        ...prev,
        email: 'Please enter the correct email address',
      }));
      hasError = true;
    }
    if (!password) {
      setErrors((prev) => ({
        ...prev,
        password: "The password can't be empty",
      }));
      hasError = true;
    }
    if (confirmPassword !== password) {
      setErrors((prev) => ({ ...prev, confirm: "Passwords don't match" }));
      hasError = true;
    }

    if (!hasError) {
      const trimmedUsername = username.trim();
      onSubmit({
        email,
        password,
        username: trimmedUsername.length > 0 ? trimmedUsername : undefined,
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 relative">
      {serverMessage && (
        <p className="error-text text-center" role="alert">
          {serverMessage}
        </p>
      )}
      {isLoading ? (
        <>
          <Skeleton />
          <Skeleton />
          <Skeleton />
          <Skeleton />
        </>
      ) : (
        <>
          <Input
            placeholder="Your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={mergedErrors.email}
            ariaDescribedby="email"
          />
          <Input
            placeholder="Your username (optional)"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            error={mergedErrors.username}
            ariaDescribedby="username"
            required={false}
          />
          <PasswordInput
            placeholder="Your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={mergedErrors.password}
            ariaDescribedby="password"
          />
          <PasswordInput
            placeholder="Your password again"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={mergedErrors.confirm}
            ariaDescribedby="confirm"
          />
        </>
      )}
      <Button type="submit" disabled={isLoading} ariaBusy={isLoading}>
        Confirm
      </Button>
    </form>
  );
};

export default SignUpForm;
