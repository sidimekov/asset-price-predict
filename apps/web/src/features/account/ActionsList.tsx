'use client';

import React from 'react';
import { Button } from '@/shared/ui/Button';
import Skeleton from '@/shared/ui/Skeleton';

interface ActionsListProps {
  loading?: boolean;
  onClick?: (label: string) => void;
}

export const ActionsList: React.FC<ActionsListProps> = ({
  loading = false,
  onClick,
}) => {
  const actions = [
    'Edit photo',
    'Change password',
    'Change username',
    'Change login',
  ];

  const handleClick = (label: string) => (e: React.MouseEvent<any>) => {
    e.preventDefault();
    if (!loading) {
      alert(`${label} — Not implemented`);
      onClick?.(label);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        width: '320px',
      }}
    >
      {loading
        ? actions.map((_, idx) => <Skeleton key={idx} height="48px" />)
        : actions.map((label) => (
            <Button key={label} onClick={handleClick(label)} aria-busy={false}>
              {label}
            </Button>
          ))}

      {loading ? (
        <Skeleton height="48px" />
      ) : (
        <Button
          onClick={handleClick('Log out')}
          variant="danger"
          aria-busy={false}
        >
          Log out
        </Button>
      )}
    </div>
  );
};
