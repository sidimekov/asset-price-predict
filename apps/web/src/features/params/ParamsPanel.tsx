'use client';
import React from 'react';

// Определение типов
type ParamsState = 'idle' | 'loading'| 'error' | 'success';

interface ParamsPanelProps {
    state: ParamsState;
}

export default function ParamsPanel({ state }: ParamsPanelProps) {
    const renderContent = () => {
        if (state === 'loading') return <div className="h-32 rounded" />;
        if (state === 'error') return <p className="text-red-500">Error loading parameters</p>;

        const getTodayDate = () => {
            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0'); // Месяцы с 0
            const day = String(today.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        return (
            <div className="absolute top-176 left-103 w-80">
                <p className="text-[#8480C9]">Parameters</p>
                <br/>
                <select className="appearance-none text-center param-panel-item w-80 h-12 pl-4">
                    <option className="text-center">Select predict model</option>
                </select>
                <br/>
                <br/>
                <input type="date" className="text-center param-panel-item w-80 h-12 pl-4" defaultValue={getTodayDate()} />
                <br/>
                <br/>
                <button className="relative left-10 gradient-button w-60 h-12 ">Predict</button>

            </div>
        );
    };

    return <div className="p-4 rounded">{renderContent()}</div>;
}