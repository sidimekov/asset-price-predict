import React from 'react';

interface ButtonProps {
  type?: 'submit' | 'button';
  disabled?: boolean;
  ariaBusy?: boolean;
  children: React.ReactNode;
  variant?: 'primary' | 'danger';
  onClick?: (e: React.MouseEvent) => void;
}

export const Button: React.FC<ButtonProps> = ({
  type = 'button',
  disabled,
  ariaBusy,
  children,
  variant = 'primary',
  onClick,
}) => {
  return (
    <button
      type={type}
      disabled={disabled}
      aria-busy={ariaBusy}
      onClick={onClick}
      className={`btn ${variant === 'danger' ? 'btn-danger' : 'btn-primary'}`}
    >
      {children}
    </button>
  );
};
