'use client';
import React from 'react';
import { usePathname } from 'next/navigation';
import profile from '@/mocks/profile.json';

export const Sidebar: React.FC = () => {
  const pathname = usePathname();

  const navItems = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/history', label: 'History' },
    { href: '/account', label: 'Account Settings' },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-content">
        <h1 className="sidebar-brand">
          <span className="brand-gradient">Asset</span>
          <span className="text-ink">Predict</span>
        </h1>

        <a href="/account" className="sidebar-profile">
          <img
            src={profile.avatarUrl}
            alt={`${profile.username} avatar`}
            className="sidebar-profile-avatar"
          />
          <div>
            <p className="sidebar-profile-name">{profile.username}</p>
            <p className="sidebar-profile-login">{profile.login}</p>
          </div>
        </a>

        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <a
                key={item.href}
                href={item.href}
                className={`sidebar-nav-link ${isActive ? 'active' : ''}`}
              >
                {item.label}
              </a>
            );
          })}
        </nav>
      </div>
    </aside>
  );
};
