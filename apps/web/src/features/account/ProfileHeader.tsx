'use client';
import React from 'react';
import profile from '@/mocks/profile.json';
import Skeleton from '@/shared/ui/Skeleton';

interface ProfileHeaderProps {
  loading?: boolean;
  onClick?: () => void;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  loading = false,
  onClick,
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

  return (
    <div className="profile-header" onClick={onClick}>
      <img
        src={profile.avatarUrl}
        alt={`${profile.username} avatar`}
        className="profile-header-avatar"
      />
      <div className="profile-header-text">
        <p className="profile-header-username">
          Username:{' '}
          <span className="profile-header-username">{profile.username}</span>
        </p>
        <p className="profile-header-login">Login: {profile.login}</p>
      </div>
    </div>
  );
};
