'use client';

import React from 'react';
import Image from 'next/image';
import Skeleton from '@/shared/ui/Skeleton';

interface ProfileHeaderProps {
  loading?: boolean;
  onClick?: () => void;
  profile: {
    username?: string;
    email?: string;
    avatarUrl?: string;
  };
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  loading = false,
  onClick,
  profile,
}) => {
  if (loading) {
    return (
      <div className="profile-header">
        <Skeleton height="80px" />
      </div>
    );
  }

  const avatarSrc =
    profile.avatarUrl && profile.avatarUrl.trim()
      ? profile.avatarUrl
      : '/images/profile-avatar.png';

  return (
    <div
      className="profile-header cursor-pointer"
      onClick={onClick}
      role="button"
      tabIndex={0}
    >
      <Image
        src={avatarSrc}
        alt="Profile avatar"
        width={100}
        height={100}
        className="profile-avatar rounded-full "
        priority
      />
      <div className="profile-header-text">
        <p className="profile-header-username">
          Username:{' '}
          <span className="profile-header-username">
            {profile.username || '—'}
          </span>
        </p>
        <p className="profile-header-login">Email: {profile.email || '—'}</p>
      </div>
    </div>
  );
};
