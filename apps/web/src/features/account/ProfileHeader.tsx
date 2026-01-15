'use client';

import React from 'react';
import Skeleton from '@/shared/ui/Skeleton';

interface ProfileHeaderProps {
  profile?: {
    avatarUrl?: string;
    username: string;
    login: string;
  };
  loading?: boolean;
  onClick?: () => void;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  profile,
  loading = false,
  onClick,
}) => {
  if (loading || !profile) {
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

  const { avatarUrl, username, login } = profile;

  return (
    <div className="profile-header" onClick={onClick}>
      <img
        src={avatarUrl || '/images/profile-avatar.png'}
        alt={`${username} avatar`}
        className="profile-header-avatar"
      />

      <div className="profile-header-text">
        <p className="profile-header-username">
          Username: <span className="profile-header-username">{username}</span>
        </p>
        <p className="profile-header-login">Login: {login}</p>
      </div>
    </div>
  );
};
