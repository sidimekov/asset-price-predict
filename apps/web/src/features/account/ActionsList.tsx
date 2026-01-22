'use client';

import React from 'react';
import { Button } from '@/shared/ui/Button';
import Skeleton from '@/shared/ui/Skeleton';

interface ActionsListProps {
  loading?: boolean;
  onAction: (action: 'avatar' | 'password' | 'username' | 'email') => void;
  onLogout?: () => void;
}

export const ActionsList: React.FC<ActionsListProps> = ({
  loading = false,
  onAction,
  onLogout,
}) => {
  if (loading) {
    return (
      <div className="actions-list space-y-2">
        <Skeleton height="48px" />
        <Skeleton height="48px" />
        <Skeleton height="48px" />
        <Skeleton height="48px" />
        <Skeleton height="48px" />
      </div>
    );
  }

  return (
    <div className="actions-list space-y-2">
      <Button onClick={() => onAction('avatar')}>Change photo</Button>
      <Button onClick={() => onAction('password')}>Change password</Button>
      <Button onClick={() => onAction('username')}>Change username</Button>
      <Button onClick={() => onAction('email')}>Change email</Button>

      <Button onClick={onLogout} variant="danger">
        Log out
      </Button>
    </div>
  );
};
