import React from 'react';

interface ButtonProps {
    type?: 'submit' | 'button';
    disabled?: boolean;
    ariaBusy?: boolean;
    children: React.ReactNode;
    variant?: 'primary' | 'danger';
    onClick?: (e: React.MouseEvent<any>) => void;
}

export const Button: React.FC<ButtonProps> = ({
                                                  type = 'button',
                                                  disabled,
                                                  ariaBusy,
                                                  children,
                                                  variant = 'primary',
                                                  onClick,
                                              }) => {
    const baseStyle: React.CSSProperties = {
        width: '100%',
        height: '48px',
        background:
            variant === 'danger'
                ? 'linear-gradient(to right, #FF0000, #FF4D4D)'
                : 'linear-gradient(to right, #FF409A, #C438EF)',
        color: '#FFFFFF',
        fontFamily: 'Montserrat, sans-serif',
        fontSize: '16px',
        fontWeight: 600,
        borderRadius: '16px',
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'all 0.2s ease',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        outline: 'none',
    };

    const handleFocus = (e: React.FocusEvent<any>) => {
        e.currentTarget.style.boxShadow =
            '0 0 0 3px rgba(255, 64, 154, 0.7), 0 2px 8px rgba(0,0,0,0.15)';
    };

    const handleBlur = (e: React.FocusEvent<any>) => {
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
    };

    const handleMouseDown = (e: React.MouseEvent<any>) => {
        e.currentTarget.style.transform = 'scale(0.97)';
    };

    const handleMouseUp = (e: React.MouseEvent<any>) => {
        e.currentTarget.style.transform = 'scale(1)';
    };

    const handleMouseEnter = (e: React.MouseEvent<any>) => {
        e.currentTarget.style.opacity = '0.9';
    };

    const handleMouseLeave = (e: React.MouseEvent<any>) => {
        e.currentTarget.style.opacity = disabled ? '0.5' : '1';
    };

    return (
        <button
            type={type}
            disabled={disabled}
            aria-busy={ariaBusy}
            style={baseStyle}
            onClick={onClick}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {children}
        </button>
    );
};
