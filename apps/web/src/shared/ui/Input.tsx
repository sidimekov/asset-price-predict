import React from 'react';

interface InputProps {
  label: string;
  value: string;
  onChange: (e: any) => void; // Заменили на общий тип 'any' или можно убрать тип полностью
  error?: string;
  type?: string;
  ariaDescribedby: string;
}

export const Input: React.FC<InputProps> = ({ label, value, onChange, error, type = 'text', ariaDescribedby }) => {
  return (
    <div>
      <label htmlFor={ariaDescribedby} className="visually-hidden">
        {label}
      </label>
      <input
        type={type}
        id={ariaDescribedby}
        value={value}
        onChange={onChange}
        className="w-full p-2 rounded bg-surface-dark text-ink"
        aria-describedby={error ? `${ariaDescribedby}-error` : undefined}
        aria-invalid={!!error}
        required
      />
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
