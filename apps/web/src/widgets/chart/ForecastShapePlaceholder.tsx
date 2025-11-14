'use client';

import React from 'react';

type ForecastShapePlaceholderProps = {
    className?: string;
};

export default function ForecastShapePlaceholder({ className }: ForecastShapePlaceholderProps) {
    return (
        <div className={className}>
            <div className="h-full w-full flex items-center justify-center">
                <span className="text-xs text-ink-muted">Forecast shape</span>
            </div>
        </div>
    );
}