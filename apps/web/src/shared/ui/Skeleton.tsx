import React from 'react';

interface SkeletonProps {
    width?: string;
    height?: string;
}

const Skeleton: React.FC<SkeletonProps> = ({ width = '100%', height = '3rem' }) => {
    return <div className="skeleton" style={{ width, height }} />;
};

export default Skeleton;