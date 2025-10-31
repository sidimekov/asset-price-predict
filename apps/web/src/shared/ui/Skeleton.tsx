import React from 'react';

interface SkeletonProps {
  width?: string;
  height?: string;
}

const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',

  height = '48px',
}) => {
  return (
    <div
      style={{
        width,
        height,
        backgroundColor: '#2A265F',
        borderRadius: '8px',
        animation: 'pulse 1.5s ease-in-out infinite',
      }}
    >
      <style>
        {`
          @keyframes pulse {
            0% { opacity: 0.5; }
            50% { opacity: 1; }
            100% { opacity: 0.5; }
          }
        `}
      </style>
    </div>
  );
};

export default Skeleton;
