'use client';

import { Menu } from 'lucide-react';

interface HeaderProps {
    onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
    return (
        <header className="bg-surface-dark border-b border-white/10 px-6 py-4 lg:hidden">
            <button
                onClick={onMenuClick}
                className="text-ink focus:outline-none focus:ring-2 focus:ring-accent rounded-md p-1"
                aria-label="Открыть меню"
            >
                <Menu size={24} />
            </button>
        </header>
    );
}