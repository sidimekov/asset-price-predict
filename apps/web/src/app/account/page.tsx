import React from 'react';
import { ProfileHeader } from '@/features/account/ProfileHeader';
import { ActionsList } from '@/features/account/ActionsList';

const AccountPage: React.FC = () => {
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
                <ProfileHeader />
                <ActionsList />
            </div>
        </main>
    );
};

export default AccountPage;
