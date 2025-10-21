import React from 'react';

interface ButtonProps {
    type?: 'submit' | 'button';
    disabled?: boolean;
    ariaBusy?: boolean;
    children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ type = 'button', disabled, ariaBusy, children }) => {
    return (
        <button
            type={type}
            disabled={disabled}
            aria-busy={ariaBusy}
            style={{
                width: '100%',
                height: '48px',
                background: 'linear-gradient(to right, #FF409A, #C438EF)',
                color: '#FFFFFF',
                fontFamily: 'Montserrat, sans-serif',
                fontSize: '16px',
                fontWeight: 600,
                borderRadius: '8px',
                border: 'none',
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.5 : 1,
                transition: 'opacity 0.2s',
                outline: 'none',
            }}
            onFocus={(e) => (e.currentTarget.style.outline = '2px solid #FF409A')}
            onBlur={(e) => (e.currentTarget.style.outline = 'none')}
        >
            {children}
        </button>
    );
};