'use client';

import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import React from 'react';
import './globals.css';
import { Sidebar } from '@/shared/ui/Sidebar';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isAuthenticated = true;

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        style={{
          display: 'flex',
          minHeight: '100vh',
          overflow: 'hidden',
          backgroundColor: '#17153B',
          color: '#FFFFFF',
          fontFamily: 'Montserrat, sans-serif',
        }}
      >
        {isAuthenticated && <Sidebar />}
        <main
          style={{
            flex: 1,
            padding: '40px',
            overflowY: 'auto',
          }}
        >
          {children}
        </main>
      </body>
    </html>
  );
}
