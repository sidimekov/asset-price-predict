import React from 'react';

interface GradientCardProps {
    children: React.ReactNode;
    className?: string;
}

export const GradientCard: React.FC<GradientCardProps> = ({ children, className = '' }) => {
    return <div className={`gradient-card ${className}`}>{children}</div>;
};