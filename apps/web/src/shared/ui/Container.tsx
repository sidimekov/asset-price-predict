import { ReactNode } from 'react';

interface ContainerProps {
    children: ReactNode;
}

export function Container({ children }: ContainerProps) {
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">{children}</div>
    );
}