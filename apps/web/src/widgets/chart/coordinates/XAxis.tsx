'use client';
import React from 'react';

interface XAxisProps {
  width?: number;
  height?: number;
  className?: string;
  labels?: string[];
}

const defaultTimeLabels = [
  '6:00AM',
  '12:00AM',
  '6:00PM',
  '12:00PM',
  '6:00AM',
  '12:00AM',
  '6:00PM',
  '12:00PM',
  '6:00AM',
  '12:00AM',
];

export default function XAxis({
                                width = 800,
                                height = 40,
                                className = '',
                                labels = defaultTimeLabels,
                              }: XAxisProps) {
  return (
      <div
          className={`flex items-center justify-between px-12 ${className}`}
          style={{ width, height }}
      >
        {labels.map((label, index) => (
            <span key={index} className="text-xs text-ink-tertiary">
          {label}
        </span>
        ))}
      </div>
  );
}