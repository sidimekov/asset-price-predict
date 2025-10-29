'use client';

import React, { useState } from 'react';
import { Input } from '@/shared/ui/Input';
import PasswordInput from '@/shared/ui/PasswordInput';
import { Button } from '@/shared/ui/Button';
import Skeleton from '@/shared/ui/Skeleton';

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
      setErrors((prev) => ({ ...prev, password: "The password can't be empty" }));
      hasError = true;
    }
    if (confirmPassword !== password) {
      setErrors((prev) => ({ ...prev, confirm: "Passwords don't match" }));
      hasError = true;
    }

    if (!hasError) onSubmit(e);
  };

  return (
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 relative">
        {isLoading ? (
            <>
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
                  error={errors.email}
                  ariaDescribedby="email"
              />
              <PasswordInput
                  placeholder="Your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  error={errors.password}
                  ariaDescribedby="password"
              />
              <PasswordInput
                  placeholder="Your password again"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  error={errors.confirm}
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