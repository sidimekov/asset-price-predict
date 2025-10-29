'use client';
import React, { useState, useEffect } from 'react';
import { ProfileHeader } from '@/features/account/ProfileHeader';
import { ActionsList } from '@/features/account/ActionsList';

const AccountPage: React.FC = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // имитация загрузки API
    const timer = setTimeout(() => setLoading(false), 150);
    return () => clearTimeout(timer);
  }, []);

  const handleProfileClick = () => alert('Go to Account Settings');

  return (
    <main
      style={{
        padding: '40px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#17153B',
      }}
    >
      <div style={{ width: '100%', maxWidth: '600px' }}>
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
