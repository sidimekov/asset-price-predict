import React from 'react';

interface InputProps {
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<any>) => void;
  error?: string;
  type?: string;
  ariaDescribedby: string;
  label?: string;
}

export const Input: React.FC<InputProps> = ({
  placeholder,
  value,
  onChange,
  error,
  type = 'text',
  ariaDescribedby,
  label,
}) => {
  return (
    <div>
      <label
        htmlFor={ariaDescribedby}
        style={{
          position: 'absolute',
          width: '1px',
          height: '1px',
          padding: 0,
          margin: '-1px',
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
          border: 0,
        }}
      >
        {placeholder}
      </label>
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
          backgroundColor: '#2A265F',
          border: '1px solid #333333',
          color: '#FFFFFF',
          fontFamily: 'Montserrat, sans-serif',
          fontSize: '14px',
          outline: 'none',
          boxSizing: 'border-box',
          ...(value === '' && {
            color: '#8480C9',
          }),
        }}
        aria-describedby={error ? `${ariaDescribedby}-error` : undefined}
        aria-invalid={!!error}
        required
        onFocus={(e) => (e.currentTarget.style.outline = '2px solid #FF409A')}
        onBlur={(e) => (e.currentTarget.style.outline = 'none')}
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
