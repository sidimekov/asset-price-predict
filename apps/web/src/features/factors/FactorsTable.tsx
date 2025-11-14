'use client';
import React from 'react';
import mockFactors from '../../mocks/factors.json';
import '../../app/globals.css';
import Skeleton from '@/shared/ui/Skeleton';

type Factor = { name: string; impact: string; shap: string; conf: string };
type State = 'idle' | 'loading' | 'empty' | 'ready';

interface FactorsTableProps {
  state: State;
}

export default function FactorsTable({ state }: FactorsTableProps) {
  if (state === 'empty') {
    return (
      <div className="factors-table-container">
        <div className="no-factors">No factors yet</div>
      </div>
    );
  }

  if (state === 'loading') {
    return (
      <div className="factors-table-container">
        <div style={{ minWidth: '600px', backdropFilter: 'blur(10px)' }}>
          <table className="factors-table">
            <thead>
              <tr>
                <th>Factors</th>
                <th>Impact</th>
                <th>SHAP</th>
                <th>Conf.</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td>
                    <Skeleton width="80%" height="12px" />
                  </td>
                  <td>
                    <Skeleton width="60%" height="12px" />
                  </td>
                  <td>
                    <Skeleton width="50%" height="12px" />
                  </td>
                  <td>
                    <Skeleton width="40%" height="12px" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="factors-table-container">
      <div style={{ minWidth: '600px', backdropFilter: 'blur(10px)' }}>
        <table className="factors-table">
          <thead>
            <tr>
              <th>Factors</th>
              <th>Impact</th>
              <th>SHAP</th>
              <th>Conf.</th>
            </tr>
          </thead>
          <tbody>
            {mockFactors.map((f: Factor, i: number) => (
              <tr key={i}>
                <td>{f.name}</td>
                <td>{f.impact}</td>
                <td>{f.shap}</td>
                <td>{f.conf}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
