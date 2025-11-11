'use client';
import React from 'react';
import mockFactors from '../../mocks/factors.json';
import '../../app/globals.css';
import Skeleton from '../../shared/ui/Skeleton';

type Factor = { name: string; impact: string; shap: string; conf: string };
type State = 'idle' | 'loading' | 'empty' | 'ready';

interface FactorsTableProps {
  state: State;
}

export default function FactorsTable({ state }: FactorsTableProps) {
  if (state === 'empty') {
    return <div className="p-4 text-gray-500">No factors yet</div>;
  }

  if (state === 'loading') {
    // шапка остаётся как есть, строки — ровные placeholders
    return (
      <div className="p-4">
        <table className="w-120 absolute left-210 top-176">
          <thead>
            <tr className="w-120 gradient-header h-12 text-left">
              <th className="w-30">Factors</th>
              <th className="w-30">Impact</th>
              <th className="w-30">SHAP</th>
              <th className="w-30">Conf.</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="table-row h-12">
                <td className="skeleton-cell">
                  <Skeleton width="80%" height="12px" />
                </td>
                <td className="skeleton-cell">
                  <Skeleton width="60%" height="12px" />
                </td>
                <td className="skeleton-cell">
                  <Skeleton width="50%" height="12px" />
                </td>
                <td className="skeleton-cell">
                  <Skeleton width="40%" height="12px" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="p-4">
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
          {mockFactors.map((f: Factor, i: number) => (
            <tr key={i} className="table-row text-left left-5px h-12">
              <td>{f.name}</td>
              <td>{f.impact}</td>
              <td>{f.shap}</td>
              <td>{f.conf}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
