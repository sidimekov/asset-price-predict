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
            <Button onClick={handleClick('Edit photo')} aria-busy={false}>
                Edit photo
            </Button>

            <Button onClick={handleClick('Change password')} aria-busy={false}>
                Change password
            </Button>

            <Button onClick={handleClick('Change username')} aria-busy={false}>
                Change username
            </Button>

            <Button onClick={handleClick('Change login')} aria-busy={false}>
                Change login
            </Button>

            <Button
                onClick={handleClick('Log out')}
                variant="danger"
                aria-busy={false}
            >
                Log out
            </Button>
        </div>
    );
};
