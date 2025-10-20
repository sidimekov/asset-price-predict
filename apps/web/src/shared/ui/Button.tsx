import React from 'react';

interface ButtonProps {
    children: React.ReactNode;
    type?: 'button' | 'submit';
    disabled?: boolean;
    ariaBusy?: boolean;
    variant?: 'primary' | 'secondary' | 'danger';
    onClick?: (e: React.MouseEvent<any>) => void;
}

export const Button: React.FC<ButtonProps> = ({
                                                  children,
                                                  type = 'button',
                                                  disabled = false,
                                                  ariaBusy = false,
                                                  variant = 'primary',
                                                  onClick,
                                              }) => {
    const baseStyles = 'w-full p-2 rounded text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 transition-colors';
    const variantStyles = {
        primary: 'bg-gradient-to-r from-pink-500 to-purple-700 hover:from-pink-600 hover:to-purple-800',
        secondary: 'bg-gray-600 hover:bg-gray-700',
        danger: 'bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600',
    };

    return (
        <button
            type={type}
            disabled={disabled}
            className={`${baseStyles} ${variantStyles[variant]}`}
            aria-busy={ariaBusy}
            onClick={onClick}
        >
            {children}
        </button>
    );
};