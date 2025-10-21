"use client";

import React from 'react';

interface ButtonProps {
    type?: 'submit' | 'button';
    disabled?: boolean;
    ariaBusy?: boolean;
    children: React.ReactNode;
    variant?: 'primary' | 'secondary' | 'danger-gradient';
    ariaLabel?: string;
    onClick?: (e: React.MouseEvent<any>) => void;
}

export const Button: React.FC<ButtonProps> = ({
                                                  type = 'button',
                                                  disabled,
                                                  ariaBusy,
                                                  children,
                                                  variant = 'primary',
                                                  ariaLabel,
                                                  onClick,
                                              }) => {
    const getGradient = () => {
        switch (variant) {
            case 'secondary':
                return 'linear-gradient(to right, #4B4B4B, #5A5A5A)';
            case 'danger-gradient':
                return 'linear-gradient(to right, #FF4B4B, #FF2E2E)';
            case 'primary':
            default:
                return 'linear-gradient(to right, #FF409A, #C438EF)';
        }
    };

    return (
        <button
            type={type}
            disabled={disabled}
            aria-busy={ariaBusy}
            aria-label={ariaLabel}
            onClick={onClick}
            style={{
                width: '100%',
                height: '48px',
                background: getGradient(),
                color: '#FFFFFF',
                fontFamily: 'Montserrat, sans-serif',
                fontSize: '16px',
                fontWeight: 600,
                borderRadius: '16px',
                border: 'none',
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.6 : 1,
                transition: 'opacity 0.2s, transform 0.2s',
                outline: 'none',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            }}
            onFocus={(e) => (e.currentTarget.style.outline = '2px solid #FF409A')}
            onBlur={(e) => (e.currentTarget.style.outline = 'none')}
            onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.97)')}
            onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
            {children}
        </button>
    );
};
