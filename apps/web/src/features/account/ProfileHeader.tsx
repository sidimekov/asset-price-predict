import React from 'react';
import profile from '@/mocks/profile.json';

export const ProfileHeader: React.FC = () => {
    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                gap: '24px',
                marginBottom: '40px',
                flexWrap: 'wrap',
            }}
        >
            <img
                src={profile.avatarUrl}
                alt={`${profile.username} avatar`}
                style={{
                    width: '128px',
                    height: '128px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                }}
            />
            <div>
                <p style={{ color: '#FFFFFF', fontWeight: 600, fontSize: '18px' }}>
                    Username:{' '}
                    <span style={{ color: 'rgba(255,255,255,0.9)' }}>{profile.username}</span>
                </p>
                <p style={{ color: 'rgba(255,255,255,0.6)', marginTop: '4px' }}>
                    Login: {profile.login}
                </p>
            </div>
        </div>
    );
};
