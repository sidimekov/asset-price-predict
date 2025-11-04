'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/shared/ui/Button';

interface MainBannerProps {
  onLearnMore: () => void;
}

export const MainBanner: React.FC<MainBannerProps> = ({ onLearnMore }) => {
  const router = useRouter();

  return (
    <div className="flex flex-col justify-center min-h-[60vh] gap-8 text-left px-8 max-w-xl">
      <h1 className="text-3xl md:text-4xl lg:text-5xl font-medium leading-snug ">
        Here you can find out
        <br className="hidden md:block" />
        the forecast of time
        <br className="hidden md:block" />
        series of asset prices
      </h1>

      <div className="flex flex-row gap-6 mt-8">
        <Button
          onClick={() => router.push('/auth?tab=signup')}
          variant="primary"
        >
          get started
        </Button>
        <Button onClick={onLearnMore} variant="primary">
          learn more
        </Button>
      </div>
    </div>
  );
};
