import React from 'react';

interface ButtonProps {
    children: React.ReactNode;
    type?: 'button' | 'submit';
    disabled?: boolean;
    ariaBusy?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ children, type = 'button', disabled = false, ariaBusy = false }) => {
    return (
        <button
            type={type}
            disabled={disabled}
            className="w-full bg-gradient-to-r from-pink-500 to-purple-700 text-white p-2 rounded hover:from-pink-600 hover:to-purple-800 transition-colors"
            aria-busy={ariaBusy}
        >
            {children}
        </button>
    );
};