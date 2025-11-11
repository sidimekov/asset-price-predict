import React from 'react';

type State = 'idle' | 'loading' | 'empty' | 'ready';

interface CandlesChartPlaceholderProps {
  state: State;
}

export default function CandlesChartPlaceholder({
  state,
}: CandlesChartPlaceholderProps) {
  const renderContent = () => {
    if (state === 'empty')
      return <p className="text-gray-500">Select or add asset to view chart</p>;
    if (state === 'loading')
      return <div className="h-64 bg-gray-700 rounded" />;
    return (
      <div className="h-93 w-225 absolute left-110 top-52 chart-container rounded">
        Chart Placeholder
      </div>
    ); // Mock chart
  };

  return <div className="w-full">{renderContent()}</div>;
}
