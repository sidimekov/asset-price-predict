import React from 'react';

interface GradientCardProps {
    children: React.ReactNode;
}

export const GradientCard: React.FC<GradientCardProps> = ({ children }) => {
    return <div className="bg-gradient-to-br from-pink-500 to-purple-700 rounded-3xl shadow-soft p-6 text-white">{children}</div>;
};