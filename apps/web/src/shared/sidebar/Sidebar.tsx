'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { SidebarToggle } from '@/shared/sidebar/SidebarToggle';
import profile from '@/mocks/profile.json';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  setCollapsed,
}) => {
  const pathname = usePathname();

  const navItems = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/history', label: 'History' },
    { href: '/account', label: 'Account Settings' },
  ];

  const sidebarWidth = 280;
  const toggleWidth = 32;

  return (
    <>
      <aside
        style={{
          width: sidebarWidth,
          transform: collapsed
            ? `translateX(-${sidebarWidth}px)`
            : 'translateX(0)',
          backgroundColor: '#1C1740',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          padding: '16px',
          transition: 'transform 0.3s ease',
          borderRight: '1px solid rgba(255,255,255,0.1)',
          position: 'fixed',
          top: 0,
          left: 0,
          height: '100vh',
          overflow: 'hidden',
          zIndex: 1000,
        }}
      >
        <div style={{ width: '100%' }}>
          {!collapsed && (
            <h1
              style={{
                fontWeight: 800,
                fontSize: '28px',
                marginBottom: '24px',
                lineHeight: 1.1,
              }}
            >
              <span
                style={{
                  background: 'linear-gradient(90deg, #FF409A, #C438EF)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Asset
              </span>
              <span style={{ color: '#FFFFFF' }}>Predict</span>
            </h1>
          )}

          {!collapsed && (
            <a
              href="/account"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                marginBottom: '40px',
                textDecoration: 'none',
                cursor: 'pointer',
              }}
            >
              <img
                src={profile.avatarUrl}
                alt={`${profile.username} avatar`}
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                }}
              />
              <div>
                <p
                  style={{
                    color: '#FFFFFF',
                    fontWeight: 600,
                    fontSize: '16px',
                  }}
                >
                  {profile.username}
                </p>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px' }}>
                  {profile.login}
                </p>
              </div>
            </a>
          )}

          <nav
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              width: '100%',
            }}
          >
            {navItems.map((item) => {
              const isActive = pathname === item.href;

              return (
                <a
                  key={item.href}
                  href={item.href}
                  style={{
                    display: 'block',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    textDecoration: 'none',
                    fontWeight: 500,
                    fontSize: '15px',
                    background: 'transparent',
                    textAlign: 'left',
                    transition: 'all 0.2s ease',
                    color: isActive ? 'transparent' : 'rgba(255,255,255,0.9)',
                    backgroundImage: isActive
                      ? 'linear-gradient(90deg, #FF409A, #C438EF)'
                      : 'none',
                    WebkitBackgroundClip: isActive ? 'text' : 'initial',
                    WebkitTextFillColor: isActive ? 'transparent' : 'initial',
                  }}
                >
                  {item.label}
                </a>
              );
            })}
          </nav>
        </div>
      </aside>

      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: collapsed ? 0 : sidebarWidth - toggleWidth / 2,
          transform: 'translateY(-50%)',
          width: toggleWidth,
          height: 48,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#1C1740',
          borderTopRightRadius: '8px',
          borderBottomRightRadius: '8px',
          cursor: 'pointer',
          transition: 'left 0.3s ease',
          zIndex: 1100,
        }}
        onClick={() => setCollapsed(!collapsed)}
      >
        <SidebarToggle collapsed={collapsed} setCollapsed={setCollapsed} />
      </div>
    </>
  );
};
