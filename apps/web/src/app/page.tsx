'use client';

import React, { useState } from 'react';
import { TopBar } from '@/features/landing/TopBar';
import { MainBanner } from '@/features/landing/MainBanner';
import { Illustration } from '@/features/landing/Illustration';
import { MoreInfo } from '@/features/landing/MoreInfo';

export default function WelcomePage() {
  const [showInfo, setShowInfo] = useState(false);

  return (
      <div className="bg-primary min-h-screen flex flex-col text-white">
        <header className="pt-6 pb-4 px-6">
          <TopBar />
        </header>

        <main className="flex-1 flex flex-col md:flex-row justify-center items-center px-6 md:px-20 gap-12">
          <div className="flex-1 w-full">
            <MainBanner onLearnMore={() => setShowInfo(!showInfo)} />
          </div>
          <div className="flex-1 w-full md:flex md:justify-end">
            <Illustration />
          </div>
        </main>

        {showInfo && (
            <div className="flex px-8 pb-10 md:pb-10">
              <MoreInfo />
            </div>
        )}
        {showInfo && <div className="h-8 md:h-16 lg:h-24"></div>}
      </div>
  );
}
