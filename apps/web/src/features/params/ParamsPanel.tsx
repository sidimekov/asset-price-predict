'use client';
import React from 'react';
import Skeleton from '../../shared/ui/Skeleton';

// Определение типов
type ParamsState = 'idle' | 'loading' | 'error' | 'success';

interface ParamsPanelProps {
  state: ParamsState;
}

export default function ParamsPanel({ state }: ParamsPanelProps) {
  const renderContent = () => {
    if (state === 'loading') {
      // ❗ структура та же: те же <br/>, те же размеры; уменьшаем визуальный зазор через -mt
      return (
        <div className="absolute top-176 left-103 w-80">
          <p className="text-[#8480C9]">Parameters</p>
          <br />
          {/* select placeholder */}
          <div className="param-panel-item w-80 h-12 pl-4 rounded overflow-hidden relative -mt-2">
            <Skeleton width="100%" height="100%" />
          </div>
          <br />
          <br />
          {/* date input placeholder */}
          <div className="param-panel-item w-80 h-12 pl-4 rounded overflow-hidden relative -mt-2">
            <Skeleton width="100%" height="100%" />
          </div>
          <br />
          <br />
          {/* button placeholder */}
          <div className="relative left-10 gradient-button w-60 h-12 rounded overflow-hidden -mt-2">
            <Skeleton width="100%" height="100%" />
          </div>
        </div>
      );
    }

    if (state === 'error')
      return <p className="text-red-500">Error loading parameters</p>;

    const getTodayDate = () => {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    return (
      <div className="absolute top-176 left-103 w-80">
        <p className="text-[#8480C9]">Parameters</p>
        <br />
        <select className="appearance-none text-center param-panel-item w-80 h-12 pl-4">
          <option className="text-center">Select predict model</option>
        </select>
        <br />
        <br />
        <input
          type="date"
          className="text-center param-panel-item w-80 h-12 pl-4"
          defaultValue={getTodayDate()}
        />
        <br />
        <br />
        <button className="relative left-10 gradient-button w-60 h-12">
          Predict
        </button>
      </div>
    );
  };

  return <div className="p-4 rounded">{renderContent()}</div>;
}
