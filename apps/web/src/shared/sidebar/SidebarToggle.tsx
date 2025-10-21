'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface SidebarToggleProps {
    collapsed: boolean;
    setCollapsed: (v: boolean) => void;
}

export const SidebarToggle: React.FC<SidebarToggleProps> = ({
                                                                collapsed,
                                                                setCollapsed,
                                                            }) => {
    return (
        <button
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            onClick={() => setCollapsed(!collapsed)}
            style={{
                position: 'absolute',
                right: '-12px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '28px',
                height: '48px',
                backgroundColor: '#2B2459',
                borderRadius: '8px 0 0 8px',
                border: '1px solid rgba(255,255,255,0.1)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                transition: 'background 0.2s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#3A3170')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#2B2459')}
        >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
    );
};
