'use client';
import React, { useState, useEffect } from 'react';
import { ProfileHeader } from '@/features/account/ProfileHeader';
import { ActionsList } from '@/features/account/ActionsList';

const AccountPage: React.FC = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 150);
    return () => clearTimeout(timer);
  }, []);

  const handleProfileClick = () => alert('Go to Account Settings');

  return (
    <main className="account-content">
      <div className="max-w-md mx-auto space-y-8">
        <ProfileHeader loading={loading} onClick={handleProfileClick} />
        <ActionsList
          loading={loading}
          onClick={(label) => console.log(label)}
        />
      </div>
    </main>
  );
};

export default AccountPage;
