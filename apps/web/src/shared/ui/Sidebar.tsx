'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import profile from '@/mocks/profile.json';

export const Sidebar: React.FC = () => {
  const pathname = usePathname();

  const navItems = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/history', label: 'History' },
    { href: '/account', label: 'Account Settings' },
  ];

  return (
    <aside className="sidebar" aria-label="Боковая панель">
      <div className="sidebar-content">
        <h1 className="sidebar-brand">
          <span className="brand-gradient">Asset</span>
          <span className="text-ink">Predict</span>
        </h1>

        <Link
          href="/account"
          className="sidebar-profile"
          aria-label="Перейти в профиль"
        >
          <Image
            src={profile.avatarUrl}
            alt=""
            width={64}
            height={64}
            className="sidebar-profile-avatar"
          />
          <div>
            <p className="sidebar-profile-name">{profile.username}</p>
            <p className="sidebar-profile-login">{profile.login}</p>
          </div>
        </Link>

        <nav className="sidebar-nav" aria-label="Основная навигация">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`sidebar-nav-link ${isActive ? 'active' : ''}`}
                aria-current={isActive ? 'page' : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
};
