'use client';

import React from 'react';
import { Button } from '@/shared/ui/Button';
import Skeleton from '@/shared/ui/Skeleton';

interface ActionsListProps {
  loading?: boolean;
  onClick?: (label: string) => void;
  onLogout?: () => void;
}

const ACTIONS = [
  'Edit photo',
  'Change password',
  'Change username',
  'Change email',
] as const;

export const ActionsList: React.FC<ActionsListProps> = ({
  loading = false,
  onClick,
  onLogout,
}) => {
  const handleClick = (label: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    if (loading) return;
    onClick?.(label);
  };

  return (
    <div className="actions-list">
      {loading
        ? ACTIONS.map((_, idx) => <Skeleton key={idx} height="48px" />)
        : ACTIONS.map((label) => (
            <Button key={label} onClick={handleClick(label)}>
              {label}
            </Button>
          ))}

      {loading ? (
        <Skeleton height="48px" />
      ) : (
        <Button onClick={onLogout} variant="danger">
          Log out
        </Button>
      )}
    </div>
  );
};
