'use client'

import React from 'react';





type ForecastPageProps = {
    params: {
        id: string;
    };
};

export default function ForecastPage({ params }: ForecastPageProps) {
    const { id } = params;

    return (
        <div className="min-h-screen bg-primary text-white px-8 pt-8 pb-32">
            <h1 className="text-2xl font-semibold">
                {id}
            </h1>
        </div>
    );
}