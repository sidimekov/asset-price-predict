import React from 'react';

interface GradientCardProps {
    children: React.ReactNode;
    style?: React.CSSProperties;
}

export const GradientCard: React.FC<GradientCardProps> = ({ children, style }) => {
    return (
        <div
            style={{
                background: 'linear-gradient(135deg, #FF409A, #C438EF, #201D47)',
                borderRadius: '32px',
                boxShadow: '0 4px 10px rgba(0, 0, 0, 0.2)',
                padding: '24px',
                ...style,
            }}
        >
            {children}
        </div>
    );
};