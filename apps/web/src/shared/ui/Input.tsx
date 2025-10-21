import React from 'react';

interface InputProps {
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<any>) => void;
  error?: string;
  type?: string;
  ariaDescribedby: string;
}

export const Input: React.FC<InputProps> = ({ placeholder, value, onChange, error, type = 'text', ariaDescribedby }) => {
  return (
    <div>
      <input
        type={type}
        id={ariaDescribedby}
        value={value}
        onChange={onChange}
        placeholder={value ? '' : placeholder}
        style={{
          width: '100%',
          height: '48px',
          padding: '0 12px',
          borderRadius: '8px',
          backgroundColor: '#302E53',
          border: '1px solid #333333',
          color: '#FFFFFF',
          fontFamily: 'Montserrat, sans-serif',
          fontSize: '14px',
          outline: 'none',
          ...(value === '' && {
            color: '#8480C9',
          }),
        }}
        aria-describedby={error ? `${ariaDescribedby}-error` : undefined}
        aria-invalid={!!error}
        required
      />
      {error && (
        <span
          id={`${ariaDescribedby}-error`}
          style={{
            display: 'block',
            color: '#FF4444',
            fontFamily: 'Montserrat, sans-serif',
            fontSize: '12px',
            fontWeight: 400,
            marginTop: '4px',
          }}
        >
          {error}
        </span>
      )}
    </div>
  );
};
