'use client';
import React from 'react';
import '../../app/globals.css';
import Skeleton from '@/shared/ui/Skeleton';

export type FactorRow = {
  name: string;
  impact?: string;
  shap?: string;
  conf?: string;
};

type State = 'idle' | 'loading' | 'empty' | 'ready';

interface FactorsTableProps {
  state: State;
  items?: FactorRow[];
}

export default function FactorsTable({ state, items }: FactorsTableProps) {
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

  const rows = items ?? [];

  if (!rows.length) {
    return (
      <div className="factors-table-container">
        <div className="no-factors">No factors yet</div>
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
            {rows.map((f, i) => (
              <tr key={`${f.name}-${i}`}>
                <td>{f.name}</td>
                <td>{f.impact ?? '—'}</td>
                <td>{f.shap ?? '—'}</td>
                <td>{f.conf ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
