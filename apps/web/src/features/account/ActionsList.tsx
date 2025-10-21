"use client";

import React from 'react';
import { Button } from '@/shared/ui/Button';

export const ActionsList: React.FC = () => {
    const handleClick = (label: string) => (e: React.MouseEvent<any>) => {
        e.preventDefault();
        alert(`${label} — Not implemented`);
    };

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                width: '320px',
            }}
        >
            <Button ariaLabel="Edit photo" onClick={handleClick('Edit photo')}>
                Edit photo
            </Button>
            <Button ariaLabel="Change password" onClick={handleClick('Change password')}>
                Change password
            </Button>
            <Button ariaLabel="Change username" onClick={handleClick('Change username')}>
                Change username
            </Button>
            <Button ariaLabel="Change login" onClick={handleClick('Change login')}>
                Change login
            </Button>
            <Button
                variant="danger-gradient"
                ariaLabel="Log out"
                onClick={handleClick('Log out')}
            >
                Log out
            </Button>
        </div>
    );
};
