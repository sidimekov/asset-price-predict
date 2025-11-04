import React from 'react';
import Image from 'next/image';

export const Illustration: React.FC = () => {
  return (
    <div className="w-full flex justify-center md:justify-end px-8">
      <Image
        src="/images/figure.png"
        alt="Ethereum Illustration"
        width={450}
        height={450}
        className="max-w-full h-auto md:max-w-md"
        priority
      />
    </div>
  );
};
