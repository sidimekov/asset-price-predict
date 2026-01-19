'use client';
import React from 'react';
import type { AccountRes } from '@assetpredict/shared';
import Skeleton from '@/shared/ui/Skeleton';

interface ProfileHeaderProps {
  loading?: boolean;
  onClick?: () => void;
  profile?: AccountRes | null;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  loading = false,
  onClick,
  profile,
}) => {
  if (loading) {
    return (
      <div className="profile-header">
        <Skeleton width="128px" height="128px" />
        <div className="profile-header__text">
          <Skeleton width="200px" height="24px" />
          <Skeleton width="150px" height="18px" />
        </div>
      </div>
    );
  }

  const avatarUrl = profile?.avatarUrl ?? '/images/profile-avatar.png';
  const username = profile?.username ?? 'Unknown user';
  const email = profile?.email ?? '';

  return (
    <div className="profile-header" onClick={onClick}>
      <img
        src={avatarUrl}
        alt={`${username} avatar`}
        className="profile-header-avatar"
      />
      <div className="profile-header-text">
        <p className="profile-header-username">
          Username: <span className="profile-header-username">{username}</span>
        </p>
        <p className="profile-header-login">Email: {email}</p>
      </div>
    </div>
  );
};
