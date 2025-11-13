'use client';
import React from 'react';

interface YAxisProps {
  width?: number;
  height?: number;
  className?: string;
}

export default function YAxis({ className = 'h-96 w-full' }: YAxisProps) {
  const priceLevels = [
    '6,500',
    '6,000',
    '5,500',
    '5,000',
    '4500',
    '4000',
    '3500',
    '3000',
    '2500',
    '2000',
  ];

  return (
    <div
      className={`flex flex-col items-end justify-between py-6 ${className}`}
    >
      {priceLevels.map((price, index) => (
        <span key={index} className="text-xs text-ink-tertiary">
          {price}
        </span>
      ))}
    </div>
  );
}
