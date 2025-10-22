import React from 'react';
import profile from '@/mocks/profile.json';
import Skeleton from '@/shared/ui/Skeleton';

interface ProfileHeaderProps {
    loading?: boolean,
    onClick?: () => void
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({loading = false, onClick}) => {
    if (loading) {
        return (
            <div
                style={{
                    display: 'flex',
                    gap: '24px',
                    marginBottom: '40px',
                    flexWrap: 'wrap',
                }}
            >
                {/* Skeleton для аватара */}
                <Skeleton width="128px" height="128px"/>

                {/* Skeleton для текста */}
                <div style={{display: 'flex', flexDirection: 'column', gap: '8px', flex: 1}}>
                    <Skeleton width="200px" height="24px"/>
                    <Skeleton width="150px" height="18px"/>
                </div>
            </div>
        );
    }

    return (
        <div
            style={{
                display: 'flex',
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
                <p style={{color: '#FFFFFF', fontWeight: 600, fontSize: '18px'}}>
                    Username: <span style={{color: 'rgba(255,255,255,0.9)'}}>{profile.username}</span>
                </p>
                <p style={{color: 'rgba(255,255,255,0.6)', marginTop: '4px'}}>
                    Login: {profile.login}
                </p>
            </div>
        </div>
    );
};
