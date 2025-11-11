'use client';
import React from 'react';
import mockFactors from '../../mocks/factors.json';
import '../../app/globals.css';

type Factor = {
  name: string;
  impact: string;
  shap: string;
  conf: string;
};

type State = 'idle' | 'loading' | 'empty' | 'ready';

interface FactorsTableProps {
  state: State;
  // Убрано setState, так как оно не используется
}

export default function FactorsTable({ state }: FactorsTableProps) {
  const renderContent = () => {
    if (state === 'empty')
      return <p className="text-gray-500">No factors yet</p>;
    if (state === 'loading')
      return Array(5)
        .fill(null)
        .map(
          (
            _,
            i: number, // Явно указываем тип i и начальное значение
          ) => (
            <div key={i} className="flex space-x-4 mb-2">
              <div className="w-1/4 h-4 bg-gray-700 rounded" />
              <div className="w-1/4 h-4 bg-gray-700 rounded" />
              <div className="w-1/4 h-4 bg-gray-700 rounded" />
              <div className="w-1/4 h-4 bg-gray-700 rounded" />
            </div>
          ),
        );
    return (
      <table className="w-120 absolute left-210 top-176">
        <thead>
          <tr className="w-120 gradient-header high-12px h-12 text-left">
            <th className="w-30">Factors</th>
            <th className="w-30">Impact</th>
            <th className="w-30">SHAP</th>
            <th className="w-30">Conf.</th>
          </tr>
        </thead>

        <tbody className="text-[#8480C9]">
          {mockFactors.map((factor: Factor, i: number) => (
            <tr key={i} className="table-row text-left left-5px h-12">
              <td>{factor.name}</td>
              <td>{factor.impact}</td>
              <td>{factor.shap}</td>
              <td>{factor.conf}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  return <div className="p-4">{renderContent()}</div>;
}
