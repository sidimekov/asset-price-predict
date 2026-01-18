'use client';

import React from 'react';

export type SegmentedOption<T extends string> = {
  value: T;
  label: string;
};

export type SegmentedControlProps<T extends string> = {
  value: T;
  options: SegmentedOption<T>[];
  onChange: (value: T) => void;
  size?: 'sm' | 'md';
};

export default function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
  size = 'sm',
}: SegmentedControlProps<T>) {
  return (
    <div className={`segmented-control segmented-${size}`}>
      {options.map((option) => {
        const isActive = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            className={`segmented-option ${
              isActive ? 'segmented-option-active' : ''
            }`}
            onClick={() => onChange(option.value)}
            aria-pressed={isActive}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
