'use client';

import React, { useState } from 'react';

interface PasswordInputProps {
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<any>) => void;
  error?: string;
  ariaDescribedby?: string;
}

const PasswordInput: React.FC<PasswordInputProps> = ({
  placeholder,
  value,
  onChange,
  error,
  ariaDescribedby,
}) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div>
      <label htmlFor={ariaDescribedby} className="sr-only">
        {placeholder}
      </label>
      <div className="relative">
        <input
          type={showPassword ? 'text' : 'password'}
          id={ariaDescribedby}
          placeholder={value ? '' : placeholder}
          value={value}
          onChange={onChange}
          className="input pr-20"
          aria-describedby={
            error && ariaDescribedby ? `${ariaDescribedby}-error` : undefined
          }
          aria-invalid={!!error}
          required
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="password-toggle"
        >
          {showPassword ? 'Hide' : 'Show'}
        </button>
      </div>
      {error && (
        <span
          id={ariaDescribedby ? `${ariaDescribedby}-error` : undefined}
          className="error-text"
        >
          {error}
        </span>
      )}
    </div>
  );
};

export default PasswordInput;
