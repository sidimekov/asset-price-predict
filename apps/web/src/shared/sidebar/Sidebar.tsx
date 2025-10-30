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

  return (
    <>
      <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
        <div className="sidebar__content">
          {!collapsed && (
            <h1 className="sidebar__brand">
              <span className="brand-gradient">Asset</span>
              <span className="text-ink">Predict</span>
            </h1>
          )}

          {!collapsed && (
            <a href="/account" className="sidebar__profile">
              <img
                src={profile.avatarUrl}
                alt={`${profile.username} avatar`}
                className="sidebar__profile-avatar"
              />
              <div>
                <p className="sidebar__profile-name">{profile.username}</p>
                <p className="sidebar__profile-login">{profile.login}</p>
              </div>
            </a>
          )}

          <nav className="sidebar__nav">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <a
                  key={item.href}
                  href={item.href}
                  className={`sidebar__nav-link ${isActive ? 'active' : ''}`}
                >
                  {item.label}
                </a>
              );
            })}
          </nav>
        </div>
      </aside>

      <div
        className="sidebar-toggle"
        style={{
          left: collapsed ? '0' : 'calc(280px - 16px)',
        }}
        onClick={() => setCollapsed(!collapsed)}
      >
        <SidebarToggle collapsed={collapsed} setCollapsed={setCollapsed} />
      </div>
    </>
  );
};
