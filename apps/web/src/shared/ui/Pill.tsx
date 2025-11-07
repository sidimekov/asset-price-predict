'use client';
import React, { useState } from 'react';

interface PillProps {
    label?: string; // Сделали label опциональным
    variant?: 'selected' | 'unselected' | 'add-asset';
    isSkeleton?: boolean;
    onClick?: () => void; // Оставляем для совместимости
}

export default function Pill({ label, variant = 'selected', isSkeleton = false, onClick }: PillProps) {
    const [localVariant, setLocalVariant] = useState(variant); // Локальное состояние для variant

    const handleClick = () => {
        if (localVariant === 'unselected') {
            setLocalVariant('selected'); // Переключаем только с unselected на selected
        }
        if (localVariant === 'selected') {
            setLocalVariant('unselected');
        }
        if (onClick) onClick(); // Вызываем внешний onClick, если есть
    };

    if (isSkeleton) return <div className="w-24 h-8 bg-gray-700 rounded-full animate-pulse" />;
    return (
        <button
            className={`pill ${localVariant === 'selected' ? 'selected-pill' : localVariant === 'unselected' ? 'unselected-pill' : 'add-asset-pill'}`}
            onClick={handleClick}
        >
            {label}
        </button>
    );
}