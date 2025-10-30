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
        className="profile-header__avatar"
      />
      <div className="profile-header__text">
        <p className="profile-header__username">
          Username:{' '}
          <span className="profile-header__username">{profile.username}</span>
        </p>
        <p className="profile-header__login">Login: {profile.login}</p>
      </div>
    </div>
  );
};
