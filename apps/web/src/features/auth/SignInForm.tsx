'use client';

import React, { useState } from 'react';
import { Input } from '@/shared/ui/Input';
import PasswordInput from '@/shared/ui/PasswordInput';
import { Button } from '@/shared/ui/Button';
import Skeleton from '@/shared/ui/Skeleton';

interface SignInFormProps {
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
}

const SignInForm: React.FC<SignInFormProps> = ({ onSubmit, isLoading }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({ email: '', password: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({ email: '', password: '' });

    let hasError = false;
    if (!email.match(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/)) {
      setErrors((prev) => ({ ...prev, email: 'Please enter the correct email address' }));
      hasError = true;
    }
    if (!password) {
      setErrors((prev) => ({ ...prev, password: "The password can't be empty" }));
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
            </>
        )}
        <Button type="submit" disabled={isLoading} ariaBusy={isLoading}>
          Confirm
        </Button>
      </form>
  );
};

export default SignInForm;