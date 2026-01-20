// apps/web/src/shared/ui/Sidebar.tsx
'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useGetMeQuery } from '@/shared/api/account.api';

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const token =
    typeof localStorage === 'undefined'
      ? null
      : localStorage.getItem('auth.token');
  const { data: profile } = useGetMeQuery(undefined, { skip: !token });
  const avatarUrl = profile?.avatarUrl ?? '/images/profile-avatar.png';
  const username = profile?.username ?? 'Account';
  const email = profile?.email ?? '';

  const navItems = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/history', label: 'History' },
    { href: '/account', label: 'Account Settings' },
  ];

  // Скелетон при загрузке
  if (loading || !profile) {
    return (
      <aside
        className="sidebar"
        aria-label="Боковая панель"
        role="complementary"
      >
        <div className="sidebar-content">
          <h1 className="sidebar-brand">
            <span className="brand-gradient">Asset</span>
            <span className="text-ink">Predict</span>
          </h1>

          <div className="sidebar-profile">
            <div className="sidebar-profile-avatar skeleton"></div>
            <div>
              <p className="sidebar-profile-name skeleton-text"></p>
              <p className="sidebar-profile-login skeleton-text"></p>
            </div>
          </div>

          <nav
            className="sidebar-nav"
            aria-label="Основная навигация"
            role="navigation"
          >
            {navItems.map((item) => (
              <div
                key={item.href}
                className="sidebar-nav-link skeleton-text"
              ></div>
            ))}
          </nav>
        </div>
      </aside>
    );
  }

  return (
    <aside className="sidebar" aria-label="Боковая панель" role="complementary">
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
            src={avatarUrl}
            alt="Profile avatar"
            width={64}
            height={64}
            className="sidebar-profile-avatar"
          />
          <div>
            <p className="sidebar-profile-name">{username}</p>
            <p className="sidebar-profile-login">{email}</p>
          </div>
        </Link>

        <nav
          className="sidebar-nav"
          aria-label="Основная навигация"
          role="navigation"
        >
          {navItems.map((item) => {
            const isActive =
              item.href === '/dashboard'
                ? pathname === '/dashboard' ||
                  (pathname && pathname.startsWith('/forecast'))
                : pathname === item.href;

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
