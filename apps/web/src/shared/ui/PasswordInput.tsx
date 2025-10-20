import React, { useState } from 'react';

interface PasswordInputProps {
  label: string;
  value: string;
  onChange: (e: any) => void; // Заменили на общий тип 'any' или можно убрать тип полностью
  error?: string;
  ariaDescribedby: string;
}

export const PasswordInput: React.FC<PasswordInputProps> = ({ label, value, onChange, error, ariaDescribedby }) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div>
      <label htmlFor={ariaDescribedby} className="visually-hidden">
        {label}
      </label>
      <input
        type={showPassword ? 'text' : 'password'}
        id={ariaDescribedby}
        value={value}
        onChange={onChange}
        className="w-full p-2 rounded bg-surface-dark text-ink"
        aria-describedby={error ? `${ariaDescribedby}-error` : undefined}
        aria-invalid={!!error}
        required
      />
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        className="text-ink"
      >
        {showPassword ? 'Скрыть' : 'Показать'}
      </button>
      {error && <span id={`${ariaDescribedby}-error`} className="text-red-400">{error}</span>}
    </div>
  );
};

<style jsx>{`
    .visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    border: 0;
}
`}</style>